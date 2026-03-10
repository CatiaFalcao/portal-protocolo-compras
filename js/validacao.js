// =============================================
// MOTOR DE VALIDAÇÃO — Regras de Negócio
// =============================================
// Em produção, cada check consultaria o SAP via API.
// Aqui simulamos as respostas com lógica inteligente.
// =============================================

const VALIDACAO = {

  // Executa todas as validações em sequência
  async executar(dados) {
    const checks = [
      { label: 'Cadastro do item no SAP',        fn: () => this.checkItem(dados) },
      { label: 'Contrato vigente',                fn: () => this.checkContrato(dados) },
      { label: 'Status do fornecedor',            fn: () => this.checkFornecedor(dados) },
      { label: 'Parametrização (Centro de Custo)',fn: () => this.checkParametrizacao(dados) },
      { label: 'Alçada de aprovação',             fn: () => this.checkAlcada(dados) },
      { label: 'Duplicidade de protocolo',        fn: () => this.checkDuplicidade(dados) },
    ];

    const resultados = [];

    for (const check of checks) {
      // Mostra como "verificando..."
      renderValidationItem(check.label, 'loading', '⟳', 'Verificando...');
      await sleep(600 + Math.random() * 400);

      const resultado = await check.fn();
      resultados.push({ label: check.label, ...resultado });

      // Atualiza o item na tela
      updateValidationItem(check.label, resultado.status, resultado.icon, resultado.msg);
    }

    return resultados;
  },

  // 1. Verifica se o item/código SAP existe
  checkItem(dados) {
    const codigo = (dados.codsap || '').trim().toUpperCase();
    const descricao = (dados.item || '').trim();

    if (!descricao) {
      return { status: 'fail', icon: '✕', msg: 'Descrição do item não informada.' };
    }

    // Se código foi informado, verifica prefixo
    if (codigo) {
      const cadastrado = CONFIG.ITENS_SAP_CADASTRADOS.some(p => codigo.startsWith(p));
      if (!cadastrado) {
        return { status: 'warn', icon: '⚠', msg: `Código "${codigo}" não reconhecido no SAP. Fluxo de cadastro será aberto.` };
      }
      return { status: 'ok', icon: '✓', msg: `Item "${codigo}" localizado no cadastro SAP.` };
    }

    // Sem código → aviso, mas não bloqueia
    return { status: 'warn', icon: '⚠', msg: 'Código SAP não informado. Item será cadastrado após aprovação.' };
  },

  // 2. Verifica contrato
  checkContrato(dados) {
    const contrato = (dados.contrato || '').trim();

    if (!contrato) {
      const valor = parseFloat(dados.valor || 0) * parseInt(dados.qtd || 1);
      if (valor > CONFIG.REGRAS.VALOR_MAX_SEM_APROVACAO) {
        return { status: 'warn', icon: '⚠', msg: `Sem contrato informado e valor total ${formatMoney(valor)} acima do limite. Comprador será alertado.` };
      }
      return { status: 'warn', icon: '⚠', msg: 'Nenhum contrato informado. Compra avulsa — requer aprovação adicional.' };
    }

    // Simula verificação: contratos válidos começam com "CONT-"
    if (!contrato.toUpperCase().startsWith('CONT-')) {
      return { status: 'fail', icon: '✕', msg: `Formato de contrato inválido: "${contrato}". Use CONT-AAAA-NNNNN.` };
    }

    return { status: 'ok', icon: '✓', msg: `Contrato ${contrato} verificado e vigente.` };
  },

  // 3. Verifica fornecedor / CNPJ
  checkFornecedor(dados) {
    const cnpj = (dados.cnpj || '').replace(/\D/g, '');
    const nome = (dados.fornecedor || '').trim();

    if (!nome) {
      return { status: 'fail', icon: '✕', msg: 'Razão social do fornecedor não informada.' };
    }

    if (!cnpj || cnpj.length !== 14) {
      return { status: 'fail', icon: '✕', msg: 'CNPJ inválido ou não informado. Verifique o formato.' };
    }

    // Verifica se está na lista de bloqueados
    const cnpjFormatado = dados.cnpj;
    if (CONFIG.CNPJS_BLOQUEADOS.includes(cnpjFormatado)) {
      return { status: 'fail', icon: '✕', msg: `Fornecedor BLOQUEADO no SAP. Protocolo impedido. Contate o gestor de compras.` };
    }

    // Todos os dígitos iguais = inválido
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return { status: 'fail', icon: '✕', msg: 'CNPJ inválido (dígitos repetidos).' };
    }

    return { status: 'ok', icon: '✓', msg: `Fornecedor "${nome}" (${dados.cnpj}) ativo no cadastro.` };
  },

  // 4. Verifica parametrização
  checkParametrizacao(dados) {
    const cc = (dados.cc || '').trim();
    const depto = (dados.depto || '').trim();

    if (!cc) {
      return { status: 'fail', icon: '✕', msg: 'Centro de Custo não informado. Campo obrigatório.' };
    }

    if (!depto) {
      return { status: 'fail', icon: '✕', msg: 'Departamento não selecionado.' };
    }

    // Valida formato CC-XXXX
    if (!cc.toUpperCase().startsWith('CC-')) {
      return { status: 'warn', icon: '⚠', msg: `Formato de CC "${cc}" incomum. Verifique se está correto.` };
    }

    return { status: 'ok', icon: '✓', msg: `Centro de Custo ${cc} parametrizado. Departamento: ${depto}.` };
  },

  // 5. Verifica alçada de aprovação
  checkAlcada(dados) {
    const valorUnit = parseFloat(dados.valor || 0);
    const qtd = parseInt(dados.qtd || 1);
    const total = valorUnit * qtd;
    const urgencia = dados.urgencia || 'normal';

    if (total === 0) {
      return { status: 'warn', icon: '⚠', msg: 'Valor total zerado. Verifique quantidade e valor unitário.' };
    }

    if (total > CONFIG.REGRAS.VALOR_CRITICO) {
      return { status: 'warn', icon: '⚠', msg: `Valor total ${formatMoney(total)} acima de ${formatMoney(CONFIG.REGRAS.VALOR_CRITICO)}. Aprovação da Diretoria necessária.` };
    }

    if (total > CONFIG.REGRAS.VALOR_MAX_SEM_APROVACAO) {
      return { status: 'warn', icon: '⚠', msg: `Valor total ${formatMoney(total)} requer aprovação do Gestor antes do envio ao SAP.` };
    }

    const extra = urgencia === 'critica' ? ' | ⚡ Urgência crítica — priorizando.' : '';
    return { status: 'ok', icon: '✓', msg: `Valor total ${formatMoney(total)} dentro da alçada.${extra}` };
  },

  // 6. Verifica duplicidade
  async checkDuplicidade(dados) {
    try {
      const registro = await API.getAll();
      const lista = registro.protocolos || [];
      const item = (dados.item || '').toLowerCase().trim();
      const cnpj = (dados.cnpj || '').replace(/\D/g, '');

      const duplicado = lista.find(p => {
        const mesmoCNPJ = (p.cnpj || '').replace(/\D/g, '') === cnpj;
        const mesmoItem = (p.item || '').toLowerCase().trim() === item;
        const recente = (new Date() - new Date(p.createdAt)) < 7 * 24 * 60 * 60 * 1000; // 7 dias
        return mesmoCNPJ && mesmoItem && recente && p.status !== 'cancelado';
      });

      if (duplicado) {
        return { status: 'warn', icon: '⚠', msg: `Possível duplicidade: protocolo ${duplicado.id} (${formatDate(duplicado.createdAt)}) tem mesmo item e fornecedor nos últimos 7 dias.` };
      }

      return { status: 'ok', icon: '✓', msg: 'Nenhuma duplicidade encontrada nos últimos 7 dias.' };
    } catch {
      return { status: 'ok', icon: '✓', msg: 'Verificação de duplicidade ignorada (erro de leitura).' };
    }
  }

};

// Calcula resultado geral das validações
function calcularResultadoGeral(resultados) {
  const temFalha = resultados.some(r => r.status === 'fail');
  const temAviso = resultados.some(r => r.status === 'warn');

  if (temFalha) {
    return {
      tipo: 'error',
      texto: '🚫 Protocolo BLOQUEADO — Existem erros críticos que impedem o envio ao SAP. Corrija os itens marcados em vermelho e tente novamente.',
      statusFinal: 'bloqueado'
    };
  }

  if (temAviso) {
    return {
      tipo: 'warning',
      texto: '⚠️ Protocolo com PENDÊNCIAS — Validado com avisos. O protocolo será salvo como "Pendente" e encaminhado para análise do gestor de compras.',
      statusFinal: 'pendente'
    };
  }

  return {
    tipo: 'success',
    texto: '✅ Todas as validações passaram! O protocolo está pronto para ser enviado ao SAP.',
    statusFinal: 'aprovado'
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
