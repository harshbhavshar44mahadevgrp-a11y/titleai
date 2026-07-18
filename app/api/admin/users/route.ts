import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { effectiveReportLimit } from '@/lib/adminConfig'

const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Password-based admin access — /admin page x-admin-password header bhejta hai
function checkAdminPassword(req: NextRequest): NextResponse | null {
    const expected = process.env.ADMIN_PANEL_PASSWORD
    if (!expected) return NextResponse.json({ error: 'Admin password configured nahi hai' }, { status: 503 })
    const given = req.headers.get('x-admin-password') || ''
    if (given !== expected) return NextResponse.json({ error: 'Galat admin password' }, { status: 401 })
    return null
}

export async function GET(req: NextRequest) {
    const denied = checkAdminPassword(req)
    if (denied) return denied

    // Saare registered users (1000 tak — abhi ke scale ke liye kaafi)
    const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

    // Har user ki report count
    const { data: reportRows, error: repErr } = await admin
        .from('reports')
        .select('user_id')
    if (repErr) return NextResponse.json({ error: repErr.message }, { status: 500 })

    const counts: Record<string, number> = {}
    for (const r of reportRows || []) counts[r.user_id] = (counts[r.user_id] || 0) + 1

    const users = usersData.users.map(u => {
        const meta: any = u.app_metadata || {}
        const limit = effectiveReportLimit(meta)
        const used = counts[u.id] || 0
        return {
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            used,
            limit,
            left: Math.max(0, limit - used),
            subscribed: meta.subscribed === true,
        }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ success: true, users, totalReports: (reportRows || []).length })
}
