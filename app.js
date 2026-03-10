// =============================================
// APP — Lógica principal do portal
// =============================================

let todosProtocolos = [];
let resultadoValidacao = null;

// =============================================
// INICIALIZAÇÃO
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  // Atualiza data no topbar
  document.getElementById('topbar-date').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  // Navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(item.dataset.page);
    });
  });

  // Máscara de CNPJ
  const cnpjInput = document.getElementById('f-cnpj');
  if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 14);
      if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
      else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
      else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
      e.target.value = v;
    });
  }

  loadDashboard();
});

// =============================================
// NAVEGAÇÃO
// =============================================

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById(`page-${page}`).classList.add('active');

  const titles = { dashboard: 'Dashboard', novo: 'Novo Protocolo', lista: 'Protocolos' };
  document.getElementById('page-title').textContent = titles[page] || page;

  if (page === 'dashboard') loadDashboard();
  if (page === 'lista') loadLista();
  if (page === 'novo') resetForm();
}

// =============================================
// DASHBOARD
// =============================================

async function loadDashboard() {
  document.getElementById('dashboard-list').innerHTML = '<div class="loading">Carregando...</div>';

  try {
    const data = await API.getAll();
    todosProtocolos = data.protocolos || [];

    // Métricas
    const total = todosProtocolos.length;
    const aprovados = todosProtocolos.filter(p => p.status === 'aprovado' || p.status === 'no_sap').length;
    const pendentes = todosProtocolos.filter(p => p.status === 'pendente').length;
    const bloqueados = todosProtocolos.filter(p => p.status === 'bloqueado').length;

    document.getElementById('m-total').textContent = total;
    document.getElementById('m-aprovados').textContent = aprovados;
    document.getElementById('m-pendentes').textContent = pendentes;
    document.getElementById('m-bloqueados').textContent = bloqueados;

    // Lista dos 5 mais recentes
    const recentes = [...todosProtocolos].reverse().slice(0, 5);
    const container = document.getElementById('dashboard-list');

    if (recentes.length === 0) {
      container.innerHTML = '<div class="empty">Nenhum protocolo ainda. Clique em "Novo Protocolo" para começar.</div>';
      return;
    }

    container.innerHTML = recentes.map(p => renderCard(p)).join('');

  } catch (err) {
    document.getElementById('dashboard-list').innerHTML =
      `<div class="empty">Erro ao carregar dados: ${err.message}</div>`;
    showToast('Erro ao conectar ao JSONBin', 'error');
  }
}

// =============================================
// LISTA
// =============================================

async function loadLista() {
  document.getElementById('lista-protocolos').innerHTML = '<div class="loading">Carregando...</div>';

  try {
    const data = await API.getAll();
    todosProtocolos = data.protocolos || [];
    renderLista(todosProtocolos);
  } catch (err) {
    document.getElementById('lista-protocolos').innerHTML =
      `<div class="empty">Erro: ${err.message}</div>`;
  }
}

function renderLista(lista) {
  const container = document.getElementById('lista-protocolos');
  const invertida = [...lista].reverse();

  if (invertida.length === 0) {
    container.innerHTML = '<div class="empty">Nenhum protocolo encontrado.</div>';
    return;
  }

  container.innerHTML = invertida.map(p => renderCard(p)).join('');
}

function filterList() {
  const busca = (document.getElementById('search-input').value || '').toLowerCase();
  const status = document.getElementById('filter-status').value;

  const filtrados = todosProtocolos.filter(p => {
    const matchBusca = !busca ||
      (p.item || '').toLowerCase().includes(busca) ||
      (p.fornecedor || '').toLowerCase().includes(busca) ||
      (p.solicitante || '').toLowerCase().includes(busca) ||
      (p.id || '').toLowerCase().includes(busca);

    const matchStatus = !status || p.status === status;

    return matchBusca && matchStatus;
  });

  renderLista(filtrados);
}

// =============================================
// RENDER CARD
// =============================================

function renderCard(p) {
  const valorTotal = (parseFloat(p.valor || 0) * parseInt(p.qtd || 1));
  return `
    <div class="protocol-card" onclick="openModal('${p.id}')">
      <div>
        <div class="pc-num">${p.id} · ${formatDate(p.createdAt)}</div>
        <div class="pc-item">${p.item || '—'}</div>
        <div class="pc-meta">${p.fornecedor || '—'} · ${p.solicitante || '—'} · ${formatMoney(valorTotal)}</div>
      </div>
      <span class="status-badge status-${p.status || 'pendente'}">${labelStatus(p.status)}</span>
    </div>
  `;
}

function labelStatus(s) {
  const map = {
    pendente: '⏳ Pendente',
    aprovado: '✓ Aprovado',
    bloqueado: '✕ Bloqueado',
    no_sap: '⬡ No SAP',
    cancelado: '— Cancelado'
  };
  return map[s] || s || 'Pendente';
}

// =============================================
// MODAL DETALHE
// =============================================

function openModal(id) {
  const p = todosProtocolos.find(x => x.id === id);
  if (!p) return;

  document.getElementById('modal-title').textContent = p.id;

  const valorTotal = parseFloat(p.valor || 0) * parseInt(p.qtd || 1);

  document.getElementById('modal-body').innerHTML = `
    <div style="margin-bottom:1rem">
      <span class="status-badge status-${p.status || 'pendente'}">${labelStatus(p.status)}</span>
    </div>
    ${row('Solicitante', p.solicitante)}
    ${row('Departamento', p.depto)}
    ${row('Centro de Custo', p.cc)}
    ${row('Urgência', p.urgencia)}
    ${row('Item', p.item)}
    ${row('Código SAP', p.codsap || 'Não informado')}
    ${row('Qtd / Unid', `${p.qtd} ${p.unidade}`)}
    ${row('Valor Unitário', formatMoney(p.valor))}
    ${row('Valor Total', formatMoney(valorTotal))}
    ${row('Fornecedor', p.fornecedor)}
    ${row('CNPJ', p.cnpj)}
    ${row('Contrato', p.contrato || 'Não informado')}
    ${row('Criado em', formatDate(p.createdAt))}
    ${row('Atualizado', formatDate(p.updatedAt))}
    ${p.observacoes ? row('Observações', p.observacoes) : ''}
    ${p.observacaoGestor ? row('Obs. Gestor', p.observacaoGestor) : ''}
  `;

  // Ações no footer
  const footer = document.getElementById('modal-footer');
  footer.innerHTML = '';

  if (p.status === 'pendente') {
    footer.innerHTML = `
      <button class="btn-ghost" onclick="updateStatusModal('${p.id}', 'bloqueado')">Bloquear</button>
      <button class="btn-success" onclick="updateStatusModal('${p.id}', 'aprovado')">Aprovar</button>
    `;
  } else if (p.status === 'aprovado') {
    footer.innerHTML = `
      <button class="btn-primary" onclick="updateStatusModal('${p.id}', 'no_sap')">⬡ Marcar como No SAP</button>
    `;
  } else {
    footer.innerHTML = `<span style="font-size:0.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">Nenhuma ação disponível para este status.</span>`;
  }

  document.getElementById('modal-overlay').classList.add('open');
}

function row(key, val) {
  return `<div class="detail-row"><span class="detail-key">${key}</span><span class="detail-val">${val || '—'}</span></div>`;
}

async function updateStatusModal(id, novoStatus) {
  try {
    await API.updateStatus(id, novoStatus);
    showToast(`Status atualizado para: ${labelStatus(novoStatus)}`, 'success');
    closeModal();
    // Recarrega a página atual
    const activePage = document.querySelector('.nav-item.active')?.dataset.page;
    if (activePage === 'lista') loadLista();
    else loadDashboard();
  } catch (err) {
    showToast('Erro ao atualizar: ' + err.message, 'error');
  }
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// =============================================
// FORMULÁRIO — STEPS
// =============================================

function resetForm() {
  // Limpa campos
  ['f-solicitante','f-depto','f-cc','f-urgencia','f-item','f-codsap',
   'f-qtd','f-unidade','f-valor','f-fornecedor','f-cnpj','f-contrato','f-obs']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = el.tagName === 'SELECT' ? el.options[0]?.value || '' : '';
    });

  // Volta ao step 1
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');

  // Reseta progress
  document.querySelectorAll('.progress-step').forEach((s, i) => {
    s.classList.toggle('active', i === 0);
    s.classList.remove('done');
  });

  // Limpa validação
  resultadoValidacao = null;
  document.getElementById('validation-list').innerHTML = '';
  document.getElementById('validation-result').innerHTML = '';
  document.getElementById('validation-actions').innerHTML = '';
}

function nextStep(step) {
  // Validação básica antes de avançar
  if (step === 2) {
    if (!document.getElementById('f-solicitante').value.trim()) {
      showToast('Informe o nome do solicitante', 'error'); return;
    }
    if (!document.getElementById('f-depto').value) {
      showToast('Selecione o departamento', 'error'); return;
    }
    if (!document.getElementById('f-cc').value.trim()) {
      showToast('Informe o Centro de Custo', 'error'); return;
    }
  }

  if (step === 3) {
    if (!document.getElementById('f-item').value.trim()) {
      showToast('Informe a descrição do item', 'error'); return;
    }
    if (!document.getElementById('f-qtd').value || parseInt(document.getElementById('f-qtd').value) < 1) {
      showToast('Informe a quantidade', 'error'); return;
    }
    if (!document.getElementById('f-valor').value || parseFloat(document.getElementById('f-valor').value) <= 0) {
      showToast('Informe o valor unitário', 'error'); return;
    }
  }

  // Esconde steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`step-${step}`).classList.add('active');

  // Atualiza progress
  document.querySelectorAll('.progress-step').forEach((s, i) => {
    const num = i + 1;
    s.classList.remove('active', 'done');
    if (num < step) s.classList.add('done');
    if (num === step) s.classList.add('active');
  });
}

// =============================================
// VALIDAÇÃO
// =============================================

async function runValidation() {
  // Valida campos obrigatórios do step 3
  if (!document.getElementById('f-fornecedor').value.trim()) {
    showToast('Informe a razão social do fornecedor', 'error'); return;
  }
  if (!document.getElementById('f-cnpj').value.trim()) {
    showToast('Informe o CNPJ', 'error'); return;
  }

  nextStep(4);

  // Coleta dados
  const dados = {
    solicitante: document.getElementById('f-solicitante').value.trim(),
    depto:       document.getElementById('f-depto').value,
    cc:          document.getElementById('f-cc').value.trim(),
    urgencia:    document.getElementById('f-urgencia').value,
    item:        document.getElementById('f-item').value.trim(),
    codsap:      document.getElementById('f-codsap').value.trim(),
    qtd:         document.getElementById('f-qtd').value,
    unidade:     document.getElementById('f-unidade').value,
    valor:       document.getElementById('f-valor').value,
    fornecedor:  document.getElementById('f-fornecedor').value.trim(),
    cnpj:        document.getElementById('f-cnpj').value.trim(),
    contrato:    document.getElementById('f-contrato').value.trim(),
    observacoes: document.getElementById('f-obs').value.trim(),
  };

  // Limpa área
  document.getElementById('validation-list').innerHTML = '';
  document.getElementById('validation-result').innerHTML = '';
  document.getElementById('validation-actions').innerHTML = '';

  // Executa validações
  const resultados = await VALIDACAO.executar(dados);
  resultadoValidacao = { dados, resultados };

  // Mostra resultado geral
  const resultado = calcularResultadoGeral(resultados);

  document.getElementById('validation-result').innerHTML = `
    <div class="result-box ${resultado.tipo}">${resultado.texto}</div>
  `;

  // Botões de ação
  const actions = document.getElementById('validation-actions');
  actions.innerHTML = '';

  const btnVoltar = document.createElement('button');
  btnVoltar.className = 'btn-ghost';
  btnVoltar.textContent = '← Corrigir';
  btnVoltar.onclick = () => nextStep(3);
  actions.appendChild(btnVoltar);

  if (resultado.statusFinal !== 'bloqueado') {
    const btnSalvar = document.createElement('button');
    btnSalvar.className = resultado.statusFinal === 'aprovado' ? 'btn-success' : 'btn-primary';
    btnSalvar.textContent = resultado.statusFinal === 'aprovado' ? '⬡ Enviar ao SAP' : '💾 Salvar Pendente';
    btnSalvar.onclick = () => salvarProtocolo(dados, resultado.statusFinal);
    actions.appendChild(btnSalvar);
  }
}

// =============================================
// SALVAR PROTOCOLO
// =============================================

async function salvarProtocolo(dados, status) {
  const btn = document.querySelector('#validation-actions .btn-success, #validation-actions .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    const protocolo = {
      id: gerarId(),
      ...dados,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await API.addProtocolo(protocolo);

    showToast(`Protocolo ${protocolo.id} salvo com sucesso!`, 'success');

    // Reseta e vai para dashboard
    setTimeout(() => {
      navigate('dashboard');
    }, 1200);

  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Tentar novamente'; }
  }
}

// =============================================
// VALIDAÇÃO UI — Renderiza itens na tela
// =============================================

function renderValidationItem(label, status, icon, msg) {
  const list = document.getElementById('validation-list');
  const div = document.createElement('div');
  div.className = 'val-item';
  div.dataset.label = label;
  const delay = list.children.length * 0.08;
  div.style.animationDelay = `${delay}s`;
  div.innerHTML = valItemHTML(icon, label, msg, status);
  list.appendChild(div);
}

function updateValidationItem(label, status, icon, msg) {
  const div = document.querySelector(`[data-label="${label}"]`);
  if (div) div.innerHTML = valItemHTML(icon, label, msg, status);
}

function valItemHTML(icon, label, msg, status) {
  const cls = { ok: 'val-ok', warn: 'val-warn', fail: 'val-fail', loading: 'val-loading' }[status] || '';
  const statusLabel = { ok: 'OK', warn: 'AVISO', fail: 'ERRO', loading: '...' }[status] || '';
  return `
    <span class="val-icon">${icon}</span>
    <div class="val-text">
      <div style="font-weight:600;font-size:0.82rem;margin-bottom:0.2rem">${label}</div>
      <div style="font-size:0.75rem;color:var(--muted);font-family:'JetBrains Mono',monospace">${msg}</div>
    </div>
    <span class="val-status ${cls}">${statusLabel}</span>
  `;
}

// =============================================
// TOAST
// =============================================

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}
