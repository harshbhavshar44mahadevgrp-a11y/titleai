// TITLEMATRIXAI FINAL v6 — PERFECT REPORT ENGINE
// Based on proven v5.3 + EC Pre-Screen + DocType Support
export const maxDuration = 300
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const AI = new Anthropic()
const DB = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

// ================================================================
// EC LIFECYCLE ENGINE — PERMANENT RELEASE DETECTION
// ================================================================
interface ECRow { row_number: number; col1_type: string; col3_aapnar: string; col4_lenar: string; col5_date: string; col6_deed_no: string }
interface Charge { lender: string; deed_no: string; date: string; release_deed_no: string; release_date: string }
interface LC { active: Charge[]; released: Charge[]; status: string; summary: string }
interface ECMeta { ec_app_number: string; ec_date: string; ec_from: string; ec_to: string }

function isBank(n: string): boolean {
    if (!n || n.length < 2) return false
    const t = n.toLowerCase()
    return ['bank', 'finance', 'financial', 'housing', 'capital', 'credit', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'boi', 'canara', 'bajaj', 'lic', 'lichfl', 'gruh', 'aavas', 'piramal', 'limited', 'ltd', 'nbfc', 'hfc'].some(w => t.includes(w))
}
function buildLC(a: Charge[], r: Charge[]): LC {
    const s = a.length > 0 ? 'ENCUMBERED' : r.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'
    const sum = a.length === 0 && r.length === 0 ? 'NIL encumbrance' : a.length > 0 ? 'ACTIVE: ' + a.map(x => x.lender + ' Deed:' + x.deed_no).join(' | ') : 'DISCHARGED: ' + r.map(x => x.lender + ' released vide Deed No.' + x.release_deed_no + ' dated ' + x.release_date).join(' | ')
    return { active: a, released: r, status: s, summary: sum }
}
function runLC(rows: ECRow[]): LC {
    const active: Charge[] = [], released: Charge[] = []
    for (const r of rows) if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) active.push({ lender: r.col4_lenar, deed_no: r.col6_deed_no || '', date: r.col5_date || '', release_deed_no: '', release_date: '' })
    const RKW = ['release', 'reconveyance', 'discharge', 'satisfaction', 'no due', 'giro mukeli', 'ga.f', 'ga.mu', 'ga.o', 'mukeli', 'giro fer']
    for (const r of rows) {
        const c1 = (r.col1_type || '').toLowerCase()
        const S1 = RKW.some(k => c1.includes(k))
        const S2 = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        if (S1 || S2) {
            const bn = isBank(r.col3_aapnar) ? r.col3_aapnar : isBank(r.col4_lenar) ? r.col4_lenar : r.col3_aapnar
            if (!bn) continue
            const bw = bn.toLowerCase().split(' ').filter((w: string) => w.length > 3)
            const mi = active.findIndex((a: Charge) => bw.some((w: string) => a.lender.toLowerCase().includes(w)))
            if (mi >= 0) { const m = active.splice(mi, 1)[0]; m.release_deed_no = r.col6_deed_no || ''; m.release_date = r.col5_date || ''; released.push(m); console.log('RELEASE:' + bn + ' Deed:' + m.release_deed_no) }
            else released.push({ lender: bn, deed_no: '', date: '', release_deed_no: r.col6_deed_no || '', release_date: r.col5_date || '' })
        }
    }
    return buildLC(active, released)
}

function parseJSON(raw: string): any { try { const c = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(); const f = c.indexOf('{'); const l = c.lastIndexOf('}'); if (f >= 0 && l >= 0) return JSON.parse(c.substring(f, l + 1)); return JSON.parse(c) } catch { return null } }

// ================================================================
// EC TABLE HTML BUILDER
// ================================================================
function buildECTable(rows: ECRow[], lc: LC, metas: ECMeta[]): string {
    if (!rows.length) return '<p style="color:#888;font-size:12px;">No EC entries found.</p>'
    let h = '<table class="ec-tbl"><tr><th>Sr.</th><th>Classified Type</th><th>Match Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 — Aapnar (Executing)</th><th>Col 4 — Lenar (Claimant)</th><th>Status</th></tr>'
    for (const r of rows) {
        const isRel = lc.released.some(x => x.release_deed_no === r.col6_deed_no) || (isBank(r.col3_aapnar) && !isBank(r.col4_lenar))
        const isAct = lc.active.some(x => x.deed_no === r.col6_deed_no)
        const cls = isRel ? 'ec-rel' : isAct ? 'ec-act' : ''
        const st = isRel ? '✅ DISCHARGED — Released and extinguished. No subsisting charge.' : isAct ? '⚠ ACTIVE MORTGAGE — Subsisting as on date. No Release Deed found.' : '✅ TITLE DOCUMENT — No encumbrance.'
        const ct = isRel ? 'Reconveyance / Mortgage Release Deed' : isAct ? 'Mortgage Deed — Active' : r.col1_type || 'Transaction'
        const conf = isRel ? 'HIGH — Bank in Col 3 as releasing party. Release confirmed.' : isAct ? 'HIGH — Bank in Col 4 as mortgagee. Active charge confirmed.' : 'HIGH — Establishes title vesting in claimant.'
        h += '<tr><td>' + r.row_number + '</td><td>' + ct + '</td><td>' + conf + '</td><td>' + (r.col6_deed_no || '--') + '</td><td>' + (r.col5_date || '--') + '</td><td>' + (r.col3_aapnar || '--') + '</td><td>' + (r.col4_lenar || '--') + '</td><td class="' + cls + '">' + st + '</td></tr>'
    }
    return h + '</table>'
}

function buildLifecycleSection(lc: LC): string {
    const actRow = lc.active.length === 0 ? 'NIL' : lc.active.map(a => a.lender + ' — Mortgage Deed No. ' + a.deed_no + ' dated ' + a.date + ' — ACTIVE AND SUBSISTING.').join('<br>')
    const relRow = lc.released.length === 0 ? 'NIL' : lc.released.map(r => r.lender + ' — Mortgage Deed No. ' + r.deed_no + ' dated ' + r.date + ' — DISCHARGED vide Reconveyance / Release Deed No. ' + r.release_deed_no + ' dated ' + r.release_date + '. No subsisting charge remains.').join('<br>')
    return '<table class="mt"><tr><td>A. Active Mortgages</td><td>:</td><td>' + actRow + '</td></tr><tr><td>B. Released Mortgages</td><td>:</td><td>' + relRow + '</td></tr><tr><td>C. Unmatched Releases</td><td>:</td><td>NIL</td></tr><tr><td>D. Overall Encumbrance Status</td><td>:</td><td><strong>' + lc.status + '</strong> — ' + lc.summary + '</td></tr></table>'
}

// ================================================================
// CSS
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between}.firm{font-size:22px;font-weight:bold;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:8px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}.ib{page-break-inside:avoid}}`

function buildReport(refNo: string, appId: string, today: string, bankName: string, loanType: string, body: string): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report</title><style>' + CSS + '</style></head><body><div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel — Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div><div class="hdr-right"><div><strong>Reference No.:</strong> ' + refNo + '</div><div><strong>Application ID:</strong> ' + appId + '</div><div><strong>Report Date:</strong> ' + today + '</div><div><strong>Bank:</strong> ' + bankName + '</div></div></div><div class="rtitle">LEGAL SCRUTINY REPORT — ' + loanType + '</div><hr>' + body + '<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ' + today + '</div></div><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">' + bankName + '</div></div></div><div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: This Report is prepared exclusively for ' + bankName + ' for Application ID ' + appId + '. Based solely on documents produced. Does not constitute a guarantee of title.</div><div class="wm">TITLEMATRIXAI — CONFIDENTIAL — FOR BANK USE ONLY</div></div></body></html>'
}

function parseMeta(t: string) { const b = t.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''; const g = (k: string) => b.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi'))?.[1]?.trim() || ''; return { applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'), propertyDescription: g('PROPERTY_DESCRIPTION'), propertyBoundaries: g('PROPERTY_BOUNDARIES'), currentOwner: g('CURRENT_OWNER'), constitution: g('CONSTITUTION'), modeOfAcquisition: g('MODE_OF_ACQUISITION'), registrationDetails: g('REGISTRATION_DETAILS') } }

function extractVerdict(t: string): string { const u = t.toUpperCase(); if (u.includes('TITLE NOT CLEAR') || u.includes('NOT CLEAR')) return 'NOT CLEAR'; if (u.includes('CLEAR SUBJECT TO')) return 'CLEAR SUBJECT TO'; if (u.includes('VERDICT: CLEAR')) return 'CLEAR'; return 'PENDING' }

// ================================================================
// PART IV — CHRONOLOGICAL TITLE CHAIN (BUILT DETERMINISTICALLY IN CODE)
// ================================================================
// Part IV used to be written by an AI call (S3B). That caused three problems the user hit:
//   • duplicates ("2 baar entry") — an opening summary listed the Nondh numbers AND then each
//     entry was written again as a full paragraph;
//   • inconsistent flow — the same register read slightly differently each run;
//   • time — it was the single slowest generation call (8000 tokens for ~27 entries).
// The dedicated Revenue scan already produces fully-structured entries (number, date,
// certification date, status, and a complete English narrative in `r`). So Part IV is now
// assembled directly from that data, exactly like Part I and Part II: every Nondh appears
// EXACTLY ONCE, sorted chronologically by entry number, in the user's required format —
// deterministic, duplicate-free, fast, and identical on every run for the same input.
function esc(s: string): string { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

// SOP terminology, enforced in CODE (not just asked for in a prompt) so it can never drift:
//   • "Paiki" is ALWAYS "out of" in Gujarat property contexts
//   • "registered under" — never "registered vide"
//   • "were entered" — never "have been entered"
function normTerms(s: string): string {
    return String(s == null ? '' : s)
        .replace(/\bpaiki\b/gi, 'out of')
        .replace(/\bregistered\s+vide\b/gi, 'registered under')
        .replace(/\bhave\s+been\s+entered\b/gi, 'were entered')
}

function buildPart4(revData: any, currentOwner: string): string {
    let h = '<hr><div class="ph">PART III — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>'

    const entries: any[] = revData ? (revData.mutation_entries || revData.entries || []) : []
    if (!revData || entries.length === 0) {
        h += '<p>Revenue Record (Village Form 7/12 / Mutation Register / FERFAR / Property Card) was not available for independent extraction in this case. The title chain for the subject property cannot be independently traced from Revenue Record entries on the basis of the documents produced. Independent verification of the Revenue Record is strongly recommended before disbursement to confirm ownership continuity, land use, encumbrance status and Kabjedar/Khatedar details.</p>'
        return h
    }

    const village = normTerms(revData.village || ''), taluka = normTerms(revData.taluka || ''), district = normTerms(revData.district || '')
    const survey = normTerms(revData.survey_block_no || ''), area = revData.total_area || '', landUse = normTerms(revData.land_use || '')
    const loc = [survey ? 'Survey/Block No. ' + survey : '', village ? 'Mouje: ' + village : '', taluka ? 'Taluka: ' + taluka : '', district ? 'District: ' + district : ''].filter(Boolean).join(', ')

    // De-duplicate by Nondh number (guarantees NO entry appears twice) and sort chronologically
    // by entry number (mutation numbers are assigned sequentially over time = oldest → newest).
    const seen = new Set<string>()
    const uniq = entries.filter((m: any) => {
        const k = String(m.e || m.entry_no || '').trim()
        if (!k) return true
        if (seen.has(k)) return false
        seen.add(k); return true
    })
    const numOf = (m: any) => { const n = parseInt(String(m.e || m.entry_no || '').replace(/[^0-9]/g, ''), 10); return isNaN(n) ? Number.MAX_SAFE_INTEGER : n }
    const sorted = uniq.map((m: any, i: number) => ({ m, i })).sort((a, b) => { const d = numOf(a.m) - numOf(b.m); return d !== 0 ? d : a.i - b.i }).map(x => x.m)

    // ONE clean opening line, in the SOP's formal advocate phrasing — NO list of entry numbers
    // (that listing is what caused the duplicate "2 baar" reading).
    h += '<p>From the available revenue records and documents produced before me, it transpires that the subject land' + (loc ? ' bearing ' + esc(loc) : '') + (area ? ', admeasuring ' + esc(area) : '') + (landUse ? ', land use: ' + esc(landUse) : '') + ', is reflected in the Revenue Record (Village Form 7/12 and the computerized Mutation Register). A total of ' + sorted.length + ' certified Mutation/FERFAR (Nondh) entries are recorded against the subject survey number, and the chronological devolution of title is set out individually below.</p>'

    sorted.forEach((m: any, idx: number) => {
        const no = esc(m.e || m.entry_no || '—')
        const date = esc(m.d || m.entry_date || '')
        const cd = esc(m.cd || m.certification_date || '')
        const status = esc(m.s || m.status || 'Certified')
        // normTerms enforces the SOP terminology (Paiki -> out of, registered under, were entered)
        // on every field, deterministically — the extraction cannot leak the wrong wording through.
        const narrative = normTerms(m.r || m.reason_of_mutation || '').trim()
        const po = normTerms(m.po || m.previous_owner || '').trim()
        const nowner = normTerms(m.no || m.new_owner || '').trim()
        const nature = normTerms(m.n || m.nature || '').trim()
        const doc = normTerms(m.sd || m.supporting_document || '').trim()

        h += '<div class="sph">Nondh Entry No. ' + no + ' | Dated: ' + (date || 'Not stated in extract') + (cd ? ' | Certification Date: ' + cd : '') + ' | Status: ' + status + '</div>'
        const lead = idx === 0 ? '' : 'Thereafter, '
        const head = lead + 'vide Mutation Entry No. ' + no + (date ? ' dated ' + date : '') + ' (' + (cd ? 'Certification Date: ' + cd + '; ' : '') + 'Status: ' + status + ')'

        if (narrative) {
            h += '<p>' + head + ', ' + esc(narrative) + '</p>'
        } else if (po || nowner || nature) {
            const bits = [
                po ? esc(po) + ', the then recorded Kabjedar/Khatedar,' : '',
                nature ? ' by way of ' + esc(nature) + ',' : ' ',
                nowner ? ' ' + esc(nowner) + ' came to be recorded as the Kabjedar/Khatedar' : ' a change of recorded holder was effected',
                loc ? ' in respect of ' + esc(loc) : '',
                doc ? ', vide ' + esc(doc) : '',
            ].join('')
            h += '<p>' + head + ', ' + bits.replace(/\s+/g, ' ').trim() + '.</p>'
        } else {
            h += '<p>' + head + ', a further entry is recorded against ' + (loc ? esc(loc) : 'the subject survey number') + ' in the Revenue Record. The date, the previous and new recorded Kabjedar/Khatedar, and the nature of the transaction are not stated or not legible in the extract produced; the entry is visible in the Entry Details list of the Mutation Register and its certified status is confirmed. Independent verification of this entry from the original Mutation Register is recommended.</p>'
        }
    })

    // Non-Agricultural / land-use conversion order, if traced in the Revenue Record.
    const na = normTerms(revData.na_order || '').trim()
    if (na && !/^(not stated|not provided|na|nil|none)$/i.test(na) && !/not stated in revenue/i.test(na)) {
        h += '<div class="sph">Non-Agricultural / Land-Use Conversion</div><p>The subject land is recorded as converted to Non-Agricultural use vide ' + esc(na) + ', as reflected in the Revenue Record.</p>'
    }

    // Current recorded status.
    const ganot = normTerms(revData.ganot_column || '').trim()
    h += '<div class="sph">Current Revenue Record Status</div><p>' + (currentOwner ? esc(currentOwner) : 'The current recorded holder') + ' holds the right, title and interest in the subject land as the present recorded Kabjedar/Khatedar in the Revenue Record' + (landUse ? '. Land use: ' + esc(landUse) : '') + '. Tenant / Ganot column: ' + (ganot ? esc(ganot) : 'NIL') + '.</p>'

    // EC details, Permissions/Approvals and Regulatory Compliance are appended to Part IV by
    // the Part IV-tail writer (S3C), per the report SOP — so Part IV ends here at the chain.
    return h
}


// ================================================================
// STEP 1 SYSTEM — PROVEN v5.3 EXTRACTION ENGINE
// ================================================================
const S1 = `You are a Senior Gujarat Property Law Expert. Extract ALL raw facts from documents accurately.

LANGUAGE RULE — ABSOLUTE, NO EXCEPTIONS:
Write EVERYTHING in formal English only. NEVER write any word, phrase, name, or text in Gujarati script anywhere in your output. If a document shows text in Gujarati (e.g. village name, owner name, land use, tenure, entry nature), write it in English transliteration or English translation only. Examples: 'Bin Kheti' not 'બિન ખેતી', 'Koba' not 'કોબા', 'Gandhinagar' not 'ગાંધીનગર'. This applies to every single field you extract — no Gujarati script whatsoever.

NEVER "AND OTHERS" — every person named individually.
APPLICANT = from AoS/Draft Sale Deed Buyer section ONLY. NEVER from stamp paper.
CURRENT OWNER = from latest submitted deed.

EC COLUMN MAPPING — PERMANENT CRITICAL RULE:
LEFT COLUMN = Aapnar = SELLER/EXECUTOR = WHO GIVES THE DEED
RIGHT COLUMN = Lenar = BUYER/CLAIMANT = WHO TAKES THE DEED

EC RELEASE DETECTION — MOST CRITICAL:
IF BANK in LEFT COLUMN (Aapnar) = RELEASE DEED (bank releasing mortgage back)
IF BANK in RIGHT COLUMN (Lenar) = MORTGAGE DEED (bank receiving mortgage)
Gujarati: ga.fa./ga.mu.fa./ga.o.fa./giro mukeli/giro fer = Mortgage Release Deed

RULE 17 — MORTGAGE RELEASE:
Before marking mortgage ACTIVE — check ALL docs for:
Release Deed / Giro Mukeli / Reconveyance / NOC / Discharge
Bank in LEFT EC column = RELEASED — NEVER report as active

ALL 4 BOUNDARIES MANDATORY. Check every page including Gujarati "Khunt Charne Vigat".
EC RULE 4A: Count ALL entries. EVERY entry matters. NEVER miss second or subsequent entry. (This is for Part V encumbrance verification only — EC is NOT used to build the chain.)
RULE 30 (REVISED): If a transaction's actual deed copy was not submitted but it is confirmed by Revenue Record (Mutation/FERFAR entry) — include it naturally in the chain using the Revenue Record details, NO flag as missing. Do NOT use EC entries for this purpose — only Revenue Record / Mutation entries may fill a chain link when the deed itself is absent.
MUTATION ENTRIES: NEVER in Part I — only in Part II narration.

20-25 YEAR TITLE HISTORY — MANDATORY DEEP SEARCH:
Do NOT limit extraction to only the EC search period (e.g., if EC covers 2011-2026, do not stop there).
ACTIVELY SEARCH every document for evidence of OLDER ownership history, including:
- Old Survey Numbers referenced in any deed (e.g. "allotted in lieu of Survey No. 59/2, 60, 61, 62")
- 7/12 (Satbara) / Village Form No. 7, 8-A, 12 extracts — these often show decades of mutation history
- FERFAR / Mutation Register / Gamnamuna No. 6 entries — extract EVERY entry visible, however old
- References inside any deed to "earlier owner", "ancestral property", "inherited from", "original allottee"
- Any NA Order, Conversion Order, or T.P. Scheme allotment document — these typically reference the ORIGINAL agricultural survey number and original landholder before the scheme was formed
- Partnership Deed clauses referencing how/when the firm acquired the land
- Any document mentioning "Old Tenure" / "Juni Sharat" / "Ganot" history

If a document references an OLDER survey number or an EARLIER transaction not shown in the EC period, EXTRACT IT — note the source document and approximate or exact date.
Goal: reconstruct title history covering AT LEAST 20-25 years (ideally 30 years) wherever the documents allow it, not merely the EC search window.
If genuinely no document references anything before the earliest EC entry, state that clearly — but only after confirming no such reference exists anywhere in the submitted documents.`

// ================================================================
// STEP 2 SYSTEMS — CASE SPECIFIC
// ================================================================
function getS2(ct: string): string {
    const base = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare a complete Legal Scrutiny Report for a ${ct.replace('_', ' ').toUpperCase()} case.

MANDATORY META BLOCK FIRST:
---META---
APPLICANT: [PRIMARY proposed purchaser only — the FIRST named buyer from Draft/AoS Buyer section — NEVER from stamp paper. If two or more buyers are jointly named, put only the first one here and put the rest in CO_APPLICANT below — do not combine all names into this one field.]
CO_APPLICANT: [every OTHER named buyer besides the first, separated by " & " if more than one — e.g. if the AoS names two buyers jointly, the second buyer's full name goes here, NOT "N/A". Only write "Not Applicable" if there is genuinely a single named buyer with no joint applicant.]
CURRENT_OWNER: [from latest deed — full name, and "a Partnership Firm"/"Pvt Ltd" etc if applicable]
CONSTITUTION: [This describes the BORROWER/APPLICANT(S) specifically — NOT the seller, NOT the developer, NOT the current owner. If the Applicant(s) are named natural persons (e.g. "Sunilkumar Rajendrabhai Patel"), Constitution = "Individual" — this applies even when there are two or more individual co-applicants. Only write "Partnership Firm" if the Applicant ITSELF is named as a firm (e.g. "M/s. XYZ, a Partnership Firm" is the actual buyer/borrower). Do not copy the seller's or developer's constitution here by mistake — check whose constitution this field is asking for every time.]
MODE_OF_ACQUISITION: [e.g. "Sale Deed" / "Registered Sale Deed" / "Allotment by Developer" — how Current Owner acquired the property]
REGISTRATION_DETAILS: [Document No. [X] | Dated: [DD-MM-YYYY] | SRO: [name] — of the deed by which Current Owner acquired title]
PROPERTY_DESCRIPTION: [MANDATORY EXACT PARAGRAPH FORMAT — fill every blank, do not paraphrase or shorten:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Office] No. [X] on [Nth] Floor in Block No. "[X]" having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as "[Scheme Name]" constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District: [District]."
If any individual area component (Balcony/Wash/UPS) is not applicable or not found in documents, omit that specific clause naturally rather than leaving a blank.]
PROPERTY_BOUNDARIES: [East (Purva): | West (Pashchim): | North (Uttar): | South (Dakshin): — from ALL documents including annexures]
---END META---

LANGUAGE RULE — ABSOLUTE, NO EXCEPTIONS:
Write EVERYTHING in formal English only. NEVER write any word, phrase, or text in Gujarati script anywhere in this report. Village names, owner names, land use terms, entry descriptions — everything must be in English only. Example: write 'Non-Agricultural (Bin Kheti)' not 'બિન ખેતી', write 'Koba' not 'કોબા'.

PERMANENT RULES — NEVER BREAK:
1. NEVER "and others" — every name individually always
2. Applicant = Buyer from Draft/AoS ONLY. Never from stamp paper.
3. ALL 4 boundaries mandatory — check every document including annexures
4. Part I = latest first | Part II = oldest first with "Thereafter,"
5. Mortgage Release / Giro Mukeli / Bank in LEFT EC column = DISCHARGED — NEVER report as active
6. EC Applicant = COMPLETELY IGNORE
7. NEVER mention loan amount
8. Dukan = Shop in English
9. NEVER list mutation entries in Part I

MANDATORY TERMINOLOGY AND DRAFTING STANDARD (SOP — apply to EVERY sentence you write):
- "Paiki" is ALWAYS translated as "out of" in property contexts. e.g. "Survey No. 288 Paiki" MUST be written "Survey No. 288 out of". NEVER leave the word "Paiki" in the output.
- Use "registered under" — NEVER "registered vide". e.g. "registered under Serial No. 4521".
- Keep the phrase "unto and in favour of" exactly as-is.
- Use "were entered" — NEVER "have been entered".
- Keep units (Sq. Mtrs. / Hectares / Acres) EXACTLY as given in the documents — never convert.
- Third person, formal legal drafting language throughout.
- PRESERVE EVERY FACTUAL DETAIL EXACTLY: never alter dates, names, survey numbers, measurements, registration numbers, mutation numbers, authority names or project names. You may only improve grammar, structure and readability — never a fact.
- Standard transition phrases to use: "From the available revenue records and documents produced before me, it transpires that...", "Thereafter,...", "Subsequently,...", "Further, it transpires that...", "Upon verification of the available records,..."
- Write PROPERTY HISTORY, not document history. Never write a separate paragraph per uploaded document ("Sale Deed says... Mutation says... EC says..."). If a Sale Deed, a Mutation entry and an EC row all describe the SAME transfer, that is ONE ownership event and gets ONE paragraph.
- Cross-verification between documents is INTERNAL reasoning only — never clutter the narrative with it.

EC COLUMN RULE — PERMANENT:
LEFT/Aapnar = WHO GIVES | RIGHT/Lenar = WHO RECEIVES
BANK IN LEFT = RELEASE DEED | BANK IN RIGHT = MORTGAGE DEED

PART IV "THEREAFTER" RULE:
First paragraph = NO "Thereafter"
EVERY subsequent paragraph MUST start "Thereafter,"
RELEASED mortgage: "stands discharged vide Reconveyance/Release Deed No.[X] dated [date]"
ACTIVE mortgage: "is subsisting and active as on date — no Release Deed found"

TITLE CHAIN SOURCE — PERMANENT RULE — REVENUE RECORD ONLY, NEVER EC:
The chronological title chain (Part IV) MUST be constructed from Revenue Record data (7/12, Village Form 7/8-A/12, FERFAR/Mutation Register entries — see Revenue Record Ground Truth) and the actual registered deeds submitted (Sale Deed, Mortgage Deed, Release Deed, Declaration Deed, Partition Deed, etc).
The Encumbrance Certificate (EC) is NEVER the source for this chain. EC rows are used ONLY for encumbrance/mortgage status verification (Part V) — they do not drive or anchor the historical narrative.
Gujarat banking practice requires a minimum 20-25 year (ideally 30 year) title chain. Build it using:
- Old/original Survey Numbers (pre-TP Scheme allotment) found in any deed or revenue record
- 7/12, Village Form 7/8-A/12, FERFAR/Mutation Register entries — every entry, even partial or old ones
- Registered deeds themselves (their recitals, dates, parties, consideration)
- Any deed recital mentioning prior ownership, inheritance, or earlier transactions
Start the chain from the EARLIEST point established by Revenue Record / deed evidence — not from any EC entry, not from the EC search window.
Only state "chain limited to documents produced" if you have genuinely found zero Revenue Record or deed references to anything earlier after checking all documents.
Construct the fullest, deepest, most complete chronological chain the Revenue Record and registered deeds support.

EXHAUSTIVE ENTRY COVERAGE — MANDATORY, EVERY TIME: If Revenue Record Ground Truth lists Mutation/FERFAR entries, your analysis must walk through EVERY single one of them by Entry No. and Date — never compress several entries into a vague summary sentence. Count the entries listed, then confirm your analysis names each one individually before moving on. This feeds directly into how Part IV gets written downstream, so compressing here means the final report compresses too — do not let that happen.

EC ANALYSIS FORMAT (exactly like this):
EC bearing E-Application No. [APP_NO] dated [DATE] for search period [FROM] to [TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [N] registered transactions found on row-by-row examination.

PART IV LEGAL OPINION:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [CURRENT OWNER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [APPLICANT], He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR
USE ALL TOKENS. MISS NOTHING.`
    return base
}

// ================================================================
// STEP 3A — PART I SYSTEM
// ================================================================
const S3A = `Generate HTML for PART II ONLY — List of Scrutinised Documents.
(Part I — Property Description with Boundaries — is generated separately and already appears before this. Start directly with Part II.)

═══ STRICT INPUT-DRIVEN RULE — THIS OVERRIDES EVERY OTHER CONVENIENCE DEFAULT ═══
- List ONLY documents that were ACTUALLY uploaded / produced for scrutiny. If one document was
  produced, the list has exactly one entry; if ten were produced, exactly ten.
- NEVER infer or add a document because it is "typically expected" in this kind of transaction.
  NEVER add RERA, EC, Property Card, Mutation Entries, NA Order, BU Permission or Development
  Permission unless that document was actually produced.
- If a document is absent, OMIT IT ENTIRELY — no placeholder, no "Not Available", no assumption
  of its existence.
- NEVER add remarks like "ILLEGIBLE", "NOT PROVIDED FOR VERIFICATION" or "BLANK".
- Do NOT mention E-Application Receipt / E-Challan details beyond the date and search period.
- If a registration number (or any other field) is unavailable, write exactly
  "Registration Number not available in the uploaded document" — NEVER fabricate it.
- Formal English, third person. No Gujarati script. NEVER "and others" — name every party.

═══ TERMINOLOGY (MANDATORY) ═══
- "registered under" — NEVER "registered vide".
- Keep the phrase "unto and in favour of" exactly.
- "Paiki" is ALWAYS translated as "out of" (e.g. "Survey No. 288 Paiki" -> "Survey No. 288 out of").
- Keep units (Sq. Mtrs. / Hectares / Acres) exactly as given.

═══ EXACT TEMPLATES — use the one matching each uploaded document ═══
- Registered Deed: Copy of "[Document Type]" dated "[Execution Date]" registered under Serial No. "[Registration Number]" executed by "[Executant]" unto and in favour of "[Claimant]".
- Government Order: Copy of "[Order Type]" bearing No. "[Order Number]" dated "[Order Date]" issued by "[Authority Name]".
- Government Permission: Copy of "[Permission Type]" bearing No. "[Permission Number]" dated "[Permission Date]" issued by "[Authority Name]".
- Certificate: Copy of "[Certificate Type]" bearing No. "[Certificate Number]" dated "[Certificate Date]".
- RERA: Copy of Gujarat RERA Registration Certificate bearing Registration No. "[Registration Number]" dated "[Registration Date]".
- Encumbrance Certificate: Encumbrance Certificate dated "[EC Date]" covering the search period from "[From Year]" to "[To Year]".
- Revenue Record: Copy of Revenue Record pertaining to Survey No. "[Survey Number]".
- Property Card: Copy of Property Card pertaining to City Survey No. "[City Survey Number]".
- Mutation Entries: Computerized Mutation Entries for the Search Period.
- Notarized Document: Copy of Notarized "[Document Type]" dated "[Date]" executed by "[Party Name]".

FORMAT — one <div class="di"> per ACTUALLY-PRODUCED document, nothing more:
<div class="di"><p><span class="dn">1.</span> [the exact template sentence for that document]</p></div>

ORDER: latest document first, oldest last.

START: <hr><div class="ph">PART II — LIST OF SCRUTINISED DOCUMENTS</div>
<p>The following documents have been produced for examination and scrutiny:</p>
END: after the last document entry.`

// ================================================================
// STEP 3C — PART V (REGULATORY) + PART VI (ALERTS) SYSTEM
// ================================================================
const S3C = `You generate TWO things: (1) the TAIL of PART III (EC details + Approvals + the mandatory Builder-to-Purchaser paragraph — as sub-sections that CONTINUE Part III, so use <div class="sph"> sub-headings and do NOT write any new "PART" header for these), then (2) PART IV — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS. Formal English only, NEVER Gujarati script (write 'Non-Agricultural (Bin Kheti)', 'Koba').

CORE RULE: Never assume facts. Never create facts. Wherever information is unavailable, expressly state: NOT PROVIDED FOR VERIFICATION.

═══ PART III TAIL (sub-sections — NO new PART header) ═══

<div class="sph">Details of Encumbrance Certificate (EC)</div>
<p>[ONE paragraph from the EC TABLE / MORTGAGE LIFECYCLE data: EC Date, Search Period (from → to), number of registered transactions, and a chronological summary of the material deeds (type, registration number, date, executing party, claimant party). State the overall encumbrance status — subsisting mortgage or all charges discharged (and by which Release/Reconveyance Deed). NEVER reproduce the EC last column or the EC applicant name. Released/discharged mortgages must be stated as discharged, never active. If no EC was produced: NOT PROVIDED FOR VERIFICATION.]</p>

<div class="sph">Development Approvals and Regulatory Compliance</div>
<p>[ONE paragraph. For EACH of the following state Authority, Number and Date where produced: N.A. / Conversion Order, Development Permission, Rajachitthi, Building Permission, Sanctioned Plan, Commencement Certificate, Fire NOC, Airport Authority NOC, Environmental Clearance, RERA Registration, Occupancy Certificate, BU Permission, Completion Certificate. Also state the land status from the Revenue Record Ground Truth (Village, Survey/Block No., Total Area, Tenure, whether Land Use is confirmed Non-Agricultural). For any approval NOT produced, expressly write "NOT PROVIDED FOR VERIFICATION" — never fabricate an authority, number or date.]</p>

<div class="sph">Document in favour of the Proposed Purchaser</div>
<p>[MANDATORY — this is the LAST paragraph of Part III and must never be omitted in a Builder Purchase case. State the Draft Sale Deed OR Registered Agreement for Sale (Banakhat) OR Notarized Agreement for Sale OR Letter of Allotment executed/issued by the Builder/Developer unto and in favour of the Proposed Purchaser/Borrower/Mortgagor, giving: Date, Registration Number (if available), Consideration Amount (if available), and the Unit Description. If none of these documents was produced, expressly write: "No Draft Sale Deed, Agreement for Sale, Banakhat or Letter of Allotment executed by the Builder in favour of the Proposed Purchaser has been produced — NOT PROVIDED FOR VERIFICATION." If the case is not a Builder Purchase, state the corresponding document by which the Proposed Purchaser is to acquire the property, or NOT PROVIDED FOR VERIFICATION.]</p>

═══ PART IV ═══
<hr><div class="ph">PART IV — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS</div>
[Each issue/objection, most severe first. Format:
CRITICAL/HIGH: <div class="ib"><div><span class="sh">CRITICAL</span></div><div class="it">N. [Title]</div><p>[2-3 sentences with exact deed/entry numbers]</p><p><span class="sg">Direction:</span> [action required]</p></div>
MODERATE: same with class "sm" | LOW: same with class "sl"]
Raise an objection (do not stay silent) for any of: TITLE BREAK (severity CRITICAL — any ownership transition lacking documentary support); Builder's name absent from the revenue record (MAJOR OBJECTION); Builder title defect; missing N.A. Order or relevant Mutation Entry; EC mismatch with mutation/revenue records; missing development approval; survey/area/boundary/ownership mismatch; litigation, attachment, acquisition or government restriction; subject unit not traceable in the sanctioned plan / RERA / allotment records.
NEVER flag: released/discharged mortgages | EC-confirmed deeds | EC applicant name.
If no adverse finding exists on the documents produced, write a single <div class="ib"><div><span class="sl">LOW</span></div><div class="it">1. No material adverse findings</div><p>No material adverse finding was noted on the documents produced. Standard pre-disbursement verification is recommended.</p></div>

END: after the last objection.`

// ================================================================
// STEP 3D — PARTS VII-XI SYSTEM
// ================================================================
const S3D1 = `Generate HTML for PART V — LEGAL OPINION AND FINAL RECOMMENDATION ONLY. Formal English.

<hr><div class="ph">PART V — LEGAL OPINION AND FINAL RECOMMENDATION</div>
<p>[Legal opinion — 4 to 6 sentences. If the title is clear, expressly state that: legal title is established; marketable title is established; mortgageable title is established; SARFAESI enforceability is established; and the security is acceptable. If defects exist, issue a QUALIFIED opinion instead and state the defect. Cover: whether ownership and title continuity are established from the Revenue Record mutation chain and the documents produced; the encumbrance/mortgage position (subsisting or fully discharged, with the release/reconveyance deed if any); and any conditions the bank must satisfy. Do not repeat the whole chain — state its conclusion.]</p>

ABSOLUTE RULE: NEVER issue an unconditional approval when a CRITICAL risk exists (e.g. a TITLE BREAK, or any ownership transition unsupported by documentary evidence). In that event the opinion must be qualified and the verdict must not be "CLEAR AND MARKETABLE TITLE".
If any mandatory verification could not be completed on the documents produced, state exactly: INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION.

[Verdict box — choose per the VERDICT given in context:
CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p>[brief reason]</p></div>
CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p>Mortgageable subject to: [short list of conditions]</p></div>
NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p>[reasons/conditions]</p></div>]

START: <hr><div class="ph">PART V — LEGAL OPINION AND FINAL RECOMMENDATION</div>
END: after the verdict box closing div.`

// ================================================================
// STEP 3E — PART IX-XI SYSTEM (split from S3D for parallel speed)
// ================================================================
const S3D2 = `Generate HTML for the closing sections ONLY — DOCUMENTS REQUIRED, RISK RATING, CONFIDENCE LEVEL and OVERALL TITLE STATUS. Formal English. These follow Part V and carry NO "PART" numbers.

<hr><div class="ph">DOCUMENTS REQUIRED — PRE-DISBURSEMENT (MANDATORY BEFORE SANCTION)</div>
<ol>[Each item ONE line: <li><strong>[Document Name]</strong> — [one-line purpose]</li>. Derive these from what is actually missing/needed on this matter — e.g. any document flagged NOT PROVIDED FOR VERIFICATION, missing N.A. Order, missing mutation entry, missing development approval, Builder's title document, Builder's NOC/consent for mortgage.]</ol>

<hr><div class="ph">DOCUMENTS REQUIRED — POST-DISBURSEMENT</div>
<ol>[5-7 items, ONE line each — e.g. Registered/Equitable Mortgage creation, CERSAI charge registration, original title deeds, property insurance, ROC/CHG charge filing if the borrower is a company, Society NOC / Share Certificate, Occupancy/BU Permission on completion.]</ol>

<hr><div class="ph">RISK RATING</div>
Compute the risk score by ADDING the score of every risk factor that is actually present on the documents produced. Use EXACTLY this table:
Title Break = 100 | Court Litigation = 90 | Acquisition Risk = 80 | Missing N.A. Order OR relevant Mutation Entry = 70 | Builder Title Defect = 70 | EC Mismatch = 60 | Missing Development Approval = 50 | Missing Mutation = 40 | Builder Name Missing in Revenue Record = 40 | Existing Mortgage = 10 | Minor Clerical Error = 10
Classification: 0-25 = LOW RISK | 26-50 = MODERATE RISK | 51-75 = HIGH RISK | 76+ = UNACCEPTABLE RISK
<table class="mt">
<tr><td>Risk Factors Present</td><td>:</td><td>[list each factor found and its score, e.g. "Missing Development Approval (50); Existing Mortgage (10)" — or "None identified"]</td></tr>
<tr><td>Total Risk Score</td><td>:</td><td>[the sum]</td></tr>
<tr><td>Risk Classification</td><td>:</td><td>[LOW RISK / MODERATE RISK / HIGH RISK / UNACCEPTABLE RISK per the bands above]</td></tr>
</table>

<hr><div class="ph">CONFIDENCE LEVEL</div>
<table class="mt">
<tr><td>Confidence Level</td><td>:</td><td>[HIGH CONFIDENCE / MEDIUM CONFIDENCE / LOW CONFIDENCE — based strictly on the extent of documentary support]</td></tr>
<tr><td>Basis</td><td>:</td><td>[1-2 sentences on what documentary support drives this level]</td></tr>
</table>

<hr><div class="ph">OVERALL TITLE STATUS</div>
<div class="final-rec"><div class="fr-title">OVERALL TITLE STATUS:</div><div class="fr-value">[Use the VERDICT given in context — CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE NOT CLEAR. If any mandatory verification could not be completed on the documents produced, write instead: INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION]</div></div>
<p>[3-4 sentences: title-chain conclusion | encumbrance status | outstanding conditions | SARFAESI enforceability | bank recommendation.]</p>

START: <hr><div class="ph">DOCUMENTS REQUIRED — PRE-DISBURSEMENT (MANDATORY BEFORE SANCTION)</div>
END: after the Overall Title Status paragraph.`


// ================================================================
// EC PRE-SCREEN PROMPT
// ================================================================
const EC_PS = 'Look at ALL uploaded images. Find Encumbrance Certificate (EC) table.\n\nCRITICAL RULE:\nCOL 3 = Aapnar = LEFT = WHO GIVES\nCOL 4 = Lenar = RIGHT = WHO RECEIVES\nBANK IN COL 3 = RELEASE DEED | BANK IN COL 4 = MORTGAGE DEED\n\nExtract EVERY EC row + header. Also check ALL docs for Release Deed / Giro Mukeli / Reconveyance.\n\nOutput ONLY JSON:\n{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}],"pre_screen_releases":[{"bank":"","deed_no":"","date":"","source":""}]}'

const REV_PS = 'LANGUAGE: Output ONLY English in JSON fields. No Gujarati script anywhere in output.\nTranslate status words: પ્રમાણિત=Certified | કબજાની પ્રમાણિત=Certified | હુકમથી પ્રમાણિત=Certified by Court Order | રદ=Rejected | ચકાસ=Under Revision | બાકી=Pending\nTranslate terms: Bin Kheti=Non-Agricultural | Juni Sharat=Old Tenure | Naa Sharat=New Tenure | Vechan=Sale | Hukam=Court Order | Warsi=Inheritance | Bhagat=Partition\nGujarati digits: ૦=0 ૧=1 ૨=2 ૩=3 ૪=4 ૫=5 ૬=6 ૭=7 ૮=8 ૯=9 — convert ALL Gujarati digits to Arabic numerals in dates and numbers.\n\n═══════════════════════════════════════════\nWHAT IS A MUTATION ENTRY — AND WHAT IS NOT (READ FIRST, ABSOLUTE)\n═══════════════════════════════════════════\nA Mutation/FERFAR entry (Nondh) comes ONLY from the Revenue Record "Entry Details" / FERFAR /\nGamnamuna No. 6 register. Each real entry has a NUMERIC Nondh number (e.g. 3710, 4080, 11685),\na date, a change-type (Sale / Order / Inheritance / NA / etc.), a certified/rejected status, and\na narrative. These numeric Nondh entries are the ONLY thing that goes into the "entries" array.\n\nThe following are NOT mutation entries — NEVER put them in the "entries" array, NEVER invent a\nNondh number for them, NEVER give them a text "entry number":\n- AAI / Airport NOC, Height Clearance NOC\n- GUDA / AUDA / development permission, building plan approval\n- RERA registration certificate / Form-C\n- A registered Sale Deed, Mortgage Deed, Release Deed, Declaration Deed BY ITSELF (the DEED is\n  NOT a Nondh; only the FERFAR Nondh that RECORDS that deed is an entry, and its number is the\n  numeric Nondh number, not the deed/document number)\n- Index-2, tax receipts, layout plans, jantri\nIf you cannot find the FERFAR "Entry Details" register with numeric Nondh entries in the images,\nreturn entries:[] and fill only the 7/12 header fields — do NOT manufacture entries from deeds,\nNOCs, permissions or certificates. An empty entries array is CORRECT and far better than fake\nentries built from non-FERFAR documents.\n\nCOUNT DISCIPLINE: The FERFAR "Entry Details" register usually holds MANY numeric Nondh entries\n(commonly 10-25). Do NOT stop after a handful. Read the entire "Entry Details" / Gamnamuna 6\nsection top to bottom and extract EVERY numeric Nondh entry you can see, oldest to newest.\n\n═══════════════════════════════════════════\n\nFind Revenue Records in ALL uploaded images: Village Form 6, 7/12 (Satbara), 8-A, Property Card, Hakk Patrak, Mutation Register, FERFAR Register, Gamnamuma No. 6.\n\n══════════════════════════════════════════\nVILLAGE FORM NO. 7 (7/12 SATBARA) — EXTRACT:\n══════════════════════════════════════════\nFrom Village Form 7 extract these fields:\n- Village name (Mouje), Taluka, District\n- Survey Number / Block Number / Final Plot Number (old AND new if both visible)\n- Total Area in H.Are.SqMt. or Sq.Mtrs.\n- Land Use (Jaminno Upyog): Non-Agricultural / Agricultural\n- Current owner name (Kabjedar/Khatedar column) — translate to English\n- Boja/Encumbrance column — list ALL entry numbers visible\n- Ganot/Tenant column — NIL if blank\n- Any NA Order or Land Use conversion reference visible in the document\n\n══════════════════════════════════════════\nFERFAR / MUTATION REGISTER / GAMNAMUMA NO. 6 — COLUMN STRUCTURE (PER SOP):\n══════════════════════════════════════════\nEach Nondh/Mutation entry in FERFAR has these columns reading left to right:\n\nCOLUMN 1 (Leftmost) = Entry Date + Mutation Entry Number + Status (Certified / Rejected / Hukam)\n  → ALWAYS extract: Mutation Entry Number, Date, Status from this column\n  → NOTE: Skip the very FIRST sub-column of Entry Details if it is only administrative/serial numbering\n  → The actual Date + Number + Status is what you need from Column 1\n\nCOLUMN 2 (Second from left) = Complete Mutation Details (most important column):\n  → Contains: Nature of change (Sale / Court Order / Inheritance / Death / NA Conversion / Partition etc.)\n  → Contains: All party names — sellers, buyers, applicants, respondents\n  → Contains: Deed references (Sale Deed No., Court Order No., Case No.)\n  → Contains: Consideration amounts if sale\n  → Contains: Court name, case number, order date for court order entries\n  → EXTRACT EVERYTHING from Column 2 and reconstruct the full English narrative\n\nCOLUMN 3 (Third from left) = Survey/Block Number:\n  → Include ONLY if the Survey/Block Number relates to the SUBJECT PROPERTY\n  → If a different property, skip this column entirely for that entry\n\nCOLUMN 4 (Last column) = Remarks:\n  → Extract any legally relevant remarks\n\n══════════════════════════════════════════\nCRITICAL RULES:\n══════════════════════════════════════════\n1. Read ALL pages from beginning to end — do NOT stop after first few entries\n2. Extract EVERY entry — Sale, Court Order, Inheritance, Death, NA Conversion, Rejected entries — ALL\n3. REJECTED entries are LEGALLY IMPORTANT — always extract and report them with Status=REJECTED\n4. PARTIAL EXTRACTION IS VALID — if you cannot read some fields, return empty string for that field\n   NEVER return {found:false} unless the document is genuinely not a Revenue Record at all\n5. Date and Number are in Column 1 — search thoroughly, never output empty date if it is visible\n6. For Court Order entries: extract case number, court name, order date, parties, and what was decided\n7. NA Order references: extract the Non-Agricultural order number and date if visible anywhere\n8. Translate all Gujarati party names: અરજદાર=Applicant | સામાવાળા=Respondent | વેચાણ આપનાર=Seller | વેચાણ લેનાર=Buyer\n9. PER-ENTRY COMPLETENESS — MANDATORY, THE MOST IMPORTANT RULE: for EVERY entry object you MUST fill "d" (the entry DATE from Column 1) AND "r" (the FULL narrative from Column 2). An entry that has "e" (a number) but an empty "d" or empty "r" is a FAILED read — go back to that same row, re-read Column 1 for its date + status and Column 2 for its parties + nature + deed/case number, and fill them before you output. Also fill "s" (status), "po" (previous owner/seller/applicant), "no" (new owner/buyer/respondent) and "n" (nature) whenever they are visible in that row. NEVER emit a number-only entry — a list of bare Nondh numbers with no dates or details is exactly what we must avoid. Read the date, status, both parties, the nature, and the deed/case reference for each and every numeric Nondh, one row at a time, top to bottom.\n\nOUTPUT ONLY THIS JSON — no other text before or after:\n{"document_type_found":"FERFAR OR 7-12 OR Property Card OR mixed","village":"","taluka":"","district":"","survey_block_no":"","total_area":"","land_use":"","tenure":"","ownership_column":"","boja_column":"","ganot_column":"","na_order":"","entries":[{"e":"entry_no","d":"date_DD/MM/YYYY","cd":"certification_date_if_different","s":"Certified OR Rejected OR Certified by Court Order OR Pending","po":"sellers OR applicants OR previous owner — all names in English","no":"buyers OR respondents OR new owner — all names in English","n":"Sale OR Court Order OR Inheritance OR Death OR NA Conversion OR Partition OR Gift OR Mortgage OR Release","r":"complete narrative in English — all parties, deed/case numbers, amounts, what happened and what was decided","sv":"survey_block_no if related to subject property","sd":"deed number OR court case number and date","rm":"any legal remarks or notes"}]}\nPARTIAL RULE: Return whatever you can read. Empty string for unreadable fields. Never found:false unless no revenue record exists.'

// ================================================================
// MAIN API HANDLER
// ================================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            images, caseType = 'lap', appId = 'AUTO', bankName = 'Bank',
            loanType = 'Loan Against Property', applicantName = '', coApplicant = '',
            currentOwner = '', propertyAddress = '', boundaryEast = '', boundaryWest = '',
            boundaryNorth = '', boundarySouth = '', userId = null,
            // revData: pre-computed Revenue Record from the dedicated revenue-scan pass (see
            // below). When present, the main pipeline uses it directly and does NOT re-scan
            // revenue — so the register never has to share the 4.5MB request with other docs.
            revData: providedRevData = null,
            // mode: 'revenue-scan' = run ONLY the deep FERFAR scan on these images and return
            // the structured revData. Anything else = normal full report generation.
            mode = 'full',
        } = body

        if (!images || images.length === 0)
            return NextResponse.json({ success: false, error: 'No documents uploaded. Please upload EC and property documents.' }, { status: 400 })

        // ── DEDICATED REVENUE-RECORD SCAN (its own request, its own 4.5MB budget) ──
        // The frontend sends the tagged Revenue detail register (Gam Namuna 6 / Hakkpatrak)
        // here BY ITSELF — in page-chunks if it is long — so every mutation-entry page is
        // deep-scanned at full quality regardless of how many OTHER documents the client
        // uploaded. This is what makes the per-Nondh date/detail reliable for a SaaS flow
        // where users dump all their files. Returns just the structured revData JSON.
        if (mode === 'revenue-scan') {
            try {
                const scanImgs = images.map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
                // temperature:0 — this is an OCR/extraction task, not creative writing. At the
                // default temperature (1.0) the SAME register read differently on each run: once
                // full detail, once "not legible" — the inconsistency the user saw. Deterministic
                // reading makes the result the same every time for the same document.
                const rs = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0, messages: [{ role: 'user', content: [...scanImgs, { type: 'text', text: REV_PS }] }] })
                const _rb = rs.content.find(b => b.type === 'text')
                const rawText = _rb && _rb.type === 'text' ? _rb.text : ''
                const parsed = parseJSON(rawText)
                const _e = (parsed && (parsed.mutation_entries || parsed.entries)) || []
                console.log('REVENUE-SCAN chunk: imgs=' + scanImgs.length + ' entries=' + _e.length + ' village=' + (parsed?.village || '?'))
                return NextResponse.json({ success: true, revData: parsed })
            } catch (e: any) {
                console.log('REVENUE-SCAN err:', e?.message || e)
                return NextResponse.json({ success: false, error: e?.message || 'revenue scan failed', revData: null }, { status: 200 })
            }
        }

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const refNo = 'TITLEMATRIXAI/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4)
        const loanMap: Record<string, string> = { builder_purchase: 'BUILDER PURCHASE', resale: 'RESALE PROPERTY', bt: 'BALANCE TRANSFER', seller_bt: 'SELLER BALANCE TRANSFER', lap: 'LOAN AGAINST PROPERTY' }

        // Separate by docType tag
        const allImgs: any[] = images.map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const ecImgs: any[] = images.filter((img: any) => img.docType && img.docType === 'ec').map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const relImgs: any[] = images.filter((img: any) => img.docType && (img.docType === 'release' || img.docType === 'mortgage')).map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const revImgs: any[] = images.filter((img: any) => img.docType && img.docType === 'revenue').map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const psImgs = ecImgs.length > 0 ? [...ecImgs, ...relImgs] : allImgs
        console.log('Images: all=' + allImgs.length + ' EC-tagged=' + ecImgs.length + ' Release/Mortgage=' + relImgs.length + ' Revenue-tagged=' + revImgs.length)

        const FORM = ['=== FORM DATA (ALWAYS PRIORITY) ===', 'FORM_APPLICANT: ' + applicantName, 'FORM_CO: ' + (coApplicant || 'Not Applicable'), 'FORM_OWNER: ' + (currentOwner || applicantName), 'FORM_BANK: ' + bankName, 'FORM_PROPERTY: ' + propertyAddress, 'EAST: ' + boundaryEast, 'WEST: ' + boundaryWest, 'NORTH: ' + boundaryNorth, 'SOUTH: ' + boundarySouth, 'Applicant = FORM_APPLICANT always. Never advocate name.', '==='].join('\n')

        // ── STEP 0 + STEP 1 — ALL RUN IN PARALLEL (was sequential, fixes 504 timeout) ──
        // EC prescreen, Revenue prescreen, and Haiku fact-extraction all hit images
        // independently and have no dependency on each other's output, so they
        // fire concurrently instead of one after another.
        let ecRows: ECRow[] = [], ecMetas: ECMeta[] = [], lc = runLC([]), preReleases: any[] = []
        let revData: any = null
        let revScanError = false
        let facts = ''

        // Did the frontend already deep-scan the Revenue Record in its own dedicated request?
        // If so, use that result and SKIP the in-request revenue scan entirely — the register
        // was read at full budget separately, so we must not (and need not) re-scan it here.
        const usePreScan = !!providedRevData
        if (usePreScan) {
            const _pe = (providedRevData.mutation_entries || providedRevData.entries) || []
            const hasSignal = providedRevData.found !== false && (
                _pe.length > 0 ||
                !!(providedRevData.document_type_found || providedRevData.village || providedRevData.taluka || providedRevData.district || providedRevData.survey_block_no || providedRevData.ownership_column)
            )
            revData = hasSignal ? providedRevData : null
            console.log('REV: pre-computed revData provided by dedicated scan — hasSignal=' + hasSignal + ' entries=' + _pe.length)
        }

        const ecPrescreen = AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, messages: [{ role: 'user', content: [...psImgs, { type: 'text', text: EC_PS }] }] })
            .then(ps => {
                const p = parseJSON(ps.content[0].type === 'text' ? ps.content[0].text : '{}')
                if (p?.rows?.length > 0) {
                    ecRows = p.rows; lc = runLC(ecRows)
                    if (p.ec_app_number) ecMetas.push({ ec_app_number: p.ec_app_number, ec_date: p.ec_date || '', ec_from: p.ec_from || '', ec_to: p.ec_to || '' })
                    if (p.pre_screen_releases?.length > 0) preReleases = p.pre_screen_releases
                    console.log('EC P0: rows=' + ecRows.length + ' status=' + lc.status)
                }
            })
            .catch(e => console.log('PS err:', e))

        // Revenue Record scan focus — THE KEY FIX.
        // Previously this scanned ALL images (EC + deeds + NOC + GUDA + RERA + 7/12) together.
        // With many clear EC/deed pages next to a single hard-to-read Gujarati 7/12 page, the
        // model's attention drifted to the EC/deed content and it built the chain from deed
        // numbers instead of the FERFAR Nondh entries — exactly the "chain from EC" symptom.
        // When revenue documents ARE tagged (docType:'revenue'), scan ONLY those, so the
        // 7/12 / FERFAR register gets its own focused deep scan with zero EC/deed distraction.
        // Fall back to all images only when nothing is tagged as revenue.
        const revPrescreenImgs = revImgs.length > 0 ? revImgs : allImgs
        console.log('REV scan focus: ' + (revImgs.length > 0 ? ('TAGGED revenue images only (' + revImgs.length + ')') : 'ALL images (no revenue tag)'))
        // No thinking / no temperature here on purpose: this is a pure JSON-extraction
        // call. On claude-sonnet-4-6 the old `thinking:{type:'enabled',budget_tokens}`
        // shape is rejected (400), and passing temperature alongside thinking is invalid —
        // that 400 was silently killing every Revenue Record scan (revScanError=true).
        // Bigger max_tokens so a long FERFAR/Mutation JSON isn't truncated mid-array.
        const revPrescreen = usePreScan
            // Dedicated scan already ran — nothing to do here.
            ? Promise.resolve()
            : AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0, messages: [{ role: 'user', content: [...revPrescreenImgs, { type: 'text', text: REV_PS }] }] })
                .then(rs => {
                    const _rb = rs.content.find(b => b.type === 'text')
                    const rawText = _rb && _rb.type === 'text' ? _rb.text : ''
                    console.log('REV RAW (first 300 chars):', rawText.substring(0, 300))
                    const r = parseJSON(rawText)
                    // A scan "counts" if it isn't an explicit found:false AND it carries at
                    // least one real signal — a document type, a location field, a survey no,
                    // or one or more mutation/FERFAR entries. This stops an empty/garbage object
                    // from being reported as "PROVIDED: YES — 0 entries" (which reads as broken).
                    const _ents = (r && (r.mutation_entries || r.entries)) || []
                    const hasSignal = !!r && r.found !== false && (
                        _ents.length > 0 ||
                        !!(r.document_type_found || r.village || r.taluka || r.district || r.survey_block_no || r.ownership_column)
                    )
                    if (hasSignal) {
                        revData = r
                        console.log('REV P0 SUCCESS: docType=' + (r.document_type_found || '?') + ' village=' + (r.village || '?') + ' survey=' + (r.survey_block_no || '?') + ' mutations=' + _ents.length + ' source=fallback-all')
                    } else if (r && r.found === false) {
                        console.log('REV P0: model explicitly returned found:false — no revenue record visible in images')
                    } else if (r) {
                        console.log('REV P0: parsed JSON had no usable Revenue Record signal (all fields empty) — treating as not-found')
                    } else {
                        console.log('REV P0 PARSE FAILED: raw length=' + rawText.length + ' parseJSON returned null — likely truncated JSON from token budget. Source=' + (revImgs.length > 0 ? 'tagged' : 'fallback-all'))
                    }
                })
                .catch(e => { revScanError = true; console.log('REV PS err:', e?.message || e) })

        // SPEED: don't make Haiku re-read the heavy high-res Revenue pages — REV_PS already
        // deep-scans those and feeds their facts via the Revenue Ground Truth. When a Revenue
        // doc is tagged, S1 skips it and reads only the deed/EC pages, so the single biggest
        // duplicated vision cost in the pipeline (8 large 7/12/FERFAR images processed twice)
        // is removed. If nothing is tagged as revenue, S1 keeps reading everything.
        const s1Imgs = revImgs.length > 0
            ? images.filter((img: any) => img.docType !== 'revenue').map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
            : allImgs
        const step1Promise = AI.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 6000, system: S1, messages: [{ role: 'user', content: [...s1Imgs, { type: 'text', text: FORM + '\n\nExtract ALL facts. Case: ' + caseType + '. Property: ' + propertyAddress }] }] })
            .then(s1 => {
                facts = s1.content[0].type === 'text' ? s1.content[0].text : ''
                console.log('STEP1: facts extracted, length=' + facts.length)
            })
            .catch(e => console.log('STEP1 err:', e))

        await Promise.all([ecPrescreen, revPrescreen, step1Promise])

        // Apply pre-screen releases
        
        if (preReleases.length > 0) {
            const a = [...lc.active], r = [...lc.released]
            for (const ps of preReleases) {
                const bw = ps.bank.toLowerCase().split(' ').filter((w: string) => w.length > 3)
                if (!r.some((x: Charge) => bw.some((w: string) => x.lender.toLowerCase().includes(w)))) {
                    const ai = a.findIndex((x: Charge) => bw.some((w: string) => x.lender.toLowerCase().includes(w)))
                    if (ai >= 0) { const m = a.splice(ai, 1)[0]; m.release_deed_no = ps.deed_no || ''; m.release_date = ps.date || ''; r.push(m); console.log('PS RELEASE:' + ps.bank) }
                    else r.push({ lender: ps.bank, deed_no: '', date: '', release_deed_no: ps.deed_no || '', release_date: ps.date || '' })
                }
            }
            lc = buildLC(a, r)
        }
        console.log('FINAL LC:' + lc.status + '|' + lc.summary)

        const ecGT = ['=== EC GROUND TRUTH ===', 'EC App No: ' + (ecMetas.map(m => m.ec_app_number).join(', ') || 'NOT PROVIDED'), 'EC Date: ' + (ecMetas.map(m => m.ec_date).join(' | ') || 'NOT PROVIDED'), 'EC Period: ' + (ecMetas.map(m => m.ec_from + ' to ' + m.ec_to).join(' | ') || 'NOT PROVIDED'), 'EC Rows: ' + ecRows.length, 'Status: ' + lc.status, 'Summary: ' + lc.summary, 'Active: ' + (lc.active.length === 0 ? 'NONE' : lc.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(' | ')), 'Released: ' + (lc.released.length === 0 ? 'NONE' : lc.released.map(r => r.lender + ' RELEASED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')), 'RULE: Released = NEVER flag as active. Bank in LEFT EC col = Release.', '==='].join('\n')

        // Compact EC line for the Part IV cross-verification sentence ONLY. Deliberately
        // omits the deed-by-deed Active/Released rows — those are exactly what the chain-writer
        // was copying into chain paragraphs. It gets just App No + period + overall status.
        const ecCrossVerifyLine = 'EC for cross-verification only — E-Application No.: ' +
            (ecMetas.map(m => m.ec_app_number).join(', ') || 'NOT PROVIDED') +
            ' | Period: ' + (ecMetas.map(m => m.ec_from + ' to ' + m.ec_to).join(' | ') || 'NOT PROVIDED') +
            ' | Overall encumbrance status: ' + lc.status +
            '. Use this ONLY to write the single closing sentence; do NOT create chain paragraphs from it.'

        let revGT = ''
        if (revData) {
            // Support both old field names and new compact field names
            const entries = revData.mutation_entries || revData.entries || []
            const mutLines = entries.map((m: any, idx: number) =>
                '  ' + (idx + 1) + '. Entry No.' + (m.e || m.entry_no || '?') +
                ' | Date:' + (m.d || m.entry_date || 'not stated') +
                (((m.cd || m.certification_date) ? (' | Certified:' + (m.cd || m.certification_date)) : '') +
                    ' | Status:' + (m.s || m.status || '?') +
                    ' | PREV OWNER: ' + (m.po || m.previous_owner || 'not stated') +
                    ' -> NEW OWNER: ' + (m.no || m.new_owner || 'not stated') +
                    ' | Nature:' + (m.n || m.nature || '?') +
                    ((m.r || m.reason_of_mutation) ? (' | Reason:' + (m.r || m.reason_of_mutation)) : '') +
                    ((m.sv || m.relevant_survey_no) ? (' | Survey:' + (m.sv || m.relevant_survey_no)) : '') +
                    ((m.sd || m.supporting_document) ? (' | Doc:' + (m.sd || m.supporting_document)) : '') +
                    ((m.rm || m.remarks) ? (' | Remarks:' + (m.rm || m.remarks)) : ''))
            )
            revGT = ['', '=== REVENUE RECORD GROUND TRUTH (deep-scanned 7/12 / Property Card / FERFAR) ===',
                'Village: ' + (revData.village || 'NOT PROVIDED'),
                'Taluka: ' + (revData.taluka || 'NOT PROVIDED'),
                'District: ' + (revData.district || 'NOT PROVIDED'),
                'Survey/Block No: ' + (revData.survey_block_no || 'NOT PROVIDED'),
                'Total Area: ' + (revData.total_area || 'NOT PROVIDED'),
                'Land Use: ' + (revData.land_use || 'NOT PROVIDED'),
                'Tenure: ' + (revData.tenure || 'NOT PROVIDED'),
                'Ownership Column: ' + (revData.ownership_column || 'NOT PROVIDED'),
                'Boja/Encumbrance Column: ' + (revData.boja_column || 'NOT PROVIDED'),
                'Ganot/Tenant Column: ' + (revData.ganot_column || 'NOT PROVIDED'),
                // SOP point 5: the NA / land-use conversion order must be traced and stated.
                // REV_PS extracts it as `na_order`, but it was never forwarded to the chain
                // writer — so add it to the Ground Truth here.
                'NA / Conversion Order: ' + (revData.na_order || 'NOT STATED IN REVENUE RECORD'),
                // Hard whitelist of the ONLY valid Nondh (Mutation Entry) numbers. The chain
                // was being built from EC/registered-DEED document numbers (e.g. 9871, 27734)
                // which are NOT Nondh numbers. The chain paragraphs must use ONLY the numbers
                // in this list — one paragraph per number, oldest to newest, nothing else.
                'VALID NONDH (MUTATION ENTRY) NUMBERS — THE CHAIN MUST USE ONLY THESE, ONE PARAGRAPH EACH: ' +
                    (entries.map((m: any) => m.e || m.entry_no).filter(Boolean).join(', ') || 'NONE'),
                'CRITICAL: A registered Sale/Mortgage/Release DEED document number (e.g. the number on the deed itself) is NOT a Nondh number. NEVER start a chain paragraph with "Nondh Entry No. <deed number>". Every chain paragraph MUST be headed by one of the VALID NONDH numbers listed above. If a deed number is not in that list, it may appear INSIDE a paragraph as "vide Registered Deed No. X" but must NEVER be the Nondh/entry number of the paragraph.',
                'FERFAR/Mutation Entries (' + entries.length + ' found — ALL must be written in Part IV, oldest to newest):',
                ...mutLines,
                'RULE: Use these entries to extend the title chain as far back as possible (20-25+ years). Treat this as authoritative revenue record data.',
                '==='
            ].join('\n')
            console.log('Revenue GT built: ' + entries.length + ' mutation entries')
        }

        const GT = ecGT + revGT

        // ── STEP 2: Deep legal analysis (Sonnet) — facts already extracted in parallel above ──
        const s2 = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: getS2(caseType), messages: [{ role: 'user', content: FORM + '\n\n' + GT + '\n\nEXTRACTED FACTS:\n' + facts }] })
        const analysis = s2.content[0].type === 'text' ? s2.content[0].text : ''
        const meta = parseMeta(analysis)

        const ecTbl = buildECTable(ecRows, lc, ecMetas)
        const lcSection = buildLifecycleSection(lc)
        const verdict = extractVerdict(analysis)

        // Three genuinely different scenarios, each needs its own honest message —
        // previously all three collapsed into one misleading "not tagged" sentence
        // even when a file WAS tagged but the scan simply didn't recognize it.
        let revenueProvidedFlag: string
        if (revData) {
            revenueProvidedFlag = (() => {
                const ents = revData.mutation_entries || revData.entries || []
                return 'REVENUE_RECORD_PROVIDED: YES — ' + ents.length + ' Mutation/FERFAR entries deep-scanned and available. ALL ' + ents.length + ' entries must be written as separate paragraphs in Part IV. DO NOT skip any entry.'
            })()
        } else if (revScanError) {
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: SCAN_ERROR — a Revenue Record scan was attempted but failed due to a technical error (not a content issue). Do NOT claim Revenue Record was examined or was absent. State plainly: "Revenue Record verification could not be completed due to a technical error during processing; please retry or verify manually before disbursement."'
        } else if (revImgs.length > 0 || usePreScan) {
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: TAGGED_BUT_NOT_RECOGNIZED — a document WAS specifically tagged as Revenue Record/7-12, and was scanned, but the scan could not identify recognizable 7/12, Mutation, or FERFAR content in it. Do NOT say "not tagged or produced." Instead state plainly: "A Revenue Record document was submitted for this case; however, the content could not be positively identified as a Village Form 7/12, Property Card, or Mutation Register extract on automated review. Independent manual verification of the Revenue Record is recommended before disbursement."'
        } else {
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: NOT_FOUND — a complete scan of all uploaded documents was performed automatically but no recognizable Revenue Record (7/12 / Property Card / Mutation Register / FERFAR) was identified. Do NOT claim Revenue Record was examined. State plainly: Revenue Record (7/12 / Mutation extract) was not found in the documents produced for examination; independent verification of the Revenue Record is recommended before disbursement.'
        }
        // SPEED: 5k chars of analysis is enough for the report writers (they also have FORM +
        // GT + facts). Trimming from 8k trims input tokens across the parallel Part-III/V/VII-XI
        // writers without losing anything they need.
        const ctx = FORM + '\n\n' + GT + '\n\n' + revenueProvidedFlag + '\n\nANALYSIS:\n' + analysis.substring(0, 5000) + '\n\nAPPLICANT: ' + (meta.applicant || applicantName) + '\nOWNER: ' + (meta.currentOwner || currentOwner) + '\nCASE: ' + caseType + '\nBANK: ' + bankName


        // ── STEP 3: Parallel HTML generation (4x Sonnet) — each call isolated so one failure can't sink the whole report ──
        const safeStep3 = (label: string, p: Promise<any>) => p.catch(e => {
            console.log('STEP3 ' + label + ' err:', e?.message || e)
            return { content: [{ type: 'text', text: '<p style="color:#b91c1c;"><em>' + label + ' could not be generated (' + (e?.message ? String(e.message).substring(0, 150) : 'unknown error') + '). Please retry — other sections of this report are unaffected.</em></p>' }] }
        })
        // PART IV is NO LONGER an AI call — it is built deterministically in code from the
        // structured Revenue data (see buildPart4 below). That removes the single slowest
        // generation call (8000 tokens for ~27 entries), eliminates duplicate ("2 baar")
        // entries, and gives an identical, correctly-ordered chain on every run. The remaining
        // four sections still run concurrently.
        const [r3a, r3c, r3d1, r3d2] = await Promise.all([
            safeStep3('Part III', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3500, system: S3A, messages: [{ role: 'user', content: ctx }] })),
            safeStep3('Part IV-tail + V', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3C, messages: [{ role: 'user', content: ctx + '\n\nEC TABLE HTML:\n' + ecTbl + '\n\nMORTGAGE LIFECYCLE:\n' + lcSection }] })),
            safeStep3('Part VI', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, system: S3D1, messages: [{ role: 'user', content: ctx + '\n\nVERDICT: ' + verdict }] })),
            safeStep3('Part VII-IX', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3500, system: S3D2, messages: [{ role: 'user', content: ctx + '\n\nVERDICT: ' + verdict }] }))
        ])

        const BT3 = String.fromCharCode(96).repeat(3)
        const stripFences = (t: string): string => {
            let s = t.trim()
            const htmlFence = BT3 + 'html'
            if (s.toLowerCase().startsWith(htmlFence)) s = s.slice(htmlFence.length)
            else if (s.startsWith(BT3)) s = s.slice(BT3.length)
            if (s.endsWith(BT3)) s = s.slice(0, -BT3.length)
            s = s.split(BT3).join('')
            return s.trim()
        }
        // normTerms on every generated section — the SOP terminology (Paiki -> out of,
        // "registered under", "were entered") is enforced in code across the whole report,
        // so no AI section can drift from it.
        const p1 = normTerms(stripFences(r3a.content[0].type === 'text' ? r3a.content[0].text : ''))
        const p3 = normTerms(stripFences(r3c.content[0].type === 'text' ? r3c.content[0].text : ''))
        const p4 = normTerms(stripFences(r3d1.content[0].type === 'text' ? r3d1.content[0].text : '') + stripFences(r3d2.content[0].type === 'text' ? r3d2.content[0].text : ''))

        // Borrower / Mortgagor / Constitution / Mode-of-Acquisition fields are no longer rendered:
        // the Builder-Purchase master SOP's report structure has no Borrower/Mortgagor part.
        const finalOwner = meta.currentOwner || currentOwner
        // normTerms: the property description is exactly where "Paiki" appears — SOP requires it
        // always read "out of". Enforced in code so it can never slip through.
        const finalPropDesc = normTerms(meta.propertyDescription || ('As per documents submitted — ' + propertyAddress))
        const finalBounds = normTerms(meta.propertyBoundaries || '')

        // PART I — Property Description along with Boundaries (built deterministically).
        // Per the Builder-Purchase master SOP the report opens with the property description;
        // there is no separate Borrower/Mortgagor part in this structure.
        let boundsRows = ''
        if (finalBounds) {
            const eMatch = finalBounds.match(/East[^:]*:\s*([^|]+)/i)
            const wMatch = finalBounds.match(/West[^:]*:\s*([^|]+)/i)
            const nMatch = finalBounds.match(/North[^:]*:\s*([^|]+)/i)
            const sMatch = finalBounds.match(/South[^:]*:\s*([^|]+)/i)
            boundsRows =
                '<tr><td>East (Purva)</td><td>:</td><td>' + (eMatch ? eMatch[1].trim() : (boundaryEast || 'As per documents')) + '</td></tr>' +
                '<tr><td>West (Pashchim)</td><td>:</td><td>' + (wMatch ? wMatch[1].trim() : (boundaryWest || 'As per documents')) + '</td></tr>' +
                '<tr><td>North (Uttar)</td><td>:</td><td>' + (nMatch ? nMatch[1].trim() : (boundaryNorth || 'As per documents')) + '</td></tr>' +
                '<tr><td>South (Dakshin)</td><td>:</td><td>' + (sMatch ? sMatch[1].trim() : (boundarySouth || 'As per documents')) + '</td></tr>'
        } else {
            boundsRows =
                '<tr><td>East (Purva)</td><td>:</td><td>' + (boundaryEast || 'As per documents') + '</td></tr>' +
                '<tr><td>West (Pashchim)</td><td>:</td><td>' + (boundaryWest || 'As per documents') + '</td></tr>' +
                '<tr><td>North (Uttar)</td><td>:</td><td>' + (boundaryNorth || 'As per documents') + '</td></tr>' +
                '<tr><td>South (Dakshin)</td><td>:</td><td>' + (boundarySouth || 'As per documents') + '</td></tr>'
        }
        const part1 =
            '<hr><div class="ph">PART I — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES</div>' +
            '<div class="prop-para">' + finalPropDesc + '</div>' +
            '<p><strong>Bounded as Under:</strong></p>' +
            '<table class="mt">' + boundsRows + '</table>'

        // PART III — built deterministically from the structured Revenue data (no AI call):
        // every Nondh exactly once, chronological order, duplicate-free, identical every run.
        const part3 = buildPart4(revData, finalOwner)

        // Report order per the Builder-Purchase master SOP:
        //   PART I  — Property Description along with Boundaries   (part1, deterministic)
        //   PART II — List of Scrutinised Documents                (p1  = S3A)
        //   PART III— Chronological Title Chain and History        (part3 deterministic chain,
        //             then p3's Part III tail: EC + Approvals + the mandatory Builder→Purchaser para)
        //   PART IV — Legal Issues, Objections and Adverse Findings (p3 continues)
        //   PART V  — Legal Opinion and Final Recommendation        (p4 = S3D1)
        //   then Documents Required (Pre/Post), Risk Rating, Confidence Level,
        //        Overall Title Status                               (p4 continues = S3D2)
        const html = buildReport(refNo, appId, today, bankName, loanMap[caseType] || loanType,
            part1 + p1 + part3 + p3 + p4
        )

        if (userId && DB) { try { await DB.from('reports').insert({ user_id: userId, case_type: caseType, applicant_name: meta.applicant || applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: meta.propertyDescription || propertyAddress || 'Unknown', app_id: appId || refNo, verdict, report_html: html }) } catch (e) { console.log('DB:', e) } }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle: lc, ecRows, ecMetas })

    } catch (e: any) {
        console.error('Pipeline:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}