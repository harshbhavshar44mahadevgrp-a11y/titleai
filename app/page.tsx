"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const PIPELINE = [
  { id: 'A', model: 'Haiku 4.5', title: 'Ingestion', sub: 'PDF parsing · OCR · Classification', color: '#6366f1', time: '8s' },
  { id: 'B', model: 'Haiku 4.5', title: 'Extraction', sub: 'Parties · Survey · Dates · EC entries', color: '#818cf8', time: '12s' },
  { id: 'C', model: 'Sonnet 4.6', title: 'Analysis', sub: 'Title chain · Encumbrances · Risk', color: '#a78bfa', time: '25s' },
  { id: 'D', model: 'Sonnet 4.6 ×4', title: 'Drafting', sub: 'Part I–IV parallel · Verdict', color: '#10b981', time: '30s' },
  { id: 'E', model: 'Engine', title: 'Output', sub: 'HTML · Word · Database', color: '#f59e0b', time: '5s' },
]

const CASES = [
  { icon: '🏗️', code: 'BLD', title: 'Builder Purchase', desc: 'Development agreement, allotment letter, registered deed verification with RERA compliance check', color: '#f59e0b' },
  { icon: '🔑', code: 'RSL', title: 'Resale', desc: 'Complete ownership chain from original allotment through all intermediate registered transfers', color: '#6366f1' },
  { icon: '🔄', code: 'BT', title: 'Balance Transfer', desc: 'Existing mortgage discharge verification, NOC from previous bank, clear encumbrance confirmation', color: '#3b82f6' },
  { icon: '💼', code: 'SBT', title: 'Seller BT', desc: 'Simultaneous discharge and creation — the most complex case with golden rule verification', color: '#8b5cf6' },
  { icon: '🏦', code: 'LAP', title: 'LAP / Mortgage', desc: 'Loan against property with full encumbrance search, 7/12 land use, valuation cross-check', color: '#10b981' },
]

const FEATURES = [
  { icon: '⚡', title: 'Dual-Model Intelligence', desc: 'Haiku handles speed-critical extraction. Sonnet delivers depth-critical legal analysis. Optimal model at every stage.', stat: '5× faster', color: '#6366f1' },
  { icon: '⚖️', title: '38+ Legal Rules Engine', desc: 'RULE 4A, RULE 17A, FERFAR columns, EC 7-column parsing, boundary verification — every Gujarat legal nuance encoded.', stat: '99.2% accuracy', color: '#8b5cf6' },
  { icon: '📋', title: 'Bank-Grade Reports', desc: '9-section structured report matching SBI, Axis, HDFC requirements — HTML preview + Word download, submission-ready.', stat: '9 sections', color: '#10b981' },
  { icon: '🔒', title: 'Isolated Processing', desc: 'Every document processed in an isolated environment. No storage, no sharing. Data deleted post-analysis. Bank-grade encryption.', stat: 'Zero retention', color: '#f59e0b' },
  { icon: '🏛️', title: 'Gujarat-Native Engine', desc: 'Built exclusively for Gujarat property law — SRO jurisdictions, 7/12, TPS, NA Orders, all Gujarat-specific formats supported.', stat: 'Gujarat native', color: '#ef4444' },
  { icon: '🎯', title: 'Parallel Processing', desc: 'Four Claude Sonnet instances run simultaneously to generate report sections in parallel, not sequence.', stat: '4× parallel', color: '#3b82f6' },
]

const SCAN_STEPS = [
  { label: 'DOCUMENT RECEIVED', value: 'PROCESSING...', color: '#6366f1', delay: 600 },
  { label: 'TITLE CHAIN', value: 'VERIFIED ✓', color: '#10b981', delay: 1800 },
  { label: 'EC ENCUMBRANCE', value: 'NIL ✓', color: '#10b981', delay: 3000 },
  { label: '7/12 LAND USE', value: 'BIN KHETI ✓', color: '#10b981', delay: 4200 },
  { label: 'LEGAL VERDICT', value: 'TITLE CLEAR', color: '#10b981', delay: 5400 },
  { label: 'REPORT STATUS', value: 'GENERATED ✓', color: '#f59e0b', delay: 6600 },
]

const LEGAL_TERMS = ['ENCUMBRANCE', 'TITLE CHAIN', '7/12', 'MUTATION', 'SURVEY', 'NA ORDER', 'EC ENTRY', 'SALE DEED', 'FERFAR', 'BANAKHAT', 'TPS', 'SRO', 'MORTGAGE', 'NOC', 'VERDICT', 'RERA', 'CERSAI', 'DEMAT']

function getRingNodes(count: number, radius: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * 360 / count - 90) * Math.PI / 180
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
  })
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold })
    o.observe(el); return () => o.disconnect()
  }, [threshold])
  return { ref, inView: v }
}

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeSteps, setActiveSteps] = useState<number[]>([])
  const [activePipe, setActivePipe] = useState(-1)
  const [headline, setHeadline] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [hoverBtn, setHoverBtn] = useState(false)

  const pipeRef = useInView(0.1)
  const featRef = useInView(0.05)
  const caseRef = useInView(0.05)
  const ctaRef = useInView(0.2)
  const statsRef = useInView(0.2)

  const HEADLINES = [
    "Property Title Scrutiny.",
    "Automated. Accurate. Instant.",
    "Built for Banking. Trusted by Advocates.",
  ]

  // Typewriter
  useEffect(() => {
    const h = HEADLINES[headline]
    if (charIdx < h.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 38)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setHeadline(p => (p + 1) % HEADLINES.length)
        setCharIdx(0)
      }, 2400)
      return () => clearTimeout(t)
    }
  }, [charIdx, headline])

  useEffect(() => {
    SCAN_STEPS.forEach((s, i) => setTimeout(() => setActiveSteps(p => [...p, i]), s.delay))
  }, [])

  useEffect(() => {
    if (!pipeRef.inView) return
    PIPELINE.forEach((_, i) => setTimeout(() => setActivePipe(i), i * 300 + 100))
  }, [pipeRef.inView])

  // Background canvas with legal terms + constellation + scan line
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight

    // Particles
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.2, op: Math.random() * 0.12 + 0.03,
    }))

    // Floating legal terms
    const terms = LEGAL_TERMS.map(t => ({
      text: t, x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.12,
      op: Math.random() * 0.04 + 0.01, size: Math.random() * 4 + 8,
    }))

    let scanY = 0
    let scanDir = 1
    let id: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Subtle grid
      ctx.strokeStyle = 'rgba(99,102,241,0.018)'
      ctx.lineWidth = 0.5
      const gSize = 80
      for (let x = 0; x < canvas.width; x += gSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke() }
      for (let y = 0; y < canvas.height; y += gSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke() }

      // Floating legal terms
      terms.forEach(t => {
        t.x += t.vx; t.y += t.vy
        if (t.x < -100) t.x = canvas.width + 100
        if (t.x > canvas.width + 100) t.x = -100
        if (t.y < -20) t.y = canvas.height + 20
        if (t.y > canvas.height + 20) t.y = -20
        ctx.font = `${t.size}px monospace`
        ctx.fillStyle = `rgba(99,102,241,${t.op})`
        ctx.fillText(t.text, t.x, t.y)
      })

      // Constellation
      pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1 })
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x; const dy = pts[i].y - pts[j].y; const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 130) { ctx.beginPath(); ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 130) * 0.07})`; ctx.lineWidth = 0.5; ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke() }
        }
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2); ctx.fillStyle = `rgba(99,102,241,${pts[i].op})`; ctx.fill()
      }

      // Scan line
      scanY += 0.8 * scanDir
      if (scanY > canvas.height) scanDir = -1
      if (scanY < 0) scanDir = 1
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(0.5, 'rgba(99,102,241,0.04)')
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 60, canvas.width, 120)

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
    <div style={{ background: '#04040f', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden', color: '#e2e8f0' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scan{from{transform:translateX(-100%)}to{transform:translateX(600%)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes spin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes spinR{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
        @keyframes corePulse{0%,100%{box-shadow:0 0 40px rgba(99,102,241,0.5),inset 0 0 40px rgba(99,102,241,0.1)}50%{box-shadow:0 0 100px rgba(139,92,246,0.9),inset 0 0 60px rgba(139,92,246,0.3)}}
        @keyframes ping{0%{transform:translate(-50%,-50%) scale(1);opacity:0.7}100%{transform:translate(-50%,-50%) scale(3.8);opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 15px rgba(99,102,241,0.3)}50%{box-shadow:0 0 40px rgba(139,92,246,0.7)}}
        @keyframes stepIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideR{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleUp{from{opacity:0;transform:scale(0.94) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes flowLine{0%{stroke-dashoffset:200}100%{stroke-dashoffset:0}}
        @keyframes cursor{0%,100%{opacity:1}50%{opacity:0}}
        .cursor::after{content:'|';animation:cursor 0.9s infinite;color:#6366f1;font-weight:300}
        @keyframes dataFlow{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px', background: 'rgba(4,4,15,0.85)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '14px', animation: 'glow 3s ease-in-out infinite' }}>T</div>
          <span style={{ fontWeight: '900', fontSize: '17px' }}>TITLEMATRIX<span style={{ color: '#6366f1' }}>.AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '40px' }}>
          {['Platform', 'Case Types', 'Security', 'Pricing'].map(l => <span key={l} style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', letterSpacing: '0.3px', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>{l}</span>)}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => router.push('/login')} style={{ padding: '7px 20px', borderRadius: '7px', border: '1px solid rgba(99,102,241,0.15)', background: 'transparent', color: '#64748b', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#94a3b8' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#64748b' }}>Sign In</button>
          <button onClick={() => router.push('/signup')} onMouseEnter={() => setHoverBtn(true)} onMouseLeave={() => setHoverBtn(false)} style={{ padding: '8px 22px', borderRadius: '7px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: '700', letterSpacing: '0.3px', boxShadow: hoverBtn ? '0 0 32px rgba(99,102,241,0.7)' : '0 0 16px rgba(99,102,241,0.3)', transition: 'all 0.25s' }}>Request Access</button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', paddingTop: '60px', position: 'relative', zIndex: 10 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 40px 0 64px' }}>
          <div style={{ width: '100%' }}>

            {/* Status badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '4px', marginBottom: '36px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', animation: 'fadeUp 0.5s ease 0.1s both' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', letterSpacing: '2.5px', fontFamily: 'monospace' }}>SYSTEM ONLINE · GUJARAT LEGAL ENGINE v5.3</span>
            </div>

            {/* Headline */}
            <div style={{ animation: 'fadeUp 0.6s ease 0.2s both', marginBottom: '20px' }}>
              <div style={{ fontSize: 'clamp(36px,4vw,64px)', fontWeight: '900', lineHeight: 1.06, letterSpacing: '-2px', color: '#f8fafc' }}>
                India's First AI
              </div>
              <div style={{ fontSize: 'clamp(36px,4vw,64px)', fontWeight: '900', lineHeight: 1.06, letterSpacing: '-2px', marginBottom: '8px', background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Property Title
              </div>
              <div style={{ fontSize: 'clamp(36px,4vw,64px)', fontWeight: '900', lineHeight: 1.06, letterSpacing: '-2px', color: '#f8fafc' }}>
                Scrutiny Engine.
              </div>
            </div>

            {/* Typewriter */}
            <div style={{ marginBottom: '36px', animation: 'fadeUp 0.6s ease 0.35s both' }}>
              <span className="cursor" style={{ fontSize: '18px', color: '#475569', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                {HEADLINES[headline].substring(0, charIdx)}
              </span>
            </div>

            <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.85, maxWidth: '420px', marginBottom: '44px', animation: 'fadeUp 0.6s ease 0.5s both' }}>
              Upload property documents. Receive a bank-grade legal scrutiny report in under 3 minutes — title chain verified, encumbrances detected, professional opinion delivered.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '52px', animation: 'fadeUp 0.6s ease 0.6s both' }}>
              <button onClick={() => router.push('/signup')} style={{ padding: '14px 36px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: '800', letterSpacing: '0.3px', boxShadow: '0 8px 32px rgba(99,102,241,0.45)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)', animation: 'scan 2.5s ease-in-out infinite' }} />
                Start Free — 5 Reports
              </button>
              <button onClick={() => router.push('/login')} style={{ padding: '14px 28px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1', fontSize: '14px', fontWeight: '600' }}>
                Sign In →
              </button>
            </div>

            {/* Case Type Chips */}
            <div style={{ animation: 'fadeUp 0.6s ease 0.7s both' }}>
              <div style={{ fontSize: '9px', color: '#1e293b', letterSpacing: '3px', fontWeight: '700', marginBottom: '12px', fontFamily: 'monospace' }}>VERIFIED CASE TYPES</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {CASES.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '4px', background: 'rgba(8,8,22,0.95)', border: `1px solid ${c.color}20`, animation: `fadeUp 0.4s ease ${0.75 + i * 0.07}s both` }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: c.color, fontWeight: '800', letterSpacing: '1px' }}>{c.code}</span>
                    <span style={{ fontSize: '11px', color: '#334155', fontWeight: '600' }}>{c.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — HUD */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '20px 48px 20px 0' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1e293b', letterSpacing: '3px' }}>LAT: 23.0225°N &nbsp;·&nbsp; LON: 72.5714°E &nbsp;·&nbsp; AHMEDABAD, GUJARAT</div>

          {/* HUD */}
          <div style={{ position: 'relative', width: '520px', height: '520px', animation: 'float 9s ease-in-out infinite', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '520px', height: '520px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.15)', animation: 'spin 45s linear infinite' }}>
              {outerNodes.map((n, i) => (<div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: i % 4 === 0 ? '10px' : '5px', height: i % 4 === 0 ? '10px' : '5px', borderRadius: '50%', background: i % 4 === 0 ? '#6366f1' : 'rgba(99,102,241,0.3)', boxShadow: i % 4 === 0 ? '0 0 14px #6366f1' : 'none', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />))}
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '480px', height: '480px', borderRadius: '50%', border: '1px dashed rgba(6,182,212,0.08)', animation: 'spinR 32s linear infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '370px', height: '370px', borderRadius: '50%', border: '1.5px solid rgba(139,92,246,0.25)', animation: 'spinR 22s linear infinite' }}>
              {midNodes.map((n, i) => (<div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '11px', height: '11px', borderRadius: '50%', background: 'rgba(139,92,246,0.9)', border: '1px solid #8b5cf6', boxShadow: '0 0 14px rgba(139,92,246,0.7)', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />))}
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '230px', height: '230px', borderRadius: '50%', border: '1.5px solid rgba(99,102,241,0.4)', animation: 'spin 14s linear infinite' }}>
              {innerNodes.map((n, i) => (<div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '13px', height: '13px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 18px rgba(99,102,241,1)', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />))}
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '165px', height: '165px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.5)', animation: 'ping 3s ease-out infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '165px', height: '165px', borderRadius: '50%', border: '1px solid rgba(6,182,212,0.3)', animation: 'ping 3s ease-out 1.5s infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '148px', height: '148px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(4,4,15,0.95) 70%)', border: '2px solid rgba(99,102,241,0.6)', animation: 'corePulse 3.5s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '44px', lineHeight: 1 }}>⚖️</div>
              <div style={{ fontSize: '8px', color: '#6366f1', fontWeight: '900', letterSpacing: '2.5px', fontFamily: 'monospace' }}>LEGAL AI</div>
              <div style={{ fontSize: '7px', color: '#1e293b', letterSpacing: '1px', fontFamily: 'monospace' }}>GUJARAT v5.3</div>
            </div>
          </div>

          {/* Scan Results Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '460px' }}>
            {SCAN_STEPS.map((s, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: '6px', background: 'rgba(8,8,22,0.98)', border: `1px solid ${activeSteps.includes(i) ? s.color + '35' : 'rgba(255,255,255,0.03)'}`, borderTop: `2px solid ${activeSteps.includes(i) ? s.color : 'rgba(255,255,255,0.05)'}`, opacity: activeSteps.includes(i) ? 1 : 0.15, animation: activeSteps.includes(i) ? 'stepIn 0.4s ease' : 'none', transition: 'all 0.4s' }}>
                <div style={{ fontSize: '7px', color: '#334155', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '5px', fontFamily: 'monospace' }}>{s.label}</div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: activeSteps.includes(i) ? s.color : '#0f172a', fontFamily: 'monospace' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STATS ═══ */}
      <div ref={statsRef.ref} style={{ borderTop: '1px solid rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.06)', background: 'rgba(8,8,22,0.7)', backdropFilter: 'blur(20px)', padding: '56px 80px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', position: 'relative', zIndex: 10 }}>
        {[
          { v: '< 3', u: ' min', l: 'Per Report', s: 'vs 3 days manual', c: '#6366f1' },
          { v: '99.2', u: '%', l: 'Extraction Accuracy', s: 'EC entries, names, dates', c: '#8b5cf6' },
          { v: '38', u: '+', l: 'Legal Rules', s: 'Gujarat-specific engine', c: '#10b981' },
          { v: '4×', u: '', l: 'Parallel Processing', s: 'Simultaneous AI instances', c: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(99,102,241,0.06)' : 'none', opacity: statsRef.inView ? 1 : 0, animation: statsRef.inView ? `fadeUp 0.5s ease ${i * 0.12}s both` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '3px', marginBottom: '6px' }}>
              <span style={{ fontSize: '52px', fontWeight: '900', color: '#f8fafc', lineHeight: 1, letterSpacing: '-2px' }}>{s.v}</span>
              <span style={{ fontSize: '22px', fontWeight: '700', color: s.c }}>{s.u}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>{s.l}</div>
            <div style={{ fontSize: '10px', color: '#1e293b', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* ═══ AI PIPELINE ═══ */}
      <div ref={pipeRef.ref} style={{ padding: '120px 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '80px', alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '3px', fontWeight: '700', fontFamily: 'monospace', marginBottom: '16px' }}>INTELLIGENCE PROTOCOL</div>
              <div style={{ fontSize: 'clamp(28px,3vw,46px)', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: 1.1, color: '#f8fafc' }}>
                Five-Stage AI Pipeline
              </div>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.9 }}>Two Claude models work in sequence and parallel — Haiku for rapid extraction, Sonnet for deep legal reasoning. The entire pipeline completes in approximately 80 seconds.</p>
            </div>
          </div>

          {/* Pipeline Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0', position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: '44px', left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa,#10b981,#f59e0b)', opacity: 0.3, zIndex: 0 }} />

            {PIPELINE.map((p, i) => (
              <div key={i} style={{ position: 'relative', zIndex: 1, opacity: activePipe >= i ? 1 : 0, animation: activePipe >= i ? `fadeUp 0.5s ease ${i * 0.1}s both` : 'none' }}>
                {/* Node circle */}
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: `radial-gradient(circle, ${p.color}18, rgba(4,4,15,0.95))`, border: `2px solid ${p.color}50`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: activePipe >= i ? `0 0 32px ${p.color}35` : 'none', transition: 'all 0.6s' }}>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: '900', color: p.color, letterSpacing: '1px' }}>{p.id}</div>
                  <div style={{ fontSize: '9px', color: '#1e293b', letterSpacing: '0.5px', fontFamily: 'monospace' }}>{p.time}</div>
                </div>
                {/* Card */}
                <div style={{ padding: '20px 16px', borderRadius: '8px', background: 'rgba(8,8,22,0.9)', border: `1px solid ${activePipe >= i ? p.color + '25' : 'rgba(255,255,255,0.03)'}`, borderTop: `2px solid ${p.color}`, margin: '0 6px', transition: 'all 0.5s' }}>
                  <div style={{ fontSize: '9px', color: p.color, fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px', marginBottom: '6px' }}>{p.model}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>{p.title}</div>
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>{p.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Total time */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', padding: '12px 28px', borderRadius: '6px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'blink 1.5s infinite' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#10b981', fontWeight: '700', letterSpacing: '0.5px' }}>Total execution: ~80 seconds &nbsp;·&nbsp; Traditional process: 2–3 working days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <div ref={featRef.ref} style={{ padding: '80px 80px 120px', background: 'rgba(6,6,18,0.5)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '64px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '3px', fontWeight: '700', fontFamily: 'monospace', marginBottom: '12px' }}>PLATFORM CAPABILITIES</div>
              <div style={{ fontSize: 'clamp(26px,2.8vw,42px)', fontWeight: '900', letterSpacing: '-1px', color: '#f8fafc', lineHeight: 1.1 }}>
                Everything Built for<br /><span style={{ color: '#6366f1' }}>Legal Intelligence</span>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#334155', textAlign: 'right', maxWidth: '280px', lineHeight: 1.7 }}>
              Built exclusively for Gujarat property law — every feature designed around what advocates and banks actually need.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: '28px', borderRadius: '8px', background: 'rgba(8,8,22,0.8)', border: '1px solid rgba(255,255,255,0.04)', opacity: featRef.inView ? 1 : 0, animation: featRef.inView ? `fadeUp 0.5s ease ${i * 0.07}s both` : 'none', cursor: 'default', transition: 'border-color 0.3s, background 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '30'; e.currentTarget.style.background = 'rgba(10,10,28,0.9)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.background = 'rgba(8,8,22,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: `${f.color}10`, border: `1px solid ${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{f.icon}</div>
                  <div style={{ padding: '4px 10px', borderRadius: '4px', background: `${f.color}10`, border: `1px solid ${f.color}20` }}>
                    <span style={{ fontSize: '10px', color: f.color, fontFamily: 'monospace', fontWeight: '700' }}>{f.stat}</span>
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#f1f5f9', marginBottom: '10px' }}>{f.title}</div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.75 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CASE TYPES ═══ */}
      <div ref={caseRef.ref} style={{ padding: '100px 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '3px', fontWeight: '700', fontFamily: 'monospace', marginBottom: '16px' }}>CASE INTELLIGENCE</div>
            <div style={{ fontSize: 'clamp(28px,3vw,46px)', fontWeight: '900', letterSpacing: '-1.5px', color: '#f8fafc', marginBottom: '16px' }}>Five Case Types. Zero Blind Spots.</div>
            <p style={{ fontSize: '14px', color: '#475569', maxWidth: '480px', margin: '0 auto', lineHeight: 1.8 }}>Each case type has dedicated rules, verification logic, and report sections — none of them share the same analysis path.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
            {CASES.map((c, i) => (
              <div key={i} style={{ padding: '28px 20px', borderRadius: '8px', background: 'rgba(8,8,22,0.8)', border: `1px solid ${c.color}15`, borderTop: `3px solid ${c.color}`, textAlign: 'center', opacity: caseRef.inView ? 1 : 0, animation: caseRef.inView ? `fadeUp 0.5s ease ${i * 0.1}s both` : 'none', cursor: 'default', transition: 'box-shadow 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 8px 32px ${c.color}20`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{c.icon}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: c.color, fontWeight: '800', letterSpacing: '2px', marginBottom: '8px' }}>{c.code}</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#f1f5f9', marginBottom: '10px' }}>{c.title}</div>
                <div style={{ width: '24px', height: '1px', background: c.color, margin: '0 auto 12px', borderRadius: '1px' }} />
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.65 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <div ref={ctaRef.ref} style={{ padding: '120px 80px', position: 'relative', zIndex: 10, background: 'rgba(6,6,18,0.5)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', opacity: ctaRef.inView ? 1 : 0, animation: ctaRef.inView ? 'fadeUp 0.7s ease both' : 'none' }}>

          {/* Terminal frame */}
          <div style={{ padding: '48px', borderRadius: '12px', background: 'rgba(8,8,24,0.9)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 80px rgba(99,102,241,0.12), inset 0 0 80px rgba(99,102,241,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f1,transparent)' }} />

            {/* Terminal header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
              {['#ef4444', '#f59e0b', '#10b981'].map((c, i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />)}
              <span style={{ fontSize: '10px', color: '#1e293b', fontFamily: 'monospace', marginLeft: '8px', letterSpacing: '1px' }}>TITLEMATRIX.AI — ACCESS TERMINAL</span>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#334155', marginBottom: '24px', textAlign: 'left' }}>
              <div><span style={{ color: '#6366f1' }}>$</span> <span style={{ color: '#10b981' }}>initialize</span> legal-scrutiny-engine --region=gujarat --free-tier=5-reports</div>
              <div style={{ marginTop: '8px', color: '#1e293b' }}>→ Engine ready. 5 complimentary reports allocated.</div>
            </div>

            <div style={{ fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: '900', letterSpacing: '-1.5px', color: '#f8fafc', marginBottom: '16px', lineHeight: 1.1 }}>
              Zero Errors.<br /><span style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Maximum Confidence.</span>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.8, marginBottom: '40px' }}>
              Start with 5 complimentary reports. No payment required. Full platform access from day one.
            </p>

            <button onClick={() => router.push('/signup')} style={{ padding: '16px 48px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '15px', fontWeight: '800', letterSpacing: '0.3px', boxShadow: '0 12px 48px rgba(99,102,241,0.5)', position: 'relative', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', animation: 'scan 2s ease-in-out infinite' }} />
              Begin Free Access
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '28px' }}>
              {['No credit card', 'Instant activation', '5 reports free'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid rgba(99,102,241,0.06)', padding: '32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', position: 'relative', zIndex: 10, background: 'rgba(4,4,12,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '13px' }}>T</div>
          <span style={{ fontWeight: '900', fontSize: '15px' }}>TITLEMATRIX<span style={{ color: '#6366f1' }}>.AI</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '28px' }}>
          {['support@titlematrixai.com', '+91 95122 69191'].map((t, i) => (<span key={i} style={{ fontSize: '11px', color: '#1e293b', fontFamily: 'monospace' }}>{t}</span>))}
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
          © 2026 TITLEMATRIX.AI · Gujarat Legal Engine v5.3 · All rights reserved
        </div>
      </div>
    </div>
  )
}