"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [time, setTime] = useState(new Date())
  const [total, setTotal] = useState(0)
  const [today, setToday] = useState(0)
  const [month, setMonth] = useState(0)
  const [uptime, setUptime] = useState(0)
  const [load, setLoad] = useState(42)
  const [hov, setHov] = useState<number | null>(null)
  const [pulse, setPulse] = useState(0)
  const [recentReports, setRecentReports] = useState<any[]>([])
  const [caseBreakdown, setCaseBreakdown] = useState<any[]>([])
  const [verdictStats, setVerdictStats] = useState({ clear: 0, notClear: 0, subject: 0 })
  const [freeUsed, setFreeUsed] = useState(0)
  const [planName, setPlanName] = useState('Free')

  const caseColors: Record<string, string> = {
    builder_purchase: '#f59e0b',
    resale: '#6366f1',
    bt: '#3b82f6',
    seller_bt: '#8b5cf6',
    lap: '#10b981',
  }
  const caseLabels: Record<string, string> = {
    builder_purchase: 'Builder Purchase',
    resale: 'Resale',
    bt: 'Balance Transfer',
    seller_bt: 'Seller BT',
    lap: 'LAP / Mortgage',
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      // Login has been removed — there is no session to enforce. Without a user we simply
      // skip the per-user stats fetch (dashboard shows empty counts) instead of redirecting
      // to a /login route that no longer exists.
      if (!user) { return }
      setEmail(user.email || "")

      const todayStr = new Date().toISOString().split("T")[0]
      const monthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      // Fetch all reports for this user
      const { data: allReports } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      const reports = allReports || []
      setTotal(reports.length)
      setFreeUsed(Math.min(reports.length, 5))

      // Today count
      const todayReports = reports.filter(r => r.created_at?.startsWith(todayStr))
      setToday(todayReports.length)

      // Month count
      const monthReports = reports.filter(r => new Date(r.created_at) >= new Date(monthStr))
      setMonth(monthReports.length)

      // Recent 5 reports
      setRecentReports(reports.slice(0, 5))

      // Case type breakdown — REAL DATA
      const caseCount: Record<string, number> = {}
      reports.forEach(r => {
        const ct = r.case_type || 'lap'
        caseCount[ct] = (caseCount[ct] || 0) + 1
      })
      const total_ = reports.length || 1
      const breakdown = Object.entries(caseCount).map(([key, count]) => ({
        name: caseLabels[key] || key,
        count,
        pct: Math.round((count / total_) * 100),
        color: caseColors[key] || '#6366f1',
      })).sort((a, b) => b.count - a.count)
      setCaseBreakdown(breakdown)

      // Verdict breakdown — REAL DATA
      const clear = reports.filter(r => r.verdict === 'CLEAR').length
      const notClear = reports.filter(r => r.verdict === 'NOT CLEAR').length
      const subject = reports.filter(r => r.verdict === 'CLEAR SUBJECT TO').length
      setVerdictStats({ clear, notClear, subject })

      // Plan check
      const { data: plan } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (plan) setPlanName(plan.plan_name)
    })

    // Matrix canvas
    const canvas = document.getElementById("mx") as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const ch = "01アBCDEF₹$@#TITLEMATRIX.AI"
    const cols = Math.floor(canvas.width / 14)
    const dr = Array(cols).fill(1)
    const draw = () => {
      ctx.fillStyle = "rgba(4,4,12,0.04)"; ctx.fillRect(0, 0, canvas.width, canvas.height)
      dr.forEach((y, i) => {
        ctx.fillStyle = `rgba(${i % 2 === 0 ? "99,102,241" : "139,92,246"},${(Math.random() * 0.4 + 0.05).toFixed(2)})`
        ctx.font = "12px monospace"
        ctx.fillText(ch[Math.floor(Math.random() * ch.length)], i * 14, y * 14)
        if (y * 14 > canvas.height && Math.random() > 0.975) dr[i] = 0; dr[i]++
      })
    }
    const mid = setInterval(draw, 33)
    const tid = setInterval(() => setTime(new Date()), 1000)
    const uid = setInterval(() => setUptime(p => p + 1), 1000)
    const lid = setInterval(() => setLoad(Math.floor(Math.random() * 25 + 30)), 3000)
    const pid = setInterval(() => setPulse(p => p + 1), 50)
    return () => { clearInterval(mid); clearInterval(tid); clearInterval(uid); clearInterval(lid); clearInterval(pid) }
  }, [])

  const pad = (n: number) => String(n).padStart(2, "0")
  const uptimeStr = `${pad(Math.floor(uptime / 3600))}:${pad(Math.floor((uptime % 3600) / 60))}:${pad(uptime % 60)}`
  const waveVal = Math.sin(pulse * 0.15) * 0.5 + 0.5

  const stats = [
    { label: "TOTAL REPORTS", value: total, sub: "documents", color: "#818cf8", glow: "99,102,241", icon: "⚖️", deg: Math.min((total / 10) * 100, 100) },
    { label: "TODAY", value: today, sub: "scans", color: "#34d399", glow: "52,211,153", icon: "⚡", deg: Math.min((today / 5) * 100, 100) },
    { label: "THIS MONTH", value: month, sub: "reports", color: "#fbbf24", glow: "251,191,36", icon: "📊", deg: Math.min((month / 20) * 100, 100) },
    { label: "SESSION", value: uptimeStr, sub: "active", color: "#f472b6", glow: "244,114,182", icon: "🕐", small: true, deg: 80 },
  ]

  const getVerdictColor = (verdict: string) => {
    if (verdict === 'CLEAR') return '#10b981'
    if (verdict === 'NOT CLEAR') return '#ef4444'
    if (verdict === 'CLEAR SUBJECT TO') return '#f59e0b'
    return '#6366f1'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#04040c", fontFamily: "'Outfit',sans-serif", position: "relative", overflow: "hidden" }}>
      <canvas id="mx" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.6, pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)" }} />
      <Sidebar />

      <main style={{ marginLeft: "220px", flex: 1, padding: "28px 40px", position: "relative", zIndex: 1, overflowY: 'auto' }}>

        {/* STATUS BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", padding: "10px 18px", background: "rgba(6,6,18,0.95)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: "10px", backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: `0 0 ${8 + waveVal * 4}px #10b981` }} />
            <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#10b981", fontWeight: "700" }}>ALL SYSTEMS ONLINE</span>
          </div>
          <span style={{ color: "rgba(99,102,241,0.15)" }}>|</span>
          <span style={{ fontSize: "10px", letterSpacing: "1px", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "280px" }}>{email.toUpperCase()}</span>

          {/* FREE PLAN STATUS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
            <span style={{ fontSize: '9px', color: '#334155', letterSpacing: '1px' }}>PLAN:</span>
            <span style={{ fontSize: '9px', fontWeight: '800', color: planName === 'Free' ? '#f59e0b' : '#10b981', letterSpacing: '1px' }}>
              {planName.toUpperCase()}
            </span>
            {planName === 'Free' && (
              <span style={{ fontSize: '9px', color: '#475569' }}>({freeUsed}/5 used)</span>
            )}
          </div>

          <div style={{ marginLeft: "auto", fontSize: "14px", letterSpacing: "4px", color: "#6366f1", fontWeight: "800", fontVariantNumeric: "tabular-nums" }}>
            {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </div>
        </div>

        {/* HEADER */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "5px", color: "#6366f1", marginBottom: "6px", fontWeight: "600" }}>{"> CONTROL CENTER"}</div>
            <h1 style={{ fontSize: "48px", fontWeight: "900", margin: "0", letterSpacing: "-2px", lineHeight: 1, background: "linear-gradient(135deg,#fff 0%,#c7d2fe 50%,#818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              DASHBOARD
            </h1>
            <div style={{ height: "2px", width: "180px", marginTop: "8px", background: "linear-gradient(90deg,#6366f1,rgba(99,102,241,0.2),transparent)" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#1e293b" }}>UPTIME</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#6366f1", letterSpacing: "3px", fontVariantNumeric: "tabular-nums" }}>{uptimeStr}</div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "20px" }}>
          {stats.map((s, i) => (
            <div key={i}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ borderRadius: "20px", padding: "24px", background: hov === i ? `rgba(${s.glow},0.1)` : "rgba(8,8,24,0.8)", border: `1px solid rgba(${s.glow},${hov === i ? 0.5 : 0.12})`, backdropFilter: "blur(32px)", boxShadow: hov === i ? `0 12px 50px rgba(${s.glow},0.25)` : "none", transform: hov === i ? "translateY(-8px)" : "translateY(0)", transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)", position: "relative", overflow: "hidden", cursor: "default" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,rgba(${s.glow},0.9),transparent)`, opacity: hov === i ? 1 : 0.5 }} />
              <div style={{ position: "absolute", bottom: "-20px", right: "-10px", fontSize: "60px", opacity: 0.06 }}>{s.icon}</div>
              <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#334155", fontWeight: "700", marginBottom: "16px" }}>{s.label}</div>
              <div style={{ fontSize: s.small ? "24px" : "48px", fontWeight: "900", color: s.color, letterSpacing: s.small ? "1px" : "-2px", lineHeight: 1, textShadow: hov === i ? `0 0 30px rgba(${s.glow},0.8)` : "none", fontVariantNumeric: "tabular-nums", transition: "text-shadow 0.3s" }}>{s.value}</div>
              <div style={{ fontSize: "9px", color: `rgba(${s.glow},0.4)`, marginTop: "8px", letterSpacing: "2px" }}>{s.sub.toUpperCase()}</div>
              <div style={{ marginTop: "16px", height: "2px", background: "rgba(255,255,255,0.04)", borderRadius: "1px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: `rgba(${s.glow},0.6)`, width: `${s.deg}%`, transition: "width 0.8s ease", borderRadius: "1px" }} />
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM SECTION */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.8fr", gap: "16px", marginBottom: "20px" }}>

          {/* RECENT REPORTS — REAL DATA */}
          <div style={{ borderRadius: "20px", padding: "24px", background: "rgba(8,8,24,0.8)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(32px)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,rgba(99,102,241,0.8),transparent)" }} />
            <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#6366f1", fontWeight: "700", marginBottom: "16px" }}>// RECENT REPORTS</div>

            {recentReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#334155', fontSize: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                Koi report nahi abhi tak<br />
                <span style={{ color: '#6366f1', cursor: 'pointer', fontSize: '11px' }} onClick={() => router.push('/upload')}>Generate karo →</span>
              </div>
            ) : (
              recentReports.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getVerdictColor(r.verdict), boxShadow: `0 0 8px ${getVerdictColor(r.verdict)}`, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.applicant_name || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#334155', marginTop: '2px' }}>
                      {r.bank_name} · {caseLabels[r.case_type] || r.case_type}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '9px', fontWeight: '700', color: getVerdictColor(r.verdict) }}>{r.verdict || 'PENDING'}</div>
                    <div style={{ fontSize: '8px', color: '#1e293b', marginTop: '2px' }}>{formatDate(r.created_at)}</div>
                  </div>
                </div>
              ))
            )}

            {recentReports.length > 0 && (
              <div onClick={() => router.push('/reports')} style={{ marginTop: '12px', textAlign: 'center', fontSize: '10px', color: '#6366f1', cursor: 'pointer', letterSpacing: '1px', fontWeight: '700' }}>
                VIEW ALL REPORTS →
              </div>
            )}
          </div>

          {/* CASE TYPE BREAKDOWN — REAL DATA */}
          <div style={{ borderRadius: "20px", padding: "24px", background: "rgba(8,8,24,0.8)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(32px)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,rgba(251,191,36,0.8),transparent)" }} />
            <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#fbbf24", fontWeight: "700", marginBottom: "20px" }}>// CASE BREAKDOWN</div>

            {/* VERDICT PILLS */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '9px', color: '#10b981', fontWeight: '700' }}>
                ✓ CLEAR: {verdictStats.clear}
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: '9px', color: '#ef4444', fontWeight: '700' }}>
                ✗ NOT CLEAR: {verdictStats.notClear}
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '100px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '9px', color: '#f59e0b', fontWeight: '700' }}>
                ◎ SUBJECT TO: {verdictStats.subject}
              </div>
            </div>

            {caseBreakdown.length === 0 ? (
              <div style={{ color: '#334155', fontSize: '11px', textAlign: 'center', padding: '20px' }}>No data yet</div>
            ) : (
              caseBreakdown.map((c, i) => (
                <div key={i} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", color: "#475569" }}>{c.name}</span>
                    <span style={{ fontSize: "9px", color: c.color, fontWeight: "700" }}>{c.count} ({c.pct}%)</span>
                  </div>
                  <div style={{ height: "3px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, background: c.color, borderRadius: "2px", boxShadow: `0 0 6px ${c.color}`, opacity: 0.8 }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* QUICK ACTIONS */}
          <div style={{ borderRadius: "20px", padding: "24px", background: "rgba(8,8,24,0.8)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(32px)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,rgba(244,114,182,0.8),transparent)" }} />
            <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#f472b6", fontWeight: "700", marginBottom: "20px" }}>// ACTIONS</div>

            {/* FREE PLAN PROGRESS */}
            {planName === 'Free' && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '9px', color: '#f59e0b', letterSpacing: '1px', fontWeight: '700', marginBottom: '6px' }}>FREE PLAN</div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                  <div style={{ height: '100%', width: `${(freeUsed / 5) * 100}%`, background: freeUsed >= 5 ? '#ef4444' : '#f59e0b', borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '9px', color: '#475569' }}>{freeUsed}/5 reports used</div>
              </div>
            )}

            <button onClick={() => router.push("/upload")} style={{ width: "100%", padding: "16px 12px", marginBottom: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: "14px", fontSize: "11px", fontWeight: "800", cursor: "pointer", letterSpacing: "2px", boxShadow: "0 0 40px rgba(99,102,241,0.4)", lineHeight: "1.4" }}>
              📤 GENERATE<br />REPORT
            </button>
            <button onClick={() => router.push("/reports")} style={{ width: "100%", padding: "14px 12px", marginBottom: "12px", background: "transparent", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "14px", fontSize: "11px", fontWeight: "700", cursor: "pointer", letterSpacing: "2px", lineHeight: "1.4" }}>
              📁 VIEW<br />ARCHIVE
            </button>
            <button onClick={() => router.push("/payments")} style={{ width: "100%", padding: "14px 12px", background: "transparent", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "14px", fontSize: "11px", fontWeight: "700", cursor: "pointer", letterSpacing: "2px", lineHeight: "1.4" }}>
              💳 GET<br />PLAN
            </button>
          </div>
        </div>

        {/* LIVE STATUS */}
        <div style={{ borderRadius: "20px", padding: "20px 24px", background: "rgba(8,8,24,0.8)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(32px)", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,rgba(99,102,241,0.8),transparent)" }} />
          <div style={{ fontSize: "9px", letterSpacing: "4px", color: "#6366f1", fontWeight: "700", marginBottom: "16px" }}>// SYSTEM STATUS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
            {[
              { label: "AI PIPELINE", status: "OPERATIONAL", color: "#10b981" },
              { label: "CLAUDE HAIKU 4.5", status: "ACTIVE", color: "#10b981" },
              { label: "CLAUDE SONNET 4.6", status: "ACTIVE", color: "#10b981" },
              { label: "SUPABASE DB", status: "CONNECTED", color: "#fbbf24" },
              { label: "RAZORPAY", status: "PENDING", color: "#f97316" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: item.color, boxShadow: `0 0 ${6 + waveVal * 4}px ${item.color}`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "9px", color: "#334155", letterSpacing: "0.5px" }}>{item.label}</div>
                  <div style={{ fontSize: "8px", color: item.color, fontWeight: "700", letterSpacing: "1px" }}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}