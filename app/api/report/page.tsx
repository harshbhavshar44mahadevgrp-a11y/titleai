"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

const VERDICT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  'CLEAR': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✓', label: 'CLEAR' },
  'NOT CLEAR': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '✗', label: 'NOT CLEAR' },
  'CLEAR SUBJECT TO': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '◎', label: 'SUBJECT TO' },
  'PENDING': { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: '...', label: 'PENDING' },
}

const CASE_ICONS: Record<string, string> = {
  'builder_purchase': '🏗️',
  'resale': '🔑',
  'bt': '🔄',
  'seller_bt': '💼',
  'lap': '🏦',
}

const CASE_LABELS: Record<string, string> = {
  'builder_purchase': 'Builder Purchase',
  'resale': 'Resale',
  'bt': 'Balance Transfer',
  'seller_bt': 'Seller BT',
  'lap': 'LAP / Mortgage',
}

interface Report {
  id: string
  created_at: string
  case_type: string
  applicant_name: string
  bank_name: string
  property_address: string
  app_id: string
  verdict: string
  report_html?: string
}

// ================================================================
// REPORT CARD
// ================================================================
function ReportCard({ report, index, onView }: { report: Report; index: number; onView: (r: Report) => void }) {
  const [hovered, setHovered] = useState(false)
  const verdict = VERDICT_CONFIG[report.verdict] || VERDICT_CONFIG['PENDING']
  const caseIcon = CASE_ICONS[report.case_type] || '📄'
  const caseLabel = CASE_LABELS[report.case_type] || report.case_type
  const date = new Date(report.created_at)
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(report)}
      style={{
        position: 'relative',
        background: hovered ? 'rgba(10,10,25,0.98)' : 'rgba(6,6,18,0.95)',
        borderRadius: '16px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        borderLeft: hovered ? `3px solid ${verdict.color}` : `3px solid ${verdict.color}60`,
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        boxShadow: hovered ? `0 8px 40px ${verdict.color}15` : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
            background: `${verdict.color}15`,
            border: `1px solid ${verdict.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>{caseIcon}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#e2e8f0', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {report.applicant_name || 'Unknown Applicant'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              {caseLabel} · {report.bank_name || 'Unknown Bank'}
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '100px',
          background: verdict.bg,
          border: `1px solid ${verdict.color}40`,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '11px', fontWeight: '900', color: verdict.color }}>{verdict.icon}</span>
          <span style={{ fontSize: '9px', fontWeight: '800', color: verdict.color, letterSpacing: '1px' }}>{verdict.label}</span>
        </div>
      </div>

      <div style={{
        fontSize: '11px', color: '#334155',
        padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
        marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        📍 {report.property_address || 'Property details not available'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '10px', color: '#334155' }}>🗓 {dateStr}</span>
          <span style={{ fontSize: '10px', color: '#334155' }}>⏰ {timeStr}</span>
          <span style={{ fontSize: '10px', color: '#334155', fontFamily: 'monospace' }}>ID: {report.app_id}</span>
        </div>
        <div style={{ fontSize: '10px', color: hovered ? verdict.color : '#334155', fontWeight: '700', letterSpacing: '1px', transition: 'color 0.2s' }}>
          VIEW REPORT {hovered ? '→' : ''}
        </div>
      </div>
    </div>
  )
}

// ================================================================
// STAT CARD
// ================================================================
function StatCard({ value, label, color, icon }: { value: number | string; label: string; color: string; icon: string }) {
  return (
    <div style={{
      flex: 1, padding: '20px 24px',
      background: 'rgba(6,6,18,0.9)',
      border: `1px solid ${color}25`,
      borderTop: `2px solid ${color}`,
      borderRadius: '14px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '900', color, fontFamily: 'monospace', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginTop: '6px', fontWeight: '700' }}>{label}</div>
    </div>
  )
}

// ================================================================
// EMPTY STATE
// ================================================================
function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 32px' }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '60px' }}>
        <div style={{
          position: 'absolute', inset: '-30px', borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.15)',
          animation: 'pulseRing 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '-60px', borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.08)',
          animation: 'pulseRing 3s ease-in-out infinite 0.6s',
        }} />
        <div style={{
          position: 'absolute', inset: '-90px', borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.04)',
          animation: 'pulseRing 3s ease-in-out infinite 1.2s',
        }} />
        <div style={{
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '44px', position: 'relative', zIndex: 1,
        }}>📂</div>
      </div>

      <div style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '4px', fontWeight: '700', marginBottom: '16px' }}>
        ARCHIVE EMPTY
      </div>
      <div style={{
        fontSize: '36px', fontWeight: '900', marginBottom: '12px',
        background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        No Case Files Yet
      </div>
      <div style={{ fontSize: '14px', color: '#475569', maxWidth: '400px', margin: '0 auto 40px', lineHeight: '1.8' }}>
        Pehla legal scrutiny report generate karo — phir sab yahin milega
      </div>
      <button onClick={onGenerate} style={{
        padding: '16px 40px', borderRadius: '14px', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff', fontSize: '14px', fontWeight: '800', letterSpacing: '1px',
        boxShadow: '0 12px 40px rgba(99,102,241,0.4)',
      }}>
        GENERATE FIRST REPORT →
      </button>
    </div>
  )
}

// ================================================================
// MAIN PAGE
// ================================================================
export default function ReportsPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewingReport, setViewingReport] = useState<Report | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error && data) setReports(data)
      setLoading(false)
    }
    fetchReports()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const chars = ['T', 'M', 'A', 'I', 'L', 'E', 'G', 'L', '7', '1', '2']
    const fontSize = 13; const cols = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(cols).fill(1)
    const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.3 + 0.1)
    const draw = () => {
      ctx.fillStyle = 'rgba(2,2,8,0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < drops.length; i++) {
        ctx.fillStyle = 'rgba(99,102,241,' + (Math.random() * 0.2 + 0.05) + ')'
        ctx.font = 'bold ' + fontSize + 'px monospace'
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i] += speeds[i]
      }
    }
    const interval = setInterval(draw, 50)
    return () => clearInterval(interval)
  }, [])

  const total = reports.length
  const clearCount = reports.filter(r => r.verdict === 'CLEAR').length
  const notClearCount = reports.filter(r => r.verdict === 'NOT CLEAR').length
  const subjectToCount = reports.filter(r => r.verdict === 'CLEAR SUBJECT TO').length
  const filtered = filter === 'all' ? reports : reports.filter(r => r.case_type === filter)
  const usedCaseTypes = [...new Set(reports.map(r => r.case_type))]

  const handleView = (report: Report) => {
    if (report.report_html) {
      setViewingReport(report)
    }
  }

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: '100px',
    cursor: 'pointer',
    background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
    border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.05)',
    color: active ? '#a5b4fc' : '#475569',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.25, pointerEvents: 'none' }} />
      <Sidebar />

      {/* REPORT VIEWER MODAL */}
      {viewingReport && viewingReport.report_html && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(6,6,18,0.98)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{viewingReport.applicant_name}</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>{viewingReport.app_id} · {new Date(viewingReport.created_at).toLocaleDateString('en-IN')}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(viewingReport.report_html!); w.document.close(); setTimeout(() => w.print(), 800) } }} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                DOWNLOAD PDF
              </button>
              <button onClick={() => setViewingReport(null)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                CLOSE
              </button>
            </div>
          </div>
          <div style={{ flex: 1, background: '#fff' }}>
            <iframe srcDoc={viewingReport.report_html} style={{ width: '100%', height: '100%', border: 'none' }} title="Report" />
          </div>
        </div>
      )}

      <div style={{ flex: 1, marginLeft: '225px', overflow: 'auto', position: 'relative', zIndex: 10 }}>

        <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Case <span style={{ color: '#6366f1' }}>Archive</span></div>
            <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>ALL LEGAL SCRUTINY REPORTS — TITLEMATRIX.AI</div>
          </div>
          <button onClick={() => router.push('/upload')} style={{
            padding: '10px 22px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: '12px', fontWeight: '800', letterSpacing: '1px',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}>
            + NEW REPORT
          </button>
        </div>

        <div style={{ padding: '32px' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ fontSize: '12px', color: '#334155', letterSpacing: '2px' }}>LOADING ARCHIVE...</div>
            </div>
          )}

          {!loading && reports.length === 0 && (
            <EmptyState onGenerate={() => router.push('/upload')} />
          )}

          {!loading && reports.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                <StatCard value={total} label="TOTAL REPORTS" color="#6366f1" icon="📁" />
                <StatCard value={clearCount} label="TITLE CLEAR" color="#10b981" icon="✓" />
                <StatCard value={subjectToCount} label="SUBJECT TO" color="#f59e0b" icon="◎" />
                <StatCard value={notClearCount} label="NOT CLEAR" color="#ef4444" icon="✗" />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('all')} style={filterBtnStyle(filter === 'all')}>
                  ALL ({total})
                </button>
                {usedCaseTypes.map(ct => (
                  <button key={ct} onClick={() => setFilter(ct)} style={filterBtnStyle(filter === ct)}>
                    {CASE_ICONS[ct]} {CASE_LABELS[ct] || ct} ({reports.filter(r => r.case_type === ct).length})
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map((report, i) => (
                  <ReportCard key={report.id} report={report} index={i} onView={handleView} />
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: '#334155', fontSize: '13px' }}>
                  Is case type mein koi report nahi mili
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}