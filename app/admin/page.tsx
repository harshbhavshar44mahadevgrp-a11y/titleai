"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

interface AdminUser {
    id: string; email: string; created_at: string; last_sign_in_at: string | null
    used: number; limit: number; left: number; subscribed: boolean
}

const REFRESH_SECONDS = 10

function StatBox({ n, label, color, icon }: { n: number | string; label: string; color: string; icon: string }) {
    return (
        <div style={{ flex: 1, textAlign: 'center', padding: '20px 14px', background: 'rgba(6,6,18,0.9)', borderRadius: '14px', border: `1px solid ${color}25`, borderTop: `2px solid ${color}` }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color, fontFamily: 'monospace' }}>{n}</div>
            <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginTop: '4px', fontWeight: '700' }}>{label}</div>
        </div>
    )
}

export default function AdminPage() {
    const router = useRouter()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [totalReports, setTotalReports] = useState(0)
    const [loading, setLoading] = useState(true)
    const [denied, setDenied] = useState(false)
    const [search, setSearch] = useState('')
    const [edits, setEdits] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState<string | null>(null)
    const [savedFlash, setSavedFlash] = useState<string | null>(null)
    const [lastSync, setLastSync] = useState<Date | null>(null)
    const tokenRef = useRef<string | null>(null)

    const load = useCallback(async (silent = false) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.replace('/login'); return }
        tokenRef.current = session.access_token
        try {
            const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${session.access_token}` } })
            if (res.status === 403) { setDenied(true); setLoading(false); return }
            if (res.status === 401) { router.replace('/login'); return }
            const data = await res.json()
            if (data.success) {
                setUsers(data.users)
                setTotalReports(data.totalReports)
                setLastSync(new Date())
            }
        } catch { /* network blip — agla refresh sambhal lega */ }
        if (!silent) setLoading(false)
    }, [router])

    // Pehli load + live auto-refresh
    useEffect(() => {
        load()
        const iv = setInterval(() => load(true), REFRESH_SECONDS * 1000)
        return () => clearInterval(iv)
    }, [load])

    const saveLimit = async (u: AdminUser) => {
        const raw = edits[u.id]
        const n = parseInt(raw, 10)
        if (!Number.isFinite(n) || n < 0) return
        setSaving(u.id)
        try {
            const res = await fetch('/api/admin/set-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
                body: JSON.stringify({ userId: u.id, limit: n }),
            })
            const data = await res.json()
            if (data.success) {
                setUsers(prev => prev.map(x => x.id === u.id ? { ...x, limit: n, left: Math.max(0, n - x.used) } : x))
                setEdits(prev => { const p = { ...prev }; delete p[u.id]; return p })
                setSavedFlash(u.id)
                setTimeout(() => setSavedFlash(null), 1500)
            }
        } catch { }
        setSaving(null)
    }

    const filtered = users.filter(u => !search || (u.email || '').toLowerCase().includes(search.toLowerCase()))
    const today = new Date().toISOString().split('T')[0]
    const activeToday = users.filter(u => u.last_sign_in_at?.startsWith(today)).length

    if (denied) {
        return (
            <div style={{ minHeight: '100vh', background: '#020208', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>Admin Access Only</div>
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '24px' }}>Ye panel sirf admin ke liye hai</div>
                    <button onClick={() => router.push('/upload')} style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '13px', fontWeight: '700' }}>← Report Tool</button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
                @keyframes spin { to { transform: rotate(360deg) } }
            `}</style>
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '225px', overflow: 'auto' }}>

                {/* HEADER */}
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.15)', background: 'rgba(2,2,8,0.95)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Admin <span style={{ color: '#6366f1' }}>Panel</span></div>
                        <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', fontWeight: '600', marginTop: '2px' }}>USERS · REPORTS · ACCESS CONTROL</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', letterSpacing: '1px' }}>
                                LIVE{lastSync ? ` · ${lastSync.toLocaleTimeString('en-IN')}` : ''}
                            </span>
                        </div>
                        <button onClick={() => load(true)} style={{ padding: '8px 18px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>↻ REFRESH</button>
                    </div>
                </div>

                <div style={{ padding: '28px 32px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', paddingTop: '100px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.15)', borderTop: '3px solid #6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                            <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '3px' }}>LOADING...</div>
                        </div>
                    ) : (
                        <>
                            {/* STATS */}
                            <div style={{ display: 'flex', gap: '14px', marginBottom: '28px' }}>
                                <StatBox n={users.length} label="TOTAL USERS" color="#6366f1" icon="👥" />
                                <StatBox n={totalReports} label="TOTAL REPORTS" color="#f59e0b" icon="📋" />
                                <StatBox n={activeToday} label="ACTIVE TODAY" color="#10b981" icon="🟢" />
                                <StatBox n={users.filter(u => u.left === 0 && !u.subscribed).length} label="LIMIT KHATAM" color="#ef4444" icon="🔒" />
                            </div>

                            {/* SEARCH */}
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Email se search karo..."
                                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 18px', marginBottom: '18px', background: 'rgba(6,6,20,0.95)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }} />

                            {/* TABLE */}
                            <div style={{ background: 'rgba(6,6,18,0.9)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', overflow: 'hidden' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 0.7fr 1.2fr 0.7fr 1fr', gap: '8px', padding: '14px 20px', borderBottom: '1px solid rgba(99,102,241,0.15)', fontSize: '9px', fontWeight: '800', color: '#475569', letterSpacing: '1.5px' }}>
                                    <div>EMAIL</div><div>JOINED</div><div>LAST LOGIN</div>
                                    <div style={{ textAlign: 'center' }}>USED</div>
                                    <div style={{ textAlign: 'center' }}>LIMIT (EDIT)</div>
                                    <div style={{ textAlign: 'center' }}>LEFT</div>
                                    <div style={{ textAlign: 'center' }}>ACTION</div>
                                </div>
                                {filtered.length === 0 && (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#334155', fontSize: '13px' }}>Koi user nahi mila</div>
                                )}
                                {filtered.map(u => {
                                    const editVal = edits[u.id] ?? String(u.limit)
                                    const changed = edits[u.id] !== undefined && edits[u.id] !== String(u.limit)
                                    return (
                                        <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 0.7fr 1.2fr 0.7fr 1fr', gap: '8px', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', background: savedFlash === u.id ? 'rgba(16,185,129,0.07)' : 'transparent', transition: 'background 0.4s' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                                                {u.subscribed && <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '800', letterSpacing: '1px' }}>⭐ SUBSCRIBED (UNLIMITED)</span>}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                            <div style={{ fontSize: '11px', color: '#475569' }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                                            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#f59e0b', fontFamily: 'monospace' }}>{u.used}</div>
                                            <div style={{ textAlign: 'center' }}>
                                                <input type="number" min={0} value={editVal}
                                                    onChange={e => setEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                    style={{ width: '70px', padding: '7px 10px', textAlign: 'center', background: 'rgba(99,102,241,0.08)', border: `1px solid ${changed ? '#f59e0b' : 'rgba(99,102,241,0.3)'}`, borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '800', outline: 'none', fontFamily: 'monospace' }} />
                                            </div>
                                            <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '800', fontFamily: 'monospace', color: u.left > 0 || u.subscribed ? '#10b981' : '#ef4444' }}>
                                                {u.subscribed ? '∞' : u.left}
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <button onClick={() => saveLimit(u)} disabled={!changed || saving === u.id}
                                                    style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: changed ? 'pointer' : 'default', background: changed ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.04)', color: changed ? '#fff' : '#334155', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    {saving === u.id ? '...' : savedFlash === u.id ? '✓ SAVED' : 'SAVE'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div style={{ marginTop: '14px', fontSize: '10px', color: '#1e293b', letterSpacing: '1px', textAlign: 'center' }}>
                                AUTO-REFRESH HAR {REFRESH_SECONDS} SECOND · LIMIT BADALTE HI USER PAR TURANT LAGU HO JATA HAI
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
