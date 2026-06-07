"use client"
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
        ]
    },
]

export default function Sidebar() {
    const path = usePathname()
    const router = useRouter()
    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserEmail(user.email || '')
        }
        getUser()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
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

            {/* USER */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: '600', marginBottom: '2px' }}>LOGGED IN</div>
                    <div style={{ fontSize: '11px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {userEmail || '...'}
                    </div>
                </div>
            </div>

            {/* NAV */}
            <nav style={{ flex: 1, padding: '16px 12px' }}>
                {NAV.map(group => (
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

            {/* LOGOUT */}
            <div style={{ padding: '12px', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
                <button onClick={handleLogout}
                    style={{
                        width: '100%', padding: '10px', borderRadius: '10px',
                        border: '1px solid rgba(239,68,68,0.2)',
                        background: 'rgba(239,68,68,0.06)',
                        color: '#f87171', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}>
                    🚪 Logout
                </button>
            </div>
        </div>
    )
}   