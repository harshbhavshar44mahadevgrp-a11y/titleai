"use client"
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

export default function Mortgage() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [activeTab, setActiveTab] = useState('readiness')

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const words = ['MORTGAGE', 'BANK', 'LOAN', 'EMI', 'SECURITY', 'TITLE', 'VERIFIED', 'HDFC', 'SBI', 'ICICI', 'EQUITABLE', 'LEGAL', 'CHARGE', 'NOC']
        const fontSize = 13
        const cols = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(cols).fill(1)
        const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.4 + 0.2)
        const draw = () => {
            ctx.fillStyle = 'rgba(2,2,8,0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < drops.length; i++) {
                const word = words[Math.floor(Math.random() * words.length)]
                ctx.fillStyle = 'rgba(16,185,129,' + (Math.random() * 0.4 + 0.2) + ')'
                ctx.font = 'bold ' + fontSize + 'px monospace'
                ctx.fillText(word[Math.floor(Math.random() * word.length)], i * fontSize, drops[i] * fontSize)
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i] += speeds[i]
            }
        }
        const interval = setInterval(draw, 40)
        return () => clearInterval(interval)
    }, [])

    const checks = [
        { label: 'Clear Title Chain', status: true, desc: '58 year ownership chain verified' },
        { label: 'NA Conversion', status: true, desc: 'Non-agricultural order obtained 1994' },
        { label: 'EC Clear', status: true, desc: 'No encumbrance from 2000-2024' },
        { label: 'Registration Valid', status: true, desc: 'Sale deed registered Sub-Registrar' },
        { label: 'Mutation Updated', status: false, desc: 'Mutation pending after 2024 sale' },
        { label: 'Area Match', status: false, desc: 'Minor mismatch — Sale Deed vs 7/12' },
        { label: 'Property Card', status: false, desc: 'Property card not submitted' },
        { label: 'Layout Approval', status: true, desc: 'Layout approval obtained from AMC' },
    ]

    const banks = [
        { name: 'SBI Home Loan', suitable: true, maxLoan: '₹1.48 Cr', ltv: '80%', rate: '8.50%', remarks: 'Eligible — mutation to be completed' },
        { name: 'HDFC Bank', suitable: true, maxLoan: '₹1.57 Cr', ltv: '85%', rate: '8.75%', remarks: 'Eligible — area mismatch clarification needed' },
        { name: 'ICICI Bank', suitable: true, maxLoan: '₹1.48 Cr', ltv: '80%', rate: '9.00%', remarks: 'Eligible — standard documentation required' },
        { name: 'Axis Bank', suitable: false, maxLoan: '-', ltv: '-', rate: '-', remarks: 'Not eligible — mutation pending required first' },
        { name: 'Punjab National Bank', suitable: true, maxLoan: '₹1.38 Cr', ltv: '75%', rate: '8.40%', remarks: 'Eligible — lowest rate option' },
    ]

    const docs = [
        { doc: 'Original Sale Deed 2024', hold: 'Original', bank: true },
        { doc: 'EC Certificate', hold: 'Original', bank: true },
        { doc: 'Revenue Record 7/12', hold: 'Certified Copy', bank: true },
        { doc: 'NA Order', hold: 'Original', bank: true },
        { doc: 'Property Card', hold: 'Certified Copy', bank: true },
        { doc: 'Layout Approval', hold: 'Certified Copy', bank: true },
        { doc: 'All Previous Sale Deeds', hold: 'Original', bank: true },
        { doc: 'Succession Certificate 1978', hold: 'Certified Copy', bank: false },
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.4 }} />
            <div style={{ position: 'fixed', top: '20%', left: '40%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

            <Sidebar />

            <div className="pg-main" style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 10, marginLeft: '225px' }}>
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>
                            Mortgage <span style={{ color: '#10b981', textShadow: '0 0 20px rgba(16,185,129,0.8)' }}>Intelligence</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>BANK SUITABILITY · READINESS · SECURITY DOCS</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '100px', padding: '8px 18px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>92% MORTGAGE READY</span>
                    </div>
                </div>

                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                        {[
                            { label: 'Readiness Score', value: '92%', color: '#10b981' },
                            { label: 'Max Loan Value', value: '₹1.57 Cr', color: '#6366f1' },
                            { label: 'Eligible Banks', value: '4/5', color: '#3b82f6' },
                            { label: 'Pending Items', value: '3', color: '#f59e0b' },
                        ].map(m => (
                            <div key={m.label} style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid ' + m.color + '30', borderRadius: '14px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, ' + m.color + ', transparent)' }} />
                                <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', fontWeight: '700', marginBottom: '10px' }}>{m.label.toUpperCase()}</div>
                                <div style={{ fontSize: '28px', fontWeight: '900', color: m.color, letterSpacing: '-1px' }}>{m.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        {[
                            { id: 'readiness', label: 'Readiness Checklist' },
                            { id: 'banks', label: 'Bank Suitability' },
                            { id: 'security', label: 'Security Documents' },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: activeTab === tab.id ? '1px solid #10b981' : '1px solid rgba(16,185,129,0.2)', background: activeTab === tab.id ? 'rgba(16,185,129,0.15)' : 'rgba(2,2,8,0.8)', color: activeTab === tab.id ? '#10b981' : '#475569', transition: 'all 0.2s' }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'readiness' && (
                        <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(30px)' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '1px', marginBottom: '24px' }}>
                                <span style={{ color: '#10b981' }}>◉</span> MORTGAGE READINESS CHECKLIST
                            </div>
                            {checks.map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', borderRadius: '12px', marginBottom: '10px', background: c.status ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: '1px solid ' + (c.status ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.status ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                                        {c.status ? '✓' : '✗'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '3px' }}>{c.label}</div>
                                        <div style={{ fontSize: '11px', color: '#334155' }}>{c.desc}</div>
                                    </div>
                                    <span style={{ fontSize: '10px', background: c.status ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: c.status ? '#10b981' : '#ef4444', padding: '4px 12px', borderRadius: '6px', fontWeight: '800', border: '1px solid ' + (c.status ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') }}>{c.status ? 'CLEAR' : 'PENDING'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'banks' && (
                        <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(30px)' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '1px', marginBottom: '24px' }}>
                                <span style={{ color: '#10b981' }}>◈</span> BANK SUITABILITY ANALYSIS
                            </div>
                            {banks.map((b, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', borderRadius: '14px', marginBottom: '12px', background: b.suitable ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: '1px solid ' + (b.suitable ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: b.suitable ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                                        {b.suitable ? '🏦' : '🚫'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{b.name}</div>
                                        <div style={{ fontSize: '11px', color: '#475569' }}>{b.remarks}</div>
                                    </div>
                                    {b.suitable && (
                                        <div style={{ display: 'flex', gap: '16px', textAlign: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#334155', fontWeight: '600', marginBottom: '4px' }}>MAX LOAN</div>
                                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#10b981' }}>{b.maxLoan}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#334155', fontWeight: '600', marginBottom: '4px' }}>LTV</div>
                                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#6366f1' }}>{b.ltv}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#334155', fontWeight: '600', marginBottom: '4px' }}>RATE</div>
                                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#f59e0b' }}>{b.rate}</div>
                                            </div>
                                        </div>
                                    )}
                                    <span style={{ fontSize: '10px', background: b.suitable ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: b.suitable ? '#10b981' : '#ef4444', padding: '5px 14px', borderRadius: '8px', fontWeight: '800', border: '1px solid ' + (b.suitable ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'), flexShrink: 0 }}>{b.suitable ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '28px', backdropFilter: 'blur(30px)' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '1px', marginBottom: '24px' }}>
                                <span style={{ color: '#10b981' }}>▣</span> SECURITY CREATION DOCUMENTS
                            </div>
                            {docs.map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', borderRadius: '12px', marginBottom: '10px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <div style={{ fontSize: '20px' }}>📄</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{d.doc}</div>
                                    </div>
                                    <span style={{ fontSize: '10px', background: d.hold === 'Original' ? 'rgba(99,102,241,0.1)' : 'rgba(59,130,246,0.1)', color: d.hold === 'Original' ? '#6366f1' : '#3b82f6', padding: '4px 12px', borderRadius: '6px', fontWeight: '800', border: '1px solid ' + (d.hold === 'Original' ? 'rgba(99,102,241,0.3)' : 'rgba(59,130,246,0.3)') }}>{d.hold.toUpperCase()}</span>
                                    <span style={{ fontSize: '10px', background: d.bank ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: d.bank ? '#10b981' : '#ef4444', padding: '4px 12px', borderRadius: '6px', fontWeight: '800', border: '1px solid ' + (d.bank ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') }}>{d.bank ? 'BANK HOLDS' : 'OPTIONAL'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}