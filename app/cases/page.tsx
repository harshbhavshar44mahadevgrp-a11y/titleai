"use client"
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function Cases() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCase, setShowNewCase] = useState(false)
  const [newCase, setNewCase] = useState({ title: '', location: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const words = ['TITLEMATRIX.AI', 'CASES', 'LEGAL', 'PROPERTY', 'DEED', 'TITLE', 'SURVEY', 'RISK', 'ADVOCATE']
    const fontSize = 13
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)
    const draw = () => {
      ctx.fillStyle = 'rgba(2,2,8,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(99,102,241,0.35)'
      ctx.font = `${fontSize}px monospace`
      drops.forEach((y, i) => {
        const word = words[Math.floor(Math.random() * words.length)]
        const char = word[Math.floor(Math.random() * word.length)]
        ctx.fillText(char, i * fontSize, y * fontSize)
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }
    const interval = setInterval(draw, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setCases(data)
    setLoading(false)
  }

  const createCase = async () => {
    if (!newCase.title) return
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('cases').insert({
      title: newCase.title,
      location: newCase.location,
      user_id: user?.id,
      status: 'active',
      risk_level: 'pending',
      completion: 0
    })
    if (!error) {
      setShowNewCase(false)
      setNewCase({ title: '', location: '' })
      fetchCases()
    }
    setCreating(false)
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return '#ef4444'
    if (risk === 'medium') return '#f59e0b'
    if (risk === 'low') return '#10b981'
    return '#6366f1'
  }

  return (
    <div style={{ background: '#020208', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.6, pointerEvents: 'none' }} />
      <Sidebar />
      <div className="pg-main" style={{ flex: 1, marginLeft: '225px', position: 'relative', zIndex: 1 }}>

        {/* Topbar */}
        <div className="m-padr m-pad" style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '0 260px 0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(20px)' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>Cases <span style={{ color: '#6366f1' }}>Management</span></div>
            <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>ALL PROPERTY CASES</div>
          </div>
          <button onClick={() => setShowNewCase(true)} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
            + NEW CASE
          </button>
        </div>

        <div style={{ padding: '32px' }}>

          {/* New Case Modal */}
          {showNewCase && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#0d0d1a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '32px', width: '480px', boxShadow: '0 0 60px rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '24px' }}>New Case</div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>PROPERTY TITLE / CASE NAME *</div>
                  <input
                    value={newCase.title}
                    onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="e.g. Patel Residence Navrangpura"
                    style={{ width: '100%', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>LOCATION</div>
                  <input
                    value={newCase.location}
                    onChange={e => setNewCase({ ...newCase, location: e.target.value })}
                    placeholder="e.g. Ahmedabad, Gujarat"
                    style={{ width: '100%', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowNewCase(false)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '12px', color: '#6b7280', fontSize: '14px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={createCase} disabled={creating} style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
                    {creating ? 'Creating...' : 'Create Case'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="m-grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'TOTAL CASES', value: cases.length, color: '#6366f1' },
              { label: 'ACTIVE', value: cases.filter(c => c.status === 'active').length, color: '#10b981' },
              { label: 'HIGH RISK', value: cases.filter(c => c.risk_level === 'high').length, color: '#ef4444' },
              { label: 'COMPLETED', value: cases.filter(c => c.status === 'completed').length, color: '#8b5cf6' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(10,10,20,0.8)', border: `1px solid ${stat.color}30`, borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '8px' }}>{stat.label}</div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Cases List */}
          <div style={{ background: 'rgba(10,10,20,0.8)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }}></div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>ALL CASES</div>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#4b5563' }}>Loading cases...</div>
            ) : cases.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📁</div>
                <div style={{ color: '#4b5563', marginBottom: '8px' }}>No cases yet</div>
                <div style={{ fontSize: '13px', color: '#374151' }}>Click "+ NEW CASE" to create your first case</div>
              </div>
            ) : (
              cases.map((c, i) => (
                <div key={c.id} onClick={() => router.push(`/cases/${c.id}`)} style={{ padding: '20px 24px', borderBottom: i < cases.length - 1 ? '1px solid rgba(99,102,241,0.08)' : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{c.title}</div>
                      <div style={{ fontSize: '12px', color: '#4b5563' }}>{c.location || 'No location'} · {new Date(c.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: getRiskColor(c.risk_level), background: `${getRiskColor(c.risk_level)}15`, border: `1px solid ${getRiskColor(c.risk_level)}30`, borderRadius: '6px', padding: '4px 10px' }}>
                        {c.risk_level?.toUpperCase() || 'PENDING'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6366f1' }}>→</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.completion || 0}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>{c.completion || 0}% COMPLETE</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
