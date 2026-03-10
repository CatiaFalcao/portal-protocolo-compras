// =============================================
// API — Integração com JSONBin
// =============================================

const API = {

  headers() {
    return {
      'Content-Type': 'application/json',
      'X-Master-Key': CONFIG.JSONBIN.API_KEY,
      'X-Bin-Meta': 'false'
    };
  },

  // Lê todos os protocolos do bin
  async getAll() {
    const res = await fetch(`${CONFIG.JSONBIN.BASE_URL}/${CONFIG.JSONBIN.BIN_ID}/latest`, {
      headers: this.headers()
    });
    if (!res.ok) throw new Error(`Erro ao buscar dados: ${res.status}`);
    const data = await res.json();
    return data.record || data;
  },

  // Salva (sobrescreve) todos os protocolos
  async saveAll(record) {
    const res = await fetch(`${CONFIG.JSONBIN.BASE_URL}/${CONFIG.JSONBIN.BIN_ID}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(record)
    });
    if (!res.ok) throw new Error(`Erro ao salvar: ${res.status}`);
    return await res.json();
  },

  // Adiciona um novo protocolo
  async addProtocolo(protocolo) {
    const atual = await this.getAll();
    const lista = atual.protocolos || [];
    lista.push(protocolo);
    await this.saveAll({ protocolos: lista });
    return protocolo;
  },

  // Atualiza status de um protocolo pelo ID
  async updateStatus(id, status, observacao = '') {
    const atual = await this.getAll();
    const lista = atual.protocolos || [];
    const idx = lista.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Protocolo não encontrado');
    lista[idx].status = status;
    lista[idx].updatedAt = new Date().toISOString();
    if (observacao) lista[idx].observacaoGestor = observacao;
    await this.saveAll({ protocolos: lista });
    return lista[idx];
  },

  // Exclui um protocolo pelo ID
  async deleteProtocolo(id) {
    const atual = await this.getAll();
    const lista = (atual.protocolos || []).filter(p => p.id !== id);
    await this.saveAll({ protocolos: lista });
  }

};

// Gera ID único para cada protocolo
function gerarId() {
  const ano = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `PROT-${ano}-${rand}`;
}

// Formata data para exibição
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Formata valor monetário
function formatMoney(val) {
  if (val === undefined || val === null) return '—';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
