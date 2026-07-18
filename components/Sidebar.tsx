"use client"
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/adminConfig'

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
    const [isAdmin, setIsAdmin] = useState(false)

    // Admin ko hi Admin Panel link dikhta hai (asli security server-side hai)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && isAdminEmail(session.user.email)) setIsAdmin(true)
        })
    }, [])

    const navGroups = isAdmin
        ? [...NAV, { group: 'ADMIN', items: [{ path: '/admin', label: 'Admin Panel', icon: '🛠️' }] }]
        : NAV

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

            {/* HOME */}
            <div style={{ padding: '12px', borderTop: '1px solid rgba(99,102,241,0.1)' }}>
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
    )
}   