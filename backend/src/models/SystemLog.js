import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['success', 'error', 'info', 'warning'],
    default: 'info',
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true,
  }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.models.SystemLog || mongoose.model('SystemLog', systemLogSchema);
