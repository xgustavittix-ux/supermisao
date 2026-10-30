// Cliente HTTP seguro para comunicação com o backend Node.js
const API = {
  baseUrl: '/api',

  // Busca dados do painel da criança
  async getDashboard() {
    try {
      const res = await fetch(`${this.baseUrl}/dashboard`);
      if (!res.ok) throw new Error('Falha ao conectar com a base espacial');
      return await res.json();
    } catch (err) {
      console.warn('Usando dados em modo de contingência visual:', err.message);
      return null;
    }
  },

  // Enviar missão para aprovação
  async submitMission(missionId) {
    const res = await fetch(`${this.baseUrl}/missions/${missionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  // Resgatar Recompensa
  async redeemReward(rewardId) {
    const res = await fetch(`${this.baseUrl}/rewards/${rewardId}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  },

  // Obter status e cooldown do diário emocional
  async getEmotionStatus() {
    const res = await fetch(`${this.baseUrl}/emotions/status`);
    return await res.json();
  },

  // Registrar Diário de Bordo Cósmico Completo
  async logEmotion(data) {
    const res = await fetch(`${this.baseUrl}/emotions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Obter estado do companheiro espacial Zupi
  async getPet() {
    try {
      const res = await fetch(`${this.baseUrl}/pet`);
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Interagir com Zupi (water, food, play, pet, sleep)
  async interactWithPet(action) {
    const res = await fetch(`${this.baseUrl}/pet/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    return await res.json();
  },

  // Autenticar com o PIN do responsável
  async verifyPin(pin) {
    const res = await fetch(`${this.baseUrl}/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    return await res.json();
  },

  // Criar Missão Relâmpago / Nova Missão
  async createMission(missionData) {
    const res = await fetch(`${this.baseUrl}/admin/missions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missionData)
    });
    return await res.json();
  },

  // Criar Nova Recompensa
  async createReward(rewardData) {
    const res = await fetch(`${this.baseUrl}/admin/rewards/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rewardData)
    });
    return await res.json();
  },

  // Obter visão geral da central de comando
  async getAdminOverview() {
    const res = await fetch(`${this.baseUrl}/admin/overview`);
    return await res.json();
  },

  // Editar Missão
  async updateMission(id, data) {
    const res = await fetch(`${this.baseUrl}/admin/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Excluir Missão
  async deleteMission(id) {
    const res = await fetch(`${this.baseUrl}/admin/missions/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // Editar Recompensa
  async updateReward(id, data) {
    const res = await fetch(`${this.baseUrl}/admin/rewards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Excluir Recompensa
  async deleteReward(id) {
    const res = await fetch(`${this.baseUrl}/admin/rewards/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  // Decidir missão pendente (approve | return)
  async decideMission(logId, action) {
    const res = await fetch(`${this.baseUrl}/admin/missions/${logId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    return await res.json();
  },

  // Restaurar / Importar Catálogo de Recompensas
  async seedDefaultRewards() {
    const res = await fetch(`${this.baseUrl}/admin/rewards/seed-default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  }
};
