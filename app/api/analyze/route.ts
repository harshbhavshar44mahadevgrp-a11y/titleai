<<<<<<< HEAD
// ================================================================
=======
﻿// ================================================================
>>>>>>> aaf4496 (FINAL: complete route all prompts EC focused)
// TITLEMATRIXAI -- /api/analyze/route.ts  FINAL COMPLETE VERSION
// All Prompts 2-6 | Steps 1-7 | EC Focused | Release Deed Fix
// temperature=0 = Same perfect report every time
// Pure ASCII | maxDuration=300 | claude-sonnet-4-6
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
// BANK DETECTION -- CODE decides, never AI. 100% correct always.
// ================================================================
const BANKS = [
<<<<<<< HEAD
  'BANK','FINANCE','HOUSING FINANCE','FINANCIAL SERVICES','NBFC',
  'CAPITAL','FINCORP','BAJAJ','HDFC','SBI','AXIS','ICICI','KOTAK',
  'PNB','BOI','CANARA','UNION BANK','INDIABULLS','LIC','LICHFL',
  'REPCO','PIRAMAL','MUTHOOT','TATA CAPITAL','ADITYA BIRLA',
  'FULLERTON','AAVAS','HOME FIRST','APTUS','SHRIRAM','GRUH',
  'MANAPPURAM','INDIA BULLS','HOME FINANCE','GOLD LOAN','CREDIT',
=======
  'BANK', 'FINANCE', 'HOUSING FINANCE', 'FINANCIAL SERVICES', 'NBFC',
  'CAPITAL', 'FINCORP', 'BAJAJ', 'HDFC', 'SBI', 'AXIS', 'ICICI', 'KOTAK',
  'PNB', 'BOI', 'CANARA', 'UNION BANK', 'INDIABULLS', 'LIC', 'LICHFL',
  'REPCO', 'PIRAMAL', 'MUTHOOT', 'TATA CAPITAL', 'ADITYA BIRLA',
  'FULLERTON', 'AAVAS', 'HOME FIRST', 'APTUS', 'SHRIRAM', 'GRUH',
  'MANAPPURAM', 'INDIA BULLS', 'HOME FINANCE', 'GOLD LOAN', 'CREDIT',
>>>>>>> aaf4496 (FINAL: complete route all prompts EC focused)
]
function isBank(n: string): boolean {
  if (!n) return false
  const u = n.toUpperCase()
  return BANKS.some(b => u.includes(b))
}

// ================================================================
// DETERMINISTIC MORTGAGE LIFECYCLE ENGINE
// PASS 1: Bank in Col4 = MORTGAGE (create CHARGE)
// PASS 2: Bank in Col3 = RELEASE (role flip, update CHARGE)
// This is CODE. Never wrong. Never changes. Always correct.
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
// EC TABLE HTML -- Built from code. Always 100% correct.
// ================================================================
function ecTableHTML(rows: ECRow[], lc: ReturnType<typeof runLifecycle>): string {
  if (!rows.length) return '<p>No EC entries found in the documents produced for examination.</p>'
  let h = `<table class="ec-tbl"><tr><th>Sr.</th><th>Document Type (Classified)</th><th>Deed No.</th><th>Date</th><th>Col 3 - Executing Party (Aapnar)</th><th>Col 4 - Claimant Party (Lenar)</th><th>Mortgage Status</th></tr>`
  for (const r of rows) {
    const isRelRow = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
    const isMortRow = isBank(r.col4_lenar) && !isBank(r.col3_aapnar)
    const isActMort = lc.active.some((c: Charge) => c.row === r.row_number)
    let cls = '', status = '', type = r.col1_type || 'Transaction'
    if (isRelRow) { cls = 'ec-rel'; status = 'DISCHARGED / RELEASED'; type = 'Reconveyance / Mortgage Release Deed' }
    else if (isMortRow && isActMort) { cls = 'ec-act'; status = 'ACTIVE MORTGAGE'; type = 'Mortgage Deed' }
    else if (isMortRow && !isActMort) { cls = 'ec-rel'; status = 'MORTGAGE - RELEASED'; type = 'Mortgage Deed' }
    else { status = 'Transaction' }
    h += `<tr><td>${r.row_number}</td><td>${type}</td><td>${r.col6_deed_no || '--'}</td><td>${r.col5_date || '--'}</td><td>${r.col3_aapnar || '--'}</td><td>${r.col4_lenar || '--'}</td><td class="${cls}">${status}</td></tr>`
  }
  return h + '</table>'
}

// ================================================================
// LEGAL OPINION -- EXACT WORDING from Master System Prompt
// ================================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
  const sarfaesi = `The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`
  const sarfaesiSubject = `The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`
  const base = `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that`
  const ops: Record<string, string> = {
    builder_purchase: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${sarfaesi}`,
    resale: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${sarfaesi}`,
    bt: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${sarfaesiSubject}`,
    seller_bt: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${owner} and after the execution and registration of sale deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${sarfaesiSubject}`,
    lap: `${base} the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. ${sarfaesi}`,
  }
  return ops[ct] || ops['lap']
}

// ================================================================
// CSS STYLES
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:5px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}}`

// ================================================================
// SYSTEM PROMPTS -- All Layers
// ================================================================

// LAYER 1: Document Extraction + EC + Steps 1-7 + Lifecycle
const SYS_L1 = `You are the Document Extraction Engine (Layer 1) of TITLEMATRIXAI.
You implement: Master System Prompt + Prompt 2 + Prompt 4 + Steps 1-7 + Mortgage Lifecycle Engine.

MASTER NON-NEGOTIABLE RULES:
- NEVER assume facts. NEVER create facts. NEVER infer without documentary support.
- NEVER suppress adverse findings.
- Unavailable = "NOT PROVIDED FOR VERIFICATION."
- NEVER "and others" -- every person individually always.
- EC Col 7 (Last column) = NEVER READ. NEVER MENTION. NEVER EXTRACT.
- EC Applicant name from header = COMPLETELY IGNORE. Zero property interest.
- Stamp Paper Number = NEVER mention anywhere.
- Loan Amount = NEVER mention anywhere.

PROMPT 2 -- DOCUMENT EXTRACTION:
For EVERY document extract ALL of:
Document Type | Registration Date (NOT stamp paper) | Registration Number
Executant (EVERY person -- never "and others") | Claimant (EVERY person)
Property Description | Survey/Block No. | Village | Taluka | District | Area | Boundaries

PROPERTY DESCRIPTION MANDATORY PARAGRAPH FORMAT:
"Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

PROMPT 4 -- EC COLUMN MAPPING (STRICT):
COL 1: Type of Deed (apply Steps 1-7)
COL 2: Property Description
COL 3: Executing Party = Dastavej Kari Aapnar = who GIVES/EXECUTES
COL 4: Claimant Party = Dastavej Kari Lenar = who RECEIVES
COL 5: Date of Registration
COL 6: Registration Number (second last column)
COL 7: LAST COLUMN -- NEVER READ. NEVER MENTION. ABSOLUTE PERMANENT RULE.

EC RECEIPT EXTRACTION (MANDATORY):
EC_APP_NUMBER = from "e-Application No."
EC_DATE = "Date of Print" on the EC
EC_FROM = search period start date
EC_TO = search period end date
Count ACTUAL rows yourself. Header count unreliable.

MORTGAGE LIFECYCLE ENGINE:
STEP A: For every row where Col4 has Bank/Finance/NBFC name:
  -> This is MORTGAGE -> Create CHARGE RECORD
  Bank identifiers: BANK/FINANCE/HOUSING FINANCE/NBFC/CAPITAL/BAJAJ/HDFC/SBI/AXIS/ICICI/KOTAK/PNB/BOI/CANARA/INDIABULLS/LIC/LICHFL/REPCO/PIRAMAL/MUTHOOT/TATA/FULLERTON/AAVAS etc.

STEP B: ROLE FLIP RULE -- CRITICAL:
  MORTGAGE: Col3=BORROWER, Col4=BANK (bank receives mortgage)
  RELEASE:  Col3=BANK,     Col4=BORROWER (bank GIVING back title = ROLE FLIPPED)
  When Bank appears in Col3 (Aapnar/Executing) -> RELEASE EVENT -> matching CHARGE = RELEASED
  Release keywords: Giro Mukeli/Mukti/Release/Reconveyance/Discharge/Satisfaction of Mortgage

STEP C -- OUTPUT MANDATORY:
MORTGAGE_LIFECYCLE_SUMMARY:
  A. ACTIVE_MORTGAGES: [list or NIL]
  B. RELEASED_MORTGAGES: [list with release deed details or NIL]
  C. UNMATCHED_RELEASES: [releases without matching mortgage or NIL]
  D. ENCUMBRANCE_STATUS: [CLEAR / ENCUMBERED / CLEAR_WITH_PRIOR_RELEASE]
RULE: NEVER report ACTIVE if corresponding release found.

STEPS 1-7 EC CLASSIFICATION:
STEP 1: Record EXACT Col1 text as RAW_DOC_TYPE_TEXT (no modification)
STEP 2: Normalize (strip artifacts, variants = same)
STEP 3: Match taxonomy (Exact -> Synonym -> Contextual)
STEP 4: Disambiguate (Bank Col3=Release, Bank Col4=Mortgage)
STEP 5: If no match: "DOCUMENT TYPE NOT IDENTIFIABLE -- RAW TEXT: [X] -- REQUIRES MANUAL REVIEW"
STEP 6: Tag confidence (EXACT/SYNONYM/CONTEXTUAL/UNIDENTIFIED)
STEP 7: Output EC_ROW_[N] with all fields including COL3_IS_BANK and COL4_IS_BANK

TAXONOMY (use ONLY these English types):
Sale Deed | Absolute Sale Deed | Conveyance Deed | Gift Deed | Release Deed | Relinquishment Deed | Partition Deed | Family Settlement Deed | Exchange Deed | Mortgage Deed | Simple Mortgage Deed | Equitable Mortgage | Mortgage Release Deed | Reconveyance Deed | Lease Deed | Leave and License Agreement | Rent Agreement | Development Agreement | Joint Development Agreement | Agreement to Sell | Agreement to Sell Without Possession | Banakhat | Power of Attorney | General Power of Attorney | Special Power of Attorney | POA under Section 45-A | Revocation of POA | Will | Probate | Succession Certificate | Legal Heir Certificate | Affidavit | Declaration Deed | Indemnity Bond | Rectification Deed | Confirmation Deed | Cancellation Deed | Settlement Deed | Trust Deed | Partnership Deed | Deed of Admission | Deed of Retirement | Deed of Dissolution | Lis Pendens`

// LAYER 2+3: Title Verification + Risk + Meta
function SYS_L23(ct: string): string {
  const metaBlocks: Record<string, string> = {
    builder_purchase: `---META---
APPLICANT: [From Draft Sale Deed/Banakhat/Allotment -- Buyer/Second Party -- NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format from Prompt 2]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Builder/Developer from title documents]
EC_APP_NUMBER: [from EC Receipt]
EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end]
EC_ROW_COUNT: [actual row count]
MORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X dated D / ACTIVE -- Bank:X Deed:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A]
---END META---`,
    resale: `---META---
APPLICANT: [Second Party/Buyer from Draft Deed/Banakhat -- NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [First Party/Seller -- ALL names individually]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X / ACTIVE -- Bank:X Deed:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A or bank name if active mortgage]
---END META---`,
    bt: `---META---
APPLICANT: [Current owner/borrower -- full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE -- Bank:[X] Deed No:[Y] dated [Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Existing bank name from EC]
---END META---`,
    seller_bt: `---META---
APPLICANT: [Proposed purchaser -- from Draft Deed/Banakhat -- Buyer]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Seller -- First Party -- ALL names individually]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE -- Bank:[X] Deed No:[Y] dated [Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Existing bank name from EC]
---END META---`,
    lap: `---META---
APPLICANT: [Current owner/mortgagor -- full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE / UNDISCLOSED if found]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Not Mortgageable if encumbered]
SARFAESI: [Enforceable / Not Enforceable if encumbered]
LENDING_SUITABILITY: [Suitable / Not Suitable if encumbered]
EXISTING_BANK: [N/A]
---END META---`
  }
  const k = metaBlocks[ct] ? ct : 'lap'
  return `You are Layer 2 (Title Verification) and Layer 3 (Risk Assessment) of TITLEMATRIXAI.

MASTER RULES: Never assume. Never create. Never suppress. Unavailable = "NOT PROVIDED FOR VERIFICATION."

PROMPT 3 -- TITLE VERIFICATION:
Establish complete chronological title flow.
Every transfer needs documentary support. Missing = TITLE BREAK | Severity: CRITICAL.
Recognize ALL deed types from taxonomy.
Output: Title Chain | Missing Links | Defective Transfers | Title Continuity Status

PROMPT 5 -- MORTGAGEABILITY & RISK:
Risk: HIGH | MODERATE | LOW
Mortgageability: Mortgageable | Conditionally Mortgageable | Not Mortgageable
SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
Lending Suitability: Suitable | Conditionally Suitable | Not Suitable
Security Coverage: Adequate | Marginal | Inadequate

EC RULES (CRITICAL):
- Use Layer 1 MORTGAGE_LIFECYCLE_SUMMARY as ground truth
- RELEASED mortgage = DO NOT flag as alert. Charge is fully satisfied.
- ACTIVE mortgage = flag HIGH SEVERITY
- NEVER override RELEASED to ACTIVE without explicit new evidence
- EC Col 7 = NEVER | EC Applicant = IGNORE | Loan Amount = NEVER

CASE: ${k.toUpperCase().replace(/_/g, ' ')}

OUTPUT META BLOCK (fill with actual extracted values):
${metaBlocks[k]}`
}

function parseMeta(t: string) {
  const b = t.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const g = (k: string) => b.match(new RegExp(`^${k}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'), mortgagor: g('MORTGAGOR'),
    propertyPara: g('PROPERTY_PARA'), propertyBoundaries: g('PROPERTY_BOUNDARIES'),
    currentOwner: g('CURRENT_OWNER'), ecAppNumber: g('EC_APP_NUMBER'), ecDate: g('EC_DATE'),
    ecFrom: g('EC_FROM'), ecTo: g('EC_TO'), ecRowCount: g('EC_ROW_COUNT'),
    mortgageSummary: g('MORTGAGE_SUMMARY'), riskLevel: g('RISK_LEVEL'),
    mortgageability: g('MORTGAGEABILITY'), sarfaesi: g('SARFAESI'),
    lendingSuitability: g('LENDING_SUITABILITY'), existingBank: g('EXISTING_BANK'),
  }
}

// LAYER 4 PROMPTS -- Prompt 6 -- All 11 Parts
const SYS_4A = `Layer 4 Report Generator -- PART I + PART II + PART III (Prompt 6).
PURE HTML ONLY. No markdown. No commentary.

PART I: <hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt">
<tr><td>Name of Borrower/s</td><td>:</td><td>[Every person individually -- NEVER "and others"]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Names or "Not Applicable"]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Company / HUF / Trust]</td></tr>
</table>
<div class="sph">B. Mortgagor Details</div>
<table class="mt">
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[Same as Borrower OR full names]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual]</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest deed -- never "and others"]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift / Court Decree / Succession]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO Name]</td></tr>
</table>

PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[EXACT paragraph format: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt">
<tr><td>East (Purva)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[boundary]</td></tr>
</table>

PART III: <hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
RULE: Include ALL submitted documents. NO "ILLEGIBLE"/"BLANK"/"NOT PROVIDED" here -- those go ONLY in Part VI.
For each document (latest first):
<div class="di"><p><span class="dn">N. [Document Type] -- Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Executant/s individually] unto and in favour of [Claimant/s individually] registered at Sub-Registrar Office, [SRO]. [2-3 sentences description -- no illegibility remarks.]</p></div>
For EC:
<div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [no] | Dated: [date] | Search Period: [from] to [to]</span><br>EC bearing E-Application No. [no] dated [date] for period [from] to [to] issued by IGR, Revenue Department, Government of Gujarat. [N] transaction/s found on row-by-row examination. [Brief summary of encumbrance status.]</p></div>
START OUTPUT WITH: <hr><div class="ph">PART I`

const SYS_4B = `Layer 4 Report Generator -- PART IV + PART V (Prompt 6).
PURE HTML ONLY. No markdown. No commentary.

PART IV: <hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
RULES:
- Oldest first. First paragraph MUST NOT have "Thereafter".
- Every subsequent paragraph MUST start with "Thereafter,"
- NEVER say "and others" -- all names individually
- MORTGAGE RELEASED: "...stands discharged and the charge has been fully released and satisfied vide [Mortgage Release Deed / Reconveyance Deed] No. [Y] dated [DD/MM/YYYY] -- no subsisting charge remains on the property as on date."
- MORTGAGE ACTIVE: "...is subsisting and active as on date -- no Release Deed or Discharge has been found in the EC."
- NEVER say "No discharge found" for a RELEASED mortgage.
- Final paragraph must include EC App No., period, encumbrance status.

PART V: <hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">Revenue Record</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr>
<tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[H.Are.SqMt.]</td></tr>
<tr><td>Land Use / Classification</td><td>:</td><td>[Bin Kheti / Non-Agricultural = OK | Agricultural = FLAG IMMEDIATELY]</td></tr>
<tr><td>Ownership Column (Khata)</td><td>:</td><td>[Names -- flag if current owner not reflected]</td></tr>
<tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL / Details -- cross-check with EC]</td></tr>
<tr><td>Ganot / Tenant</td><td>:</td><td>[NIL / flag if tenant recorded]</td></tr>
</table>
<div class="sph">Mutation Entries (Chronological)</div>
<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Certified/Rejected</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>
[One row per mutation entry for subject property]
</table>
<div class="sph">Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>RERA Registration</td><td>:</td><td>[RERA No. OR "NOT PROVIDED FOR VERIFICATION." -- Post May 2017: MANDATORY]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
</table>
<div class="sph">Encumbrance Certificate Analysis</div>
<p>[EC_TABLE_GOES_HERE]</p>
<div class="sph">Mortgage Lifecycle Summary</div>
<table class="mt">
<tr><td>A. Active Mortgages</td><td>:</td><td>[NIL or list]</td></tr>
<tr><td>B. Released Mortgages</td><td>:</td><td>[NIL or list with release deed details]</td></tr>
<tr><td>C. Unmatched Releases</td><td>:</td><td>[NIL or list]</td></tr>
<tr><td>D. Encumbrance Status</td><td>:</td><td>[CLEAR / ENCUMBERED / CLEAR_WITH_PRIOR_RELEASE]</td></tr>
</table>
START OUTPUT WITH: <hr><div class="ph">PART IV`

const SYS_4C = `Layer 4 Report Generator -- PART VI + PART VII + PART VIII (Prompt 6).
PURE HTML ONLY. No markdown. Max 5 alerts.

PART VI: <hr><div class="ph">PART VI -- ALERTS</div>
<p>The following alerts were identified during examination. HIGH SEVERITY conditions are precedent to sanction.</p>
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[Finding with specific deed nos, dates, parties. Legal risk. 2-3 sentences.]</p><p><span class="sg">Direction:</span> [Action required.]</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[1-2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
CRITICAL ALERT RULES:
- NEVER flag a RELEASED mortgage as active encumbrance
- NEVER flag EC-confirmed registered deeds
- NEVER flag EC Applicant name as party
- UNIDENTIFIED EC entry: flag as MEDIUM with raw text for manual review
- No alerts found: <p>No material adverse findings identified. Title appears clear from the documents produced.</p>
Illegibility remarks go HERE (Part VI) -- NEVER in Part III.

PART VII: <hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted and Available</div><ol>[all readable docs]</ol>
<div class="sph">B. Critical Missing Documents</div><ol>[mandatory missing -- purpose -- risk OR "NIL"]</ol>
<div class="sph">C. Important Missing Documents</div><ol>[other missing OR "NIL"]</ol>
<div class="sph">D. Documents Illegible / Incomplete</div><ol>[unreadable OR "NIL"]</ol>
<div class="sph">E. Risk Assessment (Prompt 5)</div>
<table class="mt">
<tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
<tr><td>Mortgageability</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentences]</td></tr>
</table>

PART VIII: <hr><div class="ph">PART VIII -- LEGAL OPINION</div>
[INSERT_LEGAL_OPINION]
VERDICT based on Part VI:
HIGH alerts: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve all HIGH SEVERITY conditions listed above before proceeding with disbursement.</p></div>
MEDIUM/LOW only: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is conditionally clear. Disbursement subject to fulfillment of conditions listed in Parts VII and IX.</p></div>
No alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. Property is suitable security for the proposed loan.</p></div>
START OUTPUT WITH: <hr><div class="ph">PART VI`

const SYS_4D = `Layer 4 Report Generator -- PART IX + PART X + PART XI (Prompt 6).
PURE HTML ONLY. No markdown.

PART IX: <hr><div class="ph">PART IX -- DOCUMENTS REQUIRED -- PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody BEFORE disbursement:</p>
<ol>
[Generate case-specific list:
Builder Purchase: NOC from Builder | NOC from Project Finance Bank if applicable | Draft/Registered Sale Deed or Banakhat | Allotment Letter | Missing docs from Part VII
Resale: Draft Sale Deed / Banakhat | Complete chain of title | Missing docs from Part VII
Balance Transfer: Letter of Discharge (LOD) from existing Bank | Foreclosure Letter | Outstanding Certificate | NOC from existing Bank | CERSAI Search Report | Updated EC
Seller BT: Draft Sale Deed | Foreclosure Letter | LOD | NOC from existing Bank | CERSAI Search | Updated EC
LAP: Original Registered Sale Deed | Updated EC showing NIL encumbrance | CERSAI Search Report]
</ol>

PART X: <hr><div class="ph">PART X -- DOCUMENTS REQUIRED -- POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody AFTER disbursement:</p>
<ol>
[Generate case-specific list:
Builder Purchase: Final Registered Sale Deed (Builder to Purchaser) | Original Title Documents from Builder
Resale: Final Registered Sale Deed (Seller to Purchaser) | Original chain documents
Balance Transfer: No-Due Certificate from existing Bank | Registered Release Deed from existing Bank | Original Title Documents | Updated EC confirming NIL encumbrance
Seller BT: Registered Sale Deed | Registered Release Deed | No-Due Certificate | Original Title Docs | Updated EC
LAP: Registered Mortgage / MODT in favour of Bank | CERSAI Registration Confirmation | Updated EC post-mortgage confirming charge]
</ol>

PART XI: <hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec">
<div class="fr-title">Final Title Status (select one as per Part VIII verdict):</div>
<div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div>
</div>
<p style="margin-top:16px;">[3-4 sentences: overall title status, whether bank can proceed, key conditions if any, mortgage encumbrance status from lifecycle summary.]</p>
START OUTPUT WITH: <hr><div class="ph">PART IX`

// ================================================================
// REPORT HTML BUILDER
// ================================================================
function buildReport(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; p123: string; p45: string; p678: string; p911: string }): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report -- ${p.refNo}</title><style>${CSS}</style></head><body>
<div class="hdr">
<div><div class="firm">TITLEMATRIXAI</div>
<div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div>
<div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div>
<div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div>
<div class="hdr-right">
<div><strong>Reference No.:</strong> ${p.refNo}</div>
<div><strong>Application ID:</strong> ${p.appId}</div>
<div><strong>Report Date:</strong> ${p.today}</div>
<div><strong>Bank:</strong> ${p.bankName}</div>
</div></div>
<div class="rtitle">LEGAL SCRUTINY REPORT -- ${p.loanType}</div><hr>
${p.p123}${p.p45}${p.p678}${p.p911}
<hr>
<div class="sigrow">
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div>
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName} -- ${p.appId}</div></div>
</div>
<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com
<div class="disc">DISCLAIMER: This report is prepared exclusively for ${p.bankName} for Application ID ${p.appId}. It is based solely on the documents produced for examination and does not constitute a guarantee of title. Confidential -- For Bank Use Only.</div>
<div class="wm">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div></div>
</body></html>`
}

// ================================================================
// MAIN POST HANDLER
// ================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { images, caseType, appId, bankName, loanType,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId } = body

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`
    const loanMap: Record<string, string> = { builder_purchase: 'Builder Purchase', resale: 'Resale Property', bt: 'Balance Transfer', seller_bt: 'Seller Balance Transfer', lap: 'LAP (Loan Against Property)' }

    // Build image content array for API calls
    const imgContent: any[] = []
    if (images?.length) for (const img of images)
      imgContent.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })

    // ============================================================
    // STEP 0: DEDICATED EC EXTRACTION
    // Separate focused call -- EC must be found any how
    // Higher priority than Layer 1 for EC data
    // ============================================================
    let ecRows: ECRow[] = []
    let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
    let lifecycle = runLifecycle([])

    if (imgContent.length > 0) {
      try {
        const ecRes = await AI.messages.create({
          model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
          messages: [{
            role: 'user', content: [...imgContent, {
              type: 'text', text: `TASK: Find the Encumbrance Certificate (EC) document in these images.
EC title is "Milakat parna boja angenu patrak" or "Encumbrance Certificate" in Gujarati/English.
It is a government document with a TABLE showing property transactions.

Extract ALL data. Output ONLY this JSON (no markdown, no explanation):
{
  "found": true,
  "ec_app_number": "e-Application number from EC header",
  "ec_date": "Date of Print from EC header",
  "ec_from": "search period start date",
  "ec_to": "search period end date",
  "rows": [
    {
      "row_number": 1,
      "col1_type": "exact text from column 1 (type of deed)",
      "col3_aapnar": "executing party name from column 3",
      "col4_lenar": "claimant party name from column 4",
      "col5_date": "date from column 5",
      "col6_deed_no": "deed/registration number from column 6"
    }
  ]
}

RULES:
- Extract EVERY row -- do not skip last row (often Release Deed)
- Column 7 (LAST column) = DO NOT EXTRACT -- ignore completely
- EC applicant name from header = DO NOT INCLUDE
- If no EC found in images: {"found": false, "rows": []}
- Output ONLY the JSON`
            }]
          }]
        })
        const raw = ecRes.content[0].type === 'text' ? ecRes.content[0].text : '{}'
        const parsed = JSON.parse(raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim())
        if (parsed.found && parsed.rows?.length > 0) {
          ecRows = parsed.rows
          ecMeta = { ec_app_number: parsed.ec_app_number || '', ec_date: parsed.ec_date || '', ec_from: parsed.ec_from || '', ec_to: parsed.ec_to || '' }
          lifecycle = runLifecycle(ecRows)
          console.log('EC Step 0: found', ecRows.length, 'rows | Status:', lifecycle.encumbrance)
        }
      } catch (e) { console.log('EC Step 0 failed:', e) }
    }

    // EC ground truth -- injected into ALL AI calls
    const existingBank = lifecycle.active.length > 0 ? lifecycle.active[0].lender : lifecycle.released.length > 0 ? lifecycle.released[0].lender : 'N/A'
    const GT = `
=== EC GROUND TRUTH (DETERMINISTIC CODE RESULT -- DO NOT CONTRADICT) ===
EC App No: ${ecMeta.ec_app_number} | EC Date: ${ecMeta.ec_date}
Search Period: ${ecMeta.ec_from} to ${ecMeta.ec_to}
EC Rows Found: ${ecRows.length}
Encumbrance Status: ${lifecycle.encumbrance}
Mortgage Summary: ${lifecycle.summary}
Active Mortgages: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => `${a.lender} Deed:${a.deed_no} Date:${a.date}`).join(' | ')}
Released Mortgages: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => `${r.lender} RELEASED vide Deed No.${r.release_deed_no} on ${r.release_date}`).join(' | ')}
Existing Bank (if any): ${existingBank}
RULE: RELEASED = DO NOT flag as alert. ACTIVE = flag HIGH SEVERITY. EC Col7 = NEVER.
=== END GROUND TRUTH ===`

    const ecTbl = ecTableHTML(ecRows, lifecycle)
    const opinion = getLegalOpinion(caseType, currentOwner || 'Owner', applicantName || 'Applicant', '', existingBank)

    // ============================================================
    // LAYER 1: Full Document Extraction (Prompt 2 + Prompt 4 + Steps 1-7)
    // ============================================================
    const l1Res = await AI.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
      system: SYS_L1,
      messages: [{
        role: 'user', content: [...imgContent, {
          type: 'text', text: `LAYER 1 -- EXTRACT ALL DOCUMENTS
CASE: ${caseType} | BANK: ${bankName} | APP: ${appId}
Applicant: ${applicantName} | Co: ${coApplicant || 'None'} | Owner: ${currentOwner}
Property: ${propertyAddress}
Boundaries: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}
${GT}
INSTRUCTIONS:
1. Extract ALL documents individually (NEVER "and others")
2. EC data already extracted above (Ground Truth). Use it. Do not re-extract EC.
3. Apply Steps 1-7 classification for each EC row using Ground Truth data
4. Output MORTGAGE_LIFECYCLE_SUMMARY using Ground Truth (A/B/C/D)
5. EC Col 7 = NEVER | EC Applicant = IGNORE | Loan Amount = NEVER`
        }]
      }]
    })
    const facts = l1Res.content[0].type === 'text' ? l1Res.content[0].text : ''

    // ============================================================
    // LAYER 2+3: Title Verification + Risk (Prompt 3 + Prompt 5)
    // ============================================================
    const l23Res = await AI.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
      system: SYS_L23(caseType),
      messages: [{
        role: 'user', content: `LAYER 2+3 -- TITLE VERIFICATION + RISK
CASE: ${caseType} | BANK: ${bankName} | APP: ${appId}
APPLICANT: ${applicantName} | CO: ${coApplicant || 'None'} | OWNER: ${currentOwner}
PROPERTY: ${propertyAddress}
BOUNDARIES: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}
${GT}
LAYER 1 FACTS:
${facts}
FILL META BLOCK:
- Use EC Ground Truth for all EC fields
- RELEASED mortgage -> MORTGAGE_SUMMARY = "RELEASED" -> DO NOT flag alert
- ACTIVE mortgage -> MORTGAGE_SUMMARY = "ACTIVE" -> flag HIGH SEVERITY
- Names individually. NEVER "and others".`
      }]
    })
    const analysis = l23Res.content[0].type === 'text' ? l23Res.content[0].text : ''
    const meta = parseMeta(analysis)

    // ============================================================
    // LAYER 4: 4 Parallel Calls -- 11-Part Report (Prompt 6)
    // ============================================================
    const ctx = `${GT}\nL1 FACTS:\n${facts}\nL23 ANALYSIS:\n${analysis}`

    const [r4a, r4b, r4c, r4d] = await Promise.all([

      AI.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4A,
        messages: [{
          role: 'user', content: `Parts I + II + III.
APPLICANT: ${meta.applicant || applicantName} | CO: ${meta.coApplicant || coApplicant || 'Not Applicable'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
OWNER: ${meta.currentOwner || currentOwner}
PROPERTY PARA: ${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || 'As per docs'} W:${boundaryWest || 'As per docs'} N:${boundaryNorth || 'As per docs'} S:${boundarySouth || 'As per docs'}
EC: App No.${meta.ecAppNumber || ecMeta.ec_app_number || 'N/A'} Date:${meta.ecDate || ecMeta.ec_date || 'N/A'} Period:${meta.ecFrom || ecMeta.ec_from || 'N/A'} to ${meta.ecTo || ecMeta.ec_to || 'N/A'} Rows:${ecRows.length}
BANK: ${bankName}
${ctx}
PART III RULE: NO illegibility/blank/not-provided remarks. Those go ONLY in Part VI.`
        }]
      }),

      AI.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4B,
        messages: [{
          role: 'user', content: `Parts IV + V.
CASE: ${caseType} | PROPERTY: ${meta.propertyPara || propertyAddress} | OWNER: ${meta.currentOwner || currentOwner}
EC: App No.${ecMeta.ec_app_number || 'N/A'} Period:${ecMeta.ec_from || 'N/A'} to ${ecMeta.ec_to || 'N/A'}
ENCUMBRANCE: ${lifecycle.encumbrance}
MORTGAGE SUMMARY: ${lifecycle.summary}
ACTIVE MORTGAGES: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => `${a.lender} Deed:${a.deed_no}`).join(', ')}
RELEASED MORTGAGES: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => `${r.lender} RELEASED vide ${r.release_deed_no}`).join(', ')}
${ctx}
For [EC_TABLE_GOES_HERE] in Part V, insert this EXACT HTML:
${ecTbl}
PART IV: First para NO "Thereafter". Each subsequent MUST start "Thereafter,".
RELEASED mortgage para: "stands discharged and charge fully released and satisfied"
ACTIVE mortgage para: "subsisting and active as on date"
NEVER say "no discharge" for RELEASED mortgage.`
        }]
      }),

      AI.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: SYS_4C,
        messages: [{
          role: 'user', content: `Parts VI + VII + VIII. Max 5 alerts.
BANK: ${bankName} | CASE: ${caseType}
ENCUMBRANCE: ${lifecycle.encumbrance}
ACTIVE: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no).join(', ')}
RELEASED: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED').join(', ')}
RISK: ${meta.riskLevel || 'MODERATE'} | MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi} | LENDING: ${meta.lendingSuitability}
${ctx}
For [INSERT_LEGAL_OPINION] in Part VIII, insert:
<p>${opinion}</p>
ALERT RULES: NEVER flag released mortgage. NEVER flag EC Applicant. NEVER flag EC-confirmed deeds.
Illegibility remarks go in Part VI -- NEVER in Part III.`
        }]
      }),

      AI.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: SYS_4D,
        messages: [{
          role: 'user', content: `Parts IX + X + XI.
CASE: ${caseType} | BANK: ${bankName}
OWNER: ${meta.currentOwner || currentOwner} | APPLICANT: ${meta.applicant || applicantName}
EXISTING BANK: ${existingBank} | ENCUMBRANCE: ${lifecycle.encumbrance}
MORTGAGE: ${lifecycle.summary}
${ctx}`
        }]
      })
    ])

    let p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error generating Parts I-III</p>'
<<<<<<< HEAD
    let p45  = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error generating Parts IV-V</p>'
=======
    let p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error generating Parts IV-V</p>'
>>>>>>> aaf4496 (FINAL: complete route all prompts EC focused)
    let p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error generating Parts VI-VIII</p>'
    const p911 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error generating Parts IX-XI</p>'

    // ============================================================
    // LAYER 5: VALIDATION -- Auto-fix critical errors
    // ============================================================
    const errors: string[] = []
    if (lifecycle.released.length > 0 && (p45.toLowerCase().includes('no release') || p45.toLowerCase().includes('no discharge')))
      errors.push('Part IV incorrectly says no discharge for a RELEASED mortgage.')
    if (p123.toLowerCase().includes('illegible') || p123.toLowerCase().includes('not provided for verification'))
      errors.push('Part III has illegibility remarks -- must be in Part VI only.')
    if (lifecycle.active.length === 0 && p678.toLowerCase().includes('active mortgage') && p678.toLowerCase().includes('high severity'))
      errors.push('Part VI flags active mortgage but lifecycle shows NONE active.')

    if (errors.length > 0) {
      try {
        const fix = await AI.messages.create({
          model: 'claude-sonnet-4-6', max_tokens: 5000, temperature: 0,
          system: 'Fix ONLY the listed errors. Output: corrected Part IV HTML, then ===P6===, then corrected Part VI HTML. Pure HTML only.',
          messages: [{
            role: 'user', content: `ERRORS TO FIX:\n${errors.join('\n')}\n${GT}\nPART IV:\n${p45.substring(0, 3000)}\nPART VI:\n${p678.substring(0, 3000)}`
          }]
        })
        const ft = fix.content[0].type === 'text' ? fix.content[0].text : ''
        if (ft.includes('===P6===')) {
          const pts = ft.split('===P6===')
          if (pts[0].trim()) p45 = pts[0].trim()
          if (pts[1]?.trim()) p678 = pts[1].trim()
        }
      } catch (e) { console.log('Validation fix error:', e) }
    }

    // Build final report
    const html = buildReport({ refNo, appId: appId || 'AUTO', today, bankName: bankName || 'Bank', loanType: loanMap[caseType] || 'LAP', p123, p45, p678, p911 })
    const verdict = lifecycle.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR' : lifecycle.encumbrance === 'CLEAR' ? 'CLEAR' : 'CLEAR SUBJECT TO'

    // Save to Supabase
    if (userId && DB) {
      try {
        await DB.from('reports').insert({ user_id: userId, case_type: caseType || 'lap', applicant_name: meta.applicant || applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: meta.propertyPara || propertyAddress || 'Unknown', app_id: appId || refNo, verdict, report_html: html })
      } catch (e) { console.log('DB save error:', e) }
    }

    return NextResponse.json({ success: true, report: html, verdict, lifecycle, ecRows, ecMeta })

  } catch (e: any) {
    console.error('TITLEMATRIXAI pipeline error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
  }
}
