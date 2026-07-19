"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const VERDICT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  'CLEAR': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✓', label: 'CLEAR' },
  'NOT CLEAR': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '✗', label: 'NOT CLEAR' },
  'CLEAR SUBJECT TO': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '◎', label: 'SUBJECT TO' },
  'PENDING': { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '~', label: 'PENDING' },
}

const CASE_ICONS: Record<string, string> = {
  builder_purchase: '🏗️', resale: '🔑', bt: '🔄', seller_bt: '💼', lap: '🏦',
}
const CASE_LABELS: Record<string, string> = {
  builder_purchase: 'Builder Purchase', resale: 'Resale',
  bt: 'Balance Transfer', seller_bt: 'Seller BT', lap: 'LAP / Mortgage',
}

interface Report {
  id: string; created_at: string; case_type: string
  applicant_name: string; bank_name: string; property_address: string
  app_id: string; verdict: string; report_html?: string
}

function ReportCard({ report, onView }: { report: Report; onView: (r: Report) => void }) {
  const [hov, setHov] = useState(false)
  const v = VERDICT_CONFIG[report.verdict] || VERDICT_CONFIG['PENDING']
  const d = new Date(report.created_at)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onView(report)}
      style={{
        borderRadius: '16px', padding: '22px 26px', cursor: 'pointer',
        background: hov ? 'rgba(12,12,30,0.99)' : 'rgba(8,8,20,0.95)',
        borderLeft: `4px solid ${v.color}`,
        borderTop: `1px solid rgba(255,255,255,${hov ? '0.07' : '0.03'})`,
        borderRight: `1px solid rgba(255,255,255,${hov ? '0.07' : '0.03'})`,
        borderBottom: `1px solid rgba(255,255,255,${hov ? '0.07' : '0.03'})`,
        transform: hov ? 'translateX(6px)' : 'none',
        boxShadow: hov ? `0 12px 48px ${v.color}18` : 'none',
        transition: 'all 0.2s ease',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '28px', flexShrink: 0 }}>{CASE_ICONS[report.case_type] || '📄'}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f1f5f9', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {report.applicant_name || 'Unknown'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              {CASE_LABELS[report.case_type] || report.case_type} &nbsp;·&nbsp; {report.bank_name}
            </div>
          </div>
        </div>
        <div style={{ padding: '4px 14px', borderRadius: '100px', background: v.bg, border: `1px solid ${v.color}40`, display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <span style={{ color: v.color, fontWeight: '900', fontSize: '12px' }}>{v.icon}</span>
          <span style={{ color: v.color, fontSize: '9px', fontWeight: '800', letterSpacing: '1px' }}>{v.label}</span>
        </div>
      </div>
      <div style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '7px 12px', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        📍 {report.property_address || 'Not specified'}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#334155' }}>
          {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &nbsp;·&nbsp; {report.app_id}
        </span>
        <span style={{ fontSize: '10px', fontWeight: '700', color: hov ? v.color : '#1e293b', transition: 'color 0.2s' }}>
          {hov ? 'OPEN REPORT →' : ''}
        </span>
      </div>
    </div>
  )
}

function StatBox({ n, label, color, icon }: { n: number | string; label: string; color: string; icon: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '24px 16px', borderTop: `2px solid ${color}`, background: 'rgba(6,6,18,0.9)', borderRadius: '14px', border: `1px solid ${color}20`, borderTopWidth: '2px', borderTopColor: color }}>
      <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: '900', color, fontFamily: 'monospace' }}>{n}</div>
      <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginTop: '6px', fontWeight: '700' }}>{label}</div>
    </div>
  )
}

export default function ReportsPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewer, setViewer] = useState<Report | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) setReports(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const x = c.getContext('2d'); if (!x) return
    c.width = window.innerWidth; c.height = window.innerHeight
    const ch = 'TITLEMATRIXAILEGAL712EC'.split('')
    const fs = 13; const cols = Math.floor(c.width / fs)
    const d: number[] = Array(cols).fill(1)
    const sp: number[] = Array(cols).fill(0).map(() => Math.random() * 0.3 + 0.1)
    const draw = () => {
      x.fillStyle = 'rgba(2,2,8,0.05)'; x.fillRect(0, 0, c.width, c.height)
      for (let i = 0; i < d.length; i++) {
        x.fillStyle = `rgba(99,102,241,${Math.random() * 0.15 + 0.04})`
        x.font = `bold ${fs}px monospace`
        x.fillText(ch[Math.floor(Math.random() * ch.length)], i * fs, d[i] * fs)
        if (d[i] * fs > c.height && Math.random() > 0.975) d[i] = 0
        d[i] += sp[i]
      }
    }
    const iv = setInterval(draw, 50)
    return () => clearInterval(iv)
  }, [])

  const filtered = filter === 'all' ? reports : reports.filter(r => r.case_type === filter)
  const usedTypes = [...new Set(reports.map(r => r.case_type))]

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: '100px', cursor: 'pointer', fontSize: '11px',
    fontWeight: '700', letterSpacing: '1px', transition: 'all 0.2s',
    background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
    border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.05)',
    color: active ? '#a5b4fc' : '#475569',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative' }}>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ring1 { 0%,100%{transform:scale(1);opacity:.8} 50%{transform:scale(1.1);opacity:.3} }
        @keyframes ring2 { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.12);opacity:.15} }
        @keyframes ring3 { 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.14);opacity:.08} }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.3, pointerEvents: 'none' }} />
      <Sidebar />

      {/* VIEWER */}
      {viewer?.report_html && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', background: '#06060f', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{viewer.applicant_name}</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>{viewer.app_id}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(viewer.report_html!); w.document.close(); setTimeout(() => w.print(), 800) } }}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                PDF DOWNLOAD
              </button>
              <button onClick={() => setViewer(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}>
                CLOSE
              </button>
            </div>
          </div>
          <div style={{ flex: 1, background: '#fff' }}>
            <iframe srcDoc={viewer.report_html} style={{ width: '100%', height: '100%', border: 'none' }} title="Report" />
          </div>
        </div>
      )}

      <div className="pg-main" style={{ flex: 1, marginLeft: '225px', overflow: 'auto', position: 'relative', zIndex: 10 }}>
        {/* HEADER */}
        <div className="m-padr m-pad" style={{ padding: '18px 260px 18px 32px', borderBottom: '1px solid rgba(99,102,241,0.15)', background: 'rgba(2,2,8,0.95)', backdropFilter: 'blur(30px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Case <span style={{ color: '#6366f1' }}>Archive</span></div>
            <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', fontWeight: '600', marginTop: '2px' }}>TITLEMATRIXAI — LEGAL SCRUTINY REPORTS</div>
          </div>
          <button onClick={() => router.push('/upload')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '12px', fontWeight: '800', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            + NEW REPORT
          </button>
        </div>

        <div style={{ padding: '36px 32px' }}>

          {/* LOADING */}
          {loading && (
            <div style={{ textAlign: 'center', paddingTop: '100px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.15)', borderTop: '3px solid #6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '3px' }}>LOADING...</div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && reports.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: '60px', animation: 'fadeSlide 0.5s ease' }}>

              {/* FLOATING ICON WITH RINGS */}
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '64px' }}>
                <div style={{ position: 'absolute', inset: '-28px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.2)', animation: 'ring1 3s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', inset: '-56px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.1)', animation: 'ring2 3s ease-in-out infinite 0.5s' }} />
                <div style={{ position: 'absolute', inset: '-84px', borderRadius: '50%', border: '1px solid rgba(99,102,241,0.05)', animation: 'ring3 3s ease-in-out infinite 1s' }} />
                <div style={{
                  width: '96px', height: '96px', borderRadius: '50%', position: 'relative', zIndex: 1,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(99,102,241,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                  animation: 'float 4s ease-in-out infinite',
                  boxShadow: '0 0 60px rgba(99,102,241,0.15)',
                }}>⚖️</div>
              </div>

              <div style={{ fontSize: '11px', color: '#6366f1', letterSpacing: '4px', fontWeight: '700', marginBottom: '18px' }}>NO CASES ON FILE</div>

              <div style={{
                fontSize: '44px', fontWeight: '900', lineHeight: 1.1, marginBottom: '16px',
                background: 'linear-gradient(135deg, #ffffff, #94a3b8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Your Archive<br />Awaits
              </div>

              <div style={{ fontSize: '14px', color: '#475569', maxWidth: '380px', margin: '0 auto 48px', lineHeight: 1.8 }}>
                Pehla legal scrutiny report generate karo — sab kuch yahin save hoga
              </div>

              <button onClick={() => router.push('/upload')} style={{
                padding: '18px 48px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px',
                boxShadow: '0 16px 48px rgba(99,102,241,0.5)',
              }}>
                ⚡ GENERATE FIRST REPORT
              </button>

              <div style={{ marginTop: '20px', fontSize: '10px', color: '#1e293b', letterSpacing: '2px' }}>
                5 CASE TYPES · 2 AI MODELS · GUJARAT LAW
              </div>
            </div>
          )}

          {/* REPORTS */}
          {!loading && reports.length > 0 && (
            <div style={{ animation: 'fadeSlide 0.4s ease' }}>

              {/* STATS */}
              <div className="m-statrow" style={{ display: 'flex', gap: '14px', marginBottom: '32px' }}>
                <StatBox n={reports.length} label="TOTAL" color="#6366f1" icon="📁" />
                <StatBox n={reports.filter(r => r.verdict === 'CLEAR').length} label="CLEAR" color="#10b981" icon="✓" />
                <StatBox n={reports.filter(r => r.verdict === 'CLEAR SUBJECT TO').length} label="SUBJECT TO" color="#f59e0b" icon="◎" />
                <StatBox n={reports.filter(r => r.verdict === 'NOT CLEAR').length} label="NOT CLEAR" color="#ef4444" icon="✗" />
              </div>

              {/* FILTER */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button style={tabStyle(filter === 'all')} onClick={() => setFilter('all')}>ALL ({reports.length})</button>
                {usedTypes.map(t => (
                  <button key={t} style={tabStyle(filter === t)} onClick={() => setFilter(t)}>
                    {CASE_ICONS[t]} {CASE_LABELS[t]} ({reports.filter(r => r.case_type === t).length})
                  </button>
                ))}
              </div>

              {/* LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map((r, i) => <ReportCard key={r.id} report={r} onView={setViewer} />)}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155' }}>Koi report nahi mili</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}