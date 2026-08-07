import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import { useTheme } from '../context/ThemeContext';

/* ─── Animation helper ──────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SlideIn({ children, from = 'left', delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  const x = from === 'left' ? -40 : 40;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Ticker ────────────────────────────────────────────────── */
function AnalyticsTicker() {
  const [stats, setStats] = useState({
    totalWorkflows: '—',
    totalExecutions: '—',
    avgExecutionSeconds: '—',
    successRate: '—',
  });

  useEffect(() => {
    fetch('/api/analytics/public')
      .then(r => r.json())
      .then(d => {
        if (!d.error) setStats({
          totalWorkflows: d.totalWorkflows.toLocaleString(),
          totalExecutions: d.totalExecutions.toLocaleString(),
          avgExecutionSeconds: `${d.avgExecutionSeconds}s`,
          successRate: `${d.successRate}%`,
        });
      })
      .catch(() => {});
  }, []);

  const items = [
    `⚡ Avg Execution: ${stats.avgExecutionSeconds}`,
    `🔄 Total Executions: ${stats.totalExecutions}`,
    `🛡️ Success Rate: ${stats.successRate}`,
    `📋 Active Workflows: ${stats.totalWorkflows}`,
  ];

  return (
    <div className="bg-[#FFF8F3]/90 dark:bg-gray-950 backdrop-blur-sm border-b border-[#ff4a00]/10 dark:border-transparent overflow-hidden py-2">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 35s linear infinite;
        }
      `}</style>
      <div className="flex gap-16 w-max px-8 animate-ticker">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-[11px] font-mono font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────────── */
function DarkToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:text-white/50 dark:hover:text-white/80"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
    </button>
  );
}

function NavBar({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Execution', href: '#execution' },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-[#FFFCF9]/95 dark:bg-[#0d0d14]/95 border-b border-[#ff4a00]/10 dark:border-white/10 shadow-sm dark:shadow-lg dark:shadow-black/30 backdrop-blur-xl' : 'bg-transparent'} py-4`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-auto flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="#top" className="shrink-0">
          <img src="/logo/automataX.png" alt="automataX" className="h-7 w-auto object-contain dark:brightness-200" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <DarkToggle />
          <button onClick={onLogin} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all">
            Log in
          </button>
          <button onClick={onRegister} className="px-5 py-2 rounded-lg text-white text-sm font-bold transition-all shadow-sm" style={{ background: 'linear-gradient(135deg,#ff4a00,#e04200)', boxShadow: '0 0 20px rgba(255,74,0,0.3)' }}>
            Get started
          </button>
        </div>

        <button className="md:hidden p-2 text-gray-600 dark:text-white/60" onClick={() => setMobileOpen(o => !o)}>
          <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#0d0d14] overflow-hidden"
          >
            <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-3">
              {links.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-gray-700 dark:text-white/60 py-1 dark:hover:text-white">
                  {l.label}
                </a>
              ))}
              <div className="flex gap-3 mt-2 pt-3 border-t border-gray-100 dark:border-white/10">
                <button onClick={onLogin} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-white/60">Log in</button>
                <button onClick={onRegister} className="flex-1 py-2 rounded-lg text-white text-sm font-bold" style={{ background: '#ff4a00' }}>Get started</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── Hero ───────────────────────────────────────────────────── */
function Hero({ onRegister }) {
  return (
    <section id="top" className="relative pt-36 pb-28 px-5 overflow-hidden transition-colors duration-200">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#ff4a00]/20 bg-[#ff4a00]/5 text-[#ff4a00] text-xs font-semibold mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#ff4a00] animate-pulse" />
          Live platform · No credit card needed
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight dark:tracking-tighter text-gray-950 dark:text-white leading-[1.05] mb-6"
        >
          Automate anything.<br />
          <span className="text-[#ff4a00]">Build visually.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-gray-500 dark:text-white/50 leading-relaxed max-w-2xl mx-auto mb-10"
        >
          AutomataX is a visual automation IDE with a built-in AI generator, real-time execution logs, and first-class support for webhooks, AI models, and custom logic.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={onRegister}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ff4a00] text-white font-bold text-base shadow-lg shadow-[#ff4a00]/25 hover:bg-[#e04200] hover:-translate-y-0.5 transition-all"
          >
            Start building free
          </button>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-base hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
          >
            See how it works
          </a>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
        >
          {[
            { n: '11+', label: 'Node types' },
            { n: '3', label: 'Trigger modes' },
            { n: 'AI', label: 'Workflow generation' },
            { n: 'Live', label: 'Execution logs' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black text-[#ff4a00]">{s.n}</p>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Section: How it works ─────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', icon: 'add_box', title: 'Create a workflow', desc: 'Give your workflow a name and choose a trigger — manual click, an inbound webhook, or a cron schedule.' },
    { n: '02', icon: 'account_tree', title: 'Build on the canvas', desc: 'Drag action nodes from the sidebar and connect them by drawing lines between output and input handles.' },
    { n: '03', icon: 'tune', title: 'Configure each node', desc: 'Open the inspector to set URLs, messages, AI prompts, conditions, or delays. Use {{variable}} tokens to pass data between nodes.' },
    { n: '04', icon: 'play_circle', title: 'Run and inspect', desc: 'Click Run to execute. Watch each node light up in real-time in the Activity panel with full output inspection per step.' },
  ];

  return (
    <section id="how-it-works" className="py-24 px-5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4a00] mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Up and running in minutes</h2>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.08}>
              <div className="bg-white dark:bg-[#1e2130] rounded-2xl p-6 border border-gray-100 dark:border-white/8 shadow-sm dark:shadow-lg h-full hover:shadow-md hover:-translate-y-0.5 hover:border-[#ff4a00]/20 dark:hover:border-[#ff4a00]/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-lg bg-[#ff4a00]/10 dark:bg-white/5 flex items-center justify-center">
                    <span className="text-xs font-black text-[#ff4a00] dark:text-gray-400 font-mono">{s.n}</span>
                  </span>
                  <span className="material-symbols-outlined text-[#ff4a00] dark:text-[#ff4a00] text-[22px]">{s.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section 1: Visual Canvas ──────────────────────────────── */
function CanvasSection() {
  const canvasRef = useRef(null);
  const inView = useInView(canvasRef, { once: true, margin: '-100px' });

  const nodeData = [
    {
      label: 'Webhook Trigger',
      icon: 'webhook',
      color: '#2259bf',
      tag: 'TRIGGER',
      fields: [{ k: 'Method', v: 'POST' }, { k: 'Path', v: '/hook/abc123' }],
      status: 'completed',
    },
    {
      label: 'AI Summarize',
      icon: 'auto_awesome',
      color: '#9d4edd',
      tag: 'ACTION',
      fields: [{ k: 'Model', v: 'gemini-1.5-flash' }, { k: 'Max tokens', v: '512' }],
      status: 'running',
    },
    {
      label: 'Send Slack Msg',
      icon: 'chat',
      color: '#e01e5a',
      tag: 'ACTION',
      fields: [{ k: 'Channel', v: '#engineering' }, { k: 'Message', v: '{{ai_output}}' }],
      status: 'pending',
    },
  ];

  const statusCfg = {
    completed: { dot: 'bg-emerald-400', label: 'Done', text: 'text-emerald-600 bg-emerald-50' },
    running:   { dot: 'bg-amber-400 animate-pulse', label: 'Running', text: 'text-amber-600 bg-amber-50' },
    pending:   { dot: 'bg-gray-300', label: 'Queued', text: 'text-gray-400 bg-gray-100' },
  };

  return (
    <section id="features" className="py-24 px-5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: text */}
        <SlideIn from="left">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4a00] mb-3">Visual Canvas</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-5 leading-snug">
            Build complex flows<br />without writing a line.
          </h2>
          <p className="text-base text-gray-500 dark:text-white/50 leading-relaxed mb-8">
            An infinite drag-and-drop canvas lets you wire together HTTP requests, AI actions, email, messaging, and logic nodes just by drawing connections between them.
          </p>
          <ul className="flex flex-col gap-3 mb-8">
            {[
              { icon: 'drag_indicator', t: 'Drag from sidebar palette' },
              { icon: 'linear_scale', t: 'Connect via input/output handles' },
              { icon: 'widgets', t: '11 built-in node types' },
              { icon: 'bolt', t: 'Real-time status per node' },
            ].map(({ icon, t }) => (
              <li key={t} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-400">
                <span className="w-5 h-5 rounded-full bg-[#ff4a00]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#ff4a00] text-[13px]">check</span>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </SlideIn>

        {/* Right: canvas mock */}
        <SlideIn from="right" delay={0.1}>
          <div
            ref={canvasRef}
            className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl dark:shadow-2xl bg-gray-50 dark:bg-[#13151a]"
            style={{ minHeight: 420 }}
          >
            {/* Dot grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#9d4edd18_1px,transparent_1px)] [background-size:24px_24px] dark:[background-size:28px_28px] opacity-70 dark:opacity-100" />

            {/* Top bar */}
            <div className="relative z-10 flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-[10px] text-gray-400 dark:text-white/30 font-mono tracking-widest">WORKFLOW CANVAS</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">LIVE</span>
              </div>
            </div>

            {/* SVG connector paths */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ top: 48 }}
            >
              <motion.path
                d="M 310 110 C 360 110, 360 200, 310 200"
                stroke="#2259bf"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="6 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 0.6 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
              <motion.path
                d="M 310 200 C 360 200, 360 290, 310 290"
                stroke="#9d4edd"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="6 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 0.6 } : {}}
                transition={{ duration: 0.8, delay: 1.0 }}
              />
            </svg>

            {/* Node cards */}
            <div className="relative z-10 flex flex-col gap-3 p-5 pt-4">
              {nodeData.map((n, i) => {
                const s = statusCfg[n.status];
                return (
                  <motion.div
                    key={n.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.2 + i * 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-md dark:shadow-lg w-[280px]"
                    style={{ boxShadow: `0 0 0 1px ${n.color}18, 0 4px 16px rgba(0,0,0,0.08)` }}
                  >
                    {/* Node header */}
                    <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: `${n.color}12`, borderBottom: `1px solid ${n.color}25` }}>
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: n.color }}>
                        <span className="material-symbols-outlined text-white text-[13px]">{n.icon}</span>
                      </span>
                      <span className="text-gray-900 dark:text-white text-[12px] font-bold flex-1">{n.label}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: n.color, background: `${n.color}15`, border: `1px solid ${n.color}30` }}>{n.tag}</span>
                      <div className="w-3 h-3 rounded-full border-2 shrink-0 ml-1" style={{ borderColor: n.color, background: 'white' }} />
                    </div>

                    {/* Node body */}
                    <div className="px-3 py-2.5 flex flex-col gap-1.5">
                      {n.fields.map(f => (
                        <div key={f.k} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 dark:text-white/30 font-mono w-20 shrink-0">{f.k}</span>
                          <span className="text-[10px] text-gray-700 dark:text-white/70 font-mono truncate">{f.v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Node footer: status */}
                    <div className="px-3 py-2 border-t border-gray-100 dark:border-white/5 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.text}`}>{s.label}</span>
                      {n.status === 'completed' && <span className="ml-auto text-[9px] text-gray-400 dark:text-white/20 font-mono">142ms</span>}
                      {n.status === 'running' && <span className="ml-auto text-[9px] text-amber-500 dark:text-amber-400/50 font-mono">running…</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </SlideIn>
      </div>
    </section>
  );
}



/* ─── Section 2: AI Generator ───────────────────────────────── */
function AISection() {
  const [text, setText] = useState('');
  const fullText = 'Fetch my GitHub issues, summarize them with AI, and post to the #engineering Slack channel every morning at 9am.';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const iv = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(iv);
    }, 35);
    return () => clearInterval(iv);
  }, [inView]);

  return (
    <section className="py-24 px-5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Visual */}
        <SlideIn from="left">
          <div ref={ref} className="bg-white dark:bg-[#1e2130] border border-gray-200 dark:border-white/8 rounded-2xl p-6 shadow-sm dark:shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#ff4a00] flex items-center justify-center shadow-md shadow-[#ff4a00]/30">
                <span className="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
              </div>
              <span className="text-gray-900 dark:text-white font-bold text-sm">AI Workflow Generator</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-[#ff4a00]/10 text-[#ff4a00] text-[9px] font-bold uppercase tracking-widest border border-[#ff4a00]/20">Gemini</span>
            </div>

            {/* Prompt area */}
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8 rounded-xl p-4 min-h-[110px]">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-mono">
                {text}
                <span className="inline-block w-2 h-[1em] bg-[#ff4a00] animate-pulse align-middle ml-0.5 rounded-sm" />
              </p>
            </div>

            <div className="mt-3">
              <span className="text-[11px] text-gray-400 dark:text-gray-600 font-mono">Powered by Gemini AI · Log in to generate</span>
            </div>

            {/* Generated node pills */}
            <div className="mt-5 border-t border-gray-100 dark:border-white/8 pt-5 flex flex-wrap gap-2">
              {['Webhook Trigger', 'HTTP Request', 'AI Summarize', 'Send Slack Msg'].map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={inView && text.length === fullText.length ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="px-3 py-1 rounded-full bg-[#ff4a00]/8 dark:bg-white/5 text-[#ff4a00] dark:text-gray-300 text-[11px] font-mono border border-[#ff4a00]/20 dark:border-white/10"
                >
                  {t}
                </motion.span>
              ))}
            </div>
          </div>
        </SlideIn>

        {/* Text */}
        <SlideIn from="right" delay={0.1}>
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4a00] mb-3">Generative AI</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-5 leading-snug">
            Describe it.<br />AutomataX builds it.
          </h2>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
            No need to drag anything. Type what you need in plain English and our Gemini-powered AI instantly generates a complete, fully connected workflow and drops it right on the canvas.
          </p>
          <ul className="flex flex-col gap-3">
            {['Natural language to full workflow', 'Nodes pre-configured with your intent', 'Edit and extend the AI result', 'Works across all 11 node types'].map(t => (
              <li key={t} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-5 h-5 rounded-full bg-[#ff4a00]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#ff4a00] text-[13px]">check</span>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </SlideIn>
      </div>
    </section>
  );
}

/* ─── Section 3: Triggers ───────────────────────────────────── */
function TriggersSection() {
  const triggers = [
    { icon: 'bolt', title: 'Manual Trigger', desc: 'Click "Run" in the editor to execute anytime — ideal for testing your workflow before scheduling.', color: '#2259bf', bg: 'bg-blue-50' },
    { icon: 'webhook', title: 'Webhook Trigger', desc: 'AutomataX gives you a unique webhook URL. POST from Stripe, GitHub, or any external tool to fire the workflow instantly.', color: '#ff4a00', bg: 'bg-orange-50' },
    { icon: 'schedule', title: 'Cron Schedule', desc: 'Schedule with a standard cron expression. Run every hour, every Monday at 9am, or any custom cadence you need.', color: '#10b981', bg: 'bg-emerald-50' },
  ];

  return (
    <section className="py-24 px-5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4a00] mb-3">Triggers</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">Run from anywhere, anytime.</h2>
          <p className="text-base text-gray-500 dark:text-white/40 max-w-xl mx-auto">Three ways to start a workflow — pick the one that fits each use case.</p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {triggers.map((t, i) => (
            <FadeUp key={t.title} delay={i * 0.1}>
              <div className="bg-white dark:bg-[#1e2130] border border-gray-100 dark:border-white/8 rounded-2xl shadow-sm dark:shadow-none p-6 h-full hover:shadow-md dark:hover:border-white/15 dark:hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <div className={`w-12 h-12 rounded-xl ${t.bg} flex items-center justify-center mb-5`}>
                  <span className="material-symbols-outlined text-[24px]" style={{ color: t.color }}>{t.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px] mb-2">{t.title}</h3>
                <p className="text-sm text-gray-500 dark:text-white/40 leading-relaxed">{t.desc}</p>
                {t.title === 'Cron Schedule' && (
                  <p className="mt-4 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 rounded-lg px-3 py-2">0 9 * * 1  ← every Monday 9am</p>
                )}
                {t.title === 'Webhook Trigger' && (
                  <p className="mt-4 font-mono text-[11px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-[#ff4a00]/10 dark:border dark:border-[#ff4a00]/20 rounded-lg px-3 py-2 truncate">POST /api/webhook/wh_a7f3…</p>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section 4: Logic & Loops ──────────────────────────────── */
function LogicSection() {
  const nodeTypes = [
    { icon: 'call_split', label: 'Branch', desc: 'If/Else conditional routing', color: '#f59e0b' },
    { icon: 'repeat', label: 'For Each', desc: 'Iterate over arrays of data', color: '#10b981' },
    { icon: 'hourglass_empty', label: 'Delay', desc: 'Wait N seconds before next node', color: '#6366f1' },
    { icon: 'http', label: 'HTTP Request', desc: 'Call any REST API endpoint', color: '#2259bf' },
    { icon: 'mail', label: 'Send Email', desc: 'Send via Resend API', color: '#4a6aa8' },
    { icon: 'chat', label: 'Slack Message', desc: 'Post to any channel or DM', color: '#e01e5a' },
    { icon: 'forum', label: 'Discord', desc: 'Send to a Discord webhook', color: '#5865F2' },
    { icon: 'auto_awesome', label: 'AI Summarize', desc: 'Summarize long content via AI', color: '#9d4edd' },
    { icon: 'troubleshoot', label: 'AI Extract', desc: 'Pull structured data from text', color: '#9d4edd' },
    { icon: 'psychology', label: 'AI Decide', desc: 'Route based on AI classification', color: '#9d4edd' },
  ];

  return (
    <section id="integrations" className="py-24 px-5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4a00] dark:text-purple-400 mb-3">Node Library</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">Real logic. Real power.</h2>
          <p className="text-base text-gray-500 dark:text-white/40 max-w-xl mx-auto">10 built-in node types covering APIs, AI, messaging, and flow control — all available on the canvas with zero setup.</p>
        </FadeUp>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {nodeTypes.map((n, i) => (
            <FadeUp key={n.label} delay={Math.floor(i / 5) * 0.1 + (i % 5) * 0.05}>
              <div className="bg-white/70 dark:bg-[#1e2130] border border-[#ff4a00]/10 dark:border-white/8 rounded-xl p-4 text-center hover:bg-white hover:shadow-md hover:border-[#ff4a00]/25 dark:hover:bg-[#252840] dark:hover:border-[#ff4a00]/30 dark:hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-default h-full flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${n.color}18` }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: n.color }}>{n.icon}</span>
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{n.label}</p>
                <p className="text-[10px] text-gray-400 dark:text-white/30 leading-tight">{n.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section 5: Real-time Execution ────────────────────────── */
function ExecutionSection() {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-150px' });

  useEffect(() => {
    if (!inView || running) return;
    setRunning(true);
    setLogs([]);
    const sequence = [
      { t: 0, text: '▶  Starting execution run-728fa4', type: 'info' },
      { t: 350, text: '   Resolving trigger payload…', type: 'dim' },
      { t: 650, text: '[1/3] HTTP Request → starting', type: 'info' },
      { t: 1300, text: '[1/3] HTTP Request ✓  68ms', type: 'success' },
      { t: 1500, text: '[2/3] AI Summarize → starting', type: 'info' },
      { t: 3100, text: '[2/3] AI Summarize ✓  1612ms', type: 'success' },
      { t: 3300, text: '[3/3] Slack Message → starting', type: 'info' },
      { t: 3700, text: '[3/3] Slack Message ✓  304ms', type: 'success' },
      { t: 3900, text: '✔  Execution completed  2.0s total', type: 'done' },
    ];
    const timers = sequence.map(s => setTimeout(() => setLogs(prev => [...prev, s]), s.t));
    const reset = setTimeout(() => { setRunning(false); }, 7000);
    return () => { timers.forEach(clearTimeout); clearTimeout(reset); };
  }, [inView]);

  const colorMap = {
    info: 'text-gray-700 dark:text-gray-300',
    dim: 'text-gray-400 dark:text-gray-600',
    success: 'text-emerald-600 dark:text-emerald-400',
    done: 'text-[#ff4a00] dark:text-[#ff6a30] font-bold'
  };

  return (
    <section id="execution" className="py-24 px-5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <SlideIn from="left">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4a00] mb-3">Real-time Execution</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-5 leading-snug">
            Total visibility.<br />Zero guesswork.
          </h2>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
            Every execution streams live via WebSocket. Inspect the exact output of every node — timing, status, and payload. When something fails, you'll know exactly where and why.
          </p>
          <ul className="flex flex-col gap-3">
            {['Live WebSocket execution stream', 'Per-node timing and output inspection', 'Full error traces with node context', 'Analytics dashboard with trend charts'].map(t => (
              <li key={t} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-5 h-5 rounded-full bg-[#ff4a00]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#ff4a00] text-[13px]">check</span>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </SlideIn>

        {/* Live terminal */}
        <SlideIn from="right" delay={0.1}>
          <div ref={ref} className="bg-gray-900 dark:bg-[#0d0f14] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/8 shadow-xl dark:shadow-2xl">
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-gray-800 dark:bg-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-[11px] text-gray-400 font-mono">AutomataX execution log</span>
            </div>
            {/* Log lines */}
            <div className="p-5 font-mono text-[12px] min-h-[240px] flex flex-col gap-2">
              {logs.map((l, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={colorMap[l.type]}
                >
                  {l.text}
                </motion.p>
              ))}
              {running && logs.length < 9 && (
                <span className="inline-block w-2 h-3.5 bg-[#ff4a00]/60 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        </SlideIn>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────── */
function CTA({ onRegister }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const perks = [
    { icon: 'bolt', text: 'No credit card' },
    { icon: 'cloud_off', text: 'No cloud lock-in' },
    { icon: 'code_off', text: 'No YAML configs' },
    { icon: 'lock_open', text: 'Fully open workflow' },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden transition-colors duration-200">
      {/* CTA glow — stronger in light mode for drama */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-20 dark:opacity-25 blur-[120px]" style={{ background: 'radial-gradient(ellipse, #ff4a00 0%, transparent 70%)' }} />
      </div>
      {/* Denser dot grid on CTA only */}
      <div className="absolute inset-0 bg-[radial-gradient(#ff4a0015_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:20px_20px] opacity-80 dark:opacity-100" />

      <div className="relative z-10 max-w-4xl mx-auto px-5 py-32 flex flex-col items-center text-center">

        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#ff4a00]/30 bg-[#ff4a00]/10 text-[#ff4a00] text-xs font-bold uppercase tracking-widest mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4a00] animate-pulse" />
          Free to start · No setup required
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight dark:tracking-tighter text-gray-950 dark:text-white leading-[1.05] mb-6"
        >
          Stop duct-taping.<br />
          <span className="text-[#ff4a00] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-[#ff4a00] dark:to-[#ff8c40]">
            Start automating.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed mb-12"
        >
          Wire up APIs, AI models, and messaging in minutes on a visual canvas. Then ship it — with real-time logs showing you exactly what ran.
        </motion.p>

        {/* Perks strip */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-12"
        >
          {perks.map(p => (
            <div key={p.text} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-500">
              <span className="material-symbols-outlined text-[#ff4a00] text-[16px]">{p.icon}</span>
              {p.text}
            </div>
          ))}
        </motion.div>

        {/* CTA button */}
        <motion.button
          onClick={onRegister}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.32 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="relative px-12 py-5 rounded-2xl text-white font-black text-lg overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #ff4a00, #e04200)', boxShadow: '0 0 40px rgba(255,74,0,0.35), 0 4px 20px rgba(0,0,0,0.4)' }}
        >
          <span className="relative z-10">Start building for free</span>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, #ff6a20, #ff4a00)' }} />
        </motion.button>

        {/* Social proof hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-6 text-xs text-gray-600 font-mono tracking-wide"
        >
          Built end-to-end with React + Node.js + MongoDB + WebSockets
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-white/5 py-8 px-5 bg-white dark:bg-[#0a0a0f] transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-white/25 text-center leading-relaxed">
          © 2026 AutomataX · All rights reserved.<br />
          For educational and learning purposes only by <span className="font-semibold text-gray-600 dark:text-white/50">Vidush Prakash Sinha</span>.
        </p>
      </div>
    </footer>
  );
}

/* ─── Root ───────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState(null);

  useEffect(() => {
    if (location.state?.openAuth) {
      setAuthMode(location.state.openAuth);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  const handleAuth = (mode) => setAuthMode(mode);
  const handleSuccess = () => { setAuthMode(null); navigate('/dashboard'); };

  return (
    <div className="relative bg-[#FFFCF9] dark:bg-[#0a0a0f] text-gray-900 dark:text-white font-body transition-colors duration-200">
      {/* Shared full-page background canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">


        {/* ════════════════════════════════
            LIGHT MODE: orange + yellow
        ════════════════════════════════ */}
        {/* Orange — top right */}
        <div className="absolute -top-24 -right-24 w-[640px] h-[640px] rounded-full
          opacity-30 dark:opacity-0 blur-[130px]"
          style={{ background: 'radial-gradient(ellipse, #ff4a00 0%, transparent 65%)' }} />
        {/* Yellow — bottom left */}
        <div className="absolute -bottom-20 -left-20 w-[560px] h-[560px] rounded-full
          opacity-25 dark:opacity-0 blur-[110px]"
          style={{ background: 'radial-gradient(ellipse, #f59e0b 0%, transparent 65%)' }} />
        {/* Soft yellow centre bloom */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[800px] h-[400px] rounded-full opacity-10 dark:opacity-0 blur-[140px]"
          style={{ background: 'radial-gradient(ellipse, #fbbf24 0%, transparent 70%)' }} />

        {/* ════════════════════════════════
            DARK MODE: purple + green
        ════════════════════════════════ */}
        {/* Purple — top left */}
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full
          opacity-0 dark:opacity-[0.12] blur-[140px]"
          style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 65%)' }} />
        {/* Green — bottom right */}
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full
          opacity-0 dark:opacity-[0.10] blur-[140px]"
          style={{ background: 'radial-gradient(ellipse, #059669 0%, transparent 65%)' }} />
        {/* Purple bleed — top right corner */}
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full
          opacity-0 dark:opacity-[0.07] blur-[100px]"
          style={{ background: '#9d4edd' }} />
        {/* Green bleed — mid left */}
        <div className="absolute top-1/2 -left-20 w-[350px] h-[350px] rounded-full
          opacity-0 dark:opacity-[0.06] blur-[90px]"
          style={{ background: '#10b981' }} />

      </div>

      <div className="relative z-10">
        <AnalyticsTicker />
        <NavBar onLogin={() => handleAuth('login')} onRegister={() => handleAuth('register')} />
        <Hero onRegister={() => handleAuth('register')} />
        <HowItWorks />
        <CanvasSection />
        <AISection />
        <TriggersSection />
        <LogicSection />
        <ExecutionSection />
        <CTA onRegister={() => handleAuth('register')} />
        <Footer />

        <AnimatePresence>
          {authMode && (
            <AuthModal
              key={authMode}
              isOpen={Boolean(authMode)}
              defaultMode={authMode}
              onClose={() => setAuthMode(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}