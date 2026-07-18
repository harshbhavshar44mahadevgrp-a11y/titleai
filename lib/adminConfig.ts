// Admin panel ka access sirf in emails ko hai.
// Server routes env ADMIN_EMAILS (comma-separated) se override kar sakte hain;
// ye list client (Sidebar) mein bhi use hoti hai sirf link dikhane ke liye —
// asli enforcement /api/admin routes mein server-side hota hai.
export const ADMIN_EMAILS = ['harshbhavshar44.mahadevgrp@gmail.com']

export function isAdminEmail(email: string | null | undefined, envList?: string) {
    if (!email) return false
    const list = envList
        ? envList.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
        : ADMIN_EMAILS.map(e => e.toLowerCase())
    return list.includes(email.trim().toLowerCase())
}

// Default free reports jab tak admin ne custom limit na di ho
export const DEFAULT_REPORT_LIMIT = 5

export function effectiveReportLimit(appMetadata: any): number {
    const raw = appMetadata?.report_limit
    const n = typeof raw === 'number' ? raw : parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_REPORT_LIMIT
}
