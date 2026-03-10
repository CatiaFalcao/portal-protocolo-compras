// =============================================
// CONFIGURAÇÃO DO PORTAL DE PROTOCOLO DE COMPRAS
// =============================================
// ⚠️ ATENÇÃO: Antes de publicar no GitHub,
// considere usar GitHub Secrets + Actions
// para proteger a API Key em produção.
// =============================================

const CONFIG = {
  JSONBIN: {
    BIN_ID: '69b08073864efc355b5e3f91',
    API_KEY: '$2a$10$5Q9/pUq5WyX/gKrVGzHy6epLMILLOeatAG.nEgXW8fRlnvo9T5k/G',
    BASE_URL: 'https://api.jsonbin.io/v3/b'
  },

  // Regras de validação
  REGRAS: {
    VALOR_MAX_SEM_APROVACAO: 5000,     // acima disso exige aprovação extra
    VALOR_CRITICO: 50000,              // alerta crítico
    DIAS_ALERTA_CONTRATO: 30,          // avisar contrato vencendo
  },

  // Prefixos de item SAP que estão cadastrados (simulado)
  ITENS_SAP_CADASTRADOS: [
    'MAT-', 'SERV-', 'EQ-', 'CONS-', 'INF-'
  ],

  // CNPJs bloqueados (simulado — em produção vem do SAP)
  CNPJS_BLOQUEADOS: [
    '00.000.000/0000-00',
    '11.111.111/1111-11'
  ]
};
