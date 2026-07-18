"use client"
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
    {
        group: 'DOCUMENTS',
        items: [
            { path: '/upload', label: 'Upload Docs', icon: '📤' },
            { path: '/reports', label: 'My Reports', icon: '📄' },
        ]
    },
    {
        group: 'WORKSPACE',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: '📊' },
            { path: '/payments', label: 'Payments', icon: '💳' },
            { path: '/feedback', label: 'Feedback', icon: '💬' },
            { path: '/profile', label: 'Profile', icon: '👤' },
            { path: '/login', label: 'Login', icon: '🔐' },
        ]
    },
]

export default function Sidebar() {
    const path = usePathname()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)

    // Login/logout hote hi sidebar turant update ho
    useEffect(() => {
        const apply = (session: any) => {
            setUserEmail(session?.user?.email ?? null)
            setUserName(session?.user?.user_metadata?.username ?? null)
        }
        supabase.auth.getSession().then(({ data: { session } }) => apply(session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => apply(session))
        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Logged in ho toh Login item chhupa do
    const navGroups = NAV.map(g => ({
        ...g,
        items: g.items.filter(item => !(item.path === '/login' && userEmail)),
    }))

    const displayName = userName || userEmail
    const initial = (displayName || '?').charAt(0).toUpperCase()

    return (
        <>
            {/* TOP-RIGHT PROFILE CHIP — har page par (admin panel chhod ke) */}
            {userEmail && path !== '/admin' && path !== '/dashboard' && (
                <div style={{
                    position: 'fixed', top: '12px', right: '20px', zIndex: 400,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 14px 6px 6px', borderRadius: '100px',
                    background: 'rgba(8,8,22,0.92)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '14px', fontWeight: '800',
                    }}>{initial}</div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#e2e8f0', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                            <span style={{ fontSize: '8px', color: userName ? '#64748b' : '#10b981', fontWeight: '700', letterSpacing: '0.5px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {userName ? userEmail : 'LOGGED IN'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                width: '220px', minHeight: '100vh',
                background: '#0a0a0f',
                borderRight: '1px solid rgba(99,102,241,0.15)',
                display: 'flex', flexDirection: 'column',
                fontFamily: 'sans-serif', position: 'fixed',
                left: 0, top: 0, bottom: 0, zIndex: 50,
            }}>

                {/* LOGO */}
                <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>
                        TITLEMATRIX<span style={{ color: '#6366f1' }}>.AI</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '600', letterSpacing: '1px' }}>SYSTEM ONLINE</span>
                    </div>
                </div>

                {/* NAV */}
                <nav style={{ flex: 1, padding: '16px 12px' }}>
                    {navGroups.map(group => (
                        <div key={group.group} style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '8px' }}>
                                {group.group}
                            </div>
                            {group.items.map(item => {
                                const active = path === item.path
                                return (
                                    <button key={item.path} onClick={() => router.push(item.path)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center',
                                            gap: '10px', padding: '10px 12px', marginBottom: '2px',
                                            borderRadius: '10px', border: 'none', cursor: 'pointer',
                                            background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                                            borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
                                            color: active ? '#a5b4fc' : '#94a3b8',
                                            fontSize: '13px', fontWeight: active ? '600' : '400',
                                            textAlign: 'left',
                                        }}>
                                        <span style={{ fontSize: '15px' }}>{item.icon}</span>
                                        <span>{item.label}</span>
                                        {active && <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />}
                                    </button>
                                )
                            })}
                        </div>
                    ))}
                </nav>

                {/* LOGOUT + HOME */}
                <div style={{ padding: '12px', borderTop: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userEmail && (
                        <button onClick={handleLogout}
                            style={{
                                width: '100%', padding: '10px', borderRadius: '10px',
                                border: '1px solid rgba(239,68,68,0.25)',
                                background: 'rgba(239,68,68,0.06)',
                                color: '#f87171', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Logout
                        </button>
                    )}
                    <button onClick={() => router.push('/')}
                        style={{
                            width: '100%', padding: '10px', borderRadius: '10px',
                            border: '1px solid rgba(99,102,241,0.2)',
                            background: 'rgba(99,102,241,0.06)',
                            color: '#a5b4fc', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                        }}>
                        🏠 Home
                    </button>
                </div>
            </div>
        </>
    )
}
