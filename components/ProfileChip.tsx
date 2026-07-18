"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { effectiveReportLimit } from '@/lib/adminConfig'

// Logged-in user ka chip — click karne par dropdown: kitni reports bachi + logout.
// `fixed` = screen ke top-right corner par float kare (app pages);
// warna jahan render ho wahi baithe (landing navbar).
export default function ProfileChip({ fixed = false }: { fixed?: boolean }) {
    const router = useRouter()
    const [email, setEmail] = useState<string | null>(null)
    const [name, setName] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [left, setLeft] = useState<number | null>(null)
    const [limit, setLimit] = useState(5)
    const [subscribed, setSubscribed] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const apply = (session: any) => {
            setEmail(session?.user?.email ?? null)
            setName(session?.user?.user_metadata?.username ?? null)
            if (!session) { setOpen(false); setLeft(null) }
        }
        supabase.auth.getSession().then(({ data: { session } }) => apply(session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => apply(session))
        return () => subscription.unsubscribe()
    }, [])

    // Bahar click par dropdown band
    useEffect(() => {
        if (!open) return
        const onDown = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [open])

    const toggle = async () => {
        const next = !open
        setOpen(next)
        if (next) {
            // Khulte waqt fresh limit + count lao
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const meta: any = user.app_metadata || {}
                const expires = meta.subscription_expires ? Date.parse(meta.subscription_expires) : null
                setSubscribed(meta.subscribed === true && (!expires || expires > Date.now()))
                const lim = effectiveReportLimit(meta)
                setLimit(lim)
                const { count } = await supabase.from('reports')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                setLeft(Math.max(0, lim - (count || 0)))
            } catch { }
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setOpen(false)
        router.push('/login')
    }

    if (!email) return null
    const displayName = name || email
    const initial = displayName.charAt(0).toUpperCase()

    return (
        <div ref={wrapRef} style={fixed ? { position: 'fixed', top: '12px', right: '20px', zIndex: 400 } : { position: 'relative', zIndex: 400 }}>
            {/* CHIP */}
            <motion.button onClick={toggle} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 14px 6px 6px', borderRadius: '100px', cursor: 'pointer',
                    background: 'rgba(8,8,22,0.92)', backdropFilter: 'blur(16px)',
                    border: `1px solid ${open ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.3)'}`,
                    boxShadow: open ? '0 8px 32px rgba(99,102,241,0.25)' : '0 4px 24px rgba(0,0,0,0.4)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '14px', fontWeight: '800',
                }}>{initial}</div>
                <div style={{ minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#e2e8f0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontSize: '8px', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>LOGGED IN</span>
                    </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </motion.button>

            {/* DROPDOWN */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.13 } }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        style={{
                            position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '250px',
                            background: 'rgba(8,8,22,0.98)', backdropFilter: 'blur(24px)',
                            border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px',
                            boxShadow: '0 24px 70px rgba(0,0,0,0.6)', overflow: 'hidden',
                        }}>
                        {/* user info */}
                        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                        </div>

                        {/* reports left */}
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
                            {subscribed ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <span style={{ fontSize: '15px' }}>⭐</span>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#34d399', letterSpacing: '0.5px' }}>PRO — UNLIMITED REPORTS</span>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', letterSpacing: '1.5px' }}>REPORTS BACHI HUI</span>
                                        <span style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'ui-monospace, monospace', color: left === null ? '#64748b' : left > 0 ? '#34d399' : '#f87171' }}>
                                            {left === null ? '...' : `${left} / ${limit}`}
                                        </span>
                                    </div>
                                    <div style={{ height: '5px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: left === null ? '0%' : `${(left / Math.max(1, limit)) * 100}%` }}
                                            transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                                            style={{ height: '100%', borderRadius: '5px', background: left !== null && left === 0 ? '#f87171' : 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* logout */}
                        <motion.button onClick={handleLogout} whileHover={{ backgroundColor: 'rgba(248,113,113,0.09)' }}
                            style={{
                                width: '100%', padding: '13px 18px', border: 'none', cursor: 'pointer',
                                background: 'transparent', color: '#f87171', fontSize: '12px', fontWeight: '800',
                                display: 'flex', alignItems: 'center', gap: '9px', letterSpacing: '0.5px',
                            }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            LOGOUT
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
