// lib/generateReport.ts

export async function generateReport(files: { base64: string; mediaType: string }[]) {

    // ═══════════════════════════════════
    // STEP 1 — Extract raw data
    // ═══════════════════════════════════
    console.log('Step 1: Extracting...')

    const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
    })

    // ── Better error handling ──
    if (!extractRes.ok) {
        const text = await extractRes.text()
        console.error('Extract API raw response:', text.substring(0, 500))
        if (extractRes.status === 413) {
            throw new Error('Files are too large. Please compress PDFs under 4MB each and try again.')
        }
        throw new Error(`Extraction failed (${extractRes.status}): ${text.substring(0, 200)}`)
    }

    const extractData = await extractRes.json()

    if (!extractData.success) {
        throw new Error('Extraction failed: ' + extractData.error)
    }

    console.log('Step 1 done. Tokens used:', extractData.tokens_used)

    // ═══════════════════════════════════
    // STEP 2 — Legal analysis
    // ═══════════════════════════════════
    console.log('Step 2: Legal analysis...')

    const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted: extractData.extracted }),
    })

    // ── Better error handling ──
    if (!analyzeRes.ok) {
        const text = await analyzeRes.text()
        console.error('Analyze API raw response:', text.substring(0, 500))
        if (analyzeRes.status === 413) {
            throw new Error('Request too large. Please reduce document size and try again.')
        }
        if (analyzeRes.status === 504 || analyzeRes.status === 408) {
            throw new Error('Analysis timed out. Please try again — large documents may take longer.')
        }
        throw new Error(`Analysis failed (${analyzeRes.status}): ${text.substring(0, 200)}`)
    }

    const analyzeData = await analyzeRes.json()

    if (!analyzeData.success) {
        throw new Error('Analysis failed: ' + analyzeData.error)
    }

    console.log('Step 2 done. Tokens used:', analyzeData.tokens_used)

    return {
        report: analyzeData.report,
        extracted: extractData.extracted,
        cost_breakdown: {
            step1_tokens: extractData.tokens_used,
            step2_tokens: analyzeData.tokens_used,
            cache_savings: analyzeData.tokens_used?.cache_read || 0,
        },
    }
}

// ═══════════════════════════════════
// File to Base64 helper
// ═══════════════════════════════════
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
