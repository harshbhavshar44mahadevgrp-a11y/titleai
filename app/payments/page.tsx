"use client"
import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/Sidebar'

// ================================================================
// PLAN DATA
// ================================================================
const PLANS = [
    {
        id: 'starter',
        name: 'STARTER',
        pricePerReport: 149,
        range: '1 – 100',
        packTotal: 14900,
        color: '#6366f1',
        glow: 'rgba(99,102,241,0.35)',
        border: 'rgba(99,102,241,0.5)',
        badge: null,
        savingsPct: 0,
        savedPerReport: 0,
        features: ['1 to 100 Reports', 'All 5 Case Types', 'PDF Download', 'Email Support'],
    },
    {
        id: 'professional',
        name: 'PROFESSIONAL',
        pricePerReport: 135,
        range: '101 – 200',
        packTotal: 27000,
        color: '#3b82f6',
        glow: 'rgba(59,130,246,0.35)',
        border: 'rgba(59,130,246,0.5)',
        badge: 'SAVE 9%',
        savingsPct: 9,
        savedPerReport: 14,
        features: ['101 to 200 Reports', 'All 5 Case Types', 'PDF Download', 'Priority Support', 'Report History'],
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        pricePerReport: 120,
        range: '201 – 500',
        packTotal: 60000,
        color: '#8b5cf6',
        glow: 'rgba(139,92,246,0.35)',
        border: 'rgba(139,92,246,0.5)',
        badge: 'SAVE 19%',
        savingsPct: 19,
        savedPerReport: 29,
        features: ['201 to 500 Reports', 'All 5 Case Types', 'PDF Download', 'Dedicated Support', 'Report History', 'Custom Letterhead'],
    },
    {
        id: 'high_enterprise',
        name: 'HIGH ENTERPRISE',
        pricePerReport: 99,
        range: '501 – 999',
        packTotal: 98901,
        color: '#f59e0b',
        glow: 'rgba(245,158,11,0.4)',
        border: 'rgba(245,158,11,0.6)',
        badge: 'BEST VALUE',
        savingsPct: 33,
        savedPerReport: 50,
        features: ['501 to 999 Reports', 'All 5 Case Types', 'PDF Download', 'Dedicated Manager', 'Report History', 'Custom Letterhead', 'Priority API Access'],
    },
]

// ================================================================
// PLAN CARD — defined OUTSIDE main function (typing fix)
// ================================================================
interface PlanCardProps {
    plan: typeof PLANS[0]
    index: number
    hoveredPlan: string | null
    setHoveredPlan: (id: string | null) => void
    onBuy: (plan: typeof PLANS[0]) => void
}

function PlanCard({ plan, index, hoveredPlan, setHoveredPlan, onBuy }: PlanCardProps) {
    const isHovered = hoveredPlan === plan.id
    const isGold = plan.id === 'high_enterprise'

    return (
        <div
            onMouseEnter={() => setHoveredPlan(plan.id)}
            onMouseLeave={() => setHoveredPlan(null)}
            style={{
                position: 'relative',
                background: isHovered
                    ? `linear-gradient(145deg, rgba(8,8,24,0.98), rgba(8,8,24,0.9))`
                    : 'rgba(6,6,18,0.95)',
                border: `1px solid ${isHovered ? plan.border : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '20px',
                padding: '32px 28px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
                boxShadow: isHovered ? `0 20px 60px ${plan.glow}, 0 0 0 1px ${plan.border}` : '0 4px 20px rgba(0,0,0,0.4)',
                flex: 1,
                minWidth: 0,
            }}
        >
            {/* TOP GLOW LINE */}
            <div style={{
                position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
                background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)`,
                borderRadius: '0 0 4px 4px',
                opacity: isHovered ? 1 : 0.3,
                transition: 'opacity 0.3s',
            }} />

            {/* BADGE */}
            {plan.badge && (
                <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: isGold
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                    color: isGold ? '#000' : '#fff',
                    fontSize: '10px', fontWeight: '900', letterSpacing: '2px',
                    padding: '5px 16px', borderRadius: '100px',
                    whiteSpace: 'nowrap',
                    boxShadow: `0 4px 20px ${plan.glow}`,
                }}>
                    {isGold ? '★ ' : ''}{plan.badge}
                </div>
            )}

            {/* PLAN NAME */}
            <div style={{
                fontSize: '10px', fontWeight: '800', letterSpacing: '3px',
                color: plan.color, marginBottom: '20px', marginTop: plan.badge ? '8px' : '0',
            }}>
                {plan.name}
            </div>

            {/* PRICE PER REPORT — HERO */}
            <div style={{ marginBottom: '4px' }}>
                <span style={{
                    fontSize: '56px', fontWeight: '900', lineHeight: '1',
                    color: isHovered ? plan.color : '#fff',
                    transition: 'color 0.3s',
                    fontFamily: 'monospace',
                }}>
                    ₹{plan.pricePerReport}
                </span>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: '20px', letterSpacing: '1px' }}>
                PER REPORT
            </div>

            {/* SAVINGS TAG */}
            {plan.savedPerReport > 0 && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: `rgba(${plan.color === '#3b82f6' ? '59,130,246' : plan.color === '#8b5cf6' ? '139,92,246' : '245,158,11'},0.1)`,
                    border: `1px solid ${plan.border}`,
                    borderRadius: '8px', padding: '5px 12px', marginBottom: '20px',
                }}>
                    <span style={{ fontSize: '11px', color: plan.color, fontWeight: '700' }}>
                        ↓ ₹{plan.savedPerReport} cheaper than base
                    </span>
                </div>
            )}

            {/* DIVIDER */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 20px' }} />

            {/* REPORTS RANGE */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', marginBottom: '4px' }}>REPORTS RANGE</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#e2e8f0' }}>{plan.range}</div>
            </div>

            {/* PACK TOTAL */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', marginBottom: '4px' }}>PACK TOTAL</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#94a3b8' }}>
                    ₹{plan.packTotal.toLocaleString('en-IN')}
                </div>
            </div>

            {/* FEATURES */}
            <div style={{ marginBottom: '28px' }}>
                {plan.features.map((f, i) => (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: '8px', fontSize: '12px', color: '#64748b',
                    }}>
                        <div style={{
                            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                            background: `${plan.color}22`,
                            border: `1px solid ${plan.color}55`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '8px', color: plan.color,
                        }}>✓</div>
                        {f}
                    </div>
                ))}
            </div>

            {/* BUY BUTTON */}
            <button
                onClick={() => onBuy(plan)}
                style={{
                    width: '100%', padding: '14px',
                    background: isHovered
                        ? isGold
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isHovered ? 'transparent' : plan.border}`,
                    borderRadius: '12px',
                    color: isHovered ? (isGold ? '#000' : '#fff') : plan.color,
                    fontSize: '13px', fontWeight: '800', letterSpacing: '1px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: isHovered ? `0 8px 30px ${plan.glow}` : 'none',
                }}
            >
                GET STARTED →
            </button>
        </div>
    )
}

// ================================================================
// CONTACT MODAL — defined OUTSIDE main function
// ================================================================
interface ContactModalProps {
    plan: typeof PLANS[0] | null
    onClose: () => void
}

function ContactModal({ plan, onClose }: ContactModalProps) {
    if (!plan) return null
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'rgba(8,8,24,0.98)',
                    border: `1px solid ${plan.border}`,
                    borderRadius: '24px', padding: '48px 40px',
                    maxWidth: '480px', width: '90%',
                    boxShadow: `0 40px 100px ${plan.glow}`,
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>📞</div>
                <div style={{ fontSize: '11px', color: plan.color, letterSpacing: '3px', fontWeight: '700', marginBottom: '8px' }}>
                    {plan.name} PLAN
                </div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', marginBottom: '6px' }}>
                    ₹{plan.pricePerReport}/report
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '32px' }}>
                    Pack Total: ₹{plan.packTotal.toLocaleString('en-IN')} · {plan.range} reports
                </div>

                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.8' }}>
                    Payment setup ho raha hai — abhi contact karo plan activate karne ke liye:
                </div>

                <a href="tel:+919512269191" style={{ textDecoration: 'none' }}>
                    <div style={{
                        padding: '16px 24px', borderRadius: '14px', marginBottom: '12px',
                        background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                        color: '#fff', fontWeight: '800', fontSize: '16px', letterSpacing: '1px',
                        boxShadow: `0 8px 30px ${plan.glow}`,
                    }}>
                        📞 +91 95122 69191
                    </div>
                </a>

                <a href="mailto:info@titlematrixai.com" style={{ textDecoration: 'none' }}>
                    <div style={{
                        padding: '14px 24px', borderRadius: '14px', marginBottom: '24px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', fontWeight: '600', fontSize: '13px',
                    }}>
                        ✉️ info@titlematrixai.com
                    </div>
                </a>

                <button onClick={onClose} style={{
                    background: 'transparent', border: 'none',
                    color: '#334155', fontSize: '12px', cursor: 'pointer',
                }}>
                    ✕ Close
                </button>
            </div>
        </div>
    )
}

// ================================================================
// MAIN PAGE
// ================================================================
export default function PaymentsPage() {
    const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
    const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Matrix animation
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        canvas.width = window.innerWidth; canvas.height = window.innerHeight
        const words = ['TITLEMATRIX.AI', 'LEGAL', 'REPORT', 'EC', '7/12', 'BANK', 'TITLE', 'CLEAR']
        const fontSize = 13; const cols = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(cols).fill(1)
        const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.4 + 0.2)
        const draw = () => {
            ctx.fillStyle = 'rgba(2,2,8,0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < drops.length; i++) {
                const word = words[Math.floor(Math.random() * words.length)]
                ctx.fillStyle = 'rgba(99,102,241,' + (Math.random() * 0.3 + 0.1) + ')'
                ctx.font = 'bold ' + fontSize + 'px monospace'
                ctx.fillText(word[Math.floor(Math.random() * word.length)], i * fontSize, drops[i] * fontSize)
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i] += speeds[i]
            }
        }
        const interval = setInterval(draw, 40)
        return () => clearInterval(interval)
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.3, pointerEvents: 'none' }} />
            <Sidebar />

            <div className="pg-main" style={{ flex: 1, marginLeft: '225px', overflow: 'auto', position: 'relative', zIndex: 10 }}>

                {/* HEADER */}
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>
                        Pricing <span style={{ color: '#6366f1' }}>Matrix</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>
                        JITNA ZYADA — UTNA SASTA — MAXIMUM VALUE PER REPORT
                    </div>
                </div>

                <div style={{ padding: '40px 32px', maxWidth: '1400px', margin: '0 auto' }}>

                    {/* HERO HEADING */}
                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '6px 20px', borderRadius: '100px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                            <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: '700', letterSpacing: '3px' }}>TRANSPARENT PRICING</span>
                        </div>

                        <div style={{
                            fontSize: '48px', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: '1.1', marginBottom: '16px',
                            background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #818cf8 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            The More You Scale,<br />The Less You Pay
                        </div>

                        <div style={{ fontSize: '14px', color: '#475569', maxWidth: '480px', margin: '0 auto 32px', lineHeight: '1.8' }}>
                            Per report price automatically drops as your volume grows — no hidden fees, no lock-ins
                        </div>

                        {/* SAVINGS LADDER */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0', background: 'rgba(6,6,18,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                            {PLANS.map((p, i) => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ padding: '12px 20px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: p.color, fontFamily: 'monospace' }}>₹{p.pricePerReport}</div>
                                        <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '1px', marginTop: '2px' }}>{p.range}</div>
                                    </div>
                                    {i < PLANS.length - 1 && (
                                        <div style={{ color: '#1e293b', fontSize: '18px', fontWeight: '300' }}>→</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PLAN CARDS */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '48px', alignItems: 'stretch' }}>
                        {PLANS.map((plan, index) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                index={index}
                                hoveredPlan={hoveredPlan}
                                setHoveredPlan={setHoveredPlan}
                                onBuy={setSelectedPlan}
                            />
                        ))}
                    </div>

                    {/* BOTTOM CONTACT STRIP */}
                    <div style={{
                        padding: '24px 36px',
                        background: 'rgba(6,6,18,0.95)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '20px',
                    }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
                                Custom volume ya koi sawaal?
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569' }}>
                                1000+ reports ke liye special pricing available hai
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <a href="tel:+919512269191" style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 20px', borderRadius: '12px',
                                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                                    color: '#a5b4fc', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                }}>
                                    📞 +91 95122 69191
                                </div>
                            </a>

                            <a href="mailto:info@titlematrixai.com" style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 20px', borderRadius: '12px',
                                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                                    color: '#6ee7b7', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                }}>
                                    ✉️ info@titlematrixai.com
                                </div>
                            </a>

                            <a
                                href={`https://wa.me/919512269191?text=Hi, I'm interested in TitleMatrix.AI pricing`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                            >
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 20px', borderRadius: '12px',
                                    background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)',
                                    color: '#4ade80', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                }}>
                                    💬 WhatsApp
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* CONTACT MODAL */}
            <ContactModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
        </div>
    )
}