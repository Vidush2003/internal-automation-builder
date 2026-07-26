import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addEdge, applyEdgeChanges, applyNodeChanges,
  Background, Controls, Handle, Position, ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client';
import { useToast } from '../components/Overlays';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Constants                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

const initialNodes = [
  { id: 'trigger', type: 'automationNode', position: { x: 160, y: 180 }, data: { label: 'Manual trigger', type: 'TRIGGER_MANUAL' } },
];

// NODE_DEF — single source of truth for every node type's visual identity.
// Brand-color exception: Slack, Discord, Delay, Loop use literal hex per the
// Phase 6 spec (decision #6). All other nodes continue to use Tailwind tokens.
const NODE_DEF = {
  TRIGGER_MANUAL:      { icon: 'bolt',           label: 'Manual Trigger', chip: 'Trigger',   gradientFrom: '#1a47a8', gradientTo: '#2259bf' },
  TRIGGER_WEBHOOK:     { icon: 'webhook',         label: 'Webhook',        chip: 'Trigger',   gradientFrom: '#1a47a8', gradientTo: '#2259bf' },
  TRIGGER_CRON:        { icon: 'schedule',        label: 'Schedule',       chip: 'Trigger',   gradientFrom: '#1a47a8', gradientTo: '#2259bf' },
  ACTION_HTTP:         { icon: 'http',            label: 'HTTP Request',   chip: 'Action',    gradientFrom: '#1a47a8', gradientTo: '#3067d4' },
  ACTION_EMAIL:        { icon: 'mail',            label: 'Send Email',     chip: 'Action',    gradientFrom: '#364f7e', gradientTo: '#4a6aa8' },
  LOGIC_BRANCH:        { icon: 'call_split',      label: 'Branch',         chip: 'Logic',     gradientFrom: '#1e1e24', gradientTo: '#3c3c43' },
  ACTION_AI_SUMMARIZE: { icon: 'auto_awesome',    label: 'AI Summarize',   chip: 'AI Action', gradientFrom: '#7b2cbf', gradientTo: '#9d4edd' },
  ACTION_AI_EXTRACT:   { icon: 'troubleshoot',    label: 'AI Extract',     chip: 'AI Action', gradientFrom: '#7b2cbf', gradientTo: '#9d4edd' },
  ACTION_AI_DECIDE:    { icon: 'psychology',      label: 'AI Decide',      chip: 'AI Action', gradientFrom: '#7b2cbf', gradientTo: '#9d4edd' },
  // Brand colors — accepted exception per Phase 6 spec decision #6
  ACTION_SLACK:        { icon: 'chat',            label: 'Slack Message',  chip: 'Integration', gradientFrom: '#e01e5a', gradientTo: '#4a154b' },
  ACTION_DISCORD:      { icon: 'forum',           label: 'Discord Message',chip: 'Integration', gradientFrom: '#5865F2', gradientTo: '#404EED' },
  LOGIC_DELAY:         { icon: 'hourglass_empty', label: 'Delay',          chip: 'Logic',     gradientFrom: '#f59e0b', gradientTo: '#d97706' },
  LOGIC_LOOP:          { icon: 'repeat',          label: 'For Each',       chip: 'Logic',     gradientFrom: '#10b981', gradientTo: '#059669' },
};

const PALETTE_ITEMS = [
  { type: 'ACTION_HTTP',         title: 'HTTP Request',   desc: 'Call any external API',          icon: 'http' },
  { type: 'ACTION_EMAIL',        title: 'Send Email',     desc: 'Notify a person or team',         icon: 'mail' },
  { type: 'ACTION_SLACK',        title: 'Slack Message',  desc: 'Post to a Slack channel',         icon: 'chat' },
  { type: 'ACTION_DISCORD',      title: 'Discord Message',desc: 'Post to a Discord channel',       icon: 'forum' },
  { type: 'LOGIC_BRANCH',        title: 'Branch',         desc: 'If/Else conditional logic',       icon: 'call_split' },
  { type: 'LOGIC_DELAY',         title: 'Delay',          desc: 'Pause execution for N seconds',   icon: 'hourglass_empty' },
  { type: 'LOGIC_LOOP',          title: 'For Each',       desc: 'Iterate over an array of items',  icon: 'repeat' },
  { type: 'ACTION_AI_SUMMARIZE', title: 'AI Summarize',   desc: 'Summarize text with Gemini',      icon: 'auto_awesome' },
  { type: 'ACTION_AI_EXTRACT',   title: 'AI Extract',     desc: 'Extract structured JSON',         icon: 'troubleshoot' },
  { type: 'ACTION_AI_DECIDE',    title: 'AI Decide',      desc: 'Semantic True/False routing',     icon: 'psychology' },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/* Shared UI primitives                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-outlined leading-none ${className}`} aria-hidden="true">{name}</span>
);

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block mb-1.5 font-label text-[10px] uppercase tracking-[.16em] font-bold text-on-surface-variant">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-on-surface-variant">{hint}</p>}
    </div>
  );
}

const inputCls = [
  'w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3.5 py-2.5',
  'text-sm text-on-surface outline-none transition-all',
  'focus:border-primary focus:ring-2 focus:ring-primary/10',
  'placeholder:text-outline',
].join(' ');

/* ─────────────────────────────────────────────────────────────────────────── */
/* Custom canvas node                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function AutomationNode({ data, id, selected }) {
  const def       = NODE_DEF[data.type] || NODE_DEF.ACTION_HTTP;
  const isTrigger = id === 'trigger' || data.type.startsWith('TRIGGER_');
  const isLoop    = data.type === 'LOGIC_LOOP';
  const isLoopBody = data._inLoopBody; // reserved for future visual hint

  const summaryMap = {
    ACTION_HTTP:         data.url          ? data.url                             : 'No endpoint configured',
    ACTION_EMAIL:        data.to           ? data.to                              : 'No recipient configured',
    ACTION_SLACK:        data.webhookUrl   ? `→ ${data.webhookUrl.slice(0, 30)}…` : 'No webhook URL configured',
    ACTION_DISCORD:      data.webhookUrl   ? `→ ${data.webhookUrl.slice(0, 30)}…` : 'No webhook URL configured',
    LOGIC_BRANCH:        data.condition    ? `If: ${data.condition}`              : 'No condition configured',
    LOGIC_DELAY:         data.duration     ? `Wait ${data.duration} ${data.unit || 'seconds'}` : 'No duration configured',
    LOGIC_LOOP:          data.arrayInput   ? `Each item in: ${data.arrayInput}`  : 'No array configured',
    ACTION_AI_SUMMARIZE: data.text         ? `Summarize to ${data.length || 'medium'} length` : 'No text configured',
    ACTION_AI_EXTRACT:   data.extractionSchema ? 'Configured for extraction'     : 'No schema configured',
    ACTION_AI_DECIDE:    data.criteria     ? `Criteria: ${data.criteria}`        : 'No criteria configured',
    TRIGGER_WEBHOOK:     'Triggered by external webhook POST',
    TRIGGER_CRON:        data.cron         ? data.cron                           : 'No schedule configured',
    TRIGGER_MANUAL:      'Starts the workflow manually',
  };
  const summary = summaryMap[data.type] || 'Configured';

  const headerStyle = {
    background: `linear-gradient(135deg, ${def.gradientFrom}, ${def.gradientTo})`,
  };

  return (
    <div
      className={[
        'w-[220px] rounded-2xl shadow-xl transition-all duration-200 relative',
        selected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface shadow-2xl scale-[1.02]'
          : 'hover:shadow-2xl hover:scale-[1.01]',
        isLoop ? 'w-[240px]' : '',
      ].join(' ')}
    >
      {/* Gradient header — uses inline style so arbitrary hex works for brand nodes */}
      <div style={headerStyle} className="px-4 py-3 flex items-center gap-2.5 rounded-t-2xl">
        <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Icon name={def.icon} className="text-[16px] text-white" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-widest font-bold text-white/70">{def.chip}</p>
          <p className="text-sm font-bold text-white truncate leading-tight">{data.label}</p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-surface-container-lowest border border-t-0 border-outline-variant/15 px-4 py-3 rounded-b-2xl">
        <p className="text-[11px] text-on-surface-variant leading-relaxed truncate">{summary}</p>
        {isLoop && (
          <div className="mt-2 flex gap-2 text-[9px] font-bold uppercase tracking-wider">
            <span className="text-emerald-600">↓ loop body</span>
            <span className="text-gray-400">→ done</span>
          </div>
        )}
      </div>

      {/* Target (input) handle — all non-trigger nodes */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !rounded-full !bg-white !border-2 !border-primary !-left-[7px] !shadow-sm"
        />
      )}

      {/* Source (output) handles */}
      {data.type === 'LOGIC_BRANCH' ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            className="!w-3 !h-3 !rounded-full !bg-[#55cf8b] !border-2 !border-white !-right-[7px] !shadow-sm !top-1/3"
          />
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            className="!w-3 !h-3 !rounded-full !bg-[#ff6b64] !border-2 !border-white !-right-[7px] !shadow-sm !top-2/3"
          />
        </>
      ) : data.type === 'LOGIC_LOOP' ? (
        // LOGIC_LOOP has two named source handles:
        //   "loop"  (bottom) — connects to the loop body subgraph
        //   "done"  (right)  — continues main flow after all iterations
        <>
          <Handle
            type="source"
            id="loop"
            position={Position.Bottom}
            className="!w-3 !h-3 !rounded-full !bg-[#10b981] !border-2 !border-white !shadow-sm"
            style={{ bottom: -7, left: '40%' }}
          />
          <Handle
            type="source"
            id="done"
            position={Position.Right}
            className="!w-3 !h-3 !rounded-full !bg-[#6b7280] !border-2 !border-white !-right-[7px] !shadow-sm"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !rounded-full !bg-primary !border-2 !border-white !-right-[7px] !shadow-sm"
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Left palette                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function Palette({ onAdd }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Trigger — disabled card */}
      <div>
        <p className="mb-3 font-label text-[10px] uppercase tracking-[.16em] font-bold text-on-surface-variant/70">Start here</p>
        <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-3 opacity-60 cursor-not-allowed select-none">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${NODE_DEF.TRIGGER_MANUAL.gradientFrom}, ${NODE_DEF.TRIGGER_MANUAL.gradientTo})` }}
          >
            <Icon name="bolt" className="text-white text-[18px]" />
          </span>
          <div>
            <p className="text-sm font-bold text-on-background">Manual trigger</p>
            <p className="text-[11px] text-on-surface-variant">Already on canvas</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div>
        <p className="mb-3 font-label text-[10px] uppercase tracking-[.16em] font-bold text-on-surface-variant/70">Add an action</p>
        <div className="flex flex-col gap-2">
          {PALETTE_ITEMS.map((item) => {
            const def = NODE_DEF[item.type] || NODE_DEF.ACTION_HTTP;
            return (
              <motion.button
                key={item.type}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(item.type)}
                className="flex items-center gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-3 text-left hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm transition-all group"
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
                  style={{ background: `linear-gradient(135deg, ${def.gradientFrom}, ${def.gradientTo})` }}
                >
                  <Icon name={item.icon} className="text-white text-[18px]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-on-background">{item.title}</span>
                  <span className="block mt-0.5 text-[11px] text-on-surface-variant">{item.desc}</span>
                </span>
                <Icon name="add_circle" className="text-[20px] text-primary/40 group-hover:text-primary transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Right inspector panel content                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function ActivityPanel({ logs }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant gap-3">
        <span className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
          <Icon name="receipt_long" className="text-[28px] text-primary/50" />
        </span>
        <div>
          <p className="text-sm font-semibold text-on-background">No executions yet</p>
          <p className="mt-1 text-xs text-on-surface-variant">Hit Run to see live activity here.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {logs.map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-3.5"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-label text-[10px] font-bold text-primary uppercase tracking-widest">
              {log.nodeId || 'SYSTEM'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${
              log.status === 'failed' ? 'text-error' : log.status === 'pending' ? 'text-on-surface-variant' : 'text-primary'
            }`}>
              {log.status || 'running'}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-on-surface">
            {log.message || log.error || 'Completed successfully'}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

function NodeInspector({ node, workflow, onUpdate, onDelete }) {
  const def       = NODE_DEF[node.data.type] || NODE_DEF.ACTION_HTTP;
  const isTrigger    = node.id === 'trigger' || node.data.type?.startsWith('TRIGGER_');
  const isHttp       = node.data.type === 'ACTION_HTTP';
  const isEmail      = node.data.type === 'ACTION_EMAIL';
  const isWebhook    = node.data.type === 'TRIGGER_WEBHOOK';
  const isCron       = node.data.type === 'TRIGGER_CRON';
  const isLogic      = node.data.type === 'LOGIC_BRANCH';
  const isAiSummarize = node.data.type === 'ACTION_AI_SUMMARIZE';
  const isAiExtract  = node.data.type === 'ACTION_AI_EXTRACT';
  const isAiDecide   = node.data.type === 'ACTION_AI_DECIDE';
  const isSlack      = node.data.type === 'ACTION_SLACK';
  const isDiscord    = node.data.type === 'ACTION_DISCORD';
  const isDelay      = node.data.type === 'LOGIC_DELAY';
  const isLoop       = node.data.type === 'LOGIC_LOOP';

  const webhookUrl = workflow ? `${window.location.origin}/api/webhooks/${workflow._id || 'save-to-generate'}` : '';

  return (
    <motion.div
      key={node.id}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      {/* Header — inline style so brand-hex nodes render correctly */}
      <div
        style={{ background: `linear-gradient(135deg, ${def.gradientFrom}, ${def.gradientTo})` }}
        className="rounded-2xl p-4 flex items-center gap-3"
      >
        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Icon name={def.icon} className="text-white text-[22px]" />
        </span>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/70">{def.chip}</p>
          <p className="text-base font-bold text-white leading-tight">{node.data.label}</p>
        </div>
      </div>

      <Field label="Node ID" hint="Use this ID for variable interpolation e.g. {{node_id.data}}">
        <input
          className={`${inputCls} font-mono text-[10px] text-on-surface-variant bg-surface-container`}
          readOnly
          value={node.id}
          onClick={(e) => e.target.select()}
        />
      </Field>

      <Field label="Label">
        <input
          className={inputCls}
          value={node.data.label || ''}
          onChange={(e) => onUpdate('label', e.target.value)}
        />
      </Field>

      {isWebhook && (
        <Field label="Webhook URL" hint="Send a POST request to this URL to trigger the workflow. Payload will be available via {{trigger.payload.X}}">
          <input
            className={`${inputCls} font-mono text-[10px] text-on-surface-variant bg-surface-container`}
            readOnly
            value={webhookUrl}
            onClick={(e) => e.target.select()}
          />
        </Field>
      )}

      {isCron && (
        <Field label="Cron Expression" hint="e.g. '0 * * * *' for every hour">
          <input
            className={`${inputCls} font-mono text-xs`}
            placeholder="* * * * *"
            value={node.data.cron || ''}
            onChange={(e) => onUpdate('cron', e.target.value)}
          />
        </Field>
      )}

      {isLogic && (
        <Field label="Condition" hint="Evaluates as JavaScript. e.g. '{{trigger.payload.amount}} > 100'">
          <input
            className={`${inputCls} font-mono text-xs`}
            placeholder="{{trigger.payload.amount}} > 100"
            value={node.data.condition || ''}
            onChange={(e) => onUpdate('condition', e.target.value)}
          />
        </Field>
      )}

      {isHttp && (
        <>
          <Field label="Method">
            <select
              className={inputCls}
              value={node.data.method || 'GET'}
              onChange={(e) => onUpdate('method', e.target.value)}
            >
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Target URL" hint="Supports interpolation e.g. {{trigger.payload.url}}">
            <input
              className={`${inputCls} font-mono text-xs`}
              type="url"
              placeholder="https://api.example.com/endpoint"
              value={node.data.url || ''}
              onChange={(e) => onUpdate('url', e.target.value)}
            />
          </Field>
        </>
      )}

      {isEmail && (
        <>
          <Field label="Recipient" hint="Supports interpolation e.g. {{trigger.payload.email}}">
            <input
              className={inputCls}
              type="text"
              placeholder="team@example.com"
              value={node.data.to || ''}
              onChange={(e) => onUpdate('to', e.target.value)}
            />
          </Field>
          <Field label="Subject">
            <input
              className={inputCls}
              placeholder="Notification"
              value={node.data.subject || ''}
              onChange={(e) => onUpdate('subject', e.target.value)}
            />
          </Field>
          <Field label="Message">
            <textarea
              className={`${inputCls} resize-y min-h-[100px]`}
              rows={4}
              placeholder="Write your message…"
              value={node.data.body || ''}
              onChange={(e) => onUpdate('body', e.target.value)}
            />
          </Field>
        </>
      )}

      {isAiSummarize && (
        <>
          <Field label="Text to Summarize" hint="Supports interpolation e.g. {{trigger.payload.email}}">
            <textarea
              className={`${inputCls} resize-y min-h-[80px] font-mono text-xs`}
              rows={3}
              placeholder="{{trigger.payload.body}}"
              value={node.data.text || ''}
              onChange={(e) => onUpdate('text', e.target.value)}
            />
          </Field>
          <Field label="Desired Length">
            <select
              className={inputCls}
              value={node.data.length || 'medium'}
              onChange={(e) => onUpdate('length', e.target.value)}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </Field>
        </>
      )}

      {isAiExtract && (
        <>
          <Field label="Text to Extract From" hint="Supports interpolation">
            <textarea
              className={`${inputCls} resize-y min-h-[80px] font-mono text-xs`}
              rows={3}
              placeholder="{{trigger.payload.email}}"
              value={node.data.text || ''}
              onChange={(e) => onUpdate('text', e.target.value)}
            />
          </Field>
          <Field label="Extraction Instructions (Schema)" hint="Describe what you want to extract as JSON">
            <textarea
              className={`${inputCls} resize-y min-h-[100px]`}
              rows={4}
              placeholder="e.g. Extract name and phone number as { name: '...', phone: '...' }"
              value={node.data.extractionSchema || ''}
              onChange={(e) => onUpdate('extractionSchema', e.target.value)}
            />
          </Field>
        </>
      )}

      {isAiDecide && (
        <>
          <Field label="Text to Evaluate" hint="Supports interpolation">
            <textarea
              className={`${inputCls} resize-y min-h-[80px] font-mono text-xs`}
              rows={3}
              placeholder="{{trigger.payload.email}}"
              value={node.data.text || ''}
              onChange={(e) => onUpdate('text', e.target.value)}
            />
          </Field>
          <Field label="Decision Criteria" hint="What should the AI check for?">
            <input
              className={inputCls}
              placeholder="Is this customer asking for a refund?"
              value={node.data.criteria || ''}
              onChange={(e) => onUpdate('criteria', e.target.value)}
            />
          </Field>
        </>
      )}

      {/* ── Phase 6: Native Integrations ───────────────────────────────── */}

      {(isSlack || isDiscord) && (
        <>
          <Field label="Webhook URL" hint="Paste your Slack or Discord Incoming Webhook URL">
            <input
              className={`${inputCls} font-mono text-xs`}
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={node.data.webhookUrl || ''}
              onChange={(e) => onUpdate('webhookUrl', e.target.value)}
            />
          </Field>
          <Field label="Message" hint="Supports interpolation e.g. {{trigger.payload.text}}">
            <textarea
              className={`${inputCls} resize-y min-h-[100px]`}
              rows={4}
              placeholder="Write your message…"
              value={node.data.message || ''}
              onChange={(e) => onUpdate('message', e.target.value)}
            />
          </Field>
        </>
      )}

      {/* ── Phase 6: Advanced Logic ─────────────────────────────────────── */}

      {isDelay && (
        <>
          <Field label="Duration" hint="How long to pause the workflow">
            <input
              className={inputCls}
              type="number"
              min="0"
              step="1"
              placeholder="5"
              value={node.data.duration ?? ''}
              onChange={(e) => onUpdate('duration', e.target.value)}
            />
          </Field>
          <Field label="Unit">
            <select
              className={inputCls}
              value={node.data.unit || 'seconds'}
              onChange={(e) => onUpdate('unit', e.target.value)}
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
            </select>
          </Field>
        </>
      )}

      {isLoop && (
        <>
          <Field
            label="Array Input"
            hint="An interpolation expression that resolves to a JSON array e.g. {{trigger.payload.emails}}"
          >
            <input
              className={`${inputCls} font-mono text-xs`}
              placeholder="{{trigger.payload.items}}"
              value={node.data.arrayInput || ''}
              onChange={(e) => onUpdate('arrayInput', e.target.value)}
            />
          </Field>
          <Field
            label="Item Variable Name"
            hint="Use this name inside the loop body e.g. {{item.email}} — defaults to 'item'"
          >
            <input
              className={inputCls}
              placeholder="item"
              value={node.data.itemVariableName || ''}
              onChange={(e) => onUpdate('itemVariableName', e.target.value)}
            />
          </Field>
          <div className="rounded-xl bg-surface-container-low border border-outline-variant/10 p-3 text-[10px] text-on-surface-variant leading-relaxed">
            <strong className="text-emerald-600">↓ loop</strong> handle → connect to nodes that run for each item.<br />
            <strong className="text-gray-500">→ done</strong> handle → connect to nodes that run after all iterations.
          </div>
        </>
      )}

      {isTrigger ? (
        <div className="rounded-2xl bg-primary/6 border border-primary/10 p-4 text-xs leading-relaxed text-on-surface-variant">
          <Icon name="info" className="text-primary text-[16px] mb-1" />
          <p>This is the entry point for the workflow. Click <strong>Run</strong> in the top bar to trigger it manually.</p>
        </div>
      ) : (
        <button
          onClick={onDelete}
          className="mt-2 w-full rounded-xl border border-error/20 py-2.5 text-xs font-bold text-error hover:bg-error/6 hover:border-error/40 transition-all flex items-center justify-center gap-1.5"
        >
          <Icon name="delete" className="text-[16px]" />
          Remove action
        </button>
      )}
    </motion.div>
  );
}

function WorkflowDetails({ workflow, onUpdate, nodes, edges }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/10 p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Workflow canvas</p>
          <p className="mt-0.5 text-sm text-on-surface-variant">Select a node below to configure it.</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-on-background font-headline">{nodes.length}</p>
          <p className="text-[10px] text-on-surface-variant">node{nodes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <Field label="Workflow name">
        <input
          className={inputCls}
          value={workflow?.name || ''}
          onChange={(e) => onUpdate('name', e.target.value)}
        />
      </Field>

      <Field label="Description">
        <textarea
          className={`${inputCls} resize-y`}
          rows={3}
          value={workflow?.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
        />
      </Field>

      <Field label="Status">
        <select
          className={inputCls}
          value={workflow?.status || 'draft'}
          onChange={(e) => onUpdate('status', e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-container-low border border-outline-variant/10 p-3 text-center">
          <p className="text-xl font-bold text-on-background font-headline">{nodes.length}</p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">Nodes</p>
        </div>
        <div className="rounded-xl bg-surface-container-low border border-outline-variant/10 p-3 text-center">
          <p className="text-xl font-bold text-on-background font-headline">{edges.length}</p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">Connections</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main editor page                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function WorkflowEditor() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const toast     = useToast();
  const pollingRef = useRef(null);

  const [workflow,      setWorkflow]      = useState(null);
  const [nodes,         setNodes]         = useState(initialNodes);
  const [edges,         setEdges]         = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeTab,     setActiveTab]     = useState('configure');
  const [logs,          setLogs]          = useState([]);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isRunning,     setIsRunning]     = useState(false);
  const [isDirty,       setIsDirty]       = useState(false);
  const [mobileSheet,   setMobileSheet]   = useState(null); // 'palette' | 'inspector' | null

  const nodeTypes    = useMemo(() => ({ automationNode: AutomationNode }), []);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  /* ── Load ────────────────────────────────────────────────────────────── */
  const loadWorkflow = useCallback(async () => {
    try {
      const res  = await apiClient(`/workflows/${id}`);
      const data = res.workflow;
      setWorkflow(data);
      if (data.nodes?.length) {
        setNodes(data.nodes.map((n) => ({
          id:       n.id,
          type:     'automationNode',
          position: n.position || { x: 120, y: 120 },
          data:     n.data    || { label: n.type, type: n.type },
        })));
      }
      setEdges((data.edges || []).map((e, i) => ({ 
        ...e, 
        id: e.id || `edge-${i}`,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined
      })));
      setIsDirty(false);
    } catch (err) {
      toast.error(`Unable to load workflow: ${err.message}`);
    }
  }, [id, toast]);

  useEffect(() => { loadWorkflow(); }, [loadWorkflow]);
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  /* ── Canvas handlers ─────────────────────────────────────────────────── */
  const onNodesChange = useCallback((changes) => { setNodes((c) => applyNodeChanges(changes, c)); setIsDirty(true); }, []);
  const onEdgesChange = useCallback((changes) => { setEdges((c) => applyEdgeChanges(changes, c)); setIsDirty(true); }, []);
  const onConnect     = useCallback((conn)    => { setEdges((c) => addEdge({ ...conn, animated: true }, c)); setIsDirty(true); }, []);

  /* ── Save ────────────────────────────────────────────────────────────── */
  const save = async ({ silent = false } = {}) => {
    if (!workflow) return;
    setIsSaving(true);
    try {
      const backendNodes = nodes.map((n) => ({ id: n.id, type: n.data.type || 'ACTION_HTTP', data: n.data, position: n.position }));
      const backendEdges = edges.map((e, i) => ({ id: e.id || `edge-${i}`, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null, targetHandle: e.targetHandle || null }));
      const res = await apiClient(`/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: workflow.name, description: workflow.description, triggerType: workflow.triggerType || 'manual', status: workflow.status || 'draft', nodes: backendNodes, edges: backendEdges }),
      });
      setWorkflow(res.workflow);
      setIsDirty(false);
      if (!silent) toast.success('Workflow saved.');
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Run ─────────────────────────────────────────────────────────────── */
  const run = async () => {
    setIsRunning(true);
    setActiveTab('activity');
    setLogs([{ startedAt: new Date().toISOString(), nodeId: 'SYSTEM', status: 'pending', message: 'Workflow queued…' }]);
    try {
      await save({ silent: true });
      const res = await apiClient(`/workflows/${id}/trigger`, { method: 'POST' });
      pollingRef.current = setInterval(async () => {
        try {
          const exec = await apiClient(`/workflows/executions/${res.executionId}`);
          if (exec.logs) setLogs(exec.logs);
          if (['completed', 'failed'].includes(exec.status)) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsRunning(false);
            exec.status === 'completed' ? toast.success('Workflow completed.') : toast.error('Workflow failed.');
          }
        } catch {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsRunning(false);
        }
      }, 1000);
    } catch {
      setIsRunning(false);
    }
  };

  /* ── Node helpers ────────────────────────────────────────────────────── */
  const addNode = (type) => {
    const def = NODE_DEF[type] || NODE_DEF.ACTION_HTTP;

    // Default data per node type
    const defaultData = {
      label: def.label,
      type,
    };
    if (type === 'ACTION_HTTP')    Object.assign(defaultData, { url: '', method: 'GET' });
    if (type === 'ACTION_EMAIL')   Object.assign(defaultData, { to: '', subject: '', body: '' });
    if (type === 'ACTION_SLACK')   Object.assign(defaultData, { webhookUrl: '', message: '' });
    if (type === 'ACTION_DISCORD') Object.assign(defaultData, { webhookUrl: '', message: '' });
    if (type === 'LOGIC_DELAY')    Object.assign(defaultData, { duration: 5, unit: 'seconds' });
    if (type === 'LOGIC_LOOP')     Object.assign(defaultData, { arrayInput: '', itemVariableName: 'item' });
    if (type === 'LOGIC_BRANCH')   Object.assign(defaultData, { condition: '' });
    if (type === 'ACTION_AI_SUMMARIZE') Object.assign(defaultData, { text: '', length: 'medium' });
    if (type === 'ACTION_AI_EXTRACT')   Object.assign(defaultData, { text: '', extractionSchema: '' });
    if (type === 'ACTION_AI_DECIDE')    Object.assign(defaultData, { text: '', criteria: '' });

    const newNode = {
      id:       `node-${Date.now()}`,
      type:     'automationNode',
      position: { x: 380 + nodes.length * 40, y: 160 + nodes.length * 60 },
      data:     defaultData,
    };
    setNodes((c) => [...c, newNode]);
    setSelectedNodeId(newNode.id);
    setActiveTab('configure');
    setIsDirty(true);
    setMobileSheet('inspector');
  };

  const updateWorkflow = (field, value) => { setWorkflow((c) => ({ ...c, [field]: value })); setIsDirty(true); };
  const updateNode     = (field, value) => {
    setNodes((c) => c.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, [field]: value } } : n));
    setIsDirty(true);
  };
  const deleteNode = () => {
    if (!selectedNode || selectedNode.id === 'trigger') return;
    setNodes((c) => c.filter((n) => n.id !== selectedNode.id));
    setEdges((c) => c.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNodeId(null);
    setIsDirty(true);
  };

  /* ── Inspector content ───────────────────────────────────────────────── */
  const inspectorContent = activeTab === 'activity'
    ? <ActivityPanel logs={logs} />
    : selectedNode
      ? <NodeInspector node={selectedNode} workflow={workflow} onUpdate={updateNode} onDelete={deleteNode} />
      : <WorkflowDetails workflow={workflow} onUpdate={updateWorkflow} nodes={nodes} edges={edges} />;

  /* ─────────────────────────────────────────────────────────────────────── */
  /* Render                                                                   */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="h-screen overflow-hidden bg-[#f1f3f8] font-body text-on-background flex flex-col">

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 px-4 sm:px-5 bg-surface border-b border-outline-variant/10 shadow-sm flex items-center justify-between gap-3 z-30">
        {/* Left: back + name */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/workflows')}
            className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/8 transition-all"
            aria-label="Back to workflows"
          >
            <Icon name="arrow_back" className="text-[20px]" />
          </button>
          <div className="hidden xs:block w-px h-5 bg-outline-variant/20" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-background truncate max-w-[200px] sm:max-w-sm">
              {workflow?.name || 'Loading…'}
            </p>
            <p className="text-[10px] text-on-surface-variant hidden sm:block">
              {isDirty
                ? <span className="text-amber-600 font-semibold">Unsaved changes</span>
                : <span>All changes saved</span>}
            </p>
          </div>
        </div>

        {/* Center: status chip */}
        <div className="hidden md:flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            workflow?.status === 'active'
              ? 'bg-primary/10 text-primary'
              : workflow?.status === 'archived'
              ? 'bg-surface-container-highest text-on-surface-variant'
              : 'bg-amber-50 text-amber-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${workflow?.status === 'active' ? 'bg-primary animate-pulse' : 'bg-current opacity-60'}`} />
            {workflow?.status || 'draft'}
          </span>
          <span className="text-[10px] text-on-surface-variant font-label">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''} · {edges.length} connection{edges.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Mobile: palette */}
          <button
            onClick={() => setMobileSheet('palette')}
            className="xl:hidden p-2.5 rounded-xl bg-surface-container-low text-primary hover:bg-primary/10 transition-all"
            aria-label="Add action"
          >
            <Icon name="add" className="text-[20px]" />
          </button>

          {/* Save */}
          <button
            onClick={() => save()}
            disabled={isSaving || !workflow}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-background text-xs font-bold hover:bg-surface-container-high border border-outline-variant/15 disabled:opacity-50 transition-all"
          >
            <Icon name="save" className="text-[17px] text-on-surface-variant" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>

          {/* Run */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={run}
            disabled={isRunning || !workflow}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-60 inline-flex items-center gap-1.5 transition-all"
          >
            <Icon
              name={isRunning ? 'sync' : 'play_arrow'}
              className={`text-[17px] ${isRunning ? 'animate-spin' : ''}`}
            />
            {isRunning ? 'Running…' : 'Run'}
          </motion.button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">

        {/* Left palette — desktop only */}
        <aside className="hidden xl:flex w-72 shrink-0 flex-col bg-surface border-r border-outline-variant/10 overflow-y-auto">
          <div className="px-5 pt-5 pb-2">
            <p className="font-headline text-base font-bold text-on-background">Build workflow</p>
            <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">Add actions, then draw connections between handles.</p>
          </div>
          <div className="px-5 pb-5 mt-4">
            <Palette onAdd={addNode} />
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 min-w-0 relative">
          {/* Floating step counter */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface/95 backdrop-blur px-3.5 py-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-[11px] font-bold text-on-background">
              {nodes.length} step{nodes.length !== 1 ? 's' : ''}
            </p>
            <span className="w-px h-3 bg-outline-variant/30 mx-1" />
            <p className="text-[10px] text-on-surface-variant">drag to arrange · connect handles to link</p>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => { setSelectedNodeId(node.id); setActiveTab('configure'); setMobileSheet('inspector'); }}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Background
              color="#94a3b8"
              gap={28}
              size={1}
              style={{ backgroundColor: '#eef0f5' }}
            />
            <Controls
              className="!border-outline-variant/15 !bg-surface !shadow-md !rounded-2xl overflow-hidden"
            />
          </ReactFlow>
        </main>

        {/* Right inspector — lg+ */}
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col bg-surface border-l border-outline-variant/10">
          {/* Tabs */}
          <div className="flex border-b border-outline-variant/10 bg-surface-container-lowest">
            {[{ key: 'configure', label: 'Configure', icon: 'tune' }, { key: 'activity', label: 'Activity', icon: 'receipt_long' }].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] uppercase tracking-wider font-bold border-b-2 transition-all',
                  activeTab === key
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest',
                ].join(' ')}
              >
                <Icon name={icon} className="text-[15px]" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab + (selectedNodeId || '')}>
                {inspectorContent}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Save button at bottom of inspector */}
          <div className="px-5 py-4 border-t border-outline-variant/10 bg-surface-container-lowest">
            <button
              onClick={() => save()}
              disabled={isSaving || !workflow || !isDirty}
              className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-background text-xs font-bold hover:bg-surface-container-highest border border-outline-variant/10 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
            >
              <Icon name="save" className="text-[16px]" />
              {isSaving ? 'Saving…' : isDirty ? 'Save changes' : 'All saved'}
            </button>
          </div>
        </aside>
      </div>

      {/* ── Mobile bottom sheet ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[60] bg-scrim/40 backdrop-blur-sm"
              onClick={() => setMobileSheet(null)}
            />
            <motion.section
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] max-h-[80vh] overflow-y-auto rounded-t-3xl bg-surface shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-surface px-5 pt-4 pb-2 flex items-center justify-between border-b border-outline-variant/10">
                <div className="w-10 h-1 rounded-full bg-outline-variant/30 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  {mobileSheet === 'palette' ? 'Add actions' : 'Configure'}
                </p>
                <button onClick={() => setMobileSheet(null)} className="p-1.5 rounded-xl hover:bg-surface-container-highest transition-colors">
                  <Icon name="close" className="text-[18px] text-on-surface-variant" />
                </button>
              </div>
              <div className="p-5">
                {mobileSheet === 'palette' ? <Palette onAdd={addNode} /> : inspectorContent}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}