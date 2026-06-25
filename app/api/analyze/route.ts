// ================================================================
// TITLEMATRIXAI -- /api/analyze/route.ts FINAL v2
// EC Gujarati Fix | images (not imageFiles) | Mortgage Lifecycle
// temperature=0 | maxDuration=300 | claude-sonnet-4-6
// ================================================================
export const maxDuration = 300
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const AI = new Anthropic()
const DB = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null

// ================================================================
// BANK DETECTION
// ================================================================
const BANK_KEYWORDS = [
    'BANK', 'FINANCE', 'HOUSING FINANCE', 'FINANCIAL SERVICES', 'NBFC',
    'CAPITAL', 'FINCORP', 'BAJAJ', 'HDFC', 'SBI', 'AXIS', 'ICICI', 'KOTAK',
    'PNB', 'BOI', 'CANARA', 'UNION BANK', 'INDIABULLS', 'LIC', 'LICHFL',
    'REPCO', 'PIRAMAL', 'MUTHOOT', 'TATA CAPITAL', 'ADITYA BIRLA',
    'FULLERTON', 'AAVAS', 'HOME FIRST', 'APTUS', 'SHRIRAM', 'GRUH',
    'MANAPPURAM', 'INDIA BULLS', 'HOME FINANCE', 'GOLD LOAN', 'CREDIT',
    'LENDING', 'FINSERV', 'CHOLAMANDALAM', 'CHOLA',
]
function isBank(n: string): boolean {
    if (!n) return false
    const u = n.toUpperCase()
    return BANK_KEYWORDS.some(b => u.includes(b))
}

// ================================================================
// MORTGAGE LIFECYCLE ENGINE
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
    lender: string; borrower: string; deed_no: string; date: string
    row: number; status: 'ACTIVE' | 'RELEASED'
    release_deed_no?: string; release_date?: string
}
function runLifecycle(rows: ECRow[]) {
    const charges: Charge[] = []
    for (const r of rows) {
        if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) {
            charges.push({ lender: r.col4_lenar, borrower: r.col3_aapnar, deed_no: r.col6_deed_no, date: r.col5_date, row: r.row_number, status: 'ACTIVE' })
        }
    }
    for (const r of rows) {
        if (isBank(r.col3_aapnar)) {
            const words = r.col3_aapnar.toUpperCase().split(' ').filter((w: string) => w.length > 3)
            const match = charges.find(c => words.some((w: string) => c.lender.toUpperCase().includes(w)))
            if (match) { match.status = 'RELEASED'; match.release_deed_no = r.col6_deed_no; match.release_date = r.col5_date }
        }
    }
    const active = charges.filter(c => c.status === 'ACTIVE')
    const released = charges.filter(c => c.status === 'RELEASED')
    const encumbrance = active.length > 0 ? 'ENCUMBERED' : released.length > 0 ? 'CLEAR_WITH_PRIOR_RELEASE' : 'CLEAR'
    const summary = active.length === 0
        ? released.length > 0
            ? `CLEAR. Prior mortgage by ${released.map(r => r.lender).join(', ')} stands FULLY RELEASED AND SATISFIED vide Release Deed No. ${released.map(r => r.release_deed_no).join(', ')}.`
            : 'CLEAR. No mortgage or encumbrance found in EC.'
        : `ENCUMBERED. Active mortgage: ${active.map(a => `${a.lender} (Deed No. ${a.deed_no} dated ${a.date})`).join('; ')}. Outstanding charge exists as on date.`
    return { active, released, summary, encumbrance, charges }
}

// ================================================================
// EC TABLE HTML
// ================================================================
function ecTableHTML(rows: ECRow[], lc: ReturnType<typeof runLifecycle>): string {
    if (!rows.length) return '<p>No EC entries found in the documents produced for examination.</p>'
    let h = `<table class="ec-tbl"><tr><th>Sr.</th><th>Document Type</th><th>Deed No.</th><th>Date</th><th>Executing Party (Col 3)</th><th>Claimant Party (Col 4)</th><th>Status</th></tr>`
    for (const r of rows) {
        const isRelRow = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        const isMortRow = isBank(r.col4_lenar) && !isBank(r.col3_aapnar)
        const isActMort = lc.active.some((c: Charge) => c.row === r.row_number)
        let cls = '', status = 'Transaction', type = r.col1_type || 'Transaction'
        if (isRelRow) { cls = 'ec-rel'; status = 'DISCHARGED / RELEASED'; type = 'Mortgage Release Deed' }
        else if (isMortRow && isActMort) { cls = 'ec-act'; status = 'ACTIVE MORTGAGE' }
        else if (isMortRow && !isActMort) { cls = 'ec-rel'; status = 'MORTGAGE - RELEASED' }
        h += `<tr><td>${r.row_number}</td><td>${type}</td><td>${r.col6_deed_no || '--'}</td><td>${r.col5_date || '--'}</td><td>${r.col3_aapnar || '--'}</td><td>${r.col4_lenar || '--'}</td><td class="${cls}">${status}</td></tr>`
    }
    return h + '</table>'
}

// ================================================================
// LEGAL OPINION
// ================================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
    const s1 = `The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`
    const s2 = `The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`
    const base = `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that`
    const map: Record<string, string> = {
        builder_purchase: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant}, He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${s1}`,
        resale: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant}, He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${s1}`,
        bt: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${applicant}, He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${s2}`,
        seller_bt: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${owner} and after the execution and registration of sale deed unto and in favour of ${applicant}, He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${s2}`,
        lap: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${s1}`,
    }
    return map[ct] || map['lap']
}

// ================================================================
// CSS
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:5px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}}`

// ================================================================
// EC EXTRACTION PROMPT
// ================================================================
const EC_PROMPT = `You are an EC extractor for Gujarat IGR documents.
EC title: "Milakat parna boja angenu patrak" or "Encumbrance Certificate"

STRICT COLUMN MAPPING (count from left):
Col 1: Type of Document/Deed
Col 2: Property Description (ignore)
Col 3: Executing Party (Dastavej Kari Aapnar = who GIVES)
Col 4: Claimant Party (Dastavej Kari Lenar = who RECEIVES)
Col 5: Date of Registration
Col 6: Registration/Deed Number (second last)
Col 7: LAST COLUMN -- NEVER EXTRACT. IGNORE COMPLETELY.

HEADER FIELDS TO EXTRACT:
e-Application No. = ec_app_number
Date of Print = ec_date
Search period From = ec_from
Search period To = ec_to

GUJARATI TRANSLATION TABLE (Col 1):
vechan dastavej / vechanakhat = Sale Deed
giro dastavej / giro khat = Mortgage Deed
giro mukti / muktiakhat / giro mukeli milakatu fera = Mortgage Release Deed / Release Deed
baksishat / bhetakhat = Gift Deed
bhaglaa dastavej = Partition Deed
hudayantaran dastavej = Conveyance Deed
bhada karaar = Rent Agreement
vikas karaar = Development Agreement
banakhat / vechan karaar = Agreement to Sell
mukhtyarnamu = Power of Attorney
vasiyatnamu = Will
sudhara dastavej = Rectification Deed
radabatal dastavej = Cancellation Deed

MORTGAGE DETECTION RULES:
- If Col 4 (Lenar/Receiver) has BANK/FINANCE/HDFC/SBI/AXIS/ICICI/BAJAJ/LIC etc. = MORTGAGE DEED
- If Col 3 (Aapnar/Executing) has BANK/FINANCE etc. = MORTGAGE RELEASE DEED

CRITICAL RULES:
1. Extract EVERY row -- never skip any row especially the last row
2. Col 7 (LAST column) = NEVER EXTRACT EVER
3. EC Applicant name from header = DO NOT INCLUDE anywhere
4. Count rows yourself -- do not trust header row count
5. Extract full names exactly as written

Output ONLY JSON (no markdown, no text before or after):
{"found":true,"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"English type","col3_aapnar":"name","col4_lenar":"name","col5_date":"date","col6_deed_no":"number"}]}
If no EC: {"found":false,"rows":[]}`

// ================================================================
// LAYER SYSTEM PROMPTS
// ================================================================
const SYS_L1 = `Layer 1 Document Extraction Engine -- TITLEMATRIXAI.

RULES:
- NEVER assume. NEVER create. NEVER "and others".
- EC Col 7 = NEVER. EC Applicant = IGNORE.
- Stamp Paper Number = NEVER mention.
- Unavailable = "NOT PROVIDED FOR VERIFICATION."

EXTRACT FROM EVERY DOCUMENT:
Type | Date (Registration only, NOT stamp) | Reg.No | Executant/s (all names) | Claimant/s (all names) | Property | Survey | Village | Taluka | District | Area | Boundaries

PROPERTY PARA FORMAT:
"Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."`

function SYS_L23(ct: string): string {
    return `Layer 2 (Title Verification) + Layer 3 (Risk) -- TITLEMATRIXAI.
RULES: Never assume. Never create. Never suppress. "NOT PROVIDED FOR VERIFICATION."
CASE: ${ct.toUpperCase().replace(/_/g, ' ')}
EC Ground Truth provided -- DO NOT contradict it.
RELEASED mortgage = do NOT flag. ACTIVE = HIGH SEVERITY.

OUTPUT META BLOCK:
---META---
APPLICANT: [name]
CO_APPLICANT: [names or N/A]
PROPERTY_PARA: [full paragraph]
CURRENT_OWNER: [all names individually]
EC_APP_NUMBER: [value]
EC_DATE: [value]
EC_FROM: [value]
EC_TO: [value]
EC_ROW_COUNT: [number]
MORTGAGE_SUMMARY: [NONE / RELEASED / ACTIVE details]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally / Not]
SARFAESI: [Enforceable / Conditionally / Not]
LENDING_SUITABILITY: [Suitable / Conditionally / Not]
EXISTING_BANK: [bank name or N/A]
---END META---`
}

function parseMeta(t: string) {
    const b = t.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
    const g = (k: string) => b.match(new RegExp(`^${k}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
    return {
        applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'),
        propertyPara: g('PROPERTY_PARA'), currentOwner: g('CURRENT_OWNER'),
        ecAppNumber: g('EC_APP_NUMBER'), ecDate: g('EC_DATE'),
        ecFrom: g('EC_FROM'), ecTo: g('EC_TO'), ecRowCount: g('EC_ROW_COUNT'),
        mortgageSummary: g('MORTGAGE_SUMMARY'), riskLevel: g('RISK_LEVEL'),
        mortgageability: g('MORTGAGEABILITY'), sarfaesi: g('SARFAESI'),
        lendingSuitability: g('LENDING_SUITABILITY'), existingBank: g('EXISTING_BANK'),
    }
}

const SYS_4A = `Layer 4 -- PART I + II + III. PURE HTML ONLY. No markdown.

PART I: <hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt">
<tr><td>Name of Borrower/s</td><td>:</td><td>[Every person individually]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Names or Not Applicable]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Company / HUF / Trust]</td></tr>
</table>
<div class="sph">B. Mortgagor Details</div>
<table class="mt">
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[Full names]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual]</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[Full names -- never "and others"]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift / Court Decree / Succession]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO]</td></tr>
</table>

PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[Exact paragraph format from Prompt 2]</div>
<table class="mt">
<tr><td>East (Purva)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[boundary]</td></tr>
</table>

PART III: <hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
RULE: NO illegibility/blank/not-provided remarks -- those go ONLY in Part VI.
<div class="di"><p><span class="dn">N. [Doc Type] -- Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Executant/s] unto and in favour of [Claimant/s] registered at Sub-Registrar Office, [SRO]. [Description.]</p></div>
For EC: <div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [X] | Date of Print: [X] | Search Period: [from] to [to]</span><br>EC issued by IGR, Revenue Dept., Govt. of Gujarat. [N] transactions found. Encumbrance: [status].</p></div>
START WITH: <hr><div class="ph">PART I`

const SYS_4B = `Layer 4 -- PART IV + V. PURE HTML ONLY.

PART IV: <hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
RULES:
- Oldest first. First para NO "Thereafter". Each next MUST start "Thereafter,"
- Never "and others"
- RELEASED: "stands discharged and charge fully released and satisfied vide [Release Deed] No.[Y] dated [D] -- no subsisting charge remains."
- ACTIVE: "is subsisting and active as on date -- no Release Deed found in EC."
- NEVER "no discharge" for RELEASED mortgage.
- Last para: EC App No., period, encumbrance status.

PART V: <hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">Revenue Record</div>
<table class="mt">
<tr><td>Village</td><td>:</td><td>[Name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr>
<tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[Area]</td></tr>
<tr><td>Land Use</td><td>:</td><td>[Bin Kheti / Non-Agricultural = OK | Agricultural = FLAG]</td></tr>
<tr><td>Ownership (Khata)</td><td>:</td><td>[Names]</td></tr>
<tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL / Details]</td></tr>
<tr><td>Ganot / Tenant</td><td>:</td><td>[NIL / Details]</td></tr>
</table>
<div class="sph">Mutation Entries</div>
<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Status</th><th>Nature</th><th>Details</th></tr>[rows]</table>
<div class="sph">Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Development Permission</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>RERA Registration</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Occupancy Certificate</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[NOT PROVIDED FOR VERIFICATION.]</td></tr>
</table>
<div class="sph">Encumbrance Certificate Analysis</div>
[EC_TABLE_GOES_HERE]
<div class="sph">Mortgage Lifecycle Summary</div>
<table class="mt">
<tr><td>A. Active Mortgages</td><td>:</td><td>[NIL or list]</td></tr>
<tr><td>B. Released Mortgages</td><td>:</td><td>[NIL or list]</td></tr>
<tr><td>C. Unmatched Releases</td><td>:</td><td>[NIL]</td></tr>
<tr><td>D. Encumbrance Status</td><td>:</td><td>[CLEAR / ENCUMBERED / CLEAR_WITH_PRIOR_RELEASE]</td></tr>
</table>
START WITH: <hr><div class="ph">PART IV`

const SYS_4C = `Layer 4 -- PART VI + VII + VIII. PURE HTML ONLY. Max 5 alerts.
PART VI: <hr><div class="ph">PART VI -- ALERTS</div>
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[Finding 2-3 sentences.]</p><p><span class="sg">Direction:</span> [Action.]</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[1-2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
RULES: NEVER flag RELEASED mortgage. NEVER flag EC Applicant. NEVER flag EC-confirmed deeds.
No alerts: <p>No material adverse findings identified.</p>
Illegibility = HERE in Part VI ONLY.
PART VII: <hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Submitted</div><ol>[list]</ol>
<div class="sph">B. Critical Missing</div><ol>[list or NIL]</ol>
<div class="sph">C. Important Missing</div><ol>[list or NIL]</ol>
<div class="sph">D. Illegible</div><ol>[list or NIL]</ol>
<div class="sph">E. Risk Assessment</div>
<table class="mt">
<tr><td>Title Risk</td><td>:</td><td>[HIGH/MODERATE/LOW]</td></tr>
<tr><td>Mortgageability</td><td>:</td><td>[value]</td></tr>
<tr><td>SARFAESI</td><td>:</td><td>[value]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[value]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate/Marginal/Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentences]</td></tr>
</table>
PART VIII: <hr><div class="ph">PART VIII -- LEGAL OPINION</div>
[INSERT_LEGAL_OPINION]
HIGH alerts: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve HIGH SEVERITY conditions before disbursement.</p></div>
MEDIUM/LOW: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Disbursement subject to fulfillment of conditions in Parts VII and IX.</p></div>
No alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable.</p></div>
START WITH: <hr><div class="ph">PART VI`

const SYS_4D = `Layer 4 -- PART IX + X + XI. PURE HTML ONLY.
PART IX: <hr><div class="ph">PART IX -- DOCUMENTS REQUIRED -- PRE-DISBURSEMENT</div>
<p>Required BEFORE disbursement:</p><ol>[case-specific list]</ol>
PART X: <hr><div class="ph">PART X -- DOCUMENTS REQUIRED -- POST-DISBURSEMENT</div>
<p>Required AFTER disbursement:</p><ol>[case-specific list]</ol>
PART XI: <hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec"><div class="fr-title">Final Title Status:</div><div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div></div>
<p style="margin-top:16px;">[3-4 sentences summary]</p>
START WITH: <hr><div class="ph">PART IX`

// ================================================================
// REPORT BUILDER
// ================================================================
function buildReport(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; p123: string; p45: string; p678: string; p911: string }): string {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report -- ${p.refNo}</title><style>${CSS}</style></head><body>
<div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div><div class="hdr-right"><div><strong>Reference No.:</strong> ${p.refNo}</div><div><strong>Application ID:</strong> ${p.appId}</div><div><strong>Report Date:</strong> ${p.today}</div><div><strong>Bank:</strong> ${p.bankName}</div></div></div>
<div class="rtitle">LEGAL SCRUTINY REPORT -- ${p.loanType}</div><hr>
${p.p123}${p.p45}${p.p678}${p.p911}
<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName} -- ${p.appId}</div></div></div>
<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: This report is prepared exclusively for ${p.bankName} for Application ID ${p.appId}. Based solely on documents produced for examination. Confidential -- For Bank Use Only.</div><div class="wm">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div></div>
</body></html>`
}

// ================================================================
// MAIN HANDLER
// ================================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        // "images" -- matches page.tsx exactly
        const { images, caseType, appId, bankName, applicantName, coApplicant, propertyAddress, currentOwner, boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId } = body

        if (!images || images.length === 0) {
            return NextResponse.json({ success: false, error: 'No documents uploaded. Please upload at least one document.' }, { status: 400 })
        }

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`
        const loanMap: Record<string, string> = { builder_purchase: 'Builder Purchase', resale: 'Resale Property', bt: 'Balance Transfer', seller_bt: 'Seller Balance Transfer', lap: 'LAP (Loan Against Property)' }

        const imgContent: any[] = images.map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))

        // STEP 0: EC EXTRACTION
        let ecRows: ECRow[] = []
        let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
        let lifecycle = runLifecycle([])

        try {
            const ecRes = await AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
                messages: [{ role: 'user', content: [...imgContent, { type: 'text', text: EC_PROMPT }] }]
            })
            const raw = ecRes.content[0].type === 'text' ? ecRes.content[0].text : '{}'
            const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const parsed = JSON.parse(clean)
            if (parsed.found && parsed.rows?.length > 0) {
                ecRows = parsed.rows
                ecMeta = { ec_app_number: parsed.ec_app_number || '', ec_date: parsed.ec_date || '', ec_from: parsed.ec_from || '', ec_to: parsed.ec_to || '' }
                lifecycle = runLifecycle(ecRows)
                console.log('EC found:', ecRows.length, 'rows | Encumbrance:', lifecycle.encumbrance)
            }
        } catch (e) { console.log('EC extraction error:', e) }

        const existingBank = lifecycle.active.length > 0 ? lifecycle.active[0].lender : lifecycle.released.length > 0 ? lifecycle.released[0].lender : 'N/A'

        const GT = `=== EC GROUND TRUTH (CODE RESULT -- DO NOT CONTRADICT) ===
EC App No: ${ecMeta.ec_app_number || 'NOT PROVIDED'} | Date of Print: ${ecMeta.ec_date || 'NOT PROVIDED'}
Search Period: ${ecMeta.ec_from || 'NOT PROVIDED'} to ${ecMeta.ec_to || 'NOT PROVIDED'}
EC Rows: ${ecRows.length} | Encumbrance: ${lifecycle.encumbrance}
Mortgage Summary: ${lifecycle.summary}
Active: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => `${a.lender} Deed:${a.deed_no} Dt:${a.date}`).join(' | ')}
Released: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => `${r.lender} RELEASED vide ${r.release_deed_no} on ${r.release_date}`).join(' | ')}
Existing Bank: ${existingBank}
RULE: RELEASED=do not flag | ACTIVE=HIGH SEVERITY | Col7=NEVER
=== END GROUND TRUTH ===`

        const ecTbl = ecTableHTML(ecRows, lifecycle)
        const opinion = getLegalOpinion(caseType, currentOwner || 'Owner', applicantName || 'Applicant', existingBank)

        // LAYER 1
        const l1Res = await AI.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
            system: SYS_L1,
            messages: [{
                role: 'user', content: [...imgContent, {
                    type: 'text', text: `LAYER 1 EXTRACT ALL DOCS
CASE:${caseType} BANK:${bankName} APP:${appId}
Applicant:${applicantName} Co:${coApplicant || 'None'} Owner:${currentOwner}
Property:${propertyAddress}
E:${boundaryEast || 'N/A'} W:${boundaryWest || 'N/A'} N:${boundaryNorth || 'N/A'} S:${boundarySouth || 'N/A'}
${GT}`
                }]
            }]
        })
        const facts = l1Res.content[0].type === 'text' ? l1Res.content[0].text : ''

        // LAYER 2+3
        const l23Res = await AI.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
            system: SYS_L23(caseType),
            messages: [{
                role: 'user', content: `LAYER 2+3
CASE:${caseType} BANK:${bankName} APPLICANT:${applicantName} OWNER:${currentOwner}
${GT}
L1 FACTS:
${facts}`
            }]
        })
        const analysis = l23Res.content[0].type === 'text' ? l23Res.content[0].text : ''
        const meta = parseMeta(analysis)

        // LAYER 4 PARALLEL
        const ctx = `${GT}\nFACTS:\n${facts}\nANALYSIS:\n${analysis}`

        const [r4a, r4b, r4c, r4d] = await Promise.all([
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4A,
                messages: [{
                    role: 'user', content: `PARTS I+II+III
APPLICANT:${meta.applicant || applicantName} CO:${meta.coApplicant || coApplicant || 'Not Applicable'}
OWNER:${meta.currentOwner || currentOwner} PROPERTY:${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || 'As per docs'} W:${boundaryWest || 'As per docs'} N:${boundaryNorth || 'As per docs'} S:${boundarySouth || 'As per docs'}
EC: App.${ecMeta.ec_app_number || 'N/A'} Date:${ecMeta.ec_date || 'N/A'} From:${ecMeta.ec_from || 'N/A'} To:${ecMeta.ec_to || 'N/A'} Rows:${ecRows.length}
BANK:${bankName}
${ctx}
RULE: Part III NO illegibility/blank/not-provided remarks.` }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4B,
                messages: [{
                    role: 'user', content: `PARTS IV+V
CASE:${caseType} OWNER:${meta.currentOwner || currentOwner}
ENCUMBRANCE:${lifecycle.encumbrance} MORTGAGE:${lifecycle.summary}
ACTIVE:${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => `${a.lender} Deed:${a.deed_no}`).join(', ')}
RELEASED:${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => `${r.lender} RELEASED vide ${r.release_deed_no}`).join(', ')}
${ctx}
Replace [EC_TABLE_GOES_HERE] with:
${ecTbl}`
                }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: SYS_4C,
                messages: [{
                    role: 'user', content: `PARTS VI+VII+VIII
BANK:${bankName} CASE:${caseType}
ENCUMBRANCE:${lifecycle.encumbrance}
ACTIVE:${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no).join(', ')}
RELEASED:${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED').join(', ')}
RISK:${meta.riskLevel || 'MODERATE'} MORTGAGEABILITY:${meta.mortgageability} SARFAESI:${meta.sarfaesi}
${ctx}
Replace [INSERT_LEGAL_OPINION] with:<p>${opinion}</p>`
                }]
            }),
            AI.messages.create({
                model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: SYS_4D,
                messages: [{
                    role: 'user', content: `PARTS IX+X+XI
CASE:${caseType} BANK:${bankName}
OWNER:${meta.currentOwner || currentOwner} APPLICANT:${meta.applicant || applicantName}
EXISTING BANK:${existingBank} ENCUMBRANCE:${lifecycle.encumbrance}
${ctx}`
                }]
            })
        ])

        let p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error Parts I-III</p>'
        let p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error Parts IV-V</p>'
        let p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error Parts VI-VIII</p>'
        const p911 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error Parts IX-XI</p>'

        // LAYER 5 VALIDATION
        const errors: string[] = []
        if (lifecycle.released.length > 0 && (p45.toLowerCase().includes('no release') || p45.toLowerCase().includes('no discharge')))
            errors.push('Part IV wrong: says no discharge for RELEASED mortgage.')
        if (p123.toLowerCase().includes('illegible') || p123.toLowerCase().includes('not provided for verification'))
            errors.push('Part III wrong: has illegibility remarks -- move to Part VI.')
        if (lifecycle.active.length === 0 && p678.toLowerCase().includes('active mortgage') && p678.toLowerCase().includes('high severity'))
            errors.push('Part VI wrong: flags active mortgage when none exists.')

        if (errors.length > 0) {
            try {
                const fix = await AI.messages.create({
                    model: 'claude-sonnet-4-6', max_tokens: 5000, temperature: 0,
                    system: 'Fix listed errors. Output corrected Part IV HTML, then ===P6===, then corrected Part VI HTML. Pure HTML only.',
                    messages: [{ role: 'user', content: `ERRORS:\n${errors.join('\n')}\n${GT}\nPART IV:\n${p45.substring(0, 3000)}\nPART VI:\n${p678.substring(0, 3000)}` }]
                })
                const ft = fix.content[0].type === 'text' ? fix.content[0].text : ''
                if (ft.includes('===P6===')) {
                    const pts = ft.split('===P6===')
                    if (pts[0].trim()) p45 = pts[0].trim()
                    if (pts[1]?.trim()) p678 = pts[1].trim()
                }
            } catch (e) { console.log('Validation error:', e) }
        }

        const html = buildReport({ refNo, appId: appId || 'AUTO', today, bankName: bankName || 'Bank', loanType: loanMap[caseType] || 'LAP', p123, p45, p678, p911 })
        const verdict = lifecycle.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR' : lifecycle.encumbrance === 'CLEAR' ? 'CLEAR' : 'CLEAR SUBJECT TO'

        if (userId && DB) {
            try {
                await DB.from('reports').insert({ user_id: userId, case_type: caseType || 'lap', applicant_name: meta.applicant || applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: meta.propertyPara || propertyAddress || 'Unknown', app_id: appId || refNo, verdict, report_html: html })
            } catch (e) { console.log('DB error:', e) }
        }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle, ecRows, ecMeta })

    } catch (e: any) {
        console.error('Pipeline error:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}