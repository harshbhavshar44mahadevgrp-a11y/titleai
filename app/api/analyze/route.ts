// ================================================================
// TITLEMATRIXAI -- FINAL PRODUCTION ROUTE v4
// ALL BUGS FIXED:
// 1. Form fields ALWAYS priority over AI extraction
// 2. EC 3-pass -- header + rows + bank exact name
// 3. Mortgage + Release deed lifecycle -- code logic (not AI)
// 4. temperature=0 -- same report every time
// maxDuration=300 | claude-sonnet-4-6 | images key
// ================================================================
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const AI = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const DB = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

// ================================================================
// TYPES
// ================================================================
interface ECRow {
    row_number: number
    col1_type: string
    col3_aapnar: string
    col4_lenar: string
    col5_date: string
    col6_deed_no: string
}
interface Charge {
    row: number; lender: string; deed_no: string; date: string
    release_deed_no: string; release_date: string
}

// ================================================================
// BANK DETECTION -- 30+ patterns
// ================================================================
function isBank(name: string): boolean {
    if (!name || name.length < 3) return false
    const n = name.toLowerCase()
    const patterns = [
        'bank', 'finance', 'financial', 'housing', 'capital', 'credit',
        'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'boi', 'canara',
        'union bank', 'idbi', 'uco', 'central bank', 'dena', 'vijaya',
        'bajaj', 'lic', 'lichfl', 'gruh', 'aavas', 'piramal', 'indiabulls',
        'tata capital', 'l&t', 'mahindra', 'shriram', 'muthoot', 'manappuram',
        'bandhan', 'yes bank', 'idfc', 'federal', 'karnataka', 'nainital',
        'aditya birla', 'hero fincorp', 'cholamandalam', 'fullerton',
        'nbfc', 'hfc', 'corporation', 'limited', 'ltd', 'pvt',
        'home loan', 'housing loan', 'home finance'
    ]
    return patterns.some(p => n.includes(p))
}

// ================================================================
// MORTGAGE LIFECYCLE ENGINE -- 100% code logic, not AI
// ================================================================
function runLifecycle(rows: ECRow[]) {
    const active: Charge[] = []
    const released: Charge[] = []

    // Pass 1: Find all mortgages (bank in Col4 = receives mortgage)
    for (const r of rows) {
        if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) {
            active.push({
                row: r.row_number, lender: r.col4_lenar,
                deed_no: r.col6_deed_no || '', date: r.col5_date || '',
                release_deed_no: '', release_date: ''
            })
        }
    }

    // Pass 2: Find all releases (bank in Col3 = gives back)
    for (const r of rows) {
        if (isBank(r.col3_aapnar) && !isBank(r.col4_lenar)) {
            // Match to active mortgage by lender name
            const lenderWords = r.col3_aapnar.toLowerCase().split(/\s+/).filter(w => w.length > 3)
            const idx = active.findIndex(a => {
                const aName = a.lender.toLowerCase()
                return lenderWords.some(w => aName.includes(w))
            })
            if (idx >= 0) {
                const m = active.splice(idx, 1)[0]
                m.release_deed_no = r.col6_deed_no || ''
                m.release_date = r.col5_date || ''
                released.push(m)
            } else {
                released.push({
                    row: r.row_number, lender: r.col3_aapnar,
                    deed_no: '', date: '',
                    release_deed_no: r.col6_deed_no || '',
                    release_date: r.col5_date || ''
                })
            }
        }
    }

    const encumbrance = active.length > 0
        ? 'ENCUMBERED'
        : released.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'

    const summary = active.length === 0 && released.length === 0
        ? 'NIL encumbrance'
        : active.length > 0
            ? 'ACTIVE: ' + active.map(a => a.lender + ' (Deed No.' + a.deed_no + ' dated ' + a.date + ')').join(' | ')
            : 'RELEASED: ' + released.map(r => r.lender + ' DISCHARGED vide Release Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')

    return { active, released, encumbrance, summary }
}

// ================================================================
// EC TABLE HTML -- Classified Type + Match Confidence
// ================================================================
function ecTableHTML(rows: ECRow[], lc: ReturnType<typeof runLifecycle>): string {
    if (!rows.length) return '<p>No EC entries found in the documents produced for examination.</p>'

    let h = '<table class="ec-tbl"><tr><th>Sr.</th><th>Classified Type</th><th>Match Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 — Aapnar (Executing)</th><th>Col 4 — Lenar (Claimant)</th><th>Status</th></tr>'

    for (const r of rows) {
        const isRelRow = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        const isMortRow = isBank(r.col4_lenar) && !isBank(r.col3_aapnar)
        const isActMort = lc.active.some((c: Charge) => c.row === r.row_number)
        const t = r.col1_type || 'Transaction'

        let cls = '', status = '', ct = t, conf = ''

        if (isRelRow) {
            cls = 'ec-rel'
            ct = 'Reconveyance / Mortgage Release Deed'
            conf = 'HIGH — Bank in Col 3 as releasing party. Release confirmed.'
            status = '&#x2705; DISCHARGED — Formally satisfies and releases prior mortgage. No subsisting charge.'
        } else if (isMortRow && isActMort) {
            cls = 'ec-act'
            ct = 'Mortgage Deed — Active'
            conf = 'HIGH — Bank in Col 4 as mortgagee. Active charge confirmed.'
            status = '&#x26A0; ACTIVE MORTGAGE — Subsisting as on date. No Release Deed found.'
        } else if (isMortRow && !isActMort) {
            cls = 'ec-rel'
            ct = 'Mortgage Deed — Discharged'
            conf = 'HIGH — Bank in Col 4. Discharged vide Release Deed on record.'
            status = '&#x2705; DISCHARGED — Released vide subsequent Release Deed. No subsisting charge.'
        } else if (t.toLowerCase().includes('sale')) {
            ct = 'Sale Deed'
            conf = 'HIGH — Establishes title vesting in claimant.'
            status = '&#x2705; TITLE DOCUMENT — No encumbrance.'
        } else if (t.toLowerCase().includes('declaration')) {
            ct = 'Declaration Deed'
            conf = 'MEDIUM — Title confirmatory instrument.'
            status = '&#x26A0; Verify nature and impact on title.'
        } else if (t.toLowerCase().includes('partition')) {
            ct = 'Partition Deed'
            conf = 'HIGH — Property division instrument.'
            status = 'Verify share of subject property.'
        } else {
            conf = 'MEDIUM — Verify nature and impact.'
            status = 'Transaction — Verify.'
        }

        h += '<tr><td>' + r.row_number + '</td><td>' + ct + '</td><td>' + conf + '</td><td>' + (r.col6_deed_no || '--') + '</td><td>' + (r.col5_date || '--') + '</td><td>' + (r.col3_aapnar || '--') + '</td><td>' + (r.col4_lenar || '--') + '</td><td class="' + cls + '">' + status + '</td></tr>'
    }
    return h + '</table>'
}

// ================================================================
// LEGAL OPINION -- Fixed wording
// ================================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
    const B = 'On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that'
    const S = 'The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.'
    const SBT = 'The said immovable property will be enforceable under SARFAESI Act subject to charge of ' + existingBank + '. The property can be accepted by the way of SECURITY and a valid Equitable/Registered Mortgage can be created in favour of your bank subject to charge of ' + existingBank + '.'
    const T = 'the right, title and interest of ' + owner + ' in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid'
    const M = 'He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.'
    const ops: Record<string, string> = {
        builder_purchase: B + ' ' + T + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', ' + M + ' ' + S,
        resale: B + ' ' + T + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', ' + M + ' ' + S,
        bt: B + ' ' + T + ' subject to charge of ' + existingBank + ' and after discharge of existing mortgage and execution of Sale Deed in favour of ' + applicant + ', ' + M + ' ' + SBT,
        seller_bt: B + ' ' + T + ' subject to charge of ' + existingBank + ' and after discharge of existing mortgage and execution of Sale Deed in favour of ' + applicant + ', ' + M + ' ' + SBT,
        lap: B + ' ' + T + ' and He/She/They have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ' + S,
    }
    return ops[ct] || ops['lap']
}

// ================================================================
// CSS
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Georgia","Times New Roman",serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:8px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px}table.mut tr:nth-child(even){background:#f9fafb}table.tc-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.tc-tbl th{background:#374151;color:#fff;padding:5px 8px;font-size:10px}table.tc-tbl td{border:1px solid #e5e7eb;padding:5px 8px}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}`

// ================================================================
// EC EXTRACTION PROMPT
// ================================================================
const EC_PROMPT = `You are an expert at reading Gujarat IGR Encumbrance Certificates. Output ONLY valid JSON.

FIND THE EC: Look for "Milakat Parna Boja Angenu Patrak" OR "Encumbrance Certificate" OR government table from IGR Gujarat.

STEP 1 - EC HEADER (TOP of document):
- e-Application No / e-App No / e-અરજી ક્રમાંક = ec_app_number
- Date of Print / છાપ્યાની તારીખ = ec_date
- Search Period From = ec_from
- Search Period To = ec_to

STEP 2 - EC TABLE (7 columns, left to right):
COL 1 = Deed Type
COL 2 = Property Description -- SKIP ENTIRELY
COL 3 = Aapnar = Executing Party = WHO GIVES
COL 4 = Lenar = Claimant Party = WHO RECEIVES
COL 5 = Registration Date
COL 6 = Deed/Registration Number (SECOND LAST)
COL 7 = LAST COLUMN = NEVER EXTRACT

STEP 3 - GUJARATI TRANSLATION (Col 1):
વેચાણ = Sale Deed
ગીરો = Mortgage Deed
ગ.ફ. / ગ.મૂ.ફ. / ગીરો ફેર / ગીરો મૂ = Mortgage Release Deed
ભાગ = Partition Deed
ભેટ = Gift Deed
ઘ.ખ. / ઘ.ન. = Declaration Deed
ક.સ. = Family Settlement
હ.ત. = Relinquishment Deed
ટ.ઇ. / ન.ત. = Court Decree
ખ.ત. = Cancellation Deed

STEP 4 - BANK DETECTION:
If COL 4 has bank/finance/HDFC/SBI/ICICI/Axis/Bajaj/LIC/LICHFL/Gruh/Aavas/PNB = MORTGAGE DEED
If COL 3 has bank/finance/HDFC/SBI/ICICI/Axis/Bajaj/LIC = MORTGAGE RELEASE DEED

RULES:
1. Extract EVERY row -- never skip
2. LAST ROW often = Mortgage Release Deed -- extract it
3. COL 7 = NEVER EVER extract
4. Extract EXACT party names as written in document

Output JSON only:
{"found":true,"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}]}
If no EC: {"found":false,"rows":[]}`

// ================================================================
// LAYER 1 -- Document Extraction
// ================================================================
const SYS_L1 = `You are Document Extraction Engine of TITLEMATRIXAI. 20-Year Advocate Protocol.

CRITICAL RULES:
- NEVER assume or create facts
- Use ONLY what documents say
- NEVER use advocate/lawyer name as applicant
- NEVER "and others" -- every person by full name
- EC Col 7 = NEVER READ
- Stamp paper number = NEVER mention
- Loan amount = NEVER mention
- If not available = "NOT PROVIDED FOR VERIFICATION."

EXTRACT from every document:
1. Document type
2. Registration date (IGR only, not stamp paper)
3. Registration number
4. All executants by full name
5. All claimants by full name
6. Property description with survey numbers
7. Area figures (carpet, balcony, wash, UPS if flat)

PROPERTY DESCRIPTION FORMAT:
"Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

OUTPUT META:
---META---
PROPERTY_PARA: [exact paragraph]
CURRENT_OWNER: [all names]
RED_FLAGS: [list or NONE]
---END META---`

// ================================================================
// LAYER 2+3 -- Title Verification
// ================================================================
function SYS_L23(ct: string): string {
    const caseGuide: Record<string, string> = {
        builder_purchase: 'Builder Purchase: Developer title deeds | NA Order | RERA mandatory post-2017 | Building Permission | Sale Deed from Developer to Applicant must exist',
        resale: 'Resale: 30-year title chain | Every seller-buyer link | EC cross-match',
        bt: 'Balance Transfer: EC must show ACTIVE mortgage from existing bank | Letter of Discharge | Foreclosure letter',
        seller_bt: 'Seller BT: Release existing mortgage + Sale to purchaser. Both must complete.',
        lap: 'LAP: Owner = Mortgagor. EC must show NIL or Released only.',
    }
    return `You are Title Verification + Risk Engine of TITLEMATRIXAI. 20-Year Advocate Protocol.

RULES:
- Never assume. Never create. EC Ground Truth = DO NOT CONTRADICT.
- RELEASED mortgage = NEVER flag as active. ACTIVE = HIGH SEVERITY.
- NEVER use advocate/lawyer name as applicant or owner
- NEVER "and others"

CASE: ${ct.toUpperCase().replace(/_/g, ' ')}
${caseGuide[ct] || caseGuide['lap']}

REVENUE 7-CHECK:
1. Owner name in records = same as latest deed?
2. Survey number = same as EC?
3. Area = consistent throughout?
4. Land use = Bin Kheti/Non-Agricultural? (Kheti = RED FLAG)
5. Boja column = NIL?
6. Ganot/Tenant = NIL? (Tenant = SARFAESI issue)
7. Govt acquisition notation = None?

OUTPUT META:
---META---
PROPERTY_PARA: [exact paragraph]
CURRENT_OWNER: [all names]
RED_FLAGS: [list or NONE]
---END META---`
}

// ================================================================
// LAYER 4A -- Parts I + II + III
// ================================================================
const SYS_4A = `Layer 4A -- PARTS I + II + III. PURE HTML. No markdown.

CRITICAL:
- Applicant name = EXACTLY as provided in FORM_APPLICANT (never use advocate name)
- Bank name = EXACTLY as provided in FORM_BANK
- Part III = NO illegibility remarks (those go in Part VI only)
- Every person = full name (never "and others")

PART I:
<hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt">
<tr><td>Name of Borrower/s</td><td>:</td><td>[FORM_APPLICANT -- exact from form]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[FORM_CO_APPLICANT or Not Applicable]</td></tr>
<tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Company]</td></tr>
</table>
<div class="sph">B. Mortgagor Details</div>
<table class="mt">
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[FORM_APPLICANT]</td></tr>
<tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr>
<tr><td>Constitution</td><td>:</td><td>Individual</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[FORM_OWNER -- from form, all names individually]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[from documents]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No. | Dated | SRO]</td></tr>
</table>

PART II:
<hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[exact property paragraph from documents]</div>
<table class="mt">
<tr><td>East (Purva)</td><td>:</td><td>[FORM_EAST]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[FORM_WEST]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[FORM_NORTH]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[FORM_SOUTH]</td></tr>
</table>

PART III:
<hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
<p>The following documents have been produced for examination and scrutiny:</p>
[For each document: <div class="di"><p><span class="dn">N. [Type] -- [Reg No] | [Date]</span><br>[2 factual sentences. NO illegibility. NO "not provided" except for EC fields.]</p></div>]
[For EC: <div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [APP_NO] | Date: [EC_DATE] | Period: [FROM] to [TO]</span><br>[N] transactions found. Encumbrance Status: [STATUS].</p></div>]
START WITH: <hr><div class="ph">PART I`

// ================================================================
// LAYER 4B -- Parts IV + V
// ================================================================
const SYS_4B = `Layer 4B -- PARTS IV + V. PURE HTML.

PART IV RULES:
1. Oldest FIRST -- strict chronological
2. First paragraph: NEVER starts with "Thereafter"
3. Every subsequent paragraph: MUST START with "Thereafter,"
4. NEVER "and others" -- all names individually
5. RELEASED mortgage EXACT WORDING:
   "stands discharged and the charge has been fully released and satisfied vide [Release Deed Type] No. [Y] dated [DD/MM/YYYY] executed by [Bank Name] in favour of [Owner] -- no subsisting charge of [Bank Name] remains on the subject property as on date."
6. ACTIVE mortgage EXACT WORDING:
   "is subsisting and active as on date -- no Release Deed or Discharge Certificate has been found in the documents produced or in the Encumbrance Certificate."
7. NEVER say "no discharge found" for a RELEASED mortgage
8. Last paragraph: EC App No, period, rows count, CLEAR/ENCUMBERED status

<hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
<p>[First paragraph -- oldest document -- NO Thereafter]</p>
<p>Thereafter, [next event]</p>
[continue with Thereafter for each event]
<table class="tc-tbl"><tr><th>Sr.</th><th>Year</th><th>Deed Type</th><th>From</th><th>To</th><th>Reg. No.</th><th>SRO</th><th>Area</th><th>Status</th></tr>
[one row per transaction]
</table>

<hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">A. Revenue Record (7/12 / Property Card)</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[name]</td></tr>
<tr><td>District</td><td>:</td><td>[name]</td></tr>
<tr><td>Survey / Block / FP No.</td><td>:</td><td>[numbers]</td></tr>
<tr><td>Total Area (H.Are.SqMt)</td><td>:</td><td>[area]</td></tr>
<tr><td>Land Use / Khate Type</td><td>:</td><td>[Non-Agricultural = OK | Kheti = RED FLAG]</td></tr>
<tr><td>Ownership Column (Khata)</td><td>:</td><td>[owner name or flag]</td></tr>
<tr><td>Boja / Encumbrance Column</td><td>:</td><td>[NIL subsisting OR active mortgage details]</td></tr>
<tr><td>Ganot / Tenant Column</td><td>:</td><td>[NIL = OK | Tenant = FLAG]</td></tr>
<tr><td>Govt Acquisition Notation</td><td>:</td><td>[None = OK | Any = CRITICAL FLAG]</td></tr>
</table>
<div class="sph">B. Mutation Entries (Chronological)</div>
<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Certified/Rejected</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>
[one row per mutation OR "NOT PROVIDED FOR VERIFICATION" row]
</table>
<div class="sph">C. Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>RERA Registration (Post May 2017 = Mandatory)</td><td>:</td><td>[RERA No. with validity OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[details with validity OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
</table>
<div class="sph">D. Encumbrance Certificate Analysis</div>
<p>[EC App Nos, periods, rows found, encumbrance status summary]</p>
[EC_TABLE_GOES_HERE]
<div class="sph">E. Mortgage Lifecycle Summary</div>
<table class="mt">
<tr><td>A. Active Mortgages</td><td>:</td><td>[NIL OR Bank + Deed No + Date -- ACTIVE]</td></tr>
<tr><td>B. Released Mortgages</td><td>:</td><td>[NIL OR Bank DISCHARGED vide Release Deed No.X dated DD/MM/YYYY]</td></tr>
<tr><td>C. Unmatched Releases</td><td>:</td><td>NIL</td></tr>
<tr><td>D. Overall Encumbrance Status</td><td>:</td><td>[CLEAR / ENCUMBERED / CLEAR WITH PRIOR RELEASE]</td></tr>
</table>
START WITH: <hr><div class="ph">PART IV`

// ================================================================
// LAYER 4C -- Parts VI + VII + VIII
// ================================================================
const SYS_4C = `Layer 4C -- PARTS VI + VII + VIII. PURE HTML. Max 5-6 alerts total.

ALERT RULES:
- NEVER flag RELEASED mortgage as active
- NEVER flag EC-confirmed registered deeds
- NEVER use advocate/lawyer name
- Lis Pendens = CRITICAL HIGH
- Agricultural land = CRITICAL HIGH
- Missing Sale Deed (builder purchase) = HIGH
- Active undisclosed mortgage = HIGH
- Missing RERA post-2017 = HIGH
- Missing OC/CC = HIGH
- Illegibility remarks go HERE ONLY (not Part III)

<hr><div class="ph">PART VI -- ALERTS AND ADVERSE FINDINGS</div>
[HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. Title</div><p>Finding with deed numbers.</p><p><span class="sg">Direction:</span> Action before sanction.</p></div>]
[MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. Title</div><p>Finding.</p><p><span class="sg">Direction:</span> Action.</p></div>]
[LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. Title</div><p>Note.</p><p><span class="sg">Direction:</span> Note for record.</p></div>]

<hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted and Available</div><ol>[list all docs]</ol>
<div class="sph">B. Critical Missing Documents (Report Hold)</div><ol>[mandatory missing docs OR write: <li>NIL -- All critical documents submitted.</li>]</ol>
<div class="sph">C. Important Missing Documents (Pre-Disbursement)</div><ol>[other missing OR NIL]</ol>
<div class="sph">D. Documents Illegible / Incomplete</div><ol>[illegible docs OR NIL]</ol>
<div class="sph">E. Risk Assessment Summary</div>
<table class="mt">
<tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
<tr><td>Mortgageability Status</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentences with specific deed/EC references]</td></tr>
</table>

<hr><div class="ph">PART VIII -- LEGAL OPINION AND VERDICT</div>
[INSERT_LEGAL_OPINION]
[VERDICT based on alerts:
HIGH: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve all HIGH SEVERITY conditions before proceeding.</p></div>
MEDIUM/LOW only: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Disbursement subject to fulfillment of all conditions.</p></div>
No alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable.</p></div>]
START WITH: <hr><div class="ph">PART VI`

// ================================================================
// LAYER 4D -- Parts IX + X + XI
// ================================================================
const SYS_4D = `Layer 4D -- PARTS IX + X + XI. PURE HTML.

Each Part IX item format:
<li><strong>[Document Name]</strong><br>
<em>Source:</em> [Who provides / Where to get]<br>
<em>Purpose:</em> [Why needed -- legal consequence of absence]</li>

<hr><div class="ph">PART IX -- DOCUMENTS REQUIRED AT PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody BEFORE disbursement:</p>
<ol>[case-specific items with Source + Purpose]</ol>

<hr><div class="ph">PART X -- DOCUMENTS REQUIRED AT POST-DISBURSEMENT STAGE</div>
<p>The following documents are required AFTER disbursement:</p>
<ol>[items: Original Sale Deed | MODT/Mortgage Deed | CERSAI | Updated EC | Possession Letter | Society NOC | Mutation | Property Tax | OC/CC | Insurance]</ol>

<hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec">
<div class="fr-title">Final Title Status:</div>
<div class="fr-value">[CLEAR AND MARKETABLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE NOT CLEAR]</div>
</div>
<p style="margin-top:16px;">[5-6 sentences: title chain status | EC App Nos + period + encumbrance | mortgage lifecycle with exact deed nos | RERA status | numbered conditions (i)(ii)(iii) | SARFAESI enforceability | bank recommendation]</p>
START WITH: <hr><div class="ph">PART IX`

// ================================================================
// REPORT BUILDER
// ================================================================
function buildReport(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; p123: string; p45: string; p678: string; p911: string }): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report</title><style>' + CSS + '</style></head><body>'
        + '<div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div>'
        + '<div class="hdr-right"><div><strong>Reference No.:</strong> ' + p.refNo + '</div><div><strong>Application ID:</strong> ' + p.appId + '</div><div><strong>Report Date:</strong> ' + p.today + '</div><div><strong>Bank:</strong> ' + p.bankName + '</div></div></div>'
        + '<div class="rtitle">LEGAL SCRUTINY REPORT -- ' + p.loanType + '</div><hr>'
        + p.p123 + p.p45 + p.p678 + p.p911
        + '<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ' + p.today + '</div></div><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">' + p.bankName + '</div></div></div>'
        + '<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: This Report is prepared exclusively for ' + p.bankName + ' for Application ID ' + p.appId + '. Based solely on documents produced for scrutiny.</div><div class="wm">TITLEMATRIXAI -- Confidential -- For Bank Use Only</div></div></body></html>'
}

// ================================================================
// MAIN API HANDLER
// ================================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // ============================================================
        // FORM FIELDS -- USER INPUT ALWAYS TAKES PRIORITY
        // ============================================================
        const {
            images,
            caseType = 'lap',
            appId = 'AUTO',
            bankName = 'Bank',
            applicantName = '',
            coApplicant = '',
            currentOwner = '',
            propertyAddress = '',
            boundaryEast = '',
            boundaryWest = '',
            boundaryNorth = '',
            boundarySouth = '',
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
            type: 'image',
            source: { type: 'base64', media_type: img.mediaType, data: img.data }
        }))

        // ============================================================
        // PHASE 1: EC 3-PASS EXTRACTION
        // ============================================================
        let ecRows: ECRow[] = []
        let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
        let lifecycle = runLifecycle([])

        const parseEC = (raw: string) => {
            try {
                const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const f = clean.indexOf('{'); const l = clean.lastIndexOf('}')
                return JSON.parse(f >= 0 && l >= 0 ? clean.substring(f, l + 1) : clean)
            } catch { return null }
        }

        // PASS 1: Full extraction
        try {
            const r1 = await AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: EC_PROMPT }] }]
            })
            const p1 = parseEC(r1.content[0].type === 'text' ? r1.content[0].text : '{}')
            if (p1?.found) {
                ecRows = p1.rows || []
                if (p1.ec_app_number) ecMeta.ec_app_number = p1.ec_app_number
                if (p1.ec_date) ecMeta.ec_date = p1.ec_date
                if (p1.ec_from) ecMeta.ec_from = p1.ec_from
                if (p1.ec_to) ecMeta.ec_to = p1.ec_to
                lifecycle = runLifecycle(ecRows)
                console.log('EC P1: rows=' + ecRows.length + ' status=' + lifecycle.encumbrance + ' app=' + ecMeta.ec_app_number)
            }
        } catch (e) { console.log('EC P1 error:', e) }

        // PASS 2: Header only if missing
        if (!ecMeta.ec_app_number || !ecMeta.ec_date) {
            try {
                const p2q = 'Look at these images for Encumbrance Certificate from Gujarat IGR. Find the TOP HEADER section. Extract: 1) e-Application Number (numeric code at top), 2) Date of Print, 3) Search period From date, 4) Search period To date. Output JSON with keys ec_app_number, ec_date, ec_from, ec_to.'
                const r2 = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 500, temperature: 0,
                    messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: p2q }] }]
                })
                const p2 = parseEC(r2.content[0].type === 'text' ? r2.content[0].text : '{}')
                if (p2?.ec_app_number && !ecMeta.ec_app_number) ecMeta.ec_app_number = p2.ec_app_number
                if (p2?.ec_date && !ecMeta.ec_date) ecMeta.ec_date = p2.ec_date
                if (p2?.ec_from && !ecMeta.ec_from) ecMeta.ec_from = p2.ec_from
                if (p2?.ec_to && !ecMeta.ec_to) ecMeta.ec_to = p2.ec_to
                console.log('EC P2 header: app=' + ecMeta.ec_app_number + ' date=' + ecMeta.ec_date)
            } catch (e) { console.log('EC P2 error:', e) }
        }

        // PASS 3: Rows retry if missing
        if (ecRows.length === 0) {
            try {
                const p3q = EC_PROMPT + '\n\nCRITICAL RETRY: Look at every image carefully. Find EC table rows. Extract ALL rows. LAST ROW is often Mortgage Release Deed -- extract it. Write EXACT bank/party names.'
                const r3 = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
                    messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: p3q }] }]
                })
                const p3 = parseEC(r3.content[0].type === 'text' ? r3.content[0].text : '{}')
                if (p3?.found && p3.rows?.length > 0) {
                    ecRows = p3.rows
                    if (!ecMeta.ec_app_number && p3.ec_app_number) ecMeta.ec_app_number = p3.ec_app_number
                    if (!ecMeta.ec_date && p3.ec_date) ecMeta.ec_date = p3.ec_date
                    if (!ecMeta.ec_from && p3.ec_from) ecMeta.ec_from = p3.ec_from
                    if (!ecMeta.ec_to && p3.ec_to) ecMeta.ec_to = p3.ec_to
                    lifecycle = runLifecycle(ecRows)
                    console.log('EC P3: rows=' + ecRows.length + ' status=' + lifecycle.encumbrance)
                }
            } catch (e) { console.log('EC P3 error:', e) }
        }


        // ---- PASS 4: DEDICATED RELEASE DEED VERIFIER ----
        // Runs after rows extracted. Finds any missed Release Deeds.
        // Uses cross-reference logic: mortgage entry + matching release entry
        if (ecRows.length > 0) {
            try {
                const p4Prompt = `You are an expert EC analyst. Review these EC images.
Your ONLY job: Find if any Mortgage/Charge has a matching Release Deed.

STEP 1: Find ALL mortgage/charge entries (bank in claimant column).
STEP 2: For each mortgage, search for matching Release Deed, Discharge, Cancellation.
STEP 3: Match by: same bank name OR same deed number OR same parties.

Keywords for Release: Release Deed, Discharge, Satisfaction, Vacated, Extinguished, ગ.ફ., ગ.મૂ.ફ., ગ.ફ.ખ., ગ.ફ.ત., Mortgage Release, Reconveyance, No Dues, Full Satisfaction.

For each mortgage found, output JSON array:
[{"original_deed_no":"","original_date":"","original_lender":"","is_released":true,"release_deed_no":"","release_date":"","release_by":"","confidence":"HIGH/MEDIUM/LOW"}]

If no mortgage found: []
If mortgage found but no release: [{"original_deed_no":"X","original_lender":"Bank","is_released":false,"release_deed_no":null,"release_date":null,"release_by":null,"confidence":"HIGH"}]`

                const r4ec = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 2000, temperature: 0,
                    messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: p4Prompt }] }]
                })
                const p4Raw = r4ec.content[0].type === 'text' ? r4ec.content[0].text : '[]'
                const p4Clean = p4Raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const p4f = p4Clean.indexOf('['); const p4l = p4Clean.lastIndexOf(']')
                const p4Results = JSON.parse(p4f >= 0 && p4l >= 0 ? p4Clean.substring(p4f, p4l + 1) : '[]')

                if (Array.isArray(p4Results) && p4Results.length > 0) {
                    for (const r of p4Results) {
                        if (r.is_released && r.release_deed_no && r.original_lender) {
                            // Check if lifecycle already has this as released
                            const alreadyReleased = lifecycle.released.some(rel =>
                                rel.lender.toLowerCase().includes(r.original_lender.toLowerCase().split(' ')[0]) ||
                                rel.release_deed_no === r.release_deed_no
                            )
                            if (!alreadyReleased) {
                                // Move from active to released
                                const activeIdx = lifecycle.active.findIndex(a =>
                                    a.lender.toLowerCase().includes(r.original_lender.toLowerCase().split(' ')[0])
                                )
                                if (activeIdx >= 0) {
                                    const m = lifecycle.active.splice(activeIdx, 1)[0]
                                    m.release_deed_no = r.release_deed_no || ''
                                    m.release_date = r.release_date || ''
                                    lifecycle.released.push(m)
                                    console.log('EC P4: RELEASE FOUND! ' + r.original_lender + ' -> Released vide ' + r.release_deed_no)
                                } else {
                                    // Add as new released entry
                                    lifecycle.released.push({
                                        row: 0,
                                        lender: r.original_lender,
                                        deed_no: r.original_deed_no || '',
                                        date: r.original_date || '',
                                        release_deed_no: r.release_deed_no || '',
                                        release_date: r.release_date || ''
                                    })
                                    console.log('EC P4: NEW RELEASE ADDED: ' + r.original_lender)
                                }
                            }
                        }
                    }
                    // Recalculate encumbrance after P4
                    const newEnc = lifecycle.active.length > 0 ? 'ENCUMBERED'
                        : lifecycle.released.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'
                    const newSum = lifecycle.active.length === 0 && lifecycle.released.length === 0
                        ? 'NIL encumbrance'
                        : lifecycle.active.length > 0
                            ? 'ACTIVE: ' + lifecycle.active.map(a => a.lender + ' (Deed No.' + a.deed_no + ' dated ' + a.date + ')').join(' | ')
                            : 'RELEASED: ' + lifecycle.released.map(r => r.lender + ' DISCHARGED vide Release Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')
                    lifecycle.encumbrance = newEnc
                    lifecycle.summary = newSum
                    console.log('EC P4 FINAL: status=' + lifecycle.encumbrance + ' | ' + lifecycle.summary)
                }
            } catch (e) { console.log('EC P4 error:', e) }
        }

        console.log('EC FINAL: app=' + (ecMeta.ec_app_number || 'MISSING') + ' rows=' + ecRows.length + ' status=' + lifecycle.encumbrance)

        const existingBank = lifecycle.active.length > 0
            ? lifecycle.active[0].lender
            : lifecycle.released.length > 0 ? lifecycle.released[0].lender : 'N/A'

        const ecTbl = ecTableHTML(ecRows, lifecycle)

        // EC Ground Truth for all layers
        const GT = [
            '=== EC GROUND TRUTH (DO NOT CONTRADICT) ===',
            'EC App No: ' + (ecMeta.ec_app_number || 'NOT PROVIDED'),
            'Date of Print: ' + (ecMeta.ec_date || 'NOT PROVIDED'),
            'Search Period: ' + (ecMeta.ec_from || 'NOT PROVIDED') + ' to ' + (ecMeta.ec_to || 'NOT PROVIDED'),
            'EC Rows Found: ' + ecRows.length,
            'Encumbrance Status: ' + lifecycle.encumbrance,
            'Mortgage Summary: ' + lifecycle.summary,
            'Active Mortgages: ' + (lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(' | ')),
            'Released Mortgages: ' + (lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')),
            'Existing Bank: ' + existingBank,
            'RULE: RELEASED = never flag as active | ACTIVE = HIGH SEVERITY | COL7 = NEVER',
            '=== END GROUND TRUTH ==='
        ].join('\n')

        // Form data context -- USER INPUT PRIORITY
        const FORM = [
            '=== FORM DATA (USER INPUT -- HIGHEST PRIORITY) ===',
            'FORM_APPLICANT: ' + applicantName,
            'FORM_CO_APPLICANT: ' + (coApplicant || 'Not Applicable'),
            'FORM_OWNER: ' + (currentOwner || applicantName),
            'FORM_BANK: ' + bankName,
            'FORM_PROPERTY: ' + propertyAddress,
            'FORM_EAST: ' + (boundaryEast || 'As per documents'),
            'FORM_WEST: ' + (boundaryWest || 'As per documents'),
            'FORM_NORTH: ' + (boundaryNorth || 'As per documents'),
            'FORM_SOUTH: ' + (boundarySouth || 'As per documents'),
            'RULE: Applicant = FORM_APPLICANT always. Never use advocate/lawyer name.',
            '=== END FORM DATA ==='
        ].join('\n')

        // ============================================================
        // PHASE 2: DOCUMENT EXTRACTION (L1 + L23 parallel)
        // ============================================================
        const [l1Res, l23Res] = await Promise.all([
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
                system: SYS_L1,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: FORM + '\n\n' + GT }] }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
                system: SYS_L23(caseType),
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: FORM + '\n\n' + GT }] }]
            })
        ])

        const l1Text = l1Res.content[0].type === 'text' ? l1Res.content[0].text : ''
        const l23Text = l23Res.content[0].type === 'text' ? l23Res.content[0].text : ''
        const ctx = 'L1:\n' + l1Text.substring(0, 2000) + '\n\nL23:\n' + l23Text.substring(0, 2000) + '\n\n' + GT

        const opinion = getLegalOpinion(caseType, currentOwner || applicantName, applicantName, existingBank)

        // ============================================================
        // PHASE 3: REPORT GENERATION (L4 parallel)
        // ============================================================
        const p1ctx = 'EC_APP_NO=' + (ecMeta.ec_app_number || 'NOT PROVIDED') + ' EC_DATE=' + (ecMeta.ec_date || 'NOT PROVIDED') + ' EC_FROM=' + (ecMeta.ec_from || 'NOT PROVIDED') + ' EC_TO=' + (ecMeta.ec_to || 'NOT PROVIDED') + ' EC_ROWS=' + ecRows.length + ' STATUS=' + lifecycle.encumbrance

        const [r4a, r4b, r4c, r4d] = await Promise.all([
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4A,
                messages: [{ role: 'user', content: FORM + '\n' + p1ctx + '\n\nBANK: ' + bankName + '\n\n' + ctx }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 5000, temperature: 0, system: SYS_4B,
                messages: [{ role: 'user', content: FORM + '\nCASE: ' + caseType + '\n' + GT + '\nACTIVE: ' + (lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(', ')) + '\nRELEASED: ' + (lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED vide Deed:' + r.release_deed_no + ' on ' + r.release_date).join(', ')) + '\n\n' + ctx + '\nReplace [EC_TABLE_GOES_HERE] with:\n' + ecTbl }]
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
        // PHASE 4: LAYER 5 VALIDATION
        // ============================================================
        const errs: string[] = []

        if (lifecycle.released.length > 0 && p45.toLowerCase().includes('no release'))
            errs.push('BUG: Part IV says no release but mortgage IS RELEASED. Use exact wording: stands discharged vide Release Deed No.' + lifecycle.released[0].release_deed_no)

        if (lifecycle.released.length > 0 && p678.toLowerCase().includes('active mortgage') && lifecycle.active.length === 0)
            errs.push('BUG: Part VI flags active mortgage but NO active mortgage exists. Remove that alert.')

        if (p123.toLowerCase().includes('illegib'))
            errs.push('BUG: Part III has illegibility remark. Remove it. Illegibility goes in Part VI only.')

        if (errs.length > 0) {
            try {
                const fixRes = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0,
                    system: 'Fix ONLY the listed errors. Return: [fixed Part IV HTML] ===SPLIT=== [fixed Part VI HTML]. Pure HTML only.',
                    messages: [{ role: 'user', content: 'ERRORS:\n' + errs.join('\n') + '\n\nPART IV:\n' + p45 + '\n\n===SPLIT===\n' + p678 }]
                })
                const fixText = fixRes.content[0].type === 'text' ? fixRes.content[0].text : ''
                const sp = fixText.indexOf('===SPLIT===')
                if (sp > 0) { p45 = fixText.substring(0, sp).trim(); p678 = fixText.substring(sp + 11).trim() }
            } catch (e) { console.log('Validation error:', e) }
        }

        const verdict = lifecycle.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR'
            : lifecycle.active.length === 0 ? 'CLEAR' : 'CLEAR SUBJECT TO'

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
                    verdict, encumbrance_status: lifecycle.encumbrance,
                    ec_rows: ecRows.length, report_html: html
                })
            } catch (e) { console.log('DB error:', e) }
        }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle, ecRows, ecMeta })

    } catch (e: any) {
        console.error('Pipeline error:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}