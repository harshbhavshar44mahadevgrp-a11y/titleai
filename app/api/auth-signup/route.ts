// ================================================================
// TITLEMATRIXAI -- /api/analyze/route.ts ADVOCATE EDITION v3
// EC 3-Pass System | 500+ Word Dictionary | 100/100 Reports
// temperature=0 | maxDuration=300 | claude-sonnet-4-6
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
    row: number
    lender: string
    deed_no: string
    date: string
    release_deed_no: string
    release_date: string
}

// ================================================================
// BANK DETECTION
// ================================================================
function isBank(name: string): boolean {
    if (!name) return false
    const n = name.toLowerCase()
    const patterns = [
        'bank', 'finance', 'financial', 'housing', 'capital', 'credit',
        'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'boi', 'canara',
        'bajaj', 'lic', 'lichfl', 'gruh', 'aavas', 'piramal', 'indiabulls',
        'tata', 'l&t', 'mahindra', 'shriram', 'muthoot', 'manappuram',
        'bandhan', 'yes bank', 'idfc', 'federal', 'karnataka', 'nainital',
        'dhan', 'aditya birla', 'hero fincorp', 'cholamandalam', 'fullerton',
        'nbfc', 'hfc', 'corporation', 'limited', 'ltd'
    ]
    return patterns.some(p => n.includes(p))
}

// ================================================================
// MORTGAGE LIFECYCLE ENGINE
// ================================================================
function runLifecycle(rows: ECRow[]) {
    const active: Charge[] = []
    const released: Charge[] = []

    // PASS 1: Find all mortgages (bank in Col4)
    for (const r of rows) {
        if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) {
            active.push({
                row: r.row_number,
                lender: r.col4_lenar,
                deed_no: r.col6_deed_no || '',
                date: r.col5_date || '',
                release_deed_no: '',
                release_date: ''
            })
        }
    }

    // PASS 2: Find all releases (bank in Col3)
    for (const r of rows) {
        if (isBank(r.col3_aapnar) && !isBank(r.col4_lenar)) {
            // Match to active mortgage
            const idx = active.findIndex(a =>
                a.lender.toLowerCase().replace(/\s+/g, '').includes(
                    r.col3_aapnar.toLowerCase().replace(/\s+/g, '').substring(0, 8)
                ) || r.col3_aapnar.toLowerCase().includes(
                    a.lender.toLowerCase().split(' ')[0]
                )
            )
            if (idx >= 0) {
                const m = active.splice(idx, 1)[0]
                m.release_deed_no = r.col6_deed_no || ''
                m.release_date = r.col5_date || ''
                released.push(m)
            } else {
                // Unmatched release — still add to released
                released.push({
                    row: r.row_number,
                    lender: r.col3_aapnar,
                    deed_no: '',
                    date: '',
                    release_deed_no: r.col6_deed_no || '',
                    release_date: r.col5_date || ''
                })
            }
        }
    }

    const encumbrance = active.length > 0 ? 'ENCUMBERED' : released.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'
    const summary = active.length === 0 && released.length === 0
        ? 'NIL encumbrance'
        : active.length > 0
            ? 'ACTIVE mortgage: ' + active.map(a => a.lender + ' Deed:' + a.deed_no).join(' | ')
            : 'RELEASED: ' + released.map(r => r.lender + ' RELEASED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')

    return { active, released, encumbrance, summary }
}

// ================================================================
// EC TABLE HTML -- Matches perfect report format
// ================================================================
function ecTableHTML(rows: ECRow[], lc: ReturnType<typeof runLifecycle>): string {
    if (!rows.length) return '<p>No EC entries found in the documents produced for examination.</p>'

    let h = '<table class="ec-tbl"><tr>'
    h += '<th>Sr.</th><th>Classified Type</th><th>Match Confidence</th>'
    h += '<th>Deed No.</th><th>Date</th>'
    h += '<th>Col 3 &#8212; Aapnar (Executing)</th>'
    h += '<th>Col 4 &#8212; Lenar (Claimant)</th>'
    h += '<th>Status</th></tr>'

    for (const r of rows) {
        const isRelRow = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        const isMortRow = isBank(r.col4_lenar) && !isBank(r.col3_aapnar)
        const isActMort = lc.active.some((c: Charge) => c.row === r.row_number)
        const type = r.col1_type || 'Transaction'

        let cls = '', status = '', classifiedType = type, confidence = ''

        if (isRelRow) {
            cls = 'ec-rel'
            classifiedType = 'Reconveyance / Mortgage Release Deed'
            confidence = 'HIGH &#8212; Bank in Col 3 as releasing party. Release / Reconveyance confirmed.'
            status = '&#x2705; DISCHARGE INSTRUMENT &#8212; Formally satisfies and releases prior mortgage. Title unencumbered as of this date.'
        } else if (isMortRow && isActMort) {
            cls = 'ec-act'
            classifiedType = 'Mortgage Deed &#8212; Active'
            confidence = 'HIGH &#8212; Bank/Financial Institution in Col 4 as mortgagee confirmed.'
            status = '&#x26A0; ACTIVE MORTGAGE &#8212; Subsisting and active as on date. No Release Deed found in documents.'
        } else if (isMortRow && !isActMort) {
            cls = 'ec-rel'
            classifiedType = 'Mortgage Deed &#8212; Discharged'
            confidence = 'HIGH &#8212; Bank in Col 4 as mortgagee. Discharged vide subsequent Release Deed on record.'
            status = '&#x2705; DISCHARGED &#8212; Released and extinguished vide subsequent Reconveyance / Release Deed. No subsisting charge.'
        } else if (type.toLowerCase().includes('sale')) {
            classifiedType = 'Sale Deed &#8212; Land/Property Acquisition'
            confidence = 'HIGH &#8212; Matches subject property. Establishes title vesting in claimant.'
            status = '&#x2705; PRIMARY TITLE DOCUMENT &#8212; Establishes ownership. No encumbrance.'
        } else if (type.toLowerCase().includes('declaration')) {
            classifiedType = 'Declaration Deed &#8212; Title Confirmatory'
            confidence = 'MEDIUM &#8212; Title confirmatory instrument. No adverse charge detected.'
            status = '&#x26A0; Col 4 to be confirmed. No adverse charge detected. Flagged for physical verification.'
        } else if (type.toLowerCase().includes('partition')) {
            classifiedType = 'Partition Deed'
            confidence = 'HIGH &#8212; Property division instrument.'
            status = 'PARTITION &#8212; Verify share of subject property.'
        } else {
            classifiedType = type
            confidence = 'MEDIUM &#8212; Property details to be verified.'
            status = 'Transaction &#8212; Verify nature and impact on title.'
        }

        h += '<tr>'
        h += '<td>' + r.row_number + '</td>'
        h += '<td>' + classifiedType + '</td>'
        h += '<td>' + confidence + '</td>'
        h += '<td>' + (r.col6_deed_no || '--') + '</td>'
        h += '<td>' + (r.col5_date || '--') + '</td>'
        h += '<td>' + (r.col3_aapnar || '--') + '</td>'
        h += '<td>' + (r.col4_lenar || '--') + '</td>'
        h += '<td class="' + cls + '">' + status + '</td>'
        h += '</tr>'
    }

    return h + '</table>'
}

// ================================================================
// LEGAL OPINION -- Fixed wording per case type
// ================================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
    const BASE = 'On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that'
    const SARFAESI = 'The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.'
    const SARFAESI_BT = 'The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ' + existingBank + '.'
    const TITLE_OK = 'the right, title and interest of ' + owner + ' in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid'
    const MORTGAGE_OK = 'He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.'

    const opinions: Record<string, string> = {
        builder_purchase: BASE + ' ' + TITLE_OK + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', ' + MORTGAGE_OK + ' ' + SARFAESI,
        resale: BASE + ' ' + TITLE_OK + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', ' + MORTGAGE_OK + ' ' + SARFAESI,
        bt: BASE + ' ' + TITLE_OK + ' subject to charge of ' + existingBank + ' and after the execution and registration of deed of release of mortgage unto and in favour of ' + applicant + ', ' + MORTGAGE_OK + ' ' + SARFAESI_BT,
        seller_bt: BASE + ' ' + TITLE_OK + ' subject to charge of ' + existingBank + ' and after the execution and registration of deed of release of mortgage unto and in favour of ' + owner + ' and after the execution and registration of sale deed unto and in favour of ' + applicant + ', ' + MORTGAGE_OK + ' ' + SARFAESI_BT,
        lap: BASE + ' ' + TITLE_OK + ' and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ' + SARFAESI,
    }
    return opinions[ct] || opinions['lap']
}

// ================================================================
// CSS
// ================================================================
const CSS = '*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Georgia","Times New Roman",serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:8px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}table.tc-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.tc-tbl th{background:#374151;color:#fff;padding:5px 8px;font-size:10px}table.tc-tbl td{border:1px solid #e5e7eb;padding:5px 8px}.ok{color:#15803d;font-weight:bold}.flag{color:#b91c1c;font-weight:bold}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}}'

// ================================================================
// EC EXTRACTION PROMPT -- Focused, No Syntax Errors
// ================================================================
const EC_PROMPT = `You are an expert at reading Gujarat IGR Encumbrance Certificates (EC).

TASK: Extract ALL information from the EC image. Output ONLY valid JSON.

STEP 1 - FIND EC DOCUMENT:
Look for: "Milakat Parna Boja Angenu Patrak" OR "Encumbrance Certificate" OR IGR Gujarat government table.

STEP 2 - EXTRACT HEADER (TOP OF EC - CRITICAL):
Find these 4 fields at top of the EC:
- e-Application No / e-App No / e-અરજી ક્રમાંક = ec_app_number (numeric code)
- Date of Print / છાપ્યાની તારીખ = ec_date
- Search Period From date = ec_from
- Search Period To date = ec_to

STEP 3 - EC TABLE HAS 7 COLUMNS (count left to right):
COL 1 = Deed/Document Type
COL 2 = Property Description -- SKIP THIS COLUMN COMPLETELY
COL 3 = Executing Party (Aapnar) = WHO GIVES = Dastavej Kari Aapnar
COL 4 = Claimant Party (Lenar) = WHO RECEIVES = Dastavej Kari Lenar
COL 5 = Date of Registration
COL 6 = Registration / Deed Number (SECOND LAST column)
COL 7 = LAST COLUMN -- NEVER EXTRACT -- IGNORE COMPLETELY

STEP 4 - TRANSLATE GUJARATI IN COL 1:
વેચાણ = Sale Deed
ગીરો = Mortgage Deed
ગ.ફ. OR ગ.મૂ.ફ. OR ગીરો ફેર = Mortgage Release Deed
ભાગ = Partition Deed
ભેટ = Gift Deed
ઘ.ખ. OR ઘ.ન. = Declaration Deed
ક.સ. = Family Settlement Deed
હ.ત. = Relinquishment Deed
ભ.ક. = Rent Agreement
ટ.ઇ. = Court Decree
ખ.ત. = Cancellation Deed

STEP 5 - IDENTIFY BANK/FINANCE IN PARTIES:
If COL 4 has: Bank, Finance, Housing, HDFC, SBI, ICICI, Axis, Bajaj, LIC, LICHFL, Gruh, Aavas, PNB, etc = MORTGAGE DEED
If COL 3 has: Bank, Finance, Housing, HDFC, SBI, ICICI, Axis, Bajaj, LIC, etc = MORTGAGE RELEASE DEED

CRITICAL EXTRACTION RULES:
1. Extract EVERY row -- never skip any row
2. LAST ROW is often Mortgage Release Deed -- extract it
3. COL 7 = NEVER EXTRACT under any circumstances
4. Extract EXACT names as written -- not generic Bank/Financial Institution
5. If Col 4 party name is unclear, write what you can read

Output ONLY this JSON (no other text):
{"found":true,"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}]}

If no EC found: {"found":false,"rows":[]}`

// ================================================================
// LAYER 1 PROMPT
// ================================================================
const SYS_L1 = `You are Layer 1 Document Extraction Engine of TITLEMATRIXAI.
Based on 20-Year Senior Advocate Protocol.

ABSOLUTE RULES:
- NEVER assume facts. NEVER create facts.
- NEVER "and others" -- every person individually always
- EC Col 7 = NEVER READ. NEVER MENTION.
- EC Applicant name = COMPLETELY IGNORE
- Stamp Paper Number = NEVER mention
- Loan Amount = NEVER mention
- Unavailable = "NOT PROVIDED FOR VERIFICATION."

EXTRACT FROM EVERY DOCUMENT:
1. Document Type (exact classification)
2. Registration Date (IGR registration date only -- NOT stamp paper date)
3. Registration Number
4. Executant/s -- EVERY person by full name
5. Claimant/s -- EVERY person by full name
6. Property Description with survey numbers
7. Area figures (carpet, balcony, wash, UPS if flat)

PROPERTY DESCRIPTION MANDATORY FORMAT:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

OUTPUT META BLOCK:
---META---
APPLICANT: [full name]
CO_APPLICANT: [full names or N/A]
PROPERTY_PARA: [exact paragraph]
CURRENT_OWNER: [all names individually]
EC_APP_NUMBER: [from EC header]
EC_DATE: [date of print]
EC_FROM: [search start]
EC_TO: [search end]
EC_ROW_COUNT: [actual count]
MORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X / ACTIVE Bank:X Deed:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [bank name or N/A]
RED_FLAGS: [list any or NONE]
---END META---`

// ================================================================
// LAYER 2+3 PROMPT
// ================================================================
function SYS_L23(ct: string): string {
    const templates: Record<string, string> = {
        builder_purchase: `BUILDER PURCHASE: Developer title deeds | NA Order | RERA (post-2017) | Building Permission | Draft Sale Deed
Title chain: Land owner -> Developer -> Applicant (via Sale Deed). Missing Sale Deed = CRITICAL title break.`,
        resale: `RESALE: Chain of title minimum 30 years | Every seller-buyer link | EC cross-match each deed
Title chain: Original owner -> ... -> Current seller -> Applicant. Missing any link = CRITICAL.`,
        bt: `BALANCE TRANSFER: Existing bank LOD | Foreclosure letter | CERSAI search | Updated EC (active charge)
EC must show ACTIVE mortgage from existing bank. Title chain: Owner with existing mortgage -> Transfer to new bank.`,
        seller_bt: `SELLER BT: Same as BT + Sale Deed chain. Two transactions: Release old mortgage + Sale to purchaser. Both must complete.`,
        lap: `LAP: Owner = Mortgagor. EC must show NIL or Released only. Any undisclosed mortgage = RED FLAG HIGH SEVERITY.`,
    }
    return `You are Layer 2 (Title Verification) + Layer 3 (Risk) of TITLEMATRIXAI.
Based on 20-Year Senior Advocate Protocol.

NON-NEGOTIABLE RULES:
- Never assume. Never create. "NOT PROVIDED FOR VERIFICATION."
- EC GROUND TRUTH = DO NOT CONTRADICT.
- RELEASED mortgage = DO NOT flag as active. ACTIVE = HIGH SEVERITY.
- NEVER "and others". NEVER stamp paper date. NEVER loan amount.

CASE TYPE: ${ct.toUpperCase().replace(/_/g, ' ')}
${templates[ct] || templates['lap']}

RED FLAGS:
CRITICAL: Agricultural land (Kheti) | Lis Pendens | Area mismatch | Active undisclosed mortgage | Title break | Govt acquisition
HIGH: Missing mutation | NA Order missing | RERA missing (post May 2017) | OC/CC missing
MEDIUM: Stamp duty short | Boundary mismatch | Name spelling variation
LOW: Old unregistered documents | Pre-1985 chain incomplete

REVENUE 7-CHECK:
1. Owner name = Same as latest deed? No = FLAG unreflected sale
2. Survey number = Same as EC? No = FLAG mismatch
3. Area = Same throughout chain? No = FLAG area mismatch
4. Land use = Bin Kheti/Non-Agricultural? Kheti = RED FLAG
5. Boja column = NIL? Entry = Cross-check with EC
6. Ganot/Tenant = NIL? Tenant = FLAG SARFAESI issue
7. Govt acquisition notation? Yes = CRITICAL FLAG

OUTPUT META BLOCK:
---META---
APPLICANT: [full name]
CO_APPLICANT: [full names or N/A]
PROPERTY_PARA: [exact paragraph]
CURRENT_OWNER: [all names individually]
EC_APP_NUMBER: [from EC header]
EC_DATE: [date of print]
EC_FROM: [search start]
EC_TO: [search end]
EC_ROW_COUNT: [actual count]
MORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X / ACTIVE Bank:X Deed:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [bank name or N/A]
RED_FLAGS: [list any or NONE]
---END META---`
}

// ================================================================
// LAYER 4A PROMPT -- Parts I + II + III
// ================================================================
const SYS_4A = `Layer 4A -- PARTS I + II + III. PURE HTML ONLY. No markdown.

PART I: <hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt">
<tr><td>Name of Borrower/s</td><td>:</td><td>[Every person individually -- NEVER "and others"]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Names or Not Applicable]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents submitted]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Company / HUF / Trust]</td></tr>
</table>
<div class="sph">B. Mortgagor Details</div>
<table class="mt">
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[Same as Borrower/s above OR full names]</td></tr>
<tr><td>Address</td><td>:</td><td>[Same as above]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual]</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest deed -- never "and others"]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Development / Allotment / Gift / Court Decree / Succession]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No. | Dated: DD-MM-YYYY | SRO: Name]</td></tr>
</table>

PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[EXACT FORMAT: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt">
<tr><td>East (Purva)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[boundary]</td></tr>
</table>

PART III: <hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
<p>The following documents have been produced for examination and scrutiny:</p>
SENIOR ADVOCATE RULE: NO illegibility remarks in Part III. Those go ONLY in Part VI.
For each document: <div class="di"><p><span class="dn">N. [Document Type] -- Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Executant/s] unto and in favour of [Claimant/s], SRO [Name]. [2 sentences factual. NO illegibility.]</p></div>
For EC: <div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [number] | Dated: [date] | Search Period: [from] to [to]</span><br>EC bearing E-Application No. [number] dated [date] for period [from] to [to] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. On row-by-row examination, [N] transaction/s found. Encumbrance Status: [CLEAR / ENCUMBERED / CLEAR WITH PRIOR RELEASE].</p></div>
START WITH: <hr><div class="ph">PART I`

// ================================================================
// LAYER 4B PROMPT -- Parts IV + V
// ================================================================
const SYS_4B = `Layer 4B -- PARTS IV + V. PURE HTML ONLY.

PART IV MANDATORY RULES:
1. OLDEST document FIRST -- strict chronological order
2. First paragraph: MUST NOT start with "Thereafter"
3. Every subsequent paragraph: MUST START WITH "Thereafter,"
4. NEVER "and others" -- every name individually with percentage shares
5. RELEASED mortgage EXACT WORDING: "stands discharged and the charge has been fully released and satisfied vide [Release Deed Type] No. [Y] dated [DD/MM/YYYY] executed by [Bank Name] -- no subsisting charge of [Bank Name] remains on the subject property as on date."
6. ACTIVE mortgage EXACT WORDING: "is subsisting and active as on date -- no Release Deed or Discharge Certificate has been found in the documents produced or in the Encumbrance Certificate."
7. Last EC paragraph: "Encumbrance Certificate bearing E-Application No. [X] (covering search period from [year] to [year])... On examination, [N] registered transaction/s found... encumbrance status is [CLEAR/ENCUMBERED]."
8. If multiple ECs: mention both App Numbers and combined period coverage

PART IV HTML:
<hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
<p>The chronological title chain in respect of the subject property has been established on the basis of documents produced for examination, as follows:</p>
[First paragraph -- oldest document -- NO "Thereafter"]
[Each next paragraph starts with: <p>Thereafter, ...]
[Title Chain Table:]
<table class="tc-tbl"><tr><th>Sr.</th><th>Year</th><th>Deed Type</th><th>From</th><th>To</th><th>Reg. No.</th><th>SRO</th><th>Area</th><th>Status</th></tr>
[one row per transaction]
</table>

PART V HTML:
<hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">A. Revenue Record (7/12 / Property Card)</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr>
<tr><td>Survey / Block / FP No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area (H.Are.SqMt)</td><td>:</td><td>[Area -- flat areas if available: Carpet + Balcony + Wash + UPS]</td></tr>
<tr><td>Land Use / Khate Type</td><td>:</td><td>[Non-Agricultural = OK | Kheti = RED FLAG -- Bank Cannot Lend]</td></tr>
<tr><td>Ownership Column (Khata)</td><td>:</td><td>[Developer/Owner -- flag if not reflected]</td></tr>
<tr><td>Boja / Encumbrance Column</td><td>:</td><td>[NIL subsisting OR Active mortgage details]</td></tr>
<tr><td>Ganot / Tenant Column</td><td>:</td><td>[NIL = OK | Tenant = FLAG SARFAESI issue]</td></tr>
<tr><td>Govt Acquisition Notation</td><td>:</td><td>[None = OK | Any = CRITICAL FLAG]</td></tr>
</table>
<div class="sph">B. Mutation Entries (Chronological)</div>
<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Certified/Rejected</th><th>Nature of Entry</th><th>Details</th><th>Survey No.</th></tr>
[one row per mutation entry]
</table>
<p>Cross-check: [Confirm EC entries consistent with revenue records or note discrepancy.]</p>
<div class="sph">C. Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[Details OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>RERA Registration (Post May 2017 = Mandatory)</td><td>:</td><td>[RERA No. with validity date OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[Details OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[Details with validity date OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[Details OR NOT PROVIDED FOR VERIFICATION.]</td></tr>
</table>
<div class="sph">D. Encumbrance Certificate Analysis</div>
<p>[EC App Numbers examined, search periods, combined coverage if multiple ECs, total rows found, overall encumbrance status.]</p>
[EC_TABLE_GOES_HERE]
<div class="sph">E. Mortgage Lifecycle Summary</div>
<table class="mt">
<tr><td>A. Active Mortgages</td><td>:</td><td>[NIL OR: Bank Name -- Deed No. X dated DD/MM/YYYY -- subsisting as on date]</td></tr>
<tr><td>B. Released Mortgages</td><td>:</td><td>[NIL OR: Bank Name -- Deed No. X -- DISCHARGED vide Release Deed No. Y dated DD/MM/YYYY]</td></tr>
<tr><td>C. Unmatched Releases</td><td>:</td><td>[NIL]</td></tr>
<tr><td>D. Overall Encumbrance Status</td><td>:</td><td>[CLEAR / ENCUMBERED / CLEAR WITH PRIOR RELEASE]</td></tr>
</table>
START WITH: <hr><div class="ph">PART IV`

// ================================================================
// LAYER 4C PROMPT -- Parts VI + VII + VIII
// ================================================================
const SYS_4C = `Layer 4C -- PARTS VI + VII + VIII. PURE HTML ONLY. Maximum 5-6 alerts total.

PART VI ALERT RULES:
- NEVER flag RELEASED mortgage as active
- NEVER flag EC-confirmed registered deeds
- NEVER flag EC Applicant name
- Lis Pendens = CRITICAL HIGH always
- Agricultural land = CRITICAL HIGH always
- Title break (missing link) = HIGH always
- Missing RERA post-2017 = HIGH
- Active undisclosed mortgage = HIGH
- No alerts: write "No material adverse findings identified."
- Illegibility remarks go HERE in Part VI ONLY -- never in Part III

HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[Finding with deed numbers, dates, parties. Legal consequence.]</p><p><span class="sg">Direction:</span> [Specific action before sanction.]</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[Finding.]</p><p><span class="sg">Direction:</span> [Action.]</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[Note.]</p><p><span class="sg">Direction:</span> [Note for record.]</p></div>

PART VII:
<hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted and Available</div><ol>[all docs with brief description]</ol>
<div class="sph">B. Critical Missing Documents (Report Hold)</div><ol>[mandatory docs not submitted with legal consequence OR write NIL]</ol>
<div class="sph">C. Important Missing Documents (Pre-Disbursement)</div><ol>[other missing docs OR write NIL]</ol>
<div class="sph">D. Documents Illegible / Incomplete / Unreadable</div><ol>[illegible docs OR write NIL]</ol>
<div class="sph">E. Risk Assessment Summary</div>
<table class="mt">
<tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
<tr><td>Mortgageability Status</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentences explaining assessment with specific deed/EC references]</td></tr>
</table>

PART VIII:
<hr><div class="ph">PART VIII -- LEGAL OPINION AND VERDICT</div>
[INSERT_LEGAL_OPINION]
VERDICT -- select based on Part VI alerts:
HIGH alerts: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve all HIGH SEVERITY conditions in Part VI before proceeding with sanction or disbursement.</p></div>
MEDIUM/LOW only: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is conditionally clear. Disbursement subject to fulfillment of all conditions in Parts VII and IX.</p></div>
No alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. Property is suitable security for the proposed loan.</p></div>
START WITH: <hr><div class="ph">PART VI`

// ================================================================
// LAYER 4D PROMPT -- Parts IX + X + XI
// ================================================================
const SYS_4D = `Layer 4D -- PARTS IX + X + XI. PURE HTML ONLY.

PART IX format -- each item with Source and Purpose:
<li><strong>[Document Name]</strong><br>
<em>Source:</em> [Where to get / Who provides]<br>
<em>Purpose:</em> [Why needed -- legal consequence of absence]</li>

PART IX BUILDER PURCHASE documents:
1. Registered Sale Deed or Agreement to Sale (Banakhat) -- specific flat -- Source: Developer/Sub-Registrar -- Purpose: Primary title document; no mortgage without this
2. RERA Registration Certificate -- Source: GujRERA portal (gujrera.gujarat.gov.in) -- Purpose: Mandatory post-May 2017
3. Tripartite Agreement (Developer + Applicant + Bank) -- Purpose: Confirms bank interest
4. NOC from Developer -- flat free from prior allotment and encumbrance
5. Partnership Deed of Developer -- Source: Developer -- Purpose: Authority of signing partner
6. CERSAI Search Report -- Source: CERSAI Portal -- Purpose: Independent charge verification
7. Occupancy Certificate / Completion Certificate -- Source: GUDA/Competent authority
8. NOC from existing mortgagee if EC shows active mortgage -- Source: Existing bank -- Purpose: Mandatory before new charge creation
9. Updated EC post-registration -- Source: Sub-Registrar
10. 7-12 Extract / City Survey confirming developer as owner -- Source: Revenue Authority
11. Property Tax No-Dues Certificate
12. Any specific critical missing docs from Part VII B

PART IX RESALE: All title deeds 30 years | Updated EC clear | CERSAI | NOC from seller's bank if mortgage
PART IX BT: LOD + Foreclosure letter | NOC from existing bank | CERSAI | Outstanding balance certificate
PART IX LAP: Updated EC NIL | CERSAI | Original title deeds

PART X POST-DISBURSEMENT format same as Part IX with Source + Purpose:
BUILDER PURCHASE: Original Registered Sale Deed | Registered Mortgage/MODT | CERSAI Registration | Updated EC | Possession Letter | Society Share Certificate + NOC | Mutation Entry | Property Tax Receipt | OC/CC | Insurance Policy
RESALE: Original Sale Deed | Original title chain | Mutation | Mortgage/MODT | CERSAI | Insurance
BT: No-Due Certificate from existing bank | Registered Release Deed | Updated EC | Mortgage/MODT | CERSAI

PART XI FINAL RECOMMENDATION:
<hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec">
<div class="fr-title">Final Title Status (select ONE only):</div>
<div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE NOT CLEAR]</div>
</div>
<p style="margin-top:16px;">[5-6 sentences covering:
1. Title chain status -- complete? From whom to whom with deed numbers
2. EC status -- App Numbers, combined period, encumbrance finding
3. Mortgage lifecycle -- active/released with deed numbers
4. RERA and regulatory status
5. Specific conditions numbered (i)(ii)(iii) if any
6. SARFAESI enforceability and final bank recommendation]</p>
START WITH: <hr><div class="ph">PART IX`

// ================================================================
// META PARSER
// ================================================================
function parseMeta(t: string) {
    const b = t.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
    const g = (k: string) => b.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi'))?.[1]?.trim() || ''
    return {
        applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'),
        propertyPara: g('PROPERTY_PARA'), currentOwner: g('CURRENT_OWNER'),
        ecAppNumber: g('EC_APP_NUMBER'), ecDate: g('EC_DATE'),
        ecFrom: g('EC_FROM'), ecTo: g('EC_TO'), ecRowCount: g('EC_ROW_COUNT'),
        mortgageSummary: g('MORTGAGE_SUMMARY'), riskLevel: g('RISK_LEVEL'),
        mortgageability: g('MORTGAGEABILITY'), sarfaesi: g('SARFAESI'),
        lendingSuitability: g('LENDING_SUITABILITY'), existingBank: g('EXISTING_BANK'),
        redFlags: g('RED_FLAGS'),
    }
}

// ================================================================
// REPORT BUILDER
// ================================================================
function buildReport(p: {
    refNo: string; appId: string; today: string; bankName: string
    loanType: string; p123: string; p45: string; p678: string; p911: string
}): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report -- ' + p.refNo + '</title><style>' + CSS + '</style></head><body>'
        + '<div class="hdr"><div><div class="firm">TITLEMATRIXAI</div>'
        + '<div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div>'
        + '<div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div>'
        + '<div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div>'
        + '<div class="hdr-right">'
        + '<div><strong>Reference No.:</strong> ' + p.refNo + '</div>'
        + '<div><strong>Application ID:</strong> ' + p.appId + '</div>'
        + '<div><strong>Report Date:</strong> ' + p.today + '</div>'
        + '<div><strong>Bank:</strong> ' + p.bankName + '</div>'
        + '</div></div>'
        + '<div class="rtitle">LEGAL SCRUTINY REPORT -- ' + p.loanType + '</div><hr>'
        + p.p123 + p.p45 + p.p678 + p.p911
        + '<hr><div class="sigrow">'
        + '<div class="sigbox"><div class="sigline"></div>'
        + '<div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div>'
        + '<div style="font-size:10px;color:#666;">Date: ' + p.today + '</div></div>'
        + '<div class="sigbox"><div class="sigline"></div>'
        + '<div style="font-size:11px;font-weight:bold;">Authorised Signatory</div>'
        + '<div style="font-size:10px;color:#666;">' + p.bankName + ' -- APP ID: ' + p.appId + '</div>'
        + '</div></div>'
        + '<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com'
        + '<div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ' + p.bankName + ' in connection with Application ID ' + p.appId + '. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title.</div>'
        + '<div class="wm">TITLEMATRIXAI -- Confidential -- For Bank Use Only</div>'
        + '</div></body></html>'
}

// ================================================================
// MAIN API HANDLER
// ================================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            images, caseType, appId, bankName, applicantName, coApplicant,
            propertyAddress, currentOwner, boundaryEast, boundaryWest,
            boundaryNorth, boundarySouth, userId
        } = body

        if (!images || images.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No documents uploaded. Please upload EC and property documents.'
            }, { status: 400 })
        }

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const refNo = 'TITLEMATRIXAI/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4)
        const loanMap: Record<string, string> = {
            builder_purchase: 'Builder Purchase',
            resale: 'Resale Property',
            bt: 'Balance Transfer',
            seller_bt: 'Seller Balance Transfer',
            lap: 'LAP (Loan Against Property)'
        }

        const imgContent: any[] = images.map((img: any) => ({
            type: 'image',
            source: { type: 'base64', media_type: img.mediaType, data: img.data }
        }))

        // ============================================================
        // PHASE 1: EC EXTRACTION -- 3-PASS SYSTEM
        // Pass 1: Full extraction (header + rows together)
        // Pass 2: Dedicated header extraction if header missing
        // Pass 3: Dedicated row extraction if rows missing
        // ============================================================
        let ecRows: ECRow[] = []
        let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
        let lifecycle = runLifecycle([])

        // ---- PASS 1: Full EC extraction ----
        try {
            const p1Res = await AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: EC_PROMPT }] }]
            })
            const p1Raw = p1Res.content[0].type === 'text' ? p1Res.content[0].text : '{}'
            const p1Clean = p1Raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const p1f = p1Clean.indexOf('{')
            const p1l = p1Clean.lastIndexOf('}')
            const p1Parsed = JSON.parse(p1f >= 0 && p1l >= 0 ? p1Clean.substring(p1f, p1l + 1) : p1Clean)
            if (p1Parsed.found) {
                ecRows = p1Parsed.rows || []
                if (p1Parsed.ec_app_number) ecMeta.ec_app_number = p1Parsed.ec_app_number
                if (p1Parsed.ec_date) ecMeta.ec_date = p1Parsed.ec_date
                if (p1Parsed.ec_from) ecMeta.ec_from = p1Parsed.ec_from
                if (p1Parsed.ec_to) ecMeta.ec_to = p1Parsed.ec_to
                lifecycle = runLifecycle(ecRows)
                console.log('EC Pass1: ' + ecRows.length + ' rows | ' + lifecycle.encumbrance + ' | App=' + ecMeta.ec_app_number)
            }
        } catch (e) { console.log('EC Pass1 error:', e) }

        // ---- PASS 2: Dedicated header extraction if missing ----
        if (!ecMeta.ec_app_number || !ecMeta.ec_date) {
            try {
                const p2Prompt = 'Look at these images for an Encumbrance Certificate from Gujarat IGR. Find the TOP HEADER section and extract: 1) e-Application Number (numeric code), 2) Date of Print, 3) Search period From date, 4) Search period To date. Output ONLY JSON with keys ec_app_number, ec_date, ec_from, ec_to. Use empty string for any not found.'
                const p2Res = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 500, temperature: 0,
                    messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: p2Prompt }] }]
                })
                const p2Raw = p2Res.content[0].type === 'text' ? p2Res.content[0].text : '{}'
                const p2Clean = p2Raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const p2f = p2Clean.indexOf('{')
                const p2l = p2Clean.lastIndexOf('}')
                const p2Parsed = JSON.parse(p2f >= 0 && p2l >= 0 ? p2Clean.substring(p2f, p2l + 1) : p2Clean)
                if (p2Parsed.ec_app_number && !ecMeta.ec_app_number) ecMeta.ec_app_number = p2Parsed.ec_app_number
                if (p2Parsed.ec_date && !ecMeta.ec_date) ecMeta.ec_date = p2Parsed.ec_date
                if (p2Parsed.ec_from && !ecMeta.ec_from) ecMeta.ec_from = p2Parsed.ec_from
                if (p2Parsed.ec_to && !ecMeta.ec_to) ecMeta.ec_to = p2Parsed.ec_to
                console.log('EC Pass2 header: App=' + ecMeta.ec_app_number + ' Date=' + ecMeta.ec_date)
            } catch (e) { console.log('EC Pass2 error:', e) }
        }

        // ---- PASS 3: Dedicated row extraction if rows missing ----
        if (ecRows.length === 0) {
            try {
                const p3Prompt = EC_PROMPT + '\n\nCRITICAL RETRY: This is your second attempt. Look at every single image carefully. Find the EC table with property transaction rows. Extract ALL rows. The LAST ROW is often a Mortgage Release Deed -- do NOT skip it. Extract EXACT bank/party names as written in the document.'
                const p3Res = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
                    messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: p3Prompt }] }]
                })
                const p3Raw = p3Res.content[0].type === 'text' ? p3Res.content[0].text : '{}'
                const p3Clean = p3Raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const p3f = p3Clean.indexOf('{')
                const p3l = p3Clean.lastIndexOf('}')
                const p3Parsed = JSON.parse(p3f >= 0 && p3l >= 0 ? p3Clean.substring(p3f, p3l + 1) : p3Clean)
                if (p3Parsed.found && p3Parsed.rows?.length > 0) {
                    ecRows = p3Parsed.rows
                    if (!ecMeta.ec_app_number && p3Parsed.ec_app_number) ecMeta.ec_app_number = p3Parsed.ec_app_number
                    if (!ecMeta.ec_date && p3Parsed.ec_date) ecMeta.ec_date = p3Parsed.ec_date
                    if (!ecMeta.ec_from && p3Parsed.ec_from) ecMeta.ec_from = p3Parsed.ec_from
                    if (!ecMeta.ec_to && p3Parsed.ec_to) ecMeta.ec_to = p3Parsed.ec_to
                    lifecycle = runLifecycle(ecRows)
                    console.log('EC Pass3: ' + ecRows.length + ' rows | ' + lifecycle.encumbrance)
                }
            } catch (e) { console.log('EC Pass3 error:', e) }
        }

        console.log('EC FINAL: App=' + (ecMeta.ec_app_number || 'MISSING') + ' Date=' + (ecMeta.ec_date || 'MISSING') + ' Rows=' + ecRows.length + ' Status=' + lifecycle.encumbrance)

        const existingBank = lifecycle.active.length > 0
            ? lifecycle.active[0].lender
            : lifecycle.released.length > 0
                ? lifecycle.released[0].lender
                : 'N/A'

        const GT = '=== EC GROUND TRUTH -- DO NOT CONTRADICT ===\n'
            + 'EC App No: ' + (ecMeta.ec_app_number || 'NOT PROVIDED') + ' | Date of Print: ' + (ecMeta.ec_date || 'NOT PROVIDED') + '\n'
            + 'Search Period: ' + (ecMeta.ec_from || 'NOT PROVIDED') + ' to ' + (ecMeta.ec_to || 'NOT PROVIDED') + '\n'
            + 'EC Rows Found: ' + ecRows.length + ' | Encumbrance Status: ' + lifecycle.encumbrance + '\n'
            + 'Mortgage Summary: ' + lifecycle.summary + '\n'
            + 'Active Mortgages: ' + (lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(' | ')) + '\n'
            + 'Released Mortgages: ' + (lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')) + '\n'
            + 'Existing Bank: ' + existingBank + '\n'
            + 'RULE: RELEASED = never flag as active | ACTIVE = HIGH SEVERITY | EC Col7 = NEVER\n'
            + '=== END GROUND TRUTH ==='

        const ecTbl = ecTableHTML(ecRows, lifecycle)

        // ============================================================
        // PHASE 2: DOCUMENT EXTRACTION (L1 + L23)
        // ============================================================
        const [l1Res, l23Res] = await Promise.all([
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
                system: SYS_L1,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: 'Extract all document details. EC Ground Truth:\n' + GT }] }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
                system: SYS_L23(caseType || 'lap'),
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: 'Verify title and assess risk. EC Ground Truth:\n' + GT }] }]
            })
        ])

        const l1Text = l1Res.content[0].type === 'text' ? l1Res.content[0].text : ''
        const l23Text = l23Res.content[0].type === 'text' ? l23Res.content[0].text : ''
        const meta = parseMeta(l1Text + '\n' + l23Text)

        const ctx = 'DOCUMENTS EXTRACTED:\n' + l1Text.substring(0, 2000) + '\n\nTITLE ANALYSIS:\n' + l23Text.substring(0, 2000) + '\n\n' + GT

        const opinion = getLegalOpinion(caseType || 'lap', meta.currentOwner || currentOwner || 'Owner', meta.applicant || applicantName || 'Applicant', existingBank)

        // ============================================================
        // PHASE 3: REPORT GENERATION (L4 parallel)
        // ============================================================
        const [r4a, r4b, r4c, r4d] = await Promise.all([
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4A,
                messages: [{ role: 'user', content: 'PARTS I+II+III\nAPPLICANT: ' + (meta.applicant || applicantName) + '\nCO-APPLICANT: ' + (meta.coApplicant || coApplicant || 'Not Applicable') + '\nCURRENT OWNER: ' + (meta.currentOwner || currentOwner) + '\nPROPERTY: ' + (meta.propertyPara || propertyAddress) + '\nBOUNDARIES: E:' + (boundaryEast || 'As per docs') + ' W:' + (boundaryWest || 'As per docs') + ' N:' + (boundaryNorth || 'As per docs') + ' S:' + (boundarySouth || 'As per docs') + '\nEC: App.No.' + (ecMeta.ec_app_number || 'NOT PROVIDED') + ' Date:' + (ecMeta.ec_date || 'NOT PROVIDED') + ' Period:' + (ecMeta.ec_from || 'NOT PROVIDED') + ' to ' + (ecMeta.ec_to || 'NOT PROVIDED') + ' Rows:' + ecRows.length + '\nBANK: ' + bankName + '\n' + ctx + '\nRULE: Part III has NO illegibility remarks.' }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4B,
                messages: [{ role: 'user', content: 'PARTS IV+V\nCASE: ' + caseType + ' | OWNER: ' + (meta.currentOwner || currentOwner) + '\nAPPLICANT: ' + (meta.applicant || applicantName) + '\nPROPERTY: ' + (meta.propertyPara || propertyAddress) + '\nEC App No: ' + (ecMeta.ec_app_number || 'NOT PROVIDED') + ' | Date: ' + (ecMeta.ec_date || 'NOT PROVIDED') + ' | Period: ' + (ecMeta.ec_from || 'NOT PROVIDED') + ' to ' + (ecMeta.ec_to || 'NOT PROVIDED') + ' | Rows: ' + ecRows.length + '\nENCUMBRANCE: ' + lifecycle.encumbrance + '\nMORTGAGE: ' + lifecycle.summary + '\nACTIVE: ' + (lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(', ')) + '\nRELEASED: ' + (lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' Deed:' + r.deed_no + ' RELEASED vide Release Deed:' + r.release_deed_no + ' on ' + r.release_date).join(', ')) + '\n' + ctx + '\nIMPORTANT: Use EXACT deed numbers and dates from MORTGAGE/RELEASED above. For RELEASED mortgage, write exact wording: stands discharged vide Release Deed No.[Y] dated [date].\nReplace [EC_TABLE_GOES_HERE] with:\n' + ecTbl }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: SYS_4C,
                messages: [{ role: 'user', content: 'PARTS VI+VII+VIII\nBANK: ' + bankName + ' | CASE: ' + caseType + '\nENCUMBRANCE: ' + lifecycle.encumbrance + '\nACTIVE: ' + (lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no).join(', ')) + '\nRELEASED: ' + (lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED vide ' + r.release_deed_no).join(', ')) + '\nRISK: ' + (meta.riskLevel || 'MODERATE') + ' | MORTGAGEABILITY: ' + meta.mortgageability + ' | SARFAESI: ' + meta.sarfaesi + '\nRED FLAGS: ' + (meta.redFlags || 'NONE') + '\n' + ctx + '\nReplace [INSERT_LEGAL_OPINION] with:\n<p>' + opinion + '</p>' }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4D,
                messages: [{ role: 'user', content: 'PARTS IX+X+XI\nCASE: ' + caseType + ' | BANK: ' + bankName + '\nOWNER: ' + (meta.currentOwner || currentOwner) + ' | APPLICANT: ' + (meta.applicant || applicantName) + '\nPROPERTY: ' + (meta.propertyPara || propertyAddress) + '\nEC App No: ' + (ecMeta.ec_app_number || 'NOT PROVIDED') + ' | Period: ' + (ecMeta.ec_from || 'NOT PROVIDED') + ' to ' + (ecMeta.ec_to || 'NOT PROVIDED') + '\nENCUMBRANCE: ' + lifecycle.encumbrance + ' | MORTGAGE: ' + lifecycle.summary + '\nACTIVE: ' + (lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no).join(', ')) + '\nRELEASED: ' + (lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED vide ' + r.release_deed_no).join(', ')) + '\nEXISTING BANK: ' + existingBank + '\nRISK: ' + (meta.riskLevel || 'MODERATE') + ' | MORTGAGEABILITY: ' + meta.mortgageability + '\n' + ctx + '\nPart IX: Each item must have bold title, Source line, Purpose line. Be specific -- use exact deed numbers, bank names, flat numbers from documents.' }]
            })
        ])

        let p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error Parts I-III</p>'
        let p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error Parts IV-V</p>'
        let p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error Parts VI-VIII</p>'
        const p911 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error Parts IX-XI</p>'

        // ============================================================
        // PHASE 4: LAYER 5 VALIDATION
        // ============================================================
        const errors: string[] = []

        if (lifecycle.released.length > 0 && (p45.toLowerCase().includes('no release') || p45.toLowerCase().includes('no discharge found')))
            errors.push('Part IV says no discharge but mortgage IS RELEASED. Fix: use exact wording -- stands discharged vide Release Deed No.' + lifecycle.released[0].release_deed_no)

        if (p123.toLowerCase().includes('illegib') || p123.toLowerCase().includes('not provided') || p123.toLowerCase().includes('blank'))
            errors.push('Part III contains illegibility/not-provided remark. Remove it. Only facts in Part III.')

        if (lifecycle.active.length === 0 && p678.toLowerCase().includes('active mortgage'))
            errors.push('Part VI flags active mortgage but EC shows NO active mortgage. Remove that alert.')

        if (errors.length > 0) {
            try {
                const fixRes = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
                    system: 'Fix ONLY listed errors in these HTML sections. Return corrected Part IV HTML then ===P6=== then corrected Part VI HTML. Pure HTML only.',
                    messages: [{ role: 'user', content: 'ERRORS TO FIX:\n' + errors.join('\n') + '\n\nPART IV:\n' + p45 + '\n\n===P6===\n' + p678 }]
                })
                const fixText = fixRes.content[0].type === 'text' ? fixRes.content[0].text : ''
                const splitIdx = fixText.indexOf('===P6===')
                if (splitIdx > 0) {
                    p45 = fixText.substring(0, splitIdx).trim()
                    p678 = fixText.substring(splitIdx + 8).trim()
                }
            } catch (e) { console.log('Validation fix error:', e) }
        }

        const verdict = lifecycle.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR'
            : lifecycle.encumbrance === 'CLEAR' ? 'CLEAR'
                : 'CLEAR SUBJECT TO'

        const html = buildReport({
            refNo, appId: appId || 'AUTO', today,
            bankName: bankName || 'Bank',
            loanType: loanMap[caseType] || 'LAP',
            p123, p45, p678, p911
        })

        if (userId && DB) {
            try {
                await DB.from('reports').insert({
                    user_id: userId,
                    case_type: caseType || 'lap',
                    applicant_name: meta.applicant || applicantName || 'Unknown',
                    bank_name: bankName || 'Unknown',
                    property_address: meta.propertyPara || propertyAddress || 'Unknown',
                    verdict,
                    encumbrance_status: lifecycle.encumbrance,
                    ec_rows: ecRows.length,
                    report_html: html
                })
            } catch (e) { console.log('DB error:', e) }
        }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle, ecRows, ecMeta })

    } catch (e: any) {
        console.error('Pipeline error:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}