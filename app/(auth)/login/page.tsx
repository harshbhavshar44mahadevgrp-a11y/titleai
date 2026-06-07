"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async () => {
        if (!email || !password) { setError('Email aur Password dono bharo'); return }
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError('Email ya Password galat hai')
            setLoading(false)
        } else {
            router.push('/upload')
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '13px 16px', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none',
        fontFamily: 'sans-serif',
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif',
        }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>
                        Title<span style={{ color: '#6366f1' }}>AI</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>
                        Property Legal Intelligence
                    </div>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', padding: '32px',
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>
                        Welcome Back
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 28px' }}>
                        Login karke reports generate karo
                    </p>

                    {/* Email */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                            EMAIL
                        </label>
                        <input
                            type="email" placeholder="your@email.com"
                            value={email} onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            style={inputStyle}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                            PASSWORD
                        </label>
                        <input
                            type="password" placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            style={inputStyle}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '8px', padding: '10px 14px',
                            color: '#f87171', fontSize: '13px', marginBottom: '16px',
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button onClick={handleLogin} disabled={loading}
                        style={{
                            width: '100%', padding: '14px',
                            background: loading ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', border: 'none', borderRadius: '12px',
                            fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                            marginBottom: '20px',
                        }}>
                        {loading ? 'Logging in...' : 'Login →'}
                    </button>

                    {/* Sign Up Link */}
                    <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                        Account nahi hai?{' '}
                        <span
                            onClick={() => router.push('/signup')}
                            style={{ color: '#6366f1', fontWeight: '600', cursor: 'pointer' }}>
                            Sign Up Karo
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}