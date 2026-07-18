"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
    const router = useRouter()

    // Pehle se logged in ho toh seedha report tool par
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) router.replace('/upload')
        })
    }, [router])

    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSignup = async () => {
        if (!username.trim() || !email || !password) { setError('Sab fields bharo — username bhi zaroori hai'); return }
        if (!/^[a-zA-Z0-9._ ]{3,24}$/.test(username.trim())) { setError('Username 3-24 characters ka ho (letters, numbers, . _ allowed)'); return }
        if (password !== confirm) { setError('Password match nahi karta'); return }
        if (password.length < 6) { setError('Password kam se kam 6 characters ka hona chahiye'); return }
        setLoading(true)
        setError('')

        // Server-side admin create (email_confirm) — Supabase ka "Confirm email"
        // ON hai, direct signUp() user ko confirmation mail par atka deta hai.
        try {
            const res = await fetch('/api/auth-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username: username.trim() }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || 'Signup failed')

            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
            if (signInError) throw new Error(signInError.message)

            setSuccess(true)
            setTimeout(() => router.push('/upload'), 1200)
        } catch (e: any) {
            setError(e.message || 'Signup failed')
            setLoading(false)
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
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>
                        TITLEMATRIX<span style={{ color: '#6366f1' }}>AI</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>Property Legal Intelligence</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>Create Account</h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px' }}>TITLEMATRIXAI pe join karo</p>
                    <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', margin: '0 0 28px' }}>🎁 Sign up karte hi 5 FREE reports milengi</p>

                    {success ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                            <div style={{ color: '#10b981', fontWeight: '700' }}>Account created!</div>
                            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '8px' }}>Login page pe ja raha hun...</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>USERNAME <span style={{ color: '#f87171' }}>*</span></label>
                                <input type="text" placeholder="Aapka naam / username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>EMAIL</label>
                                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>PASSWORD</label>
                                <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>CONFIRM PASSWORD</label>
                                <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} />
                            </div>
                            {error && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                                    ❌ {error}
                                </div>
                            )}
                            <button onClick={handleSignup} disabled={loading}
                                style={{ width: '100%', padding: '14px', background: loading ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
                                {loading ? 'Creating...' : 'Create Account →'}
                            </button>
                            <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                                Already account hai?{' '}
                                <span onClick={() => router.push('/login')} style={{ color: '#6366f1', fontWeight: '600', cursor: 'pointer' }}>Login Karo</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
