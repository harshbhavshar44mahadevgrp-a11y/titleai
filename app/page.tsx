"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const CASE_TYPES = [
  { icon: '🏗️', label: 'Builder Purchase', color: '#f59e0b' },
  { icon: '🔑', label: 'Resale', color: '#6366f1' },
  { icon: '🔄', label: 'Balance Transfer', color: '#3b82f6' },
  { icon: '💼', label: 'Seller BT', color: '#8b5cf6' },
  { icon: '🏦', label: 'LAP / Mortgage', color: '#10b981' },
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

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoverBtn, setHoverBtn] = useState(false)
  const [activeSteps, setActiveSteps] = useState<number[]>([])

  useEffect(() => {
    SCAN_STEPS.forEach((s, i) => {
      setTimeout(() => setActiveSteps(prev => [...prev, i]), s.delay)
    })
  }, [])

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
    <div style={{ minHeight: '100vh', background: '#02020a', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scan{from{transform:translateX(-100%)}to{transform:translateX(600%)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes spin{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes spinR{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
        @keyframes corePulse{0%,100%{box-shadow:0 0 40px rgba(99,102,241,0.5),inset 0 0 40px rgba(99,102,241,0.1)}50%{box-shadow:0 0 90px rgba(139,92,246,0.8),inset 0 0 60px rgba(139,92,246,0.25)}}
        @keyframes ping{0%{transform:translate(-50%,-50%) scale(1);opacity:0.8}100%{transform:translate(-50%,-50%) scale(3.5);opacity:0}}
        @keyframes stepIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes navGlow{0%,100%{box-shadow:0 0 15px rgba(99,102,241,0.3)}50%{box-shadow:0 0 35px rgba(139,92,246,0.6)}}
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,10,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '15px', animation: 'navGlow 3s ease-in-out infinite' }}>T</div>
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>TITLEMATRIX<span style={{ color: '#6366f1' }}>.AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: '36px' }}>
          {['Features', 'Pricing', 'About'].map(l => <span key={l} style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>{l}</span>)}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/login')} style={{ padding: '8px 22px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>Login</button>
          <button onClick={() => router.push('/signup')} onMouseEnter={() => setHoverBtn(true)} onMouseLeave={() => setHoverBtn(false)} style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: '700', boxShadow: hoverBtn ? '0 8px 28px rgba(99,102,241,0.65)' : '0 4px 16px rgba(99,102,241,0.3)', transition: 'all 0.2s' }}>Get Started →</button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', paddingTop: '64px', position: 'relative', zIndex: 10 }}>

        {/* LEFT — HERO */}
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
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(6,6,18,0.92)', borderTop: `2px solid ${ct.color}`, border: `1px solid ${ct.color}18`, animation: `fadeUp 0.4s ease ${0.7 + i * 0.08}s both` }}>
                    <span style={{ fontSize: '14px' }}>{ct.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>{ct.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — HUD + SCAN RESULTS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px', padding: '20px 40px 20px 20px' }}>

          {/* COORDS */}
          <div style={{ fontSize: '10px', color: '#334155', fontFamily: 'monospace', letterSpacing: '2px' }}>
            LAT: 23.0225°N &nbsp;·&nbsp; LON: 72.5714°E &nbsp;·&nbsp; AHMEDABAD, GUJARAT
          </div>

          {/* HUD */}
          <div style={{ position: 'relative', width: '520px', height: '520px', animation: 'float 8s ease-in-out infinite', flexShrink: 0 }}>

            {/* OUTER RING */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '520px', height: '520px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.2)', animation: 'spin 40s linear infinite' }}>
              {outerNodes.map((n, i) => (
                <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: i % 4 === 0 ? '9px' : '5px', height: i % 4 === 0 ? '9px' : '5px', borderRadius: '50%', background: i % 4 === 0 ? '#6366f1' : 'rgba(99,102,241,0.35)', boxShadow: i % 4 === 0 ? '0 0 12px #6366f1' : 'none', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />
              ))}
            </div>

            {/* OUTER DASH */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '475px', height: '475px', borderRadius: '50%', border: '1px dashed rgba(99,102,241,0.1)', animation: 'spinR 28s linear infinite' }} />

            {/* MIDDLE RING */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '370px', height: '370px', borderRadius: '50%', border: '1.5px solid rgba(139,92,246,0.3)', animation: 'spinR 25s linear infinite' }}>
              {midNodes.map((n, i) => (
                <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(139,92,246,0.8)', border: '1px solid rgba(139,92,246,1)', boxShadow: '0 0 12px rgba(139,92,246,0.6)', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />
              ))}
            </div>

            {/* INNER RING */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '230px', height: '230px', borderRadius: '50%', border: '1.5px solid rgba(99,102,241,0.5)', animation: 'spin 16s linear infinite' }}>
              {innerNodes.map((n, i) => (
                <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 16px rgba(99,102,241,0.9)', transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px))` }} />
              ))}
            </div>

            {/* PING */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '160px', height: '160px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.6)', animation: 'ping 3s ease-out infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '160px', height: '160px', borderRadius: '50%', border: '1px solid rgba(139,92,246,0.4)', animation: 'ping 3s ease-out 1.5s infinite' }} />

            {/* CENTER */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '145px', height: '145px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(2,2,10,0.9) 70%)', border: '2px solid rgba(99,102,241,0.7)', animation: 'corePulse 3s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '42px' }}>⚖️</div>
              <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: '800', letterSpacing: '2px' }}>LEGAL AI</div>
              <div style={{ fontSize: '8px', color: '#334155', letterSpacing: '1px' }}>GUJARAT v5.0</div>
            </div>
          </div>

          {/* SCAN RESULTS — 2x3 GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%', maxWidth: '480px' }}>
            {SCAN_STEPS.map((s, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(6,6,18,0.95)',
                border: `1px solid ${activeSteps.includes(i) ? s.color + '45' : 'rgba(255,255,255,0.04)'}`,
                borderTop: `2px solid ${activeSteps.includes(i) ? s.color : 'rgba(255,255,255,0.06)'}`,
                opacity: activeSteps.includes(i) ? 1 : 0.2,
                animation: activeSteps.includes(i) ? 'stepIn 0.4s ease' : 'none',
                transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: '8px', color: '#475569', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '900', color: activeSteps.includes(i) ? s.color : '#1e293b', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* STATUS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'blink 1.5s infinite' }} />
            <span style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', fontWeight: '700' }}>SYSTEM ONLINE · GUJARAT LEGAL ENGINE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* BOTTOM INFO */}
      <div style={{ position: 'fixed', bottom: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[{ icon: '⚖️', text: 'Gujarat Legal Standards' }, { icon: '🔒', text: 'Bank Grade Security' }, { icon: '✉️', text: 'support@titlematrixai.com' }, { icon: '📞', text: '+91 95122 69191' }].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {i > 0 && <span style={{ color: '#1a1a2e', margin: '0 3px' }}>·</span>}
            <span style={{ fontSize: '10px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', color: '#2d3748', fontWeight: '500' }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}