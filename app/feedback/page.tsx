"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const ACCURACY_OPTIONS = [
    { id: 'perfect', label: 'Yes, worked perfectly', icon: '✓', color: '#10b981' },
    { id: 'slow', label: 'Yes, but it was slow', icon: '◎', color: '#f59e0b' },
    { id: 'errors', label: 'No, I encountered errors', icon: '✗', color: '#ef4444' },
]

export default function FeedbackPage() {
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [accuracy, setAccuracy] = useState('')
    const [suggestion, setSuggestion] = useState('')
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [step, setStep] = useState(1) // 1 = form, 2 = success

    const STAR_LABELS = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent']
    const STAR_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981']

    useEffect(() => {
        const c = canvasRef.current; if (!c) return
        const x = c.getContext('2d'); if (!x) return
        c.width = window.innerWidth; c.height = window.innerHeight
        const pts = Array.from({ length: 55 }, () => ({
            x: Math.random() * c.width, y: Math.random() * c.height,
            vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.0 + 0.3, op: Math.random() * 0.15 + 0.04,
        }))
        let id: number
        const draw = () => {
            x.clearRect(0, 0, c.width, c.height)
            pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > c.width) p.vx *= -1; if (p.y < 0 || p.y > c.height) p.vy *= -1 })
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x; const dy = pts[i].y - pts[j].y; const d = Math.sqrt(dx * dx + dy * dy)
                    if (d < 140) { x.beginPath(); x.strokeStyle = `rgba(99,102,241,${(1 - d / 140) * 0.08})`; x.lineWidth = 0.5; x.moveTo(pts[i].x, pts[i].y); x.lineTo(pts[j].x, pts[j].y); x.stroke() }
                }
                x.beginPath(); x.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2); x.fillStyle = `rgba(99,102,241,${pts[i].op})`; x.fill()
            }
            id = requestAnimationFrame(draw)
        }
        draw()
        const r = () => { c.width = window.innerWidth; c.height = window.innerHeight }
        window.addEventListener('resize', r)
        return () => { cancelAnimationFrame(id); window.removeEventListener('resize', r) }
    }, [])

    const handleSubmit = async () => {
        if (!rating) return
        setSubmitting(true)
        const { data: { user } } = await supabase.auth.getUser()
        const accuracyText = ACCURACY_OPTIONS.find(a => a.id === accuracy)?.label || ''
        await supabase.from('feedback').insert({
            user_id: user?.id || null,
            user_email: email || user?.email || '',
            type: 'quick_feedback',
            message: `Accuracy: ${accuracyText}\n\nSuggestion: ${suggestion}`,
            rating,
        })
        setSubmitting(false)
        setStep(2)
    }

    const canSubmit = rating > 0

    const inputStyle = {
        width: '100%', background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.18)', borderRadius: '10px',
        padding: '12px 16px', color: '#e2e8f0', fontSize: '13px',
        outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const,
        resize: 'none' as const,
    }

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes starPop{0%{transform:scale(1)}50%{transform:scale(1.4)}100%{transform:scale(1)}}
        @keyframes successPop{0%{opacity:0;transform:scale(0.8)}100%{opacity:1;transform:scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 30px rgba(99,102,241,0.3)}50%{box-shadow:0 0 60px rgba(139,92,246,0.6)}}
        .star-btn { transition: transform 0.15s ease; cursor: pointer; }
        .star-btn:hover { transform: scale(1.2); }
        .acc-opt { transition: all 0.2s ease; cursor: pointer; }
        .acc-opt:hover { transform: translateX(4px); }
      `}</style>

            <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none' }} />
            <Sidebar />

            <div className="pg-main" style={{ flex: 1, marginLeft: '225px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, padding: '32px' }}>

                {/* HEADER */}
                <div style={{ position: 'fixed', top: 0, left: '225px', right: 0, padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.15)', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)', zIndex: 50 }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Quick <span style={{ color: '#6366f1' }}>Feedback</span></div>
                    <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px', letterSpacing: '2px', fontWeight: '600' }}>HELP US IMPROVE — TITLEMATRIX.AI</div>
                </div>

                {step === 1 ? (
                    // ── FORM ──
                    <div style={{ width: '100%', maxWidth: '580px', marginTop: '64px', animation: 'fadeUp 0.5s ease' }}>

                        {/* CARD */}
                        <div style={{ background: 'rgba(6,6,18,0.96)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '24px', padding: '40px', backdropFilter: 'blur(20px)', animation: 'glow 4s ease-in-out infinite' }}>

                            {/* TOP LABEL */}
                            <div style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '8px' }}>// FEEDBACK PORTAL</div>
                            <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginBottom: '6px' }}>Share Your Experience</div>
                            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '36px', lineHeight: '1.6' }}>
                                Aapki <span style={{ color: '#6366f1', fontWeight: '700' }}>Pareshani</span> ya Aapki <span style={{ color: '#10b981', fontWeight: '700' }}>Prashansa</span> — dono jaanna chahte hain 💜
                            </div>

                            {/* Q1 — STAR RATING */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
                                    01 &nbsp;/&nbsp; How would you rate your overall experience?
                                </div>
                                <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)', marginBottom: '20px' }} />

                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                            key={s}
                                            className="star-btn"
                                            onClick={() => setRating(s)}
                                            onMouseEnter={() => setHoverRating(s)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            style={{
                                                fontSize: '38px', background: 'none', border: 'none', padding: '4px',
                                                filter: (hoverRating || rating) >= s ? 'none' : 'grayscale(1) opacity(0.25)',
                                                transform: rating === s ? 'scale(1.2)' : 'scale(1)',
                                            }}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>

                                {(hoverRating || rating) > 0 && (
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 16px', borderRadius: '100px',
                                        background: `${STAR_COLORS[hoverRating || rating]}18`,
                                        border: `1px solid ${STAR_COLORS[hoverRating || rating]}40`,
                                    }}>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: STAR_COLORS[hoverRating || rating] }}>
                                            {STAR_LABELS[hoverRating || rating]}
                                        </span>
                                        <span style={{ fontSize: '10px', color: '#475569' }}>— {hoverRating || rating}/5</span>
                                    </div>
                                )}
                            </div>

                            {/* Q2 — ACCURACY */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
                                    02 &nbsp;/&nbsp; Did the software generate your reports accurately?
                                </div>
                                <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)', marginBottom: '16px' }} />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {ACCURACY_OPTIONS.map(opt => (
                                        <div
                                            key={opt.id}
                                            className="acc-opt"
                                            onClick={() => setAccuracy(opt.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '14px',
                                                padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                                                background: accuracy === opt.id ? `${opt.color}12` : 'rgba(255,255,255,0.02)',
                                                border: accuracy === opt.id ? `1px solid ${opt.color}50` : '1px solid rgba(255,255,255,0.05)',
                                                borderLeft: accuracy === opt.id ? `3px solid ${opt.color}` : '3px solid transparent',
                                            }}
                                        >
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                                background: accuracy === opt.id ? `${opt.color}20` : 'rgba(255,255,255,0.04)',
                                                border: accuracy === opt.id ? `1.5px solid ${opt.color}` : '1.5px solid rgba(255,255,255,0.08)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '13px', color: accuracy === opt.id ? opt.color : '#475569',
                                                fontWeight: '900',
                                            }}>
                                                {accuracy === opt.id ? opt.icon : '○'}
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: accuracy === opt.id ? '700' : '400', color: accuracy === opt.id ? '#e2e8f0' : '#64748b' }}>
                                                {opt.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Q3 — SUGGESTION */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
                                    03 &nbsp;/&nbsp; What is one thing we could improve for you?
                                </div>
                                <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)', marginBottom: '16px' }} />
                                <textarea
                                    value={suggestion}
                                    onChange={e => setSuggestion(e.target.value)}
                                    placeholder="Share your suggestion here..."
                                    rows={3}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Q4 — EMAIL */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
                                    04 &nbsp;/&nbsp; Email Address <span style={{ color: '#334155', fontWeight: '400' }}>(Optional — for follow-up)</span>
                                </div>
                                <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)', marginBottom: '16px' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    style={{ ...inputStyle, resize: undefined }}
                                />
                            </div>

                            {/* SUBMIT */}
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit || submitting}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px', border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
                                    background: canSubmit ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99,102,241,0.15)',
                                    color: canSubmit ? '#fff' : '#475569',
                                    fontSize: '14px', fontWeight: '800', letterSpacing: '1px',
                                    boxShadow: canSubmit ? '0 10px 36px rgba(99,102,241,0.4)' : 'none',
                                    transition: 'all 0.2s',
                                    position: 'relative', overflow: 'hidden',
                                }}
                            >
                                {submitting ? 'Submitting...' : canSubmit ? 'SUBMIT FEEDBACK →' : 'Please select a rating to continue'}
                            </button>

                            {!canSubmit && (
                                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: '#334155' }}>
                                    ⭐ Rating is required — rest is optional
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // ── SUCCESS ──
                    <div style={{ textAlign: 'center', animation: 'successPop 0.5s ease', marginTop: '64px' }}>
                        <div style={{ fontSize: '80px', marginBottom: '24px', animation: 'float 3s ease-in-out infinite' }}>🎉</div>
                        <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '12px' }}>FEEDBACK RECEIVED</div>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>Bahut Shukriya!</div>
                        <div style={{ fontSize: '14px', color: '#475569', maxWidth: '400px', margin: '0 auto 16px', lineHeight: '1.8' }}>
                            Aapka feedback humara platform better banane mein help karega.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
                            {Array(rating).fill(0).map((_, i) => <span key={i} style={{ fontSize: '28px' }}>⭐</span>)}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => router.push('/upload')} style={{ padding: '14px 32px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: '800', boxShadow: '0 8px 28px rgba(99,102,241,0.4)' }}>
                                Generate Report →
                            </button>
                            <button onClick={() => { setStep(1); setRating(0); setAccuracy(''); setSuggestion(''); setEmail('') }} style={{ padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>
                                Give More Feedback
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}