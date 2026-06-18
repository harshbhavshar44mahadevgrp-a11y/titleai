// lib/generateReport.ts
export async function generateReport(payload: any): Promise<any> {
    const controller = new AbortController()

    // 270 second timeout (Vercel max is 300s)
    const timeoutId = setTimeout(() => controller.abort(), 270000)

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (res.status === 413) {
            throw new Error('Files too large. Please compress and try again.')
        }

        if (res.status === 504 || res.status === 502) {
            throw new Error('Server timeout. Please try with fewer or smaller documents.')
        }

        if (!res.ok) {
            let errMsg = `Server error (${res.status}). Please try again.`
            try {
                const errData = await res.json()
                if (errData?.error) errMsg = errData.error
            } catch { }
            throw new Error(errMsg)
        }

        const data = await res.json()

        if (!data.success) {
            throw new Error(data.error || 'Report generation failed. Please try again.')
        }

        return data

    } catch (err: any) {
        clearTimeout(timeoutId)

        if (err.name === 'AbortError') {
            throw new Error('Report generation timed out. Please try with fewer documents or try again.')
        }

        throw err
    }
}