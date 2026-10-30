const mongoose = require('mongoose');

// Schema de Missões
const MissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  period: { type: String, enum: ['manha', 'tarde', 'noite', 'qualquer'], default: 'qualquer' },
  coins: { type: Number, required: true, min: 1 },
  icon: { type: String, default: '🪐' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Schema do Micro-Ledger de Transações (Imutável)
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credito', 'resgate', 'estorno', 'ajuste'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  referenceId: { type: String } // ID da missão ou recompensa associada
}, { timestamps: true });

// Schema do Diário Emocional Cósmico (Experiência Completa de Alfabetização Emocional)
const EmotionalLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // 1. Três Indicadores Rápidos
  dayScore: { type: String, enum: ['otimo', 'bom', 'neutro', 'dificil', 'ruim'], default: 'bom' }, // 😞😕😐🙂🤩
  energyLevel: { type: String, enum: ['maxima', 'boa', 'media', 'baixa', 'esgotada'], default: 'boa' }, // 🪫🔋⚡🚀☀️
  feelingHeard: { type: String, enum: ['muito', 'sim', 'mais_ou_menos', 'pouco', 'nada'], default: 'sim' }, // 🙁😕😐🙂💚
  
  // 2. Múltiplas Emoções por Categoria (Agradáveis, Difíceis, Alerta, Físicas)
  moods: [{ type: String, required: true }],
  
  // 3. Contexto: O que aconteceu hoje? (Escola, Família, etc.)
  reasons: [{ type: String }],
  
  // 4. Do que você precisa agora? (Abraço, conversar, brincar, etc.)
  needs: [{ type: String }],
  
  // 5. Uma coisa boa que aconteceu
  goodThing: { type: String, maxlength: 300 }
}, { timestamps: true });

// Schema de Ocorrência de Missão (Status da tarefa no dia)
const MissionLogSchema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['available', 'pending', 'approved', 'returned'], default: 'available' },
  submittedAt: { type: Date },
  decidedAt: { type: Date },
  note: { type: String }
}, { timestamps: true });

// Schema de Recompensas da Loja
const RewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: 'Privilégio' },
  cost: { type: Number, required: true, min: 1 },
  icon: { type: String, default: '⭐' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Schema de Resgate de Recompensas
const RewardRedemptionSchema = new mongoose.Schema({
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  costAtRedemption: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'cancelled'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  decidedAt: { type: Date }
}, { timestamps: true });

// Schema de Usuário (Criança / Responsável com Hash de PIN)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['child', 'parent'], default: 'child' },
  pinHash: { type: String }, // Preenchido apenas para o responsável
  level: { type: Number, default: 1 }
}, { timestamps: true });

// Schema do Companheiro Virtual Espacial (Zupi)
const PetSchema = new mongoose.Schema({
  name: { type: String, default: 'Zupi' },
  avatar: { type: String, default: '👾' },
  happiness: { type: Number, default: 80, min: 0, max: 100 },
  energy: { type: Number, default: 70, min: 0, max: 100 },
  hydration: { type: Number, default: 50, min: 0, max: 100 }, // Sede
  hunger: { type: Number, default: 40, min: 0, max: 100 },    // Fome
  attention: { type: Number, default: 60, min: 0, max: 100 }, // Carinho/Brincadeira
  lastDecayAt: { type: Date, default: Date.now },
  currentThought: { type: String, default: 'Oi, Gustavitti! Vamos explorar o cosmos hoje? 🚀' }
}, { timestamps: true });

// Schema de Alertas / Chamados da Família (Mãe ➔ Filho em Tempo Real)
const AlertMessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sender: { type: String, default: 'Nave Mãe' },
  read: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

module.exports = {
  Mission: mongoose.model('Mission', MissionSchema),
  MissionLog: mongoose.model('MissionLog', MissionLogSchema),
  Reward: mongoose.model('Reward', RewardSchema),
  RewardRedemption: mongoose.model('RewardRedemption', RewardRedemptionSchema),
  Transaction: mongoose.model('Transaction', TransactionSchema),
  EmotionalLog: mongoose.model('EmotionalLog', EmotionalLogSchema),
  User: mongoose.model('User', UserSchema),
  Pet: mongoose.model('Pet', PetSchema),
  AlertMessage: mongoose.model('AlertMessage', AlertMessageSchema)
};
