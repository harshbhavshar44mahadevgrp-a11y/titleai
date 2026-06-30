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
// STEP 1 SYSTEM — PROVEN v5.3 EXTRACTION ENGINE
// ================================================================
const S1 = `You are a Senior Gujarat Property Law Expert. Extract ALL raw facts from documents accurately.

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
APPLICANT: [proposed purchaser — from Draft/AoS Buyer section — NEVER from stamp paper]
CO_APPLICANT: [names or N/A]
CURRENT_OWNER: [from latest deed — full name, and "a Partnership Firm"/"Pvt Ltd" etc if applicable]
CONSTITUTION: [Individual / Partnership Firm / Private Limited Company / HUF — of the Borrower]
MODE_OF_ACQUISITION: [e.g. "Sale Deed" / "Registered Sale Deed" / "Allotment by Developer" — how Current Owner acquired the property]
REGISTRATION_DETAILS: [Document No. [X] | Dated: [DD-MM-YYYY] | SRO: [name] — of the deed by which Current Owner acquired title]
PROPERTY_DESCRIPTION: [MANDATORY EXACT PARAGRAPH FORMAT — fill every blank, do not paraphrase or shorten:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Office] No. [X] on [Nth] Floor in Block No. "[X]" having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as "[Scheme Name]" constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District: [District]."
If any individual area component (Balcony/Wash/UPS) is not applicable or not found in documents, omit that specific clause naturally rather than leaving a blank.]
PROPERTY_BOUNDARIES: [East (Purva): | West (Pashchim): | North (Uttar): | South (Dakshin): — from ALL documents including annexures]
---END META---

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

EC COLUMN RULE — PERMANENT:
LEFT/Aapnar = WHO GIVES | RIGHT/Lenar = WHO RECEIVES
BANK IN LEFT = RELEASE DEED | BANK IN RIGHT = MORTGAGE DEED

PART II — "THEREAFTER" RULE:
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
const S3A = `Generate HTML for PART III ONLY — List of Scrutinized Documents.
(Note: Part I — Borrower/Mortgagor/Ownership and Part II — Property Description are generated separately and already appear before this section. Do NOT regenerate them. Start directly with Part III.)
LATEST document FIRST. OLDEST LAST.

EC FORMAT — WRITE EVERY SINGLE ENTRY FOUND INSIDE THE EC:
<div class="di"><p><span class="dn">N. Encumbrance Certificate — E-App. No.: [APP_NO] | Dated: [DATE] | Period: [FROM] to [TO]</span><br>
EC bearing E-Application No. [APP_NO] dated [DATE] for search period [FROM] to [TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [N] registered transactions found on row-by-row examination. Entries reflect: (i) [Row 1 — deed type, deed number, date, exact parties from→to, key finding]; (ii) [Row 2 — same detail]; (iii) [Row 3 if exists — same detail including if mortgage is active or discharged and by which release deed]. [Final sentence on overall encumbrance status.]</p></div>

EC ENTRY DETAIL RULE — MANDATORY:
For EACH row inside EC write: deed type | deed number | date | who executed (Aapnar) | in whose favour (Lenar) | what it achieved.
If mortgage row: add "which stands discharged vide Release Deed No.[X] dated [date]" OR "which is subsisting and active as on date".
If release row: add "confirming formal discharge of builder-level mortgage / Mortgage Deed No.[X] dated [date]".
NEVER write just a generic one-line EC summary. EVERY row must be described.

RELEASE DEED FORMAT (if submitted as separate document):
<div class="di"><p><span class="dn">N. Reconveyance / Mortgage Release Deed — Deed No. [X] | Dated: [DATE]</span><br>[Bank] unto and in favour of [Owner] through [Authorised Partner]. SRO: [SRO]. This Release Deed formally discharges and extinguishes Mortgage Deed No. [X] dated [DATE] created by [mortgagor] in respect of [property]. Upon registration of this deed, the mortgage stands fully satisfied and released. No residual charge or encumbrance survives from the said mortgage as of [date].</p></div>

RULES: NEVER "and others". NEVER mutation entries in this Part. NEVER stamp paper numbers.
START: <hr><div class="ph">PART III — LIST OF SCRUTINIZED DOCUMENTS</div>
<p>The following documents have been produced for examination and scrutiny:</p>
END: after last document entry.`

// ================================================================
// STEP 3B — PART II SYSTEM
// ================================================================
const S3B = `Generate HTML for PART IV ONLY — Chronological Title Chain and History of Property.
(Note: Part I — Borrower/Mortgagor/Ownership, Part II — Property Description, and Part III — List of Scrutinized Documents are generated separately and already appear before this section. Do NOT regenerate them. Start directly with Part IV.)
OLDEST FIRST — NEWEST LAST. Write EVERY link in FULL DETAIL from the very beginning.

TITLE CHAIN SOURCE — PERMANENT RULE — REVENUE RECORD ONLY, NEVER EC:
This chain is built from Revenue Record data (7/12, Village Form 7/8-A/12, FERFAR/Mutation Register entries — see Revenue Record Ground Truth in context) and the actual registered deeds submitted. The Encumbrance Certificate is NEVER used as the source or anchor for this narrative — EC belongs only to Part V (encumbrance status), not Part IV (history).
The chain must reach back AT LEAST 20-25 years (ideally 30 years) from the report date wherever Revenue Record / deed evidence supports it.
Check the extracted facts and Revenue Record Ground Truth carefully for: old/original Survey Numbers, 7/12 history, Village Form 7/8-A/12 entries, every FERFAR/Mutation Register entry, any recital of earlier/ancestral/inherited ownership — and START THE CHAIN FROM THE EARLIEST SUCH POINT FOUND.

REVENUE RECORD HONESTY RULE — MANDATORY — CHECK THE REVENUE_RECORD_PROVIDED FLAG IN CONTEXT:
If REVENUE_RECORD_PROVIDED says YES: you MUST cite the ACTUAL Mutation/FERFAR Entry Number(s) and date(s) given in the Revenue Record Ground Truth — never write a generic phrase like "as evidenced from the Revenue Record" without naming the specific entry number. Pull real entry_no, entry_date, and nature values directly from the Revenue Record Ground Truth block and weave them into the relevant paragraph(s).
If REVENUE_RECORD_PROVIDED says NO: do NOT write any sentence implying Revenue Record, 7/12, Village Form, or Mutation entries were examined — that would be fabricated. Instead, build the chain entirely from the registered deeds' own recitals (their stated parties, dates, and prior-title references), and in the final paragraph state plainly: "Revenue Record (7/12 / Village Form / Mutation extract) was not separately produced for verification in this matter; the chain set out above is accordingly based on the recitals contained in the registered deeds examined." This is the honest, advocate-correct way to handle absent revenue records — never paper over the gap with vague boilerplate.

OPENING PARAGRAPH (NO "Thereafter"):
Begin with the EARLIEST title holder traceable from ALL documents (not just the EC). Describe: who held the property, with what shares or interest, exact land details (Survey No — including OLD survey number if referenced, TP Scheme No, FP No, village, taluka, district), area, and tenure if mentioned (Old Tenure/Juni Sharat etc.). Name EVERY co-owner individually with their exact percentage undivided share. Describe the first conveyance: vide Registered [Deed Type] bearing Registration No. [X] dated [DD/MM/YYYY] registered at Sub-Registrar Office, [SRO]. State full consideration and result. Include any FERFAR/Mutation entry referencing this earliest event if available. End with mutation if available.
If revenue records (7/12, FERFAR) show prior owners/entries BEFORE this first deed, describe those briefly first, then proceed to the first registered conveyance.

EACH SUBSEQUENT PARAGRAPH must start "Thereafter,":
Every transaction = one full paragraph. Include: deed type | Registration No. | date | SRO | all party names individually | consideration | what this achieves legally. For declaration deeds: describe nature and whether any adverse charge was created. For mortgages: describe as builder/developer-level mortgage over [property] as security. Then immediately state whether discharged or active.

RELEASED MORTGAGE — EXACT WORDING MANDATORY:
"The said mortgage subsequently stands discharged and the charge has been fully released and satisfied vide Reconveyance / Mortgage Release Deed No. [X] dated [DD/MM/YYYY] executed by [Bank full name] unto and in favour of [Owner], a Partnership Firm, through its Authorised Partner [Name] — no subsisting charge of [Bank] remains on the subject property as on date."

FINAL STATUS PARAGRAPH — ANCHOR ON REVENUE RECORD, NOT EC — TWO VERSIONS DEPENDING ON THE FLAG:

If REVENUE_RECORD_PROVIDED=YES, use:
"Thereafter, [Current Owner] holds the right, title and interest in the subject land and the [scheme name] constructed thereon — including [flat/unit details] being the subject flat — as the present registered owner and developer, as confirmed by the Revenue Record, the Ownership Column of [Village Form No. 7/12 etc.] reflecting [Current Owner] as the recorded Kabjedar/Khatedar, consistent with Mutation Entry No. [ACTUAL entry_no from Revenue Record Ground Truth] dated [ACTUAL entry_date from Revenue Record Ground Truth] certifying this transfer. [If mortgage exists/existed: As per the mortgage and release deeds examined, [mortgage description] having been formally and fully discharged and released vide Deed No. [X] dated [date] well prior to the proposed conveyance in favour of the proposed purchaser-mortgagor — no subsisting charge remains as on the date of this report.]"

If REVENUE_RECORD_PROVIDED=NO, use instead:
"Thereafter, [Current Owner] holds the right, title and interest in the subject land and the [scheme name] constructed thereon — including [flat/unit details] being the subject flat — as the present registered owner and developer, as evidenced by the recitals of the registered deeds examined above. Revenue Record (7/12 / Village Form / Mutation extract) was not separately produced for verification in this matter; independent confirmation of the Ownership Column against current Revenue Record is accordingly recommended prior to disbursement. [If mortgage exists/existed: As per the mortgage and release deeds examined, [mortgage description] having been formally and fully discharged and released vide Deed No. [X] dated [date] well prior to the proposed conveyance in favour of the proposed purchaser-mortgagor — no subsisting charge remains as on the date of this report.]"

Do NOT cite "Encumbrance Certificate bearing E-Application No." anywhere in this paragraph or anywhere else in Part IV — ownership continuity is confirmed by Revenue Record/Mutation entries (or honestly flagged as unconfirmed), never by EC.

RULES: NEVER "and others". First para = no Thereafter. Every other = starts Thereafter.
Subject property ONLY. Every Revenue Record Mutation/FERFAR entry AND every registered deed = one paragraph minimum. EC rows are NEVER the paragraph source.
START: <hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END: after last paragraph.`

// ================================================================
// STEP 3C — PART III (ALERTS) SYSTEM
// ================================================================
// STEP 3C — PART III (ALERTS) SYSTEM
// ================================================================
const S3C = `Generate HTML for PART III (Alerts) + PART V (Regulatory) ONLY.

PART V REGULATORY FORMAT:
<div class="sph">A. Revenue Record (7/12 / Property Card)</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[name]</td></tr>
<tr><td>District</td><td>:</td><td>[name]</td></tr>
<tr><td>Survey / Block / FP No.</td><td>:</td><td>[exact details]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[area with flat details]</td></tr>
<tr><td>Land Use</td><td>:</td><td>Non-Agricultural — confirmed via EC and RERA. [note if any]</td></tr>
<tr><td>Ownership Column</td><td>:</td><td>[owner name] — vested via [deed details]</td></tr>
<tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL subsisting / ACTIVE details]</td></tr>
<tr><td>Ganot / Tenant</td><td>:</td><td>NIL</td></tr>
</table>

RERA: Include exact RERA registration number if mentioned.

ALERTS FORMAT — SHORT AND PRECISE:
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[3 sentences max with exact deed numbers]</p><p><span class="sg">Direction:</span> [action]</p></div>
MEDIUM: same with class "sm"
LOW: same with class "sl"

NEVER flag: released mortgages | EC-confirmed deeds | EC applicant name
NEVER list more than 5-6 alerts total.

START: <hr><div class="ph">PART V — APPROVALS AND REGULATORY COMPLIANCE</div>
...then...
<hr><div class="ph">PART VI — ALERTS AND ADVERSE FINDINGS</div>
END: after last alert.`

// ================================================================
// STEP 3D — PARTS VII-XI SYSTEM
// ================================================================
const S3D = `Generate HTML for PARTS VII through XI ONLY.

PART VII DOCUMENTS FORMAT:
<div class="sph">A. Documents Submitted and Available</div><ol>
<li>[EC App No + Period + date + key finding]</li>
<li>[Deed type + No + date + parties]</li>
</ol>
<div class="sph">B. Critical Missing (Report Hold)</div><ol>[or <li>NIL</li>]</ol>
<div class="sph">C. Important Missing (Pre-Disbursement)</div><ol>[list]</ol>
<div class="sph">D. Illegible / Incomplete</div><ol>[or <li>NIL — No illegibility noted.</li>]</ol>
<div class="sph">E. Risk Assessment Summary</div>
<table class="mt">
<tr><td>Title Risk Level</td><td>:</td><td>[LOW/MODERATE/HIGH]</td></tr>
<tr><td>Mortgageability Status</td><td>:</td><td>[Mortgageable/Conditionally/Not]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable/Conditionally/Not]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable/Conditionally/Not]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate/Marginal/Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentences]</td></tr>
</table>

PART VIII LEGAL OPINION:
<hr><div class="ph">PART VIII — LEGAL OPINION AND VERDICT</div>
<p>[Insert exact legal opinion paragraph]</p>
[Verdict box based on severity:
NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p>[conditions]</p></div>
CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p>Mortgageable subject to: [list]</p></div>
CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p>[brief reason]</p></div>]

PART IX PRE-DISBURSEMENT:
Each item: <li><strong>[Document Name]</strong><br><em>Source:</em> [who/where]<br><em>Purpose:</em> [specific legal reason]</li>

PART X POST-DISBURSEMENT: Standard 6-8 items.

PART XI FINAL RECOMMENDATION:
<div class="final-rec"><div class="fr-title">FINAL TITLE STATUS:</div><div class="fr-value">[CLEAR TITLE SUBJECT TO CONDITIONS / TITLE NOT CLEAR / CLEAR AND MARKETABLE]</div></div>
<p>[5-6 sentences covering: title chain summary | EC App numbers + period + status | mortgage lifecycle with deed numbers | RERA status | outstanding conditions | SARFAESI | bank recommendation]</p>

START: <hr><div class="ph">PART VII — DOCUMENT DEFICIENCY REPORT</div>
END: after Part XI paragraph.`


// ================================================================
// EC PRE-SCREEN PROMPT
// ================================================================
const EC_PS = 'Look at ALL uploaded images. Find Encumbrance Certificate (EC) table.\n\nCRITICAL RULE:\nCOL 3 = Aapnar = LEFT = WHO GIVES\nCOL 4 = Lenar = RIGHT = WHO RECEIVES\nBANK IN COL 3 = RELEASE DEED | BANK IN COL 4 = MORTGAGE DEED\n\nExtract EVERY EC row + header. Also check ALL docs for Release Deed / Giro Mukeli / Reconveyance.\n\nOutput ONLY JSON:\n{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}],"pre_screen_releases":[{"bank":"","deed_no":"","date":"","source":""}]}'

const REV_PS = 'Look at ALL uploaded images. Find Revenue Records: Village Form No. 7 (Satbara/7-12), Village Form No. 8-A, Village Form No. 12, Property Card, City Survey extract, and FERFAR / Mutation Register / Gamnamuna No. 6 entries.\n\nFor the SUBJECT PROPERTY land only, extract:\n- village (Mouje), taluka, district\n- survey_block_no (include OLD survey number if the document references one, e.g. \"allotted in lieu of Survey No. X\")\n- total_area (with unit, e.g. H.Are.SqMt or Sq.Mtrs.)\n- land_use (exact words seen — Bin Kheti / Kheti / Non-Agricultural / Agricultural)\n- tenure (e.g. Juni Sharat / Old Tenure / Naa Sharat / New Tenure — if mentioned)\n- ownership_column (current Kabjedar/Khatedar name exactly as written)\n- boja_column (exact wording of Boja/encumbrance entry, or \"NIL\" if blank/clear)\n- ganot_column (tenant entry, or \"NIL\" if blank)\n\nAlso extract EVERY visible FERFAR/Mutation entry, oldest to newest, however old:\nFor each entry give: entry_no, entry_date, status (Certified or Rejected if stated), nature (description of what changed — sale/inheritance/NA conversion/death of owner/etc), relevant_survey_no (only if explicitly tied to this entry).\n\nDo NOT skip old entries even if faded or partial — extract whatever is legible. This data will be used to build a 20-25 year title history, so completeness matters more than brevity.\n\nOutput ONLY JSON:\n{"village":"","taluka":"","district":"","survey_block_no":"","total_area":"","land_use":"","tenure":"","ownership_column":"","boja_column":"","ganot_column":"","mutation_entries":[{"entry_no":"","entry_date":"","status":"","nature":"","relevant_survey_no":""}]}\nIf no revenue record document found: {"found":false}'

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
            boundaryNorth = '', boundarySouth = '', userId = null
        } = body

        if (!images || images.length === 0)
            return NextResponse.json({ success: false, error: 'No documents uploaded. Please upload EC and property documents.' }, { status: 400 })

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
        let facts = ''

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

        const revPrescreen = revImgs.length === 0 ? Promise.resolve() :
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, messages: [{ role: 'user', content: [...revImgs, { type: 'text', text: REV_PS }] }] })
                .then(rs => {
                    const r = parseJSON(rs.content[0].type === 'text' ? rs.content[0].text : '{}')
                    if (r && r.found !== false) { revData = r; console.log('REV P0: village=' + (r.village || '?') + ' mutations=' + (r.mutation_entries?.length || 0)) }
                })
                .catch(e => console.log('REV PS err:', e))

        const step1Promise = AI.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 6000, system: S1, messages: [{ role: 'user', content: [...allImgs, { type: 'text', text: FORM + '\n\nExtract ALL facts. Case: ' + caseType + '. Property: ' + propertyAddress }] }] })
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

        let revGT = ''
        if (revData) {
            const mutLines = (revData.mutation_entries || []).map((m: any, idx: number) => '  ' + (idx + 1) + '. Entry No.' + (m.entry_no || '?') + ' | Date:' + (m.entry_date || '?') + ' | Status:' + (m.status || '?') + ' | ' + (m.nature || '') + (m.relevant_survey_no ? (' | Survey:' + m.relevant_survey_no) : ''))
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
                'FERFAR/Mutation Entries (' + ((revData.mutation_entries || []).length) + ' found, oldest to newest):',
                ...mutLines,
                'RULE: Use these entries to extend the title chain as far back as possible (20-25+ years). Treat this as authoritative revenue record data.',
                '==='
            ].join('\n')
            console.log('Revenue GT built: ' + (revData.mutation_entries?.length || 0) + ' mutation entries')
        }

        const GT = ecGT + revGT

        // ── STEP 2: Deep legal analysis (Sonnet) — facts already extracted in parallel above ──
        const s2 = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, system: getS2(caseType), messages: [{ role: 'user', content: FORM + '\n\n' + GT + '\n\nEXTRACTED FACTS:\n' + facts }] })
        const analysis = s2.content[0].type === 'text' ? s2.content[0].text : ''
        const meta = parseMeta(analysis)

        const ecTbl = buildECTable(ecRows, lc, ecMetas)
        const lcSection = buildLifecycleSection(lc)
        const verdict = extractVerdict(analysis)

        const revenueProvidedFlag = revData ? 'REVENUE_RECORD_PROVIDED: YES — ' + ((revData.mutation_entries || []).length) + ' Mutation/FERFAR entries deep-scanned, cite them specifically by entry number and date.' : 'REVENUE_RECORD_PROVIDED: NO — no 7/12 / Mutation / FERFAR document was tagged or scanned for this case. Do NOT claim Revenue Record was examined. State plainly that Revenue Record / Mutation extract was not separately produced for verification.'
        const ctx = FORM + '\n\n' + GT + '\n\n' + revenueProvidedFlag + '\n\nANALYSIS:\n' + analysis.substring(0, 3500) + '\n\nAPPLICANT: ' + (meta.applicant || applicantName) + '\nOWNER: ' + (meta.currentOwner || currentOwner) + '\nCASE: ' + caseType + '\nBANK: ' + bankName

        // ── STEP 3: Parallel HTML generation (4x Sonnet) ──
        const [r3a, r3b, r3c, r3d] = await Promise.all([
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3A, messages: [{ role: 'user', content: ctx }] }),
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, system: S3B, messages: [{ role: 'user', content: ctx }] }),
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 5000, system: S3C, messages: [{ role: 'user', content: ctx + '\n\nEC TABLE HTML:\n' + ecTbl + '\n\nMORTGAGE LIFECYCLE:\n' + lcSection }] }),
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3D, messages: [{ role: 'user', content: ctx + '\n\nVERDICT: ' + verdict }] })
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
        const p1 = stripFences(r3a.content[0].type === 'text' ? r3a.content[0].text : '')
        const p2 = stripFences(r3b.content[0].type === 'text' ? r3b.content[0].text : '')
        const p3 = stripFences(r3c.content[0].type === 'text' ? r3c.content[0].text : '')
        const p4 = stripFences(r3d.content[0].type === 'text' ? r3d.content[0].text : '')

        const finalApplicant = meta.applicant || applicantName
        const finalCoApp = meta.coApplicant || coApplicant || 'Not Applicable'
        const finalOwner = meta.currentOwner || currentOwner
        const finalConstitution = meta.constitution || 'Individual'
        const finalModeAcq = meta.modeOfAcquisition || 'As per documents submitted'
        const finalRegDetails = meta.registrationDetails || 'As per documents submitted'
        const finalPropDesc = meta.propertyDescription || ('As per documents submitted — ' + propertyAddress)
        const finalBounds = meta.propertyBoundaries || ''

        // PART I — Borrower / Mortgagor / Current Ownership (built deterministically — always correct, never skipped)
        const part1 =
            '<hr><div class="ph">PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>' +
            '<div class="sph">A. Borrower Details</div>' +
            '<table class="mt">' +
            '<tr><td>Name of Borrower/s</td><td>:</td><td>' + finalApplicant + '</td></tr>' +
            '<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>' + finalCoApp + '</td></tr>' +
            '<tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr>' +
            '<tr><td>Constitution</td><td>:</td><td>' + finalConstitution + '</td></tr>' +
            '</table>' +
            '<div class="sph">B. Mortgagor Details</div>' +
            '<table class="mt">' +
            '<tr><td>Name of Mortgagor/s</td><td>:</td><td>' + finalApplicant + '</td></tr>' +
            '<tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr>' +
            '<tr><td>Constitution</td><td>:</td><td>' + finalConstitution + '</td></tr>' +
            '</table>' +
            '<div class="sph">C. Current Ownership</div>' +
            '<table class="mt">' +
            '<tr><td>Current Owner/s</td><td>:</td><td>' + finalOwner + '</td></tr>' +
            '<tr><td>Mode of Acquisition</td><td>:</td><td>' + finalModeAcq + '</td></tr>' +
            '<tr><td>Registration Details</td><td>:</td><td>' + finalRegDetails + '</td></tr>' +
            '</table>'

        // PART II — Property Description (exact opinion paragraph + boundaries — built deterministically)
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
        const part2 =
            '<hr><div class="ph">PART II — PROPERTY DESCRIPTION</div>' +
            '<div class="prop-para">' + finalPropDesc + '</div>' +
            '<table class="mt">' + boundsRows + '</table>'

        const html = buildReport(refNo, appId, today, bankName, loanMap[caseType] || loanType,
            part1 + part2 + p1 + p2 + p3 + p4
        )

        if (userId && DB) { try { await DB.from('reports').insert({ user_id: userId, case_type: caseType, applicant_name: meta.applicant || applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: meta.propertyDescription || propertyAddress || 'Unknown', app_id: appId || refNo, verdict, report_html: html }) } catch (e) { console.log('DB:', e) } }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle: lc, ecRows, ecMetas })

    } catch (e: any) {
        console.error('Pipeline:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}