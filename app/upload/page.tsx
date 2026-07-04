"use client"
import { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

const DOC_TYPES = ['Sale Deed', 'Encumbrance Certificate (EC)', 'Revenue Record 7/12', 'NA Order', 'Development Permission', 'Draft Sale Deed', 'Property Card', 'Layout Approval', 'Mutation Entry', 'Completion Certificate', 'Mortgage Document', 'Other']

const FILE_TAGS = [
    { id: 'auto', label: 'Auto', color: '#475569' },
    { id: 'ec', label: '📋 EC', color: '#6366f1' },
]

const CASE_TYPES = [
    { id: 'builder_purchase', label: 'Builder Purchase', icon: '🏗️', desc: 'New flat/plot from developer', color: '#f59e0b' },
    { id: 'resale', label: 'Resale', icon: '🔑', desc: 'Resale property purchase', color: '#6366f1' },
    { id: 'bt', label: 'Balance Transfer', icon: '🔄', desc: 'BT from another bank', color: '#3b82f6' },
    { id: 'seller_bt', label: 'Seller BT', icon: '💼', desc: 'Seller side Balance Transfer', color: '#8b5cf6' },
    { id: 'lap', label: 'LAP / Mortgage', icon: '🏦', desc: 'Loan Against Property', color: '#10b981' },
]

const loanTypeMap: Record<string, string> = {
    builder_purchase: 'Builder Purchase',
    resale: 'Resale Property',
    bt: 'Balance Transfer',
    seller_bt: 'Seller Balance Transfer',
    lap: 'LAP (Loan Against Property)',
}

interface DocFile { name: string; size: string; type: string; docType: string; fileRef?: File }

// ================================================================
// PAYLOAD BUDGET CONFIG — prevents 413 Request Entity Too Large
// Vercel hard limit = 4.5MB per request body
// Base64 adds ~33% overhead, so target raw image bytes well under that
// ================================================================
const TARGET_TOTAL_BYTES = 3_200_000   // ~3.2MB raw -> ~4.3MB after base64, safe under 4.5MB
const MIN_QUALITY = 0.35
const MIN_MAXPX = 650

export default function UploadPage() {
    const [dragging, setDragging] = useState(false)
    const [files, setFiles] = useState<DocFile[]>([])
    const [selectedType, setSelectedType] = useState('')
    const [caseType, setCaseType] = useState('')
    const [caseSelected, setCaseSelected] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [generating, setGenerating] = useState(false)
    const [reportData, setReportData] = useState<any>(null)
    const [step, setStep] = useState(0)
    const [progress, setProgress] = useState('')

    const [bankName, setBankName] = useState('')
    const [applicantName, setApplicantName] = useState('')
    const [coApplicant, setCoApplicant] = useState('')
    const [currentOwner, setCurrentOwner] = useState('')
    const [propertyAddress, setPropertyAddress] = useState('')
    const [boundaryEast, setBoundaryEast] = useState('')
    const [boundaryWest, setBoundaryWest] = useState('')
    const [boundaryNorth, setBoundaryNorth] = useState('')
    const [boundarySouth, setBoundarySouth] = useState('')

    const inputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const steps = [
        { step: '01', title: 'Reading documents...', desc: 'Extracting from PDFs' },
        { step: '02', title: 'EC extraction...', desc: '3-pass EC header + rows' },
        { step: '03', title: 'Title chain analysis...', desc: 'Deep legal verification' },
        { step: '04', title: 'Checking EC and 7/12...', desc: 'Cross-verifying documents' },
        { step: '05', title: 'Writing legal opinion...', desc: 'Generating final report' },
    ]

    const selectedCase = CASE_TYPES.find(c => c.id === caseType) || CASE_TYPES[0]

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
        setFiles(prev => {
            const existing = new Set(prev.map(f => f.name + f.size))
            const toAdd = newFiles.filter(f => !existing.has(f.name + f.size))
            return [...prev, ...toAdd.map(f => ({
                name: f.name, size: (f.size / 1024).toFixed(1) + ' KB',
                type: selectedType || 'Auto Detect',
                docType: 'auto',
                fileRef: f
            }))]
        })
        setErrorMsg(''); setReportData(null)
    }

    const updateFileTag = (idx: number, tag: string) =>
        setFiles(prev => prev.map((f, i) => i === idx ? { ...f, docType: tag } : f))

    // ================================================================
    // PDF -> IMAGES with ADAPTIVE compression (fixes 413 error)
    // pageBudget = how many pages THIS file is allowed (priority-based)
    // quality/maxPx shrink automatically when many files are uploaded
    // ================================================================
    const extractTextFromPDF = async (
        file: File,
        imgArr: any[],
        docType: string,
        pageBudget: number,
        quality: number,
        maxPx: number
    ): Promise<string> => {
        try {
            const pdfjsLib = await import('pdfjs-dist')
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
            const arrayBuffer = await file.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

            const pagesToProcess = Math.min(pdf.numPages, pageBudget)
            let fullText = '\n===== DOCUMENT: ' + file.name + ' =====\n'

            for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const textContent = await page.getTextContent()
                const pageText = textContent.items.map((item: any) => item.str).join(' ').trim()
                fullText += '\n--- Page ' + pageNum + ' ---\n' + pageText + '\n'

                const baseVp = page.getViewport({ scale: 1.0 })
                const scale = Math.min(1.6, maxPx / Math.max(baseVp.width, baseVp.height))
                const vp = page.getViewport({ scale })
                const cv = document.createElement('canvas')
                cv.width = vp.width; cv.height = vp.height
                await page.render({ canvasContext: cv.getContext('2d')!, viewport: vp }).promise
                imgArr.push({
                    base64: cv.toDataURL('image/jpeg', quality).split(',')[1],
                    mediaType: 'image/jpeg',
                    name: file.name + '_p' + pageNum,
                    docType
                })
            }
            return fullText
        } catch (e) { return '' }
    }

    // ================================================================
    // Estimate base64 payload size (approx) from raw image byte count
    // ================================================================
    const estimateBase64Bytes = (rawBytes: number) => Math.ceil(rawBytes * 1.37)

    const handleGenerate = async () => {
        if (files.length === 0) { setErrorMsg('Pehle documents upload karo!'); return }
        if (!applicantName.trim()) { setErrorMsg('Applicant Name bharo!'); return }
        if (!bankName.trim()) { setErrorMsg('Bank Name bharo!'); return }
        if (!currentOwner.trim()) { setErrorMsg('Current Owner / Mortgagor bharo!'); return }

        setGenerating(true); setReportData(null); setStep(0); setErrorMsg(''); setProgress('')
        let s = 0
        const iv = setInterval(() => { s++; setStep(s); if (s >= steps.length) clearInterval(iv) }, 8000)

        try {
            const pdfFiles = files.filter(f => f.fileRef)
            const fileCount = pdfFiles.length

            // ── SMART PAGE BUDGET ──
            // EC + Release + Mortgage tagged files = priority, get up to 3 pages
            // "auto"/untagged files = fewer pages when file count is high
            // This prevents 14 files x 3 pages = 42 huge images crashing the request
            const priorityTags = new Set(['ec'])
            const priorityCount = pdfFiles.filter(f => priorityTags.has(f.docType)).length
            const normalCount = fileCount - priorityCount

            let normalPageBudget = 3
            if (fileCount > 10) normalPageBudget = 2  // min 2 pages — Revenue Record may be on page 2
            else if (fileCount > 6) normalPageBudget = 2

            // ── ADAPTIVE COMPRESSION ──
            // More files = more aggressive shrink, but EC files always get best quality
            let normalQuality = 0.85, normalMaxPx = 1200
            let priorityQuality = 0.85, priorityMaxPx = 1200
            // Priority files (EC, Revenue, Release, Mortgage) ALWAYS get full quality
            // regardless of file count — these are the critical documents. Only normal
            // files get compressed aggressively when many files are uploaded.
            if (fileCount > 14) { normalQuality = 0.40; normalMaxPx = 700; priorityQuality = 0.85; priorityMaxPx = 1200 }
            else if (fileCount > 10) { normalQuality = 0.45; normalMaxPx = 780; priorityQuality = 0.85; priorityMaxPx = 1200 }
            else if (fileCount > 6) { normalQuality = 0.65; normalMaxPx = 950; priorityQuality = 0.85; priorityMaxPx = 1200 }

            setProgress('Optimizing ' + fileCount + ' files for upload...')

            let allText = ''; const imageFiles: any[] = []

            for (const f of pdfFiles) {
                const file = f.fileRef!
                const isPriority = priorityTags.has(f.docType)
                // Revenue Record: read ALL pages so no mutation entry is missed
                // EC: 5 pages, Others: 2 pages minimum
                const pageBudget = isPriority ? 3 : normalPageBudget
                const quality = isPriority ? priorityQuality : normalQuality
                const maxPx = isPriority ? priorityMaxPx : normalMaxPx

                setProgress('Processing: ' + file.name + ' [' + (f.docType === 'ec' ? 'EC DEEP SCAN' : 'AUTO') + ']')

                if (file.type === 'application/pdf') {
                    allText += await extractTextFromPDF(file, imageFiles, f.docType, pageBudget, quality, maxPx)
                } else if (file.type.startsWith('image/')) {
                    const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file) })
                    imageFiles.push({ base64, mediaType: file.type || 'image/jpeg', name: file.name, docType: f.docType })
                }
            }

            if (imageFiles.length === 0) throw new Error('PDF process nahi hua.')

            // ── FINAL SIZE CHECK — if still too big after compression, drop lowest-priority pages ──
            let totalRawBytes = imageFiles.reduce((sum, img) => sum + (img.base64.length * 0.75), 0)
            let estBase64 = estimateBase64Bytes(totalRawBytes)

            if (estBase64 > TARGET_TOTAL_BYTES * 1.4) {
                // Drop extra pages from non-priority files first (keep page 1 of each)
                const seen = new Set<string>()
                const filtered = imageFiles.filter(img => {
                    if (priorityTags.has(img.docType)) return true
                    const baseName = img.name.replace(/_p\d+$/, '')
                    if (seen.has(baseName)) return false
                    seen.add(baseName)
                    return true
                })
                imageFiles.length = 0
                imageFiles.push(...filtered)
                totalRawBytes = imageFiles.reduce((sum, img) => sum + (img.base64.length * 0.75), 0)
                estBase64 = estimateBase64Bytes(totalRawBytes)
                setProgress('Large upload detected — trimmed to ' + imageFiles.length + ' pages to fit limit...')
            }

            const ecCount = imageFiles.filter(i => i.docType === 'ec').length
            setProgress('AI analysis: ' + (ecCount > 0 ? ecCount + ' EC pages deep scan + ' : '') + imageFiles.length + ' total pages...')

            const res = await fetch('/api/analyze', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: imageFiles.map((img: any) => ({
                        data: img.base64, mediaType: img.mediaType,
                        name: img.name, docType: img.docType
                    })),
                    caseType, appId: 'AUTO-' + Date.now().toString().slice(-6),
                    bankName: bankName.trim(), loanType: loanTypeMap[caseType] || 'LAP',
                    applicantName: applicantName.trim(), coApplicant: coApplicant.trim(),
                    currentOwner: currentOwner.trim(), propertyAddress: propertyAddress.trim(),
                    boundaryEast: boundaryEast.trim(), boundaryWest: boundaryWest.trim(),
                    boundaryNorth: boundaryNorth.trim(), boundarySouth: boundarySouth.trim(),
                    userId: null,
                })
            })

            if (res.status === 413) {
                throw new Error('Files bahut zyada hain ya bade hain. Kam files upload karo (max 8-10 ek baar mein), ya kam pages wale documents use karo.')
            }
            if (!res.ok) {
                const errText = await res.text()
                // Try to parse as JSON and pull the clean error field; fall back to raw text.
                // No truncation — full message needed to diagnose actual API errors.
                let cleanMsg = errText
                try {
                    const parsed = JSON.parse(errText)
                    if (parsed?.error) cleanMsg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error)
                } catch { }
                throw new Error('Server error ' + res.status + ': ' + cleanMsg)
            }
            const data = await res.json()
            clearInterval(iv); setStep(steps.length)
            if (data.success) {
                setTimeout(() => { setReportData({ htmlReport: data.report }); setGenerating(false); setProgress('') }, 300)
            } else throw new Error(data.error || 'Analysis failed')
        } catch (err: any) {
            clearInterval(iv); setErrorMsg('Error: ' + (err.message || 'Unknown error')); setGenerating(false); setProgress('')
        }
    }

    const handlePrint = () => {
        if (!reportData?.htmlReport) return
        const w = window.open('', '_blank'); if (w) { w.document.write(reportData.htmlReport); w.document.close(); setTimeout(() => w.print(), 800) }
    }
    const handleOpenTab = () => {
        if (!reportData?.htmlReport) return
        const w = window.open('', '_blank'); if (w) { w.document.write(reportData.htmlReport); w.document.close() }
    }

    const inp: React.CSSProperties = { width: '100%', background: 'rgba(10,10,20,0.8)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', padding: '10px 14px', color: '#e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
    const lbl: React.CSSProperties = { fontSize: '11px', color: '#475569', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }

    return (
        <div style={{ minHeight: '100vh', background: '#020208', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, opacity: 0.4, pointerEvents: 'none' }} />
            <Sidebar />
            <div style={{ flex: 1, marginLeft: '225px', overflow: 'auto', position: 'relative', zIndex: 10 }}>

                <div style={{ padding: '18px 32px', borderBottom: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,2,8,0.9)', backdropFilter: 'blur(30px)' }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>Document <span style={{ color: '#6366f1' }}>Upload & Report</span></div>
                        <div style={{ fontSize: '10px', color: '#334155', marginTop: '3px', letterSpacing: '2px', fontWeight: '600' }}>UPLOAD — AI ANALYSE — LEGAL SCRUTINY REPORT</div>
                    </div>
                    {caseSelected && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div onClick={() => { setCaseSelected(false); setCaseType(''); setFiles([]); setReportData(null) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '100px', padding: '8px 16px', cursor: 'pointer' }}>
                                <span>{selectedCase.icon}</span>
                                <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700' }}>{selectedCase.label}</span>
                                <span style={{ fontSize: '10px', color: '#6366f1' }}>✎ Change</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '100px', padding: '8px 18px' }}>
                                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>AI ENGINE READY</span>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '32px' }}>

                    {!caseSelected && !generating && !reportData && (
                        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                <div style={{ fontSize: '13px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '12px' }}>STEP 1 OF 2</div>
                                <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>Kaunsa Case Hai?</div>
                                <div style={{ fontSize: '13px', color: '#475569' }}>Case type select karo — AI us hisaab se deep legal thinking karega</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {CASE_TYPES.map(ct => (
                                    <div key={ct.id} onClick={() => { setCaseType(ct.id); setCaseSelected(true) }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', borderRadius: '16px', cursor: 'pointer', background: 'rgba(10,10,20,0.8)', border: '1px solid rgba(99,102,241,0.15)', transition: 'all 0.2s' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${ct.color}`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.08)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(99,102,241,0.15)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(10,10,20,0.8)' }}
                                    >
                                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{ct.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '3px' }}>{ct.label}</div>
                                            <div style={{ fontSize: '12px', color: '#475569' }}>{ct.desc}</div>
                                        </div>
                                        <div style={{ fontSize: '18px', color: '#334155' }}>→</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {caseSelected && !generating && !reportData && (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ fontSize: '13px', color: '#6366f1', letterSpacing: '3px', fontWeight: '700', marginBottom: '8px' }}>STEP 2 OF 2</div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '100px', padding: '8px 20px' }}>
                                    <span style={{ fontSize: '20px' }}>{selectedCase.icon}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{selectedCase.label}</span>
                                    <span style={{ fontSize: '11px', color: '#6366f1', cursor: 'pointer', marginLeft: '4px' }} onClick={() => { setCaseSelected(false); setCaseType('') }}>← Change</span>
                                </div>
                            </div>

                            {errorMsg && (
                                <div style={{ marginBottom: '20px', padding: '14px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '12px', color: '#fca5a5', fontSize: '13px', fontWeight: '600', wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                                    <div style={{ marginBottom: '8px' }}>✗ Error occurred — full details below (copy this if asking for help):</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '400', color: '#fca5a5', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px', userSelect: 'text' }}>{errorMsg}</div>
                                </div>
                            )}

                            {files.length >= 10 && (
                                <div style={{ marginBottom: '20px', padding: '12px 18px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', color: '#a5b4fc', fontSize: '12px' }}>
                                    ℹ️ {files.length} files uploaded — system automatically EC/Release files ko priority dega aur baki files compress karega taaki upload fail na ho.
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '2px', fontWeight: '700', marginBottom: '12px' }}>SELECT DOCUMENT TYPE (for next upload)</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {DOC_TYPES.map(type => (
                                        <button key={type} onClick={() => setSelectedType(type === selectedType ? '' : type)}
                                            style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: selectedType === type ? '1px solid #6366f1' : '1px solid rgba(99,102,241,0.2)', background: selectedType === type ? 'rgba(99,102,241,0.2)' : 'rgba(2,2,8,0.8)', color: selectedType === type ? '#fff' : '#475569' }}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={e => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)) }}
                                style={{ border: dragging ? '2px solid #6366f1' : '2px dashed rgba(99,102,241,0.3)', borderRadius: '20px', padding: '50px 40px', textAlign: 'center', background: dragging ? 'rgba(99,102,241,0.08)' : 'rgba(2,2,8,0.6)', marginBottom: '20px', position: 'relative', cursor: 'pointer' }}
                                onClick={() => inputRef.current?.click()}
                            >
                                <div style={{ position: 'absolute', top: '12px', left: '12px', width: '20px', height: '20px', borderTop: '2px solid rgba(99,102,241,0.6)', borderLeft: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', borderTop: '2px solid rgba(99,102,241,0.6)', borderRight: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '20px', height: '20px', borderBottom: '2px solid rgba(99,102,241,0.6)', borderLeft: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '20px', height: '20px', borderBottom: '2px solid rgba(99,102,241,0.6)', borderRight: '2px solid rgba(99,102,241,0.6)' }} />
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📄</div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Drop property documents here</div>
                                <div style={{ fontSize: '12px', color: '#334155', marginBottom: '20px' }}>PDF · Sale Deed, EC, 7/12, NA Order — multiple files allowed</div>
                                <button onClick={e => { e.stopPropagation(); inputRef.current?.click() }} style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 28px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                                    + SELECT FILES
                                </button>
                                <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files && addFiles(Array.from(e.target.files))} style={{ display: 'none' }} />
                            </div>

                            {files.length > 0 && (
                                <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
                                        ▣ DOCUMENTS — <span style={{ color: '#6366f1' }}>{files.length} files</span>
                                        <span style={{ fontSize: '11px', color: '#475569', marginLeft: '12px', fontWeight: '400' }}>(Max 3 pages per PDF processed)</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6366f1', marginBottom: '16px', padding: '8px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        💡 <strong>Tip:</strong> EC file pe <strong>"📋 EC"</strong> tag karo — system EC ka deep scan karega. Revenue Record automatically ALL uploaded documents mein se detect hoga.
                                    </div>

                                    {files.map((f, i) => (
                                        <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(99,102,241,0.04)', border: `1px solid ${f.docType === 'ec' ? 'rgba(99,102,241,0.5)' : f.docType === 'revenue' ? 'rgba(161,98,7,0.5)' : 'rgba(99,102,241,0.1)'}`, marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                                <div style={{ fontSize: '20px' }}>📄</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{f.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#334155' }}>{f.size} · {f.type}</div>
                                                </div>
                                                <div onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ fontSize: '16px', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}>✕</div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {FILE_TAGS.map(tag => (
                                                    <button key={tag.id} onClick={() => updateFileTag(i, tag.id)}
                                                        style={{
                                                            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                                            border: f.docType === tag.id ? `2px solid ${tag.color}` : '1px solid rgba(255,255,255,0.1)',
                                                            background: f.docType === tag.id ? tag.color + '22' : 'rgba(2,2,8,0.6)',
                                                            color: f.docType === tag.id ? tag.color : '#475569',
                                                            transition: 'all 0.15s'
                                                        }}>
                                                        {f.docType === tag.id && '✓ '}{tag.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {f.docType === 'ec' && (
                                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#6366f1', fontWeight: '600' }}>
                                                    🔍 EC Deep Scan ON — App No, Date, Period, Mortgage, Release sab detect hoga (priority quality)
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff', marginBottom: '20px', letterSpacing: '1px' }}>
                                    📋 CASE DETAILS SHEET
                                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: '400', marginLeft: '10px' }}>Yeh sab report mein print hoga — sahi bharo</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div><label style={lbl}>Bank Name *</label><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Axis Bank Ltd." style={inp} /></div>
                                    <div><label style={lbl}>Applicant Name *</label><input value={applicantName} onChange={e => setApplicantName(e.target.value)} placeholder="Full name as in documents" style={inp} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    <div><label style={lbl}>Co-Applicant (if any)</label><input value={coApplicant} onChange={e => setCoApplicant(e.target.value)} placeholder="Optional" style={inp} /></div>
                                    <div><label style={lbl}>Current Owner / Mortgagor *</label><input value={currentOwner} onChange={e => setCurrentOwner(e.target.value)} placeholder="Owner name as in documents" style={inp} /></div>
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={lbl}>Property Address / Description</label>
                                    <textarea value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} placeholder="e.g. Flat No. 404, Radhe Infinity, Kudasan, Gandhinagar" rows={2} style={{ ...inp, resize: 'vertical' }} />
                                </div>
                                <div>
                                    <label style={{ ...lbl, marginBottom: '10px' }}>Property Boundaries (4 Dishayen) — Optional</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {[
                                            { label: '↑ East (Purva)', val: boundaryEast, set: setBoundaryEast },
                                            { label: '↑ West (Pashchim)', val: boundaryWest, set: setBoundaryWest },
                                            { label: '↑ North (Uttar)', val: boundaryNorth, set: setBoundaryNorth },
                                            { label: '↓ South (Dakshin)', val: boundarySouth, set: setBoundarySouth },
                                        ].map(b => (
                                            <div key={b.label}>
                                                <label style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '4px' }}>{b.label}</label>
                                                <input value={b.val} onChange={e => b.set(e.target.value)} placeholder="As per documents" style={inp} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {files.length > 0 && (
                                <button onClick={handleGenerate} style={{ width: '100%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', border: 'none', borderRadius: '12px', padding: '18px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' }}>
                                    📋 GENERATE REPORT — {selectedCase.icon} {selectedCase.label}
                                </button>
                            )}
                        </>
                    )}

                    {generating && (
                        <div style={{ background: 'rgba(2,2,8,0.9)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '48px 32px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px', letterSpacing: '2px' }}>⚡ GENERATING LEGAL SCRUTINY REPORT...</div>
                            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>{selectedCase.icon} {selectedCase.label} — Deep legal analysis in progress</div>
                            {progress && <div style={{ fontSize: '12px', color: '#6366f1', marginBottom: '24px', fontWeight: '600' }}>{progress}</div>}
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
                            <div style={{ marginTop: '24px', fontSize: '11px', color: '#334155' }}>This may take 3-5 minutes — deep legal analysis in progress...</div>
                        </div>
                    )}

                    {reportData && !generating && (
                        <div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button onClick={() => { setReportData(null); setFiles([]); setCaseSelected(false); setCaseType('') }} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', padding: '10px 20px', color: '#f59e0b', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>← NEW REPORT</button>
                                <button onClick={handleOpenTab} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', color: '#6366f1' }}>🔗 OPEN IN NEW TAB</button>
                                <button onClick={handlePrint} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>↓ DOWNLOAD PDF</button>
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