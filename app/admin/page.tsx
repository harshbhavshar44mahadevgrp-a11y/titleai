"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'

interface AdminUser {
    id: string; email: string; username: string | null
    created_at: string; last_sign_in_at: string | null
    used: number; limit: number; left: number; subscribed: boolean
}

const REFRESH_SECONDS = 10
const PW_KEY = 'tmx_admin_pw'

// ── Design tokens ──
const T = {
    bg: '#04040c',
    surface: 'rgba(10,10,26,0.85)',
    border: 'rgba(99,102,241,0.14)',
    borderHover: 'rgba(99,102,241,0.45)',
    textHi: '#f1f5f9',
    textMid: '#94a3b8',
    textLow: '#64748b',
    primary: '#6366f1',
    violet: '#8b5cf6',
    success: '#34d399',
    danger: '#f87171',
    warn: '#fbbf24',
}

// ── Inline SVG icons (lucide-style, consistent 2px stroke) ──
const Icon = {
    shield: (c: string, s = 18) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
        </svg>
    ),
    users: (c: string, s = 18) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    file: (c: string, s = 18) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    activity: (c: string, s = 18) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    lock: (c: string, s = 18) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    unlock: (c: string, s = 18) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </svg>
    ),
    search: (c: string, s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    refresh: (c: string, s = 14) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    ),
    check: (c: string, s = 14) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    zap: (c: string, s = 12) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    at: (c: string, s = 11) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </svg>
    ),
}

const AVATAR_GRADS = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#0ea5e9,#6366f1)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#10b981,#0ea5e9)',
    'linear-gradient(135deg,#ec4899,#8b5cf6)',
]
const gradFor = (key: string) => AVATAR_GRADS[(key || '?').charCodeAt(0) % AVATAR_GRADS.length]

// Animated number — value badalte hi slide-up
function Num({ value, color }: { value: number | string; color: string }) {
    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={String(value)}
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ display: 'inline-block', color, fontVariantNumeric: 'tabular-nums' }}>
                {value}
            </motion.span>
        </AnimatePresence>
    )
}

// Stat card with CURSOR SPOTLIGHT — cursor jahan jaye wahan glow follow kare
function StatCard({ icon, n, label, color, i }: { icon: React.ReactNode; n: number; label: string; color: string; i: number }) {
    const [pos, setPos] = useState({ x: -200, y: -200 })
    const [hov, setHov] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.07, type: 'spring', stiffness: 260, damping: 24 }}
            whileHover={{ y: -7, scale: 1.025 }}
            onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
            onMouseMove={e => {
                const r = ref.current?.getBoundingClientRect()
                if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
            }}
            style={{
                flex: 1, padding: '22px 22px 20px', borderRadius: '18px', position: 'relative', overflow: 'hidden',
                background: T.surface, backdropFilter: 'blur(20px)', cursor: 'default',
                border: `1px solid ${hov ? color + '55' : T.border}`,
                boxShadow: hov ? `0 18px 50px rgba(0,0,0,0.5), 0 0 40px ${color}22` : '0 4px 20px rgba(0,0,0,0.25)',
                transition: 'border-color 0.25s, box-shadow 0.25s',
            }}>
            {/* cursor-follow spotlight */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, ${color}18, transparent 70%)`,
                opacity: hov ? 1 : 0, transition: 'opacity 0.3s',
            }} />
            {/* top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: hov ? 1 : 0.55, transition: 'opacity 0.25s' }} />
            {/* sheen sweep on hover */}
            <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '55%', pointerEvents: 'none',
                background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.05), transparent)',
                transform: hov ? 'translateX(240%)' : 'translateX(-120%)',
                transition: hov ? 'transform 0.7s ease' : 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', position: 'relative' }}>
                <motion.div
                    animate={hov ? { rotate: [0, -10, 10, 0], scale: 1.12 } : { rotate: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    style={{ width: '38px', height: '38px', borderRadius: '11px', background: `${color}14`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </motion.div>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 ${hov ? 18 : 10}px ${color}`, transition: 'box-shadow 0.25s' }} />
            </div>
            <div style={{ fontSize: '34px', fontWeight: '900', lineHeight: 1, fontFamily: 'ui-monospace, monospace', position: 'relative' }}>
                <Num value={n} color={T.textHi} />
            </div>
            <div style={{ fontSize: '10px', color: hov ? T.textMid : T.textLow, letterSpacing: '2px', marginTop: '8px', fontWeight: '700', transition: 'color 0.25s' }}>{label}</div>
        </motion.div>
    )
}

export default function AdminPage() {
    const [authed, setAuthed] = useState(false)
    const [pwInput, setPwInput] = useState('')
    const [pwError, setPwError] = useState('')
    const [checking, setChecking] = useState(false)
    const [shake, setShake] = useState(0)

    const [users, setUsers] = useState<AdminUser[]>([])
    const [totalReports, setTotalReports] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [searchFocus, setSearchFocus] = useState(false)
    const [edits, setEdits] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<string | null>(null)
    const [savedFlash, setSavedFlash] = useState<string | null>(null)
    const [lastSync, setLastSync] = useState<Date | null>(null)
    const [hoveredRow, setHoveredRow] = useState<string | null>(null)
    const pwRef = useRef<string>('')

    const load = useCallback(async (silent = false) => {
        if (!pwRef.current) return
        try {
            const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': pwRef.current } })
            if (res.status === 401) {
                localStorage.removeItem(PW_KEY); pwRef.current = ''
                setAuthed(false); setLoading(true)
                return
            }
            const data = await res.json()
            if (data.success) {
                setUsers(data.users)
                setTotalReports(data.totalReports)
                setLastSync(new Date())
            }
        } catch { /* network blip — agla refresh sambhal lega */ }
        if (!silent) setLoading(false)
    }, [])

    useEffect(() => {
        const saved = localStorage.getItem(PW_KEY)
        if (saved) { pwRef.current = saved; setAuthed(true) }
    }, [])

    useEffect(() => {
        if (!authed) return
        load()
        const iv = setInterval(() => load(true), REFRESH_SECONDS * 1000)
        return () => clearInterval(iv)
    }, [authed, load])

    const handleUnlock = async () => {
        if (!pwInput.trim()) { setPwError('Password dalo'); setShake(s => s + 1); return }
        setChecking(true); setPwError('')
        try {
            const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': pwInput.trim() } })
            if (res.status === 401) { setPwError('Galat password'); setShake(s => s + 1); setChecking(false); return }
            if (!res.ok) { setPwError('Server error — thodi der baad try karo'); setChecking(false); return }
            const data = await res.json()
            pwRef.current = pwInput.trim()
            localStorage.setItem(PW_KEY, pwRef.current)
            setUsers(data.users); setTotalReports(data.totalReports); setLastSync(new Date())
            setLoading(false); setAuthed(true)
        } catch {
            setPwError('Network error')
        }
        setChecking(false)
    }

    const lock = () => {
        localStorage.removeItem(PW_KEY)
        pwRef.current = ''
        setAuthed(false); setPwInput(''); setLoading(true)
    }

    const saveLimit = async (u: AdminUser) => {
        const raw = edits[u.id]
        const n = parseInt(raw, 10)
        if (!Number.isFinite(n) || n < 0) return
        setSaving(u.id)
        try {
            const res = await fetch('/api/admin/set-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-password': pwRef.current },
                body: JSON.stringify({ userId: u.id, limit: n }),
            })
            const data = await res.json()
            if (data.success) {
                setUsers(prev => prev.map(x => x.id === u.id ? { ...x, limit: n, left: Math.max(0, n - x.used) } : x))
                setEdits(prev => { const p = { ...prev }; delete p[u.id]; return p })
                setSavedFlash(u.id)
                setTimeout(() => setSavedFlash(null), 1600)
            }
        } catch { }
        setSaving(null)
    }

    const q = search.toLowerCase()
    const filtered = users.filter(u => !q
        || (u.username || '').toLowerCase().includes(q)
        || (u.email || '').toLowerCase().includes(q))
    const today = new Date().toISOString().split('T')[0]
    const activeToday = users.filter(u => u.last_sign_in_at?.startsWith(today)).length
    const limitOver = users.filter(u => u.left === 0 && !u.subscribed).length

    // ══════════ PASSWORD SCREEN ══════════
    if (!authed) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
                <style>{`
                    @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,-40px)} }
                    @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,50px)} }
                `}</style>
                <div style={{ position: 'absolute', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14), transparent 65%)', top: '8%', left: '18%', animation: 'orbFloat1 11s ease-in-out infinite', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '440px', height: '440px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.11), transparent 65%)', bottom: '5%', right: '12%', animation: 'orbFloat2 13s ease-in-out infinite', pointerEvents: 'none' }} />
                <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    style={{ width: '100%', maxWidth: '400px', padding: '0 20px', position: 'relative' }}>

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <motion.div
                            animate={{ y: [0, -7, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: '76px', height: '76px', borderRadius: '22px', margin: '0 auto 20px',
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.08))',
                                border: '1px solid rgba(99,102,241,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 50px rgba(99,102,241,0.25)',
                            }}>
                            {Icon.shield('#a5b4fc', 34)}
                        </motion.div>
                        <div style={{ fontSize: '26px', fontWeight: '900', color: T.textHi }}>Admin <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Panel</span></div>
                        <div style={{ fontSize: '10px', color: T.textLow, letterSpacing: '3px', fontWeight: '700', marginTop: '6px' }}>TITLEMATRIX.AI — RESTRICTED ZONE</div>
                    </div>

                    <motion.div
                        key={shake}
                        animate={shake > 0 ? { x: [0, -12, 12, -8, 8, -4, 4, 0] } : {}}
                        transition={{ duration: 0.45 }}
                        style={{
                            background: T.surface, backdropFilter: 'blur(24px)',
                            border: `1px solid ${pwError ? 'rgba(248,113,113,0.4)' : T.border}`,
                            borderRadius: '22px', padding: '28px',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                        }}>
                        <label style={{ fontSize: '10px', color: '#a5b4fc', fontWeight: '800', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
                            {Icon.lock('#a5b4fc', 13)} ADMIN PASSWORD
                        </label>
                        <input type="password" value={pwInput} autoFocus
                            onChange={e => { setPwInput(e.target.value); setPwError('') }}
                            onKeyDown={e => { if (e.key === 'Enter') handleUnlock() }}
                            placeholder="••••••••••••"
                            style={{
                                width: '100%', boxSizing: 'border-box', padding: '14px 18px',
                                background: 'rgba(4,4,14,0.9)',
                                border: `1px solid ${pwError ? 'rgba(248,113,113,0.5)' : 'rgba(99,102,241,0.3)'}`,
                                borderRadius: '12px', color: T.textHi, fontSize: '16px', outline: 'none',
                                letterSpacing: '3px', marginBottom: '12px', transition: 'border-color 0.2s',
                            }} />
                        <AnimatePresence>
                            {pwError && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    style={{ fontSize: '12px', color: T.danger, marginBottom: '12px', fontWeight: '600', overflow: 'hidden' }}>
                                    ✗ {pwError}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.button onClick={handleUnlock} disabled={checking}
                            whileHover={{ scale: 1.015, boxShadow: '0 8px 40px rgba(99,102,241,0.45)' }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                width: '100%', padding: '15px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
                                fontSize: '14px', fontWeight: '800', letterSpacing: '1px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                                opacity: checking ? 0.65 : 1, boxShadow: '0 6px 28px rgba(99,102,241,0.3)',
                            }}>
                            {Icon.unlock('#fff', 16)} {checking ? 'CHECKING...' : 'UNLOCK PANEL'}
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>
        )
    }

    // ══════════ PANEL ══════════
    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <style>{`
                @keyframes livePulse { 0%,100%{opacity:1; transform:scale(1)} 50%{opacity:.35; transform:scale(0.8)} }
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(70px,-50px)} }
                @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-60px,60px)} }
                input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
            `}</style>
            {/* ambient floating orbs */}
            <div style={{ position: 'fixed', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 65%)', top: '-8%', right: '-5%', animation: 'orbFloat1 14s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07), transparent 65%)', bottom: '-10%', left: '20%', animation: 'orbFloat2 17s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 }} />

            <Sidebar />
            <div style={{ flex: 1, marginLeft: '225px', overflow: 'auto', position: 'relative', zIndex: 1 }}>

                {/* HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    style={{
                        padding: '16px 32px', borderBottom: `1px solid ${T.border}`,
                        background: 'rgba(4,4,14,0.9)', backdropFilter: 'blur(24px)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'sticky', top: 0, zIndex: 20,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <motion.div whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }} transition={{ duration: 0.4 }}
                            style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
                            {Icon.shield('#a5b4fc', 20)}
                        </motion.div>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: T.textHi }}>Admin <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Panel</span></div>
                            <div style={{ fontSize: '9px', color: T.textLow, letterSpacing: '2px', fontWeight: '700', marginTop: '1px' }}>USERS · REPORTS · ACCESS CONTROL</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 14px', borderRadius: '100px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.success, animation: 'livePulse 2s infinite', boxShadow: `0 0 10px ${T.success}` }} />
                            <span style={{ fontSize: '10px', color: T.success, fontWeight: '800', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
                                LIVE{lastSync ? ` · ${lastSync.toLocaleTimeString('en-IN')}` : ''}
                            </span>
                        </div>
                        <motion.button onClick={() => load(true)}
                            whileHover={{ scale: 1.05, borderColor: 'rgba(99,102,241,0.6)' }} whileTap={{ scale: 0.92 }}
                            style={{ padding: '9px 18px', borderRadius: '11px', border: `1px solid ${T.borderHover}`, background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <motion.span whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} style={{ display: 'flex' }}>{Icon.refresh('#a5b4fc')}</motion.span> REFRESH
                        </motion.button>
                        <motion.button onClick={lock} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                            style={{ padding: '9px 18px', borderRadius: '11px', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.06)', color: T.danger, fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            {Icon.lock(T.danger, 13)} LOCK
                        </motion.button>
                    </div>
                </motion.div>

                <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', paddingTop: '110px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.15)', borderTop: '3px solid #6366f1', animation: 'spin 0.75s linear infinite', margin: '0 auto 18px' }} />
                            <div style={{ fontSize: '10px', color: T.textLow, letterSpacing: '3px', fontWeight: '700' }}>LOADING USERS...</div>
                        </div>
                    ) : (
                        <>
                            {/* STATS */}
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '26px' }}>
                                <StatCard i={0} icon={Icon.users('#818cf8', 19)} n={users.length} label="TOTAL USERS" color={T.primary} />
                                <StatCard i={1} icon={Icon.file('#fbbf24', 19)} n={totalReports} label="TOTAL REPORTS" color={T.warn} />
                                <StatCard i={2} icon={Icon.activity('#34d399', 19)} n={activeToday} label="ACTIVE TODAY" color={T.success} />
                                <StatCard i={3} icon={Icon.lock('#f87171', 19)} n={limitOver} label="LIMIT KHATAM" color={T.danger} />
                            </div>

                            {/* SEARCH */}
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                style={{ position: 'relative', marginBottom: '20px' }}>
                                <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'transform 0.2s' }}>
                                    {Icon.search(searchFocus ? '#a5b4fc' : T.textLow)}
                                </div>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Username ya email se search karo..."
                                    onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                                    style={{
                                        width: '100%', boxSizing: 'border-box', padding: '14px 18px 14px 46px',
                                        background: T.surface, borderRadius: '14px',
                                        border: `1px solid ${searchFocus ? 'rgba(99,102,241,0.55)' : T.border}`,
                                        boxShadow: searchFocus ? '0 0 0 4px rgba(99,102,241,0.08), 0 8px 30px rgba(99,102,241,0.1)' : 'none',
                                        color: T.textHi, fontSize: '13px', outline: 'none', backdropFilter: 'blur(16px)',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }} />
                            </motion.div>

                            {/* USER TABLE */}
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '20px', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1.1fr 1.3fr 1fr 0.8fr 0.9fr', gap: '10px', padding: '15px 24px', borderBottom: `1px solid ${T.border}`, fontSize: '9px', fontWeight: '800', color: T.textLow, letterSpacing: '1.8px', background: 'rgba(99,102,241,0.03)' }}>
                                    <div>USER</div><div>JOINED</div><div>LAST LOGIN</div>
                                    <div>USAGE</div>
                                    <div style={{ textAlign: 'center' }}>LIMIT</div>
                                    <div style={{ textAlign: 'center' }}>LEFT</div>
                                    <div style={{ textAlign: 'center' }}>ACTION</div>
                                </div>

                                {filtered.length === 0 && (
                                    <div style={{ padding: '52px', textAlign: 'center', color: T.textLow, fontSize: '13px' }}>Koi user nahi mila</div>
                                )}

                                <AnimatePresence initial={false}>
                                    {filtered.map((u, i) => {
                                        const editVal = edits[u.id] ?? String(u.limit)
                                        const changed = edits[u.id] !== undefined && edits[u.id] !== String(u.limit)
                                        const usagePct = u.subscribed ? 0 : Math.min(100, (u.used / Math.max(1, u.limit)) * 100)
                                        const usageColor = usagePct >= 100 ? T.danger : usagePct >= 60 ? T.warn : T.success
                                        const rowHov = hoveredRow === u.id
                                        const dispName = u.username || (u.email || '').split('@')[0]
                                        return (
                                            <motion.div key={u.id} layout
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0, backgroundColor: savedFlash === u.id ? 'rgba(52,211,153,0.08)' : rowHov ? 'rgba(99,102,241,0.055)' : 'rgba(0,0,0,0)' }}
                                                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                                                transition={{ delay: Math.min(i * 0.035, 0.4), type: 'spring', stiffness: 300, damping: 28 }}
                                                whileHover={{ x: 6 }}
                                                onHoverStart={() => setHoveredRow(u.id)} onHoverEnd={() => setHoveredRow(null)}
                                                style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1.1fr 1.3fr 1fr 0.8fr 0.9fr', gap: '10px', padding: '15px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', position: 'relative' }}>

                                                {/* hover accent bar */}
                                                <div style={{ position: 'absolute', left: 0, top: '18%', bottom: '18%', width: '3px', borderRadius: '3px', background: 'linear-gradient(180deg,#6366f1,#8b5cf6)', opacity: rowHov ? 1 : 0, transform: rowHov ? 'scaleY(1)' : 'scaleY(0.3)', transition: 'opacity 0.22s, transform 0.22s', boxShadow: '0 0 12px rgba(99,102,241,0.6)' }} />

                                                {/* USER — username bold + email niche */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                                    <div style={{
                                                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                                                        background: gradFor(dispName), display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontSize: '14px', fontWeight: '800',
                                                        transform: rowHov ? 'scale(1.14)' : 'scale(1)',
                                                        boxShadow: rowHov ? '0 0 20px rgba(99,102,241,0.5)' : 'none',
                                                        transition: 'transform 0.22s, box-shadow 0.22s',
                                                    }}>
                                                        {dispName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '13.5px', fontWeight: '700', color: T.textHi, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {dispName}
                                                            {!u.username && <span style={{ fontSize: '9px', color: '#3f475e', fontWeight: '600', marginLeft: '6px' }}>(no username)</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', minWidth: 0 }}>
                                                            {Icon.at(T.textLow)}
                                                            <span style={{ fontSize: '10.5px', color: T.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                                                        </div>
                                                        {u.subscribed && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                {Icon.zap(T.success)}
                                                                <span style={{ fontSize: '9px', color: T.success, fontWeight: '800', letterSpacing: '1px' }}>SUBSCRIBED · UNLIMITED</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ fontSize: '11px', color: T.textMid, fontVariantNumeric: 'tabular-nums' }}>{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                                <div style={{ fontSize: '11px', color: T.textMid, fontVariantNumeric: 'tabular-nums' }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div>

                                                {/* USAGE BAR */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: '800', color: usageColor, fontFamily: 'ui-monospace, monospace' }}>{u.used} used</span>
                                                        {!u.subscribed && <span style={{ fontSize: '10px', color: T.textLow, fontFamily: 'ui-monospace, monospace' }}>/{u.limit}</span>}
                                                    </div>
                                                    <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                        <motion.div
                                                            animate={{ width: u.subscribed ? '100%' : `${usagePct}%` }}
                                                            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                                                            style={{ height: '100%', borderRadius: '4px', background: u.subscribed ? 'linear-gradient(90deg,#34d399,#0ea5e9)' : usageColor, boxShadow: rowHov ? `0 0 8px ${usageColor}` : 'none', transition: 'box-shadow 0.22s' }} />
                                                    </div>
                                                </div>

                                                {/* LIMIT EDIT */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <input type="number" min={0} value={editVal}
                                                        onChange={e => setEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                        style={{
                                                            width: '72px', padding: '8px 10px', textAlign: 'center',
                                                            background: changed ? 'rgba(251,191,36,0.08)' : 'rgba(99,102,241,0.07)',
                                                            border: `1.5px solid ${changed ? 'rgba(251,191,36,0.55)' : rowHov ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.28)'}`,
                                                            borderRadius: '10px', color: T.textHi, fontSize: '13px', fontWeight: '800',
                                                            outline: 'none', fontFamily: 'ui-monospace, monospace', transition: 'all 0.2s',
                                                        }} />
                                                </div>

                                                {/* LEFT */}
                                                <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: '900', fontFamily: 'ui-monospace, monospace' }}>
                                                    {u.subscribed ? <span style={{ color: T.success }}>∞</span> : <Num value={u.left} color={u.left > 0 ? T.success : T.danger} />}
                                                </div>

                                                {/* SAVE */}
                                                <div style={{ textAlign: 'center' }}>
                                                    <motion.button onClick={() => saveLimit(u)} disabled={!changed || saving === u.id}
                                                        whileHover={changed ? { scale: 1.08, boxShadow: '0 6px 24px rgba(99,102,241,0.5)' } : {}}
                                                        whileTap={changed ? { scale: 0.9 } : {}}
                                                        style={{
                                                            padding: '8px 18px', borderRadius: '10px', border: 'none',
                                                            cursor: changed ? 'pointer' : 'default',
                                                            background: savedFlash === u.id ? 'rgba(52,211,153,0.15)' : changed ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.04)',
                                                            color: savedFlash === u.id ? T.success : changed ? '#fff' : '#3f475e',
                                                            fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px',
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                            boxShadow: changed ? '0 4px 18px rgba(99,102,241,0.35)' : 'none',
                                                        }}>
                                                        {saving === u.id ? '...' : savedFlash === u.id ? <>{Icon.check(T.success)} SAVED</> : 'SAVE'}
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                            </motion.div>

                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                                style={{ marginTop: '16px', fontSize: '10px', color: '#2a3348', letterSpacing: '1.5px', textAlign: 'center', fontWeight: '600' }}>
                                AUTO-REFRESH HAR {REFRESH_SECONDS}s · LIMIT SAVE KARTE HI USER PAR TURANT LAGU
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
