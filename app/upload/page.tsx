'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ================================================================
// DOCUMENT TYPES
// ================================================================
const DOC_TYPES = [
    { id: 'auto', label: 'Auto Detect', color: '#6b7280' },
    { id: 'ec', label: 'Encumbrance Certificate (EC)', color: '#1B3A6B' },
    { id: 'release', label: 'Release / Reconveyance Deed', color: '#15803d' },
    { id: 'mortgage', label: 'Mortgage Deed', color: '#b91c1c' },
    { id: 'sale_deed', label: 'Sale Deed', color: '#0369a1' },
    { id: 'draft_deed', label: 'Draft Sale Deed / Banakhat', color: '#7c3aed' },
    { id: 'revenue', label: 'Revenue Record 7/12', color: '#a16207' },
    { id: 'na_order', label: 'NA Order', color: '#b45309' },
    { id: 'dev_perm', label: 'Development Permission', color: '#0f766e' },
    { id: 'rera', label: 'RERA Certificate', color: '#0284c7' },
    { id: 'oc', label: 'OC / Completion Certificate', color: '#be185d' },
    { id: 'other', label: 'Other', color: '#374151' },
]

// ================================================================
// CASE TYPES
// ================================================================
const CASE_TYPES = [
    { id: 'builder_purchase', label: 'Builder Purchase', icon: '🏗️' },
    { id: 'resale', label: 'Resale', icon: '🔄' },
    { id: 'bt', label: 'Balance Transfer', icon: '💳' },
    { id: 'seller_bt', label: 'Seller BT', icon: '🤝' },
    { id: 'lap', label: 'LAP', icon: '🏠' },
]

// ================================================================
// PDF TO IMAGES
// ================================================================
async function pdfToImages(file: File, docType: string): Promise<Array<{ data: string; mediaType: string; docType: string; fileName: string }>> {
    const MAX_PAGES = 3
    const SCALE = 1.6
    const MAX_PX = 1200
    const QUALITY = 0.85

    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const ab = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise
    const pages = Math.min(pdf.numPages, MAX_PAGES)
    const results = []

    for (let i = 1; i <= pages; i++) {
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: SCALE })
        const canvas = document.createElement('canvas')
        const scale2 = Math.min(1, MAX_PX / Math.max(vp.width, vp.height))
        canvas.width = Math.round(vp.width * scale2)
        canvas.height = Math.round(vp.height * scale2)
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: SCALE * scale2 }) }).promise
        const b64 = canvas.toDataURL('image/jpeg', QUALITY).split(',')[1]
        results.push({ data: b64, mediaType: 'image/jpeg', docType, fileName: file.name })
    }
    return results
}

async function imageToB64(file: File, docType: string): Promise<{ data: string; mediaType: string; docType: string; fileName: string }> {
    return new Promise((res) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const b64 = (e.target?.result as string).split(',')[1]
            res({ data: b64, mediaType: file.type || 'image/jpeg', docType, fileName: file.name })
        }
        reader.readAsDataURL(file)
    })
}

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function UploadPage() {
    const router = useRouter()

    // Step
    const [step, setStep] = useState<1 | 2>(1)
    const [caseType, setCaseType] = useState('builder_purchase')

    // Form fields
    const [bankName, setBankName] = useState('')
    const [applicantName, setApplicantName] = useState('')
    const [coApplicant, setCoApplicant] = useState('')
    const [currentOwner, setCurrentOwner] = useState('')
    const [propertyAddress, setPropertyAddress] = useState('')
    const [boundaryEast, setBoundaryEast] = useState('')
    const [boundaryWest, setBoundaryWest] = useState('')
    const [boundaryNorth, setBoundaryNorth] = useState('')
    const [boundarySouth, setBoundarySouth] = useState('')

    // Files
    const [files, setFiles] = useState<Array<{ file: File; docType: string; id: string }>>([])
    const [dragging, setDragging] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    // Status
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState('')
    const [error, setError] = useState('')

    // Add files
    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const arr = Array.from(newFiles)
        const valid = arr.filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'))
        setFiles(prev => [
            ...prev,
            ...valid.map(f => ({ file: f, docType: 'auto', id: Math.random().toString(36).slice(2) }))
        ])
    }, [])

    const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))
    const updateDocType = (id: string, dt: string) => setFiles(prev => prev.map(f => f.id === id ? { ...f, docType: dt } : f))

    // Drag
    const onDrag = (e: React.DragEvent, over: boolean) => { e.preventDefault(); setDragging(over) }
    const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }

    // Submit
    const handleSubmit = async () => {
        if (files.length === 0) { setError('Pehle documents upload karo'); return }
        if (!applicantName.trim()) { setError('Applicant name required'); return }

        setLoading(true)
        setError('')

        try {
            // Get user
            const { data: { user } } = await supabase.auth.getUser()

            // Convert all files to images with docType
            setProgress('Documents convert ho rahe hain...')
            const allImages: Array<{ data: string; mediaType: string; docType: string; fileName: string }> = []

            for (const f of files) {
                setProgress('Processing: ' + f.file.name)
                if (f.file.type === 'application/pdf') {
                    const imgs = await pdfToImages(f.file, f.docType)
                    allImages.push(...imgs)
                } else {
                    const img = await imageToB64(f.file, f.docType)
                    allImages.push(img)
                }
            }

            setProgress('AI analysis chal raha hai... (2-3 minutes)')

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: allImages,
                    caseType,
                    bankName: bankName || 'Bank',
                    loanType: CASE_TYPES.find(c => c.id === caseType)?.label || 'LAP',
                    applicantName,
                    coApplicant,
                    currentOwner,
                    propertyAddress,
                    boundaryEast,
                    boundaryWest,
                    boundaryNorth,
                    boundarySouth,
                    appId: 'AUTO-' + String(Math.floor(Math.random() * 999999)).padStart(6, '0'),
                    userId: user?.id || null,
                }),
            })

            const data = await res.json()

            if (!data.success) {
                setError('Error: ' + (data.error || 'Report generate nahi hua'))
                return
            }

            // Save to sessionStorage and redirect
            sessionStorage.setItem('reportHtml', data.report)
            sessionStorage.setItem('verdict', data.verdict || '')
            router.push('/report')

        } catch (e: any) {
            setError('Error: ' + (e.message || 'Something went wrong'))
        } finally {
            setLoading(false)
            setProgress('')
        }
    }

    // ================================================================
    // STYLES
    // ================================================================
    const S = {
        page: { minHeight: '100vh', background: '#0a0a0f', color: '#e8e8e8', fontFamily: 'Inter, sans-serif', padding: '0 0 60px 0' } as React.CSSProperties,
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid #1e1e2e', background: '#0a0a0f' } as React.CSSProperties,
        logo: { fontSize: 22, fontWeight: 800, color: '#4A90E2', letterSpacing: 1 } as React.CSSProperties,
        main: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' } as React.CSSProperties,
        h1: { fontSize: 26, fontWeight: 700, textAlign: 'center' as const, marginBottom: 8 },
        sub: { textAlign: 'center' as const, color: '#888', fontSize: 13, marginBottom: 32 },
        card: { background: '#111118', border: '1px solid #222230', borderRadius: 12, padding: '24px', marginBottom: 20 } as React.CSSProperties,
        label: { fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, display: 'block' },
        input: { width: '100%', background: '#0d0d18', border: '1px solid #2a2a3e', borderRadius: 8, padding: '10px 14px', color: '#e8e8e8', fontSize: 13, outline: 'none' } as React.CSSProperties,
        row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as React.CSSProperties,
        row4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 } as React.CSSProperties,
        btn: { padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 } as React.CSSProperties,
        primaryBtn: { background: '#4A90E2', color: '#fff', padding: '14px 32px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, width: '100%' } as React.CSSProperties,
        caseBtn: (active: boolean) => ({ padding: '12px 18px', borderRadius: 10, border: active ? '2px solid #4A90E2' : '2px solid #222230', background: active ? '#111a2e' : '#0d0d18', color: active ? '#4A90E2' : '#888', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }) as React.CSSProperties,
    }

    // ================================================================
    // STEP 1: Case Type
    // ================================================================
    if (step === 1) {
        return (
            <div style={S.page}>
                <div style={S.header}>
                    <div style={S.logo}>TITLEMATRIX<span style={{ color: '#fff' }}>AI</span></div>
                    <div style={{ fontSize: 12, color: '#888' }}>● SYSTEM ONLINE</div>
                </div>
                <div style={S.main}>
                    <div style={S.h1}>Document Upload &amp; Report</div>
                    <div style={S.sub}>Step 1 of 2 — Select Case Type</div>

                    <div style={S.card}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                            {CASE_TYPES.map(c => (
                                <button key={c.id} style={S.caseBtn(caseType === c.id)} onClick={() => setCaseType(c.id)}>
                                    <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                                    <div>{c.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button style={S.primaryBtn} onClick={() => setStep(2)}>
                        Continue → {CASE_TYPES.find(c => c.id === caseType)?.label}
                    </button>
                </div>
            </div>
        )
    }

    // ================================================================
    // STEP 2: Upload + Form
    // ================================================================
    return (
        <div style={S.page}>
            <div style={S.header}>
                <div style={S.logo}>TITLEMATRIX<span style={{ color: '#fff' }}>AI</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: '#1B3A6B', color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {CASE_TYPES.find(c => c.id === caseType)?.icon} {CASE_TYPES.find(c => c.id === caseType)?.label}
                        <span style={{ color: '#aaa', marginLeft: 8, cursor: 'pointer', fontSize: 11 }} onClick={() => setStep(1)}>✎ Change</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#22c55e' }}>● AI ENGINE READY</div>
                </div>
            </div>

            <div style={S.main}>
                <div style={S.h1}>Document Upload &amp; Report</div>
                <div style={S.sub}>Step 2 of 2 — Upload Documents &amp; Fill Details</div>

                {error && (
                    <div style={{ background: '#1a0808', border: '1px solid #b91c1c', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#fca5a5', fontSize: 13 }}>
                        ✕ {error}
                    </div>
                )}

                {/* ── UPLOAD AREA ── */}
                <div style={S.card}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#e8e8e8' }}>📎 Upload Documents</div>

                    <div
                        style={{ border: '2px dashed ' + (dragging ? '#4A90E2' : '#2a2a3e'), borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#0d1a2e' : '#0a0a0f', marginBottom: 16, transition: 'all 0.2s' }}
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => onDrag(e, true)}
                        onDragLeave={e => onDrag(e, false)}
                        onDrop={onDrop}
                    >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop property documents here</div>
                        <div style={{ color: '#888', fontSize: 12 }}>PDF · Images — Multiple files allowed · Max 3 pages per PDF</div>
                        <div style={{ marginTop: 16 }}>
                            <button style={{ ...S.btn, background: '#1B3A6B', color: '#fff' }} onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>+ SELECT FILES</button>
                        </div>
                    </div>

                    <input ref={fileRef} type="file" multiple accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => e.target.files && addFiles(e.target.files)} />

                    {/* FILE LIST */}
                    {files.length > 0 && (
                        <div>
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                                📁 DOCUMENTS — {files.length} files &nbsp;
                                <span style={{ color: '#4A90E2' }}>(Max 3 pages per PDF processed)</span>
                            </div>

                            {files.map(f => (
                                <div key={f.id} style={{ background: '#0d0d18', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>📄 {f.file.name}</div>
                                            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                                {(f.file.size / 1024).toFixed(0)} KB
                                            </div>
                                        </div>
                                        <button onClick={() => removeFile(f.id)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 18, padding: 0 }}>✕</button>
                                    </div>

                                    {/* DOCUMENT TYPE SELECTOR */}
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>📋 DOCUMENT TYPE:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                                        {DOC_TYPES.map(dt => (
                                            <button
                                                key={dt.id}
                                                onClick={() => updateDocType(f.id, dt.id)}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 20,
                                                    border: f.docType === dt.id ? '2px solid ' + dt.color : '1px solid #2a2a3e',
                                                    background: f.docType === dt.id ? dt.color + '22' : '#0a0a0f',
                                                    color: f.docType === dt.id ? dt.color : '#888',
                                                    cursor: 'pointer',
                                                    fontSize: 11,
                                                    fontWeight: f.docType === dt.id ? 700 : 400,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {f.docType === dt.id ? '✓ ' : ''}{dt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* EC TIP */}
                                    {f.docType === 'ec' && (
                                        <div style={{ marginTop: 8, padding: '6px 10px', background: '#0d1a2e', borderRadius: 6, fontSize: 11, color: '#60a5fa' }}>
                                            🔍 EC tagged — Deep scan: App No, Date, Period, Mortgage & Release detection
                                        </div>
                                    )}
                                    {f.docType === 'release' && (
                                        <div style={{ marginTop: 8, padding: '6px 10px', background: '#052e16', borderRadius: 6, fontSize: 11, color: '#4ade80' }}>
                                            ✅ Release Deed tagged — Will be matched to active mortgage automatically
                                        </div>
                                    )}
                                    {f.docType === 'mortgage' && (
                                        <div style={{ marginTop: 8, padding: '6px 10px', background: '#1a0808', borderRadius: 6, fontSize: 11, color: '#f87171' }}>
                                            ⚠️ Mortgage Deed tagged — Will check for corresponding release
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── FORM FIELDS ── */}
                <div style={S.card}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#e8e8e8' }}>📝 Case Details</div>

                    <div style={{ ...S.row2, marginBottom: 16 }}>
                        <div>
                            <label style={S.label}>Bank Name *</label>
                            <input style={S.input} value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Axis Bank, HDFC Bank" />
                        </div>
                        <div>
                            <label style={S.label}>Applicant Name *</label>
                            <input style={S.input} value={applicantName} onChange={e => setApplicantName(e.target.value)} placeholder="Proposed purchaser full name" />
                        </div>
                    </div>

                    <div style={{ ...S.row2, marginBottom: 16 }}>
                        <div>
                            <label style={S.label}>Co-Applicant</label>
                            <input style={S.input} value={coApplicant} onChange={e => setCoApplicant(e.target.value)} placeholder="Co-applicant name (if any)" />
                        </div>
                        <div>
                            <label style={S.label}>Current Owner / Developer</label>
                            <input style={S.input} value={currentOwner} onChange={e => setCurrentOwner(e.target.value)} placeholder="Builder / current owner name" />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={S.label}>Property Address / Description</label>
                        <textarea
                            style={{ ...S.input, minHeight: 70, resize: 'vertical' as const }}
                            value={propertyAddress}
                            onChange={e => setPropertyAddress(e.target.value)}
                            placeholder="Flat No., Block, Scheme, Survey No., Village, Taluka, District..."
                        />
                    </div>

                    {/* Boundaries */}
                    <div style={{ marginBottom: 8 }}>
                        <label style={S.label}>Property Boundaries (Optional — from documents)</label>
                        <div style={S.row4}>
                            <div>
                                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>East (Purva)</div>
                                <input style={S.input} value={boundaryEast} onChange={e => setBoundaryEast(e.target.value)} placeholder="East boundary" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>West (Pashchim)</div>
                                <input style={S.input} value={boundaryWest} onChange={e => setBoundaryWest(e.target.value)} placeholder="West boundary" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>North (Uttar)</div>
                                <input style={S.input} value={boundaryNorth} onChange={e => setBoundaryNorth(e.target.value)} placeholder="North boundary" />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>South (Dakshin)</div>
                                <input style={S.input} value={boundarySouth} onChange={e => setBoundarySouth(e.target.value)} placeholder="South boundary" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SUBMIT ── */}
                <button
                    style={{ ...S.primaryBtn, opacity: loading ? 0.7 : 1 }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <span>⏳ {progress || 'Processing...'}</span>
                    ) : (
                        <span>🔍 Generate Legal Scrutiny Report</span>
                    )}
                </button>

                {loading && (
                    <div style={{ textAlign: 'center', marginTop: 16, color: '#888', fontSize: 13 }}>
                        <div style={{ marginBottom: 8 }}>AI analyzing documents... This may take 2-3 minutes.</div>
                        <div style={{ color: '#4A90E2' }}>{progress}</div>
                    </div>
                )}
            </div>
        </div>
    )
}