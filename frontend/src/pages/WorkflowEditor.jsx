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
// shape: 'pill' | 'diamond' | 'hexagon' | 'parallelogram' | 'rect'
const NODE_DEF = {
  TRIGGER_MANUAL:      { icon: 'bolt',           label: 'Manual Trigger', chip: 'Trigger',     shape: 'pill',         gradientFrom: '#1a47a8', gradientTo: '#2259bf' },
  TRIGGER_WEBHOOK:     { icon: 'webhook',         label: 'Webhook',        chip: 'Trigger',     shape: 'pill',         gradientFrom: '#1a47a8', gradientTo: '#2259bf' },
  TRIGGER_CRON:        { icon: 'schedule',        label: 'Schedule',       chip: 'Trigger',     shape: 'pill',         gradientFrom: '#1a47a8', gradientTo: '#2259bf' },
  ACTION_HTTP:         { icon: 'http',            label: 'HTTP Request',   chip: 'Action',      shape: 'rect',         gradientFrom: '#1a47a8', gradientTo: '#3067d4' },
  ACTION_EMAIL:        { icon: 'mail',            label: 'Send Email',     chip: 'Action',      shape: 'rect',         gradientFrom: '#364f7e', gradientTo: '#4a6aa8' },
  LOGIC_BRANCH:        { icon: 'call_split',      label: 'Branch',         chip: 'Logic',       shape: 'diamond',      gradientFrom: '#1e1e24', gradientTo: '#3c3c43', handles: [{ id: 'true', color: '#55cf8b', top: '33%' }, { id: 'false', color: '#ff6b64', top: '66%' }] },
  ACTION_AI_SUMMARIZE: { icon: 'auto_awesome',    label: 'AI Summarize',   chip: 'AI Action',   shape: 'hexagon',      gradientFrom: '#7b2cbf', gradientTo: '#9d4edd' },
  ACTION_AI_EXTRACT:   { icon: 'troubleshoot',    label: 'AI Extract',     chip: 'AI Action',   shape: 'hexagon',      gradientFrom: '#7b2cbf', gradientTo: '#9d4edd' },
  ACTION_AI_DECIDE:    { icon: 'psychology',      label: 'AI Decide',      chip: 'AI Action',   shape: 'hexagon',      gradientFrom: '#7b2cbf', gradientTo: '#9d4edd' },
  // Brand colors — accepted exception per Phase 6 spec decision #6
  ACTION_SLACK:        { icon: 'chat',            label: 'Slack Message',  chip: 'Integration', shape: 'rect',         gradientFrom: '#e01e5a', gradientTo: '#4a154b' },
  ACTION_DISCORD:      { icon: 'forum',           label: 'Discord Message',chip: 'Integration', shape: 'rect',         gradientFrom: '#5865F2', gradientTo: '#404EED' },
  LOGIC_DELAY:         { icon: 'hourglass_empty', label: 'Delay',          chip: 'Logic',       shape: 'stadium',      gradientFrom: '#f59e0b', gradientTo: '#d97706' },
  LOGIC_LOOP:          { icon: 'repeat',          label: 'For Each',       chip: 'Logic',       shape: 'parallelogram',gradientFrom: '#10b981', gradientTo: '#059669', handles: [{ id: 'loop', color: '#10b981', bottom: -7, left: '40%', position: 'bottom' }, { id: 'done', color: '#6b7280' }] },
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

// Trigger types users can swap to from the palette (replaces the default manual trigger)
const TRIGGER_PALETTE_ITEMS = [
  { type: 'TRIGGER_MANUAL',  title: 'Manual Trigger', desc: 'Start the workflow manually',       icon: 'bolt' },
  { type: 'TRIGGER_WEBHOOK', title: 'Webhook Trigger',desc: 'Trigger via HTTP POST from any app', icon: 'webhook' },
  { type: 'TRIGGER_CRON',   title: 'Schedule Trigger',desc: 'Run on a recurring cron schedule',  icon: 'schedule' },
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


/* Inline SVG icons per node type — completely distinct, not just clip-path rectangles */
const NODE_ICON_SVG = {
  // Trigger: lightning bolt in circle
  TRIGGER_MANUAL: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="20" r="20" fill="url(#gTM)"/>
      <defs><radialGradient id="gTM" cx="30%" cy="30%"><stop offset="0%" stopColor="#4a80e8"/><stop offset="100%" stopColor="#1a3fa8"/></radialGradient></defs>
      <path d="M22 10 L14 22 H20 L18 30 L26 18 H20 L22 10Z" fill="white" opacity="0.95"/>
    </svg>
  ),
  TRIGGER_WEBHOOK: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="20" r="20" fill="url(#gTW)"/>
      <defs><radialGradient id="gTW" cx="30%" cy="30%"><stop offset="0%" stopColor="#4a80e8"/><stop offset="100%" stopColor="#1a3fa8"/></radialGradient></defs>
      <path d="M12 28 C14 22 18 20 22 16 M22 16 C24 14 24 10 22 8 M16 20 C14 18 10 18 8 20 M22 8 C26 8 30 12 30 16 C30 20 26 22 24 24" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.95"/>
    </svg>
  ),
  TRIGGER_CRON: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <circle cx="20" cy="20" r="20" fill="url(#gTC)"/>
      <defs><radialGradient id="gTC" cx="30%" cy="30%"><stop offset="0%" stopColor="#4a80e8"/><stop offset="100%" stopColor="#1a3fa8"/></radialGradient></defs>
      <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
      <line x1="20" y1="12" x2="20" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="20" x2="25" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  // HTTP: double-arrow / exchange
  ACTION_HTTP: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gHTTP)"/>
      <defs><linearGradient id="gHTTP" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#4a80e8"/><stop offset="100%" stopColor="#1a3fa8"/></linearGradient></defs>
      <path d="M10 16 H30 M26 12 L30 16 L26 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M30 24 H10 M14 20 L10 24 L14 28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
    </svg>
  ),
  // Email: envelope
  ACTION_EMAIL: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gEM)"/>
      <defs><linearGradient id="gEM" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#4a6aa8"/><stop offset="100%" stopColor="#2a3f6e"/></linearGradient></defs>
      <rect x="8" y="13" width="24" height="16" rx="3" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
      <path d="M8 16 L20 24 L32 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9"/>
    </svg>
  ),
  // Slack: hash grid
  ACTION_SLACK: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gSL)"/>
      <defs><linearGradient id="gSL" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#e01e5a"/><stop offset="100%" stopColor="#4a154b"/></linearGradient></defs>
      <path d="M14 11 C14 9 16 9 16 11 L16 22 C16 24 14 24 14 22 C14 24 12 24 12 22 C12 20 14 20 14 20Z" fill="white" opacity="0.9"/>
      <path d="M22 11 C22 9 24 9 24 11 L24 22 C24 24 22 24 22 22 C22 24 20 24 20 22 C20 20 22 20 22 20Z" fill="white" opacity="0.7"/>
      <path d="M11 24 C9 24 9 22 11 22 L22 22 C24 22 24 24 22 24 C24 24 24 26 22 26 C20 26 20 24 20 24Z" fill="white" opacity="0.9"/>
      <path d="M11 16 C9 16 9 14 11 14 L22 14 C24 14 24 16 22 16 C24 16 24 18 22 18 C20 18 20 16 20 16Z" fill="white" opacity="0.7"/>
    </svg>
  ),
  // Discord: waveform
  ACTION_DISCORD: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gDS)"/>
      <defs><linearGradient id="gDS" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#7289da"/><stop offset="100%" stopColor="#404EED"/></linearGradient></defs>
      <path d="M14 24 C16 20 18 16 20 16 C22 16 24 20 26 24 C24 28 22 28 20 26 C18 28 16 28 14 24Z" fill="white" opacity="0.9"/>
      <circle cx="17" cy="22" r="2" fill="#404EED"/>
      <circle cx="23" cy="22" r="2" fill="#404EED"/>
      <path d="M12 18 C14 14 16 13 20 13 C24 13 26 14 28 18" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  ),
  // Branch: diverging paths (diamond-ish card)
  LOGIC_BRANCH: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gBR)"/>
      <defs><linearGradient id="gBR" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#374151"/><stop offset="100%" stopColor="#1f2937"/></linearGradient></defs>
      <path d="M20 10 L20 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 18 L12 28" stroke="#55cf8b" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 18 L28 28" stroke="#ff6b64" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="18" r="3" fill="white"/>
      <circle cx="12" cy="29" r="2" fill="#55cf8b"/>
      <circle cx="28" cy="29" r="2" fill="#ff6b64"/>
    </svg>
  ),
  // AI Summarize: sparkle/star
  ACTION_AI_SUMMARIZE: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gAIS)"/>
      <defs><linearGradient id="gAIS" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#9d4edd"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs>
      <path d="M20 8 L22 16 L30 14 L24 20 L30 26 L22 24 L20 32 L18 24 L10 26 L16 20 L10 14 L18 16 Z" fill="white" opacity="0.95"/>
    </svg>
  ),
  // AI Extract: magnifying lens
  ACTION_AI_EXTRACT: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gAIE)"/>
      <defs><linearGradient id="gAIE" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#9d4edd"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs>
      <circle cx="18" cy="18" r="8" stroke="white" strokeWidth="2.5" fill="none" opacity="0.9"/>
      <line x1="24" y1="24" x2="31" y2="31" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="14" y1="18" x2="22" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <line x1="18" y1="14" x2="18" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  ),
  // AI Decide: brain/neural
  ACTION_AI_DECIDE: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gAID)"/>
      <defs><linearGradient id="gAID" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#9d4edd"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs>
      <path d="M20 12 C14 12 10 16 10 20 C10 22 11 24 13 26 C13 28 14 30 16 30 L24 30 C26 30 27 28 27 26 C29 24 30 22 30 20 C30 16 26 12 20 12Z" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
      <line x1="20" y1="12" x2="20" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="15" y1="20" x2="25" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="20" y1="15" x2="20" y2="25" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <circle cx="17" cy="19" r="1.5" fill="white" opacity="0.8"/>
      <circle cx="23" cy="19" r="1.5" fill="white" opacity="0.8"/>
    </svg>
  ),
  // Delay: hourglass
  LOGIC_DELAY: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gDL)"/>
      <defs><linearGradient id="gDL" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#b45309"/></linearGradient></defs>
      <path d="M12 10 H28" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 30 H28" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 10 L26 10 L20 20 L26 30 L14 30 L20 20 Z" fill="white" opacity="0.25"/>
      <path d="M14 10 L26 10 L20 20 L14 10Z" fill="white" opacity="0.9"/>
      <path d="M20 20 L14 30 L26 30 Z" fill="white" opacity="0.5"/>
    </svg>
  ),
  // Loop: circular arrows
  LOGIC_LOOP: () => (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#gLP)"/>
      <defs><linearGradient id="gLP" x1="0" y1="0" x2="40" y2="40"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs>
      <path d="M20 12 C14 12 10 16 10 20 C10 25.5 14.5 30 20 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9"/>
      <path d="M20 30 C25.5 30 30 25.5 30 20 C30 16 26 12 20 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M17 8 L20 12 L23 8" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="white" opacity="0.9"/>
    </svg>
  ),
};

function NodeIcon({ type }) {
  const Svg = NODE_ICON_SVG[type];
  if (Svg) return <Svg />;
  const def = NODE_DEF[type] || NODE_DEF.ACTION_HTTP;
  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${def.gradientFrom}, ${def.gradientTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={def.icon} className="text-white text-[20px]" />
    </div>
  );
}

function AutomationNode({ data, id, selected }) {
  const def       = NODE_DEF[data.type] || NODE_DEF.ACTION_HTTP;
  const isTrigger = id === 'trigger' || data.type?.startsWith('TRIGGER_');

  const summaryMap = {
    ACTION_HTTP:         data.url              ? data.url                               : 'No endpoint configured',
    ACTION_EMAIL:        data.to               ? data.to                                : 'No recipient configured',
    ACTION_SLACK:        data.webhookUrl       ? data.webhookUrl.slice(0, 30)           : 'No webhook URL',
    ACTION_DISCORD:      data.webhookUrl       ? data.webhookUrl.slice(0, 30)           : 'No webhook URL',
    LOGIC_BRANCH:        data.condition        ? `If: ${data.condition}`                : 'No condition set',
    LOGIC_DELAY:         data.duration         ? `Wait ${data.duration} ${data.unit || 's'}` : 'No duration',
    LOGIC_LOOP:          data.arrayInput       ? `Each: ${data.arrayInput}`             : 'No array',
    ACTION_AI_SUMMARIZE: data.text             ? `${data.length || 'medium'} summary`  : 'No text',
    ACTION_AI_EXTRACT:   data.extractionSchema ? 'Schema configured'                   : 'No schema',
    ACTION_AI_DECIDE:    data.criteria         ? data.criteria.slice(0, 32)            : 'No criteria',
    TRIGGER_WEBHOOK:     'External webhook POST',
    TRIGGER_CRON:        data.cron             ? data.cron                             : 'No schedule',
    TRIGGER_MANUAL:      'Starts manually',
  };
  const summary = summaryMap[data.type] || 'Configured';
  const grad    = `linear-gradient(135deg, ${def.gradientFrom}, ${def.gradientTo})`;
  const isAI    = data.type?.startsWith('ACTION_AI');
  const isBranch = data.type === 'LOGIC_BRANCH';

  const selStyle = selected
    ? { outline: '2.5px solid #2259bf', outlineOffset: 3, boxShadow: '0 0 0 6px rgba(34,89,191,0.15)', transform: 'scale(1.04)' }
    : {};

  /* ── RECT (actions, integrations) — two-tone card with icon ─────────── */
  return (
    <div style={{ width: 220, transition: 'all 0.2s', ...selStyle, borderRadius: 14,
      boxShadow: selected ? undefined : '0 6px 24px rgba(0,0,0,0.18)',
    }} className="relative cursor-pointer hover:scale-[1.02]">
      
      {/* Inner wrapper to clip the card contents without clipping the handles */}
      <div style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: grad, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <NodeIcon type={data.type} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{def.chip}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
          </div>
        </div>
        <div style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '8px 16px' }}>
          <p style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{summary}</p>
        </div>
      </div>
      {!isTrigger && (
        <Handle type="target" position={Position.Left}
          className="!w-3.5 !h-3.5 !rounded-full !bg-white !border-2 !border-blue-400 !shadow-md" style={{ left: -8 }} />
      )}
      {def.handles ? (
        def.handles.map(h => (
          <Handle key={h.id} type="source" id={h.id}
            position={h.position === 'bottom' ? Position.Bottom : Position.Right}
            className="!w-3.5 !h-3.5 !rounded-full !border-2 !border-white !shadow-md"
            style={{ backgroundColor: h.color,
              ...(h.top !== undefined && { top: h.top }),
              ...(h.bottom !== undefined && { bottom: h.bottom }),
              ...(h.left !== undefined && { left: h.left }),
            }} />
        ))
      ) : (
        <Handle type="source" position={Position.Right}
          className="!w-3.5 !h-3.5 !rounded-full !bg-blue-500 !border-2 !border-white !shadow-md" style={{ right: -8 }} />
      )}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────── */
/* Left palette                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function Palette({ onAdd, onChangeTrigger, currentTriggerType }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Trigger switcher */}
      <div>
        <p className="mb-3 font-label text-[10px] uppercase tracking-[.16em] font-bold text-on-surface-variant/70">Trigger</p>
        <div className="flex flex-col gap-2">
          {TRIGGER_PALETTE_ITEMS.map((item) => {
            const def = NODE_DEF[item.type] || NODE_DEF.TRIGGER_MANUAL;
            const isActive = currentTriggerType === item.type;
            return (
              <motion.button
                key={item.type}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChangeTrigger(item.type)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all group ${isActive ? 'border-primary/40 bg-primary/8 shadow-sm' : 'border-outline-variant/10 bg-surface-container-lowest hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm'}`}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${def.gradientFrom}, ${def.gradientTo})` }}
                >
                  <Icon name={item.icon} className="text-white text-[18px]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-on-background">{item.title}</span>
                  <span className="block mt-0.5 text-[11px] text-on-surface-variant">{item.desc}</span>
                </span>
                {isActive
                  ? <Icon name="check_circle" className="text-[20px] text-primary" />
                  : <Icon name="radio_button_unchecked" className="text-[20px] text-on-surface-variant/30 group-hover:text-primary/40 transition-colors" />
                }
              </motion.button>
            );
          })}
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

const STATUS_META = {
  success:   { icon: 'check_circle',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Success' },
  failed:    { icon: 'cancel',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Failed'  },
  skipped:   { icon: 'remove_circle', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Skipped' },
  pending:   { icon: 'pending',       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Queued'  },
  running:   { icon: 'autorenew',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Running' },
};

function ActivityLogItem({ log, index, isLast, nodes }) {
  const [expanded, setExpanded] = useState(false);
  const st      = STATUS_META[log.status] || STATUS_META.running;
  const node    = nodes ? nodes.find(n => n.id === log.nodeId) : null;
  const nodeType = node ? node.data.type : null;
  const nodeDef  = nodeType ? (NODE_DEF[nodeType] || null) : null;
  const nodeLabel = node ? node.data.label : null;
  const hasOutput = log.output && typeof log.output === 'object' && Object.keys(log.output).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="flex gap-3"
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 relative z-10"
          style={{ background: st.bg, border: `2px solid ${st.color}` }}
        >
          <Icon name={st.icon} className="text-[15px]" style={{ color: st.color }} />
        </div>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(148,163,184,0.2)', minHeight: 16 }} />}
      </div>

      {/* Card */}
      <div className="flex-1 mb-3 min-w-0">
        <button
          className="w-full text-left"
          onClick={() => hasOutput && setExpanded((p) => !p)}
          style={{ cursor: hasOutput ? 'pointer' : 'default' }}
        >
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden hover:border-outline-variant/25 transition-colors">
            {/* Header row */}
            <div className="px-3.5 pt-3 pb-2.5 flex items-start gap-2.5">
              {/* Node type icon chip */}
              {nodeDef && (
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `linear-gradient(135deg, ${nodeDef.gradientFrom}, ${nodeDef.gradientTo})` }}
                >
                  <Icon name={nodeDef.icon} className="text-[12px] text-white" />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-on-background truncate">
                    {nodeLabel || (nodeDef ? nodeDef.label : (log.nodeId || 'System'))}
                  </p>
                  <span
                    className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
                {log.nodeId && (
                  <p className="text-[9px] font-mono text-on-surface-variant/60 mt-0.5 truncate">{log.nodeId}</p>
                )}
              </div>
            </div>

            {/* Message */}
            {(log.message || log.error) && (
              <p className="px-3.5 pb-2.5 text-[11px] leading-relaxed text-on-surface-variant">
                {log.error || log.message}
              </p>
            )}

            {/* Expand toggle */}
            {hasOutput && (
              <div
                className="px-3.5 pb-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
                style={{ color: st.color }}
              >
                <Icon name={expanded ? 'expand_less' : 'expand_more'} className="text-[14px]" />
                {expanded ? 'Hide output' : 'View output'}
              </div>
            )}
          </div>
        </button>

        {/* Expandable output — human readable */}
        <AnimatePresence>
          {expanded && hasOutput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 bg-surface-container rounded-2xl border border-outline-variant/10 p-3 space-y-2">
                {Object.entries(log.output).map(([k, v]) => {
                  const isLong = typeof v === 'string' && v.length > 60;
                  const isObj  = v !== null && typeof v === 'object';
                  const display = isObj ? JSON.stringify(v, null, 2) : String(v ?? '');
                  const label  = k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
                  return (
                    <div key={k} className={`${isLong || isObj ? 'flex flex-col gap-1' : 'flex items-start gap-2 justify-between'}`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/60 shrink-0 mt-0.5">{label}</span>
                      {isObj ? (
                        <pre className="text-[9px] font-mono text-on-surface-variant bg-surface-container-highest rounded-lg p-2 overflow-x-auto whitespace-pre-wrap leading-relaxed">{display}</pre>
                      ) : (
                        <span className={`text-[10px] font-medium text-on-surface leading-relaxed ${isLong ? 'block' : 'text-right max-w-[55%]'} break-words`}>{display}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ActivityPanel({ logs, nodes }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant gap-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <Icon name="play_circle" className="text-[32px] text-primary/40" />
        </div>
        <div>
          <p className="text-sm font-bold text-on-background">No runs yet</p>
          <p className="mt-1.5 text-xs text-on-surface-variant leading-relaxed">Click <strong>Run</strong> to execute this workflow<br/>and watch the results appear here.</p>
        </div>
      </div>
    );
  }

  const counts = logs.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-0">
      {/* Summary bar */}
      <div className="mb-4 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name="receipt_long" className="text-[16px] text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Execution result</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {Object.entries(counts).map(([status, n]) => {
              const m = STATUS_META[status] || STATUS_META.running;
              return (
                <span key={status} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide" style={{ color: m.color }}>
                  <Icon name={m.icon} className="text-[11px]" />{n} {m.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline */}
      {logs.map((log, i) => (
        <ActivityLogItem key={i} log={log} index={i} isLast={i === logs.length - 1} nodes={nodes} />
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
          data:     { ...(n.data || {}), type: n.data?.type || n.type, label: n.data?.label || n.type },
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

  /* ── Validation ──────────────────────────────────────────────────────── */
  const validateNodes = () => {
    for (const node of nodes) {
      const { type, label } = node.data;
      const hasVar = (str) => typeof str === 'string' && str.includes('{{');

      if (type === 'ACTION_HTTP') {
        if (!node.data.url) return `${label}: URL is required.`;
        if (!hasVar(node.data.url) && !node.data.url.startsWith('http://') && !node.data.url.startsWith('https://')) return `${label}: URL must start with http:// or https://`;
      }
      else if (type === 'ACTION_EMAIL') {
        if (!node.data.to || !node.data.subject || !node.data.body) return `${label}: To, Subject, and Message are required.`;
        if (!hasVar(node.data.to) && !node.data.to.includes('@')) return `${label}: 'To' must be a valid email address.`;
      }
      else if (type === 'ACTION_SLACK') {
        if (!node.data.webhookUrl || !node.data.message) return `${label}: Webhook URL and Message are required.`;
        if (!hasVar(node.data.webhookUrl) && !node.data.webhookUrl.startsWith('http')) return `${label}: Invalid Webhook URL.`;
      }
      else if (type === 'ACTION_DISCORD') {
        if (!node.data.webhookUrl || !node.data.message) return `${label}: Webhook URL and Message are required.`;
        if (!hasVar(node.data.webhookUrl) && !node.data.webhookUrl.startsWith('http')) return `${label}: Invalid Webhook URL.`;
      }
      else if (type === 'LOGIC_DELAY') {
        if (node.data.duration === undefined || node.data.duration === '') return `${label}: Duration is required.`;
        if (Number(node.data.duration) <= 0) return `${label}: Duration must be greater than 0.`;
      }
      else if (type === 'LOGIC_LOOP') {
        if (!node.data.arrayInput) return `${label}: Array Input is required.`;
      }
      else if (type === 'LOGIC_BRANCH') {
        if (!node.data.condition) return `${label}: Condition is required.`;
      }
      else if (type === 'ACTION_AI_SUMMARIZE') {
        if (!node.data.text) return `${label}: Text to summarize is required.`;
      }
      else if (type === 'ACTION_AI_EXTRACT') {
        if (!node.data.text || !node.data.extractionSchema) return `${label}: Text and Extraction Schema are required.`;
      }
      else if (type === 'ACTION_AI_DECIDE') {
        if (!node.data.text || !node.data.criteria) return `${label}: Text and Decision Criteria are required.`;
      }
      else if (type === 'TRIGGER_CRON') {
        if (!node.data.cron) return `${label}: Cron expression is required.`;
        if (node.data.cron.trim().split(/\s+/).length !== 5) return `${label}: Cron must have exactly 5 parts (e.g. * * * * *).`;
      }
    }
    return null;
  };

  /* ── Run ─────────────────────────────────────────────────────────────── */
  const run = async () => {
    const errorMsg = validateNodes();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setIsRunning(true);
    setActiveTab('activity');
    setLogs([{ startedAt: new Date().toISOString(), nodeId: 'SYSTEM', status: 'pending', message: 'Workflow queued…' }]);
    try {
      await save({ silent: true });
      const res = await apiClient(`/workflows/${id}/trigger`, { method: 'POST' });
      pollingRef.current = setInterval(async () => {
        try {
          const exec = await apiClient(`/workflows/executions/${res.executionId}`);
          if (exec.logs && exec.logs.length > 0) {
            setLogs(exec.logs);
          } else if (['completed', 'failed'].includes(exec.status)) {
            setLogs(prev => prev.length ? prev.map(l => l.nodeId === 'SYSTEM' ? { ...l, status: exec.status, message: `Workflow ${exec.status}` } : l) : [{ startedAt: new Date().toISOString(), nodeId: 'SYSTEM', status: exec.status, message: `Workflow ${exec.status}` }]);
          }
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

  const changeTrigger = (type) => {
    const def = NODE_DEF[type] || NODE_DEF.TRIGGER_MANUAL;
    const defaultData = { label: def.label, type };
    if (type === 'TRIGGER_CRON') Object.assign(defaultData, { cron: '' });
    setNodes((c) => c.map((n) => n.id === 'trigger' ? { ...n, data: defaultData } : n));
    setWorkflow((c) => ({ ...c, triggerType: type === 'TRIGGER_WEBHOOK' ? 'webhook' : type === 'TRIGGER_CRON' ? 'schedule' : 'manual' }));
    setSelectedNodeId('trigger');
    setActiveTab('configure');
    setIsDirty(true);
    toast.success(`Trigger changed to ${def.label}`);
  };

  /* ── Inspector content ───────────────────────────────────────────────── */
  const inspectorContent = activeTab === 'activity'
    ? <ActivityPanel logs={logs} nodes={nodes} />
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
            <Palette onAdd={addNode} onChangeTrigger={changeTrigger} currentTriggerType={nodes.find(n => n.id === 'trigger')?.data?.type || 'TRIGGER_MANUAL'} />
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
                {mobileSheet === 'palette' ? <Palette onAdd={addNode} onChangeTrigger={changeTrigger} currentTriggerType={nodes.find(n => n.id === 'trigger')?.data?.type || 'TRIGGER_MANUAL'} /> : inspectorContent}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}