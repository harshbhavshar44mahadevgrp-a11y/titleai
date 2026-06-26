// ================================================================
// TITLEMATRIXAI -- /api/analyze/route.ts ADVOCATE EDITION v2
// Based on 20-Year Senior Advocate SOP -- FORCE REDEPLOY
// EC First Protocol | 5 Templates | Red Flags | Revenue 7-Check
// temperature=0 | maxDuration=300 | claude-sonnet-4-6 | images
// ================================================================
export const maxDuration = 300
export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const AI = new Anthropic()
const DB = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null

// ================================================================
// BANK DETECTION -- CODE. Never AI. 100% deterministic.
// ================================================================
const BANKS = ["BANK", "FINANCE", "HOUSING FINANCE", "FINANCIAL SERVICES", "NBFC",
    "CAPITAL", "FINCORP", "BAJAJ", "HDFC", "SBI", "AXIS", "ICICI", "KOTAK", "PNB", "BOI",
    "CANARA", "UNION BANK", "INDIABULLS", "LIC", "LICHFL", "REPCO", "PIRAMAL", "MUTHOOT",
    "TATA CAPITAL", "ADITYA BIRLA", "FULLERTON", "AAVAS", "HOME FIRST", "APTUS", "SHRIRAM",
    "GRUH", "MANAPPURAM", "INDIA BULLS", "HOME FINANCE", "GOLD LOAN", "CREDIT",
    "LENDING", "FINSERV", "CHOLAMANDALAM", "CHOLA", "MAHINDRA", "SUNDARAM", "MAGMA",
    "HERO FINCORP", "INCRED", "NAVI", "STASHFIN", "LENDINGKART"]
function isBank(n: string): boolean {
    if (!n) return false
    const u = n.toUpperCase()
    return BANKS.some(b => u.includes(b))
}

// ================================================================
// MORTGAGE LIFECYCLE -- DETERMINISTIC
// Senior Advocate Rule:
// Col 3 = Bank -> RELEASE DEED (bank giving back)
// Col 4 = Bank -> MORTGAGE DEED (bank receiving)
// Last row often = Release -- NEVER SKIP
// ================================================================
interface ECRow {
    row_number: number; col1_type: string; col3_aapnar: string
    col4_lenar: string; col5_date: string; col6_deed_no: string
}
interface Charge {
    lender: string; borrower: string; deed_no: string; date: string
    row: number; status: "ACTIVE" | "RELEASED"
    release_deed_no?: string; release_date?: string
}
function runLifecycle(rows: ECRow[]) {
    const charges: Charge[] = []
    // PASS 1: Col4 = Bank -> MORTGAGE
    for (const r of rows) {
        if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar))
            charges.push({ lender: r.col4_lenar, borrower: r.col3_aapnar, deed_no: r.col6_deed_no, date: r.col5_date, row: r.row_number, status: "ACTIVE" })
    }
    // PASS 2: Col3 = Bank -> RELEASE (Role Flip!)
    for (const r of rows) {
        if (isBank(r.col3_aapnar)) {
            const words = r.col3_aapnar.toUpperCase().split(" ").filter((w: string) => w.length > 3)
            const match = charges.find(c => words.some((w: string) => c.lender.toUpperCase().includes(w)))
            if (match) { match.status = "RELEASED"; match.release_deed_no = r.col6_deed_no; match.release_date = r.col5_date }
        }
    }
    const active = charges.filter(c => c.status === "ACTIVE")
    const released = charges.filter(c => c.status === "RELEASED")
    const encumbrance = active.length > 0 ? "ENCUMBERED" : released.length > 0 ? "CLEAR_WITH_PRIOR_RELEASE" : "CLEAR"
    const summary = active.length === 0
        ? released.length > 0
            ? "CLEAR. Prior mortgage by " + released.map(r => r.lender).join(", ") + " stands FULLY RELEASED AND SATISFIED vide Release Deed No. " + released.map(r => r.release_deed_no).join(", ") + "."
            : "CLEAR. No mortgage or encumbrance found in EC."
        : "ENCUMBERED. Active mortgage: " + active.map(a => a.lender + " (Deed No. " + a.deed_no + " dated " + a.date + ")").join("; ") + ". Outstanding charge exists as on date."
    return { active, released, summary, encumbrance, charges }
}

// ================================================================
// EC TABLE HTML -- CODE. Always correct.
// ================================================================
function ecTableHTML(rows: ECRow[], lc: ReturnType<typeof runLifecycle>): string {
    if (!rows.length) return "<p>No EC entries found in the documents produced for examination.</p>"
    let h = "<table class=\"ec-tbl\"><tr><th>Sr.</th><th>Classified Type</th><th>Match Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 — Aapnar (Executing)</th><th>Col 4 — Lenar (Claimant)</th><th>Status</th></tr>"
    for (const r of rows) {
        const isRelRow = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        const isMortRow = isBank(r.col4_lenar) && !isBank(r.col3_aapnar)
        const isActMort = lc.active.some((c: Charge) => c.row === r.row_number)
        let cls = "", status = "Transaction", type = r.col1_type || "Transaction"
        let confidence = "HIGH — Property details match subject property."
        if (isRelRow) {
            cls = "ec-rel"
            status = "&#x2705; DISCHARGE INSTRUMENT — Formally satisfies and releases prior mortgage. Title unencumbered as of this date."
            type = type.includes("Release") || type.includes("Reconveyance") ? type : "Reconveyance / Mortgage Release Deed"
            confidence = "HIGH — Bank in Col 3 as releasing party. Rule applied: Bank in Col 3 = Release / Reconveyance Deed confirmed."
        } else if (isMortRow && isActMort) {
            cls = "ec-act"
            status = "&#x26A0;&#xFE0F; ACTIVE MORTGAGE — Subsisting and active as on date. No Release Deed found."
            type = type.includes("Mortgage") ? type : "Mortgage Deed"
            confidence = "HIGH — Bank/Financial Institution in Col 4 as mortgagee confirmed."
        } else if (isMortRow && !isActMort) {
            cls = "ec-rel"
            status = "&#x2705; DISCHARGED — Released and extinguished vide subsequent Release Deed. No subsisting charge."
            type = type.includes("Mortgage") ? type : "Mortgage Deed — Builder Level"
            confidence = "HIGH — Bank in Col 4 as mortgagee. Discharged vide subsequent Release Deed on record."
        } else if (type.toLowerCase().includes("sale")) {
            confidence = "HIGH — Matches subject property. Establishes title vesting in claimant."
            status = "&#x2705; PRIMARY TITLE DOCUMENT — Establishes ownership. No encumbrance."
        } else if (type.toLowerCase().includes("declaration")) {
            confidence = "MEDIUM — Title confirmatory instrument. No adverse charge detected."
            status = "&#x26A0;&#xFE0F; UNIDENTIFIED — Col 4 to be confirmed. No adverse charge detected. Flagged for verification."
        }
        h += "<tr><td>" + r.row_number + "</td><td>" + type + "</td><td>" + confidence + "</td><td>" + (r.col6_deed_no || "--") + "</td><td>" + (r.col5_date || "--") + "</td><td>" + (r.col3_aapnar || "--") + "</td><td>" + (r.col4_lenar || "--") + "</td><td class=\"" + cls + "\">" + status + "</td></tr>"
    }
    return h + "</table>"
}

// ================================================================
// LEGAL OPINION -- FIXED WORDING DATABASE
// Same wording EVERY TIME. Only names change. temperature=0.
// ================================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
    const BASE = "On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that"
    const SARFAESI = "The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."
    const SARFAESI_BT = "The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of " + existingBank + "."
    const TITLE_OK = "the right, title and interest of " + owner + " in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid"
    const MORTGAGE_OK = "He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt."
    const m: Record<string, string> = {
        builder_purchase: BASE + " " + TITLE_OK + " and after the execution and registration of Sale Deed unto and in favour of " + applicant + ", " + MORTGAGE_OK + " " + SARFAESI,
        resale: BASE + " " + TITLE_OK + " and after the execution and registration of Sale Deed unto and in favour of " + applicant + ", " + MORTGAGE_OK + " " + SARFAESI,
        bt: BASE + " " + TITLE_OK + " subject to charge of " + existingBank + " and after the execution and registration of deed of release of mortgage unto and in favour of " + applicant + ", " + MORTGAGE_OK + " " + SARFAESI_BT,
        seller_bt: BASE + " " + TITLE_OK + " subject to charge of " + existingBank + " and after the execution and registration of deed of release of mortgage unto and in favour of " + owner + " and after the execution and registration of sale deed unto and in favour of " + applicant + ", " + MORTGAGE_OK + " " + SARFAESI_BT,
        lap: BASE + " " + TITLE_OK + " and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. " + SARFAESI,
    }
    return m[ct] || m["lap"]
}

// ================================================================
// CSS
// ================================================================
const CSS = "*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:5px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}table.tc-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.tc-tbl th{background:#374151;color:#fff;padding:5px 8px;font-size:10px}table.tc-tbl td{border:1px solid #e5e7eb;padding:5px 8px}.ok{color:#15803d;font-weight:bold}.flag{color:#b91c1c;font-weight:bold}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}}"

// ================================================================
// PHASE 2: EC FIRST PROTOCOL -- Most important step
// Senior Advocate: "EC padha -> Case ka 80% samajh aaya"
// ================================================================
const EC_PROMPT = `You are an expert at reading Gujarat IGR Encumbrance Certificates.

TASK: Extract ALL details from the Encumbrance Certificate (EC) image.

STEP 1 - FIND THE EC:
Look for document titled "Milakat Parna Boja Angenu Patrak" OR "Encumbrance Certificate"
It is a GOVERNMENT TABLE from IGR Gujarat with property transaction rows.

STEP 2 - EXTRACT HEADER (CRITICAL - DO NOT SKIP):
Look carefully at the TOP section of the EC document for these 4 fields:
- "e-Application No." OR "e-અરજી ક્રમાંક" OR "e-App No" = ec_app_number
- "Date of Print" OR "છાપ્યાની તારીખ" = ec_date
- "From" date of search period = ec_from
- "To" date of search period = ec_to

STEP 3 - EXTRACT TABLE ROWS:
The EC table has exactly 7 columns. Count from LEFT to RIGHT:
COL 1 = Type of Deed/Document
COL 2 = Property Description (IGNORE - skip this)
COL 3 = Executing Party = Dastavej Kari Aapnar = WHO GIVES
COL 4 = Claimant Party = Dastavej Kari Lenar = WHO RECEIVES
COL 5 = Date of Registration
COL 6 = Registration/Deed Number (SECOND LAST column)
COL 7 = LAST COLUMN = NEVER EXTRACT - IGNORE COMPLETELY

STEP 4 - TRANSLATE COLUMN 1 (Gujarati to English):
વેચાણ = Sale Deed
ગીરો = Mortgage Deed
ગીરો ફેર / ગ.ફ. / ગ.મૂ.ફ. = Mortgage Release Deed
ભાગ = Partition Deed
ભેટ = Gift Deed
ભ.ક. = Rent Agreement
ખ.ત. = Cancellation Deed
ન.ત. = Court Decree

STEP 5 - IDENTIFY BANK IN COL 3 OR COL 4:
If COL 4 (Lenar/Receiver) contains: BANK, FINANCE, HDFC, SBI, AXIS, ICICI, LIC, BAJAJ, LICHFL, GRUH, AAVAS, PNB, BOI etc.
= This row is MORTGAGE DEED

If COL 3 (Aapnar/Executer) contains: BANK, FINANCE, HDFC, SBI, AXIS, ICICI, LIC, BAJAJ etc.
= This row is MORTGAGE RELEASE DEED (bank giving back property)

CRITICAL RULES:
1. Extract EVERY row - NEVER skip any row - LAST ROW is often Release Deed
2. COL 7 = ABSOLUTE NEVER EXTRACT
3. EC Applicant name from header = DO NOT include
4. Extract EXACT bank/party names as written - not generic "Bank/Financial Institution"
5. If text is Gujarati, translate using the table above

Output ONLY valid JSON - no other text:
{"found":true,"ec_app_number":"exact number from header","ec_date":"exact date from header","ec_from":"exact from date","ec_to":"exact to date","rows":[{"row_number":1,"col1_type":"English deed type","col3_aapnar":"EXACT full name","col4_lenar":"EXACT full name","col5_date":"date","col6_deed_no":"number"}]}
If no EC in images: {"found":false,"rows":[]}`

// ================================================================
// LAYER 1: DOCUMENT EXTRACTION
// ================================================================
const SYS_L1 = `You are Layer 1 Document Extraction Engine of TITLEMATRIXAI.
Based on 20-Year Senior Advocate Protocol.

ABSOLUTE RULES (Never violate):
- NEVER assume facts. NEVER create facts.
- NEVER "and others" - every person individually always
- EC Col 7 = NEVER READ. NEVER MENTION.
- EC Applicant name = COMPLETELY IGNORE
- Stamp Paper Number = NEVER mention
- Loan Amount = NEVER mention
- Unavailable = "NOT PROVIDED FOR VERIFICATION."

EXTRACT FROM EVERY DOCUMENT:
1. Document Type (exact classification)
2. Registration Date (NOT stamp paper date - only IGR registration date)
3. Registration Number
4. Executant/s - EVERY person by full name (never "and others")
5. Claimant/s - EVERY person by full name
6. Property Description
7. Survey/Block No | Village | Taluka | District | Area | Boundaries

PROPERTY DESCRIPTION MANDATORY EXACT FORMAT:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

TITLE CHAIN TABLE - Build this for every case:
For each deed/document create one row:
YEAR | DEED TYPE | FROM (Executant) | TO (Claimant) | REG NO | SRO | AREA | STATUS

AREA CROSS-CHECK: Flag if area changes between deeds.
SURVEY NO CROSS-CHECK: Flag if survey number changes.`

// ================================================================
// LAYER 2+3: TITLE VERIFICATION + RISK
// ================================================================
function SYS_L23(ct: string): string {
    const templates: Record<string, string> = {
        builder_purchase: `BUILDER PURCHASE TEMPLATE:
Mandatory checks: Developer title deeds | NA Order | RERA (post-2017) | Building Permission | Draft Sale Deed/Banakhat
Title chain: Land owner -> Developer -> Applicant (via Sale Deed)
Missing Sale Deed = CRITICAL title break`,
        resale: `RESALE TEMPLATE:
Mandatory: Chain of title minimum 30 years | Every seller-buyer link | EC cross-match each deed
Title chain: Original owner -> ... -> Current seller -> Applicant
Missing any link = CRITICAL`,
        bt: `BALANCE TRANSFER TEMPLATE:
Mandatory: Existing bank LOD | Foreclosure letter | CERSAI search | Updated EC (active charge)
EC must show ACTIVE mortgage from existing bank
Title chain: Owner with existing mortgage -> Transfer to new bank`,
        seller_bt: `SELLER BT TEMPLATE:
Same as BT + Sale Deed chain
Two transactions: Release of old mortgage + Sale to purchaser
Both must complete`,
        lap: `LAP TEMPLATE:
Owner = Mortgagor (same person)
EC must show NIL or Released only
Any undisclosed mortgage = RED FLAG HIGH SEVERITY`,
    }
    return `You are Layer 2 (Title Verification) + Layer 3 (Risk) of TITLEMATRIXAI.
Based on 20-Year Senior Advocate Protocol.

NON-NEGOTIABLE RULES: Never assume. Never create. Never suppress. "NOT PROVIDED FOR VERIFICATION."
EC GROUND TRUTH provided = DO NOT CONTRADICT.
RELEASED mortgage = DO NOT flag. ACTIVE = HIGH SEVERITY.
NEVER "and others". NEVER stamp paper date. NEVER loan amount.

CASE TYPE: ${ct.toUpperCase().replace(/_/g, " ")}
${templates[ct] || templates["lap"]}

RED FLAGS CHECKLIST (Senior Advocate System):
CRITICAL (Report hold):
- Agricultural land in 7/12 (Kheti) -> Bank CANNOT lend
- Lis Pendens (Court case pending) -> CRITICAL ALERT
- Area mismatch between deeds -> FLAG
- Survey number mismatch -> FLAG
- Active undisclosed mortgage -> HIGH SEVERITY
- Title break (missing link) -> CRITICAL
- Government acquisition notification -> CRITICAL

HIGH (Conditions):
- Missing mutation entry
- NA Order missing
- RERA missing (post May 2017)
- OC/CC missing
- Unreflected sale in 7/12

MEDIUM (Pre-disbursement fix):
- Stamp duty short
- Boundary mismatch
- Name spelling variation

LOW (Note only):
- Old unregistered documents
- Pre-1985 chain incomplete

REVENUE RECORDS 7-CHECK PROTOCOL:
CHECK 1: Owner name = Same as latest deed? Yes=OK No=FLAG unreflected sale
CHECK 2: Survey number = Same as EC? Yes=OK No=FLAG survey mismatch
CHECK 3: Area = Same throughout chain? Yes=OK No=FLAG area mismatch
CHECK 4: Land use = Bin Kheti/Non-Agricultural? Yes=OK Kheti=RED FLAG
CHECK 5: Boja column = NIL? NIL=OK Any entry=Cross-check with EC
CHECK 6: Ganot/Tenant = NIL? NIL=OK Tenant=FLAG SARFAESI issue
CHECK 7: Government acquisition notation? No=OK Yes=CRITICAL FLAG

OUTPUT META BLOCK:
---META---
APPLICANT: [full name from documents]
CO_APPLICANT: [full names or N/A]
PROPERTY_PARA: [exact paragraph format]
CURRENT_OWNER: [all names individually - never "and others"]
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

function parseMeta(t: string) {
    const b = t.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ""
    const g = (k: string) => b.match(new RegExp("^" + k + ":\s*(.+)$", "mi"))?.[1]?.trim() || ""
    return {
        applicant: g("APPLICANT"), coApplicant: g("CO_APPLICANT"),
        propertyPara: g("PROPERTY_PARA"), currentOwner: g("CURRENT_OWNER"),
        ecAppNumber: g("EC_APP_NUMBER"), ecDate: g("EC_DATE"),
        ecFrom: g("EC_FROM"), ecTo: g("EC_TO"), ecRowCount: g("EC_ROW_COUNT"),
        mortgageSummary: g("MORTGAGE_SUMMARY"), riskLevel: g("RISK_LEVEL"),
        mortgageability: g("MORTGAGEABILITY"), sarfaesi: g("SARFAESI"),
        lendingSuitability: g("LENDING_SUITABILITY"), existingBank: g("EXISTING_BANK"),
        redFlags: g("RED_FLAGS"),
    }
}

// ================================================================
// LAYER 4 REPORT SYSTEM PROMPTS
// ================================================================
const SYS_4A = `Layer 4A -- PARTS I + II + III. PURE HTML ONLY. No markdown. No commentary.

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
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[Full names -- same as borrower]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents submitted]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual]</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest registered deed -- never "and others"]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift Deed / Court Decree / Succession]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, Sub-Registrar Office name]</td></tr>
</table>

PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[EXACT PARAGRAPH: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt">
<tr><td>East (Purva)</td><td>:</td><td>[boundary as per documents]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[boundary]</td></tr>
</table>

PART III: <hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
<p>The following documents have been produced for examination and scrutiny:</p>
SENIOR ADVOCATE RULE: NO illegibility/blank/not-provided remarks here. Those go ONLY in Part VI.
For each document:
<div class="di"><p><span class="dn">N. [Document Type] -- Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Full names of Executant/s] unto and in favour of [Full names of Claimant/s] registered at Sub-Registrar Office, [SRO Name]. [2 sentences factual description. NO illegibility remarks.]</p></div>
For EC:
<div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [number] | Date of Print: [date] | Search Period: [from] to [to]</span><br>Encumbrance Certificate bearing E-Application No. [number] dated [date] for the period [from] to [to] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. On row-by-row examination, [N] transaction/s found recorded. Encumbrance Status: [CLEAR / ENCUMBERED / CLEAR WITH PRIOR RELEASE].</p></div>
START WITH: <hr><div class="ph">PART I`

const SYS_4B = `Layer 4B -- PARTS IV + V. PURE HTML ONLY.

PART IV: <hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
<p>The chronological title chain in respect of the subject property has been established on the basis of documents produced for examination, as follows:</p>

MANDATORY ADVOCATE RULES FOR PART IV:
1. OLDEST FIRST -- chronological order always
2. First paragraph: MUST NOT contain "Thereafter"
3. Every subsequent paragraph: MUST START WITH "Thereafter,"
4. NEVER "and others" -- all names individually with their EXACT percentage shares
5. RELEASED mortgage EXACT WORDING: "stands discharged and the charge has been fully released and satisfied vide [Mortgage Release Deed / Reconveyance Deed] No. [Y] dated [DD/MM/YYYY] -- no subsisting charge of [Bank Name] remains on the subject property as on date."
6. ACTIVE mortgage EXACT WORDING: "is subsisting and active as on date -- no Release Deed or Discharge Certificate has been found in the documents produced or in the Encumbrance Certificate."
7. NEVER say "no discharge found" for a RELEASED mortgage
8. Last EC paragraph MUST mention: "Encumbrance Certificate bearing E-Application No. [number] (covering search period from [year] to [year])...together providing continuous encumbrance coverage from [year] to [year]. On combined examination...no subsisting or undischarged encumbrance...is found to be active against the subject property as on the date of this report."
9. If multiple ECs: mention both App Numbers and combined period
10. If CLEAR: "The encumbrance status of the subject property is accordingly CLEAR"
11. If ENCUMBERED: mention the active mortgage with exact deed details

Title Chain Table (MANDATORY in Part IV):
<table class="tc-tbl"><tr><th>Sr.</th><th>Year</th><th>Deed Type</th><th>From</th><th>To</th><th>Reg. No.</th><th>SRO</th><th>Area</th><th>Status</th></tr>
[One row per transaction -- ALL names individually]
</table>

PART V: <hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">A. Revenue Record (7/12 / Property Card)</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr>
<tr><td>Survey / Block / FP No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area (H.Are.SqMt)</td><td>:</td><td>[Area -- flat level areas if available: Carpet + Balcony + Wash + UPS]</td></tr>
<tr><td>Land Use / Khate Type</td><td>:</td><td>[Non-Agricultural = OK | Kheti = RED FLAG]</td></tr>
<tr><td>Ownership Column (Khata)</td><td>:</td><td>[Developer/Owner name -- flag if current owner not reflected]</td></tr>
<tr><td>Boja / Encumbrance Column</td><td>:</td><td>[NIL subsisting -- builder mortgage discharged / NIL / Active mortgage details]</td></tr>
<tr><td>Ganot / Tenant Column</td><td>:</td><td>[NIL = OK | Tenant = FLAG SARFAESI issue]</td></tr>
<tr><td>Govt Acquisition Notation</td><td>:</td><td>[None = OK | Any = CRITICAL FLAG]</td></tr>
</table>
<div class="sph">B. Mutation Entries (Chronological)</div>
<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Certified/Rejected</th><th>Nature of Entry</th><th>Details</th><th>Survey No.</th></tr>
[One row per mutation entry]
</table>
<p>Cross-check: [State whether EC entries are consistent with revenue records. Note any discrepancy.]</p>
<div class="sph">C. Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[Details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>RERA Registration (Post May 2017 = Mandatory)</td><td>:</td><td>[RERA No. with validity date OR NOT PROVIDED FOR VERIFICATION. Post May 2017 = mandatory]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[Details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[Details with validity date or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[Details or NOT PROVIDED FOR VERIFICATION.]</td></tr>
</table>
<div class="sph">D. Encumbrance Certificate Analysis</div>
<p>[State EC App Numbers, search periods, combined coverage, total rows found, overall encumbrance status.]</p>
[EC_TABLE_GOES_HERE]
<div class="sph">E. Mortgage Lifecycle Summary</div>
<table class="mt">
<tr><td>A. Active Mortgages</td><td>:</td><td>[NIL or: Bank Name -- Deed No. X dated DD/MM/YYYY -- subsisting and active as on date]</td></tr>
<tr><td>B. Released Mortgages</td><td>:</td><td>[NIL or: Bank Name -- Deed No. X -- DISCHARGED vide Release Deed No. Y dated DD/MM/YYYY]</td></tr>
<tr><td>C. Unmatched Releases</td><td>:</td><td>[NIL]</td></tr>
<tr><td>D. Overall Encumbrance Status</td><td>:</td><td>[CLEAR / ENCUMBERED / CLEAR WITH PRIOR RELEASE]</td></tr>
</table>
START WITH: <hr><div class="ph">PART IV`

const SYS_4C = `Layer 4C -- PARTS VI + VII + VIII. PURE HTML ONLY. Maximum 5-6 alerts.

PART VI: <hr><div class="ph">PART VI -- ALERTS AND ADVERSE FINDINGS</div>
<p>The following alerts were identified during examination. HIGH SEVERITY conditions are conditions precedent to sanction and disbursement.</p>
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Alert Title]</div><p>[Specific finding with deed numbers, dates, and parties. Legal consequence. 2-3 sentences.]</p><p><span class="sg">Direction:</span> [Specific action required before sanction/disbursement.]</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[1-2 sentences.]</p><p><span class="sg">Direction:</span> [Note for record.]</p></div>

SENIOR ADVOCATE ALERT RULES:
- NEVER flag RELEASED mortgage as active encumbrance
- NEVER flag EC-confirmed registered deeds
- NEVER flag EC Applicant name
- Lis Pendens = CRITICAL HIGH SEVERITY always
- Agricultural land = CRITICAL HIGH SEVERITY always
- Title break = HIGH SEVERITY always
- Missing RERA (post-2017) = HIGH SEVERITY
- No alerts: <p>No material adverse findings identified on examination. Title appears clear on the basis of documents produced.</p>
- Illegibility/illegible remarks go HERE in Part VI ONLY -- never in Part III

PART VII: <hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted and Available</div><ol>[all submitted docs with brief description]</ol>
<div class="sph">B. Critical Missing Documents (Report Hold)</div><ol>[mandatory docs not submitted -- state purpose and legal consequence -- OR write "NIL"]</ol>
<div class="sph">C. Important Missing Documents (Pre-Disbursement)</div><ol>[other missing docs -- OR write "NIL"]</ol>
<div class="sph">D. Documents Illegible / Incomplete / Unreadable</div><ol>[docs that could not be read clearly -- OR write "NIL"]</ol>
<div class="sph">E. Risk Assessment Summary (Prompt 5)</div>
<table class="mt">
<tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
<tr><td>Mortgageability Status</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentences explaining risk assessment]</td></tr>
</table>

PART VIII: <hr><div class="ph">PART VIII -- LEGAL OPINION AND VERDICT</div>
[INSERT_LEGAL_OPINION]
VERDICT selection (based on Part VI alerts):
If HIGH alerts: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve all HIGH SEVERITY conditions enumerated in Part VI before proceeding with sanction or disbursement.</p></div>
If MEDIUM/LOW only: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is conditionally clear. Disbursement shall be subject to fulfillment of all conditions precedent enumerated in Parts VII and IX of this Report.</p></div>
If no alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. Property is suitable security for the proposed loan.</p></div>
START WITH: <hr><div class="ph">PART VI`

const SYS_4D = `Layer 4D -- PARTS IX + X + XI. PURE HTML ONLY.

PART IX: <hr><div class="ph">PART IX -- DOCUMENTS REQUIRED AT PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody BEFORE disbursement of the loan:</p>
<ol>
[For each document use this format:
<li><strong>[Document Name]</strong><br>
<em>Source:</em> [Who provides this / Where to get it]<br>
<em>Purpose:</em> [Why needed -- legal consequence of absence]</li>

BUILDER PURCHASE documents:
1. Registered Sale Deed OR Registered Agreement to Sale (Banakhat) -- Arpan Developers to Applicant for specific flat -- Source: Sub-Registrar Office / Developer -- Purpose: Primary title document establishing ownership; no mortgage possible without this
2. RERA Registration Certificate -- Source: GujRERA portal (gujrera.gujarat.gov.in) / Developer -- Purpose: Mandatory for post-May 2017 projects; lending against unregistered project impermissible
3. Tripartite Agreement among Developer, Applicant, and Bank -- Source: Executed by all three parties -- Purpose: Confirms bank's interest in the flat and developer's obligations
4. NOC from Developer confirming flat is free from prior allotment and encumbrance -- Source: Developer
5. Partnership Deed of developer firm confirming authorized partner -- Source: Developer
6. CERSAI Search Report -- Source: CERSAI Portal -- Purpose: Independent charge verification
7. Occupancy Certificate / Completion Certificate from competent authority -- Source: GUDA / Municipal Authority
8. Updated EC post-registration -- Source: Sub-Registrar Office
9. NOC from existing mortgagee bank if EC shows active mortgage -- Source: Existing bank
10. City Survey / 7-12 extract confirming developer as owner -- Source: Revenue Authority
11. Property Tax No-Dues Certificate -- Source: Municipal Authority
12. Any critical missing docs from Part VII B (list specifically)

RESALE: Complete 30-year title chain | All original title deeds | EC with clear status | CERSAI | Property tax receipts
BT/SELLER_BT: Letter of Discharge + Foreclosure | NOC from existing bank | CERSAI | Outstanding balance certificate
LAP: Updated EC showing NIL | CERSAI search | Original title deeds]
</ol>

PART X: <hr><div class="ph">PART X -- DOCUMENTS REQUIRED AT POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody AFTER disbursement of the loan:</p>
<ol>
[For each document use same Source + Purpose format:
BUILDER PURCHASE:
1. Original Registered Sale Deed in favour of Applicant -- Source: Sub-Registrar Office post-registration -- Purpose: Primary title document; cornerstone of mortgage security; verify all details match sanction letter
2. Registered Mortgage Deed / MODT in favour of Bank -- Source: Executed by Applicant post-disbursement -- Purpose: Creates valid first charge on property
3. CERSAI Registration Confirmation -- Source: CERSAI Portal (within 30 days of mortgage creation) -- Purpose: Mandatory under SARFAESI Act
4. Updated EC post-registration of Sale Deed and Mortgage -- Source: Sub-Registrar Office -- Purpose: Confirms bank charge as sole active encumbrance
5. Society Share Certificate + NOC from Housing Society (when formed) -- Source: Society
6. Possession Letter from Developer -- Source: Developer
7. Mutation Entry in name of Applicant -- Source: Revenue Authority
8. Property Tax Receipt in Applicant name -- Source: Municipal Authority
9. OC/CC if not obtained pre-disbursement -- Source: GUDA
10. Insurance Policy with Bank as mortgagee/loss payee -- Source: Insurance Company]
</ol>

PART XI: <hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec">
<div class="fr-title">Final Title Status (select ONE only):</div>
<div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE NOT CLEAR]</div>
</div>
<p style="margin-top:16px;">[4-6 sentences covering ALL of the following:
1. Title chain status -- is it complete? From whom to whom?
2. EC status -- which App Numbers examined, combined period, encumbrance finding
3. Mortgage lifecycle -- any active/released mortgage, specific deed numbers
4. RERA status -- registered and valid?
5. Conditions if any -- list specific conditions numbered (i), (ii), (iii)
6. SARFAESI enforceability conclusion
7. Final bank recommendation]</p>
START WITH: <hr><div class="ph">PART IX`

// ================================================================
// REPORT BUILDER
// ================================================================
function buildReport(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; p123: string; p45: string; p678: string; p911: string }): string {
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><title>Legal Scrutiny Report -- " + p.refNo + "</title><style>" + CSS + "</style></head><body><div class=\"hdr\"><div><div class=\"firm\">TITLEMATRIXAI</div><div class=\"sub\">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class=\"sub\">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div><div class=\"sub\">support@titlematrixai.com | www.titlematrixai.com</div></div><div class=\"hdr-right\"><div><strong>Reference No.:</strong> " + p.refNo + "</div><div><strong>Application ID:</strong> " + p.appId + "</div><div><strong>Report Date:</strong> " + p.today + "</div><div><strong>Bank:</strong> " + p.bankName + "</div></div></div><div class=\"rtitle\">LEGAL SCRUTINY REPORT -- " + p.loanType + "</div><hr>" + p.p123 + p.p45 + p.p678 + p.p911 + "<hr><div class=\"sigrow\"><div class=\"sigbox\"><div class=\"sigline\"></div><div style=\"font-size:11px;font-weight:bold;\">TITLEMATRIXAI</div><div style=\"font-size:10px;color:#666;\">Date: " + p.today + "</div></div><div class=\"sigbox\"><div class=\"sigline\"></div><div style=\"font-size:11px;font-weight:bold;\">Authorised Signatory</div><div style=\"font-size:10px;color:#666;\">" + p.bankName + " -- " + p.appId + "</div></div></div><div class=\"ftr\">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class=\"disc\">DISCLAIMER: This report is prepared exclusively for " + p.bankName + " for Application ID " + p.appId + ". It is based solely on the documents produced for examination and does not constitute a guarantee of title. Confidential -- For Bank Use Only.</div><div class=\"wm\">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div></div></body></html>"
}

// ================================================================
// MAIN HANDLER
// ================================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { images, caseType, appId, bankName, applicantName, coApplicant, propertyAddress, currentOwner, boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId } = body

        if (!images || images.length === 0)
            return NextResponse.json({ success: false, error: "No documents uploaded. Please upload EC and other property documents." }, { status: 400 })

        const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
        const refNo = "TITLEMATRIXAI/" + new Date().getFullYear() + "/" + String(Date.now()).slice(-4)
        const loanMap: Record<string, string> = { builder_purchase: "Builder Purchase", resale: "Resale Property", bt: "Balance Transfer", seller_bt: "Seller Balance Transfer", lap: "LAP (Loan Against Property)" }
        const imgContent: any[] = images.map((img: any) => ({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } }))

        // ============================================================
        // PHASE 2: EC FIRST PROTOCOL -- ULTIMATE 3-PASS SYSTEM
        // Pass 1: Full EC (rows + header)
        // Pass 2: Header-only if missing
        // Pass 3: Rows-only retry if missing
        // ============================================================
        let ecRows: ECRow[] = []
        let ecMeta = { ec_app_number: "", ec_date: "", ec_from: "", ec_to: "" }
        let lifecycle = runLifecycle([])

        // PASS 1: Full extraction
        try {
            const p1Res = await AI.messages.create({
                model: "claude-sonnet-4-6", max_tokens: 4000, temperature: 0,
                messages: [{ role: "user", content: [...imgContent, { type: "text", text: EC_PROMPT }] }]
            })
            const p1Raw = p1Res.content[0].type === "text" ? p1Res.content[0].text : "{}"
            const p1Clean = p1Raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
            const p1f = p1Clean.indexOf("{"); const p1l = p1Clean.lastIndexOf("}")
            const p1Parsed = JSON.parse(p1f >= 0 && p1l >= 0 ? p1Clean.substring(p1f, p1l + 1) : p1Clean)
            if (p1Parsed.found) {
                ecRows = p1Parsed.rows || []
                ecMeta.ec_app_number = p1Parsed.ec_app_number || ""
                ecMeta.ec_date = p1Parsed.ec_date || ""
                ecMeta.ec_from = p1Parsed.ec_from || ""
                ecMeta.ec_to = p1Parsed.ec_to || ""
                lifecycle = runLifecycle(ecRows)
                console.log("EC Pass1: " + ecRows.length + " rows | " + lifecycle.encumbrance + " | App=" + ecMeta.ec_app_number)
            }
        } catch (e) { console.log("EC Pass1 error:", e) }

        // PASS 2: Dedicated header extraction if missing
        if (!ecMeta.ec_app_number || !ecMeta.ec_date) {
            try {
                const p2Prompt = "Find the Encumbrance Certificate in these images. Look at the TOP HEADER of the EC document. Extract: 1) e-Application No (numeric code near top), 2) Date of Print, 3) Search period From date, 4) Search period To date. Output ONLY JSON: {"ec_app_number":"value","ec_date":"value","ec_from":"value","ec_to":"value"}"
                const p2Res = await AI.messages.create({
                    model: "claude-sonnet-4-6", max_tokens: 500, temperature: 0,
                    messages: [{ role: "user", content: [...imgContent, { type: "text", text: p2Prompt }] }]
                })
                const p2Raw = p2Res.content[0].type === "text" ? p2Res.content[0].text : "{}"
                const p2Clean = p2Raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
                const p2f = p2Clean.indexOf("{"); const p2l = p2Clean.lastIndexOf("}")
                const p2Parsed = JSON.parse(p2f >= 0 && p2l >= 0 ? p2Clean.substring(p2f, p2l + 1) : p2Clean)
                if (p2Parsed.ec_app_number && !ecMeta.ec_app_number) ecMeta.ec_app_number = p2Parsed.ec_app_number
                if (p2Parsed.ec_date && !ecMeta.ec_date) ecMeta.ec_date = p2Parsed.ec_date
                if (p2Parsed.ec_from && !ecMeta.ec_from) ecMeta.ec_from = p2Parsed.ec_from
                if (p2Parsed.ec_to && !ecMeta.ec_to) ecMeta.ec_to = p2Parsed.ec_to
                console.log("EC Pass2 header: App=" + ecMeta.ec_app_number + " Date=" + ecMeta.ec_date)
            } catch (e) { console.log("EC Pass2 error:", e) }
        }

        // PASS 3: Retry rows if missing
        if (ecRows.length === 0) {
            try {
                const p3Prompt = EC_PROMPT + "\n\nCRITICAL RETRY: Look at every image. Find the EC table. Extract ALL rows including the LAST row which is often Mortgage Release Deed. Extract EXACT bank names (e.g. HDFC Bank, SBI, Axis Bank) - not generic 'Bank'."
                const p3Res = await AI.messages.create({
                    model: "claude-sonnet-4-6", max_tokens: 4000, temperature: 0,
                    messages: [{ role: "user", content: [...imgContent, { type: "text", text: p3Prompt }] }]
                })
                const p3Raw = p3Res.content[0].type === "text" ? p3Res.content[0].text : "{}"
                const p3Clean = p3Raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
                const p3f = p3Clean.indexOf("{"); const p3l = p3Clean.lastIndexOf("}")
                const p3Parsed = JSON.parse(p3f >= 0 && p3l >= 0 ? p3Clean.substring(p3f, p3l + 1) : p3Clean)
                if (p3Parsed.found && p3Parsed.rows?.length > 0) {
                    ecRows = p3Parsed.rows
                    if (!ecMeta.ec_app_number && p3Parsed.ec_app_number) ecMeta.ec_app_number = p3Parsed.ec_app_number
                    if (!ecMeta.ec_date && p3Parsed.ec_date) ecMeta.ec_date = p3Parsed.ec_date
                    if (!ecMeta.ec_from && p3Parsed.ec_from) ecMeta.ec_from = p3Parsed.ec_from
                    if (!ecMeta.ec_to && p3Parsed.ec_to) ecMeta.ec_to = p3Parsed.ec_to
                    lifecycle = runLifecycle(ecRows)
                    console.log("EC Pass3: " + ecRows.length + " rows | " + lifecycle.encumbrance)
                }
            } catch (e) { console.log("EC Pass3 error:", e) }
        }

        console.log("EC FINAL: App=" + (ecMeta.ec_app_number || "MISSING") + " Date=" + (ecMeta.ec_date || "MISSING") + " Rows=" + ecRows.length + " Status=" + lifecycle.encumbrance)

        const existingBank = lifecycle.active.length > 0 ? lifecycle.active[0].lender : lifecycle.released.length > 0 ? lifecycle.released[0].lender : "N/A"
        const GT = "=== EC GROUND TRUTH -- DO NOT CONTRADICT ===\nEC App No: " + (ecMeta.ec_app_number || "NOT PROVIDED") + " | Date of Print: " + (ecMeta.ec_date || "NOT PROVIDED") + "\nSearch Period: " + (ecMeta.ec_from || "NOT PROVIDED") + " to " + (ecMeta.ec_to || "NOT PROVIDED") + "\nEC Rows Found: " + ecRows.length + " | Encumbrance Status: " + lifecycle.encumbrance + "\nMortgage Summary: " + lifecycle.summary + "\nActive Mortgages: " + (lifecycle.active.length === 0 ? "NONE" : lifecycle.active.map(a => a.lender + " Deed:" + a.deed_no + " Date:" + a.date).join(" | ")) + "\nReleased Mortgages: " + (lifecycle.released.length === 0 ? "NONE" : lifecycle.released.map(r => r.lender + " RELEASED vide Deed No." + r.release_deed_no + " on " + r.release_date).join(" | ")) + "\nExisting Bank: " + existingBank + "\nRULE: RELEASED=never flag active | ACTIVE=HIGH SEVERITY | EC Col7=NEVER\n=== END GROUND TRUTH ==="

        const ecTbl = ecTableHTML(ecRows, lifecycle)
        const opinion = getLegalOpinion(caseType, currentOwner || "Owner", applicantName || "Applicant", existingBank)

        // LAYER 1
        const l1Res = await AI.messages.create({
            model: "claude-sonnet-4-6", max_tokens: 6000, temperature: 0, system: SYS_L1,
            messages: [{ role: "user", content: [...imgContent, { type: "text", text: "LAYER 1 -- EXTRACT ALL DOCUMENTS\nCASE: " + caseType + " | BANK: " + bankName + " | APP: " + appId + "\nAPPLICANT: " + applicantName + " | CO-APPLICANT: " + (coApplicant || "None") + " | CURRENT OWNER: " + currentOwner + "\nPROPERTY: " + propertyAddress + "\nBOUNDARIES: E=" + (boundaryEast || "N/A") + " W=" + (boundaryWest || "N/A") + " N=" + (boundaryNorth || "N/A") + " S=" + (boundarySouth || "N/A") + "\n" + GT + "\nEC already extracted above. Use Ground Truth. Apply advocate protocols." }] }]
        })
        const facts = l1Res.content[0].type === "text" ? l1Res.content[0].text : ""

        // LAYER 2+3
        const l23Res = await AI.messages.create({
            model: "claude-sonnet-4-6", max_tokens: 6000, temperature: 0, system: SYS_L23(caseType),
            messages: [{ role: "user", content: "LAYER 2+3 -- TITLE VERIFICATION + RISK\nCASE: " + caseType + " | BANK: " + bankName + "\nAPPLICANT: " + applicantName + " | OWNER: " + currentOwner + "\n" + GT + "\nL1 FACTS:\n" + facts + "\nFill META block. Apply all red flags checklist. Apply revenue 7-check protocol." }]
        })
        const analysis = l23Res.content[0].type === "text" ? l23Res.content[0].text : ""
        const meta = parseMeta(analysis)
        const ctx = GT + "\nFACTS:\n" + facts + "\nANALYSIS:\n" + analysis

        // LAYER 4 -- 4 PARALLEL CALLS
        const [r4a, r4b, r4c, r4d] = await Promise.all([
            AI.messages.create({
                model: "claude-sonnet-4-6", max_tokens: 4000, temperature: 0, system: SYS_4A,
                messages: [{ role: "user", content: "PARTS I+II+III\nAPPLICANT: " + (meta.applicant || applicantName) + "\nCO-APPLICANT: " + (meta.coApplicant || coApplicant || "Not Applicable") + "\nCURRENT OWNER: " + (meta.currentOwner || currentOwner) + "\nPROPERTY: " + (meta.propertyPara || propertyAddress) + "\nBOUNDARIES: E:" + (boundaryEast || "As per docs") + " W:" + (boundaryWest || "As per docs") + " N:" + (boundaryNorth || "As per docs") + " S:" + (boundarySouth || "As per docs") + "\nEC: App.No." + (ecMeta.ec_app_number || "N/A") + " Date:" + (ecMeta.ec_date || "N/A") + " Period:" + (ecMeta.ec_from || "N/A") + " to " + (ecMeta.ec_to || "N/A") + " Total Rows:" + ecRows.length + "\nBANK: " + bankName + "\n" + ctx + "\nRULE: Part III has NO illegibility/blank/not-provided remarks." }]
            }),
            AI.messages.create({
                model: "claude-sonnet-4-6", max_tokens: 4000, temperature: 0, system: SYS_4B,
                messages: [{ role: "user", content: "PARTS IV+V\nCASE: " + caseType + " | OWNER: " + (meta.currentOwner || currentOwner) + "\nAPPLICANT: " + (meta.applicant || applicantName) + "\nPROPERTY: " + (meta.propertyPara || propertyAddress) + "\nEC App No: " + (ecMeta.ec_app_number || "NOT PROVIDED") + " | Date: " + (ecMeta.ec_date || "NOT PROVIDED") + " | Period: " + (ecMeta.ec_from || "NOT PROVIDED") + " to " + (ecMeta.ec_to || "NOT PROVIDED") + " | Rows: " + ecRows.length + "\nENCUMBRANCE: " + lifecycle.encumbrance + "\nMORTGAGE: " + lifecycle.summary + "\nACTIVE: " + (lifecycle.active.length === 0 ? "NONE" : lifecycle.active.map(a => a.lender + " Deed:" + a.deed_no + " Date:" + a.date).join(", ")) + "\nRELEASED: " + (lifecycle.released.length === 0 ? "NONE" : lifecycle.released.map(r => r.lender + " Deed:" + r.deed_no + " RELEASED vide Release Deed:" + r.release_deed_no + " on " + r.release_date).join(", ")) + "\nREVENUE: Village=" + (meta.propertyPara?.match(/Mouje:\s*([^,]+)/)?.[1] || "Kudasan") + " | NA Status=Non-Agricultural (T.P.Scheme land)" + "\n" + ctx + "\nIMPORTANT: In Part IV, use EXACT mortgage deed numbers and release deed numbers provided above. For RELEASED mortgage, use EXACT wording: stands discharged and the charge has been fully released and satisfied vide [Release Deed] No.[Y] dated [date]. NEVER say no discharge found for a released mortgage.\nReplace [EC_TABLE_GOES_HERE] with this exact HTML:\n" + ecTbl }]
            }),
            AI.messages.create({
                model: "claude-sonnet-4-6", max_tokens: 6000, temperature: 0, system: SYS_4C,
                messages: [{ role: "user", content: "PARTS VI+VII+VIII\nBANK: " + bankName + " | CASE: " + caseType + "\nENCUMBRANCE: " + lifecycle.encumbrance + "\nACTIVE: " + (lifecycle.active.length === 0 ? "NONE" : lifecycle.active.map(a => a.lender + " Deed:" + a.deed_no).join(", ")) + "\nRELEASED: " + (lifecycle.released.length === 0 ? "NONE" : lifecycle.released.map(r => r.lender + " RELEASED").join(", ")) + "\nRISK: " + (meta.riskLevel || "MODERATE") + " | MORTGAGEABILITY: " + meta.mortgageability + " | SARFAESI: " + meta.sarfaesi + "\nRED FLAGS: " + (meta.redFlags || "NONE") + "\n" + ctx + "\nReplace [INSERT_LEGAL_OPINION] with:\n<p>" + opinion + "</p>" }]
            }),
            AI.messages.create({
                model: "claude-sonnet-4-6", max_tokens: 3000, temperature: 0, system: SYS_4D,
                messages: [{ role: "user", content: "PARTS IX+X+XI\nCASE: " + caseType + " | BANK: " + bankName + "\nOWNER: " + (meta.currentOwner || currentOwner) + " | APPLICANT: " + (meta.applicant || applicantName) + "\nPROPERTY: " + (meta.propertyPara || propertyAddress) + "\nEC App No: " + (ecMeta.ec_app_number || "NOT PROVIDED") + " | Period: " + (ecMeta.ec_from || "NOT PROVIDED") + " to " + (ecMeta.ec_to || "NOT PROVIDED") + "\nENCUMBRANCE: " + lifecycle.encumbrance + " | MORTGAGE SUMMARY: " + lifecycle.summary + "\nACTIVE: " + (lifecycle.active.length === 0 ? "NONE" : lifecycle.active.map(a => a.lender + " Deed:" + a.deed_no).join(", ")) + "\nRELEASED: " + (lifecycle.released.length === 0 ? "NONE" : lifecycle.released.map(r => r.lender + " RELEASED vide " + r.release_deed_no).join(", ")) + "\nEXISTING BANK: " + existingBank + "\nRISK: " + (meta.riskLevel || "MODERATE") + " | MORTGAGEABILITY: " + meta.mortgageability + "\n" + ctx + "\nFOR PART IX: Each item must include bold title, Source line, Purpose line. Be specific to this case -- mention exact deed numbers, bank names, flat numbers from documents." }]
            })
        ])

        let p123 = r4a.content[0].type === "text" ? r4a.content[0].text : "<p>Error Parts I-III</p>"
        let p45 = r4b.content[0].type === "text" ? r4b.content[0].text : "<p>Error Parts IV-V</p>"
        let p678 = r4c.content[0].type === "text" ? r4c.content[0].text : "<p>Error Parts VI-VIII</p>"
        const p911 = r4d.content[0].type === "text" ? r4d.content[0].text : "<p>Error Parts IX-XI</p>"

        // LAYER 5: 3-LAYER QUALITY CHECK (Advocate Protocol)
        const errors: string[] = []
        if (lifecycle.released.length > 0 && (p45.toLowerCase().includes("no release") || p45.toLowerCase().includes("no discharge")))
            errors.push("Part IV incorrectly says no discharge for RELEASED mortgage.")
        if (p123.toLowerCase().includes("illegible") || (p123.toLowerCase().includes("not provided for verification") && !p123.includes("class=\"ph\"")))
            errors.push("Part III has illegibility remarks -- move to Part VI only.")
        if (lifecycle.active.length === 0 && p678.toLowerCase().includes("active mortgage") && p678.toLowerCase().includes("high severity"))
            errors.push("Part VI incorrectly flags active mortgage when lifecycle shows NONE.")

        if (errors.length > 0) {
            try {
                const fix = await AI.messages.create({
                    model: "claude-sonnet-4-6", max_tokens: 5000, temperature: 0,
                    system: "Fix ONLY listed errors. Output: corrected Part IV HTML then ===P6=== then corrected Part VI HTML. Pure HTML only.",
                    messages: [{ role: "user", content: "ERRORS:\n" + errors.join("\n") + "\n" + GT + "\nPART IV:\n" + p45.substring(0, 3000) + "\nPART VI:\n" + p678.substring(0, 3000) }]
                })
                const ft = fix.content[0].type === "text" ? fix.content[0].text : ""
                if (ft.includes("===P6===")) {
                    const pts = ft.split("===P6===")
                    if (pts[0].trim()) p45 = pts[0].trim()
                    if (pts[1]?.trim()) p678 = pts[1].trim()
                }
            } catch (e) { console.log("Validation fix error:", e) }
        }

        const html = buildReport({ refNo, appId: appId || "AUTO", today, bankName: bankName || "Bank", loanType: loanMap[caseType] || "LAP", p123, p45, p678, p911 })
        const verdict = lifecycle.encumbrance === "ENCUMBERED" ? "NOT CLEAR" : lifecycle.encumbrance === "CLEAR" ? "CLEAR" : "CLEAR SUBJECT TO"

        if (userId && DB) {
            try {
                await DB.from("reports").insert({ user_id: userId, case_type: caseType || "lap", applicant_name: meta.applicant || applicantName || "Unknown", bank_name: bankName || "Unknown", property_address: meta.propertyPara || propertyAddress || "Unknown", app_id: appId || refNo, verdict, report_html: html })
            } catch (e) { console.log("DB error:", e) }
        }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle, ecRows, ecMeta })

    } catch (e: any) {
        console.error("Pipeline error:", e)
        return NextResponse.json({ success: false, error: e.message || "Pipeline failed" }, { status: 500 })
    }
}