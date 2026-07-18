import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const expected = process.env.ADMIN_PANEL_PASSWORD
    if (!expected) return NextResponse.json({ error: 'Admin password configured nahi hai' }, { status: 503 })
    if ((req.headers.get('x-admin-password') || '') !== expected) {
        return NextResponse.json({ error: 'Galat admin password' }, { status: 401 })
    }

    const { userId, limit } = await req.json()
    const n = parseInt(limit, 10)
    if (!userId || !Number.isFinite(n) || n < 0 || n > 1000000) {
        return NextResponse.json({ error: 'userId aur valid limit (0+) required' }, { status: 400 })
    }

    // Existing app_metadata preserve karke sirf report_limit update
    const { data: target, error: getErr } = await admin.auth.admin.getUserById(userId)
    if (getErr || !target.user) return NextResponse.json({ error: 'User nahi mila' }, { status: 404 })

    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        app_metadata: { ...(target.user.app_metadata || {}), report_limit: n },
    })
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    return NextResponse.json({ success: true, userId, limit: n })
}
