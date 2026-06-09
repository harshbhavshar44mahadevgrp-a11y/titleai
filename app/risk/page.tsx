"use client"
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

const risks = [
    { id: 1, type: 'Area Mismatch', desc: 'Sale Deed shows 242 sq.yd but 7/12 shows 238 sq.yd', level: 'High', doc: 'Sale Deed vs 7/12', status: 'Unresolved' },
    { id: 2, type: 'Mutation Pending', desc: 'Mutation entry not updated after 2024 sale', level: 'Medium', doc: 'Revenue Record', status: 'Pending' },
    { id: 3, type: 'Boundary Mismatch', desc: 'NA Order boundary description differs from Sale Deed', level: 'Medium', doc: 'NA Order', status: 'Under Review' },
    { id: 4, type: 'Property Card Missing', desc: 'Property Card not uploaded for verification', level: 'Low', doc: 'Property Card', status: 'Pending' },
    { id: 5, type: 'EC Clear', desc: 'Encumbrance Certificate shows no pending dues', level: 'Clear', doc: 'EC 2000-2024', status: 'Resolved' },
    { id: 6, type: 'Title Chain Complete', desc: 'Ownership chain verified from 1966 to 2024', level: 'Clear', doc: 'All Docs', status: 'Resolved' },
]

export default function RiskEngine() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [selected, setSelected] = useState<number | null>(null)
    const [filter, setFilter] = useState('All')

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const words = ['TITLEMATRIX.AI', 'RISK', 'HIGH', 'MEDIUM', 'LOW', 'SURVEY', 'MUTATION', 'BOUNDARY', 'AREA', 'MISMATCH', 'LEGAL', 'VERIFY', 'DEED', 'EC', 'TITLE']
        const fontSize = 13
        const cols = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(cols).fill(1)
        const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.4 + 0.2)
        const draw = () => {
            ctx.fillStyle = 'rgba(2,2,8,0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < drops.length; i++) {
                const word = words[Math.floor(Math.random() * words.length)]
                ctx.fillStyle = 'rgba(239,68,68,' + (Math.random() * 0.4 + 0.2) + ')'
                ctx.font = 'bold ' + fontSize + 'px monospace'
                ctx.fillText(word[Math.floor(Math.random() * word.length)], i * fontSize, drops[i] * fontSize)
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i] += speeds[i]
            }
        }
        const interval = setInterval(draw, 40)
        return () => clearInterval(interval)
    }, [])

    const riskColor = (level: string) => {
        if (level === 'High') return '#ef4444'
        if (level === 'Medium') return '#f59e0b'
        if (level === 'Low') return '#3b82f6'
        return '#10b981'
    }

    const filtered = filter === 'All' ? risks : risks.filter(r => r.level === filter)
    const highCount = risks.filter(r => r.level === 'High').length
    const medCount = risks.filter(r => r.level === 'Medium').length
    const lowCount = risks.filter(r => r.level === 'Low').length
    const clearCount = risks.filter(r => r.level === 'Clear').length

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.4 }} />
            <div style={{ position: 'fixed', top: '20%', left: '30%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

            <Sidebar />

            <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 10, marginLeft: '225px' }}>
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>
                            Risk <span style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.8)' }}>Engine</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>AI POWERED RISK DETECTION & ANALYSIS</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '100px', padding: '8px 18px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></div>
                        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700', letterSpacing: '1px' }}>2 HIGH RISKS DETECTED</span>
                    </div>
                </div>

                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                        {[
                            { label: 'High Risk', count: highCount, color: '#ef4444', icon: '⚠' },
                            { label: 'Medium Risk', count: medCount, color: '#f59e0b', icon: '◉' },
                            { label: 'Low Risk', count: lowCount, color: '#3b82f6', icon: '◈' },
                            { label: 'Clear', count: clearCount, color: '#10b981', icon: '✓' },
                        ].map(m => (
                            <div key={m.label}
                                onClick={() => setFilter(m.label === 'Clear' ? 'Clear' : m.label.split(' ')[0])}
                                style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid ' + m.color + '30', borderRadius: '16px', padding: '22px', cursor: 'pointer', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, ' + m.color + ', transparent)' }} />
                                <div style={{ fontSize: '24px', color: m.color, marginBottom: '12px' }}>{m.icon}</div>
                                <div style={{ fontSize: '36px', fontWeight: '900', color: m.color, letterSpacing: '-2px', lineHeight: 1 }}>{m.count}</div>
                                <div style={{ fontSize: '10px', color: '#334155', marginTop: '8px', letterSpacing: '1.5px', fontWeight: '700' }}>{m.label.toUpperCase()}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '20px', padding: '28px', marginBottom: '24px', backdropFilter: 'blur(30px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '1px' }}>
                                <span style={{ color: '#ef4444' }}>◉</span> OVERALL RISK SCORE
                            </div>
                            <span style={{ fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '6px 16px', borderRadius: '8px', fontWeight: '800', border: '1px solid rgba(239,68,68,0.3)', letterSpacing: '1px' }}>MEDIUM-HIGH</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ fontSize: '64px', fontWeight: '900', color: '#ef4444', letterSpacing: '-3px', textShadow: '0 0 30px rgba(239,68,68,0.6)', fontFamily: 'monospace' }}>42</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>RISK METER</div>
                                <div style={{ height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: '42%', background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)', borderRadius: '6px' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#1e293b', fontWeight: '600' }}>
                                    <span style={{ color: '#10b981' }}>0 SAFE</span>
                                    <span style={{ color: '#f59e0b' }}>50 MEDIUM</span>
                                    <span style={{ color: '#ef4444' }}>100 HIGH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        {['All', 'High', 'Medium', 'Low', 'Clear'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', border: filter === f ? '1px solid #6366f1' : '1px solid rgba(99,102,241,0.2)', background: filter === f ? 'rgba(99,102,241,0.2)' : 'rgba(2,2,8,0.8)', color: filter === f ? '#fff' : '#475569', transition: 'all 0.2s' }}>
                                {f}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.map(risk => (
                            <div key={risk.id}
                                onClick={() => setSelected(selected === risk.id ? null : risk.id)}
                                style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid ' + riskColor(risk.level) + '25', borderRadius: '16px', padding: '20px 24px', cursor: 'pointer', transition: 'all 0.25s', backdropFilter: 'blur(30px)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: riskColor(risk.level) + '15', border: '1px solid ' + riskColor(risk.level) + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                                            {risk.level === 'High' ? '⚠' : risk.level === 'Medium' ? '◉' : risk.level === 'Low' ? '◈' : '✓'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{risk.type}</div>
                                            <div style={{ fontSize: '11px', color: '#334155' }}>{risk.doc}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '10px', background: riskColor(risk.level) + '15', color: riskColor(risk.level), padding: '5px 14px', borderRadius: '8px', fontWeight: '800', border: '1px solid ' + riskColor(risk.level) + '40' }}>{risk.level.toUpperCase()}</span>
                                        <span style={{ fontSize: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '5px 14px', borderRadius: '8px', fontWeight: '700', border: '1px solid rgba(99,102,241,0.3)' }}>{risk.status}</span>
                                        <span style={{ color: '#334155', fontSize: '16px' }}>{selected === risk.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>
                                {selected === risk.id && (
                                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
                                        <div style={{ padding: '14px 18px', background: riskColor(risk.level) + '08', border: '1px solid ' + riskColor(risk.level) + '20', borderRadius: '12px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '1.5px', fontWeight: '700', marginBottom: '6px' }}>DISCREPANCY DETAILS</div>
                                            <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6' }}>{risk.desc}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>VIEW DOCUMENTS</button>
                                            <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>MARK RESOLVED</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}