"use client"
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const CASE_TYPES = [
  { icon: '🏗️', label: 'Builder Purchase', color: '#f59e0b', desc: 'New flat/plot from builder with development agreement, allotment letter, registered deed' },
  { icon: '🔑', label: 'Resale', color: '#6366f1', desc: 'Secondary market property with full chain of registered sale deeds verification' },
  { icon: '🔄', label: 'Balance Transfer', color: '#3b82f6', desc: 'Existing loan transfer with NOC from previous bank, mortgage discharge verification' },
  { icon: '💼', label: 'Seller BT', color: '#8b5cf6', desc: 'Most complex — seller has existing mortgage being discharged with new bank simultaneously' },
  { icon: '🏦', label: 'LAP / Mortgage', color: '#10b981', desc: 'Loan against property with clear title verification and encumbrance check for mortgage' },
]

const AI_PIPELINE = [
  { step: '01', model: 'Claude Haiku 4.5', title: 'Document Ingestion', desc: 'PDF text extraction + OCR for scanned pages. All documents classified and indexed automatically.', tags: ['PDF Parse', 'OCR', 'Classification'], color: '#6366f1', icon: '📄', time: '~8s' },
  { step: '02', model: 'Claude Haiku 4.5', title: 'Data Extraction', desc: 'Survey numbers, party names, deed dates, EC entries, 7/12 details extracted with precision.', tags: ['Survey No.', 'Parties', 'Dates'], color: '#8b5cf6', icon: '🔍', time: '~12s' },
  { step: '03', model: 'Claude Sonnet 4.6', title: 'Legal Analysis', desc: 'Deep case-specific legal analysis — title chain, EC cross-check, encumbrances, risks.', tags: ['Title Chain', 'EC Verify', 'Risk'], color: '#a78bfa', icon: '⚖️', time: '~25s' },
  { step: '04', model: 'Claude Sonnet 4.6 ×4', title: 'Report Drafting', desc: 'Four parallel AI calls generate Part I–IV simultaneously. Verdict: CLEAR / NOT CLEAR / SUBJECT TO.', tags: ['Part I–IV', 'Verdict', 'Conditions'], color: '#10b981', icon: '📊', time: '~30s' },
  { step: '05', model: 'Report Engine', title: 'Final Output', desc: 'Professional HTML + Word report saved to database. Download instantly, share with bank.', tags: ['HTML', 'Word .doc', 'Database'], color: '#f59e0b', icon: '📋', time: '~5s' },
]

const FEATURES = [
  { icon: '⚡', title: 'Dual Model Pipeline', desc: 'Haiku for speed, Sonnet for depth — optimal AI selection at each stage', color: '#6366f1' },
  { icon: '🎯', title: '5 Case Types, 38+ Rules', desc: 'Specific rules for each case type — RULE 4A, 17A, FERFAR columns, EC entries, all covered', color: '#8b5cf6' },
  { icon: '📋', title: 'Bank-Grade Reports', desc: 'HTML + Word downloads with 9 sections — exactly what banks need for credit files', color: '#10b981' },
  { icon: '🔒', title: 'Data Security', desc: 'Documents processed in isolated environment — never stored, never shared, bank-grade encryption', color: '#f59e0b' },
  { icon: '🏛️', title: 'Gujarat Specific', desc: 'Built for Gujarat property laws — SRO, 7/12, EC, TPS, NA Order, all Gujarat formats', color: '#ef4444' },
  { icon: '⏱️', title: '3 Minutes vs 3 Days', desc: 'What takes advocates 3 days manually, TITLEMATRIX.AI does in under 3 minutes', color: '#3b82f6' },
]

const STATS = [
  { value: '< 3', unit: 'min', label: 'Per Report', icon: '⚡' },
  { value: '99.2', unit: '%', label: 'Accuracy', icon: '🎯' },
  { value: '38', unit: '+', label: 'Legal Rules', icon: '⚖️' },
  { value: '5', unit: '', label: 'Case Types', icon: '🏛️' },
]

const SCAN_STEPS = [
  { label: 'DOCUMENT RECEIVED', value: 'PROCESSING...', color: '#6366f1', delay: 600 },
  { label: 'TITLE CHAIN', value: 'VERIFIED ✓', color: '#10b981', delay: 1800 },
  { label: 'EC ENCUMBRANCE', value: 'NIL ✓', color: '#10b981', delay: 3000 },
  { label: '7/12 LAND USE', value: 'BIN KHETI ✓', color: '#10b981', delay: 4200 },
  { label: 'LEGAL VERDICT', value: 'TITLE CLEAR', color: '#10b981', delay: 5400 },
  { label: 'REPORT STATUS', value: 'GENERATED ✓', color: '#f59e0b', delay: 6600 },
]

function getRingNodes(count: number, radius: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * 360 / count - 90) * Math.PI / 180
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
  })
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoverBtn, setHoverBtn] = useState(false)
  const [activeSteps, setActiveSteps] = useState<number[]>([])
  const [activePipe, setActivePipe] = useState(-1)
  const pipeRef = useInView(0.1)
  const featRef = useInView(0.1)
  const statsRef = useInView(0.2)
  const caseRef = useInView(0.1)
  const ctaRef = useInView(0.2)

  useEffect(() => {
    SCAN_STEPS.forEach((s, i) => {
      setTimeout(() => setActiveSteps(prev => [...prev, i]), s.delay)
    })
  }, [])

  useEffect(() => {
    if (!pipeRef.inView) return
    AI_PIPELINE.forEach((_, i) => {
      setTimeout(() => setActivePipe(i), i * 400 + 200)
    })
  }, [pipeRef.inView])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.1 + 0.3, op: Math.random() * 0.15 + 0.04,
    }))
    let id: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1 })
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x; const dy = pts[i].y - pts[j].y; const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 150) { ctx.beginPath(); ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 150) * 0.08})`; ctx.lineWidth = 0.5; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke() }
        }
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2); ctx.fillStyle = `rgba(99,102,241,${pts[i].op})`; ctx.fill()
      }
      id = requestAnimationFrame(draw)
    }
    draw()
    const r = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', r)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', r) }
  }, [])

  const outerNodes = getRingNodes(16, 260)
  const midNodes = getRingNodes(10, 185)
  const innerNodes = getRingNodes(6, 115)

  return (
    <div style={{ minHeight: '100vh', background: '#02020a', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scan{from{transform:translateX(-100%)}to{transform:translateX(600%)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes spin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes spinR{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
        @keyframes corePulse{0%,100%{box-shadow:0 0 40px rgba(99,102,241,0.5),inset 0 0 40px rgba(99,102,241,0.1)}50%{box-shadow:0 0 90px rgba(139,92,246,0.8),inset 0 0 60px rgba(139,92,246,0.25)}}
        @keyframes ping{0%{transform:translate(-50%,-50%) scale(1);opacity:0.8}100%{transform:translate(-50%,-50%) scale(3.5);opacity:0}}
        @keyframes stepIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes navGlow{0%,100%{box-shadow:0 0 15px rgba(99,102,241,0.3)}50%{box-shadow:0 0 35px rgba(139,92,246,0.6)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideLeft{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes flowDot{0%{opacity:0;transform:translateX(-10px)}50%{opacity:1}100%{opacity:0;transform:translateX(10px)}}
        @keyframes glowPulse{0%,100%{opacity:0.4}50%{opacity:1}}
        .pipe-active{animation:slideRight 0.5s ease both}
        .feat-active{animation:scaleIn 0.4s ease both}
        .stat-active{animation:fadeUp 0.5s ease both}
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,10,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '15px', animation: 'navGlow 3s ease-in-out infinite' }}>T</div>
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>TITLEMATRIX<span style={{ color: '#6366f1' }}>.AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '36px' }}>
          {['Features', 'How It Works', 'Pricing'].map(l => <span key={l} style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>{l}</span>)}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/login')} style={{ padding: '8px 22px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>Login</button>
          <button onClick={() => router.push('/signup')} onMouseEnter={() => setHoverBtn(true)} onMouseLeave={() => setHoverBtn(false)} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: '700', boxShadow: hoverBtn ? '0 8px 28px rgba(99,102,241,0.65)' : '0 4px 16px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}>Get Started →</button>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', paddingTop: '64px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '64px', paddingRight: '32px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 20px', borderRadius: '100px', marginBottom: '32px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.22)', animation: 'fadeUp 0.6s ease 0.1s both' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700', letterSpacing: '2px' }}>LIVE — AI PROPERTY LEGAL INTELLIGENCE</span>
            </div>
            <div style={{ animation: 'fadeUp 0.6s ease 0.2s both' }}>
              <div style={{ fontSize: 'clamp(42px,4.8vw,78px)', fontWeight: '900', lineHeight: 1.05, letterSpacing: '-1.5px', color: '#fff', marginBottom: '4px' }}>Property Legal</div>
              <div style={{ fontSize: 'clamp(42px,4.8vw,78px)', fontWeight: '900', lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: '28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Scrutiny Automated</div>
            </div>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.9, marginBottom: '40px', maxWidth: '440px', animation: 'fadeUp 0.6s ease 0.35s both' }}>
              Property documents upload karo — TITLEMATRIX.AI instantly title chain verify karta hai, risks detect karta hai, aur professional legal report generate karta hai.
            </p>
            <div style={{ display: 'flex', gap: '14px', marginBottom: '48px', animation: 'fadeUp 0.6s ease 0.5s both' }}>
              <button onClick={() => router.push('/signup')} style={{ padding: '15px 38px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: '800', boxShadow: '0 10px 36px rgba(99,102,241,0.45)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', animation: 'scan 2.5s ease-in-out infinite' }} />
                Start Free Trial →
              </button>
              <button onClick={() => router.push('/login')} style={{ padding: '15px 30px', borderRadius: '12px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>Login</button>
            </div>
            <div style={{ animation: 'fadeUp 0.6s ease 0.65s both' }}>
              <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '3px', fontWeight: '700', marginBottom: '14px' }}>5 CASE TYPES SUPPORTED</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CASE_TYPES.map((ct, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(6,6,18,0.92)', border: `1px solid ${ct.color}25`, animation: `fadeUp 0.4s ease ${0.7 + i * 0.08}s both` }}>
                    <span style={{ fontSize: '14px' }}>{ct.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>{ct.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '20px 40px 20px 20px' }}>
          <div style={{ fontSize: '10px', color: '#334155', fontFamily: 'monospace', letterSpacing: '2px' }}>LAT: 23.0225°N &nbsp;·&nbsp; LON: 72.5714°E &nbsp;·&nbsp; AHMEDABAD, GUJARAT</div>
          <div style={{ position: 'relative', width: '520px', height: '520px', animation: 'float 8s ease-in-out infinite', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '520px', height: '520px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.2)', animation: 'spin 40s linear infinite' }}>
              {outerNodes.map((n, i) => (<div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: i % 4 === 0 ? '9px' : '5px', height: i % 4 === 0 ? '9px' : '5px', borderRadius: '50%', background: i % 4 === 0 ? '#6366f1' : 'rgba(99,102,241,0.35)', boxShadow: i % 4 === 0 ? '0 0 12px #6366f1' : 'none', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />))}
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '475px', height: '475px', borderRadius: '50%', border: '1px dashed rgba(99,102,241,0.1)', animation: 'spinR 28s linear infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '370px', height: '370px', borderRadius: '50%', border: '1.5px solid rgba(139,92,246,0.3)', animation: 'spinR 25s linear infinite' }}>
              {midNodes.map((n, i) => (<div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,1)', boxShadow: '0 0 12px rgba(139,92,246,0.6)', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />))}
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '230px', height: '230px', borderRadius: '50%', border: '1.5px solid rgba(99,102,241,0.5)', animation: 'spin 16s linear infinite' }}>
              {innerNodes.map((n, i) => (<div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 16px rgba(99,102,241,0.9)', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />))}
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '160px', height: '160px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.6)', animation: 'ping 3s ease-out infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '160px', height: '160px', borderRadius: '50%', border: '1px solid rgba(139,92,246,0.4)', animation: 'ping 3s ease-out 1.5s infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '145px', height: '145px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(2,2,10,0.9) 70%)', border: '2px solid rgba(99,102,241,0.7)', animation: 'corePulse 3s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '42px' }}>⚖️</div>
              <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: '800', letterSpacing: '2px' }}>LEGAL AI</div>
              <div style={{ fontSize: '8px', color: '#334155', letterSpacing: '1px' }}>GUJARAT v5.0</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%', maxWidth: '480px' }}>
            {SCAN_STEPS.map((s, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(6,6,18,0.95)', border: `1px solid ${activeSteps.includes(i) ? s.color + '45' : 'rgba(255,255,255,0.04)'}`, borderTop: `2px solid ${activeSteps.includes(i) ? s.color : 'rgba(255,255,255,0.06)'}`, opacity: activeSteps.includes(i) ? 1 : 0.2, animation: activeSteps.includes(i) ? 'stepIn 0.4s ease' : 'none', transition: 'all 0.3s' }}>
                <div style={{ fontSize: '8px', color: '#475569', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '900', color: activeSteps.includes(i) ? s.color : '#1e293b', fontFamily: 'monospace' }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'blink 1.5s infinite' }} />
            <span style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', fontWeight: '700' }}>SYSTEM ONLINE · GUJARAT LEGAL ENGINE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ═══ STATS BAR ═══ */}
      <div ref={statsRef.ref} style={{ borderTop: '1px solid rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.1)', padding: '40px 64px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative', zIndex: 10, background: 'rgba(6,6,18,0.6)', backdropFilter: 'blur(20px)' }}>
        {STATS.map((s, i) => (
          <div key={i} className={statsRef.inView ? 'stat-active' : ''} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(99,102,241,0.1)' : 'none', animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
              <span style={{ fontSize: '48px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ═══ AI PIPELINE SECTION ═══ */}
      <div ref={pipeRef.ref} style={{ padding: '120px 64px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '100px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '20px' }}>
            <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: '700', letterSpacing: '3px' }}>AI ENGINE PIPELINE</span>
          </div>
          <div style={{ fontSize: 'clamp(32px,3.5vw,52px)', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
            Kaise Kaam Karta Hai <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TITLEMATRIX.AI</span>
          </div>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '500px', margin: '0 auto', lineHeight: 1.8 }}>
            5-step AI pipeline — Claude Haiku aur Sonnet milke ek professional legal scrutiny report banate hain
          </p>
        </div>

        {/* Pipeline Steps */}
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          {/* Connecting Line */}
          <div style={{ position: 'absolute', left: '39px', top: '60px', bottom: '60px', width: '2px', background: 'linear-gradient(180deg, #6366f1, #8b5cf6, #a78bfa, #10b981, #f59e0b)', opacity: 0.3 }} />

          {AI_PIPELINE.map((step, i) => (
            <div key={i} className={activePipe >= i ? 'pipe-active' : ''} style={{ display: 'flex', gap: '32px', marginBottom: '24px', opacity: activePipe >= i ? 1 : 0, animationDelay: `${i * 0.1}s` }}>
              {/* Step Number Circle */}
              <div style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '50%', background: `radial-gradient(circle, ${step.color}22, rgba(2,2,10,0.9))`, border: `2px solid ${step.color}60`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: activePipe >= i ? `0 0 30px ${step.color}40` : 'none', transition: 'all 0.5s' }}>
                <div style={{ fontSize: '24px' }}>{step.icon}</div>
                <div style={{ fontSize: '9px', color: step.color, fontWeight: '800', letterSpacing: '1px' }}>{step.step}</div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '20px 28px', borderRadius: '16px', background: 'rgba(6,6,18,0.8)', border: `1px solid ${activePipe >= i ? step.color + '30' : 'rgba(255,255,255,0.04)'}`, borderLeft: `3px solid ${step.color}`, transition: 'all 0.5s', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: step.color, fontWeight: '700', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'monospace' }}>{step.model}</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>{step.title}</div>
                  </div>
                  <div style={{ padding: '6px 14px', borderRadius: '100px', background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                    <span style={{ fontSize: '12px', color: step.color, fontWeight: '700', fontFamily: 'monospace' }}>{step.time}</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, marginBottom: '14px' }}>{step.desc}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {step.tags.map((tag, j) => (
                    <span key={j} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: `${step.color}10`, color: step.color, border: `1px solid ${step.color}20` }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Total Time */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <div style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'blink 1.5s infinite' }} />
              <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>Total Time: ~80 seconds · Traditional: 2-3 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FEATURES GRID ═══ */}
      <div ref={featRef.ref} style={{ padding: '80px 64px 120px', position: 'relative', zIndex: 10, background: 'rgba(4,4,14,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: 'clamp(28px,3vw,44px)', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
            Kyu Choose Karo <span style={{ color: '#6366f1' }}>TITLEMATRIX.AI</span>?
          </div>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '440px', margin: '0 auto' }}>Gujarat ke property advocates ke liye specially built — unki exact zaruratein samajhkar</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <div key={i} className={featRef.inView ? 'feat-active' : ''} style={{ padding: '28px', borderRadius: '16px', background: 'rgba(6,6,18,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderTop: `2px solid ${f.color}`, animationDelay: `${i * 0.08}s`, opacity: featRef.inView ? 1 : 0, transition: 'border-color 0.3s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = f.color + '80')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>{f.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CASE TYPES DETAIL ═══ */}
      <div ref={caseRef.ref} style={{ padding: '80px 64px 120px', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: 'clamp(28px,3vw,44px)', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
            5 Case Types — <span style={{ color: '#6366f1' }}>Sab Cover</span>
          </div>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '440px', margin: '0 auto' }}>Har case type ke liye alag AI rules — koi bhi situation miss nahi hogi</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }}>
          {CASE_TYPES.map((ct, i) => (
            <div key={i} style={{ padding: '24px 20px', borderRadius: '16px', background: 'rgba(6,6,18,0.8)', border: `1px solid ${ct.color}20`, opacity: caseRef.inView ? 1 : 0, animation: caseRef.inView ? `fadeUp 0.5s ease ${i * 0.1}s both` : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{ct.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>{ct.label}</div>
              <div style={{ width: '32px', height: '2px', background: ct.color, margin: '0 auto 12px', borderRadius: '2px' }} />
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6 }}>{ct.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ HOW TO USE ═══ */}
      <div style={{ padding: '80px 64px 120px', position: 'relative', zIndex: 10, background: 'rgba(4,4,14,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: 'clamp(28px,3vw,44px)', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '16px' }}>
            3 Steps Mein <span style={{ color: '#6366f1' }}>Report Ready</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
          {[
            { num: '01', icon: '📤', title: 'Documents Upload Karo', desc: 'Sale Deed, EC, 7/12, NA Order — koi bhi PDF drag & drop karo. Multiple files allowed.', color: '#6366f1' },
            { num: '02', icon: '🤖', title: 'AI Analysis Karta Hai', desc: 'Claude AI automatically sab verify karta hai — title chain, encumbrances, legal opinion.', color: '#8b5cf6' },
            { num: '03', icon: '📋', title: 'Report Download Karo', desc: 'Professional HTML + Word report ready. Bank ko directly submit kar sakte ho.', color: '#10b981' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: `${s.color}15`, border: `2px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>{s.icon}</div>
              <div style={{ fontSize: '10px', color: s.color, fontWeight: '800', letterSpacing: '3px', marginBottom: '10px' }}>STEP {s.num}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CTA SECTION ═══ */}
      <div ref={ctaRef.ref} style={{ padding: '100px 64px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', opacity: ctaRef.inView ? 1 : 0, animation: ctaRef.inView ? 'scaleIn 0.6s ease' : 'none' }}>
          <div style={{ fontSize: 'clamp(32px,3.5vw,52px)', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '20px', lineHeight: 1.1 }}>
            Abhi Shuru Karo —<br />
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>5 Reports Free</span>
          </div>
          <p style={{ fontSize: '15px', color: '#475569', marginBottom: '40px', lineHeight: 1.8 }}>
            No credit card required. Sign up karo aur 5 reports free generate karo. Gujarat ke 100+ advocates already use kar rahe hain.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => router.push('/signup')} style={{ padding: '18px 48px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '16px', fontWeight: '800', boxShadow: '0 16px 48px rgba(99,102,241,0.5)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '60px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', animation: 'scan 2s ease-in-out infinite' }} />
              Start Free Trial — 5 Reports Free
            </button>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '32px' }}>
            {['No credit card', 'Instant access', '5 free reports'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', color: '#475569' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', padding: '32px 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10, background: 'rgba(2,2,10,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '13px' }}>T</div>
          <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>TITLEMATRIX<span style={{ color: '#6366f1' }}>.AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[{ icon: '✉️', text: 'support@titlematrixai.com' }, { icon: '📞', text: '+91 95122 69191' }].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>{item.icon}</span>
              <span style={{ fontSize: '12px', color: '#334155' }}>{item.text}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: '#1e293b' }}>© 2026 TITLEMATRIX.AI · Gujarat Legal Engine v5.3</div>
      </div>
    </div>
  )
} 