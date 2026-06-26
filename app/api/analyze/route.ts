// TITLEMATRIXAI FINAL v5 - DO NOT MODIFY
// EC 4-Pass + Module8 + Form Priority + temperature=0
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const AI = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const DB = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

// ============================================================
// TYPES
// ============================================================
interface ECRow {
    row_number: number
    col1_type: string
    col3_aapnar: string
    col4_lenar: string
    col5_date: string
    col6_deed_no: string
}
interface Charge {
    row: number
    lender: string
    deed_no: string
    date: string
    release_deed_no: string
    release_date: string
}
interface Lifecycle {
    active: Charge[]
    released: Charge[]
    encumbrance: string
    summary: string
}

// ============================================================
// BANK DETECTION
// ============================================================
const BANK_WORDS = [
    'bank', 'finance', 'financial', 'housing', 'capital', 'credit', 'hdfc', 'sbi', 'icici',
    'axis', 'kotak', 'pnb', 'bob', 'boi', 'canara', 'union', 'idbi', 'uco', 'central bank',
    'bajaj', 'lic', 'lichfl', 'gruh', 'aavas', 'piramal', 'indiabulls', 'tata capital',
    'mahindra', 'shriram', 'muthoot', 'bandhan', 'yes bank', 'idfc', 'federal',
    'aditya birla', 'cholamandalam', 'fullerton', 'nbfc', 'hfc', 'limited', 'ltd'
]
function isBank(name: string): boolean {
    if (!name || name.length < 3) return false
    const n = name.toLowerCase()
    return BANK_WORDS.some(w => n.includes(w))
}

// ============================================================
// LIFECYCLE ENGINE
// ============================================================
function buildLifecycle(active: Charge[], released: Charge[]): Lifecycle {
    const encumbrance = active.length > 0
        ? 'ENCUMBERED'
        : released.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'
    const summary = active.length === 0 && released.length === 0
        ? 'NIL encumbrance'
        : active.length > 0
            ? 'ACTIVE: ' + active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(' | ')
            : 'RELEASED: ' + released.map(r => r.lender + ' DISCHARGED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')
    return { active, released, encumbrance, summary }
}

function runLifecycle(rows: ECRow[]): Lifecycle {
    const active: Charge[] = []
    const released: Charge[] = []
    // Find mortgages
    for (const r of rows) {
        if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) {
            active.push({ row: r.row_number, lender: r.col4_lenar, deed_no: r.col6_deed_no || '', date: r.col5_date || '', release_deed_no: '', release_date: '' })
        }
    }
    // Find releases
    for (const r of rows) {
        if (isBank(r.col3_aapnar) && !isBank(r.col4_lenar)) {
            const words = r.col3_aapnar.toLowerCase().split(/\s+/).filter(w => w.length > 3)
            const idx = active.findIndex(a => words.some(w => a.lender.toLowerCase().includes(w)))
            if (idx >= 0) {
                const m = active.splice(idx, 1)[0]
                m.release_deed_no = r.col6_deed_no || ''
                m.release_date = r.col5_date || ''
                released.push(m)
            } else {
                released.push({ row: r.row_number, lender: r.col3_aapnar, deed_no: '', date: '', release_deed_no: r.col6_deed_no || '', release_date: r.col5_date || '' })
            }
        }
    }
    return buildLifecycle(active, released)
}

// ============================================================
// EC TABLE HTML
// ============================================================
function ecTableHTML(rows: ECRow[], lc: Lifecycle): string {
    if (!rows.length) return '<p>No EC entries found in documents produced for examination.</p>'
    let h = '<table class="ec-tbl"><tr><th>Sr.</th><th>Classified Type</th><th>Match Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 — Aapnar</th><th>Col 4 — Lenar</th><th>Status</th></tr>'
    for (const r of rows) {
        const isRel = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        const isMort = isBank(r.col4_lenar) && !isBank(r.col3_aapnar)
        const isAct = lc.active.some(c => c.row === r.row_number)
        const t = r.col1_type || 'Transaction'
        let cls = '', status = '', ct = t, conf = ''
        if (isRel) {
            cls = 'ec-rel'; ct = 'Reconveyance / Mortgage Release Deed'
            conf = 'HIGH — Bank in Col 3 as releasing party. Release confirmed.'
            status = '&#x2705; DISCHARGED — Formally releases prior mortgage. No subsisting charge.'
        } else if (isMort && isAct) {
            cls = 'ec-act'; ct = 'Mortgage Deed — Active'
            conf = 'HIGH — Bank in Col 4 as mortgagee. Active charge.'
            status = '&#x26A0; ACTIVE MORTGAGE — Subsisting as on date. No Release Deed found.'
        } else if (isMort && !isAct) {
            cls = 'ec-rel'; ct = 'Mortgage Deed — Discharged'
            conf = 'HIGH — Bank in Col 4. Discharged vide Release Deed.'
            status = '&#x2705; DISCHARGED — Released vide subsequent Release Deed.'
        } else if (t.toLowerCase().includes('sale')) {
            ct = 'Sale Deed'; conf = 'HIGH'; status = '&#x2705; Title Document.'
        } else if (t.toLowerCase().includes('declaration')) {
            ct = 'Declaration Deed'; conf = 'MEDIUM'; status = 'Verify impact.'
        } else {
            conf = 'MEDIUM'; status = 'Transaction — verify.'
        }
        h += '<tr><td>' + r.row_number + '</td><td>' + ct + '</td><td>' + conf + '</td><td>' + (r.col6_deed_no || '--') + '</td><td>' + (r.col5_date || '--') + '</td><td>' + (r.col3_aapnar || '--') + '</td><td>' + (r.col4_lenar || '--') + '</td><td class="' + cls + '">' + status + '</td></tr>'
    }
    return h + '</table>'
}

// ============================================================
// LEGAL OPINION
// ============================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
    const B = 'On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that'
    const S = 'The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.'
    const SBT = 'The said immovable property will be enforceable under SARFAESI Act subject to charge of ' + existingBank + '.'
    const T = 'the right, title and interest of ' + owner + ' in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid'
    const M = 'He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.'
    const ops: Record<string, string> = {
        builder_purchase: B + ' ' + T + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', ' + M + ' ' + S,
        resale: B + ' ' + T + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', ' + M + ' ' + S,
        bt: B + ' ' + T + ' subject to charge of ' + existingBank + ' and after discharge, ' + M + ' ' + SBT,
        seller_bt: B + ' ' + T + ' subject to charge of ' + existingBank + ' and after discharge and Sale Deed, ' + M + ' ' + SBT,
        lap: B + ' ' + T + ' and He/She/They have legal, clear, marketable, valid and binding title and a valid Registered Mortgage can be created. ' + S,
    }
    return ops[ct] || ops['lap']
}

// ============================================================
// CSS
// ============================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Georgia","Times New Roman",serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:8px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px}table.mut tr:nth-child(even){background:#f9fafb}table.tc-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.tc-tbl th{background:#374151;color:#fff;padding:5px 8px;font-size:10px}table.tc-tbl td{border:1px solid #e5e7eb;padding:5px 8px}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}`

// ============================================================
// EC STEP 0 PROMPT - Text extraction from EC image
// ============================================================
const EC_TEXT_PROMPT = `Look at these images. Find the Encumbrance Certificate (EC).
Read EVERY word visible in the EC. Extract as plain text maintaining table structure.
Include: Header section (App No, Date, Period) + every row of the transaction table.
Output the raw extracted text only.`

// ============================================================
// EC STEP 1 PROMPT - Parse extracted text into JSON
// ============================================================
function buildECParsePrompt(rawText: string): string {
    return `You are an expert EC analyst. Parse this Encumbrance Certificate text into structured JSON.

EC TEXT:
${rawText}

GUJARATI TRANSLATION (for Col 1):
વેચાણ/vechan = Sale Deed
ગીરો/giro = Mortgage Deed
ગ.ફ./ગ.મૂ.ફ./giro fer/giro mukeli = Mortgage Release Deed
ભાગ/bhag = Partition Deed
ભેટ/bhet = Gift Deed
ઘ.ખ./ઘ.ન. = Declaration Deed
ક.સ. = Family Settlement
ટ.ઇ./ન.ત. = Court Decree

EC TABLE COLUMNS (7 total):
COL 1 = Deed Type → translate to English
COL 2 = Property Description → SKIP
COL 3 = Aapnar = Executing Party = WHO GIVES
COL 4 = Lenar = Claimant Party = WHO RECEIVES
COL 5 = Registration Date
COL 6 = Deed/Reg Number (SECOND LAST)
COL 7 = LAST COLUMN → NEVER EXTRACT

BANK DETECTION:
Col 4 has bank name → MORTGAGE DEED (bank receives = creates mortgage)
Col 3 has bank name → MORTGAGE RELEASE DEED (bank gives = releases mortgage)

Output ONLY valid JSON:
{"found":true,"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"English deed type","col3_aapnar":"exact name","col4_lenar":"exact name","col5_date":"date","col6_deed_no":"number"}]}
If no EC: {"found":false,"rows":[]}`
}

// ============================================================
// MODULE 8 PROMPT - Expert Release Verification
// ============================================================
const MODULE8_PROMPT = `You are an expert Property Due Diligence AI. Module 8: Encumbrance Verification.

Analyze ALL uploaded documents. Find every mortgage AND every release.

STEP 1 - FIND ALL MORTGAGES in ANY document:
Look for: Mortgage Deed, Home Loan, LAP, Equitable Mortgage, Deposit of Title Deeds, Bank Loan, Housing Loan, Charge

STEP 2 - FIND ALL RELEASES in ANY document:
Look for EXACT words: Release Deed, Reconveyance, No Due Certificate, NOC from Bank,
Discharge, Satisfaction, Closure Letter, Full Payment, Vacated, Extinguished,
ગ.ફ., ગ.મૂ.ફ., Mortgage Release, Relinquishment of Charge, Bank Confirmation of Closure

STEP 3 - CROSS REFERENCE each release to its mortgage:
Match by: same bank name OR same borrower OR same property OR same deed number OR same date range

STEP 4 - DECISION per mortgage:
Release found AND matches → is_released: true → status: CLEARED
No release found → is_released: false → status: ACTIVE MORTGAGE RISK

Output ONLY this JSON:
{"encumbrances":[{"id":"1","type":"Mortgage","status":"CLEARED or ACTIVE","bank":"exact bank name","borrower":"name","document_number":"deed no","date":"date","release_found":true,"release_document":"release deed no","release_date":"date","release_by":"bank name","confidence":95}],"overall_status":"CLEAR or ENCUMBERED or CLEAR WITH PRIOR RELEASE"}`

// ============================================================
// JSON PARSER
// ============================================================
function safeParseJSON(raw: string): any {
    try {
        const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const f = clean.indexOf('{'); const l = clean.lastIndexOf('}')
        if (f >= 0 && l >= 0) return JSON.parse(clean.substring(f, l + 1))
        const fa = clean.indexOf('['); const la = clean.lastIndexOf(']')
        if (fa >= 0 && la >= 0) return JSON.parse(clean.substring(fa, la + 1))
        return JSON.parse(clean)
    } catch { return null }
}

// ============================================================
// SYSTEM PROMPTS
// ============================================================
const SYS_L1 = `You are Document Extraction Engine of TITLEMATRIXAI. 20-Year Advocate Protocol.
RULES: Never assume. Never invent. Use ONLY what documents say.
Never use advocate/lawyer name as applicant. Never "and others" — every person by full name.
EC Col 7 = NEVER READ. Stamp paper number = NEVER mention. Loan amount = NEVER mention.
If not available = "NOT PROVIDED FOR VERIFICATION."
Extract: document type, registration date (IGR only), registration number, all executants, all claimants, property description, area figures.
PROPERTY PARA FORMAT: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."
OUTPUT: ---META---\nPROPERTY_PARA: [para]\nCURRENT_OWNER: [names]\nRED_FLAGS: [list or NONE]\n---END META---`

function SYS_L23(ct: string): string {
    const g: Record<string, string> = {
        builder_purchase: 'Builder Purchase: Developer title deeds | NA Order | RERA mandatory post-2017 | Sale Deed from Developer to Applicant must exist',
        resale: 'Resale: 30-year title chain | Every seller-buyer link | EC cross-match',
        bt: 'Balance Transfer: EC must show ACTIVE mortgage from existing bank | Letter of Discharge | Foreclosure letter',
        seller_bt: 'Seller BT: Release existing mortgage + Sale to purchaser.',
        lap: 'LAP: Owner = Mortgagor. EC must show NIL or Released only.',
    }
    return `You are Title Verification + Risk Engine of TITLEMATRIXAI. 20-Year Advocate Protocol.
RULES: Never assume. EC Ground Truth = DO NOT CONTRADICT. RELEASED mortgage = NEVER flag as active. NEVER "and others".
CASE: ${ct.toUpperCase().replace(/_/g, ' ')}\n${g[ct] || g['lap']}
REVENUE 7-CHECK: 1.Owner name matches deed? 2.Survey number same? 3.Area consistent? 4.Land use Bin Kheti? 5.Boja NIL? 6.Ganot NIL? 7.No govt acquisition?
OUTPUT: ---META---\nPROPERTY_PARA: [para]\nCURRENT_OWNER: [names]\nRED_FLAGS: [list or NONE]\n---END META---`
}

const SYS_4A = `Layer 4A -- PARTS I+II+III. PURE HTML ONLY.
CRITICAL: Applicant = EXACTLY FORM_APPLICANT. Never use advocate name. Part III = NO illegibility remarks.
PART I: <hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div><table class="mt">
<tr><td>Name of Borrower/s</td><td>:</td><td>[FORM_APPLICANT]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[FORM_CO or Not Applicable]</td></tr>
<tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual/Partnership/Company]</td></tr></table>
<div class="sph">B. Mortgagor Details</div><table class="mt">
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[FORM_APPLICANT]</td></tr>
<tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr>
<tr><td>Constitution</td><td>:</td><td>Individual</td></tr></table>
<div class="sph">C. Current Ownership</div><table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[FORM_OWNER]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[from documents]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No | Dated | SRO]</td></tr></table>
PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[property paragraph]</div>
<table class="mt"><tr><td>East (Purva)</td><td>:</td><td>[FORM_EAST]</td></tr><tr><td>West (Pashchim)</td><td>:</td><td>[FORM_WEST]</td></tr><tr><td>North (Uttar)</td><td>:</td><td>[FORM_NORTH]</td></tr><tr><td>South (Dakshin)</td><td>:</td><td>[FORM_SOUTH]</td></tr></table>
PART III: <hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
<p>The following documents have been produced for examination and scrutiny:</p>
[Each doc: <div class="di"><p><span class="dn">N. [Type] -- [No] | [Date]</span><br>[2 factual sentences. NO illegibility. NO "not provided" except EC fields.]</p></div>]
[EC entry: <div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [APP] | Date: [DATE] | Period: [FROM] to [TO]</span><br>[N] transactions found. Encumbrance Status: [STATUS].</p></div>]
START WITH: <hr><div class="ph">PART I`

const SYS_4B = `Layer 4B -- PARTS IV+V. PURE HTML ONLY.
PART IV RULES:
1. Oldest FIRST. 2. First para NEVER starts "Thereafter". 3. Every next para MUST start "Thereafter,"
4. NEVER "and others". 5. RELEASED mortgage EXACT WORDING: "stands discharged and the charge has been fully released and satisfied vide [Release Deed] No.[Y] dated [DD/MM/YYYY] -- no subsisting charge of [Bank] remains on the subject property as on date."
6. ACTIVE mortgage: "is subsisting and active as on date -- no Release Deed found."
7. NEVER say "no discharge found" for RELEASED mortgage.
<hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
<p>[First para -- oldest -- NO Thereafter]</p><p>Thereafter, [next]</p>
<table class="tc-tbl"><tr><th>Sr.</th><th>Year</th><th>Deed Type</th><th>From</th><th>To</th><th>Reg. No.</th><th>SRO</th><th>Area</th><th>Status</th></tr>[rows]</table>
<hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">A. Revenue Record (7/12 / Property Card)</div>
<table class="mt"><tr><td>Village (Mouje)</td><td>:</td><td>[name]</td></tr><tr><td>Taluka</td><td>:</td><td>[name]</td></tr><tr><td>District</td><td>:</td><td>[name]</td></tr><tr><td>Survey / Block / FP No.</td><td>:</td><td>[no]</td></tr><tr><td>Total Area</td><td>:</td><td>[area]</td></tr><tr><td>Land Use / Khate Type</td><td>:</td><td>[NA = OK | Kheti = RED FLAG]</td></tr><tr><td>Ownership Column</td><td>:</td><td>[owner or flag]</td></tr><tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL or active details]</td></tr><tr><td>Ganot / Tenant</td><td>:</td><td>[NIL = OK | Tenant = FLAG]</td></tr><tr><td>Govt Acquisition</td><td>:</td><td>[None = OK | Any = CRITICAL]</td></tr></table>
<div class="sph">B. Mutation Entries</div><table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Certified/Rejected</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>[rows or NOT PROVIDED row]</table>
<div class="sph">C. Regulatory Approvals</div><table class="mt"><tr><td>NA Order</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Development Permission</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Sanctioned Building Plan</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Commencement Certificate</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>RERA Registration (Post May 2017 = Mandatory)</td><td>:</td><td>[RERA No. with validity or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Fire NOC</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Airport Authority NOC</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Occupancy Certificate</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Completion Certificate</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr></table>
<div class="sph">D. Encumbrance Certificate Analysis</div><p>[EC App Nos, periods, rows found, status]</p>[EC_TABLE_GOES_HERE]
<div class="sph">E. Mortgage Lifecycle Summary</div><table class="mt"><tr><td>A. Active Mortgages</td><td>:</td><td>[NIL or Bank + Deed No + Date]</td></tr><tr><td>B. Released Mortgages</td><td>:</td><td>[NIL or Bank DISCHARGED vide Deed No.X dated DD/MM/YYYY]</td></tr><tr><td>C. Unmatched Releases</td><td>:</td><td>NIL</td></tr><tr><td>D. Overall Encumbrance Status</td><td>:</td><td>[CLEAR / ENCUMBERED / CLEAR WITH PRIOR RELEASE]</td></tr></table>
START WITH: <hr><div class="ph">PART IV`

const SYS_4C = `Layer 4C -- PARTS VI+VII+VIII. PURE HTML. Max 5-6 alerts.
NEVER flag RELEASED mortgage as active. NEVER use advocate name. Illegibility ONLY here not Part III.
<hr><div class="ph">PART VI -- ALERTS AND ADVERSE FINDINGS</div>
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. Title</div><p>Finding.</p><p><span class="sg">Direction:</span> Action.</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. Title</div><p>Finding.</p><p><span class="sg">Direction:</span> Action.</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. Title</div><p>Note.</p><p><span class="sg">Direction:</span> Note.</p></div>
<hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted</div><ol>[all docs]</ol>
<div class="sph">B. Critical Missing (Report Hold)</div><ol>[critical missing or <li>NIL</li>]</ol>
<div class="sph">C. Important Missing (Pre-Disbursement)</div><ol>[missing or NIL]</ol>
<div class="sph">D. Illegible / Incomplete</div><ol>[illegible or NIL]</ol>
<div class="sph">E. Risk Assessment Summary</div>
<table class="mt"><tr><td>Title Risk Level</td><td>:</td><td>[HIGH/MODERATE/LOW]</td></tr><tr><td>Mortgageability Status</td><td>:</td><td>[Mortgageable/Conditionally/Not]</td></tr><tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable/Conditionally/Not]</td></tr><tr><td>Lending Suitability</td><td>:</td><td>[Suitable/Conditionally/Not]</td></tr><tr><td>Security Coverage</td><td>:</td><td>[Adequate/Marginal/Inadequate]</td></tr><tr><td>Reasoning</td><td>:</td><td>[2-3 sentences with deed/EC refs]</td></tr></table>
<hr><div class="ph">PART VIII -- LEGAL OPINION AND VERDICT</div>[INSERT_LEGAL_OPINION]
[VERDICT: HIGH alerts → <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve all HIGH SEVERITY conditions before proceeding.</p></div>]
[MEDIUM/LOW only → <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Disbursement subject to conditions.</p></div>]
[No alerts → <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear and mortgageable.</p></div>]
START WITH: <hr><div class="ph">PART VI`

const SYS_4D = `Layer 4D -- PARTS IX+X+XI. PURE HTML.
Each Part IX item: <li><strong>[Name]</strong><br><em>Source:</em> [who/where]<br><em>Purpose:</em> [why needed]</li>
<hr><div class="ph">PART IX -- DOCUMENTS REQUIRED AT PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required BEFORE disbursement:</p><ol>[case-specific items with Source + Purpose]</ol>
<hr><div class="ph">PART X -- DOCUMENTS REQUIRED AT POST-DISBURSEMENT STAGE</div>
<p>The following documents are required AFTER disbursement:</p>
<ol>[Original Sale Deed | MODT/Mortgage | CERSAI | Updated EC | Possession Letter | Society NOC | Mutation | Property Tax | OC/CC | Insurance — each with Source + Purpose]</ol>
<hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec"><div class="fr-title">Final Title Status:</div><div class="fr-value">[CLEAR AND MARKETABLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE NOT CLEAR]</div></div>
<p style="margin-top:16px;">[5-6 sentences: title chain | EC App Nos + period + encumbrance | mortgage lifecycle with exact deed nos | RERA | conditions numbered (i)(ii)(iii) | SARFAESI | bank recommendation]</p>
START WITH: <hr><div class="ph">PART IX`

// ============================================================
// REPORT BUILDER
// ============================================================
function buildReport(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; p123: string; p45: string; p678: string; p911: string }): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report</title><style>' + CSS + '</style></head><body>'
        + '<div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div>'
        + '<div class="hdr-right"><div><strong>Reference No.:</strong> ' + p.refNo + '</div><div><strong>Application ID:</strong> ' + p.appId + '</div><div><strong>Report Date:</strong> ' + p.today + '</div><div><strong>Bank:</strong> ' + p.bankName + '</div></div></div>'
        + '<div class="rtitle">LEGAL SCRUTINY REPORT -- ' + p.loanType + '</div><hr>'
        + p.p123 + p.p45 + p.p678 + p.p911
        + '<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ' + p.today + '</div></div><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">' + p.bankName + '</div></div></div>'
        + '<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: This Report is prepared exclusively for ' + p.bankName + ' for Application ID ' + p.appId + '.</div><div class="wm">TITLEMATRIXAI -- Confidential -- For Bank Use Only</div></div></body></html>'
}

// ============================================================
// MAIN API HANDLER
// ============================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            images, caseType = 'lap', appId = 'AUTO',
            bankName = 'Bank', applicantName = '', coApplicant = '',
            currentOwner = '', propertyAddress = '',
            boundaryEast = '', boundaryWest = '', boundaryNorth = '', boundarySouth = '',
            userId = null
        } = body

        if (!images || images.length === 0) {
            return NextResponse.json({ success: false, error: 'No documents uploaded. Please upload EC and property documents.' }, { status: 400 })
        }

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const refNo = 'TITLEMATRIXAI/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4)
        const loanMap: Record<string, string> = {
            builder_purchase: 'Builder Purchase', resale: 'Resale Property',
            bt: 'Balance Transfer', seller_bt: 'Seller Balance Transfer', lap: 'LAP'
        }

        const imgContent: any[] = images.map((img: any) => ({
            type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data }
        }))

        // ============================================================
        // EC EXTRACTION -- 4 STEP PROCESS
        // Step 0: Extract raw text from EC image
        // Step 1: Parse text into structured JSON
        // Step 2: Retry if header missing
        // Step 3: Retry if rows missing
        // ============================================================
        let ecRows: ECRow[] = []
        let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
        let lc = runLifecycle([])

        // STEP 0: Get raw text from EC
        let ecRawText = ''
        try {
            const s0 = await AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: EC_TEXT_PROMPT }] }]
            })
            ecRawText = s0.content[0].type === 'text' ? s0.content[0].text : ''
            console.log('EC Step0: extracted ' + ecRawText.length + ' chars')
        } catch (e) { console.log('EC Step0 error:', e) }

        // STEP 1: Parse extracted text
        if (ecRawText.length > 50) {
            try {
                const s1 = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
                    messages: [{ role: 'user', content: [{ type: 'text', text: buildECParsePrompt(ecRawText) }] }]
                })
                const p1 = safeParseJSON(s1.content[0].type === 'text' ? s1.content[0].text : '{}')
                if (p1?.found) {
                    ecRows = p1.rows || []
                    if (p1.ec_app_number) ecMeta.ec_app_number = p1.ec_app_number
                    if (p1.ec_date) ecMeta.ec_date = p1.ec_date
                    if (p1.ec_from) ecMeta.ec_from = p1.ec_from
                    if (p1.ec_to) ecMeta.ec_to = p1.ec_to
                    lc = runLifecycle(ecRows)
                    console.log('EC Step1: ' + ecRows.length + ' rows | ' + lc.encumbrance + ' | app=' + ecMeta.ec_app_number)
                }
            } catch (e) { console.log('EC Step1 error:', e) }
        }

        // STEP 2: Retry header if missing (visual scan)
        if (!ecMeta.ec_app_number || !ecMeta.ec_date) {
            try {
                const s2q = 'Find the Encumbrance Certificate TOP HEADER in these images. Extract: 1) e-Application Number (numeric), 2) Date of Print, 3) Search period From, 4) Search period To. Output JSON with keys: ec_app_number, ec_date, ec_from, ec_to.'
                const s2 = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 500, temperature: 0,
                    messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: s2q }] }]
                })
                const p2 = safeParseJSON(s2.content[0].type === 'text' ? s2.content[0].text : '{}')
                if (p2?.ec_app_number && !ecMeta.ec_app_number) ecMeta.ec_app_number = p2.ec_app_number
                if (p2?.ec_date && !ecMeta.ec_date) ecMeta.ec_date = p2.ec_date
                if (p2?.ec_from && !ecMeta.ec_from) ecMeta.ec_from = p2.ec_from
                if (p2?.ec_to && !ecMeta.ec_to) ecMeta.ec_to = p2.ec_to
                console.log('EC Step2 header: app=' + ecMeta.ec_app_number + ' date=' + ecMeta.ec_date)
            } catch (e) { console.log('EC Step2 error:', e) }
        }

        // STEP 3: Retry rows if missing (direct visual)
        if (ecRows.length === 0) {
            try {
                const s3q = buildECParsePrompt('Extract EC table rows directly from the image. Look at every row in the EC transaction table.') + '\n\nIMPORTANT: Look at the images directly. Extract ALL rows. LAST ROW is often Release Deed.'
                const s3 = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
                    messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: s3q }] }]
                })
                const p3 = safeParseJSON(s3.content[0].type === 'text' ? s3.content[0].text : '{}')
                if (p3?.found && p3.rows?.length > 0) {
                    ecRows = p3.rows
                    if (!ecMeta.ec_app_number && p3.ec_app_number) ecMeta.ec_app_number = p3.ec_app_number
                    lc = runLifecycle(ecRows)
                    console.log('EC Step3: ' + ecRows.length + ' rows | ' + lc.encumbrance)
                }
            } catch (e) { console.log('EC Step3 error:', e) }
        }

        // ============================================================
        // MODULE 8 -- EXPERT RELEASE DEED VERIFICATION
        // Cross-references ALL documents for mortgage + release
        // Updates lifecycle with verified findings
        // ============================================================
        try {
            const m8 = await AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: MODULE8_PROMPT }] }]
            })
            const m8r = safeParseJSON(m8.content[0].type === 'text' ? m8.content[0].text : '{}')
            console.log('Module8 status:', m8r?.overall_status, 'encumbrances:', m8r?.encumbrances?.length)

            if (m8r?.encumbrances && Array.isArray(m8r.encumbrances)) {
                const active = [...lc.active]
                const released = [...lc.released]

                for (const enc of m8r.encumbrances) {
                    const isMort = enc.type?.toLowerCase().includes('mortgage') || enc.type?.toLowerCase().includes('charge')
                    if (!isMort) continue

                    const lk = (enc.bank || enc.created_by || '').toLowerCase().split(' ').filter((w: string) => w.length > 3)

                    if (enc.release_found && enc.release_document) {
                        // Release confirmed -- move to released
                        const alreadyRel = released.some(r => lk.some(w => r.lender.toLowerCase().includes(w)))
                        if (!alreadyRel && lk.length > 0) {
                            const actIdx = active.findIndex(a => lk.some(w => a.lender.toLowerCase().includes(w)))
                            if (actIdx >= 0) {
                                const m = active.splice(actIdx, 1)[0]
                                m.release_deed_no = enc.release_document || ''
                                m.release_date = enc.release_date || ''
                                released.push(m)
                                console.log('M8 RELEASE: ' + enc.bank + ' -> Deed ' + enc.release_document)
                            } else {
                                released.push({
                                    row: 0, lender: enc.bank || '',
                                    deed_no: enc.document_number || '', date: enc.date || '',
                                    release_deed_no: enc.release_document || '', release_date: enc.release_date || ''
                                })
                                console.log('M8 NEW RELEASE: ' + enc.bank)
                            }
                        }
                    } else if (!enc.release_found) {
                        // Active mortgage confirmed
                        const alreadyAct = active.some(a => lk.some(w => a.lender.toLowerCase().includes(w)))
                        const alreadyRel = released.some(r => lk.some(w => r.lender.toLowerCase().includes(w)))
                        if (!alreadyAct && !alreadyRel && lk.length > 0) {
                            active.push({
                                row: 0, lender: enc.bank || '', deed_no: enc.document_number || '',
                                date: enc.date || '', release_deed_no: '', release_date: ''
                            })
                            console.log('M8 ACTIVE: ' + enc.bank)
                        }
                    }
                }
                lc = buildLifecycle(active, released)
                console.log('M8 FINAL: ' + lc.encumbrance + ' | ' + lc.summary)
            }
        } catch (e) { console.log('Module8 error:', e) }

        console.log('EC FINAL: app=' + (ecMeta.ec_app_number || 'MISSING') + ' rows=' + ecRows.length + ' status=' + lc.encumbrance)

        const existingBank = lc.active.length > 0 ? lc.active[0].lender
            : lc.released.length > 0 ? lc.released[0].lender : 'N/A'

        const ecTbl = ecTableHTML(ecRows, lc)

        // GROUND TRUTH for all layers
        const GT = [
            '=== EC GROUND TRUTH -- DO NOT CONTRADICT ===',
            'EC App No: ' + (ecMeta.ec_app_number || 'NOT PROVIDED'),
            'Date of Print: ' + (ecMeta.ec_date || 'NOT PROVIDED'),
            'Search Period: ' + (ecMeta.ec_from || 'NOT PROVIDED') + ' to ' + (ecMeta.ec_to || 'NOT PROVIDED'),
            'EC Rows: ' + ecRows.length + ' | Status: ' + lc.encumbrance,
            'Summary: ' + lc.summary,
            'Active: ' + (lc.active.length === 0 ? 'NONE' : lc.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(' | ')),
            'Released: ' + (lc.released.length === 0 ? 'NONE' : lc.released.map(r => r.lender + ' RELEASED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')),
            'RULE: RELEASED = never flag active | COL7 = NEVER',
            '=== END GROUND TRUTH ==='
        ].join('\n')

        const FORM = [
            '=== FORM DATA -- USER INPUT -- HIGHEST PRIORITY ===',
            'FORM_APPLICANT: ' + applicantName,
            'FORM_CO: ' + (coApplicant || 'Not Applicable'),
            'FORM_OWNER: ' + (currentOwner || applicantName),
            'FORM_BANK: ' + bankName,
            'FORM_PROPERTY: ' + propertyAddress,
            'FORM_EAST: ' + (boundaryEast || 'As per documents'),
            'FORM_WEST: ' + (boundaryWest || 'As per documents'),
            'FORM_NORTH: ' + (boundaryNorth || 'As per documents'),
            'FORM_SOUTH: ' + (boundarySouth || 'As per documents'),
            'RULE: Applicant = FORM_APPLICANT always. Never advocate/lawyer name.',
            '=== END FORM DATA ==='
        ].join('\n')

        const opinion = getLegalOpinion(caseType, currentOwner || applicantName, applicantName, existingBank)

        // ============================================================
        // DOCUMENT EXTRACTION + TITLE VERIFICATION (parallel)
        // ============================================================
        const [l1r, l23r] = await Promise.all([
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: SYS_L1,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: FORM + '\n\n' + GT }] }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: SYS_L23(caseType),
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: FORM + '\n\n' + GT }] }]
            })
        ])

        const l1t = l1r.content[0].type === 'text' ? l1r.content[0].text : ''
        const l23t = l23r.content[0].type === 'text' ? l23r.content[0].text : ''
        const ctx = 'L1:\n' + l1t.substring(0, 2000) + '\n\nL23:\n' + l23t.substring(0, 2000) + '\n\n' + GT

        // ============================================================
        // REPORT GENERATION (parallel)
        // ============================================================
        const [r4a, r4b, r4c, r4d] = await Promise.all([
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4A,
                messages: [{ role: 'user', content: FORM + '\nEC: App=' + ecMeta.ec_app_number + ' Date=' + ecMeta.ec_date + ' From=' + ecMeta.ec_from + ' To=' + ecMeta.ec_to + ' Rows=' + ecRows.length + ' Status=' + lc.encumbrance + '\nBANK: ' + bankName + '\n\n' + ctx }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 5000, temperature: 0, system: SYS_4B,
                messages: [{ role: 'user', content: FORM + '\nCASE: ' + caseType + '\n' + GT + '\nACTIVE: ' + (lc.active.length === 0 ? 'NONE' : lc.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(', ')) + '\nRELEASED: ' + (lc.released.length === 0 ? 'NONE' : lc.released.map(r => r.lender + ' RELEASED vide Deed:' + r.release_deed_no + ' on ' + r.release_date).join(', ')) + '\n\n' + ctx + '\nReplace [EC_TABLE_GOES_HERE] with:\n' + ecTbl }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: SYS_4C,
                messages: [{ role: 'user', content: FORM + '\nBANK: ' + bankName + '\nCASE: ' + caseType + '\n' + GT + '\n\n' + ctx + '\nReplace [INSERT_LEGAL_OPINION] with:\n<p>' + opinion + '</p>' }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4D,
                messages: [{ role: 'user', content: FORM + '\nCASE: ' + caseType + '\nBANK: ' + bankName + '\n' + GT + '\n\n' + ctx }]
            })
        ])

        let p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error</p>'
        let p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error</p>'
        let p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error</p>'
        const p911 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error</p>'

        // ============================================================
        // LAYER 5 VALIDATION
        // ============================================================
        const errs: string[] = []
        if (lc.released.length > 0 && p45.toLowerCase().includes('no release'))
            errs.push('BUG in Part IV: says no release but IS RELEASED. Use: stands discharged vide Release Deed No.' + lc.released[0].release_deed_no)
        if (lc.active.length === 0 && p678.toLowerCase().includes('active mortgage'))
            errs.push('BUG in Part VI: flags active mortgage but NO active mortgage exists. Remove that alert.')
        if (p123.toLowerCase().includes('illegib'))
            errs.push('BUG in Part III: has illegibility remark. Remove it.')

        if (errs.length > 0) {
            try {
                const fr = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0,
                    system: 'Fix ONLY listed errors. Return: [fixed Part IV] ===SPLIT=== [fixed Part VI]. Pure HTML.',
                    messages: [{ role: 'user', content: 'ERRORS:\n' + errs.join('\n') + '\n\nPART IV:\n' + p45 + '\n\n===SPLIT===\n' + p678 }]
                })
                const ft = fr.content[0].type === 'text' ? fr.content[0].text : ''
                const sp = ft.indexOf('===SPLIT===')
                if (sp > 0) { p45 = ft.substring(0, sp).trim(); p678 = ft.substring(sp + 11).trim() }
            } catch (e) { console.log('Validation error:', e) }
        }

        const verdict = lc.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR'
            : lc.active.length === 0 ? 'CLEAR' : 'CLEAR SUBJECT TO'

        const html = buildReport({
            refNo, appId: appId || 'AUTO', today,
            bankName: bankName || 'Bank',
            loanType: loanMap[caseType] || 'LAP',
            p123, p45, p678, p911
        })

        if (userId && DB) {
            try {
                await DB.from('reports').insert({
                    user_id: userId, case_type: caseType,
                    applicant_name: applicantName || 'Unknown',
                    bank_name: bankName || 'Unknown',
                    property_address: propertyAddress || 'Unknown',
                    verdict, encumbrance_status: lc.encumbrance,
                    ec_rows: ecRows.length, report_html: html
                })
            } catch (e) { console.log('DB error:', e) }
        }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle: lc, ecRows, ecMeta })

    } catch (e: any) {
        console.error('Pipeline error:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}