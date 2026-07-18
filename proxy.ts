import { NextRequest, NextResponse } from 'next/server'
import { effectiveReportLimit } from '@/lib/adminConfig'

// ================================================================
// Server-side gate for /api/analyze — route.ts ko chhue bina.
// 1. Bina login (Bearer token) ke report generate NAHI hogi
// 2. Har user ka limit = app_metadata.report_limit (default 5) —
//    admin panel se per-user set hota hai; cross hone par 402
// 3. app_metadata.subscribed = true wale unlimited
// Client-side checks sirf UX hain; asli enforcement yahin hota hai.
// ================================================================

export const config = { matcher: '/api/analyze' }

function deny(status: number, error: string, code: string) {
    return NextResponse.json({ success: false, error, code }, { status })
}

export async function proxy(req: NextRequest) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!base || !anon || !service) {
        // Fail closed — env galat ho toh paywall bypass nahi hona chahiye
        return deny(503, 'Server configuration error. Thodi der baad try karo.', 'CONFIG_MISSING')
    }

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    if (!token) {
        return deny(401, 'Report generate karne ke liye pehle sign up / login karna zaroori hai.', 'LOGIN_REQUIRED')
    }

    const userRes = await fetch(`${base}/auth/v1/user`, {
        headers: { apikey: anon, Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) {
        return deny(401, 'Session expire ho gaya — dobara login karo.', 'SESSION_INVALID')
    }
    const user = await userRes.json()

    const meta = user.app_metadata || {}
    const expires = meta.subscription_expires ? Date.parse(meta.subscription_expires) : null
    const subscribed = meta.subscribed === true && (!expires || expires > Date.now())
    if (subscribed) return NextResponse.next()

    const limit = effectiveReportLimit(meta)

    const countRes = await fetch(
        `${base}/rest/v1/reports?select=id&user_id=eq.${user.id}&limit=1`,
        { headers: { apikey: service, Authorization: `Bearer ${service}`, Prefer: 'count=exact' } }
    )
    // count fail ho toh generate mat roko — limit check agli baar ho jayega
    if (countRes.ok) {
        const total = parseInt((countRes.headers.get('content-range') || '').split('/')[1] || '0', 10) || 0
        if (total >= limit) {
            return deny(402, `Aapki ${limit} reports ki limit khatam ho gayi hai. Aage generate karne ke liye subscription lo.`, 'FREE_LIMIT_REACHED')
        }
    }

    return NextResponse.next()
}
