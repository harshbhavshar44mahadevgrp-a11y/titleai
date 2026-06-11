"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '₹0',
        period: 'Forever',
        reports: '5 Reports',
        color: '#6366f1',
        features: [
            '5 Title Search Reports',
            'AI Document Analysis',
            'Basic Risk Detection',
            'PDF Download',
            'Email Support',
        ],
        cta: 'Get Started Free',
        popular: false,
    },
    {
        id: 'local',
        name: 'Local',
        price: '₹149',
        period: 'Per Report',
        reports: '1 Report',
        color: '#3b82f6',
        features: [
            '1 Title Search Report',
            'AI Document Analysis',
            'Full Risk Detection',
            'PDF Download',
            'Priority Support',
        ],
        cta: 'Buy Single Report',
        popular: false,
    },
    {
        id: 'basic',
        name: 'Basic',
        price: '₹2,599',
        period: '3 Months',
        reports: '200 Reports',
        color: '#10b981',
        features: [
            '200 Title Search Reports',
            'AI Document Analysis',
            'Full Risk Detection',
            '7/12 Gujarati Translation',
            'PDF Download',
            'Priority Email Support',
            'Case Management',
        ],
        cta: 'Start Basic Plan',
        popular: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₹6,000',
        period: '11 Months',
        reports: '500 Reports',
        color: '#f59e0b',
        features: [
            '500 Title Search Reports',
            'AI Document Analysis',
            'Advanced Risk Detection',
            '7/12 Gujarati Translation',
            'PDF Download — Axis Bank Format',
            'Priority Support',
            'Case Management',
            'EC 13 Year Analysis',
            'Title Flow — 14 Entries',
        ],
        cta: 'Start Pro Plan',
        popular: false,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '₹1,50,000',
        period: 'Per Year',
        reports: 'Unlimited Reports',
        color: '#8b5cf6',
        features: [
            'Unlimited Title Search Reports',
            'AI Document Analysis',
            'Advanced Risk Detection',
            '7/12 Gujarati Translation',
            'PDF Download — Axis Bank Format',
            'Dedicated Team Manager',
            'Custom Integration',
            'Priority 24/7 Support',
            'EC 13 Year Analysis',
            'Title Flow — 14 Entries',
            'Custom Branding',
            'API Access',
        ],
        cta: 'Contact Our Team',
        popular: false,
        enterprise: true,
    },
]

export default function PlansPage() {
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [showEnterpriseForm, setShowEnterpriseForm] = useState(false)
    const [formData, setFormData] = useState({
        name: '', organization: '', email: '', phone: '', city: '', message: ''
    })
    const [submitted, setSubmitted] = useState(false)
    const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const words = ['TITLEMATRIX.AI', 'PLAN', 'REPORT', 'LEGAL', 'BANK', 'ADVOCATE', 'TITLE', 'SEARCH', 'RISK', 'MORTGAGE']
        const fontSize = 13
        const cols = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(cols).fill(1)
        const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.4 + 0.2)
        const draw = () => {
            ctx.fillStyle = 'rgba(2,2,8,0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < drops.length; i++) {
                const word = words[Math.floor(Math.random() * words.length)]
                ctx.fillStyle = 'rgba(99,102,241,' + (Math.random() * 0.4 + 0.2) + ')'
                ctx.font = 'bold ' + fontSize + 'px monospace'
                ctx.fillText(word[Math.floor(Math.random() * word.length)], i * fontSize, drops[i] * fontSize)
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i] += speeds[i]
            }
        }
        const interval = setInterval(draw, 40)
        return () => clearInterval(interval)
    }, [])

    const handleEnterpriseSubmit = () => {
        if (!formData.name || !formData.email || !formData.phone) return
        setSubmitted(true)
        setTimeout(() => {
            setShowEnterpriseForm(false)
            setSubmitted(false)
            setFormData({ name: '', organization: '', email: '', phone: '', city: '', message: '' })
        }, 3000)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.4 }} />

            {/* Enterprise Form Modal */}
            {showEnterpriseForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEnterpriseForm(false)}>
                    <div style={{ background: '#0a0a14', border: '1px solid rgba(139,92,246,0.5)', borderRadius: '20px', padding: '40px', width: '500px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>Request Submitted!</div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>Our team manager will contact you within 24 hours.</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>🏢 Enterprise Plan</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '28px' }}>Fill the form — our team manager will contact you</div>

                                {[
                                    { key: 'name', label: 'Your Full Name *', placeholder: 'Adv. Ramesh Patel' },
                                    { key: 'organization', label: 'Organization / Bank Name', placeholder: 'Axis Bank / Law Firm Name' },
                                    { key: 'email', label: 'Email Address *', placeholder: 'advocate@example.com' },
                                    { key: 'phone', label: 'Phone Number *', placeholder: '+91 98765 43210' },
                                    { key: 'city', label: 'City', placeholder: 'Ahmedabad, Gujarat' },
                                ].map(field => (
                                    <div key={field.key} style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', letterSpacing: '1px' }}>{field.label}</div>
                                        <input
                                            value={(formData as any)[field.key]}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                            placeholder={field.placeholder}
                                            style={{ width: '100%', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                ))}

                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', letterSpacing: '1px' }}>Message / Requirements</div>
                                    <textarea
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Tell us about your requirements..."
                                        rows={3}
                                        style={{ width: '100%', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setShowEnterpriseForm(false)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '14px', color: '#6b7280', fontSize: '14px', cursor: 'pointer' }}>
                                        Cancel
                                    </button>
                                    <button onClick={handleEnterpriseSubmit} style={{ flex: 2, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', borderRadius: '10px', padding: '14px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                                        Submit Request →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <Sidebar />

            <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 10, marginLeft: '225px' }}>
                {/* Header */}
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Choose Your <span style={{ color: '#6366f1', textShadow: '0 0 20px rgba(99,102,241,0.8)' }}>Plan</span></div>
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>SIMPLE PRICING — NO HIDDEN FEES</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '100px', padding: '8px 18px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>RAZORPAY SECURED</span>
                    </div>
                </div>

                <div style={{ padding: '40px 32px' }}>
                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>
                            Simple, Transparent <span style={{ color: '#6366f1' }}>Pricing</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#475569', maxWidth: '600px', margin: '0 auto' }}>
                            Start free — upgrade when you need more reports. Perfect for advocates, banks, and NBFCs.
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', maxWidth: '1400px', margin: '0 auto' }}>
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                onMouseEnter={() => setHoveredPlan(plan.id)}
                                onMouseLeave={() => setHoveredPlan(null)}
                                style={{
                                    background: plan.popular ? `linear-gradient(135deg, ${plan.color}15, rgba(10,10,20,0.95))` : 'rgba(10,10,20,0.8)',
                                    border: plan.popular ? `2px solid ${plan.color}` : hoveredPlan === plan.id ? `1px solid ${plan.color}60` : '1px solid rgba(99,102,241,0.15)',
                                    borderRadius: '20px',
                                    padding: '28px 20px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s',
                                    transform: hoveredPlan === plan.id ? 'translateY(-8px)' : 'translateY(0)',
                                    boxShadow: hoveredPlan === plan.id ? `0 20px 60px ${plan.color}30` : 'none',
                                }}
                            >
                                {plan.popular && (
                                    <div style={{ position: 'absolute', top: '16px', right: '16px', background: plan.color, borderRadius: '20px', padding: '4px 12px', fontSize: '10px', fontWeight: '800', color: '#fff', letterSpacing: '1px' }}>
                                        POPULAR
                                    </div>
                                )}

                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${plan.color}, transparent)` }} />

                                <div style={{ fontSize: '13px', fontWeight: '800', color: plan.color, letterSpacing: '2px', marginBottom: '8px' }}>{plan.name.toUpperCase()}</div>
                                <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '4px' }}>{plan.price}</div>
                                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>{plan.period}</div>
                                <div style={{ fontSize: '12px', color: plan.color, fontWeight: '700', marginBottom: '24px', padding: '6px 12px', background: plan.color + '15', borderRadius: '8px', display: 'inline-block' }}>
                                    {plan.reports}
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    {plan.features.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                                            <span style={{ color: plan.color, fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>✓</span>
                                            <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => plan.enterprise ? setShowEnterpriseForm(true) : plan.id === 'free' ? router.push('/upload') : alert('Razorpay integration coming soon!')}
                                    style={{
                                        width: '100%',
                                        background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` : 'transparent',
                                        border: plan.popular ? 'none' : `1px solid ${plan.color}60`,
                                        borderRadius: '10px',
                                        padding: '12px',
                                        color: plan.popular ? '#fff' : plan.color,
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Features Comparison */}
                    <div style={{ marginTop: '60px', background: 'rgba(10,10,20,0.8)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '20px', padding: '32px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '24px', textAlign: 'center' }}>
                            Why Choose <span style={{ color: '#6366f1' }}>TITLEMATRIXAI?</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                            {[
                                { icon: '⚡', title: '5 Minutes', desc: 'Complete Title Search Report in 5 minutes instead of 2-3 days' },
                                { icon: '🏦', title: 'Axis Bank Format', desc: 'Exact Santosh Thakrar format — accepted by all major banks' },
                                { icon: '🔍', title: 'AI Powered', desc: 'GPT-4o reads Gujarati documents and generates legal reports' },
                                { icon: '📄', title: '14 Title Entries', desc: 'Complete title chain with all 14 mandatory paragraphs' },
                                { icon: '⚠️', title: 'Risk Detection', desc: 'Automatic HIGH/MEDIUM/LOW risk identification' },
                                { icon: '🔒', title: 'Secure', desc: 'Bank-grade security — your documents are safe' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: '28px', flexShrink: 0 }}>{item.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{item.title}</div>
                                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#475569' }}>
                            Questions? Contact us at{' '}
                            <span style={{ color: '#6366f1', fontWeight: '600' }}>support@TITLEMATRIX.AI.in</span>
                            {' '}or call{' '}
                            <span style={{ color: '#6366f1', fontWeight: '600' }}>+91 98765 43210</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}