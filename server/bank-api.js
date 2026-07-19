import { createServer } from "node:http";
import { createSign, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PORT = Number(process.env.BANK_API_PORT || 8787);
const API_BASE = "https://api.enablebanking.com";
const APPLICATION_ID = process.env.ENABLE_BANKING_APPLICATION_ID;
const PRIVATE_KEY_PATH = process.env.ENABLE_BANKING_PRIVATE_KEY_PATH;
const APP_URL = process.env.APP_URL || "https://localhost:5173";
const pendingConnections = new Map();
const SUPPORTED_BANKS = {
  "la-banque-postale": ["la banque postale", "banque postale"],
  boursobank: ["boursobank", "boursorama"],
};

let privateKey = null;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error("Requête trop volumineuse");
    chunks.push(chunk);
  }

  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function getPrivateKey() {
  if (!APPLICATION_ID || !PRIVATE_KEY_PATH) {
    throw new Error(
      "ENABLE_BANKING_APPLICATION_ID et ENABLE_BANKING_PRIVATE_KEY_PATH ne sont pas configurés"
    );
  }

  if (!privateKey) {
    privateKey = await readFile(resolve(PRIVATE_KEY_PATH), "utf8");
  }

  return privateKey;
}

async function createJwt() {
  const key = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(
    JSON.stringify({ typ: "JWT", alg: "RS256", kid: APPLICATION_ID })
  );
  const payload = base64Url(
    JSON.stringify({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(unsignedToken)
    .end()
    .sign(key, "base64url");

  return `${unsignedToken}.${signature}`;
}

async function enableBankingRequest(path, options = {}) {
  const jwt = await createJwt();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Enable Banking a renvoyé une réponse invalide");
    }
  }

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg).join(", ")
      : data.detail;
    throw new Error(detail || data.message || "Erreur Enable Banking");
  }

  return data;
}

function normalizeBankName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function resolveBankName(bankId) {
  const aliases = SUPPORTED_BANKS[bankId];
  if (!aliases) throw new Error("Banque non prise en charge");

  const data = await enableBankingRequest(
    "/aspsps?country=FR&psu_type=personal&service=AIS"
  );
  const bank = (data.aspsps || []).find((aspsp) => {
    const normalizedName = normalizeBankName(aspsp.name);
    return aliases.some((alias) => normalizedName.includes(alias));
  });

  if (!bank) {
    throw new Error("Cette banque n’est pas disponible actuellement chez Enable Banking");
  }

  return bank.name;
}

async function createConnection(sourceId, bankId) {
  const bankName = await resolveBankName(bankId);

  const state = randomUUID();
  const redirectUrl = new URL("/bank-callback", APP_URL);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 89);

  const authorization = await enableBankingRequest("/auth", {
    method: "POST",
    body: JSON.stringify({
      access: { valid_until: validUntil.toISOString() },
      aspsp: { name: bankName, country: "FR" },
      state,
      redirect_url: redirectUrl.toString(),
      psu_type: "personal",
      language: "fr",
    }),
  });

  pendingConnections.set(state, { sourceId, bankId, createdAt: Date.now() });
  return { state, link: authorization.url };
}

function normalizeBalance(accountId, account, payload) {
  const balances = payload.balances || [];
  const preferred =
    balances.find((item) => item.balance_type === "CLAV") ||
    balances.find((item) => item.balance_type === "CLBD") ||
    balances[0];
  const iban = account.account_id?.iban || null;

  return {
    accountId,
    balance: preferred?.balance_amount
      ? Number(preferred.balance_amount.amount)
      : null,
    currency:
      preferred?.balance_amount?.currency || account.currency || "EUR",
    name: account.name || account.product || "Compte bancaire",
    accountTypeCode: account.cash_account_type || null,
    iban,
  };
}

async function completeConnection(code, state) {
  const pending = pendingConnections.get(state);
  if (!pending || Date.now() - pending.createdAt > 15 * 60 * 1000) {
    throw new Error("La demande de connexion a expiré. Relance la connexion.");
  }

  const session = await enableBankingRequest("/sessions", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  const accounts = await Promise.all(
    (session.accounts || []).map(async (account) => {
      const accountId = account.uid;
      const balances = await enableBankingRequest(
        `/accounts/${encodeURIComponent(accountId)}/balances`
      );
      return normalizeBalance(accountId, account, balances);
    })
  );

  pendingConnections.delete(state);
  return {
    sourceId: pending.sourceId,
    sessionId: session.session_id,
    accounts,
  };
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/bank/health") {
      return sendJson(response, 200, {
        provider: "enable-banking",
        configured: Boolean(APPLICATION_ID && PRIVATE_KEY_PATH),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/bank/connect") {
      const body = await readJson(request);
      if (
        typeof body.sourceId !== "string" ||
        body.sourceId.length > 100 ||
        typeof body.bankId !== "string"
      ) {
        return sendJson(response, 400, { error: "Source bancaire invalide" });
      }
      return sendJson(
        response,
        200,
        await createConnection(body.sourceId, body.bankId)
      );
    }

    if (request.method === "POST" && url.pathname === "/api/bank/callback") {
      const body = await readJson(request);
      if (typeof body.code !== "string" || typeof body.state !== "string") {
        return sendJson(response, 400, { error: "Retour bancaire invalide" });
      }
      return sendJson(
        response,
        200,
        await completeConnection(body.code, body.state)
      );
    }

    return sendJson(response, 404, { error: "Route introuvable" });
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, { error: error.message || "Erreur interne" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Bank API (Enable Banking) sur http://127.0.0.1:${PORT}`);
});
