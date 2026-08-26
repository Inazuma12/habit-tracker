# React + Vite

## Connexion bancaire (Enable Banking)

La connexion est réalisée par redirection PSD2 : l'application ne reçoit jamais
les identifiants La Banque Postale. La clé privée Enable Banking reste uniquement
dans le serveur local Node et le dossier `secrets/` est ignoré par Git.

1. Créer un compte sur `https://enablebanking.com/sign-in/`.
2. Créer une application **Production** dans le Control Panel avec l'URL de
   redirection `https://localhost:5173/bank-callback`.
3. Choisir la génération de clé dans le navigateur et télécharger le fichier
   privé `.pem`. Ne jamais partager cette clé.
4. Créer le dossier `secrets/` et y placer la clé sous le nom
   `enable-banking-private.pem`.
5. Copier `.env.example` vers `.env`, puis renseigner l'UUID de l'application
   dans `ENABLE_BANKING_APPLICATION_ID`.
6. Dans le Control Panel, utiliser **Activate by linking accounts** pour
   autoriser gratuitement ses propres comptes en mode restreint.
7. Lancer `npm run dev`, ajouter le compte dans Finance puis cliquer sur
   **Connecter**.

Le serveur écoute uniquement sur `127.0.0.1:8787`. Pour un déploiement public,
il faudra ajouter une authentification utilisateur et une base chiffrée pour les
identifiants de session avant la production.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
