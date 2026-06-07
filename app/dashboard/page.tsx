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
  const [hov, setHov] = useState<number|null>(null)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      setEmail(user.email || "")
      const todayStr = new Date().toISOString().split("T")[0]
      const monthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const [t, d, m] = await Promise.all([
        supabase.from("reports").select("*",{count:"exact",head:true}).eq("user_id",user.id),
        supabase.from("reports").select("*",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",todayStr),
        supabase.from("reports").select("*",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",monthStr),
      ])
      setTotal(t.count||0); setToday(d.count||0); setMonth(m.count||0)
    })
    const canvas = document.getElementById("mx") as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const ch = "01アBCDEF₹$@#TITLEAI"
    const cols = Math.floor(canvas.width/14); const dr = Array(cols).fill(1)
    const draw = () => {
      ctx.fillStyle = "rgba(4,4,12,0.04)"; ctx.fillRect(0,0,canvas.width,canvas.height)
      dr.forEach((y,i) => {
        ctx.fillStyle = `rgba(${i%2===0?"99,102,241":"139,92,246"},${(Math.random()*0.4+0.05).toFixed(2)})`
        ctx.font = "12px monospace"
        ctx.fillText(ch[Math.floor(Math.random()*ch.length)],i*14,y*14)
        if(y*14>canvas.height&&Math.random()>0.975)dr[i]=0; dr[i]++
      })
    }
    const mid = setInterval(draw,33)
    const tid = setInterval(()=>setTime(new Date()),1000)
    const uid = setInterval(()=>setUptime(p=>p+1),1000)
    const lid = setInterval(()=>setLoad(Math.floor(Math.random()*25+30)),3000)
    const pid = setInterval(()=>setPulse(p=>p+1),50)
    return()=>{ clearInterval(mid); clearInterval(tid); clearInterval(uid); clearInterval(lid); clearInterval(pid) }
  },[])

  const pad = (n:number) => String(n).padStart(2,"0")
  const uptimeStr = `${pad(Math.floor(uptime/3600))}:${pad(Math.floor((uptime%3600)/60))}:${pad(uptime%60)}`
  const waveVal = Math.sin(pulse * 0.15) * 0.5 + 0.5

  const stats = [
    { label:"TOTAL REPORTS", value:total, sub:"documents", color:"#818cf8", glow:"99,102,241", icon:"⚖️", deg:65 },
    { label:"TODAY", value:today, sub:"scans", color:"#34d399", glow:"52,211,153", icon:"⚡", deg:30 },
    { label:"THIS MONTH", value:month, sub:"reports", color:"#fbbf24", glow:"251,191,36", icon:"📊", deg:45 },
    { label:"SESSION", value:uptimeStr, sub:"active", color:"#f472b6", glow:"244,114,182", icon:"🕐", small:true, deg:80 },
  ]

  const cases = [
    { name:"Builder Purchase", pct:35, color:"#818cf8" },
    { name:"Resale", pct:28, color:"#34d399" },
    { name:"Balance Transfer", pct:18, color:"#fbbf24" },
    { name:"LAP / Mortgage", pct:12, color:"#f472b6" },
    { name:"Seller BT", pct:7, color:"#fb923c" },
  ]

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#04040c",fontFamily:"'Outfit',sans-serif",position:"relative",overflow:"hidden"}}>
      <canvas id="mx" style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,opacity:0.6,pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)"}}/>
      <div style={{position:"fixed",top:"20%",left:"45%",width:"500px",height:"500px",zIndex:0,pointerEvents:"none",background:"radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)"}}/>
      <div style={{position:"fixed",bottom:"10%",right:"10%",width:"300px",height:"300px",zIndex:0,pointerEvents:"none",background:"radial-gradient(circle,rgba(139,92,246,0.04) 0%,transparent 70%)"}}/>

      <Sidebar/>
      <main style={{marginLeft:"220px",flex:1,padding:"28px 40px",position:"relative",zIndex:1}}>

        {/* STATUS BAR */}
        <div style={{display:"flex",alignItems:"center",gap:"16px",marginBottom:"28px",padding:"10px 18px",
          background:"rgba(6,6,18,0.95)",border:"1px solid rgba(99,102,241,0.1)",borderRadius:"10px",backdropFilter:"blur(20px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
            <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#10b981",boxShadow:`0 0 ${8+waveVal*4}px #10b981`}}/>
            <span style={{fontSize:"10px",letterSpacing:"3px",color:"#10b981",fontWeight:"700"}}>ALL SYSTEMS ONLINE</span>
          </div>
          <span style={{color:"rgba(99,102,241,0.15)"}}>|</span>
          <span style={{fontSize:"10px",letterSpacing:"1px",color:"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"280px"}}>{email.toUpperCase()}</span>
          <div style={{marginLeft:"auto",fontSize:"14px",letterSpacing:"4px",color:"#6366f1",fontWeight:"800",fontVariantNumeric:"tabular-nums"}}>
            {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
          </div>
        </div>

        {/* HEADER */}
        <div style={{marginBottom:"32px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:"10px",letterSpacing:"5px",color:"#6366f1",marginBottom:"6px",fontWeight:"600"}}>{">"} CONTROL CENTER</div>
            <h1 style={{fontSize:"48px",fontWeight:"900",margin:"0",letterSpacing:"-2px",lineHeight:1,
              background:"linear-gradient(135deg,#fff 0%,#c7d2fe 50%,#818cf8 100%)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              DASHBOARD
            </h1>
            <div style={{height:"2px",width:"180px",marginTop:"8px",background:"linear-gradient(90deg,#6366f1,rgba(99,102,241,0.2),transparent)"}}/>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"9px",letterSpacing:"3px",color:"#1e293b"}}>UPTIME</div>
            <div style={{fontSize:"20px",fontWeight:"800",color:"#6366f1",letterSpacing:"3px",fontVariantNumeric:"tabular-nums"}}>{uptimeStr}</div>
          </div>
        </div>

        {/* STAT CARDS — UNIQUE DIAGONAL DESIGN */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"20px"}}>
          {stats.map((s,i)=>(
            <div key={i}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{
                borderRadius:"20px", padding:"24px",
                background:hov===i ? `rgba(${s.glow},0.1)` : "rgba(8,8,24,0.8)",
                border:`1px solid rgba(${s.glow},${hov===i?0.5:0.12})`,
                backdropFilter:"blur(32px)", WebkitBackdropFilter:"blur(32px)",
                boxShadow:hov===i ? `0 12px 50px rgba(${s.glow},0.25), inset 0 1px 0 rgba(255,255,255,0.07)` : "inset 0 1px 0 rgba(255,255,255,0.03)",
                transform:hov===i ? "translateY(-8px)" : "translateY(0)",
                transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                position:"relative", overflow:"hidden", cursor:"default",
              }}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",
                background:`linear-gradient(90deg,rgba(${s.glow},0.9),transparent)`,
                opacity:hov===i?1:0.5}}/>
              <div style={{position:"absolute",bottom:"-20px",right:"-10px",fontSize:"60px",opacity:0.06}}>{s.icon}</div>
              
              <div style={{fontSize:"9px",letterSpacing:"3px",color:"#334155",fontWeight:"700",marginBottom:"16px"}}>{s.label}</div>
              <div style={{
                fontSize:s.small?"24px":"48px",fontWeight:"900",color:s.color,
                letterSpacing:s.small?"1px":"-2px",lineHeight:1,
                textShadow:hov===i?`0 0 30px rgba(${s.glow},0.8), 0 0 60px rgba(${s.glow},0.4)`:"none",
                fontVariantNumeric:"tabular-nums",transition:"text-shadow 0.3s",
              }}>{s.value}</div>
              <div style={{fontSize:"9px",color:`rgba(${s.glow},0.4)`,marginTop:"8px",letterSpacing:"2px"}}>{s.sub.toUpperCase()}</div>
              
              {/* Bottom progress */}
              <div style={{marginTop:"16px",height:"2px",background:"rgba(255,255,255,0.04)",borderRadius:"1px",overflow:"hidden"}}>
                <div style={{height:"100%",background:`rgba(${s.glow},0.6)`,
                  width:hov===i?"100%":`${s.deg}%`,transition:"width 0.8s ease",borderRadius:"1px"}}/>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM SECTION */}
        <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 0.8fr",gap:"16px"}}>
          
          {/* LIVE STATUS */}
          <div style={{borderRadius:"20px",padding:"24px",background:"rgba(8,8,24,0.8)",
            border:"1px solid rgba(255,255,255,0.05)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
            position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:"linear-gradient(90deg,rgba(99,102,241,0.8),transparent)"}}/>
            <div style={{fontSize:"9px",letterSpacing:"4px",color:"#6366f1",fontWeight:"700",marginBottom:"20px"}}>// LIVE STATUS</div>
            {[
              {label:"AI PIPELINE",status:"OPERATIONAL",color:"#10b981"},
              {label:"CLAUDE HAIKU 4.5",status:"ACTIVE",color:"#10b981"},
              {label:"CLAUDE SONNET 4.6",status:"ACTIVE",color:"#10b981"},
              {label:"SUPABASE DB",status:"CONNECTED",color:"#fbbf24"},
              {label:"RAZORPAY",status:"SETUP PENDING",color:"#f97316"},
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px",padding:"8px 12px",background:"rgba(255,255,255,0.02)",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.03)"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <div style={{width:"5px",height:"5px",borderRadius:"50%",background:item.color,
                    boxShadow:`0 0 ${6+waveVal*4}px ${item.color}`}}/>
                  <span style={{fontSize:"10px",color:"#475569",letterSpacing:"1px"}}>{item.label}</span>
                </div>
                <span style={{fontSize:"8px",letterSpacing:"2px",color:item.color,fontWeight:"700"}}>{item.status}</span>
              </div>
            ))}
            <div style={{marginTop:"12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}>
                <span style={{fontSize:"9px",letterSpacing:"2px",color:"#1e293b"}}>SYSTEM LOAD</span>
                <span style={{fontSize:"9px",color:"#6366f1",fontWeight:"700"}}>{load}%</span>
              </div>
              <div style={{height:"3px",background:"rgba(99,102,241,0.08)",borderRadius:"2px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${load}%`,background:"linear-gradient(90deg,#6366f1,#8b5cf6)",transition:"width 2s ease",borderRadius:"2px"}}/>
              </div>
            </div>
          </div>

          {/* CASE TYPE BREAKDOWN */}
          <div style={{borderRadius:"20px",padding:"24px",background:"rgba(8,8,24,0.8)",
            border:"1px solid rgba(255,255,255,0.05)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
            position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:"linear-gradient(90deg,rgba(251,191,36,0.8),transparent)"}}/>
            <div style={{fontSize:"9px",letterSpacing:"4px",color:"#fbbf24",fontWeight:"700",marginBottom:"20px"}}>// CASE TYPES</div>
            {cases.map((c,i)=>(
              <div key={i} style={{marginBottom:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <span style={{fontSize:"10px",color:"#475569",letterSpacing:"0.5px"}}>{c.name}</span>
                  <span style={{fontSize:"9px",color:c.color,fontWeight:"700"}}>{c.pct}%</span>
                </div>
                <div style={{height:"3px",background:"rgba(255,255,255,0.04)",borderRadius:"2px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${c.pct}%`,background:c.color,borderRadius:"2px",
                    boxShadow:`0 0 6px ${c.color}`,opacity:0.8}}/>
                </div>
              </div>
            ))}
          </div>

          {/* QUICK ACTIONS */}
          <div style={{borderRadius:"20px",padding:"24px",background:"rgba(8,8,24,0.8)",
            border:"1px solid rgba(255,255,255,0.05)",backdropFilter:"blur(32px)",WebkitBackdropFilter:"blur(32px)",
            position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:"linear-gradient(90deg,rgba(244,114,182,0.8),transparent)"}}/>
            <div style={{fontSize:"9px",letterSpacing:"4px",color:"#f472b6",fontWeight:"700",marginBottom:"20px"}}>// ACTIONS</div>
            
            <button onClick={()=>router.push("/upload")}
              style={{width:"100%",padding:"16px 12px",marginBottom:"12px",
                background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                color:"#fff",border:"none",borderRadius:"14px",
                fontSize:"11px",fontWeight:"800",cursor:"pointer",letterSpacing:"2px",
                boxShadow:"0 0 40px rgba(99,102,241,0.4)",lineHeight:"1.4"}}>
              📤 GENERATE<br/>REPORT
            </button>
            <button onClick={()=>router.push("/reports")}
              style={{width:"100%",padding:"14px 12px",marginBottom:"12px",
                background:"transparent",color:"#818cf8",border:"1px solid rgba(99,102,241,0.25)",
                borderRadius:"14px",fontSize:"11px",fontWeight:"700",cursor:"pointer",letterSpacing:"2px",lineHeight:"1.4"}}>
              📁 VIEW<br/>ARCHIVE
            </button>
            <button onClick={()=>router.push("/payments")}
              style={{width:"100%",padding:"14px 12px",
                background:"transparent",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.2)",
                borderRadius:"14px",fontSize:"11px",fontWeight:"700",cursor:"pointer",letterSpacing:"2px",lineHeight:"1.4"}}>
              💳 GET<br/>PLAN
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
