// README.md
# WhatsApp QR Status (Next.js)

Projeto em Next.js + WhatsApp Web.js que exibe o QR Code de autenticação e status da sessão.

## Requisitos
- Node.js 18+
- Conta no WhatsApp
- Acesso à internet (para conexão e QR)

## Como usar

```bash
# Instalar dependências
npm install

# Rodar em dev
npm run dev

# Acessar
http://localhost:3000
```

## Deploy na Oracle VM

1. Libere a porta 3000 no firewall
2. Configure ambiente com Node 18+
3. Execute:
```bash
npm install
npm run start
```

## Google Sheets (opcional)
Configure uma credencial de service account e use em `lib/sheets.ts` com seu `spreadsheetId`.

---

Pronto para escanear e começar!