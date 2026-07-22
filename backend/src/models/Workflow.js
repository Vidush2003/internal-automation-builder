import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'TRIGGER_MANUAL', 'ACTION_HTTP'
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, // Configuration data for the node
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String },
  targetHandle: { type: String }
}, { _id: false });

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
  },
  triggerType: {
    type: String,
    enum: ['manual', 'webhook', 'schedule'],
    default: 'manual',
  },
  nodes: {
    type: [nodeSchema],
    default: [],
  },
  edges: {
    type: [edgeSchema],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
