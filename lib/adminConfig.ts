// Admin panel ka access ADMIN_PANEL_PASSWORD env se hota hai (/admin par password screen);
// yahan sirf report-limit ka shared logic hai jo proxy, upload page aur admin API use karte hain.

// Default free reports jab tak admin ne custom limit na di ho
export const DEFAULT_REPORT_LIMIT = 5

export function effectiveReportLimit(appMetadata: any): number {
    const raw = appMetadata?.report_limit
    const n = typeof raw === 'number' ? raw : parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_REPORT_LIMIT
}
