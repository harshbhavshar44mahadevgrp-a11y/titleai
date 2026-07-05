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
// STEP 3B — PART IV SYSTEM
// ================================================================
const S3B = `You are writing PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY.

LANGUAGE: Formal English only. No Gujarati script. Translate all Gujarati terms to English.
Examples: "Bin Kheti" = Non-Agricultural | "Juni Sharat" = Old Tenure | "Naa Sharat" = New Tenure

SOURCE RULE — NON-NEGOTIABLE, APPLIES TO EVERY SINGLE REPORT:
Write Part IV paragraphs ONLY from Revenue Record Nondh entries.
EC (Encumbrance Certificate) entries are NEVER the source for any paragraph in Part IV.
Do NOT write "Thereafter, vide EC Entry No. [X]..." — that is wrong.
Do NOT use EC entry numbers as the basis for chain paragraphs.
EC is used ONLY for the final one-sentence cross-verification at the end.

CHECK THE FLAG FIRST:
Look at the revenueProvidedFlag in your context (it starts with REVENUE_RECORD_PROVIDED:).

IF REVENUE_RECORD_PROVIDED says YES:
→ Write the chain from the Revenue Record entries listed in the Revenue Record Ground Truth.
→ Write EVERY SINGLE Revenue Record entry, in chronological order EARLIEST → PRESENT.
→ Each Nondh entry from revGT = one heading + one paragraph (as shown in format below).
→ Do NOT use EC entries as chain paragraphs. Do NOT create any paragraph whose source is
  an EC deed/entry. If a fact appears ONLY in the EC and not in the Revenue Record, it does
  NOT get its own chain paragraph — it may only be mentioned in the final EC cross-verification
  sentence. The chain paragraphs come from Revenue Record entries and nothing else.

IF REVENUE_RECORD_PROVIDED does NOT say YES (any other value):
→ Do NOT attempt to write the chain from EC or any other source.
→ Write ONLY this single paragraph:
<p>Revenue Record (Village Form 7/12 / Mutation Register / FERFAR / Property Card) was not available for independent extraction in this case. The title chain for the subject property cannot be independently traced from Revenue Record entries on the basis of documents produced. Independent verification of the Revenue Record is strongly recommended before disbursement to confirm ownership continuity, land use, encumbrance status and Kabjedar/Khatedar details.</p>
→ Then write the EC cross-verification sentence and stop. Do not write any further chain paragraphs.
→ NEVER fill this gap with EC entries — EC entries are not a substitute for Revenue Record chain paragraphs.

═══════════════════════════════════════════
NONDH NUMBER vs DEED NUMBER — CRITICAL, READ FIRST
═══════════════════════════════════════════
A "Nondh" / "Mutation Entry" number is the Revenue-Record entry number (from the FERFAR /
Gamnamuna No. 6 register). A "Deed" / "Document" number is the number printed on a registered
Sale / Mortgage / Release deed. THESE ARE DIFFERENT NUMBERS.
- The Revenue Record Ground Truth lists a line "VALID NONDH (MUTATION ENTRY) NUMBERS — ...".
  Those are the ONLY numbers allowed as the entry number of a chain paragraph.
- A registered Deed/Document number (e.g. a sale deed number) is NEVER a Nondh number.
  It may appear INSIDE a paragraph as "vide Registered Sale Deed bearing Document No. X",
  but you must NEVER write "Nondh Entry No. <deed number>" or head a paragraph with it.
- If you find yourself about to start a chain paragraph with a number that is NOT in the
  VALID NONDH list, STOP — you have grabbed a deed number by mistake. Use the correct Nondh
  number from the list (the entry whose narrative mentions that deed).

ABSOLUTE — NEVER MAKE A CHAIN ENTRY OUT OF A NON-FERFAR DOCUMENT:
An AAI/Airport NOC, a GUDA/AUDA development permission, a RERA registration certificate, a
building-plan approval, an Index-2, or a bare registered deed is NOT a Nondh/Mutation entry.
NEVER write a heading like "Nondh Entry No. AAI NOC ..." or "Nondh Entry No. GUDA Development
Permission ..." or "Nondh Entry No. RERA Registration ...". These have no Nondh number and are
NOT part of the chronological title chain. A NOC/permission/RERA may be mentioned in ONE short
sentence under Part V (Regulatory), but it must NEVER appear as a chain entry in Part IV. Every
Part IV chain heading MUST be a numeric Nondh number from the VALID NONDH list — nothing else.

═══════════════════════════════════════════
MANDATORY FORMAT FOR EVERY NONDH ENTRY
═══════════════════════════════════════════

Every single Nondh (Mutation Entry) from the Revenue Record Ground Truth must appear in the output as:

(A) A HEADING LINE for that entry:
<div class="sph">Nondh Entry No. [entry_no] | Dated: [entry_date] | Certification Date: [certification_date] | Status: [status]</div>

(B) Immediately followed by a FULL NARRATIVE PARAGRAPH:
<p>Thereafter, vide Mutation Entry No. [entry_no] dated [entry_date] (Certification Date: [certification_date]; Status: [status]), [PREVIOUS OWNER full name], as the recorded Kabjedar/Khatedar, transferred and conveyed the subject land bearing Survey No. [survey_no], Mouje: [village], Taluka: [taluka], District: [district], admeasuring [area], [land use], [tenure], to [NEW OWNER full name], vide [supporting document type and number if available, e.g. "Registered Sale Deed bearing Document No. X dated DD-MM-YYYY"]. By virtue of this certified mutation entry, [NEW OWNER] stood recorded as the Kabjedar/Khatedar in the Revenue Record in place of [PREVIOUS OWNER]. [Include any legally relevant remarks from the entry — permissions, court orders, revisions, Ganot case references, etc.]</p>

RULES FOR THE NARRATIVE PARAGRAPH:
- Include EVERY field available: Entry No., Date, Certification Date, Status, Previous Owner, New Owner, Survey No., Area, Land Use, Tenure, Nature, Supporting Document, Remarks
- If any field is not available in the extract, say so explicitly e.g. "date not stated in extract produced" or "previous owner not disclosed in extract"
- Never write a one-line summary. Never write just the entry number. Write the complete legal narrative.
- Never merge two entries into one paragraph.
- Never skip an entry because it seems similar to another.

═══════════════════════════════════════════
OPENING BEFORE FIRST NONDH ENTRY
═══════════════════════════════════════════

Before the first Nondh heading, write this disclosure paragraph if applicable:
<p>[If older entries are referenced but not produced]: Revenue records prior to Mutation Entry No. [earliest available entry no.] were not available in the documents produced; the chain accordingly commences from the earliest available record. The following Mutation Entry numbers are referenced in the Revenue Record extract but without transfer particulars or owner details: Entry Nos. [list all such numbers]. Complete verification of the title chain prior to Entry No. [X] is therefore not possible on the basis of the Revenue Record as produced.</p>

The very first Nondh entry that HAS ownership details does NOT get "Thereafter" — it starts directly:
<p>The subject land bearing Survey No. [X]... stood recorded in the name of [OWNER]... vide Mutation Entry No. [X]...</p>

All entries after the first get "Thereafter," at the start of their narrative paragraph.

═══════════════════════════════════════════
NON-AGRICULTURAL / LAND-USE CONVERSION ORDER (SOP — MANDATORY IF PRESENT)
═══════════════════════════════════════════
The Revenue Record Ground Truth may contain a line "NA / Conversion Order: ...".
If it names a Non-Agricultural / land-use conversion order (order number and/or date),
you MUST state it in the chain at the point it belongs — either inside the relevant
Nondh paragraph (when a Mutation Entry records the NA conversion) or as its own short
paragraph right after the entry where the land became Non-Agricultural, e.g.:
<p>The subject land was converted to Non-Agricultural use vide Order No. [X] dated [date], as reflected in the Revenue Record.</p>
If it says "NOT STATED IN REVENUE RECORD", do not invent one — simply omit this.

═══════════════════════════════════════════
COUNT-AND-VERIFY BEFORE FINISHING
═══════════════════════════════════════════

The Revenue Record Ground Truth in your context shows the total number of entries found.
Count how many Nondh headings you have written.
If that count is less than the total entries shown — go back and add the missing entries before finishing.
Do NOT stop writing until every single entry from the Revenue Record Ground Truth has its own heading and paragraph.

═══════════════════════════════════════════
BOJA / ENCUMBRANCE ENTRIES
═══════════════════════════════════════════

If the Boja/Encumbrance column of the Revenue Record lists additional entry notations, write them as their own entries with headings:
<div class="sph">Boja / Encumbrance Entries Noted in Revenue Record</div>
<p>Thereafter, the Boja/Encumbrance column of the Revenue Record records the following entry notations against the subject property: Entry Nos. [list]. [For each entry that has a description, explain what it records — e.g. NA permission, court revision, Ganot case, mortgage.] Full details and supporting documents for these entries have not been separately produced for examination.</p>

═══════════════════════════════════════════
CURRENT STATUS AND EC CROSS-VERIFICATION
═══════════════════════════════════════════

After all Nondh entries, write:
<div class="sph">Current Revenue Record Status</div>
<p>Thereafter, [Current Owner full name] holds the right, title and interest in the subject land as the present recorded Kabjedar/Khatedar in the Revenue Record, as evidenced by the certified Mutation Entry No. [X]. Land use: Non-Agricultural. Tenant / Ganot column: NIL. [Any other current record details.]</p>

Final sentence — EC cross-verification only (one sentence, no heading):
<p>The above Revenue Record chain is cross-verified against the Encumbrance Certificate bearing E-Application No. [X] covering the period [from] to [to] — [no discrepancy found between Revenue Record entries and EC entries / the following discrepancy is noted: ___ ].</p>

START: <hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END: after the EC cross-verification paragraph.`

// ================================================================
// STEP 3C — PART V (REGULATORY) + PART VI (ALERTS) SYSTEM
// ================================================================
const S3C = `Generate HTML for PART V (Regulatory) + PART VI (Alerts) ONLY.

LANGUAGE RULE: EVERYTHING in formal English only. NEVER use Gujarati script. Village names, land use, tenure, owner names — all in English. Write 'Non-Agricultural (Bin Kheti)' not 'બિન ખેતી'. Write 'Koba' not 'કોબા'.

PART V REGULATORY FORMAT — REVENUE RECORD TABLE MUST USE REAL SCANNED DATA:
Check the REVENUE_RECORD_PROVIDED flag and the Revenue Record Ground Truth block in context.
If REVENUE_RECORD_PROVIDED says exactly "YES": fill every row below using the ACTUAL values from Revenue Record Ground Truth (Village, Taluka, District, Survey/Block No, Total Area, Land Use, Tenure, Ownership Column, Boja/Encumbrance Column, Ganot/Tenant Column) — these are real deep-scanned fields, use them exactly, do not invent or guess values.
If REVENUE_RECORD_PROVIDED does NOT say "YES" (whatever specific reason it gives — scan error, tagged but unrecognized, or not tagged at all): write "NOT PROVIDED FOR VERIFICATION" honestly for each row below rather than guessing plausible-looking values — never fabricate Village/Taluka/District/Land Use details that were not actually scanned. If the flag indicates a scan error specifically, you may instead note "Verification pending — technical error during scan, retry recommended" for these rows rather than the standard NOT PROVIDED wording, since that more accurately reflects what happened.
<div class="sph">A. Revenue Record (7/12 / Property Card)</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[real value from Revenue Record Ground Truth, or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[real value or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>District</td><td>:</td><td>[real value or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Survey / Block / FP No.</td><td>:</td><td>[real survey_block_no value or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[real total_area value or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Tenure</td><td>:</td><td>[real tenure value or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Land Use</td><td>:</td><td>[real land_use value — note if it confirms Non-Agricultural — or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Ownership Column</td><td>:</td><td>[real ownership_column value, or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Boja / Encumbrance</td><td>:</td><td>[real boja_column value, or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
<tr><td>Ganot / Tenant</td><td>:</td><td>[real ganot_column value, or "NOT PROVIDED FOR VERIFICATION"]</td></tr>
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
const S3D1 = `Generate HTML for PART VII and PART VIII ONLY — nothing else.

BOTH PARTS MUST BE COMPLETE, EVERY TIME:
Write Part VII fully (all 5 sub-sections A-E), then Part VIII fully (legal opinion paragraph + complete verdict box with every numbered condition — never cut off mid-list). Keep Part VII thorough but not bloated so Part VIII has room to finish completely.

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

START: <hr><div class="ph">PART VII — DOCUMENT DEFICIENCY REPORT</div>
END: after the verdict box closing div.`

// ================================================================
// STEP 3E — PART IX-XI SYSTEM (split from S3D for parallel speed)
// ================================================================
const S3D2 = `Generate HTML for PART IX, PART X, and PART XI ONLY — nothing else. Do NOT regenerate Part VII or Part VIII, they are handled separately.

ALL THREE PARTS MUST BE COMPLETE, EVERY TIME — this is non-negotiable:

PART IX PRE-DISBURSEMENT:
<hr><div class="ph">PART IX — DOCUMENTS REQUIRED AT PRE-DISBURSEMENT STAGE</div>
<ol>Each item: <li><strong>[Document Name]</strong><br><em>Source:</em> [who/where]<br><em>Purpose:</em> [specific legal reason]</li></ol>

PART X POST-DISBURSEMENT:
<hr><div class="ph">PART X — DOCUMENTS REQUIRED AT POST-DISBURSEMENT STAGE</div>
<ol>Standard 6-8 items, same Source/Purpose format as Part IX.</ol>

PART XI FINAL RECOMMENDATION:
<hr><div class="ph">PART XI — FINAL RECOMMENDATION</div>
<div class="final-rec"><div class="fr-title">FINAL TITLE STATUS:</div><div class="fr-value">[CLEAR TITLE SUBJECT TO CONDITIONS / TITLE NOT CLEAR / CLEAR AND MARKETABLE — use the VERDICT given in context]</div></div>
<p>[5-6 sentences covering: title chain summary | EC App numbers + period + status | mortgage lifecycle with deed numbers | RERA status | outstanding conditions | SARFAESI | bank recommendation]</p>

START: <hr><div class="ph">PART IX
END: after the Part XI paragraph.`


// ================================================================
// EC PRE-SCREEN PROMPT
// ================================================================
const EC_PS = 'Look at ALL uploaded images. Find Encumbrance Certificate (EC) table.\n\nCRITICAL RULE:\nCOL 3 = Aapnar = LEFT = WHO GIVES\nCOL 4 = Lenar = RIGHT = WHO RECEIVES\nBANK IN COL 3 = RELEASE DEED | BANK IN COL 4 = MORTGAGE DEED\n\nExtract EVERY EC row + header. Also check ALL docs for Release Deed / Giro Mukeli / Reconveyance.\n\nOutput ONLY JSON:\n{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}],"pre_screen_releases":[{"bank":"","deed_no":"","date":"","source":""}]}'

const REV_PS = 'LANGUAGE: Output ONLY English in JSON fields. No Gujarati script anywhere in output.\nTranslate status words: પ્રમાણિત=Certified | કબજાની પ્રમાણિત=Certified | હુકમથી પ્રમાણિત=Certified by Court Order | રદ=Rejected | ચકાસ=Under Revision | બાકી=Pending\nTranslate terms: Bin Kheti=Non-Agricultural | Juni Sharat=Old Tenure | Naa Sharat=New Tenure | Vechan=Sale | Hukam=Court Order | Warsi=Inheritance | Bhagat=Partition\nGujarati digits: ૦=0 ૧=1 ૨=2 ૩=3 ૪=4 ૫=5 ૬=6 ૭=7 ૮=8 ૯=9 — convert ALL Gujarati digits to Arabic numerals in dates and numbers.\n\n═══════════════════════════════════════════\nWHAT IS A MUTATION ENTRY — AND WHAT IS NOT (READ FIRST, ABSOLUTE)\n═══════════════════════════════════════════\nA Mutation/FERFAR entry (Nondh) comes ONLY from the Revenue Record "Entry Details" / FERFAR /\nGamnamuna No. 6 register. Each real entry has a NUMERIC Nondh number (e.g. 3710, 4080, 11685),\na date, a change-type (Sale / Order / Inheritance / NA / etc.), a certified/rejected status, and\na narrative. These numeric Nondh entries are the ONLY thing that goes into the "entries" array.\n\nThe following are NOT mutation entries — NEVER put them in the "entries" array, NEVER invent a\nNondh number for them, NEVER give them a text "entry number":\n- AAI / Airport NOC, Height Clearance NOC\n- GUDA / AUDA / development permission, building plan approval\n- RERA registration certificate / Form-C\n- A registered Sale Deed, Mortgage Deed, Release Deed, Declaration Deed BY ITSELF (the DEED is\n  NOT a Nondh; only the FERFAR Nondh that RECORDS that deed is an entry, and its number is the\n  numeric Nondh number, not the deed/document number)\n- Index-2, tax receipts, layout plans, jantri\nIf you cannot find the FERFAR "Entry Details" register with numeric Nondh entries in the images,\nreturn entries:[] and fill only the 7/12 header fields — do NOT manufacture entries from deeds,\nNOCs, permissions or certificates. An empty entries array is CORRECT and far better than fake\nentries built from non-FERFAR documents.\n\nCOUNT DISCIPLINE: The FERFAR "Entry Details" register usually holds MANY numeric Nondh entries\n(commonly 10-25). Do NOT stop after a handful. Read the entire "Entry Details" / Gamnamuna 6\nsection top to bottom and extract EVERY numeric Nondh entry you can see, oldest to newest.\n\n═══════════════════════════════════════════\n\nFind Revenue Records in ALL uploaded images: Village Form 6, 7/12 (Satbara), 8-A, Property Card, Hakk Patrak, Mutation Register, FERFAR Register, Gamnamuma No. 6.\n\n══════════════════════════════════════════\nVILLAGE FORM NO. 7 (7/12 SATBARA) — EXTRACT:\n══════════════════════════════════════════\nFrom Village Form 7 extract these fields:\n- Village name (Mouje), Taluka, District\n- Survey Number / Block Number / Final Plot Number (old AND new if both visible)\n- Total Area in H.Are.SqMt. or Sq.Mtrs.\n- Land Use (Jaminno Upyog): Non-Agricultural / Agricultural\n- Current owner name (Kabjedar/Khatedar column) — translate to English\n- Boja/Encumbrance column — list ALL entry numbers visible\n- Ganot/Tenant column — NIL if blank\n- Any NA Order or Land Use conversion reference visible in the document\n\n══════════════════════════════════════════\nFERFAR / MUTATION REGISTER / GAMNAMUMA NO. 6 — COLUMN STRUCTURE (PER SOP):\n══════════════════════════════════════════\nEach Nondh/Mutation entry in FERFAR has these columns reading left to right:\n\nCOLUMN 1 (Leftmost) = Entry Date + Mutation Entry Number + Status (Certified / Rejected / Hukam)\n  → ALWAYS extract: Mutation Entry Number, Date, Status from this column\n  → NOTE: Skip the very FIRST sub-column of Entry Details if it is only administrative/serial numbering\n  → The actual Date + Number + Status is what you need from Column 1\n\nCOLUMN 2 (Second from left) = Complete Mutation Details (most important column):\n  → Contains: Nature of change (Sale / Court Order / Inheritance / Death / NA Conversion / Partition etc.)\n  → Contains: All party names — sellers, buyers, applicants, respondents\n  → Contains: Deed references (Sale Deed No., Court Order No., Case No.)\n  → Contains: Consideration amounts if sale\n  → Contains: Court name, case number, order date for court order entries\n  → EXTRACT EVERYTHING from Column 2 and reconstruct the full English narrative\n\nCOLUMN 3 (Third from left) = Survey/Block Number:\n  → Include ONLY if the Survey/Block Number relates to the SUBJECT PROPERTY\n  → If a different property, skip this column entirely for that entry\n\nCOLUMN 4 (Last column) = Remarks:\n  → Extract any legally relevant remarks\n\n══════════════════════════════════════════\nCRITICAL RULES:\n══════════════════════════════════════════\n1. Read ALL pages from beginning to end — do NOT stop after first few entries\n2. Extract EVERY entry — Sale, Court Order, Inheritance, Death, NA Conversion, Rejected entries — ALL\n3. REJECTED entries are LEGALLY IMPORTANT — always extract and report them with Status=REJECTED\n4. PARTIAL EXTRACTION IS VALID — if you cannot read some fields, return empty string for that field\n   NEVER return {found:false} unless the document is genuinely not a Revenue Record at all\n5. Date and Number are in Column 1 — search thoroughly, never output empty date if it is visible\n6. For Court Order entries: extract case number, court name, order date, parties, and what was decided\n7. NA Order references: extract the Non-Agricultural order number and date if visible anywhere\n8. Translate all Gujarati party names: અરજદાર=Applicant | સામાવાળા=Respondent | વેચાણ આપનાર=Seller | વેચાણ લેનાર=Buyer\n\nOUTPUT ONLY THIS JSON — no other text before or after:\n{"document_type_found":"FERFAR OR 7-12 OR Property Card OR mixed","village":"","taluka":"","district":"","survey_block_no":"","total_area":"","land_use":"","tenure":"","ownership_column":"","boja_column":"","ganot_column":"","na_order":"","entries":[{"e":"entry_no","d":"date_DD/MM/YYYY","cd":"certification_date_if_different","s":"Certified OR Rejected OR Certified by Court Order OR Pending","po":"sellers OR applicants OR previous owner — all names in English","no":"buyers OR respondents OR new owner — all names in English","n":"Sale OR Court Order OR Inheritance OR Death OR NA Conversion OR Partition OR Gift OR Mortgage OR Release","r":"complete narrative in English — all parties, deed/case numbers, amounts, what happened and what was decided","sv":"survey_block_no if related to subject property","sd":"deed number OR court case number and date","rm":"any legal remarks or notes"}]}\nPARTIAL RULE: Return whatever you can read. Empty string for unreadable fields. Never found:false unless no revenue record exists.'

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
        let revScanError = false
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
        const revPrescreen =
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages: [{ role: 'user', content: [...revPrescreenImgs, { type: 'text', text: REV_PS }] }] })
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
        } else if (revImgs.length > 0) {
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: TAGGED_BUT_NOT_RECOGNIZED — a document WAS specifically tagged as Revenue Record/7-12, and was scanned, but the scan could not identify recognizable 7/12, Mutation, or FERFAR content in it. Do NOT say "not tagged or produced." Instead state plainly: "A Revenue Record document was submitted for this case; however, the content could not be positively identified as a Village Form 7/12, Property Card, or Mutation Register extract on automated review. Independent manual verification of the Revenue Record is recommended before disbursement."'
        } else {
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: NOT_FOUND — a complete scan of all uploaded documents was performed automatically but no recognizable Revenue Record (7/12 / Property Card / Mutation Register / FERFAR) was identified. Do NOT claim Revenue Record was examined. State plainly: Revenue Record (7/12 / Mutation extract) was not found in the documents produced for examination; independent verification of the Revenue Record is recommended before disbursement.'
        }
        const ctx = FORM + '\n\n' + GT + '\n\n' + revenueProvidedFlag + '\n\nANALYSIS:\n' + analysis.substring(0, 8000) + '\n\nAPPLICANT: ' + (meta.applicant || applicantName) + '\nOWNER: ' + (meta.currentOwner || currentOwner) + '\nCASE: ' + caseType + '\nBANK: ' + bankName

        // DEDICATED CONTEXT FOR S3B (Part IV chain writer) — Revenue Record data FIRST
        // S3B must not compete with 8000 chars of general analysis to find mutation entries.
        // This context puts the Revenue Record chain data at the very top, unmissably.
        const ctxS3B = [
            '=== PRIMARY AND ONLY SOURCE FOR THE CHAIN: REVENUE RECORD FLOW OF CHAIN ===',
            'The chronological title chain in Part IV MUST be written from these Revenue Record',
            'entries ONLY — every entry, earliest to present, each as its own heading + paragraph.',
            'EC entries below are NOT a source for the chain; they are for the final one-sentence',
            'cross-verification only. NEVER turn an EC entry into a chain paragraph.',
            revenueProvidedFlag,
            '',
            revGT || '(No Revenue Record Ground Truth available — see flag above for reason.)',
            '',
            '=== SUPPORTING CONTEXT: FORM DATA AND PROPERTY ===',
            FORM,
            '',
            // CROSS-VERIFY SUMMARY ONLY. When a Revenue Record exists, we deliberately do
            // NOT hand the chain-writer the deed-by-deed EC ground truth (ecGT) — seeing rich
            // EC deed data is exactly what makes the model turn EC deeds into chain paragraphs.
            // It only needs the EC App No + period + overall status to write the single closing
            // cross-verification sentence. If no Revenue Record, fall back to full ecGT so the
            // "not available" branch still has the EC line for its verification sentence.
            '=== EC — FOR THE ONE CLOSING CROSS-VERIFICATION SENTENCE ONLY ===',
            'Do NOT write any chain paragraph from this. Chain paragraphs come from the Revenue',
            'Record entries above and nothing else. Use this only to write the final one sentence:',
            '"cross-verified against the Encumbrance Certificate bearing E-Application No. [X]...".',
            (revData ? ecCrossVerifyLine : ecGT),
            '',
            '=== SUPPLEMENTARY: PARTIES (for names only — NOT a chain source) ===',
            'APPLICANT: ' + (meta.applicant || applicantName),
            'OWNER: ' + (meta.currentOwner || currentOwner),
            'CASE: ' + caseType,
            'BANK: ' + bankName,
            // When a Revenue Record exists, DO NOT pass the Step-2 analysis (it contains EC
            // deed detail that leaks into the chain). Only pass it as a last-resort supplement
            // when there is no Revenue Record to build the chain from.
            (revData
                ? '(Revenue Record present — build the chain strictly from the Revenue Record entries above; no other deed source is needed.)'
                : 'DEED ANALYSIS (only because no Revenue Record was found):\n' + analysis.substring(0, 3000)),
        ].join('\n')

        // ── STEP 3: Parallel HTML generation (4x Sonnet) — each call isolated so one failure can't sink the whole report ──
        const safeStep3 = (label: string, p: Promise<any>) => p.catch(e => {
            console.log('STEP3 ' + label + ' err:', e?.message || e)
            return { content: [{ type: 'text', text: '<p style="color:#b91c1c;"><em>' + label + ' could not be generated (' + (e?.message ? String(e.message).substring(0, 150) : 'unknown error') + '). Please retry — other sections of this report are unaffected.</em></p>' }] }
        })
        // Split into 5 parallel calls instead of 4 — Part VII-XI used to be ONE call
        // doing 5 sections at 8000 tokens (the single slowest call in the batch).
        // Splitting it into two smaller parallel calls means neither half needs
        // anywhere near 8000 tokens, so the SLOWEST call in this whole batch drops
        // significantly — total wall-clock time for Step 3 falls even though there
        // are now more calls, because they all still run concurrently.
        const [r3a, r3b, r3c, r3d1, r3d2] = await Promise.all([
            safeStep3('Part III', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3A, messages: [{ role: 'user', content: ctx }] })),
            safeStep3('Part IV', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 6000, system: S3B, messages: [{ role: 'user', content: ctxS3B }] })),
            safeStep3('Part V/VI', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 5000, system: S3C, messages: [{ role: 'user', content: ctx + '\n\nEC TABLE HTML:\n' + ecTbl + '\n\nMORTGAGE LIFECYCLE:\n' + lcSection }] })),
            safeStep3('Part VII-VIII', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4500, system: S3D1, messages: [{ role: 'user', content: ctx + '\n\nVERDICT: ' + verdict }] })),
            safeStep3('Part IX-XI', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3D2, messages: [{ role: 'user', content: ctx + '\n\nVERDICT: ' + verdict }] }))
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
        const p4 = stripFences(r3d1.content[0].type === 'text' ? r3d1.content[0].text : '') + stripFences(r3d2.content[0].type === 'text' ? r3d2.content[0].text : '')

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