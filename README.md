# ⬡ Portal de Protocolo de Compras

Sistema de automação para gestão de protocolos de compras com motor de validação integrado ao SAP e banco de dados JSONBin.

## ✨ Funcionalidades

- **Dashboard** com métricas em tempo real (total, aprovados, pendentes, bloqueados)
- **Novo Protocolo** com formulário em 4 etapas guiadas
- **Motor de Validação Automático** com 6 regras de negócio:
  - ✅ Cadastro do item no SAP
  - ✅ Contrato vigente
  - ✅ Status do fornecedor (bloqueio, CNPJ)
  - ✅ Parametrização (Centro de Custo)
  - ✅ Alçada de aprovação por valor
  - ✅ Detecção de duplicidade (7 dias)
- **Lista de Protocolos** com busca e filtro por status
- **Gestão de status** (Pendente → Aprovado → No SAP)
- **Persistência** com JSONBin como banco de dados

## 🚀 Como usar

### 1. Acesse o portal publicado
👉 [https://SEU-USUARIO.github.io/portal-protocolo-compras](https://SEU-USUARIO.github.io/portal-protocolo-compras)

### 2. Rodar localmente
Basta abrir o `index.html` no navegador — não precisa de servidor.

## 🗂️ Estrutura do projeto

```
portal-protocolo-compras/
├── index.html          # Interface principal
├── css/
│   └── style.css       # Estilos
├── js/
│   ├── config.js       # Configurações e regras
│   ├── api.js          # Integração JSONBin
│   ├── validacao.js    # Motor de regras
│   └── app.js          # Lógica da aplicação
└── README.md
```

## ⚙️ Configuração

Edite `js/config.js` para ajustar:

```javascript
const CONFIG = {
  JSONBIN: {
    BIN_ID: 'SEU_BIN_ID',
    API_KEY: 'SUA_API_KEY',
  },
  REGRAS: {
    VALOR_MAX_SEM_APROVACAO: 5000,
    VALOR_CRITICO: 50000,
    DIAS_ALERTA_CONTRATO: 30,
  }
};
```

## 🔒 Segurança

> ⚠️ A API Key do JSONBin está no `config.js`. Para produção, use um backend (Node.js/Python) como proxy para nunca expor a chave no front-end.

## 📊 Status dos Protocolos

| Status | Descrição |
|--------|-----------|
| ⏳ Pendente | Validado com avisos, aguarda análise do gestor |
| ✓ Aprovado | Todas as validações OK |
| ✕ Bloqueado | Falha crítica na validação |
| ⬡ No SAP | Pedido criado no SAP |

## 🛣️ Próximos passos (roadmap)

- [ ] Integração real com SAP via BAPI/RFC
- [ ] IA para leitura automática de PDF (NF, requisição, contrato)
- [ ] Notificações por e-mail/Teams
- [ ] Dashboard com gráficos históricos
- [ ] Autenticação com Azure AD / SSO

---

Desenvolvido como parte do projeto de automação da célula de pagamento.
