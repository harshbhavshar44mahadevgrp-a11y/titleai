"use client"
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

const titleChain = [
    { year: '1966', event: 'Original Agricultural Land', owner: 'Maganbhai Patel', type: 'Origin', details: 'Survey No. 142/A, Village Odhav, Ahmedabad. Agricultural revenue record entry.', docs: ['Revenue Record 7/12'], status: 'Verified' },
    { year: '1978', event: 'Inheritance', owner: 'Ramanbhai Patel (Son)', type: 'Inheritance', details: 'Property inherited after death of Maganbhai Patel. Succession certificate obtained.', docs: ['Succession Certificate', 'Revenue Record'], status: 'Verified' },
    { year: '1989', event: 'Partition Deed', owner: 'Ramanbhai Patel', type: 'Partition', details: 'Family partition deed executed. Plot No. 7 allotted to Ramanbhai Patel exclusively.', docs: ['Partition Deed', 'Revenue Record'], status: 'Verified' },
    { year: '1994', event: 'NA Conversion', owner: 'Ramanbhai Patel', type: 'Conversion', details: 'Non-agricultural conversion order obtained from District Collector, Ahmedabad.', docs: ['NA Order', 'Revenue Record'], status: 'Verified' },
    { year: '2008', event: 'Sale', owner: 'Hitesh Mehta', type: 'Sale', details: 'Sale deed executed. Reg. No. 2847/2008. Sub-Registrar Ahmedabad. Consideration ₹45 Lakhs.', docs: ['Sale Deed 2008', 'EC'], status: 'Verified' },
    { year: '2018', event: 'Resale', owner: 'Suresh Shah', type: 'Sale', details: 'Sale deed executed. Reg. No. 1923/2018. Sub-Registrar Ahmedabad. Consideration ₹95 Lakhs.', docs: ['Sale Deed 2018', 'EC'], status: 'Verified' },
    { year: '2024', event: 'Current Sale', owner: 'Priya Patel', type: 'Current', details: 'Sale deed executed. Reg. No. 4821/2024. Under legal scrutiny. Consideration ₹1.85 Cr.', docs: ['Sale Deed 2024', 'EC 2024'], status: 'Under Review' },
]

const typeColor = (type: string) => {
    if (type === 'Origin') return '#8b5cf6'
    if (type === 'Inheritance') return '#3b82f6'
    if (type === 'Partition') return '#f59e0b'
    if (type === 'Conversion') return '#10b981'
    if (type === 'Sale') return '#6366f1'
    if (type === 'Current') return '#ef4444'
    return '#6366f1'
}

export default function TitleFlow() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [selected, setSelected] = useState<number | null>(null)
    const [animStep, setAnimStep] = useState(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const words = ['TITLEMATRIX.AI', 'OWNERSHIP', 'CHAIN', 'VERIFIED', 'DEED', '1966', '2024', 'SURVEY', 'PARTITION', 'INHERITANCE', 'NA', 'SALE', 'TITLE', 'FLOW']
        const fontSize = 13
        const cols = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(cols).fill(1)
        const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.4 + 0.2)
        const draw = () => {
            ctx.fillStyle = 'rgba(2,2,8,0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < drops.length; i++) {
                const word = words[Math.floor(Math.random() * words.length)]
                ctx.fillStyle = 'rgba(139,92,246,' + (Math.random() * 0.4 + 0.2) + ')'
                ctx.font = 'bold ' + fontSize + 'px monospace'
                ctx.fillText(word[Math.floor(Math.random() * word.length)], i * fontSize, drops[i] * fontSize)
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i] += speeds[i]
            }
        }
        const interval = setInterval(draw, 40)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const timer = setInterval(() => {
            setAnimStep(prev => prev < titleChain.length - 1 ? prev + 1 : prev)
        }, 400)
        return () => clearInterval(timer)
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.4 }} />
            <div style={{ position: 'fixed', top: '20%', right: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

            <Sidebar />

            <div className="pg-main" style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 10, marginLeft: '225px' }}>
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>
                            Title <span style={{ color: '#8b5cf6', textShadow: '0 0 20px rgba(139,92,246,0.8)' }}>Flow</span>
                        </div>
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>AI GENERATED OWNERSHIP CHAIN — 1966 TO 2024</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '100px', padding: '8px 18px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>58 YEAR CHAIN VERIFIED</span>
                        </div>
                        <button style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>EXPORT CHAIN</button>
                    </div>
                </div>

                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                        {[
                            { label: 'Chain Length', value: '58 yrs', color: '#8b5cf6' },
                            { label: 'Total Owners', value: '5', color: '#6366f1' },
                            { label: 'Transactions', value: '7', color: '#3b82f6' },
                            { label: 'Chain Status', value: 'Clear', color: '#10b981' },
                        ].map(m => (
                            <div key={m.label} style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid ' + m.color + '30', borderRadius: '14px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, ' + m.color + ', transparent)' }} />
                                <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', fontWeight: '700', marginBottom: '10px' }}>{m.label.toUpperCase()}</div>
                                <div style={{ fontSize: '28px', fontWeight: '900', color: m.color, letterSpacing: '-1px' }}>{m.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', padding: '32px', backdropFilter: 'blur(30px)' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', letterSpacing: '1px', marginBottom: '32px' }}>
                            <span style={{ color: '#8b5cf6' }}>⛓</span> OWNERSHIP CHAIN TIMELINE
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '28px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg, #8b5cf6, #6366f1, #3b82f6, #10b981)', opacity: 0.3 }} />
                            {titleChain.map((item, i) => (
                                <div key={i}
                                    onClick={() => setSelected(selected === i ? null : i)}
                                    style={{ display: 'flex', gap: '24px', marginBottom: '8px', cursor: 'pointer', opacity: i <= animStep ? 1 : 0.2, transition: 'all 0.5s ease', transform: i <= animStep ? 'translateX(0)' : 'translateX(-20px)' }}>
                                    <div style={{ flexShrink: 0, width: '58px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: typeColor(item.type), boxShadow: '0 0 15px ' + typeColor(item.type), border: '2px solid ' + typeColor(item.type), zIndex: 1, marginTop: '16px' }} />
                                    </div>
                                    <div style={{ flex: 1, background: selected === i ? typeColor(item.type) + '10' : 'rgba(99,102,241,0.04)', border: '1px solid ' + (selected === i ? typeColor(item.type) + '40' : 'rgba(99,102,241,0.1)'), borderRadius: '14px', padding: '18px 22px', marginBottom: '8px', transition: 'all 0.25s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: '900', color: typeColor(item.type), minWidth: '50px' }}>{item.year}</div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>{item.event}</div>
                                                    <div style={{ fontSize: '12px', color: '#475569' }}>{item.owner}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '10px', background: typeColor(item.type) + '15', color: typeColor(item.type), padding: '4px 12px', borderRadius: '6px', fontWeight: '800', border: '1px solid ' + typeColor(item.type) + '40' }}>{item.type.toUpperCase()}</span>
                                                <span style={{ fontSize: '10px', background: item.status === 'Verified' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.status === 'Verified' ? '#10b981' : '#ef4444', padding: '4px 12px', borderRadius: '6px', fontWeight: '800', border: '1px solid ' + (item.status === 'Verified' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') }}>{item.status.toUpperCase()}</span>
                                                <span style={{ color: '#334155' }}>{selected === i ? '▲' : '▼'}</span>
                                            </div>
                                        </div>
                                        {selected === i && (
                                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
                                                <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', marginBottom: '12px' }}>
                                                    <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '1px', fontWeight: '700', marginBottom: '6px' }}>DETAILS</div>
                                                    <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>{item.details}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {item.docs.map((doc, j) => (
                                                        <span key={j} style={{ fontSize: '11px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '5px 12px', borderRadius: '6px', fontWeight: '600', border: '1px solid rgba(99,102,241,0.3)' }}>📄 {doc}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}