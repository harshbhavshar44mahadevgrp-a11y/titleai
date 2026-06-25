"use client"
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

const DOC_TYPES = ['Sale Deed', 'Encumbrance Certificate (EC)', 'Revenue Record 7/12', 'NA Order', 'Development Permission', 'Draft Sale Deed', 'Property Card', 'Layout Approval', 'Mutation Entry', 'Completion Certificate', 'Mortgage Document', 'Other']

const CASE_TYPES = [
    { id: 'builder_purchase', label: 'Builder Purchase', icon: '🏗️', desc: 'New flat/plot from developer', color: '#f59e0b' },
    { id: 'resale',           label: 'Resale',           icon: '🔑', desc: 'Resale property purchase',   color: '#6366f1' },
    { id: 'bt',               label: 'Balance Transfer',  icon: '🔄', desc: 'BT from another bank',       color: '#3b82f6' },
    { id: 'seller_bt',        label: 'Seller BT',         icon: '💼', desc: 'Seller side Balance Transfer',color: '#8b5cf6' },
    { id: 'lap',              label: 'LAP / Mortgage',    icon: '🏦', desc: 'Loan Against Property',      color: '#10b981' },
]

const loanTypeMap: Record<string, string> = {
    'builder_purchase': 'Builder Purchase',
    'resale':           'Resale Property',
    'bt':               'Balance Transfer',
    'seller_bt':        'Seller Balance Transfer',
    'lap':              'LAP (Loan Against Property)',
}

interface DocFile { name: string; size: string; type: string; fileRef?: File }

export default function UploadPage() {
    const [dragging, setDragging]         = useState(false)
    const [files, setFiles]               = useState<DocFile[]>([])
    const [selectedType, setSelectedType] = useState('')
    const [caseType, setCaseType]         = useState('')
    const [caseSelected, setCaseSelected] = useState(false)   // NEW — case chuna ya nahi
    const [errorMsg, setErrorMsg]         = useState('')
    const [generating, setGenerating]     = useState(false)
    const [reportData, setReportData]     = useState<any>(null)
    const [step, setStep]                 = useState(0)
    const inputRef  = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const steps = [
        { step: '01', title: 'Reading documents...', desc: 'Extracting text from PDFs' },
        { step: '02', title: 'Extracting facts...', desc: 'Haiku identifying all data' },
        { step: '03', title: 'Analysing title chain...', desc: 'Sonnet deep legal analysis' },
        { step: '04', title: 'Checking EC and 7/12...', desc: 'Cross-verifying documents' },
        { step: '05', title: 'Writing legal opinion...', desc: 'Generating final report' },
    ]

    const selectedCase = CASE_TYPES.find(c => c.id === caseType) || CASE_TYPES[0]

    // Matrix animation
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        canvas.width = window.innerWidth; canvas.height = window.innerHeight
        const words = ['TITLEAI', 'SALEDEED', 'EC', '7/12', 'NAORDER', 'RISK', 'SURVEY', 'MUTATION', 'LEGAL', 'BANK']
        const fontSize = 13; const cols = Math.floor(canvas.width / fontSize)
        const drops: number[] = Array(cols).fill(1)
        const speeds: number[] = Array(cols).fill(0).map(() => Math.random() * 0.4 + 0.2)
        const draw = () => {
            ctx.fillStyle = 'rgba(2,2,8,0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
            for (let i = 0; i < drops.length; i++) {
                const word = words[Math.floor(Math.random() * words.length)]
                ctx.fillStyle = 'rgba(99,102,241,' + (Math.random() * 0.5 + 0.3) + ')'
                ctx.font = 'bold ' + fontSize + 'px monospace'
                ctx.fillText(word[Math.floor(Math.random() * word.length)], i * fontSize, drops[i] * fontSize)
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i] += speeds[i]
            }
        }
        const interval = setInterval(draw, 40)
        return () => clearInterval(interval)
    }, [])

    const addFiles = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles.map(f => ({
            name: f.name,
            size: (f.size / 1024).toFixed(1) + ' KB',
            type: selectedType || 'Auto Detect',
            fileRef: f
        }))])
        setErrorMsg('')
        setReportData(null)
    }

    const extractTextFromPDF = async (file: File, imgArr: any[]): Promise<string> => {
        try {
            const pdfjsLib = await import('pdfjs-dist')
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
            const arrayBuffer = await file.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            let fullText = `\n===== DOCUMENT: ${file.name} =====\n`
            for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 10); pageNum++) {
                const page = await pdf.getPage(pageNum)
                const textContent = await page.getTextContent()
                const pageText = textContent.items.map((item: any) => item.str).join(' ').trim()
                fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`
                if (pageText.length < 80) {
                    const baseVp = page.getViewport({ scale: 1.0 })
                    const maxPx  = 1500
                    const scale  = Math.min(2.0, maxPx / Math.max(baseVp.width, baseVp.height))
                    const vp     = page.getViewport({ scale })
                    const cv     = document.createElement('canvas')
                    cv.width     = vp.width
                    cv.height    = vp.height
                    await page.render({ canvasContext: cv.getContext('2d')!, viewport: vp }).promise
                    imgArr.push({ base64: cv.toDataURL('image/jpeg', 0.85).split(',')[1], mediaType: 'image/jpeg', name: file.name + '_p' + pageNum })
                }
            }
            return fullText
        } catch (e) { return '' }
    }

    const handleGenerate = async () => {
        if (files.length === 0) { setErrorMsg('Pehle documents upload karo!'); return }
        setGenerating(true); setReportData(null); setStep(0); setErrorMsg('')
        let s = 0
        const iv = setInterval(() => { s++; setStep(s); if (s >= steps.length) clearInterval(iv) }, 8000)
        try {
            let allText = ''; const imageFiles: any[] = []
            for (const f of files.filter(f => f.fileRef)) {
                const file = f.fileRef!
                if (file.type === 'application/pdf') {
                    allText += await extractTextFromPDF(file, imageFiles)
                } else {
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload  = () => resolve((reader.result as string).split(',')[1])
                        reader.onerror = reject
                        reader.readAsDataURL(file)
                    })
                    imageFiles.push({ base64, mediaType: file.type || 'image/jpeg', name: file.name })
                }
            }
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentText: allText,
                    images: imageFiles.map((img: any) => ({ data: img.base64, mediaType: img.mediaType, name: img.name })),
                    caseType,
                    appId:           'AUTO-' + Date.now().toString().slice(-6),
                    bankName:        'Axis Bank Ltd., Ambawadi, Ahmedabad',
                    loanType:        loanTypeMap[caseType] || 'LAP',
                    loanAmount:      'As per Application',
                    applicantName:   'As per Triggering Form',
                    coApplicant:     'As per Triggering Form',
                    propertyAddress: 'As per Documents',
                })
            })
            const data = await res.json()
            clearInterval(iv); setStep(steps.length)
            if (data.success) {
                setTimeout(() => { setReportData({ htmlReport: data.report }); setGenerating(false) }, 300)
            } else { throw new Error(data.error || 'Analysis failed') }
        } catch (err: any) {
            clearInterval(iv)
            setErrorMsg('Error: ' + (err.message || 'Unknown error'))
            setGenerating(false)
        }
    }

    const handlePrint = () => {
        if (!reportData?.htmlReport) return
        const w = window.open('', '_blank')
        if (w) { w.document.write(reportData.htmlReport); w.document.close(); setTimeout(() => w.print(), 800) }
    }

    const handleOpenTab = () => {
        if (!reportData?.htmlReport) return
        const w = window.open('', '_blank')
        if (w) { w.document.write(reportData.htmlReport); w.document.close() }
    }

    // ================================================================
    // CASE SELECT FUNCTION
    // ================================================================
    const handleCaseSelect = (id: string) => {
        setCaseType(id)
        setCaseSelected(true)
    }

    const handleChangeCaseType = () => {
        setCaseSelected(false)
        setCaseType('')
        setFiles([])
        setReportData(null)
    }

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.4, pointerEvents: 'none' }} />
            <Sidebar />

            <div style={{ flex: 1, marginLeft: '225px', overflow: 'auto', position: 'relative', zIndex: 10 }}>

                {/* HEADER */}
                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Document <span style={{ color: '#6366f1' }}>Upload & Report</span></div>
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>UPLOAD — AI ANALYSE — LEGAL SCRUTINY REPORT</div>
                    </div>
                    {caseSelected && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div onClick={handleChangeCaseType} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '100px', padding: '8px 16px', cursor: 'pointer' }}>
                                <span>{selectedCase.icon}</span>
                                <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700' }}>{selectedCase.label}</span>
                                <span style={{ fontSize: '10px', color: '#6366f1' }}>✎</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '100px', padding: '8px 18px' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>AI ENGINE READY</span>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '32px' }}>

                    {/* ============================================================
                        STEP 1 — CASE TYPE SELECTION (jab tak select na ho)
                    ============================================================ */}
                    {!caseSelected && !generating && !reportData && (
                        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

                            {/* HEADING */}
                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <div style={{ fontSize: '13px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '12px' }}>STEP 1 OF 2</div>
                                <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
                                    Kaunsa Case Hai?
                                </div>
                                <div style={{ fontSize: '13px', color: '#475569' }}>
                                    Case type select karo — AI us hisaab se deep legal thinking karega
                                </div>
                            </div>

                            {/* 5 CASE TYPE CARDS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {CASE_TYPES.map(ct => (
                                    <div
                                        key={ct.id}
                                        onClick={() => handleCaseSelect(ct.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '20px',
                                            padding: '20px 24px', borderRadius: '16px', cursor: 'pointer',
                                            background: 'rgba(10,10,20,0.8)',
                                            border: `1px solid rgba(99,102,241,0.15)`,
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLDivElement).style.border = `1px solid ${ct.color}`
                                            ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.08)'
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(99,102,241,0.15)'
                                            ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(10,10,20,0.8)'
                                        }}
                                    >
                                        {/* ICON */}
                                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `rgba(99,102,241,0.1)`, border: `1px solid rgba(99,102,241,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                                            {ct.icon}
                                        </div>

                                        {/* TEXT */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '3px' }}>{ct.label}</div>
                                            <div style={{ fontSize: '12px', color: '#475569' }}>{ct.desc}</div>
                                        </div>

                                        {/* ARROW */}
                                        <div style={{ fontSize: '18px', color: '#334155' }}>→</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ============================================================
                        STEP 2 — UPLOAD (sirf case select hone ke baad)
                    ============================================================ */}
                    {caseSelected && !generating && !reportData && (
                        <>
                            {/* STEP INDICATOR */}
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ fontSize: '13px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '8px' }}>STEP 2 OF 2</div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: `rgba(99,102,241,0.1)`, border: `1px solid rgba(99,102,241,0.3)`, borderRadius: '100px', padding: '8px 20px' }}>
                                    <span style={{ fontSize: '20px' }}>{selectedCase.icon}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{selectedCase.label}</span>
                                    <span style={{ fontSize: '11px', color: '#6366f1', cursor: 'pointer', marginLeft: '4px' }} onClick={handleChangeCaseType}>← Change</span>
                                </div>
                            </div>

                            {/* ERROR */}
                            {errorMsg && (
                                <div style={{ marginBottom: '20px', padding: '14px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '12px', color: '#fca5a5', fontSize: '13px', fontWeight: '600' }}>
                                    ✗ {errorMsg}
                                </div>
                            )}

                            {/* DOC TYPE */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '2px', fontWeight: '700', marginBottom: '12px' }}>SELECT DOCUMENT TYPE</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {DOC_TYPES.map(type => (
                                        <button key={type} onClick={() => setSelectedType(type === selectedType ? '' : type)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: selectedType === type ? '1px solid #6366f1' : '1px solid rgba(99,102,241,0.2)', background: selectedType === type ? 'rgba(99,102,241,0.2)' : 'rgba(2,2,8,0.8)', color: selectedType === type ? '#fff' : '#475569' }}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* DROP ZONE */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={e => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
                                style={{ border: dragging ? '2px solid #6366f1' : '2px dashed rgba(99,102,241,0.3)', borderRadius: '20px', padding: '50px 40px', textAlign: 'center', background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(2,2,8,0.6)', marginBottom: '28px', position: 'relative', cursor: 'pointer' }}
                                onClick={() => inputRef.current?.click()}
                            >
                                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '20px', height: '20px', borderTop: '2px solid rgba(99,102,241,0.6)', borderLeft: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', borderTop: '2px solid rgba(99,102,241,0.6)', borderRight: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '20px', height: '20px', borderBottom: '2px solid rgba(99,102,241,0.6)', borderLeft: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '20px', height: '20px', borderBottom: '2px solid rgba(99,102,241,0.6)', borderRight: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Drop property documents here</div>
                                <div style={{ fontSize: '12px', color: '#334155', marginBottom: '20px' }}>PDF · Sale Deed, EC, 7/12, NA Order — multiple files allowed</div>
                                <button onClick={e => { e.stopPropagation(); inputRef.current?.click() }} style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 28px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                                    + SELECT FILES
                                </button>
                                <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && addFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
                            </div>

                            {/* FILE LIST */}
                            {files.length > 0 && (
                                <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>
                                        ▣ DOCUMENTS — <span style={{ color: '#6366f1' }}>{files.length} files</span>
                                    </div>
                                    {files.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', marginBottom: '8px' }}>
                                            <div style={{ fontSize: '20px' }}>📄</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{f.name}</div>
                                                <div style={{ fontSize: '11px', color: '#334155' }}>{f.size} · {f.type}</div>
                                            </div>
                                            <div onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ fontSize: '16px', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}>✕</div>
                                        </div>
                                    ))}
                                    <button onClick={handleGenerate} style={{ width: '100%', marginTop: '20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' }}>
                                        📋 GENERATE REPORT — {selectedCase.icon} {selectedCase.label}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* GENERATING */}
                    {generating && (
                        <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '48px 32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px', letterSpacing: '2px' }}>
                                ⚡ GENERATING LEGAL SCRUTINY REPORT...
                            </div>
                            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '32px' }}>
                                {selectedCase.icon} {selectedCase.label} — Deep legal analysis in progress
                            </div>
                            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                                {steps.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '10px', background: i < step ? 'rgba(245,158,11,0.08)' : 'rgba(10,10,20,0.5)', border: `1px solid ${i < step ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.04)'}`, borderRadius: '12px', transition: 'all 0.3s' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i < step ? '#f59e0b' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: i < step ? '#000' : '#6b7280', fontWeight: '900', flexShrink: 0 }}>
                                            {i < step ? '✓' : s.step}
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: i < step ? '#f59e0b' : '#4b5563' }}>{s.title}</div>
                                            <div style={{ fontSize: '11px', color: '#334155' }}>{s.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '24px', fontSize: '11px', color: '#334155' }}>
                                This may take 3-5 minutes — deep legal analysis in progress...
                            </div>
                        </div>
                    )}

                    {/* REPORT */}
                    {reportData && !generating && (
                        <div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button onClick={() => { setReportData(null); setFiles([]); setCaseSelected(false); setCaseType('') }} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 20px', color: '#f59e0b', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>
                                    ↺ NEW REPORT
                                </button>
                                <button onClick={handleOpenTab} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', color: '#6366f1' }}>
                                    🔗 OPEN IN NEW TAB
                                </button>
                                <button onClick={handlePrint} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                                    ↓ DOWNLOAD PDF
                                </button>
                            </div>
                            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                                <iframe srcDoc={reportData.htmlReport} style={{ width: '100%', height: '950px', border: 'none', display: 'block' }} title="Legal Scrutiny Report" />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
