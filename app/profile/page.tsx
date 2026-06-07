"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

// ================================================================
// STAT PILL — outside main function
// ================================================================
interface StatPillProps {
    value: string
    label: string
    color: string
    icon: string
}
function StatPill({ value, label, color, icon }: StatPillProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '20px 32px',
            background: `linear-gradient(145deg, ${color}08, transparent)`,
            borderTop: `2px solid ${color}`,
            flex: 1,
        }}>
            <div style={{ fontSize: '10px', marginBottom: '6px' }}>{icon}</div>
            <div style={{ fontSize: '30px', fontWeight: '900', color, fontFamily: 'monospace', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginTop: '6px', fontWeight: '700' }}>{label}</div>
        </div>
    )
}

// ================================================================
// EDITABLE FIELD — outside main function
// ================================================================
interface EditFieldProps {
    icon: string
    label: string
    value: string
    editable?: boolean
    editing?: boolean
    color?: string
    inputType?: string
    onChange?: (v: string) => void
    onEditToggle?: () => void
    onSave?: () => void
    saving?: boolean
}
function EditField({ icon, label, value, editable, editing, color = '#6366f1', inputType = 'text', onChange, onEditToggle, onSave, saving }: EditFieldProps) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '18px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
            <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: `${color}12`, border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', fontWeight: '700', marginBottom: '4px' }}>{label}</div>
                {editing && onChange ? (
                    <input
                        type={inputType}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        autoFocus
                        style={{
                            background: `${color}10`, border: `1px solid ${color}50`,
                            borderRadius: '8px', padding: '6px 12px',
                            color: '#e2e8f0', fontSize: '13px', fontWeight: '600',
                            outline: 'none', width: '100%', fontFamily: 'Inter, sans-serif',
                        }}
                    />
                ) : (
                    <div style={{ fontSize: '13px', color: value ? '#e2e8f0' : '#334155', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {value || 'Not set — click edit to add'}
                    </div>
                )}
            </div>
            {editable && (
                editing ? (
                    <button onClick={onSave} disabled={saving} style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                        color: '#fff', fontSize: '11px', fontWeight: '700', flexShrink: 0,
                    }}>
                        {saving ? '...' : 'SAVE'}
                    </button>
                ) : (
                    <button onClick={onEditToggle} style={{
                        padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                        background: `${color}12`, border: `1px solid ${color}30`,
                        color, fontSize: '10px', fontWeight: '700', flexShrink: 0, letterSpacing: '1px',
                    }}>
                        EDIT
                    </button>
                )
            )}
            {!editable && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />}
        </div>
    )
}

// ================================================================
// MAIN PAGE
// ================================================================
export default function ProfilePage() {
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [userEmail, setUserEmail] = useState('')
    const [memberSince, setMemberSince] = useState('')
    const [lastLogin, setLastLogin] = useState('')
    const [avatarLetter, setAvatarLetter] = useState('U')
    const [operatorId, setOperatorId] = useState('')

    const [phone, setPhone] = useState('')
    const [phoneTemp, setPhoneTemp] = useState('')
    const [editingPhone, setEditingPhone] = useState(false)
    const [savingPhone, setSavingPhone] = useState(false)
    const [phoneSaved, setPhoneSaved] = useState(false)

    const [logoutConfirm, setLogoutConfirm] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || '')
                setAvatarLetter((user.email || 'U')[0].toUpperCase())
                const created = new Date(user.created_at)
                setMemberSince(created.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))
                const lastSeen = user.last_sign_in_at ? new Date(user.last_sign_in_at) : new Date()
                setLastLogin(lastSeen.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + lastSeen.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
                const savedPhone = user.user_metadata?.phone || ''
                setPhone(savedPhone)
                setPhoneTemp(savedPhone)
                const emailPrefix = (user.email || 'USER').slice(0, 4).toUpperCase()
                setOperatorId(`TM-${emailPrefix}-${created.getFullYear()}`)
            }
        }
        getUser()
    }, [])

    const handleSavePhone = async () => {
        setSavingPhone(true)
        const { error } = await supabase.auth.updateUser({ data: { phone: phoneTemp } })
        if (!error) {
            setPhone(phoneTemp)
            setPhoneSaved(true)
            setTimeout(() => setPhoneSaved(false), 3000)
        }
        setEditingPhone(false)
        setSavingPhone(false)
    }

    // Matrix canvas
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        canvas.width = window.innerWidth; canvas.height = window.innerHeight
        const chars = ['T', 'I', 'T', 'L', 'E', 'M', 'A', 'T', 'R', 'I', 'X', '0', '1']
        const fontSize = 13; const cols = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(cols).fill(1)
        const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.3 + 0.1)
        const draw = () => {
            ctx.fillStyle = 'rgba(2,2,8,0.06)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < drops.length; i++) {
                ctx.fillStyle = 'rgba(99,102,241,' + (Math.random() * 0.2 + 0.05) + ')'
                ctx.font = 'bold ' + fontSize + 'px monospace'
                ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, drops[i] * fontSize)
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i] += speeds[i]
            }
        }
        const interval = setInterval(draw, 50)
        return () => clearInterval(interval)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>

            <style>{`
        @keyframes rotateRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(800%); }
        }
      `}</style>

            <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.25, pointerEvents: 'none' }} />
            <Sidebar />

            <div style={{ flex: 1, marginLeft: '225px', overflow: 'auto', position: 'relative', zIndex: 10 }}>

                {/* HEADER */}
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Operator <span style={{ color: '#6366f1' }}>Identity</span></div>
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>TITLEMATRIX.AI — SECURE LEGAL PLATFORM</div>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6366f1', letterSpacing: '3px', padding: '8px 16px', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', background: 'rgba(99,102,241,0.06)' }}>
                        {operatorId}
                    </div>
                </div>

                <div style={{ padding: '40px 32px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeUp 0.5s ease' }}>

                    {/* ── HERO SECTION — NO BOX ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '48px', marginBottom: '56px', position: 'relative' }}>

                        {/* BIG GLOW BEHIND AVATAR */}
                        <div style={{
                            position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                            width: '200px', height: '200px', borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* AVATAR */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            {/* Rotating ring */}
                            <div style={{
                                position: 'absolute', inset: '-14px', borderRadius: '50%',
                                background: 'conic-gradient(from 0deg, #6366f1 0%, #8b5cf6 30%, transparent 50%, #3b82f6 80%, #6366f1 100%)',
                                animation: 'rotateRing 4s linear infinite',
                                filter: 'blur(2px)',
                            }} />
                            <div style={{
                                position: 'absolute', inset: '-14px', borderRadius: '50%',
                                background: 'conic-gradient(from 180deg, #6366f1 0%, transparent 40%, #8b5cf6 70%, transparent 100%)',
                                animation: 'rotateRing 4s linear infinite reverse',
                                opacity: 0.5,
                            }} />
                            {/* Avatar circle */}
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '52px', fontWeight: '900', color: '#fff',
                                position: 'relative', zIndex: 2,
                                boxShadow: '0 0 0 4px #020208',
                            }}>
                                {avatarLetter}
                            </div>
                            {/* Online */}
                            <div style={{
                                position: 'absolute', bottom: '4px', right: '4px', zIndex: 3,
                                width: '20px', height: '20px', borderRadius: '50%',
                                background: '#10b981', border: '3px solid #020208',
                                boxShadow: '0 0 16px #10b981', animation: 'glow 2s infinite',
                            }} />
                        </div>

                        {/* NAME + STATUS — FLOATING, NO BOX */}
                        <div>
                            <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '8px' }}>
                                VERIFIED OPERATOR
                            </div>
                            <div style={{ fontSize: '38px', fontWeight: '900', color: '#fff', lineHeight: 1.1, marginBottom: '8px', wordBreak: 'break-all' }}>
                                {userEmail.split('@')[0] || 'Operator'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
                                {userEmail || 'Loading...'}
                            </div>
                            {/* Inline badges */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {[
                                    { label: '✓ ACTIVE', c: '#10b981' },
                                    { label: '⚖ LEGAL PRO', c: '#6366f1' },
                                    { label: '★ FREE PLAN', c: '#f59e0b' },
                                ].map(b => (
                                    <div key={b.label} style={{
                                        padding: '5px 14px', borderRadius: '100px',
                                        background: `${b.c}12`, border: `1px solid ${b.c}35`,
                                        fontSize: '10px', color: b.c, fontWeight: '700', letterSpacing: '1px',
                                    }}>{b.label}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── DATA SECTIONS — TWO COLUMNS ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>

                        {/* LEFT — ACCOUNT */}
                        <div>
                            <div style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '4px' }}>
                // ACCOUNT INFO
                            </div>
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, #6366f1, transparent)', marginBottom: '4px' }} />

                            <EditField icon="📧" label="EMAIL ADDRESS" value={userEmail} color="#6366f1" />
                            <EditField icon="📅" label="MEMBER SINCE" value={memberSince} color="#3b82f6" />
                            <EditField icon="🕐" label="LAST LOGIN" value={lastLogin} color="#8b5cf6" />
                            <EditField icon="🏛️" label="ORGANISATION" value="TitleMatrix.AI & Associates" color="#f59e0b" />
                        </div>

                        {/* RIGHT — CONTACT */}
                        <div>
                            <div style={{ fontSize: '10px', color: '#10b981', letterSpacing: '3px', fontWeight: '700', marginBottom: '4px' }}>
                // CONTACT DETAILS
                            </div>
                            <div style={{ height: '1px', background: 'linear-gradient(90deg, #10b981, transparent)', marginBottom: '4px' }} />

                            {/* PHONE — EDITABLE */}
                            <EditField
                                icon="📞"
                                label="PHONE NUMBER"
                                value={editingPhone ? phoneTemp : (phone || '')}
                                editable
                                editing={editingPhone}
                                color="#10b981"
                                inputType="tel"
                                onChange={setPhoneTemp}
                                onEditToggle={() => { setPhoneTemp(phone); setEditingPhone(true) }}
                                onSave={handleSavePhone}
                                saving={savingPhone}
                            />

                            {phoneSaved && (
                                <div style={{ fontSize: '11px', color: '#10b981', padding: '6px 0', fontWeight: '600' }}>
                                    ✓ Phone number saved!
                                </div>
                            )}

                            <EditField icon="🌐" label="PLATFORM" value="TitleMatrix.AI" color="#6366f1" />
                            <EditField icon="🔐" label="AUTH METHOD" value="Email + Password" color="#8b5cf6" />
                            <EditField icon="📊" label="OPERATOR ID" value={operatorId} color="#f59e0b" />
                        </div>
                    </div>

                    {/* ── STATS STRIP — NO BOX ── */}
                    <div style={{
                        display: 'flex',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px', overflow: 'hidden',
                        marginBottom: '28px',
                        background: 'rgba(6,6,18,0.8)',
                    }}>
                        <StatPill value="5" label="CASE TYPES" color="#6366f1" icon="⚖️" />
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <StatPill value="2" label="AI MODELS" color="#8b5cf6" icon="🤖" />
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <StatPill value="FREE" label="CURRENT PLAN" color="#f59e0b" icon="★" />
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <StatPill value="∞" label="SUPPORT" color="#10b981" icon="💬" />
                    </div>

                    {/* ── LOGOUT STRIP ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '20px 28px',
                        border: `1px solid ${logoutConfirm ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.05)'}`,
                        borderRadius: '14px',
                        background: logoutConfirm ? 'rgba(239,68,68,0.04)' : 'rgba(6,6,18,0.8)',
                        transition: 'all 0.3s',
                    }}>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: logoutConfirm ? '#f87171' : '#64748b', marginBottom: '2px' }}>
                                {logoutConfirm ? '⚠️ Confirm — terminate this session?' : '🔐 Session Control'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#334155' }}>
                                {logoutConfirm ? 'Ye action tumhe logout kar dega' : 'Active session manage karo'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {logoutConfirm && (
                                <button onClick={() => setLogoutConfirm(false)} style={{
                                    padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'transparent', color: '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                }}>CANCEL</button>
                            )}
                            <button
                                onClick={logoutConfirm ? handleLogout : () => setLogoutConfirm(true)}
                                style={{
                                    padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: logoutConfirm ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'rgba(239,68,68,0.08)',
                                    color: logoutConfirm ? '#fff' : '#f87171',
                                    fontSize: '12px', fontWeight: '800', letterSpacing: '1px',
                                    boxShadow: logoutConfirm ? '0 8px 24px rgba(239,68,68,0.35)' : 'none',
                                    transition: 'all 0.3s',
                                }}
                            >
                                {logoutConfirm ? '⏹ LOGOUT NOW' : 'TERMINATE SESSION →'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}