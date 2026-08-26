import { createServer } from "node:http";
import { createSign, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PORT = Number(process.env.BANK_API_PORT || 8787);
const API_BASE = "https://api.enablebanking.com";
const APPLICATION_ID = process.env.ENABLE_BANKING_APPLICATION_ID;
const PRIVATE_KEY_PATH = process.env.ENABLE_BANKING_PRIVATE_KEY_PATH;
const APP_URL = process.env.APP_URL || "https://localhost:5173";
const COINBASE_CREDENTIALS_PATH = process.env.COINBASE_CREDENTIALS_PATH;
const pendingConnections = new Map();
const SUPPORTED_BANKS = {
  "la-banque-postale": ["la banque postale", "banque postale"],
  boursobank: ["boursobank", "boursorama"],
};

let privateKey = null;
let coinbaseCredentials = null;

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

async function getCoinbaseCredentials() {
  if (!COINBASE_CREDENTIALS_PATH) {
    throw new Error("COINBASE_CREDENTIALS_PATH n’est pas configuré");
  }
  if (!coinbaseCredentials) {
    const file = await readFile(resolve(COINBASE_CREDENTIALS_PATH), "utf8");
    const credentials = JSON.parse(file);
    if (!credentials.name || !credentials.privateKey) {
      throw new Error("Le fichier de clé Coinbase est invalide");
    }
    coinbaseCredentials = credentials;
  }
  return coinbaseCredentials;
}

async function createCoinbaseJwt(method, path) {
  const { name, privateKey: key } = await getCoinbaseCredentials();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({
    alg: "ES256",
    typ: "JWT",
    kid: name,
    nonce: randomBytes(16).toString("hex"),
  }));
  const payload = base64Url(JSON.stringify({
    iss: "cdp",
    nbf: now,
    exp: now + 120,
    sub: name,
    uri: `${method} api.coinbase.com${path}`,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign("SHA256")
    .update(unsignedToken)
    .end()
    .sign({ key, dsaEncoding: "ieee-p1363" })
    .toString("base64url");
  return `${unsignedToken}.${signature}`;
}

async function coinbaseRequest(path) {
  const jwt = await createCoinbaseJwt("GET", path);
  const response = await fetch(`https://api.coinbase.com${path}`, {
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error_details ||
      data.errorMessage ||
      data.error ||
      `Erreur Coinbase (${response.status})`
    );
  }
  return data;
}

async function getEuroPrice(currency) {
  if (currency === "EUR") return 1;
  const productPath = `/api/v3/brokerage/market/products/${encodeURIComponent(`${currency}-EUR`)}`;
  const response = await fetch(`https://api.coinbase.com${productPath}`, {
    headers: { Accept: "application/json" },
  });
  if (response.ok) {
    const product = await response.json();
    const price = Number(product.price);
    if (Number.isFinite(price)) return price;
  }

  const ratesResponse = await fetch(
    `https://api.coinbase.com/v2/exchange-rates?currency=${encodeURIComponent(currency)}`,
    { headers: { Accept: "application/json" } }
  );
  if (!ratesResponse.ok) return null;
  const rates = await ratesResponse.json();
  const euroRate = Number(rates.data?.rates?.EUR);
  return Number.isFinite(euroRate) ? euroRate : null;
}

async function syncCoinbase() {
  const path = "/api/v3/brokerage/accounts";
  const data = await coinbaseRequest(path);
  const nonEmptyAccounts = (data.accounts || []).filter((account) => {
    const amount = Number(account.available_balance?.value || 0);
    return account.active !== false && Number.isFinite(amount) && amount !== 0;
  });
  const accounts = await Promise.all(nonEmptyAccounts.map(async (account) => {
    const assetAmount = Number(account.available_balance.value);
    const assetCurrency = account.currency;
    const euroPrice = await getEuroPrice(assetCurrency);
    return {
      accountId: account.uuid,
      name: account.name || `${assetCurrency} Wallet`,
      assetAmount,
      assetCurrency,
      euroValue: euroPrice === null ? null : assetAmount * euroPrice,
    };
  }));
  return { accounts, syncedAt: new Date().toISOString() };
}

const EVM_NETWORKS = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH", rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://eth.blockscout.com" },
  { id: "base", name: "Base", symbol: "ETH", rpc: "https://base-rpc.publicnode.com", explorer: "https://base.blockscout.com" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ETH", rpc: "https://arbitrum-one-rpc.publicnode.com", explorer: "https://arbitrum.blockscout.com" },
  { id: "optimism", name: "Optimism", symbol: "ETH", rpc: "https://optimism-rpc.publicnode.com", explorer: "https://optimism.blockscout.com" },
  { id: "polygon", name: "Polygon", symbol: "POL", rpc: "https://polygon-bor-rpc.publicnode.com" },
  { id: "bnb", name: "BNB Chain", symbol: "BNB", rpc: "https://bsc-rpc.publicnode.com" },
  { id: "avalanche", name: "Avalanche C-Chain", symbol: "AVAX", rpc: "https://avalanche-c-chain-rpc.publicnode.com" },
  { id: "sei", name: "Sei EVM", symbol: "SEI", rpc: "https://sei-evm-rpc.publicnode.com" },
];

const CURATED_EVM_TOKENS = {
  ethereum: [
    { symbol: "PYR", name: "PYR", contract: "0x430EF9263E76DAE63c84292C3409D61c598E9682" },
  ],
  polygon: [
    { symbol: "PYR", name: "PYR", contract: "0x430EF9263E76DAE63c84292C3409D61c598E9682" },
  ],
};

async function evmRpc(rpcUrl, method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error || typeof data.result !== "string") {
    throw new Error(data.error?.message || "Lecture du solde EVM impossible");
  }
  return data.result;
}

async function getErc20Balances(network, address, usdToEur) {
  if (!network.explorer) return [];
  try {
    const response = await fetch(
      `${network.explorer}/api/v2/addresses/${encodeURIComponent(address)}/token-balances`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) }
    );
    if (!response.ok) return [];
    const balances = await response.json();
    return balances
      .filter((item) => item.token?.type === "ERC-20" && Number(item.value) > 0)
      .map((item) => {
        const decimals = Number(item.token.decimals || 0);
        const assetAmount = Number(item.value) / 10 ** decimals;
        const usdPrice = Number(item.token.exchange_rate);
        return {
          accountId: `${network.id}-${item.token.address_hash}`,
          name: `${item.token.symbol || item.token.name} · ${network.name}`,
          networkId: network.id,
          networkName: network.name,
          assetAmount,
          assetCurrency: item.token.symbol || item.token.name,
          euroValue: Number.isFinite(usdPrice) && usdPrice > 0 && usdToEur !== null
            ? assetAmount * usdPrice * usdToEur
            : null,
          tokenAddress: item.token.address_hash,
        };
      })
      .filter((account) => account.euroValue !== null && account.euroValue > 0.005)
      .sort((a, b) => b.euroValue - a.euroValue)
      .slice(0, 50);
  } catch {
    return [];
  }
}

async function getCuratedTokenBalances(network, address) {
  const tokens = CURATED_EVM_TOKENS[network.id] || [];
  const encodedAddress = address.slice(2).toLowerCase().padStart(64, "0");
  const balances = await Promise.all(tokens.map(async (token) => {
    try {
      const [balanceHex, decimalsHex, euroPrice] = await Promise.all([
        evmRpc(network.rpc, "eth_call", [{
          to: token.contract,
          data: `0x70a08231${encodedAddress}`,
        }, "latest"]),
        evmRpc(network.rpc, "eth_call", [{
          to: token.contract,
          data: "0x313ce567",
        }, "latest"]),
        getEuroPrice(token.symbol),
      ]);
      const decimals = Number(BigInt(decimalsHex));
      const assetAmount = Number(BigInt(balanceHex)) / 10 ** decimals;
      if (!Number.isFinite(assetAmount) || assetAmount <= 0) return null;
      return {
        accountId: `${network.id}-${token.contract.toLowerCase()}`,
        name: `${token.name} · ${network.name}`,
        networkId: network.id,
        networkName: network.name,
        assetAmount,
        assetCurrency: token.symbol,
        euroValue: euroPrice === null ? null : assetAmount * euroPrice,
        tokenAddress: token.contract,
      };
    } catch {
      return null;
    }
  }));
  return balances.filter(Boolean);
}

async function scanEvmNetwork(network, address, usdToEur) {
  const [nativeBalanceHex, nativeEuroPrice, discoveredTokens, curatedTokens] = await Promise.all([
    evmRpc(network.rpc, "eth_getBalance", [address, "latest"]),
    getEuroPrice(network.symbol),
    getErc20Balances(network, address, usdToEur),
    getCuratedTokenBalances(network, address),
  ]);
  const tokensByAddress = new Map();
  [...discoveredTokens, ...curatedTokens].forEach((token) => {
    tokensByAddress.set(token.tokenAddress.toLowerCase(), token);
  });
  const tokens = Array.from(tokensByAddress.values());
  const nativeAmount = Number(BigInt(nativeBalanceHex)) / 1e18;
  const nativeAccount = {
    accountId: `${network.id}-native`,
    name: `${network.symbol} · ${network.name}`,
    networkId: network.id,
    networkName: network.name,
    assetAmount: nativeAmount,
    assetCurrency: network.symbol,
    euroValue: nativeEuroPrice === null ? null : nativeAmount * nativeEuroPrice,
  };
  return nativeAmount > 0 ? [nativeAccount, ...tokens] : tokens;
}

async function syncEthereum(address) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Adresse Ethereum invalide");
  }
  const usdToEur = await getEuroPrice("USD");
  const results = await Promise.allSettled(
    EVM_NETWORKS.map((network) => scanEvmNetwork(network, address, usdToEur))
  );
  const accounts = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  return {
    accounts,
    networksScanned: EVM_NETWORKS.length,
    syncedAt: new Date().toISOString(),
  };
}

async function syncAptos(address) {
  if (!/^0x[a-fA-F0-9]{1,64}$/.test(address)) {
    throw new Error("Adresse Aptos invalide");
  }
  const response = await fetch("https://api.mainnet.aptoslabs.com/v1/view", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      function: "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data) || data.length === 0) {
    throw new Error(data?.message || "Lecture du solde Aptos impossible");
  }
  const assetAmount = Number(BigInt(data[0])) / 1e8;
  const euroPrice = await getEuroPrice("APT");
  return {
    accounts: [{
      accountId: `aptos-${address.toLowerCase()}`,
      name: "APT · Aptos",
      networkId: "aptos",
      networkName: "Aptos",
      assetAmount,
      assetCurrency: "APT",
      euroValue: euroPrice === null ? null : assetAmount * euroPrice,
    }],
    syncedAt: new Date().toISOString(),
  };
}

async function syncBitcoin(address) {
  const isLegacyAddress = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
  const isBech32Address = /^(bc1)[ac-hj-np-z02-9]{11,71}$/i.test(address);
  if (!isLegacyAddress && !isBech32Address) {
    throw new Error("Adresse Bitcoin invalide");
  }
  const response = await fetch(
    `https://blockstream.info/api/address/${encodeURIComponent(address)}`,
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.chain_stats) {
    throw new Error(data?.message || "Lecture du solde Bitcoin impossible");
  }
  const confirmedSats = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  const pendingSats = (data.mempool_stats?.funded_txo_sum || 0) - (data.mempool_stats?.spent_txo_sum || 0);
  const assetAmount = (confirmedSats + pendingSats) / 1e8;
  const euroPrice = await getEuroPrice("BTC");
  return {
    accounts: [{
      accountId: `bitcoin-${address.toLowerCase()}`,
      name: "BTC · Bitcoin",
      networkId: "bitcoin",
      networkName: "Bitcoin",
      assetAmount,
      assetCurrency: "BTC",
      euroValue: euroPrice === null ? null : assetAmount * euroPrice,
    }],
    syncedAt: new Date().toISOString(),
  };
}

const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const SOLANA_TOKEN_PROGRAMS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
];

async function solanaRpc(method, params) {
  const response = await fetch(SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error || data.result === undefined) {
    throw new Error(data.error?.message || "Lecture du wallet Solana impossible");
  }
  return data.result;
}

async function getSolanaTokenMarkets(mints) {
  const markets = new Map();
  for (let index = 0; index < mints.length; index += 30) {
    const batch = mints.slice(index, index + 30);
    try {
      const response = await fetch(
        `https://api.dexscreener.com/tokens/v1/solana/${batch.map(encodeURIComponent).join(",")}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) }
      );
      if (!response.ok) continue;
      const pairs = await response.json();
      pairs.forEach((pair) => {
        [pair.baseToken, pair.quoteToken].forEach((token) => {
          if (!token || !batch.includes(token.address)) return;
          const priceUsd = Number(pair.priceUsd);
          const liquidity = Number(pair.liquidity?.usd || 0);
          const current = markets.get(token.address);
          if (!current || liquidity > current.liquidity) {
            markets.set(token.address, {
              name: token.name,
              symbol: token.symbol,
              priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
              liquidity,
            });
          }
        });
      });
    } catch {
      // Le solde reste visible même si les métadonnées de marché sont indisponibles.
    }
  }
  return markets;
}

async function syncSolana(address) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    throw new Error("Adresse Solana invalide");
  }
  const [balanceResult, ...tokenResults] = await Promise.all([
    solanaRpc("getBalance", [address, { commitment: "confirmed" }]),
    ...SOLANA_TOKEN_PROGRAMS.map((programId) =>
      solanaRpc("getTokenAccountsByOwner", [
        address,
        { programId },
        { commitment: "confirmed", encoding: "jsonParsed" },
      ]).catch(() => ({ value: [] }))
    ),
  ]);
  const tokenBalances = new Map();
  tokenResults.flatMap((result) => result.value || []).forEach((item) => {
    const info = item.account?.data?.parsed?.info;
    const amount = Number(info?.tokenAmount?.uiAmountString || 0);
    if (!info?.mint || !Number.isFinite(amount) || amount <= 0) return;
    tokenBalances.set(info.mint, (tokenBalances.get(info.mint) || 0) + amount);
  });
  const [solEuroPrice, usdToEur, markets] = await Promise.all([
    getEuroPrice("SOL"),
    getEuroPrice("USD"),
    getSolanaTokenMarkets(Array.from(tokenBalances.keys())),
  ]);
  const solAmount = Number(balanceResult.value || 0) / 1e9;
  const accounts = [];
  if (solAmount > 0) {
    accounts.push({
      accountId: "solana-native",
      name: "SOL · Solana",
      networkId: "solana",
      networkName: "Solana",
      assetAmount: solAmount,
      assetCurrency: "SOL",
      euroValue: solEuroPrice === null ? null : solAmount * solEuroPrice,
    });
  }
  tokenBalances.forEach((assetAmount, mint) => {
    const market = markets.get(mint);
    const priceUsd = Number(market?.priceUsd);
    const euroValue = Number.isFinite(priceUsd) && priceUsd > 0 && usdToEur !== null
      ? assetAmount * priceUsd * usdToEur
      : null;
    // Les wallets Solana reçoivent souvent des jetons spam ou abandonnés.
    // Sans marché actif/prix fiable, ils ne doivent pas polluer le patrimoine.
    if (euroValue === null || euroValue <= 0.005) return;
    const symbol = market?.symbol || `${mint.slice(0, 4)}…${mint.slice(-4)}`;
    accounts.push({
      accountId: `solana-${mint}`,
      name: `${market?.name || symbol} · Solana`,
      networkId: "solana",
      networkName: "Solana",
      assetAmount,
      assetCurrency: symbol,
      euroValue,
      tokenAddress: mint,
    });
  });
  accounts.sort((a, b) => (b.euroValue || 0) - (a.euroValue || 0));
  return { accounts, syncedAt: new Date().toISOString() };
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
    (session.accounts || []).map(async (sessionAccount) => {
      const accountId = typeof sessionAccount === "string"
        ? sessionAccount
        : sessionAccount.uid;
      if (!accountId) throw new Error("Identifiant de compte bancaire manquant");
      const balances = await enableBankingRequest(
        `/accounts/${encodeURIComponent(accountId)}/balances`
      );
      const account = typeof sessionAccount === "string" ? {} : sessionAccount;
      const normalized = normalizeBalance(accountId, account, balances);
      if (typeof sessionAccount === "string") {
        normalized.name = null;
        normalized.accountTypeCode = null;
        normalized.iban = null;
      }
      return normalized;
    })
  );

  pendingConnections.delete(state);
  return {
    sourceId: pending.sourceId,
    sessionId: session.session_id,
    accounts,
  };
}

async function syncBankSession(sessionId) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    throw new Error("Session bancaire invalide");
  }
  const session = await enableBankingRequest(
    `/sessions/${encodeURIComponent(sessionId)}`
  );
  const accounts = await Promise.all(
    (session.accounts || []).map(async (sessionAccount) => {
      const accountId = typeof sessionAccount === "string"
        ? sessionAccount
        : sessionAccount.uid;
      if (!accountId) throw new Error("Identifiant de compte bancaire manquant");
      const balances = await enableBankingRequest(
        `/accounts/${encodeURIComponent(accountId)}/balances`
      );
      const account = typeof sessionAccount === "string" ? {} : sessionAccount;
      const normalized = normalizeBalance(accountId, account, balances);
      if (typeof sessionAccount === "string") {
        normalized.name = null;
        normalized.accountTypeCode = null;
        normalized.iban = null;
      }
      return normalized;
    })
  );
  return { sessionId, accounts, syncedAt: new Date().toISOString() };
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

    if (request.method === "POST" && url.pathname === "/api/bank/sync") {
      const body = await readJson(request);
      return sendJson(response, 200, await syncBankSession(body.sessionId || ""));
    }

    if (request.method === "GET" && url.pathname === "/api/coinbase/health") {
      return sendJson(response, 200, {
        provider: "coinbase",
        configured: Boolean(COINBASE_CREDENTIALS_PATH),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/coinbase/sync") {
      return sendJson(response, 200, await syncCoinbase());
    }

    if (request.method === "POST" && url.pathname === "/api/wallet/ethereum/sync") {
      const body = await readJson(request);
      return sendJson(response, 200, await syncEthereum(body.address || ""));
    }

    if (request.method === "POST" && url.pathname === "/api/wallet/aptos/sync") {
      const body = await readJson(request);
      return sendJson(response, 200, await syncAptos(body.address || ""));
    }

    if (request.method === "POST" && url.pathname === "/api/wallet/bitcoin/sync") {
      const body = await readJson(request);
      return sendJson(response, 200, await syncBitcoin(body.address || ""));
    }

    if (request.method === "POST" && url.pathname === "/api/wallet/solana/sync") {
      const body = await readJson(request);
      return sendJson(response, 200, await syncSolana(body.address || ""));
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
