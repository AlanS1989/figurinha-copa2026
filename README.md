# 🏆 Figurinha Copa 2026 – Guia de Deploy Completo

## Como funciona o sistema

```
Cliente preenche formulário
        ↓
Envia foto + dados
        ↓
GPT-4o (DALL-E 3) gera a figurinha
        ↓
Preview com watermark aparece
        ↓
Cliente paga R$12,90 (Mercado Pago)
        ↓
Webhook confirma pagamento
        ↓
E-mail automático com figurinha em alta resolução
```

---

## 1. Contas que você precisa criar (todas gratuitas para começar)

| Serviço | Link | Para que serve | Custo |
|---------|------|---------------|-------|
| **Vercel** | vercel.com | Hospedagem + funções | Grátis |
| **OpenAI** | platform.openai.com | Gerar a figurinha (DALL-E 3) | ~R$0,20 por figurinha |
| **Mercado Pago** | mercadopago.com.br | Receber pagamentos | 5% por venda |
| **Resend** | resend.com | Enviar e-mails | Grátis até 3.000/mês |
| **Vercel Blob** | vercel.com/storage | Armazenar imagens | Grátis até 1GB |

---

## 2. Passo a passo do deploy

### 2.1 Instalar o Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Fazer upload do projeto
```bash
# Na pasta do projeto:
vercel
```
Responda as perguntas e o Vercel já detecta automaticamente.

### 2.3 Configurar as variáveis de ambiente no Vercel
No painel do Vercel → seu projeto → Settings → Environment Variables:

```
OPENAI_API_KEY      = sk-...     (pegue em platform.openai.com)
MP_ACCESS_TOKEN     = APP_USR-... (pegue em mercadopago.com.br → Suas integrações)
RESEND_API_KEY      = re_...     (pegue em resend.com)
NEXT_PUBLIC_BASE_URL = https://seu-projeto.vercel.app
BLOB_READ_WRITE_TOKEN = vercel_blob_... (gerado pelo Vercel automaticamente)
```

### 2.4 Habilitar Vercel Blob
No painel do Vercel → seu projeto → Storage → Create → Blob

### 2.5 Configurar webhook do Mercado Pago
Em mercadopago.com.br → Suas integrações → Webhooks:
- URL: `https://seu-projeto.vercel.app/api/webhook`
- Eventos: pagamento

---

## 3. Configurar o Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/
2. Crie um app
3. Copie o **Access Token de Produção** (começa com APP_USR-)
4. Configure a URL de webhook

---

## 4. Configurar o Resend (e-mails)

1. Acesse: https://resend.com
2. Crie uma conta
3. Vá em Domains → Add Domain → coloque seu domínio
4. Configure os registros DNS (eles mostram exatamente o que fazer)
5. Copie a API Key

> **Sem domínio próprio?** Use o e-mail padrão do Resend (onboarding@resend.dev) enquanto testa.

---

## 5. Custos por venda

| Item | Custo |
|------|-------|
| Geração da imagem (DALL-E 3) | ~R$0,20 |
| Hospedagem Vercel | R$0,00 |
| Taxa Mercado Pago (5%) | ~R$0,65 |
| E-mail Resend | R$0,00 |
| **Total custo** | **~R$0,85** |
| **Você recebe (R$12,90 - taxas)** | **~R$12,05** |

---

## 6. Estrutura de arquivos

```
figurinha-copa2026/
├── index.html          ← Landing page + formulário completo
├── package.json        ← Dependências Node.js
├── vercel.json         ← Configuração do Vercel
└── api/
    ├── gerar.js        ← Gera figurinha com DALL-E 3
    ├── checkout.js     ← Cria pagamento no Mercado Pago
    └── webhook.js      ← Confirma pagamento + envia e-mail
```

---

## 7. Domínio personalizado (opcional)

No Vercel → seu projeto → Settings → Domains → Add:
- `figurinhacopa2026.com.br` (registre no registro.br por ~R$40/ano)

---

## 8. Suporte

Qualquer dúvida, volte ao Claude e pergunte sobre cada etapa específica!
