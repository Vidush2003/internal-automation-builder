import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/AuthModal';

/* ─── Helpers ─────────────────────────────────────────────── */
const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

/** Fade-in-up when element scrolls into view */
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Brand ─────────────────────────────────────────────────── */
function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-headline text-lg font-bold shadow-sm">A</span>
      {!compact && (
        <span className="font-headline text-xl font-bold tracking-tight text-on-background">
          automata<span className="text-primary">X</span>
        </span>
      )}
    </div>
  );
}

/* ─── NavBar ─────────────────────────────────────────────────── */
function NavBar({ onLogin, onRegister }) {
  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/10 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
        <a href="#top" aria-label="AutomataX home"><Brand /></a>
        <nav className="hidden md:flex items-center gap-7 font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
          <a href="#product" className="hover:text-primary transition-colors">Product</a>
          <a href="#features" className="hover:text-primary transition-colors">Capabilities</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onLogin} className="px-3 sm:px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-background transition-colors">Sign in</button>
          <button onClick={onRegister} className="btn-primary px-4 sm:px-5 py-2.5 rounded-xl font-label text-xs font-bold tracking-wide shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all">Start building</button>
        </div>
      </div>
    </header>
  );
}

/* ─── Workflow Preview (Hero graphic) ───────────────────────── */
/** Node cards that float — must be absolutely positioned inside
 *  the parent container, NOT inside a plain motion.div wrapper. */
function FloatingNodeCard({ icon, title, detail, style, tint, yAnim, duration }) {
  return (
    <motion.div
      style={{ position: 'absolute', ...style }}
      animate={{ y: yAnim }}
      transition={{ duration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
    >
      <div className={`rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/95 backdrop-blur-sm p-3 shadow-lg w-44`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-8 h-8 rounded-xl ${tint} flex items-center justify-center`}>
            <Icon className="text-[17px] text-white">{icon}</Icon>
          </span>
          <div>
            <p className="text-xs font-bold text-on-background leading-tight">{title}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">{detail}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function WorkflowPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[580px]" aria-label="A visual preview of the AutomataX workflow canvas">
      {/* Glow */}
      <div className="absolute inset-6 rounded-[28px] bg-primary/10 blur-3xl -z-10" />

      {/* Mock browser window */}
      <div className="rounded-[22px] bg-[#17233b] shadow-2xl overflow-hidden border border-white/10">
        {/* Title bar */}
        <div className="h-10 px-4 flex items-center justify-between border-b border-white/10 bg-[#1c2a45]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b64]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f6c75d]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#55cf8b]" />
            <span className="ml-3 text-[10px] text-white/50 font-label tracking-wide">Vendor intake · Draft</span>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-[#2b66d5] text-[9px] text-white font-bold tracking-wide">Publish</span>
        </div>

        {/* Canvas area */}
        <div
          className="relative overflow-hidden"
          style={{
            height: '340px',
            backgroundImage: 'radial-gradient(rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        >
          {/* Connector SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 580 340" fill="none" aria-hidden="true">
            <path d="M145 100 C200 100, 195 168, 268 168" stroke="#7da5f3" strokeWidth="1.8" strokeDasharray="5 7" opacity="0.7" />
            <path d="M365 168 C420 168, 415 252, 460 252" stroke="#7da5f3" strokeWidth="1.8" strokeDasharray="5 7" opacity="0.7" />
            <circle cx="268" cy="168" r="4" fill="#91b0ef" opacity="0.9" />
            <circle cx="460" cy="252" r="4" fill="#91b0ef" opacity="0.9" />
          </svg>

          {/* Floating node cards — absolutely positioned, NOT inside a wrapping div */}
          <FloatingNodeCard
            icon="bolt" title="New request" detail="Manual trigger"
            tint="bg-[#273c65]"
            style={{ top: '12%', left: '5%' }}
            yAnim={[0, -7, 0]} duration={4}
          />
          <FloatingNodeCard
            icon="http" title="Enrich record" detail="HTTP request"
            tint="bg-[#234d9c]"
            style={{ top: '37%', left: '34%' }}
            yAnim={[0, 6, 0]} duration={4.5}
          />
          <FloatingNodeCard
            icon="mail" title="Notify owner" detail="Send email"
            tint="bg-[#375590]"
            style={{ top: '58%', right: '5%' }}
            yAnim={[0, -5, 0]} duration={3.8}
          />

          {/* Status bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#223151]/95 border-t border-white/10 p-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-[#234f9f] text-white flex items-center justify-center shrink-0">
              <Icon className="text-[15px]">check</Icon>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-white">Workflow ready to run</p>
              <p className="text-[9px] text-white/50 mt-0.5">3 connected steps · execution logging enabled</p>
            </div>
            <span className="ml-auto text-[9px] text-[#a7c2fb] font-bold tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* Floating stat card */}
      <div className="absolute -right-4 sm:-right-8 top-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-xl p-3 sm:p-4 w-36 sm:w-40">
        <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">Last run</p>
        <p className="font-headline text-lg sm:text-xl font-bold text-on-background mt-1">Success</p>
        <div className="mt-2 h-1.5 rounded-full bg-primary/15 overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: '82%' }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────── */
function Hero({ onRegister, onLogin }) {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute -top-44 right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-[.95fr_1.05fr] gap-14 lg:gap-10 items-center relative">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 font-label text-[10px] font-bold uppercase tracking-[.16em]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Internal automation, simplified
            </span>
            <h1 className="mt-6 font-headline text-[2.6rem] sm:text-5xl lg:text-[4rem] font-bold tracking-tight leading-[1.02] text-on-background">
              Turn everyday operations into{' '}
              <span className="text-primary">reliable flow.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-on-surface-variant max-w-lg">
              AutomataX gives your team one visual place to build, run, and understand the internal workflows that keep work moving.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onRegister}
                className="btn-primary px-5 py-3.5 rounded-xl font-label text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 transition-all inline-flex items-center gap-2"
              >
                Build your first workflow
                <Icon className="text-[18px]">arrow_forward</Icon>
              </button>
              <button
                onClick={onLogin}
                className="px-5 py-3.5 rounded-xl font-label text-sm font-semibold text-on-background border border-outline-variant/30 hover:bg-surface-container-low transition-colors"
              >
                Sign in to workspace
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5"><Icon className="text-primary text-[16px]">check_circle</Icon> Visual workflow canvas</span>
              <span className="flex items-center gap-1.5"><Icon className="text-primary text-[16px]">check_circle</Icon> Execution logs included</span>
            </div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, x: 16 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <WorkflowPreview />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Product Section ───────────────────────────────────────── */
function ProductSection() {
  const logs = [
    ['Manual trigger received', 'Just now', 'bolt', true],
    ['Vendor record enriched', 'Completed', 'http', false],
    ['Owner notification delivered', 'Completed', 'mail', false],
  ];
  return (
    <section id="product" className="border-y border-outline-variant/10 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <FadeUp>
          <div className="rounded-[24px] bg-[#10203d] p-5 sm:p-7 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 text-white/55 font-label text-[10px] uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#55cf8b]" /> Live workflow activity
            </div>
            <div className="mt-5 space-y-2.5">
              {logs.map(([label, state, icon, highlight]) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-white/[.05] border border-white/[.07] p-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${highlight ? 'bg-[#2b66d5]' : 'bg-white/10'}`}>
                    <Icon className="text-[16px]">{icon}</Icon>
                  </span>
                  <p className="text-xs text-white font-semibold flex-1">{label}</p>
                  <span className="text-[10px] text-[#a7c2fb]">{state}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="h-14 rounded-lg bg-[#214b94]" />
              <div className="h-9 self-end rounded-lg bg-[#294b86]" />
              <div className="h-11 self-end rounded-lg bg-[#3764ad]" />
            </div>
          </div>
        </FadeUp>
        <FadeUp delay={0.15}>
          <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-primary">Clarity by default</p>
          <h2 className="mt-3 font-headline text-3xl sm:text-4xl font-bold tracking-tight text-on-background">
            Know what ran, what changed, and what needs attention.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-on-surface-variant">
            Move from scattered manual hand-offs to an execution trail your team can actually follow. AutomataX keeps each workflow and its activity in one focused workspace.
          </p>
          <a href="#features" className="mt-7 inline-flex gap-2 items-center text-sm font-bold text-primary hover:gap-3 transition-all duration-200">
            Explore the platform <Icon className="text-[18px]">arrow_forward</Icon>
          </a>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─── Features ──────────────────────────────────────────────── */
function Capability({ icon, eyebrow, title, description, delay }) {
  return (
    <FadeUp delay={delay}>
      <article className="h-full rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 sm:p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="text-[21px]">{icon}</Icon>
        </span>
        <p className="mt-5 font-label text-[10px] uppercase tracking-[.16em] text-primary font-bold">{eyebrow}</p>
        <h3 className="mt-2 font-headline text-xl font-bold text-on-background">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
      </article>
    </FadeUp>
  );
}

function Features() {
  const items = [
    ['account_tree', 'Design', 'Build visually', 'Connect triggers and actions on a canvas your team can reason about at a glance.'],
    ['play_circle', 'Execute', 'Run with confidence', 'Queue workflow runs without holding up the rest of your application.'],
    ['receipt_long', 'Observe', 'Follow every step', 'Use centralized activity logs to inspect outcomes and investigate failures.'],
    ['shield', 'Protect', 'Keep control internal', 'Built with practical safeguards for the internal services and processes you operate.'],
  ];
  return (
    <section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <FadeUp>
        <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-primary">Built for operational work</p>
        <h2 className="mt-3 font-headline text-3xl sm:text-4xl font-bold text-on-background tracking-tight">
          The building blocks for better internal systems.
        </h2>
      </FadeUp>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(([icon, eyebrow, title, description], i) => (
          <Capability key={title} icon={icon} eyebrow={eyebrow} title={title} description={description} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    ['01', 'Map the work', 'Add a trigger and the actions that move your process forward.'],
    ['02', 'Connect the flow', 'Link each step into a workflow your team can inspect and maintain.'],
    ['03', 'Run and learn', 'Launch the workflow, then follow its execution in the activity log.'],
  ];
  return (
    <section id="how-it-works" className="bg-surface-container-low border-y border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <FadeUp>
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div className="max-w-xl">
              <p className="font-label text-[10px] uppercase tracking-[.18em] font-bold text-primary">A simple operating rhythm</p>
              <h2 className="mt-3 font-headline text-3xl sm:text-4xl font-bold text-on-background tracking-tight">
                From a repeated task to a dependable workflow.
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant max-w-xs">Start with the work that slows your team down most. Expand from there.</p>
          </div>
        </FadeUp>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map(([number, title, description], i) => (
            <FadeUp key={number} delay={i * 0.1}>
              <article className="h-full p-6 sm:p-7 rounded-2xl bg-surface-container-lowest border border-outline-variant/10">
                <span className="font-label text-[11px] font-bold text-primary tracking-widest">{number}</span>
                <div className="w-8 h-px bg-primary/30 mt-6 mb-5" />
                <h3 className="font-headline text-xl font-bold text-on-background">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Closing CTA ───────────────────────────────────────────── */
function ClosingCTA({ onRegister }) {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
      <FadeUp>
        <div className="relative overflow-hidden rounded-[28px] bg-primary px-6 sm:px-12 py-14 sm:py-16 text-center">
          <div className="absolute -left-24 -bottom-32 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -right-16 -top-28 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <p className="font-label text-[10px] uppercase tracking-[.18em] text-white/70 font-bold">AutomataX workspace</p>
            <h2 className="mt-3 font-headline text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Give your operations room to move.
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-white/80 leading-relaxed">
              Build the next workflow your team should not have to run by hand.
            </p>
            <button
              onClick={onRegister}
              className="mt-8 px-6 py-3.5 rounded-xl bg-white text-primary font-label text-sm font-bold shadow-lg hover:bg-primary-fixed hover:-translate-y-px active:translate-y-0 transition-all inline-flex items-center gap-2"
            >
              Create your workspace
              <Icon className="text-[18px]">arrow_forward</Icon>
            </button>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Brand compact />
        <p className="text-xs text-on-surface-variant">© {new Date().getFullYear()} AutomataX. Internal automation made clear.</p>
        <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
          <a href="#features" className="hover:text-primary transition-colors">Capabilities</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    if (location.state?.auth) {
      setAuthMode(location.state.auth);
      setAuthModalOpen(true);
      // Clear the state so the modal doesn't re-open on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);
  const openLogin = () => { setAuthMode('login'); setAuthModalOpen(true); };
  const openRegister = () => { setAuthMode('register'); setAuthModalOpen(true); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-background text-on-background font-body overflow-x-hidden"
    >
      <NavBar onLogin={openLogin} onRegister={openRegister} />
      <Hero onRegister={openRegister} onLogin={openLogin} />
      <ProductSection />
      <Features />
      <HowItWorks />
      <ClosingCTA onRegister={openRegister} />
      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultMode={authMode} />
    </motion.div>
  );
}