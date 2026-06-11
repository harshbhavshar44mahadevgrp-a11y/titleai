"use client"
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

const DOC_TYPES = ['Sale Deed', 'Encumbrance Certificate (EC)', 'Revenue Record 7/12', 'NA Order', 'Development Permission', 'Draft Sale Deed', 'Property Card', 'Layout Approval', 'Mutation Entry', 'Completion Certificate', 'Mortgage Document', 'Other']

const CASE_TYPES = [
    { id: 'builder_purchase', label: 'Builder Purchase', icon: '🏗️', color: '#f59e0b' },
    { id: 'resale', label: 'Resale', icon: '🔑', color: '#6366f1' },
    { id: 'bt', label: 'Balance Transfer', icon: '🔄', color: '#3b82f6' },
    { id: 'seller_bt', label: 'Seller BT', icon: '💼', color: '#8b5cf6' },
    { id: 'lap', label: 'LAP / Mortgage', icon: '🏦', color: '#10b981' },
]

const loanTypeMap: Record<string, string> = {
    'builder_purchase': 'Builder Purchase',
    'resale': 'Resale Property',
    'bt': 'Balance Transfer',
    'seller_bt': 'Seller Balance Transfer',
    'lap': 'LAP (Loan Against Property)',
}

interface DocFile { name: string; size: string; type: string; fileRef?: File }

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(99,102,241,0.06)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '8px',
    padding: '10px 13px',
    color: '#e2e8f0',
    fontSize: '12px',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#475569',
    letterSpacing: '1.5px',
    fontWeight: '700',
    display: 'block',
    marginBottom: '6px',
}

const boundaryLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#6366f1',
    letterSpacing: '1.5px',
    fontWeight: '700',
    display: 'block',
    marginBottom: '6px',
}

export default function UploadPage() {
    const router = useRouter()
    const [dragging, setDragging] = useState(false)
    const [files, setFiles] = useState<DocFile[]>([])
    const [selectedType, setSelectedType] = useState('')
    const [caseType, setCaseType] = useState('')
    const [caseSelected, setCaseSelected] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [generating, setGenerating] = useState(false)
    const [reportData, setReportData] = useState<any>(null)
    const [step, setStep] = useState(0)

    // Details sheet
    const [bankName, setBankName] = useState('')
    const [applicantNameInput, setApplicantNameInput] = useState('')
    const [coApplicantInput, setCoApplicantInput] = useState('')
    const [currentOwnerInput, setCurrentOwnerInput] = useState('')
    const [propertyDescInput, setPropertyDescInput] = useState('')

    // Boundaries
    const [boundaryEast, setBoundaryEast] = useState('')
    const [boundaryWest, setBoundaryWest] = useState('')
    const [boundaryNorth, setBoundaryNorth] = useState('')
    const [boundarySouth, setBoundarySouth] = useState('')

    // Free limit
    const [reportsUsed, setReportsUsed] = useState(0)
    const [limitReached, setLimitReached] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const cameraRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const steps = [
        { step: '01', title: 'Reading documents...', desc: 'Extracting text from PDFs' },
        { step: '02', title: 'Extracting facts...', desc: 'AI identifying all data' },
        { step: '03', title: 'Analysing title chain...', desc: 'Deep legal analysis' },
        { step: '04', title: 'Checking EC and 7/12...', desc: 'Cross-verifying documents' },
        { step: '05', title: 'Writing legal opinion...', desc: 'Generating final report' },
    ]

    const selectedCase = CASE_TYPES.find(c => c.id === caseType) || CASE_TYPES[0]

    // ── Clear error on mount (fix: old error persisting) ──
    useEffect(() => {
        setErrorMsg('')
    }, [])

    useEffect(() => {
        const checkLimit = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)
            const { count } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            const used = count || 0
            setReportsUsed(used)
            if (used >= 5) setLimitReached(true)
        }
        checkLimit()
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        canvas.width = window.innerWidth; canvas.height = window.innerHeight
        const words = ['TITLEMATRIXAI', 'SALEDEED', 'EC', '7/12', 'NAORDER', 'RISK', 'SURVEY', 'MUTATION', 'LEGAL', 'BANK']
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
                if (false) {
                    const baseVp = page.getViewport({ scale: 1.0 })
                    const maxPx = 1500
                    const scale = Math.min(2.0, maxPx / Math.max(baseVp.width, baseVp.height))
                    const vp = page.getViewport({ scale })
                    const cv = document.createElement('canvas')
                    cv.width = vp.width; cv.height = vp.height
                    await page.render({ canvasContext: cv.getContext('2d')!, viewport: vp }).promise
                    imgArr.push({ base64: cv.toDataURL('image/jpeg', 0.85).split(',')[1], mediaType: 'image/jpeg', name: file.name + '_p' + pageNum })
                }
            }
            return fullText
        } catch (e) { return '' }
    }

    const handleGenerate = async () => {
        if (limitReached) { router.push('/payments'); return }
        if (!bankName.trim()) { setErrorMsg('Bank name mandatory hai!'); return }
        if (!applicantNameInput.trim()) { setErrorMsg('Applicant name mandatory hai!'); return }
        if (!currentOwnerInput.trim()) { setErrorMsg('Current owner name mandatory hai!'); return }
        if (!propertyDescInput.trim()) { setErrorMsg('Property description mandatory hai!'); return }
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
                        reader.onload = () => resolve((reader.result as string).split(',')[1])
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
                    userId,
                    documentText: allText,
                    images: imageFiles.map((img: any) => ({ data: img.base64, mediaType: img.mediaType, name: img.name })),
                    caseType,
                    appId: 'AUTO-' + Date.now().toString().slice(-6),
                    bankName,
                    loanType: loanTypeMap[caseType] || 'LAP',
                    loanAmount: 'As per Application',
                    applicantName: applicantNameInput,
                    coApplicant: coApplicantInput || 'Not Applicable',
                    propertyAddress: propertyDescInput,
                    currentOwner: currentOwnerInput,
                    boundaryEast: boundaryEast || 'As per documents',
                    boundaryWest: boundaryWest || 'As per documents',
                    boundaryNorth: boundaryNorth || 'As per documents',
                    boundarySouth: boundarySouth || 'As per documents',
                })
            })

            if (!res.ok) {
                const text = await res.text()
                if (res.status === 504) throw new Error('Report generation timed out. Please try again.')
                if (res.status === 413) throw new Error('Files too large. Please compress and try again.')
                throw new Error(`Server error (${res.status}). Please try again.`)
            }

            const data = await res.json()
            clearInterval(iv); setStep(steps.length)
            if (data.success) {
                setTimeout(() => {
                    setReportData({ htmlReport: data.report })
                    setGenerating(false)
                    setReportsUsed(prev => prev + 1)
                    if (reportsUsed + 1 >= 5) setLimitReached(true)
                }, 300)
            } else { throw new Error(data.error || 'Analysis failed') }
        } catch (err: any) {
            clearInterval(iv)
            setErrorMsg('Error: ' + (err.message || 'Unknown error'))
            setGenerating(false)
        }
    }

    const handleWordDownload = () => {
        if (!reportData?.htmlReport) return
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>TITLEMATRIXAI Report</title><style>body{font-family:Arial,sans-serif;font-size:11pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 10px}</style></head><body>${reportData.htmlReport}</body></html>`
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `TITLEMATRIXAI_${applicantNameInput || 'Report'}_${bankName || ''}.doc`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
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

    const handleCaseSelect = (id: string) => { setCaseType(id); setCaseSelected(true) }
    const handleChangeCaseType = () => { setCaseSelected(false); setCaseType(''); setFiles([]); setReportData(null) }
    const handleNewReport = () => {
        setReportData(null); setFiles([]); setCaseSelected(false); setCaseType('')
        setBankName(''); setApplicantNameInput(''); setCoApplicantInput('')
        setCurrentOwnerInput(''); setPropertyDescInput(''); setErrorMsg('')
        setBoundaryEast(''); setBoundaryWest(''); setBoundaryNorth(''); setBoundarySouth('')
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
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {!limitReached && (
                            <div style={{ padding: '6px 16px', borderRadius: '100px', background: reportsUsed >= 4 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${reportsUsed >= 4 ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}` }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: reportsUsed >= 4 ? '#f87171' : '#10b981' }}>{5 - reportsUsed} Free Reports Left</span>
                            </div>
                        )}
                        {caseSelected && (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div onClick={handleChangeCaseType} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '100px', padding: '8px 16px', cursor: 'pointer' }}>
                                    <span>{selectedCase.icon}</span>
                                    <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700' }}>{selectedCase.label}</span>
                                    <span style={{ fontSize: '10px', color: '#6366f1' }}>✎ Change</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '100px', padding: '8px 18px' }}>
                                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>AI ENGINE READY</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: '32px' }}>

                    {/* LIMIT REACHED */}
                    {limitReached && !generating && !reportData && (
                        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
                            <div style={{ fontSize: '60px', marginBottom: '24px' }}>🔒</div>
                            <div style={{ fontSize: '11px', color: '#f59e0b', letterSpacing: '3px', fontWeight: '700', marginBottom: '16px' }}>FREE LIMIT REACHED</div>
                            <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>5 Free Reports Use Ho Gaye!</div>
                            <div style={{ fontSize: '14px', color: '#475569', maxWidth: '440px', margin: '0 auto 40px', lineHeight: '1.8' }}>Aur reports generate karne ke liye plan upgrade karo.</div>
                            <button onClick={() => router.push('/payments')} style={{ padding: '16px 48px', borderRadius: '14px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: '15px', fontWeight: '900' }}>
                                View Plans & Upgrade →
                            </button>
                        </div>
                    )}

                    {/* CASE TYPE SELECTION */}
                    {!limitReached && !caseSelected && !generating && !reportData && (
                        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '6px 18px', borderRadius: '100px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
                                    <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: '700', letterSpacing: '3px' }}>SELECT CASE TYPE</span>
                                </div>
                                <div style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '20px', background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 40%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Type of Case</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {CASE_TYPES.map(ct => (
                                    <div key={ct.id} onClick={() => handleCaseSelect(ct.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', borderRadius: '16px', cursor: 'pointer', background: 'rgba(10,10,20,0.8)', border: '1px solid rgba(99,102,241,0.15)', transition: 'all 0.2s' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${ct.color}`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.08)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(99,102,241,0.15)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(10,10,20,0.8)' }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{ct.icon}</div>
                                        <div style={{ flex: 1 }}><div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{ct.label}</div></div>
                                        <div style={{ fontSize: '18px', color: '#334155' }}>→</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2 — DETAILS + UPLOAD */}
                    {!limitReached && caseSelected && !generating && !reportData && (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '100px', padding: '8px 20px' }}>
                                    <span style={{ fontSize: '20px' }}>{selectedCase.icon}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{selectedCase.label}</span>
                                    <span style={{ fontSize: '11px', color: '#6366f1', cursor: 'pointer', marginLeft: '4px' }} onClick={handleChangeCaseType}>← Change</span>
                                </div>
                            </div>

                            {/* CASE DETAILS SHEET */}
                            <div style={{ background: 'rgba(2,2,8,0.95)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '16px' }}>📋</span>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b', letterSpacing: '2px' }}>CASE DETAILS SHEET</div>
                                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>Fill all details — AI will use these as anchor points</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <label style={labelStyle}>BANK NAME *</label>
                                    <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Axis Bank Ltd., Ambawadi Branch, Ahmedabad" style={inputStyle} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={labelStyle}>APPLICANT NAME *</label>
                                        <input value={applicantNameInput} onChange={e => setApplicantNameInput(e.target.value)} placeholder="Full legal name(s) from AoS / Deed" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>CO-APPLICANT NAME (IF ANY)</label>
                                        <input value={coApplicantInput} onChange={e => setCoApplicantInput(e.target.value)} placeholder="Leave blank if none" style={inputStyle} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                    <div>
                                        <label style={labelStyle}>CURRENT OWNER NAME *</label>
                                        <input value={currentOwnerInput} onChange={e => setCurrentOwnerInput(e.target.value)} placeholder="As per latest registered deed" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>PROPERTY DESCRIPTION *</label>
                                        <input value={propertyDescInput} onChange={e => setPropertyDescInput(e.target.value)} placeholder="e.g. Shop No 5, ABC Bldg, Vastrapur, Ahmedabad" style={inputStyle} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px' }}>🧭</span>
                                        <label style={{ fontSize: '10px', color: '#6366f1', letterSpacing: '2px', fontWeight: '800', margin: 0 }}>PROPERTY BOUNDARIES</label>
                                        <span style={{ fontSize: '9px', color: '#334155', marginLeft: '4px' }}>(optional — fill if known)</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                                        {[
                                            { dir: 'EAST ↑', icon: '→', value: boundaryEast, set: setBoundaryEast, ph: 'East side boundary' },
                                            { dir: 'WEST', icon: '←', value: boundaryWest, set: setBoundaryWest, ph: 'West side boundary' },
                                            { dir: 'NORTH ↑', icon: '↑', value: boundaryNorth, set: setBoundaryNorth, ph: 'North side boundary' },
                                            { dir: 'SOUTH', icon: '↓', value: boundarySouth, set: setBoundarySouth, ph: 'South side boundary' },
                                        ].map((b, i) => (
                                            <div key={i}>
                                                <label style={boundaryLabelStyle}>{b.icon} {b.dir}</label>
                                                <input value={b.value} onChange={e => b.set(e.target.value)} placeholder={b.ph} style={{ ...inputStyle, border: '1px solid rgba(99,102,241,0.3)' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.15)' }}>
                                    <div style={{ fontSize: '10px', color: '#475569', lineHeight: '1.6' }}>
                                        💡 <strong style={{ color: '#6366f1' }}>Details Sheet</strong> — AI uses these as anchor points for precise report generation.
                                    </div>
                                </div>
                            </div>

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
                                        <button key={type} onClick={() => setSelectedType(type === selectedType ? '' : type)}
                                            style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: selectedType === type ? '1px solid #6366f1' : '1px solid rgba(99,102,241,0.2)', background: selectedType === type ? 'rgba(99,102,241,0.2)' : 'rgba(2,2,8,0.8)', color: selectedType === type ? '#fff' : '#475569' }}>
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
                                onClick={() => inputRef.current?.click()}>
                                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '20px', height: '20px', borderTop: '2px solid rgba(99,102,241,0.6)', borderLeft: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', borderTop: '2px solid rgba(99,102,241,0.6)', borderRight: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '20px', height: '20px', borderBottom: '2px solid rgba(99,102,241,0.6)', borderLeft: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '20px', height: '20px', borderBottom: '2px solid rgba(99,102,241,0.6)', borderRight: '2px solid rgba(99,102,241,0.6)' }} />

                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Drop property documents here</div>
                                <div style={{ fontSize: '12px', color: '#334155', marginBottom: '20px' }}>PDF · JPG · PNG — Sale Deed, EC, 7/12, NA Order — multiple files allowed</div>

                                {/* BUTTONS ROW */}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 28px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                                        📁 SELECT FILES
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); cameraRef.current?.click() }}
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 28px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                                        📸 TAKE PHOTO
                                    </button>
                                </div>

                                {/* Hidden file inputs */}
                                <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => e.target.files && addFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
                                {/* Camera capture input — opens camera on mobile */}
                                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={e => e.target.files && addFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
                            </div>

                            {/* FILE LIST */}
                            {files.length > 0 && (
                                <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>▣ DOCUMENTS — <span style={{ color: '#6366f1' }}>{files.length} files</span></div>
                                    {files.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)', marginBottom: '8px' }}>
                                            <div style={{ fontSize: '20px' }}>{f.name.match(/\.(jpg|jpeg|png|webp)$/i) ? '🖼️' : '📄'}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{f.name}</div>
                                                <div style={{ fontSize: '11px', color: '#334155' }}>{f.size} · {f.type}</div>
                                            </div>
                                            <div onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ fontSize: '16px', color: '#ef4444', cursor: 'pointer', padding: '4px 8px' }}>✕</div>
                                        </div>
                                    ))}
                                    {bankName && applicantNameInput && currentOwnerInput && propertyDescInput && (
                                        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px' }}>
                                            <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px' }}>✓ DETAILS SHEET READY</div>
                                            <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.8' }}>
                                                <span style={{ color: '#6366f1' }}>Bank:</span> {bankName} &nbsp;|&nbsp;
                                                <span style={{ color: '#6366f1' }}>Applicant:</span> {applicantNameInput} &nbsp;|&nbsp;
                                                <span style={{ color: '#6366f1' }}>Owner:</span> {currentOwnerInput}
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={handleGenerate} style={{ width: '100%', marginTop: '20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '12px', padding: '16px', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}>
                                        📋 GENERATE REPORT — {selectedCase.icon} {selectedCase.label}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* GENERATING */}
                    {generating && (
                        <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '48px 32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px', letterSpacing: '2px' }}>⚡ GENERATING LEGAL SCRUTINY REPORT...</div>
                            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '32px' }}>{selectedCase.icon} {selectedCase.label} — Deep legal analysis in progress</div>
                            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                                {steps.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '10px', background: i < step ? 'rgba(245,158,11,0.08)' : 'rgba(10,10,20,0.5)', border: `1px solid ${i < step ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.04)'}`, borderRadius: '12px', transition: 'all 0.3s' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i < step ? '#f59e0b' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: i < step ? '#000' : '#6b7280', fontWeight: '900', flexShrink: 0 }}>
                                            {i < step ? '✓' : s.step}
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: i < step ? '#f59e0b' : '#4b5563' }}>{s.title}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REPORT */}
                    {reportData && !generating && (
                        <div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button onClick={handleNewReport} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 20px', color: '#f59e0b', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>↺ NEW REPORT</button>
                                <button onClick={handleOpenTab} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', color: '#6366f1' }}>🔗 OPEN IN NEW TAB</button>
                                <button onClick={handlePrint} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: '#10b981', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>🖨️ PRINT / PDF</button>
                                <button onClick={handleWordDownload} style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>📄 DOWNLOAD WORD</button>
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
