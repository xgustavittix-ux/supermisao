// Lógica de Interface e Interatividade - Gustavix
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Estado Local
  let currentPeriod = 'manha';
  let pinBuffer = '';
  let appData = {
    balance: 0,
    rank: 'Explorador Lunar',
    missions: [],
    rewards: []
  };

  // -------------------------------------------------------------
  // Troca de Abas (Navegação Inferior)
  // -------------------------------------------------------------
  const views = {
    'nav-missions': 'view-missions',
    'nav-shop': 'view-shop',
    'nav-stats': 'view-diary',
    'nav-pet': 'view-pet',
    'nav-admin': 'view-command'
  };

  function switchTab(navId) {
    // Se for o comando dos pais e não estiver autenticado, abre o modal de PIN
    if (navId === 'nav-admin' && !sessionStorage.getItem('parent_auth')) {
      document.getElementById('pin-modal-overlay').classList.add('active');
      pinBuffer = '';
      updatePinDots();
      return;
    }

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(v => v.style.display = 'none');

    const targetNav = document.getElementById(navId);
    if (targetNav) targetNav.classList.add('active');

    const targetView = document.getElementById(views[navId]);
    if (targetView) targetView.style.display = 'block';

    if (navId === 'nav-shop') renderRewards();
    if (navId === 'nav-stats') { /* humor carregado diretamente sem restrição */ }
    if (navId === 'nav-pet') loadPetState();
    if (navId === 'nav-admin') loadCommandOverview();
  }

  document.getElementById('nav-missions').addEventListener('click', () => switchTab('nav-missions'));
  document.getElementById('nav-shop').addEventListener('click', () => switchTab('nav-shop'));
  document.getElementById('nav-stats').addEventListener('click', () => switchTab('nav-stats'));
  document.getElementById('nav-pet').addEventListener('click', () => switchTab('nav-pet'));
  document.getElementById('nav-admin').addEventListener('click', () => switchTab('nav-admin'));

  // -------------------------------------------------------------
  // Carregamento de Dados da API
  // -------------------------------------------------------------
  async function loadDashboard() {
    const data = await API.getDashboard();
    if (data && data.missions && data.missions.length > 0) {
      appData = data;
    }
    document.getElementById('coin-balance').textContent = appData.balance;
    document.getElementById('astronaut-rank').textContent = `${appData.rank} • Nível ${Math.floor(appData.balance / 100) + 1}`;
    const shopBal = document.getElementById('shop-balance-display');
    if (shopBal) shopBal.textContent = appData.balance;

    renderMissions();
    updateAvatarPose();
  }

  // -------------------------------------------------------------
  // Avatar Dinâmico do Gustavitti (3 poses)
  // -------------------------------------------------------------
  const AVATAR_POSES = {
    default:    '/assets/bra%C3%A7o%20cruzado%20com%20sorriso.png',
    thumbsup:   '/assets/fazendo%202%20%20com%20dedo.png',
    peace:      '/assets/paz%20e%20amor.png'
  };

  function updateAvatarPose() {
    const img = document.getElementById('header-avatar-img');
    if (!img) return;
    const balance = appData.balance || 0;
    const approved = (appData.missions || []).filter(m => m.status === 'approved').length;

    let pose = 'default';
    if (balance >= 200 || approved >= 4) pose = 'peace';
    else if (approved >= 2 || balance >= 80) pose = 'thumbsup';

    if (img.src !== location.origin + AVATAR_POSES[pose]) {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = AVATAR_POSES[pose];
        img.style.opacity = '1';
        img.classList.add('bouncing');
        setTimeout(() => img.classList.remove('bouncing'), 600);
      }, 200);
    }
  }

  // Toque no avatar do header = reação divertida
  const headerAvatar = document.getElementById('header-avatar-wrap');
  if (headerAvatar) {
    headerAvatar.addEventListener('click', () => {
      const img = document.getElementById('header-avatar-img');
      img.classList.add('bouncing');
      setTimeout(() => img.classList.remove('bouncing'), 600);
      zupiPlaySound('pet');
    });
  }

  // -------------------------------------------------------------
  // Renderizar Missões
  // -------------------------------------------------------------
  const missionsContainer = document.getElementById('missions-container');
  function renderMissions() {
    const filtered = (appData.missions || []).filter(m => m.period === currentPeriod || m.period === 'qualquer');
    
    if (filtered.length === 0) {
      missionsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">Nenhuma missão para este período.</p>';
      return;
    }

    missionsContainer.innerHTML = filtered.map(m => `
      <div class="mission-item">
        <div class="mission-left">
          <div class="mission-icon">${m.icon}</div>
          <div class="mission-details">
            <h4>${m.title}</h4>
            <span class="tag">${m.category}</span>
            <div class="mission-reward">🪙 +${m.coins} moedas</div>
          </div>
        </div>
        <div>
          ${m.status === 'available' 
            ? `<button class="btn-action" onclick="handleMissionClick('${m.id}')">Concluir</button>`
            : m.status === 'pending'
            ? `<button class="btn-action pending" disabled>Aguardando</button>`
            : `<button class="btn-action completed" disabled>Aprovada</button>`}
        </div>
      </div>
    `).join('');

    updateProgress();
  }

  const updateProgress = () => {
    const total = (appData.missions || []).length;
    if (total === 0) return;
    const completed = appData.missions.filter(m => m.status === 'approved' || m.status === 'pending').length;
    const percent = Math.round((completed / total) * 100);
    document.getElementById('progress-percent').innerText = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;
  };

  // Concluir Missão (Enviar para aprovação) + Som + Celebração
  window.handleMissionClick = async (id) => {
    const mission = appData.missions.find(m => m.id === id);
    if (mission && mission.status === 'available') {
      mission.status = 'pending';

      // Som de sucesso imediato!
      zupiPlaySound('happy');

      // Animação de celebração na barra de progresso
      const fill = document.getElementById('progress-fill');
      if (fill) {
        fill.style.boxShadow = '0 0 20px rgba(0,240,255,0.8)';
        setTimeout(() => { fill.style.boxShadow = ''; }, 1200);
      }

      // Partículas de comemoração flutuam na tela
      spawnCelebrationParticles();

      // Vibração dupla
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);

      renderMissions();
      try {
        await API.submitMission(id);
      } catch (err) {
        console.warn('Erro ao submeter missão:', err);
      }
    }
  };

  function spawnCelebrationParticles() {
    const emojis = ['🌟','⭐','🚀','🪙','✨','🎉'];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position: fixed;
        font-size: ${14 + Math.random() * 16}px;
        left: ${10 + Math.random() * 80}%;
        top: ${20 + Math.random() * 40}%;
        z-index: 9999;
        pointer-events: none;
        animation: celebrate-fly ${0.8 + Math.random() * 0.6}s ease-out forwards;
        --dx: ${(Math.random() - 0.5) * 120}px;
        --dy: ${-(60 + Math.random() * 80)}px;
      `;
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1500);
    }
  }

  // CSS da animação de celebração (inject dinâmico)
  if (!document.getElementById('celebrate-style')) {
    const s = document.createElement('style');
    s.id = 'celebrate-style';
    s.textContent = `
      @keyframes celebrate-fly {
        0%   { transform: translate(0,0) scale(1); opacity: 1; }
        100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }

  // Filtro de Período (Manhã / Noite)
  document.querySelectorAll('.period-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentPeriod = e.target.dataset.period;
      renderMissions();
    });
  });

  // -------------------------------------------------------------
  // Loja de Recompensas
  // -------------------------------------------------------------
  const rewardsContainer = document.getElementById('rewards-container');
  async function renderRewards() {
    rewardsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center;">Carregando vitrine estelar...</p>';
    const rewards = appData.rewards && appData.rewards.length > 0 ? appData.rewards : await API.baseUrl && (await (await fetch('/api/rewards')).json());

    if (!rewards || rewards.length === 0) {
      rewardsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center;">Nenhuma recompensa ativa no momento.</p>';
      return;
    }

    rewardsContainer.innerHTML = rewards.map(r => {
      const canAfford = appData.balance >= r.cost;
      return `
        <div class="mission-item">
          <div class="mission-left">
            <div class="mission-icon">${r.icon || '⭐'}</div>
            <div class="mission-details">
              <h4>${r.title}</h4>
              <span class="tag">${r.category}</span>
              <div class="mission-reward" style="color: var(--color-gold);">⭐ ${r.cost} moedas</div>
            </div>
          </div>
          <div>
            <button class="btn-action" style="${!canAfford ? 'opacity: 0.4; cursor: not-allowed;' : 'border-color: var(--color-gold); color: var(--color-gold);'}" 
              ${!canAfford ? 'disabled' : ''} onclick="handleRedeemReward('${r._id}')">
              ${canAfford ? 'Resgatar' : `Faltam ${r.cost - appData.balance}`}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.handleRedeemReward = async (id) => {
    if (!confirm('Deseja solicitar o resgate desta recompensa para os seus pais?')) return;
    const res = await API.redeemReward(id);
    if (res.error) {
      alert(res.error);
    } else {
      alert('Solicitação de resgate enviada com sucesso para a Central de Comando! 🚀');
      await loadDashboard();
      renderRewards();
    }
  };

  // -------------------------------------------------------------
  // Diário de Bordo Cósmico: Autoconhecimento & Alfabetização Emocional
  // -------------------------------------------------------------
  let selectedDayScore = 'bom';
  let selectedEnergy = 'boa';
  let selectedHeard = 'sim';
  const selectedMoods = new Set();
  const selectedReasons = new Set();
  const selectedNeeds = new Set();

  const counterEl = document.getElementById('selected-counter');
  const saveEmotionBtn = document.getElementById('btn-save-emotion');
  const cooldownBanner = document.getElementById('diary-cooldown-banner');
  const cooldownTimerText = document.getElementById('cooldown-timer-text');

  // Verificar status e cooldown
  async function checkEmotionCooldown() {
    const status = await API.getEmotionStatus();
    if (status && !status.canLog) {
      cooldownBanner.style.display = 'block';
      const hours = Math.floor(status.nextAvailableInMinutes / 60);
      const mins = status.nextAvailableInMinutes % 60;
      cooldownTimerText.textContent = `${hours}h ${mins}min`;
      saveEmotionBtn.disabled = true;
    } else {
      cooldownBanner.style.display = 'none';
    }
  }

  // 1. Seletores dos Três Indicadores Rápidos
  document.querySelectorAll('#day-score-selector .energy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#day-score-selector .energy-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDayScore = btn.dataset.dayscore;
    });
  });

  document.querySelectorAll('#energy-selector .energy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#energy-selector .energy-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedEnergy = btn.dataset.energy;
    });
  });

  document.querySelectorAll('#feeling-heard-selector .energy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#feeling-heard-selector .energy-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedHeard = btn.dataset.heard;
    });
  });

  // 2. Seleção de Emoções (Chips por categoria)
  document.querySelectorAll('.mood-chip:not(.reason-chip):not(.need-chip)').forEach(chip => {
    chip.addEventListener('click', () => {
      const mood = chip.dataset.mood;
      if (selectedMoods.has(mood)) {
        selectedMoods.delete(mood);
        chip.classList.remove('selected');
      } else {
        selectedMoods.add(mood);
        chip.classList.add('selected');
      }
      const count = selectedMoods.size;
      counterEl.textContent = `${count} emoção(ões) selecionada(s)`;
      saveEmotionBtn.disabled = count === 0;
    });
  });

  // 3. Seleção de Motivos (O que aconteceu?)
  document.querySelectorAll('.reason-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const reason = chip.dataset.reason;
      if (selectedReasons.has(reason)) {
        selectedReasons.delete(reason);
        chip.classList.remove('selected');
      } else {
        selectedReasons.add(reason);
        chip.classList.add('selected');
      }
    });
  });

  // 4. Seleção de Necessidades (Do que você precisa agora?)
  document.querySelectorAll('.need-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const need = chip.dataset.need;
      if (selectedNeeds.has(need)) {
        selectedNeeds.delete(need);
        chip.classList.remove('selected');
      } else {
        selectedNeeds.add(need);
        chip.classList.add('selected');
      }
    });
  });

  // 5. Salvar Diário de Bordo
  saveEmotionBtn.addEventListener('click', async () => {
    if (selectedMoods.size === 0) return;
    saveEmotionBtn.disabled = true;
    saveEmotionBtn.textContent = 'Sincronizando com as estrelas...';

    const goodThingInput = document.getElementById('input-good-thing');
    const goodThing = goodThingInput ? goodThingInput.value.trim() : '';

    const payload = {
      dayScore: selectedDayScore,
      energyLevel: selectedEnergy,
      feelingHeard: selectedHeard,
      moods: Array.from(selectedMoods),
      reasons: Array.from(selectedReasons),
      needs: Array.from(selectedNeeds),
      goodThing
    };

    const res = await API.logEmotion(payload);
    if (res.error) {
      alert(res.error);
      saveEmotionBtn.textContent = 'Registrar no Diário de Humor 🚀';
    } else {
      saveEmotionBtn.textContent = 'Gravado no Diário de Humor! 🚀🌟';
      setTimeout(() => {
        saveEmotionBtn.textContent = 'Registrar no Diário de Humor 🚀';
        saveEmotionBtn.disabled = false;
      }, 2000);
    }
  });

  // Histórico Exclusivo dos Pais na Central de Comando
  async function loadEmotionHistory() {
    const status = await API.getEmotionStatus();
    const historyList = document.getElementById('emotions-history-list');
    if (!historyList) return;

    if (!status || !status.history || status.history.length === 0) {
      historyList.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 10px;">Nenhum registro anterior encontrado.</p>';
      return;
    }

    historyList.innerHTML = status.history.map(item => {
      const date = new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const dayIcons = { otimo: '🤩 Incrível', bom: '🙂 Legal', neutro: '😐 Normal', dificil: '😕 Chato', ruim: '😞 Difícil' };
      const energyIcons = { maxima: '☀️ Máxima', boa: '🚀 Boa', media: '🔋 Média', baixa: '💤 Baixa', esgotada: '🪫 Zero' };

      return `
        <div class="mission-item" style="padding: 12px; flex-direction: column; align-items: stretch; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 13px; color: var(--color-cyan);">${date}</strong>
            <span class="tag">${dayIcons[item.dayScore] || item.dayScore}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-primary); margin-top: 2px;">
            ⚡ <strong>Energia:</strong> ${energyIcons[item.energyLevel] || item.energyLevel} • 💚 <strong>Sentiu-se acolhido:</strong> ${item.feelingHeard || 'Sim'}
          </div>
          <div style="font-size: 12px; color: var(--color-gold); margin-top: 2px;">
            🌌 <strong>Emoções:</strong> ${item.moods.join(', ')}
          </div>
          ${item.reasons && item.reasons.length > 0 ? `<div style="font-size: 11px; color: var(--text-secondary);">🪐 <strong>Contexto:</strong> ${item.reasons.join(', ')}</div>` : ''}
          ${item.needs && item.needs.length > 0 ? `<div style="font-size: 11px; color: #A78BFA;">🛸 <strong>Precisa de:</strong> ${item.needs.join(', ')}</div>` : ''}
          ${item.goodThing ? `<div style="font-size: 11px; color: #34D399; font-style: italic; margin-top: 2px;">🌟 "${item.goodThing}"</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // -------------------------------------------------------------
  // Companheiro Virtual Espacial: Zupi (VERSÃO TURBINADA)
  // -------------------------------------------------------------
  let petData = null;

  // --- Motor de Sons (Web Audio API) ---
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function zupiPlaySound(type) {
    try {
      const ctx = getAudioCtx();
      const sounds = {
        water:   () => { playTone(ctx, 880, 0.08, 'sine',     0, 0.1); playTone(ctx, 1046, 0.06, 'sine', 0.08, 0.1); },
        food:    () => { [523, 659, 784].forEach((f,i) => playTone(ctx, f, 0.07, 'triangle', i*0.08, 0.15)); },
        play:    () => { [392, 523, 659, 784].forEach((f,i) => playTone(ctx, f, 0.08, 'square',   i*0.06, 0.1)); },
        pet:     () => { [523, 659, 784, 1047].forEach((f,i) => playTone(ctx, f, 0.06, 'sine',    i*0.07, 0.18)); },
        sleep:   () => { playTone(ctx, 330, 0.06, 'sine', 0, 0.4); playTone(ctx, 220, 0.04, 'sine', 0.35, 0.5); },
        sing:    () => { [523,659,784,880,784,659,523].forEach((f,i) => playTone(ctx, f, 0.06, 'sine', i*0.1, 0.18)); },
        explore: () => { playTone(ctx, 440, 0.05, 'sawtooth', 0, 0.05); playTone(ctx, 880, 0.07, 'sine', 0.05, 0.2); playTone(ctx, 1320, 0.05, 'sine', 0.2, 0.15); },
        happy:   () => { [784, 1047].forEach((f,i) => playTone(ctx, f, 0.07, 'sine', i*0.1, 0.15)); }
      };
      if (sounds[type]) sounds[type]();
    } catch(e) { /* silencia se bloqueado */ }
  }

  function playTone(ctx, freq, vol, type, startDelay, duration) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration + 0.05);
  }

  // --- Partículas de Reação ---
  const PARTICLES = {
    water:   ['💧','🌊','💦'],
    food:    ['🍎','😋','⭐'],
    play:    ['🎮','⚡','✨'],
    pet:     ['💜','💖','✨'],
    sleep:   ['💤','🌙','⭐'],
    sing:    ['🎵','🎶','✨'],
    explore: ['🚀','⭐','🌌'],
    exercise:['💪','🔥','⚡'],
    happy:   ['🎉','⭐','✨']
  };

  function spawnParticles(action) {
    const container = document.getElementById('zupi-particles');
    if (!container) return;
    const emojis = PARTICLES[action] || ['✨'];
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('span');
      p.className = 'zupi-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.random() * 360) * Math.PI / 180;
      const dist  = 50 + Math.random() * 50;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
      p.style.left = `${40 + Math.random() * 20}%`;
      p.style.top  = `${40 + Math.random() * 20}%`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }

  // --- Frases Contextuais do Zupi ---
  const ZUPI_PHRASES = {
    happy:     ['Estou no auge da felicidade! 🚀','Tô voando de alegria! ✨','Com você tudo fica mais legal! 💖'],
    thirsty:   ['Hmm... preciso de água! 💧','Estou com sede, Gustavitti! 💦','Hidratação é poder! 💧🚀'],
    hungry:    ['Meu estômago está roncando! 🍎','Missão: comer algo gostoso! 🌟','Com fome não tem como explorar! 🍕'],
    tired:     ['ZzzZzz... preciso descansar 🌙','Minha energia está baixa... 🪫','Um cochilo rápido e volto voando! 💤'],
    lonely:    ['Cadê o Gustavitti? Tô com saudade! 💜','Me dá um carinho! 🥺','Faz tempo que não brincamos! 🎮'],
    excited:   ['VAMOS EXPLORAR O COSMOS! 🚀🌌','Hoje é dia de aventura! ⚡','Topei qualquer missão! 💪'],
    water:     ['Aaah, que delícia! 💧','Agora sim, hidratado e pronto! 🌊','Missão de hidratação: cumprida! ✅'],
    food:      ['Que gostoso! Obrigado! 😋','Minha bateria recarregou! ⚡','Astronauta bem alimentado! 🚀'],
    play:      ['ISSO SIM É BRINCAR! 🎮','Tô na adrenalina! ⚡','Missão diversão: INICIADA! 🕹️'],
    pet:       ['Ahhh... carinho demais! 💖','Meu coração disparou! 💗','Você é o melhor! 🌟'],
    sleep:     ['Boa noite, cosmos... 🌙','Zzz... recarregando... 💤','Vejo você nos sonhos! ⭐'],
    sing:      ['🎵 Lá lá lá lá lá! 🎶','Vamos cantar no espaço! 🎤','Música no cosmos! 🌌🎵'],
    explore:   ['DECOLAGEM INICIADA! 🚀','Rumo às estrelas! 🌌','Novo planeta descoberto! ⭐'],
    exercise:  ['SENTINDO O BURN! 🔥','Atividade física: modo ON! 💪','Astronauta em forma! 🏃']
  };

  const ZUPI_MOODS = {
    happy:    '😄 Feliz e animado!',
    thirsty:  '💧 Com sede!',
    hungry:   '🍎 Com fome!',
    tired:    '😴 Cansado...',
    lonely:   '🥺 Com saudade!',
    excited:  '🚀 Animadíssimo!',
    sad:      '😢 Um pouco triste...',
    ok:       '😊 Tudo bem!'
  };

  const ZUPI_TIPS = [
    'Complete missões para deixar o Zupi mais feliz! 🚀',
    'Toque no Zupi para dar carinho espontâneo! 💜',
    'O Zupi fica triste se ficar muito tempo sem atenção! 🥺',
    'Ative as notificações para o Zupi te chamar! 🔔',
    'Explore o cosmos junto com o Zupi! 🌌',
    'Quanto mais missões, mais o amor do Zupi cresce! ❤️'
  ];

  function getZupiMoodKey(pet) {
    if (!pet) return 'ok';
    if (pet.hydration < 25) return 'thirsty';
    if (pet.hunger > 80)   return 'hungry';
    if (pet.energy < 20)   return 'tired';
    if (pet.attention < 25) return 'lonely';
    if (pet.happiness >= 85) return 'excited';
    if (pet.happiness >= 65) return 'happy';
    if (pet.happiness < 35) return 'sad';
    return 'ok';
  }

  function getRandomPhrase(key) {
    const list = ZUPI_PHRASES[key] || ZUPI_PHRASES.happy;
    return list[Math.floor(Math.random() * list.length)];
  }

  function rotateTip() {
    const tipEl = document.getElementById('zupi-tip-text');
    if (!tipEl) return;
    tipEl.style.opacity = '0';
    setTimeout(() => {
      tipEl.textContent = ZUPI_TIPS[Math.floor(Math.random() * ZUPI_TIPS.length)];
      tipEl.style.opacity = '1';
    }, 300);
  }

  // --- Carregar Estado do Zupi ---
  const ZUPI_AVATAR_POSES = {
    excited:  '/assets/paz%20e%20amor.png',
    happy:    '/assets/fazendo%202%20%20com%20dedo.png',
    ok:       '/assets/bra%C3%A7o%20cruzado%20com%20sorriso.png',
    thirsty:  '/assets/bra%C3%A7o%20cruzado%20com%20sorriso.png',
    hungry:   '/assets/bra%C3%A7o%20cruzado%20com%20sorriso.png',
    tired:    '/assets/bra%C3%A7o%20cruzado%20com%20sorriso.png',
    lonely:   '/assets/bra%C3%A7o%20cruzado%20com%20sorriso.png',
    sad:      '/assets/bra%C3%A7o%20cruzado%20com%20sorriso.png'
  };

  function updateZupiAvatarPose(moodKey) {
    const img = document.getElementById('zupi-avatar-img');
    if (!img) return;
    const newSrc = ZUPI_AVATAR_POSES[moodKey] || ZUPI_AVATAR_POSES.ok;
    if (img.src !== location.origin + newSrc) {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = newSrc;
        img.style.opacity = '1';
      }, 250);
    }
  }

  async function loadPetState() {
    petData = await API.getPet();
    if (!petData) return;

    const moodKey = getZupiMoodKey(petData);

    // Pose do avatar
    updateZupiAvatarPose(moodKey);

    // Nome
    document.getElementById('pet-name').textContent = petData.name || 'Zupi';

    // Frase contextual
    const thoughtEl = document.getElementById('pet-thought-text');
    if (thoughtEl) thoughtEl.textContent = `"${getRandomPhrase(moodKey)}"`;

    // Mood tag
    const moodTag = document.getElementById('zupi-mood-tag');
    if (moodTag) {
      moodTag.textContent = ZUPI_MOODS[moodKey] || '😊 Tudo bem!';
      moodTag.style.color = moodKey === 'excited' ? 'var(--color-gold)'
        : moodKey === 'happy' ? 'var(--color-cyan)'
        : moodKey === 'lonely' || moodKey === 'sad' ? '#F472B6'
        : 'var(--text-secondary)';
    }

    // Badge de amor (média dos stats)
    const love = Math.round((petData.happiness + petData.energy + petData.hydration + (100 - petData.hunger) + petData.attention) / 5);
    const loveBadge = document.getElementById('zupi-love-badge');
    if (loveBadge) {
      loveBadge.textContent = `❤️ Amor: ${love}%`;
      loveBadge.style.color = love >= 70 ? '#F472B6' : love >= 40 ? 'var(--color-gold)' : '#EF4444';
    }

    // Barras de necessidades
    document.getElementById('pet-happiness-val').textContent = `${petData.happiness}%`;
    document.getElementById('pet-energy-val').textContent    = `${petData.energy}%`;
    document.getElementById('pet-hydration-val').textContent = `${petData.hydration}%`;
    document.getElementById('pet-hunger-val').textContent    = `${Math.max(0, 100 - petData.hunger)}%`;
    document.getElementById('pet-attention-val').textContent = `${petData.attention}%`;

    document.getElementById('pet-happiness-bar').style.width = `${petData.happiness}%`;
    document.getElementById('pet-energy-bar').style.width    = `${petData.energy}%`;
    document.getElementById('pet-hydration-bar').style.width = `${petData.hydration}%`;
    document.getElementById('pet-hunger-bar').style.width    = `${Math.max(0, 100 - petData.hunger)}%`;
    document.getElementById('pet-attention-bar').style.width = `${petData.attention}%`;
  }

  // --- Interações com Zupi ---
  document.querySelectorAll('.pet-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const avatarImg = document.getElementById('zupi-avatar-img');

      // Som imediato
      zupiPlaySound(btn.dataset.sound || action);

      // Partículas visuais
      spawnParticles(action);

      // Animação na imagem do avatar
      if (avatarImg) {
        avatarImg.classList.add('reacting');
        setTimeout(() => avatarImg.classList.remove('reacting'), 550);
      }

      // Frase imediata
      const thoughtEl = document.getElementById('pet-thought-text');
      if (thoughtEl) thoughtEl.textContent = `"${getRandomPhrase(action)}"`;

      // Vibração háptica (se mobile suportar)
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

      const res = await API.interactWithPet(action);
      if (res && res.pet) {
        petData = res.pet;
        loadPetState();
      }
    });
  });

  // Toque direto no Avatar = carinho espontâneo
  const petAvatarEl = document.getElementById('pet-avatar-container');
  if (petAvatarEl) {
    petAvatarEl.addEventListener('click', async () => {
      zupiPlaySound('pet');
      spawnParticles('pet');
      if (navigator.vibrate) navigator.vibrate(50);
      const avatarImg = document.getElementById('zupi-avatar-img');
      if (avatarImg) {
        avatarImg.classList.add('reacting');
        setTimeout(() => avatarImg.classList.remove('reacting'), 550);
      }
      const res = await API.interactWithPet('pet');
      if (res && res.pet) { petData = res.pet; loadPetState(); }
    });
  }

  // Rotacionar dicas a cada 8s quando na aba do Zupi
  setInterval(() => {
    if (document.getElementById('view-pet').style.display !== 'none') rotateTip();
  }, 8000);

  // --- Notificações Push: sempre ativas por padrão (apenas pais podem desativar) ---
  function areNotificationsEnabledByParent() {
    return localStorage.getItem('parent_notifications_enabled') !== 'false';
  }

  async function initNotifications() {
    if (!('Notification' in window)) return;
    if (!areNotificationsEnabledByParent()) return;

    if (Notification.permission === 'default') {
      setTimeout(async () => {
        try {
          await Notification.requestPermission();
        } catch(e) {}
      }, 2500);
    }
  }
  initNotifications();

  // Notificação periódica do Zupi (a cada 25min se precisar de atenção e permitido pelos pais)
  setInterval(() => {
    if (!areNotificationsEnabledByParent()) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!petData) return;
    const moodKey = getZupiMoodKey(petData);
    const needsAttention = petData.hydration < 30 || petData.hunger > 75 || petData.attention < 30;
    if (needsAttention) {
      new Notification('Zupi precisa de você! 👾', {
        body: getRandomPhrase(moodKey),
        icon: '/assets/icon-192.png'
      });
    }
  }, 25 * 60 * 1000);

  // -------------------------------------------------------------
  // Central de Comando (PIN e Ações Administrativas)
  // -------------------------------------------------------------
  const pinModal = document.getElementById('pin-modal-overlay');

  const updatePinDots = () => {
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) {
        if (i <= pinBuffer.length) dot.classList.add('filled');
        else dot.classList.remove('filled');
      }
    }
  };

  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.key;
      if (key === 'cancel') {
        pinModal.classList.remove('active');
        pinBuffer = '';
      } else if (key === 'backspace') {
        pinBuffer = pinBuffer.slice(0, -1);
      } else if (pinBuffer.length < 4) {
        pinBuffer += key;
        if (pinBuffer.length === 4) {
          const res = await API.verifyPin(pinBuffer);
          if (res.success) {
            sessionStorage.setItem('parent_auth', 'true');
            pinModal.classList.remove('active');
            pinBuffer = '';
            updatePinDots();
            switchTab('nav-admin');
          } else {
            alert(res.error || 'PIN incorreto. Tente novamente.');
            pinBuffer = '';
            updatePinDots();
          }
        }
      }
      updatePinDots();
    });
  });

  document.getElementById('btn-logout-command').addEventListener('click', () => {
    sessionStorage.removeItem('parent_auth');
    switchTab('nav-missions');
  });

  async function loadCommandOverview() {
    const overview = await API.getAdminOverview();
    const pendingMissionsEl = document.getElementById('command-pending-missions');
    const pendingRewardsEl = document.getElementById('command-pending-rewards');
    const ledgerEl = document.getElementById('command-ledger');

    // Missões Pendentes
    if (!overview || !overview.pendingMissions || overview.pendingMissions.length === 0) {
      pendingMissionsEl.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 15px;">Nenhuma missão pendente de aprovação. 🚀</p>';
    } else {
      pendingMissionsEl.innerHTML = overview.pendingMissions.map(log => `
        <div class="mission-item">
          <div class="mission-left">
            <div class="mission-icon">🛰️</div>
            <div class="mission-details">
              <h4>${log.missionId?.title || 'Missão'}</h4>
              <div class="mission-reward">🪙 +${log.missionId?.coins || 0} moedas</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-action" style="background: rgba(16, 185, 129, 0.2); border-color: var(--color-success); color: var(--color-success);" onclick="handleDecideMission('${log._id}', 'approve')">Aprovar</button>
            <button class="btn-action" style="border-color: var(--text-muted); color: var(--text-muted);" onclick="handleDecideMission('${log._id}', 'return')">Devolver</button>
          </div>
        </div>
      `).join('');
    }

    // Resgates Pendentes
    if (!overview || !overview.pendingRedemptions || overview.pendingRedemptions.length === 0) {
      pendingRewardsEl.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 15px;">Nenhum resgate pendente.</p>';
    } else {
      pendingRewardsEl.innerHTML = overview.pendingRedemptions.map(r => `
        <div class="mission-item">
          <div class="mission-left">
            <div class="mission-icon">🎁</div>
            <div class="mission-details">
              <h4>${r.rewardId?.title || 'Recompensa'}</h4>
              <div class="mission-reward">Custo: ${r.costAtRedemption} moedas</div>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Extrato de Moedas
    if (!overview || !overview.recentTransactions || overview.recentTransactions.length === 0) {
      ledgerEl.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 15px;">Nenhuma movimentação registrada.</p>';
    } else {
      ledgerEl.innerHTML = overview.recentTransactions.map(t => {
        const isCredit = t.type === 'credito' || t.type === 'estorno';
        return `
          <div class="mission-item" style="padding: 10px 14px;">
            <div class="mission-details">
              <h4 style="font-size: 13px;">${t.reason}</h4>
              <span class="tag">${new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <span style="font-weight: 800; font-size: 14px; color: ${isCredit ? 'var(--color-gold)' : 'var(--color-danger)'};">
              ${isCredit ? '+' : '-'}${t.amount} 🪙
            </span>
          </div>
        `;
      }).join('');
    }

    // Gerenciar e Editar Missões Ativas
    const manageMissionsEl = document.getElementById('command-manage-missions-list');
    if (manageMissionsEl && appData.missions) {
      manageMissionsEl.innerHTML = appData.missions.map(m => `
        <div class="mission-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 13px;">${m.icon} ${m.title}</strong>
            <button class="btn-action" style="padding: 2px 8px; font-size: 10px; border-color: var(--color-danger); color: var(--color-danger);" onclick="handleDeleteMission('${m.id}')">Excluir</button>
          </div>
          <div style="display: flex; gap: 6px;">
            <select id="edit-period-${m.id}" style="flex: 1; background: var(--bg-cosmos); border: 1px solid var(--border-subtle); color: var(--text-primary); padding: 4px; border-radius: var(--radius-sm); font-size: 11px;">
              <option value="manha" ${m.period === 'manha' ? 'selected' : ''}>☀️ Manhã</option>
              <option value="tarde" ${m.period === 'tarde' ? 'selected' : ''}>🎒 Tarde</option>
              <option value="noite" ${m.period === 'noite' ? 'selected' : ''}>🌙 Noite</option>
              <option value="qualquer" ${m.period === 'qualquer' ? 'selected' : ''}>Qualquer</option>
            </select>
            <input type="number" id="edit-coins-${m.id}" value="${m.coins}" style="width: 70px; background: var(--bg-cosmos); border: 1px solid var(--border-subtle); color: var(--text-primary); padding: 4px; border-radius: var(--radius-sm); font-size: 11px;">
            <button class="btn-action" style="padding: 4px 10px; font-size: 11px;" onclick="handleSaveMission('${m.id}', '${m.title}', '${m.category}')">Salvar</button>
          </div>
        </div>
      `).join('');
    }

    // Gerenciar e Editar Recompensas da Loja
    const manageRewardsEl = document.getElementById('command-manage-rewards-list');
    if (manageRewardsEl) {
      const rewards = appData.rewards && appData.rewards.length > 0 ? appData.rewards : await (await fetch('/api/rewards')).json();
      manageRewardsEl.innerHTML = (rewards || []).map(r => `
        <div class="mission-item" style="flex-direction: column; align-items: stretch; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 13px;">${r.icon || '⭐'} ${r.title}</strong>
            <button class="btn-action" style="padding: 2px 8px; font-size: 10px; border-color: var(--color-danger); color: var(--color-danger);" onclick="handleDeleteReward('${r._id}')">Excluir</button>
          </div>
          <div style="display: flex; gap: 6px;">
            <input type="text" id="edit-reward-title-${r._id}" value="${r.title}" style="flex: 1; background: var(--bg-cosmos); border: 1px solid var(--border-subtle); color: var(--text-primary); padding: 4px; border-radius: var(--radius-sm); font-size: 11px;">
            <input type="number" id="edit-reward-cost-${r._id}" value="${r.cost}" style="width: 80px; background: var(--bg-cosmos); border: 1px solid var(--border-subtle); color: var(--text-primary); padding: 4px; border-radius: var(--radius-sm); font-size: 11px;">
            <button class="btn-action" style="padding: 4px 10px; font-size: 11px; border-color: var(--color-gold); color: var(--color-gold);" onclick="handleSaveReward('${r._id}', '${r.category}')">Salvar</button>
          </div>
        </div>
      `).join('');
    }

    // Histórico Emocional na Central de Comando
    loadEmotionHistory();
  }

  // Handlers de Edição de Missões
  window.handleSaveMission = async (id, title, category) => {
    const period = document.getElementById(`edit-period-${id}`).value;
    const coins = document.getElementById(`edit-coins-${id}`).value;
    await API.updateMission(id, { title, period, coins, category });
    alert('Missão atualizada com sucesso! 🚀');
    await loadDashboard();
    loadCommandOverview();
  };

  window.handleDeleteMission = async (id) => {
    if (!confirm('Deseja realmente remover esta missão?')) return;
    await API.deleteMission(id);
    await loadDashboard();
    loadCommandOverview();
  };

  // Handlers de Edição de Recompensas
  window.handleSaveReward = async (id, category) => {
    const title = document.getElementById(`edit-reward-title-${id}`).value;
    const cost = document.getElementById(`edit-reward-cost-${id}`).value;
    await API.updateReward(id, { title, cost, category });
    alert('Recompensa atualizada com sucesso! ⭐');
    await loadDashboard();
    renderRewards();
    loadCommandOverview();
  };

  window.handleDeleteReward = async (id) => {
    if (!confirm('Deseja realmente remover esta recompensa da loja?')) return;
    await API.deleteReward(id);
    await loadDashboard();
    renderRewards();
    loadCommandOverview();
  };

  // Criar Missão Relâmpago Instantânea
  document.getElementById('btn-create-flash-mission').addEventListener('click', async () => {
    const titleInput = document.getElementById('input-flash-title');
    const periodSelect = document.getElementById('select-flash-period');
    const coinsInput = document.getElementById('input-flash-coins');

    const title = titleInput.value.trim();
    const period = periodSelect.value;
    const coins = coinsInput.value.trim();

    if (!title || !coins) {
      alert('Por favor, digite o nome da missão e a quantidade de moedas.');
      return;
    }

    const res = await API.createMission({
      title,
      period,
      coins: Number(coins),
      category: 'Missão Relâmpago ⚡',
      icon: '⚡'
    });

    if (res.success) {
      alert(`Missão Relâmpago "${title}" lançada com sucesso no painel de Gustavitti! ⚡`);
      titleInput.value = '';
      coinsInput.value = '';
      await loadDashboard();
    } else {
      alert(res.error || 'Erro ao lançar missão relâmpago');
    }
  });

  // Cadastrar Nova Recompensa na Loja
  document.getElementById('btn-create-reward').addEventListener('click', async () => {
    const titleInput = document.getElementById('input-reward-title');
    const categorySelect = document.getElementById('select-reward-category');
    const costInput = document.getElementById('input-reward-cost');

    const title = titleInput.value.trim();
    const category = categorySelect.value;
    const cost = costInput.value.trim();

    if (!title || !cost) {
      alert('Por favor, digite o nome e o custo em moedas da recompensa.');
      return;
    }

    const res = await API.createReward({
      title,
      category,
      cost: Number(cost),
      icon: category === 'Presente' ? '🎁' : category === 'Passeio' ? '🎡' : category === 'Atividade' ? '🎮' : '⭐'
    });

    if (res.success) {
      alert(`Recompensa "${title}" adicionada com sucesso na loja! ⭐`);
      titleInput.value = '';
      costInput.value = '';
      await loadDashboard();
      renderRewards();
    } else {
      alert(res.error || 'Erro ao criar recompensa');
    }
  });

  window.handleDecideMission = async (logId, action) => {
    await API.decideMission(logId, action);
    await loadDashboard();
    loadCommandOverview();
  };

  // Restaurar / Importar Recompensas Sugeridas (18 itens)
  const btnSeedRewards = document.getElementById('btn-seed-rewards');
  if (btnSeedRewards) {
    btnSeedRewards.addEventListener('click', async () => {
      btnSeedRewards.disabled = true;
      btnSeedRewards.textContent = 'Carregando...';
      const res = await API.seedDefaultRewards();
      alert(res.message || 'Catálogo de sugestões sincronizado com sucesso! ⭐');
      btnSeedRewards.disabled = false;
      btnSeedRewards.textContent = '✨ Restaurar Sugestões';
      await loadDashboard();
      renderRewards();
      loadCommandOverview();
    });
  }

  // Controle de Notificações Exclusivo dos Pais
  function updateParentNotificationUI() {
    const isEnabled = areNotificationsEnabledByParent();
    const statusText = document.getElementById('parent-notif-status-text');
    const permText = document.getElementById('parent-notif-perm-text');
    const toggleBtn = document.getElementById('btn-toggle-parent-notif');

    if (statusText) {
      statusText.textContent = isEnabled ? 'Notificações: Ativadas ✅' : 'Notificações: Desativadas ⏸️';
      statusText.style.color = isEnabled ? 'var(--color-success)' : 'var(--text-muted)';
    }

    if (toggleBtn) {
      toggleBtn.textContent = isEnabled ? 'Desativar' : 'Ativar';
      toggleBtn.style.borderColor = isEnabled ? 'var(--color-danger)' : 'var(--color-success)';
      toggleBtn.style.color = isEnabled ? 'var(--color-danger)' : 'var(--color-success)';
    }

    if (permText) {
      if (!('Notification' in window)) {
        permText.textContent = 'Navegador não suporta notificações.';
      } else if (Notification.permission === 'granted') {
        permText.textContent = 'Permissão no navegador: Concedida 🔔';
      } else if (Notification.permission === 'denied') {
        permText.textContent = 'Permissão no navegador: Bloqueada nas configurações do celular/PC.';
      } else {
        permText.textContent = 'Permissão no navegador: Pendente de autorização.';
      }
    }
  }

  const toggleNotifBtn = document.getElementById('btn-toggle-parent-notif');
  if (toggleNotifBtn) {
    toggleNotifBtn.addEventListener('click', () => {
      const current = areNotificationsEnabledByParent();
      localStorage.setItem('parent_notifications_enabled', current ? 'false' : 'true');
      updateParentNotificationUI();
    });
  }

  const testNotifBtn = document.getElementById('btn-test-notif');
  if (testNotifBtn) {
    testNotifBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        alert('Este dispositivo/navegador não suporta notificações push.');
        return;
      }

      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        updateParentNotificationUI();
        if (perm !== 'granted') {
          alert('Permissão de notificação negada ou não autorizada pelo navegador.');
          return;
        }
      }

      new Notification('Zupi • Central de Teste 🚀', {
        body: 'O canal de notificações está ativo e conectado com Gustavitti! ✨',
        icon: '/assets/icon-192.png'
      });
      zupiPlaySound('happy');
    });
  }

  // Chamar atualização de notificações na Central de Comando
  const originalLoadCommandOverview = loadCommandOverview;
  loadCommandOverview = async function() {
    await originalLoadCommandOverview();
    updateParentNotificationUI();
  };

  // Inicialização Geral
  loadDashboard();
});
