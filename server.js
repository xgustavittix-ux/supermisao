require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Conexão Resiliente com o MongoDB Atlas
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('gustavix_pass')) {
    console.log('⚡ MONGODB_URI não configurado ou em modo demo. Operando em contingência local até você plugar sua URI do Atlas.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('🌌 Conectado com sucesso ao MongoDB Atlas!');
    await seedInitialData();
  } catch (err) {
    console.error('⚠️ Erro ao conectar ao MongoDB Atlas:', err.message);
  }
};

const { Mission, MissionLog, Reward, RewardRedemption, User, Transaction, EmotionalLog, Pet, AlertMessage } = require('./src/models');

// Seed Idempotente (Nunca sobrescreve se já houver dados)
const seedInitialData = async () => {
  try {
    const missionCount = await Mission.countDocuments();
    if (missionCount === 0) {
      console.log('🌱 Inicializando missões padrão calibradas no MongoDB Atlas...');
      await Mission.insertMany([
        { title: 'Arrumar a cama estelar', category: 'Organização', period: 'manha', coins: 2, icon: '🛏️' },
        { title: 'Higiene bucal do explorador', category: 'Higiene', period: 'manha', coins: 2, icon: '🪥' },
        { title: 'Conferir mochila e uniforme escolar', category: 'Escola', period: 'manha', coins: 3, icon: '🎒' },
        { title: 'Lição de casa do dia', category: 'Deveres', period: 'noite', coins: 8, icon: '📝' },
        { title: 'Leitura espacial de 20 minutos', category: 'Leitura', period: 'noite', coins: 5, icon: '📖' },
        { title: 'Colaborar na arrumação do quarto', category: 'Colaboração', period: 'noite', coins: 3, icon: '🚀' }
      ]);
    }

    const rewardCount = await Reward.countDocuments();
    if (rewardCount === 0) {
      console.log('🌱 Inicializando catálogo de recompensas calibrado no MongoDB Atlas...');
      await Reward.insertMany([
        // Pequenas (30-80 moedas)
        { title: 'Escolher a sobremesa do dia', category: 'Privilégio', cost: 30, icon: '🍦' },
        { title: 'Ficar acordado 30 min a mais', category: 'Privilégio', cost: 40, icon: '⏰' },
        { title: 'Escolher o cardápio do jantar', category: 'Privilégio', cost: 50, icon: '🍕' },
        { title: 'Usar o celular/tablet por 1h extra', category: 'Atividade', cost: 60, icon: '📱' },
        { title: 'Um abraço + história antes de dormir', category: 'Privilégio', cost: 30, icon: '🤗' },
        // Médias (100-300 moedas)
        { title: 'Escolher o filme da noite em família', category: 'Privilégio', cost: 120, icon: '🎬' },
        { title: 'Noite de jogos / 1h de videogame extra', category: 'Atividade', cost: 200, icon: '🎮' },
        { title: 'Pedir comida especial (pizza, hambúrguer)', category: 'Privilégio', cost: 180, icon: '🍔' },
        { title: 'Dormir na casa de um amigo', category: 'Atividade', cost: 250, icon: '🏕️' },
        { title: 'Ir ao cinema escolher o filme', category: 'Atividade', cost: 300, icon: '🎥' },
        { title: 'Tarde livre sem tarefas (aprovado pelos pais)', category: 'Privilégio', cost: 200, icon: '🌴' },
        { title: 'Montar o próprio lanche especial', category: 'Privilégio', cost: 80, icon: '🥪' },
        // Grandes (400-1500 moedas)
        { title: 'Passeio especial no fim de semana (escolha!)', category: 'Passeio', cost: 450, icon: '🎡' },
        { title: 'Ir ao parque aquático ou de diversões', category: 'Passeio', cost: 700, icon: '🎢' },
        { title: 'Brinquedo ou item desejado (combinado)', category: 'Presente', cost: 1000, icon: '🎁' },
        { title: 'Jogo novo para videogame', category: 'Presente', cost: 800, icon: '🕹️' },
        { title: 'Livro, quadrinho ou mangá favorito', category: 'Presente', cost: 150, icon: '📚' },
        { title: 'Viagem ou passeio grande (decisão da família)', category: 'Passeio', cost: 1500, icon: '✈️' },
      ]);
    }

    const petCount = await Pet.countDocuments();
    if (petCount === 0) {
      console.log('🌱 Inicializando companheiro espacial Zupi no MongoDB Atlas...');
      await Pet.create({
        name: 'Zupi',
        avatar: '👾',
        happiness: 85,
        energy: 75,
        hydration: 60,
        hunger: 40,
        attention: 65,
        currentThought: 'Oi, Gustavitti! Vamos explorar o cosmos hoje? 🚀'
      });
    }
  } catch (err) {
    console.warn('Nota sobre o seed:', err.message);
  }
};

// -------------------------------------------------------------
// ROTAS DA API REST
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Gustavix - Super Missões Gustavitti',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'standby',
    timestamp: new Date().toISOString()
  });
});

// Painel do Astronauta: Saldo, Missões e Status
app.get('/api/dashboard', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ balance: 0, rank: 'Explorador Lunar', missions: [], rewards: [] });
    }

    // Calcular saldo somando créditos e subtraindo resgates
    const txs = await Transaction.find({});
    let balance = 0;
    txs.forEach(t => {
      if (t.type === 'credito' || t.type === 'estorno') balance += t.amount;
      if (t.type === 'resgate') balance -= t.amount;
    });

    const missions = await Mission.find({ active: true });
    const pendingLogs = await MissionLog.find({ status: { $in: ['pending', 'approved'] } });
    const pendingMap = {};
    pendingLogs.forEach(l => { pendingMap[l.missionId.toString()] = l.status; });

    const formattedMissions = missions.map(m => ({
      id: m._id.toString(),
      title: m.title,
      category: m.category,
      period: m.period,
      coins: m.coins,
      icon: m.icon,
      status: pendingMap[m._id.toString()] || 'available'
    }));

    const rewards = await Reward.find({ active: true });

    res.json({
      balance: Math.max(0, balance),
      rank: balance >= 500 ? 'Comandante Supremo' : balance >= 200 ? 'Guardião das Estrelas' : balance >= 80 ? 'Piloto de Foguete' : 'Explorador Lunar',
      missions: formattedMissions,
      rewards
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enviar Missão para Aprovação
app.post('/api/missions/:id/submit', async (req, res) => {
  try {
    const missionId = req.params.id;
    if (mongoose.connection.readyState === 1) {
      await MissionLog.findOneAndUpdate(
        { missionId: missionId },
        { status: 'pending', submittedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'Missão enviada para a Central de Comando!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catálogo de Recompensas
app.get('/api/rewards', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const rewards = await Reward.find({ active: true });
      return res.json(rewards);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solicitar Resgate de Recompensa
app.post('/api/rewards/:id/redeem', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Banco indisponível' });

    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ error: 'Recompensa não encontrada' });

    // Checar saldo
    const txs = await Transaction.find({});
    let balance = 0;
    txs.forEach(t => {
      if (t.type === 'credito' || t.type === 'estorno') balance += t.amount;
      if (t.type === 'resgate') balance -= t.amount;
    });

    if (balance < reward.cost) {
      return res.status(400).json({ error: 'Moedas estelares insuficientes para este resgate!' });
    }

    // Criar solicitação e transação de débito
    const redemption = await RewardRedemption.create({
      rewardId: reward._id,
      costAtRedemption: reward.cost,
      status: 'pending'
    });

    await Transaction.create({
      userId: new mongoose.Types.ObjectId(),
      type: 'resgate',
      amount: reward.cost,
      reason: `Resgate solicitado: ${reward.title}`,
      referenceId: redemption._id.toString()
    });

    res.json({ success: true, message: 'Solicitação de resgate enviada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Diário / Humor: Consulta do Último Registro (sem trava de tempo/timer)
app.get('/api/emotions/status', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ canLog: true, nextAvailableInMinutes: 0, lastLog: null, history: [] });
    }

    const lastLog = await EmotionalLog.findOne().sort({ createdAt: -1 });
    const history = await EmotionalLog.find().sort({ createdAt: -1 }).limit(15);

    res.json({
      canLog: true,
      nextAvailableInMinutes: 0,
      lastLog,
      history
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Humor: Registro liberado sempre que desejar
app.post('/api/emotions', async (req, res) => {
  try {
    const { dayScore, energyLevel, feelingHeard, moods, reasons, needs, goodThing } = req.body;

    if (mongoose.connection.readyState === 1) {
      await EmotionalLog.create({
        dayScore: dayScore || 'bom',
        energyLevel: energyLevel || 'boa',
        feelingHeard: feelingHeard || 'sim',
        moods: Array.isArray(moods) ? moods : [moods],
        reasons: Array.isArray(reasons) ? reasons : [],
        needs: Array.isArray(needs) ? needs : [],
        goodThing: goodThing || ''
      });
    }

    res.json({ 
      success: true, 
      message: 'Diário de bordo sincronizado com as estrelas!',
      totalLogged: Array.isArray(moods) ? moods.length : 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MOTOR DO COMPANHEIRO VIRTUAL ZUPI
// -------------------------------------------------------------

// Pensamentos contextuais espontâneos
const getRandomThought = (pet) => {
  if (pet.hydration < 35) return 'Humm... estou com sede! Será que tem uma aguinha cósmica? 💧';
  if (pet.hunger > 65) return 'Minha barriguinha de alien tá roncando! Queria uma maçã estelar 🍎';
  if (pet.energy < 30) return 'Uaaaaah... que soninho cósmico. Preciso de uma pausa nas estrelas 🌙';
  if (pet.attention < 40) return 'Ei, Gustavitti! Vamos fazer alguma coisa legal juntos? 👾';
  if (pet.happiness > 80) return 'Que dia incrível! Você é o melhor capitão da galáxia! ✨';
  
  const randomPhrases = [
    'Será que existe vida naquele planeta azul distante? 🪐',
    'Adoro navegar pelo espaço com você! 🚀',
    'Sabia que as estrelas são feitas de poeira cósmica brilhante? 🌟',
    'Tive uma ideia! Vamos comemorar mais uma missão cumprida! 🏆',
    'Tô me sentindo super animado hoje! 🛸'
  ];
  return randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
};

// Obter estado com decaimento temporal
app.get('/api/pet', async (req, res) => {
  try {
    let pet = await Pet.findOne();
    if (!pet) {
      pet = await Pet.create({ name: 'Zupi' });
    }

    // Calcular decaimento temporal desde a última visita (máx 12h)
    const now = new Date();
    const elapsedMinutes = Math.min(12 * 60, Math.max(0, (now - new Date(pet.lastDecayAt)) / (1000 * 60)));

    if (elapsedMinutes >= 10) {
      const decayCycles = Math.floor(elapsedMinutes / 10);
      pet.hydration = Math.max(10, pet.hydration - decayCycles * 2);
      pet.hunger = Math.min(90, pet.hunger + decayCycles * 2);
      pet.attention = Math.max(15, pet.attention - decayCycles * 2);
      pet.lastDecayAt = now;
      pet.currentThought = getRandomThought(pet);
      await pet.save();
    }

    res.json(pet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Interagir com Zupi (agua, comida, brincar, carinho, dormir)
app.post('/api/pet/interact', async (req, res) => {
  try {
    const { action } = req.body;
    let pet = await Pet.findOne();
    if (!pet) pet = await Pet.create({ name: 'Zupi' });

    let reactionMsg = '';

    if (action === 'water') {
      pet.hydration = Math.min(100, pet.hydration + 35);
      pet.happiness = Math.min(100, pet.happiness + 10);
      reactionMsg = 'Glup glup... Ahh! Água fresquinha do espaço! 💧';
    } else if (action === 'food') {
      pet.hunger = Math.max(0, pet.hunger - 35);
      pet.happiness = Math.min(100, pet.happiness + 10);
      reactionMsg = 'Nham nham! Que lanche espacial delicioso! 🍎';
    } else if (action === 'play') {
      if (pet.energy < 20) {
        return res.json({ success: false, message: 'Zupi está muito cansado para brincar agora. Deixe ele descansar um pouco! 🌙', pet });
      }
      pet.energy = Math.max(10, pet.energy - 25);
      pet.happiness = Math.min(100, pet.happiness + 25);
      pet.attention = Math.min(100, pet.attention + 30);
      reactionMsg = 'Uhuuul! Foi muito divertido jogar com você! 🎮✨';
    } else if (action === 'pet') {
      pet.happiness = Math.min(100, pet.happiness + 15);
      pet.attention = Math.min(100, pet.attention + 25);
      reactionMsg = 'Purrr... Que carinho bom, capitão! 💜';
    } else if (action === 'sleep') {
      pet.energy = Math.min(100, pet.energy + 40);
      reactionMsg = 'Zzz... Zupi tirou uma soneca cósmica revigorante! 🌙';
    } else if (action === 'sing') {
      pet.happiness = Math.min(100, pet.happiness + 20);
      pet.attention = Math.min(100, pet.attention + 10);
      pet.energy = Math.max(0, pet.energy - 10);
      reactionMsg = '🎵 Lá lá lá! A galáxia inteira ouviu essa! 🎶';
    } else if (action === 'explore') {
      pet.happiness = Math.min(100, pet.happiness + 25);
      pet.energy = Math.max(0, pet.energy - 20);
      pet.hydration = Math.max(0, pet.hydration - 10);
      reactionMsg = '🚀 DECOLAGEM! Descobrimos um novo planeta! 🌌⭐';
    } else if (action === 'exercise') {
      pet.happiness = Math.min(100, pet.happiness + 15);
      pet.energy = Math.max(0, pet.energy - 15);
      pet.hydration = Math.max(0, pet.hydration - 15);
      reactionMsg = '💪 Astronauta em forma! Missão fitness concluída! 🔥';
    }

    pet.currentThought = reactionMsg || getRandomThought(pet);
    pet.lastDecayAt = new Date();
    await pet.save();

    res.json({ success: true, message: reactionMsg, pet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Criar Missão Relâmpago ou Regular
app.post('/api/admin/missions/create', async (req, res) => {
  try {
    const { title, category, period, coins, icon } = req.body;
    if (!title || !coins) return res.status(400).json({ error: 'Título e moedas são obrigatórios' });

    const newMission = await Mission.create({
      title,
      category: category || 'Missão Relâmpago ⚡',
      period: period || 'qualquer',
      coins: Number(coins),
      icon: icon || '⚡'
    });

    res.json({ success: true, mission: newMission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Editar Missão
app.put('/api/admin/missions/:id', async (req, res) => {
  try {
    const { title, period, coins, category, active } = req.body;
    const updated = await Mission.findByIdAndUpdate(
      req.params.id,
      { title, period, coins: Number(coins), category, active },
      { new: true }
    );
    res.json({ success: true, mission: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Excluir Missão
app.delete('/api/admin/missions/:id', async (req, res) => {
  try {
    await Mission.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Criar Nova Recompensa
app.post('/api/admin/rewards/create', async (req, res) => {
  try {
    const { title, category, cost, icon } = req.body;
    if (!title || !cost) return res.status(400).json({ error: 'Título e custo são obrigatórios' });

    const newReward = await Reward.create({
      title,
      category: category || 'Privilégio',
      cost: Number(cost),
      icon: icon || '⭐'
    });

    res.json({ success: true, reward: newReward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Editar Recompensa
app.put('/api/admin/rewards/:id', async (req, res) => {
  try {
    const { title, category, cost, icon, active } = req.body;
    const updated = await Reward.findByIdAndUpdate(
      req.params.id,
      { title, category, cost: Number(cost), icon, active },
      { new: true }
    );
    res.json({ success: true, reward: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Excluir Recompensa
app.delete('/api/admin/rewards/:id', async (req, res) => {
  try {
    await Reward.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Restaurar/Importar Catálogo Completo de Recompensas Sugeridas
app.post('/api/admin/rewards/seed-default', async (req, res) => {
  try {
    const DEFAULT_REWARDS = [
      { title: 'Escolher a sobremesa do dia', category: 'Privilégio', cost: 30, icon: '🍦' },
      { title: 'Ficar acordado 30 min a mais', category: 'Privilégio', cost: 40, icon: '⏰' },
      { title: 'Escolher o cardápio do jantar', category: 'Privilégio', cost: 50, icon: '🍕' },
      { title: 'Usar o celular/tablet por 1h extra', category: 'Atividade', cost: 60, icon: '📱' },
      { title: 'Um abraço + história antes de dormir', category: 'Privilégio', cost: 30, icon: '🤗' },
      { title: 'Escolher o filme da noite em família', category: 'Privilégio', cost: 120, icon: '🎬' },
      { title: 'Noite de jogos / 1h de videogame extra', category: 'Atividade', cost: 200, icon: '🎮' },
      { title: 'Pedir comida especial (pizza, hambúrguer)', category: 'Privilégio', cost: 180, icon: '🍔' },
      { title: 'Dormir na casa de um amigo', category: 'Atividade', cost: 250, icon: '🏕️' },
      { title: 'Ir ao cinema escolher o filme', category: 'Atividade', cost: 300, icon: '🎥' },
      { title: 'Tarde livre sem tarefas (aprovado pelos pais)', category: 'Privilégio', cost: 200, icon: '🌴' },
      { title: 'Montar o próprio lanche especial', category: 'Privilégio', cost: 80, icon: '🥪' },
      { title: 'Passeio especial no fim de semana (escolha!)', category: 'Passeio', cost: 450, icon: '🎡' },
      { title: 'Ir ao parque aquático ou de diversões', category: 'Passeio', cost: 700, icon: '🎢' },
      { title: 'Brinquedo ou item desejado (combinado)', category: 'Presente', cost: 1000, icon: '🎁' },
      { title: 'Jogo novo para videogame', category: 'Presente', cost: 800, icon: '🕹️' },
      { title: 'Livro, quadrinho ou mangá favorito', category: 'Presente', cost: 150, icon: '📚' },
      { title: 'Viagem ou passeio grande (decisão da família)', category: 'Passeio', cost: 1500, icon: '✈️' },
    ];

    let insertedCount = 0;
    for (const item of DEFAULT_REWARDS) {
      const exists = await Reward.findOne({ title: item.title });
      if (!exists) {
        await Reward.create(item);
        insertedCount++;
      }
    }

    res.json({ success: true, insertedCount, message: `${insertedCount} novas recompensas adicionadas ao catálogo!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Validação do PIN dos Pais (padrão 1234)
app.post('/api/admin/auth', (req, res) => {
  const { pin } = req.body;
  const validPin = process.env.PARENT_PIN_DEFAULT || '1234';
  if (pin === validPin) {
    return res.json({ success: true, token: 'parent_authenticated_session' });
  }
  return res.status(401).json({ success: false, error: 'PIN de comando incorreto!' });
});

// Central de Comando: Dados de Supervisão (Pendências)
app.get('/api/admin/overview', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json({ pendingMissions: [], redemptions: [] });

    const pendingLogs = await MissionLog.find({ status: 'pending' }).populate('missionId');
    const redemptions = await RewardRedemption.find({ status: 'pending' }).populate('rewardId');
    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(15);

    res.json({
      pendingMissions: pendingLogs,
      pendingRedemptions: redemptions,
      recentTransactions: transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Central de Comando: Aprovar ou Devolver Missão
app.post('/api/admin/missions/:logId/decide', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' ou 'return'
    const log = await MissionLog.findById(req.params.logId).populate('missionId');
    if (!log) return res.status(404).json({ error: 'Registro não encontrado' });

    if (action === 'approve') {
      log.status = 'approved';
      log.decidedAt = new Date();
      await log.save();

      // Creditar moedas estelares
      await Transaction.create({
        userId: new mongoose.Types.ObjectId(),
        type: 'credito',
        amount: log.missionId.coins,
        reason: `Missão concluída: ${log.missionId.title}`,
        referenceId: log._id.toString()
      });
    } else {
      log.status = 'available'; // Devolve para a criança tentar novamente
      log.decidedAt = new Date();
      await log.save();
    }

    res.json({ success: true, status: log.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SISTEMA DE ALERTAS EM TEMPO REAL (MÃE ➔ FILHO)
// -------------------------------------------------------------

// Enviar Alerta da Nave Mãe para o Filho
app.post('/api/alerts', async (req, res) => {
  try {
    const { text, sender } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto do alerta é obrigatório' });
    }

    if (mongoose.connection.readyState === 1) {
      const alert = await AlertMessage.create({
        text: text.trim(),
        sender: sender || 'Nave Mãe'
      });
      return res.json({ success: true, alert });
    }

    // Modo contingência
    res.json({ success: true, alert: { _id: Date.now().toString(), text, sender: 'Nave Mãe', createdAt: new Date() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Filho consulta se há novo alerta não lido (Polling rápido)
app.get('/api/alerts/latest', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ alert: null });
    }

    // Procura alerta não lido criado nos últimos 15 minutos
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const alert = await AlertMessage.findOne({
      read: false,
      createdAt: { $gte: fifteenMinutesAgo }
    }).sort({ createdAt: -1 });

    res.json({ alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Filho confirma o alerta ("Entendido / Já vou!")
app.post('/api/alerts/:id/ack', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await AlertMessage.findByIdAndUpdate(req.params.id, {
        read: true,
        readAt: new Date()
      });
    }
    res.json({ success: true, message: 'Alerta confirmado!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Histórico dos últimos alertas para a Central de Comando
app.get('/api/alerts/history', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ alerts: [] });
    }

    const alerts = await AlertMessage.find().sort({ createdAt: -1 }).limit(10);
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback PWA para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

// Inicialização resiliente para Render e Cloud (0.0.0.0)
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Gustavix rodando em http://${HOST}:${PORT}`);
  connectDB();
});
