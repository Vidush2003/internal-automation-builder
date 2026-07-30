import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  nodeId: { type: String, default: 'SYSTEM' },
  status: { type: String, enum: ['pending', 'running', 'success', 'failed', 'skipped'], default: 'pending' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String },
  output: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const workflowExecutionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
    index: true,
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  logs: {
    type: [logSchema],
    default: [],
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.models.WorkflowExecution || mongoose.model('WorkflowExecution', workflowExecutionSchema);
