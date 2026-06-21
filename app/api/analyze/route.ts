// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts
// AI MANUAL COMPLIANT — 14-PART REPORT — 10-STAGE ENGINE
// Source: 2__Ai_version_of_Manual.docx
// 4-Layer: L1=Extraction L2=Title L3=Risk L4=Report(A/B/C/D)
// ================================================================
export const maxDuration = 800
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

function extractVerdict(text: string): string {
  const u = text.toUpperCase()
  if (u.includes('DEFECTIVE TITLE') || u.includes('NOT MORTGAGEABLE') || u.includes('NOT CLEAR') || u.includes('TITLE BREAK')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO') || u.includes('CONDITIONALLY MORTGAGEABLE')) return 'CLEAR SUBJECT TO'
  if (u.includes('CLEAR AND MARKETABLE') || u.includes('MORTGAGEABLE')) return 'CLEAR'
  return 'PENDING'
}


// ================================================================
// CSS
// ================================================================
const REPORT_CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Georgia','Times New Roman',serif; font-size:13px; line-height:1.9; color:#1a1a1a; background:#fff; max-width:920px; margin:0 auto; padding:48px 60px; }
.hdr { border-bottom:3px solid #1B3A6B; padding-bottom:18px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:flex-start; }
.hdr-left .firm { font-size:22px; font-weight:bold; letter-spacing:1px; color:#1B3A6B; }
.hdr-left .sub { font-size:11px; color:#555; margin-top:2px; }
.hdr-right { text-align:right; font-size:12px; line-height:2; }
.rtitle { font-size:14px; font-weight:bold; text-align:center; text-decoration:underline; text-transform:uppercase; letter-spacing:1px; margin:16px 0 4px; }
hr { border:none; border-top:1px solid #ccc; margin:16px 0; }
.ph { font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin:22px 0 10px; background:#1B3A6B; color:#fff; padding:7px 14px; }
.sph { font-size:12px; font-weight:bold; color:#1B3A6B; margin:14px 0 6px; border-left:4px solid #1B3A6B; padding-left:10px; text-transform:uppercase; }
.mt { width:100%; margin-bottom:10px; border-collapse:collapse; }
.mt td { font-size:12px; padding:5px 4px; vertical-align:top; border-bottom:1px solid #f0f0f0; }
.mt td:first-child { width:260px; color:#555; }
.mt td:nth-child(2) { width:14px; }
.mt td:last-child { font-weight:500; }
p { margin-bottom:10px; text-align:justify; }
.prop-para { background:#f7f9fc; border-left:4px solid #1B3A6B; padding:12px 16px; margin:10px 0 14px; font-style:italic; line-height:2; }
.di { margin-bottom:16px; padding-bottom:12px; border-bottom:1px dotted #ddd; }
.dn { font-weight:bold; }
.ib { margin-bottom:22px; padding:12px 16px; border-left:4px solid #e5e7eb; background:#fafafa; border-radius:2px; }
.sh { display:inline-block; background:#b91c1c; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; letter-spacing:0.5px; border-radius:2px; }
.sm { display:inline-block; background:#b45309; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; border-radius:2px; }
.sl { display:inline-block; background:#1d4ed8; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; border-radius:2px; }
.it { font-weight:bold; font-size:13px; margin-bottom:6px; }
.sg { font-weight:bold; font-style:italic; color:#1B3A6B; }
ol { padding-left:22px; margin-bottom:10px; }
ol li { margin-bottom:5px; }
table.ec-tbl { width:100%; border-collapse:collapse; margin:10px 0; font-size:11px; }
table.ec-tbl th { background:#1B3A6B; color:#fff; padding:6px 8px; text-align:left; font-size:10px; }
table.ec-tbl td { border:1px solid #ddd; padding:6px 8px; vertical-align:top; }
table.ec-tbl tr:nth-child(even) { background:#f7f9fc; }
table.mut-tbl { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; }
table.mut-tbl th { background:#374151; color:#fff; padding:5px 8px; text-align:left; font-size:11px; }
table.mut-tbl td { border:1px solid #e5e7eb; padding:5px 8px; vertical-align:top; }
table.mut-tbl tr:nth-child(even) { background:#f9fafb; }
.released { color:#15803d; font-weight:bold; }
.active-m { color:#b91c1c; font-weight:bold; }
.vnc { margin-top:20px; padding:14px 18px; border:2px solid #b91c1c; background:#fff5f5; border-radius:2px; }
.vc  { margin-top:20px; padding:14px 18px; border:2px solid #15803d; background:#f0fdf4; border-radius:2px; }
.vs  { margin-top:20px; padding:14px 18px; border:2px solid #b45309; background:#fffbeb; border-radius:2px; }
.vt  { font-size:13px; font-weight:bold; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px; }
.final-rec { margin-top:22px; padding:18px 22px; border:3px solid #1B3A6B; background:#EFF3FB; border-radius:2px; }
.fr-title { font-size:11px; font-weight:bold; color:#1B3A6B; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase; }
.fr-value { font-size:16px; font-weight:bold; color:#1B3A6B; }
.sigrow { margin-top:50px; display:flex; justify-content:space-between; align-items:flex-end; }
.sigbox { text-align:center; }
.sigline { width:200px; border-bottom:1px solid #1a1a1a; margin:0 auto 6px; height:40px; }
.ftr { margin-top:36px; border-top:1px solid #ccc; padding-top:14px; font-size:11px; color:#666; text-align:center; }
.disc { margin-top:10px; font-size:10px; color:#999; text-align:justify; line-height:1.6; }
.wm { font-size:10px; color:#bbb; text-align:center; margin-top:8px; letter-spacing:2px; text-transform:uppercase; }
@media print { body{padding:30px 40px;} .ib{page-break-inside:avoid;} }
`


// ================================================================
// LAYER 1 — HAIKU — STAGE 2: DOCUMENT EXTRACTION ENGINE
// Special focus: EC row-by-row extraction with release pairing
// ================================================================
const LAYER1_SYSTEM = `You are the Document Extraction Engine (Stage 2 of AI Manual).
Extract ALL raw facts from documents. Do NOT generate legal opinion.

RULES FROM MANUAL:
• NEVER assume facts | NEVER create facts | NEVER infer without documents
• NEVER suppress adverse findings
• Unavailable = "NOT PROVIDED FOR VERIFICATION."

═══════════════════════════════════════════════════════
STANDARD DOCUMENT EXTRACTION:
═══════════════════════════════════════════════════════
For each document extract:
1. Document Type | 2. Registration Number | 3. Registration Date
4. Executant (ALL names — NEVER "and others") | 5. Claimant (ALL names)
6. Property Description | 7. Survey/Block Number | 8. Boundaries
Classify: Available | Missing | Illegible | Incomplete

PROPERTY DESCRIPTION FORMAT (exact from Manual):
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

═══════════════════════════════════════════════════════
MUTATION ENTRIES (Stage 4):
═══════════════════════════════════════════════════════
SKIP first column. For each entry extract:
Entry No | Entry Date | Nature | Certified/Rejected | Survey No (if matches subject) | Remarks
Last column = IGNORE.

═══════════════════════════════════════════════════════
EC ANALYSIS (Stage 5 — MOST CRITICAL — READ CAREFULLY):
═══════════════════════════════════════════════════════

STEP 1 — FROM E-APPLICATION RECEIPT EXTRACT:
  (a) EC_APPLICATION_NUMBER = the "e-Application No." / "E-Arji No."
  (b) EC_DATE = "Date of Print" / "Chhapavani Tarikh"
  (c) EC_FROM = Start date of search period
  (d) EC_TO = End date of search period
  All four are MANDATORY.

STEP 2 — EC COLUMN MAPPING (from Manual Stage 5):
  COL 1 (FIRST):  Type of Document — in Gujarati — MUST TRANSLATE TO ENGLISH
  COL 2 (SECOND): Property Description
  COL 3 (THIRD):  Executing Party = "Dastavej Kari Aapnar" = SELLER / MORTGAGOR / LENDER
  COL 4 (FOURTH): Claimant Party = "Dastavej Kari Lenar" = BUYER / MORTGAGEE / BANK / BORROWER
  COL 5 (FIFTH):  Date of Registration
  COL 6 (SIXTH / SECOND LAST): Registration Number / Dastavej Number
  COL 7 (SEVENTH / LAST): ← NEVER READ. NEVER EXTRACT. NEVER MENTION. STRICT RULE.

STEP 3 — EC HEADER COUNT WARNING:
  ⚠️ EC header text says "X registered transaction/s" — DO NOT TRUST THIS COUNT.
  Headers are WRONG in many cases.
  YOU MUST PHYSICALLY COUNT EVERY ACTUAL ROW IN THE TABLE YOURSELF.
  Read row 1, row 2, row 3 ... until no more rows exist.
  Report exactly how many rows you found — not what the header says.

STEP 4 — EC DOCUMENT TYPE TRANSLATION TABLE:
  Read Col 1 Gujarati text → match → output English:

  SALE / TRANSFER:
  "વેચાણ" | "વેચાણ ખત" | "વેચાણ દસ્તાવેજ" | "માલિકી ફેરખત" | "માલ ફેર ખત" | "ફેર ખત"
  → "Sale Deed / Ownership Transfer Deed"

  MORTGAGE / CHARGE:
  "ગીરો" | "ગીરો ખત" | "ગીરોખત" | "ગીરો દસ્તાવેજ" | "બોજો" | "Mortgage" | "Charge"
  → "Mortgage Deed"

  RELEASE OF MORTGAGE (CRITICAL — THIS IS HOW DISCHARGE APPEARS IN EC):
  "ગીરો મુક્તિ" | "ગીરો મુક્ત" | "ગ.મ." | "Giro Mukti" | "Giro Mukeli"
  "ગીરો મૂકેલી મિલકતનું ફેર માલિકી ફેર ખત"
  "ગીરો મુકેલી મિલકતનું ફેરે માલિકી ફેર ખત"
  "Release" | "Reconveyance" | "Discharge" | "Satisfaction of Mortgage"
  → "Release of Mortgage Deed / Reconveyance Deed"
  ⚠️ WHEN THIS TYPE IS FOUND:
     - Col 3 (Aapnar) = THE BANK/LENDER (releasing the mortgage)
     - Col 4 (Lenar) = THE OWNER/BORROWER (getting property back)
     - STATUS = "DISCHARGED — Previous Charge Released and Satisfied"
     - The MORTGAGE from the prior row is NOW DISCHARGED

  AGREEMENT TO SELL (with possession):
  "બાનાખત" | "AoS" | "Agreement for Sale"
  → "Agreement to Sell (with Possession)"

  AGREEMENT WITHOUT POSSESSION:
  "બાનાખત કબ્જા વગર" | "AoS Without Possession"
  → "Agreement to Sell WITHOUT Possession" ← NEVER call this a Sale Deed

  GIFT DEED:
  "ભેટ ખત" | "ભૂષણ" | "બક્ષિસખત" | "Gift"
  → "Gift Deed"

  LEASE DEED:
  "ભાડા પટ્ટો" | "Bhada Patto" | "Lease"
  → "Lease Deed"

  PARTITION DEED:
  "ભાગ" | "વહેંચણી" | "Partition" | "Family Settlement"
  → "Partition Deed / Family Settlement"

  POWER OF ATTORNEY:
  "સત્તા ખત" | "સત્તાનામુ" | "GPA" | "POA"
  → "Power of Attorney (General)"
  "45-એ" | "45-A" | "45A"
  → "Power of Attorney under Section 45-A"

  WILL:
  "ઇચ્છા પત્ર" | "Will" | "Testament"
  → "Will / Testament"

  DEVELOPMENT AGREEMENT:
  "વિકાસ કરાર" | "JDA" | "Development"
  → "Development Agreement / JDA"

  RECTIFICATION:
  "સુધારા ખત" | "Rectification" | "Correction"
  → "Rectification Deed"

  COURT ATTACHMENT / LIS PENDENS:
  "જપ્તી" | "Attachment" | "Lis Pendens" | "Court Order"
  → "Court Attachment / Lis Pendens" ← CRITICAL ALERT

  CANCELLATION:
  "રદ ખત" | "Cancellation"
  → "Cancellation Deed"

  DECLARATION:
  "ઘોષણા" | "Declaration"
  → "Declaration Deed"

  WHEN TYPE IS NOT IN TABLE:
  Step A: Check if Col 3 (Aapnar) = Bank → likely RELEASE OF MORTGAGE
  Step B: Check if Col 4 (Lenar) = Bank → likely MORTGAGE DEED
  Step C: Translate Gujarati text word by word to English
  Step D: Output "Unknown Deed Type ([English translation])"
  NEVER output Gujarati text as the type in the report.

STEP 5 — CRITICAL: EC ROW-BY-ROW EXTRACTION FORMAT:
For EACH row in the EC table, output in this EXACT format:

EC_ROW_[N]:
  TYPE: [English type translated from Col 1]
  COL2_PROPERTY: [Property description from Col 2 — check if matches subject property]
  COL3_AAPNAR: [Full name/s from Col 3 — executing party]
  COL4_LENAR: [Full name/s or Bank name from Col 4 — claimant party]
  COL5_DATE: [DD/MM/YYYY from Col 5]
  COL6_DEED_NO: [Registration/Dastavej number from Col 6]
  SUBJECT_MATCH: [YES — if Unit+Block+Floor match subject property | NO — if different property]
  MORTGAGE_DETECTED: [YES — if COL4_LENAR contains any Bank/NBFC name | NO]
  RELEASE_DETECTED: [YES — if TYPE = Release of Mortgage | NO]

STEP 6 — MORTGAGE-RELEASE PAIRING (CRITICAL RULE FROM MANUAL STAGE 5):
After extracting ALL rows, for EACH mortgage row found:
  MORTGAGE_ROW: [Row N where mortgage was found]
  MORTGAGE_BANK: [Bank name from Col 4 of mortgage row]
  MORTGAGE_DEED_NO: [Deed No from Col 6]
  MORTGAGE_DATE: [Date from Col 5]
  
  NOW CHECK: Is there ANY subsequent row in EC where TYPE = Release of Mortgage?
  And where Col 3 (Aapnar) = same Bank that was in Col 4 (Lenar) of the mortgage?
  
  IF YES → RELEASE_ROW: [Row M]
             RELEASE_DEED_NO: [Deed No from Col 6 of release row]
             RELEASE_DATE: [Date from Col 5 of release row]
             MORTGAGE_STATUS: DISCHARGED — Charge Released and Satisfied
  
  IF NO → MORTGAGE_STATUS: ACTIVE — No Release Deed found in EC or submitted documents

ALSO CHECK SUBMITTED DOCUMENTS for Release:
- Is a Release of Mortgage Deed / Giro Mukeli submitted? → DISCHARGED
- Is an Index-II of Release Deed submitted? → DISCHARGED
- Is a NOC / No-Dues Certificate from the bank submitted? → DISCHARGED

EC_APPLICANT_RULE: The "Applicant" / "E-Arji Karnaar" on the receipt form = person who APPLIED for EC.
This is always an advocate or bank officer with ZERO property interest.
NEVER reproduce EC applicant name. NEVER mention in report. COMPLETELY IGNORE.

═══════════════════════════════════════════════════════
PERMANENT RULES — NEVER VIOLATE:
═══════════════════════════════════════════════════════
1. NEVER "and others" — every person individually
2. EC Col 7 (Last) = NEVER MENTION. This is a permanent strict rule from the Manual.
3. EC Applicant = COMPLETELY IGNORE
4. Loan Amount = NEVER mention
5. Stamp Paper No / Stamp Duty = NEVER mention
6. Subject property ONLY — Unit+Block+Floor match for every EC entry
7. Dukan = Shop | Banakhat Kabja Vagar = AoS Without Possession (NOT Sale Deed)
8. Current Owner = from latest submitted deed (deed > EC for ownership determination)`


// ================================================================
// LAYER 2+3 — SONNET — STAGE 3+5+7+8+9: TITLE + EC + RISK
// ================================================================
const LAYER23_BASE = `You are Layer 2 (Title Verification — Stage 3) and Layer 3 (Risk & Mortgageability — Stage 7) and Document Deficiency (Stage 8) and Legal Opinion (Stage 9) per the AI Manual.

NON-NEGOTIABLE:
• Never assume | Never create | Never infer without documents
• Never certify if title continuity is incomplete
• Never suppress adverse findings
• Unavailable = "NOT PROVIDED FOR VERIFICATION."

TITLE CERTIFICATION RULE (from Manual):
Title certified ONLY when ALL satisfied:
✓ Ownership established from registered document
✓ Title continuity — every link documented
✓ EC verified — all mortgages discharged OR noted
✓ Revenue records reconciled
✓ Approvals verified
✓ Mortgageability confirmed
✓ No material defect remains
Otherwise = "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

EC VERIFICATION (Stage 5) — SONNET RE-CHECK:
Layer 1 has already extracted EC rows. You must VERIFY:
1. Read ALL EC_ROW_[N] entries from Layer 1 output
2. For every MORTGAGE_DETECTED=YES row — verify MORTGAGE_STATUS from Layer 1
3. If MORTGAGE_STATUS=DISCHARGED — confirm: which release row discharged it
4. If MORTGAGE_STATUS=ACTIVE — flag as active encumbrance
5. NEVER override DISCHARGED status to ACTIVE without clear reason
6. NEVER say "mortgage active" if Layer 1 found a release row pairing

RISK LEVELS (Stage 7): HIGH | MODERATE | LOW | CRITICAL
MORTGAGEABILITY: Mortgageable | Conditionally Mortgageable | Not Mortgageable
SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
LENDING SUITABILITY: Suitable | Conditionally Suitable | Not Suitable
SECURITY ADEQUACY: Adequate | Marginal | Inadequate

TITLE CHAIN (Stage 3): Verify every link: Previous Owner → Transfer Deed → Current Owner
Any unsupported link = TITLE BREAK = CRITICAL

PERMANENT RULES:
1. NEVER "and others" | 2. EC Col 7 = NEVER | 3. EC Applicant = IGNORE
4. Loan Amount = NEVER | 5. Subject property ONLY
6. Giro Mukeli = DISCHARGED — always
7. Banakhat Kabja Vagar = AoS Without Possession`

function getLayer23(caseType: string): string {
  const caseModule: Record<string, string> = {

    builder_purchase: `
═══ CASE: BUILDER PURCHASE ═══
---META---
APPLICANT: [Full names — Draft Sale Deed/Banakhat/Allotment — Buyer — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant or specify]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search..."]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Builder/Developer full names]
EC_APP_NUMBER: [from E-Application Receipt]
EC_DATE: [Date of Print from receipt]
EC_SEARCH_FROM: [From date]
EC_SEARCH_TO: [To date]
EC_ACTUAL_ROW_COUNT: [count of ACTUAL rows — not header]
MORTGAGE_STATUS_SUMMARY: [NONE / DISCHARGED (Deed No X dated D) / ACTIVE (Bank Y Deed No X)]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A for Builder Purchase]
---END META---
LEGAL OPINION WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    resale: `
═══ CASE: RESALE ═══
---META---
APPLICANT: [Second Party/Vechan Lenar from Draft Deed/Banakhat — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [First Party/Vechan Aapnar — ALL names — from Draft Deed/Banakhat]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_SEARCH_FROM: [From date]
EC_SEARCH_TO: [To date]
EC_ACTUAL_ROW_COUNT: [ACTUAL rows]
MORTGAGE_STATUS_SUMMARY: [NONE / DISCHARGED (Deed No X dated D) / ACTIVE (Bank Y Deed No X)]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A or Bank name if found in EC]
---END META---
LEGAL OPINION WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    bt: `
═══ CASE: BALANCE TRANSFER ═══
---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_SEARCH_FROM: [From date]
EC_SEARCH_TO: [To date]
EC_ACTUAL_ROW_COUNT: [ACTUAL rows]
MORTGAGE_STATUS_SUMMARY: [ACTIVE — Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Name from EC mortgage entry]
---END META---
LEGAL OPINION WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    seller_bt: `
═══ CASE: SELLER BT ═══
---META---
APPLICANT: [Proposed purchaser — Draft Deed/Banakhat — Buyer side]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Seller — First Party — ALL names individually]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_SEARCH_FROM: [From date]
EC_SEARCH_TO: [To date]
EC_ACTUAL_ROW_COUNT: [ACTUAL rows]
MORTGAGE_STATUS_SUMMARY: [ACTIVE — Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Name from EC mortgage entry]
---END META---
LEGAL OPINION WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    lap: `
═══ CASE: LAP / MORTGAGE ═══
---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_SEARCH_FROM: [From date]
EC_SEARCH_TO: [To date]
EC_ACTUAL_ROW_COUNT: [ACTUAL rows]
MORTGAGE_STATUS_SUMMARY: [NONE — EC shows no mortgage / or UNDISCLOSED ACTIVE if found]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A — or UNDISCLOSED MORTGAGE if found in EC]
---END META---
LEGAL OPINION WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
  }
  return LAYER23_BASE + (caseModule[caseType] || caseModule['lap'])
}

function parseMeta(text: string) {
  const b = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const g = (k: string) => b.match(new RegExp(`^${k}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'),
    mortgagor: g('MORTGAGOR'),
    propertyPara: g('PROPERTY_PARA'), propertyBoundaries: g('PROPERTY_BOUNDARIES'),
    currentOwner: g('CURRENT_OWNER'),
    ecAppNumber: g('EC_APP_NUMBER'),
    ecDate: g('EC_DATE'),
    ecSearchFrom: g('EC_SEARCH_FROM'), ecSearchTo: g('EC_SEARCH_TO'),
    ecActualRowCount: g('EC_ACTUAL_ROW_COUNT'),
    mortgageStatusSummary: g('MORTGAGE_STATUS_SUMMARY'),
    riskLevel: g('RISK_LEVEL'),
    mortgageability: g('MORTGAGEABILITY'),
    sarfaesi: g('SARFAESI'), lendingSuitability: g('LENDING_SUITABILITY'),
    existingBank: g('EXISTING_BANK'),
  }
}


// ================================================================
// LAYER 4 — REPORT GENERATOR — 14-PART (AI MANUAL)
// L4A: Parts I+II+III+IV
// L4B: Parts V+VI+VII (VII = dedicated EC analysis)
// L4C: Parts VIII+IX+X
// L4D: Parts XI+XII+XIII+XIV
// ================================================================

const L4A = `You are Layer 4 — Legal Report Generator. Generate HTML for PART I, PART II, PART III, PART IV.
OUTPUT PURE HTML ONLY. NO markdown. NO ##. NO **. NO ---.

PART I — BORROWER DETAILS
<hr><div class="ph">PART I — BORROWER DETAILS</div>
<table class="mt">
  <tr><td>Name of Borrower/s</td><td>:</td><td>[Full name/s — every person individually — NEVER "and others"]</td></tr>
  <tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Full name/s or "Not Applicable"]</td></tr>
  <tr><td>Address</td><td>:</td><td>[Address as per documents]</td></tr>
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Private Ltd / HUF / Trust / Society]</td></tr>
</table>

PART II — MORTGAGOR DETAILS
<hr><div class="ph">PART II — MORTGAGOR DETAILS</div>
<table class="mt">
  <tr><td>Name of Mortgagor/s</td><td>:</td><td>[Full names — if same as borrower: "Same as Borrower/s"]</td></tr>
  <tr><td>Address</td><td>:</td><td>[if same: "Same as above"]</td></tr>
  <tr><td>Constitution</td><td>:</td><td>[Individual / etc.]</td></tr>
  <tr><td>Current Owner/s</td><td>:</td><td>[Full name/s — from latest deed]</td></tr>
  <tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift / etc.]</td></tr>
</table>

PART III — PROPERTY DESCRIPTION
<hr><div class="ph">PART III — PROPERTY DESCRIPTION</div>
<div class="prop-para">[FULL PARAGRAPH: "Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<div class="sph">Property Boundaries</div>
<table class="mt">
  <tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
  <tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
  <tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
  <tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

PART IV — LIST OF DOCUMENTS EXAMINED
MANUAL RULE: Include ALL submitted documents. DO NOT write "ILLEGIBLE", "BLANK", "NOT PROVIDED FOR VERIFICATION" in Part IV. Those remarks go ONLY in Part IX Alerts. List LATEST FIRST — OLDEST LAST. Never list Mutation Entries. Never mention Stamp Paper No.

<hr><div class="ph">PART IV — LIST OF DOCUMENTS EXAMINED</div>
<p>The following documents were produced for scrutiny and examined in preparation of this Legal Scrutiny Report:</p>

FORMAT PER DOCUMENT:
<div class="di">
  <p><span class="dn">N. [Document Type] — Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>
  [Executant name/s individually] unto and in favour of [Claimant name/s individually]. [SRO name.] [2-3 sentences key details — no illegibility remarks.]</p>
</div>

EC FORMAT IN PART IV:
<div class="di">
  <p><span class="dn">N. Encumbrance Certificate (EC) — E-Application No.: [EC_APP_NUMBER] | Date: [EC_DATE] | Search Period: [EC_FROM] to [EC_TO]</span><br>
  Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] covering search period from [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. The EC was physically examined row by row and [COUNT] registered transaction/s were found recorded for the subject property. [Brief summary of key entries.]</p>
</div>

RULES: NEVER "and others". NEVER EC Col 7 (last column). NEVER EC Applicant name. AoS Without Possession ≠ Sale Deed.
START: <hr><div class="ph">PART I — BORROWER DETAILS</div>
END after Part IV last document entry.`

const L4B = `You are Layer 4 — Legal Report Generator. Generate HTML for PART V, PART VI, PART VII.
OUTPUT PURE HTML ONLY. NO markdown. NO ##. NO **. NO ---.

PART V — CHRONOLOGICAL TITLE CHAIN (Stage 3 from Manual)
CRITICAL: Start from EARLIEST available record. Do NOT start from builder or recent deed — go to ORIGIN.
OLDEST FIRST — NEWEST LAST.
First paragraph: NO "Thereafter". Every subsequent: MUST start "Thereafter,".
NEVER "and others". EC-confirmed deeds: include naturally (no remark). All Gujarati terms → English.

<hr><div class="ph">PART V — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>

FIRST PARA (no "Thereafter"):
<p>[Earliest record: original agricultural owner/s from 7/12 or FERFAR. How land was held. Deed/Entry details. Mutation Entry No X dated DD/MM/YYYY.]</p>

SUBSEQUENT PARAS (each starts "Thereafter,"):
<p>Thereafter, [Seller/s full name/s] transferred to [Buyer/s full name/s] vide Registered [Deed Type] bearing Registration No. [X] dated [DD/MM/YYYY] registered at Sub-Registrar Office, [SRO]. Consideration Rs. [Amount]. Entry recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

MORTGAGE PARA:
<p>Thereafter, [Mortgagor full name/s] created a mortgage over the subject property in favour of [Bank full name] vide Registered Mortgage Deed bearing Registration No. [X] dated [DD/MM/YYYY] at SRO [Name]. [DISCHARGED: The said mortgage stands fully discharged vide Release Deed No. [X] dated [DD/MM/YYYY] — no subsisting charge remains on the property. / ACTIVE: The said mortgage is subsisting and active — no Release Deed or discharge document has been produced.]</p>

FINAL PARA:
<p>Thereafter, [Current Owner full name/s] holds the right, title and interest in the subject property as the present registered owner/s as confirmed by the Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] covering search period from [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [Encumbrance status statement.]</p>

PART VI — REVENUE RECORD ANALYSIS (Stage 4 from Manual)
<hr><div class="ph">PART VI — REVENUE RECORD ANALYSIS</div>

If 7/12 or revenue records submitted:
<div class="sph">Village Form No. 7/12 — Revenue Record</div>
<table class="mt">
  <tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
  <tr><td>District</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
  <tr><td>Total Area (H.Are.SqMt.)</td><td>:</td><td>[Area]</td></tr>
  <tr><td>Land Use (Jaminno Upyog)</td><td>:</td><td>[Bin Kheti / Non-Agricultural ← OK | Kheti / Agricultural ← FLAG IMMEDIATELY]</td></tr>
  <tr><td>Ownership Column (Kashedari)</td><td>:</td><td>[Names as in 7/12 — flag if current owner not reflected]</td></tr>
  <tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL / Details — cross-check with EC]</td></tr>
  <tr><td>Ganot / Tenant</td><td>:</td><td>[NIL / Name ← flag if any tenant recorded]</td></tr>
  <tr><td>Hak Patrak Remarks</td><td>:</td><td>[Any annotations or restrictions]</td></tr>
</table>

Mutation Entries (Earlier to Present — subject property only):
<table class="mut-tbl">
  <tr><th>Sr.</th><th>Entry No.</th><th>Entry Date</th><th>Status</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>
  [One row per mutation entry for subject property. Skip last column. Skip entries for other properties.]
</table>
<p>[Cross-check: EC entries vs Mutation entries. Discrepancy? Pending mutation? Uncertified entry?]</p>

If no revenue records: <p>No revenue records (Village Form 7/12, AnyRoR, Property Card) were produced for verification. Ownership recording in revenue records and land use classification could not be verified. NOT PROVIDED FOR VERIFICATION.</p>

PART VII — ENCUMBRANCE ANALYSIS (Stage 5 from Manual — DEDICATED EC SECTION)
<hr><div class="ph">PART VII — ENCUMBRANCE ANALYSIS</div>
<p>Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] covering search period from [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. On physical examination of every row of the EC table, [ACTUAL COUNT] registered transaction/s were found for the subject property as under:</p>

EC TABLE — EVERY ROW INDIVIDUALLY:
<table class="ec-tbl">
  <tr><th>Sr.</th><th>Type of Document (English)</th><th>Deed No.</th><th>Date of Reg.</th><th>Executing Party / Aapnar (Col 3)</th><th>Claimant Party / Lenar (Col 4)</th><th>Mortgage Status</th></tr>
  [One row per ACTUAL EC table row — NEVER Col 7 — translate Gujarati type to English]
  [For mortgage rows: status = "ACTIVE" or "DISCHARGED vide Release Deed No.X dated DD/MM/YYYY"]
  [For release rows: status = "DISCHARGE DEED — Prior mortgage RELEASED AND SATISFIED"]
  [Use class="active-m" for ACTIVE mortgage | class="released" for DISCHARGED]
</table>

MORTGAGE-RELEASE ANALYSIS:
[For each mortgage entry found — state explicitly:]
<p><strong>Mortgage No. [X] dated [D]:</strong> Created by [Mortgagor] in favour of [Bank] vide Deed No. [X] dated [D].<br>
<strong>Release Status:</strong> [DISCHARGED — vide Release Deed No.[Y] dated [D2] — Col 3 (Aapnar) = [Bank] | Col 4 (Lenar) = [Owner] — Charge Released and Satisfied per Manual Stage 5 Rule. / ACTIVE — No release deed found in EC or submitted documents for this mortgage.]</p>

<p>[EC cross-check with documents and mutation records. Any discrepancy? Any entry within last 60 days? Overall encumbrance status.]</p>

If no EC submitted: <p>Encumbrance Certificate has not been submitted for verification. Encumbrance status and registered transactions for the subject property could not be verified. NOT PROVIDED FOR VERIFICATION.</p>

START: <hr><div class="ph">PART V — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END after Part VII cross-check paragraph.`

const L4C = `You are Layer 4 — Legal Report Generator. Generate HTML for PART VIII, PART IX, PART X.
OUTPUT PURE HTML ONLY. NO markdown. NO ##. NO **. NO ---.

PART VIII — REGULATORY COMPLIANCE (Stage 6 from Manual)
<hr><div class="ph">PART VIII — REGULATORY COMPLIANCE</div>
<table class="mt">
  <tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Order No., date, authority — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Approved Layout / Building Plan</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Commencement Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>RERA Registration</td><td>:</td><td>[RERA No., developer, date — OR "NOT PROVIDED FOR VERIFICATION." — Post May 2017: MANDATORY]</td></tr>
  <tr><td>Fire NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Airport Authority NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Completion Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Environmental Clearance</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
</table>
<p>Overall Compliance Status: [Fully Compliant / Partially Compliant / Non-Compliant] — [brief reason]</p>

PART IX — RISK ALERTS (Stage 7+9 from Manual)
<hr><div class="ph">PART IX — RISK ALERTS</div>
<p>The following alerts have been identified during 10-Stage AI title verification. HIGH SEVERITY alerts are conditions precedent to sanction or disbursement.</p>

[If any document illegible/blank — mention HERE: <p>The following submitted document/s could not be fully verified: [names] — certain portions are illegible. Legible certified copies required.</p>]

HIGH SEVERITY — (Title Break | Active Mortgage | Court Attachment | Missing Mandatory Doc | False Declaration):
<div class="ib">
  <div><span class="sh">HIGH SEVERITY</span></div>
  <div class="it">N. [Alert Title]</div>
  <p>[Finding: exact deed nos, dates, names, 3-4 sentences. Why legally material. Bank risk.]</p>
  <p><span class="sg">Direction:</span> [Specific document/action required — from whom — by when.]</p>
</div>

MEDIUM SEVERITY — (Missing Permissions | Mutation Pending | Short EC Period | Co-owner Issues):
<div class="ib">
  <div><span class="sm">MEDIUM SEVERITY</span></div>
  <div class="it">N. [Alert Title]</div>
  <p>[Finding — 2-3 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

LOW SEVERITY:
<div class="ib">
  <div><span class="sl">LOW SEVERITY</span></div>
  <div class="it">N. [Alert Title]</div>
  <p>[Finding — 1-2 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

NEVER FLAG: EC-confirmed deeds where deed copy not submitted | EC Applicant name | Stamp Paper numbers.
If NO issues: <p>No material adverse findings identified on examination of documents produced. Title appears clear from documents produced for verification.</p>

PART X — DOCUMENT DEFICIENCY REPORT (Stage 8 from Manual)
<hr><div class="ph">PART X — DOCUMENT DEFICIENCY REPORT</div>

<div class="sph">A. Documents Submitted and Available</div>
<ol>[List all readable submitted documents]</ol>

<div class="sph">B. Critical Missing Documents (Mandatory Before Sanction)</div>
<ol>[List each critical missing document — Purpose — Risk Created — OR "NIL"]</ol>

<div class="sph">C. Important Missing Documents</div>
<ol>[List important but not critical missing docs — OR "NIL"]</ol>

<div class="sph">D. Submitted Documents — Illegible / Incomplete</div>
<ol>[List any illegible/incomplete docs — OR "NIL"]</ol>

<div class="sph">E. Risk & Mortgageability Assessment</div>
<table class="mt">
  <tr><td>Title Risk Level</td><td>:</td><td>[LOW / MODERATE / HIGH / CRITICAL]</td></tr>
  <tr><td>Mortgageability</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
  <tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
  <tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
  <tr><td>Security Coverage Adequacy</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
  <tr><td>Assessment Basis</td><td>:</td><td>[2-3 sentence reasoning from documents examined]</td></tr>
</table>

START: <hr><div class="ph">PART VIII — REGULATORY COMPLIANCE</div>
END after Part X last table.`

const L4D = `You are Layer 4 — Legal Report Generator. Generate HTML for PART XI, PART XII, PART XIII, PART XIV.
OUTPUT PURE HTML ONLY. NO markdown. NO ##. NO **. NO ---.

PART XI — LEGAL OPINION (Stage 9 from Manual)
<hr><div class="ph">PART XI — LEGAL OPINION</div>

<div class="sph">Verified Facts</div>
<p>[List key verified facts: ownership established, EC period, mortgage status, approvals verified/not]</p>

<div class="sph">Missing Information</div>
<p>[Any information that could not be verified — or "NIL"]</p>

<div class="sph">Legal Issues Identified</div>
<p>[Key legal issues — or "NIL — No material legal issues identified"]</p>

<div class="sph">Legal Conclusion</div>
[Use EXACT case-specific wording — fill actual names — from Layer 2+3 analysis]
<p>[Full legal opinion paragraph with actual names filled in]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank[subject to charge of {existing bank} if applicable].</p>

VERDICT BOX:
NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">DEFECTIVE TITLE / TITLE NOT CLEAR</div><p style="margin-top:8px;font-size:12px;">[N] HIGH SEVERITY alerts identified. Primary issues: [brief list]. Bank must not proceed until all HIGH SEVERITY alerts resolved.</p></div>
CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is mortgageable subject to: [list specific conditions].</p></div>
CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. [Brief reason.]</p></div>

PART XII — PRE-DISBURSEMENT REQUIREMENTS (Stage 10)
<hr><div class="ph">PART XII — PRE-DISBURSEMENT REQUIREMENTS</div>
<p>The following documents must be taken into Bank custody and verified BEFORE disbursement:</p>
<ol>
  [Case-specific list:]
  Builder Purchase: NOC from Builder for Mortgage | NOC from Project Finance Bank (if applicable) | Draft Sale Deed / Registered Banakhat
  Resale: Draft of Sale Deed / Registered Banakhat | All identified missing documents
  Balance Transfer: LOD from existing Bank | Foreclosure Letter | Outstanding Certificate | NOC from existing Bank | CERSAI Search | Updated EC
  Seller BT: Draft Sale Deed / Banakhat | Foreclosure Letter | LOD | NOC | CERSAI Search | Updated EC
  LAP: Original Registered Sale Deed | Updated EC | CERSAI Search (no prior charge)
</ol>

PART XIII — POST-DISBURSEMENT REQUIREMENTS (Stage 10)
<hr><div class="ph">PART XIII — POST-DISBURSEMENT REQUIREMENTS</div>
<p>The following documents must be taken into Bank custody within the stipulated timeframe AFTER disbursement:</p>
<ol>
  [Case-specific list:]
  Builder Purchase: Final Registered Sale Deed (Builder → Purchaser)
  Resale: Final Registered Sale Deed (Owner → Purchaser)
  Balance Transfer: No-Due Certificate from existing Bank | Registered Release Deed from existing Bank | Original Title Documents | Updated EC
  Seller BT: Registered Sale Deed (Owner → Purchaser) | Release Deed from existing Bank | No-Due Certificate | Original Title Documents | Updated EC
  LAP: Registered Mortgage / MODT in favour of Bank | CERSAI Registration Confirmation | Updated EC post-mortgage
</ol>

PART XIV — FINAL RECOMMENDATION (Stage 10 from Manual)
<hr><div class="ph">PART XIV — FINAL RECOMMENDATION</div>
<div class="final-rec">
  <div class="fr-title">Final Title Status (per AI Manual — select ONE):</div>
  <div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE REQUIRES FURTHER VERIFICATION / DEFECTIVE TITLE / NOT MORTGAGEABLE / INSUFFICIENT DOCUMENTATION FOR TITLE CERTIFICATION]</div>
</div>
<p style="margin-top:16px;">[Summary: 3-4 sentences — overall title status, conditions if any, final recommendation whether bank can proceed.]</p>

START: <hr><div class="ph">PART XI — LEGAL OPINION</div>
END after Part XIV summary paragraph.`


// ================================================================
// HTML WRAPPER — 14 PARTS
// ================================================================
function buildReport(p: {
  refNo: string; appId: string; today: string; bankName: string; loanType: string
  p1234: string; p567: string; p8910: string; p11_14: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Legal Scrutiny Report — ${p.refNo}</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<div class="hdr">
  <div class="hdr-left">
    <div class="firm">TITLEMATRIXAI</div>
    <div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div>
    <div class="sub">Panel Legal Counsel — Mortgage, Banking &amp; Real Estate Transactions</div>
    <div class="sub">support@titlematrixai.com &nbsp;|&nbsp; www.titlematrixai.com</div>
  </div>
  <div class="hdr-right">
    <div><strong>Reference No. :</strong> ${p.refNo}</div>
    <div><strong>Application ID :</strong> ${p.appId}</div>
    <div><strong>Report Date :</strong> ${p.today}</div>
    <div><strong>Bank :</strong> ${p.bankName}</div>
  </div>
</div>
<div class="rtitle">LEGAL SCRUTINY REPORT — ${p.loanType}</div>
<hr>
${p.p1234}
${p.p567}
${p.p8910}
${p.p11_14}
<hr>
<div class="sigrow">
  <div class="sigbox">
    <div class="sigline"></div>
    <div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div>
    <div style="font-size:10px;color:#666;">Advocates &amp; Legal Scrutiny Consultants</div>
    <div style="font-size:10px;color:#666;">Date: ${p.today}</div>
  </div>
  <div class="sigbox">
    <div class="sigline"></div>
    <div style="font-size:11px;font-weight:bold;">Authorised Signatory</div>
    <div style="font-size:10px;color:#666;">${p.bankName}</div>
    <div style="font-size:10px;color:#666;">APP ID: ${p.appId}</div>
  </div>
</div>
<div class="ftr">
  Generated by TITLEMATRIXAI &nbsp;|&nbsp; support@titlematrixai.com &nbsp;|&nbsp; www.titlematrixai.com
  <div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ${p.bankName} in connection with Application ID ${p.appId}. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title or a legal warranty. This report is confidential and may not be reproduced, disclosed or relied upon by any party other than the addressee bank. The findings herein reflect the state of title as evidenced by the documents produced and do not account for any undisclosed encumbrances or defects not apparent from the documents examined.</div>
  <div class="wm">TITLEMATRIXAI — Confidential — For Bank Use Only</div>
</div>
</body>
</html>`
}

// ================================================================
// MAIN API HANDLER
// ================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      documentText, images, caseType, appId, bankName, loanType,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId,
    } = body

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`

    // ── LAYER 1: HAIKU — DOCUMENT EXTRACTION ───────────────────
    const l1Content: any[] = []
    if (images?.length > 0) {
      for (const img of images) {
        l1Content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
      }
    }

    let docText = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth) {
      docText += `\n\n=== PROPERTY BOUNDARIES FROM CASE DETAILS SHEET ===\nEast: ${boundaryEast || 'As per documents'}\nWest: ${boundaryWest || 'As per documents'}\nNorth: ${boundaryNorth || 'As per documents'}\nSouth: ${boundarySouth || 'As per documents'}\n=== END ===\n`
    }

    l1Content.push({
      type: 'text',
      text: `LAYER 1 — DOCUMENT EXTRACTION ENGINE (Stage 2 of AI Manual)

CASE DETAILS (PRE-VERIFIED ANCHORS — use to identify correct property and parties):
Applicant: ${applicantName || 'As per documents'}
Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'}
Case Type: ${caseType} | Loan Type: ${loanType || 'LAP'} | Bank: ${bankName} | APP ID: ${appId}
Property Description: ${propertyAddress || 'As per documents'}
Boundaries Provided: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

SUBMITTED DOCUMENTS TEXT:
${docText}

CRITICAL INSTRUCTIONS:
1. NEVER "and others" — every person individually always
2. For EC: Extract E-Application No., Date of Print, Search Period From-To — ALL MANDATORY
3. ⚠️ DO NOT TRUST EC HEADER COUNT ("X registered transactions") — count ACTUAL ROWS yourself
4. Use EC_ROW_[N] format to extract each row explicitly
5. After extracting mortgage rows — check all subsequent rows for Release/Giro Mukeli
6. EC Col 7 (Last column) = NEVER READ OR MENTION — strict rule
7. EC Applicant name = COMPLETELY IGNORE
8. For each mortgage found: explicitly state MORTGAGE_STATUS (ACTIVE or DISCHARGED) with reason
9. Translate ALL Gujarati EC types to English using the translation table
10. Subject property ONLY: verify Unit+Block+Floor match before including any EC row`
    })

    const l1Msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: LAYER1_SYSTEM,
      messages: [{ role: 'user', content: l1Content }]
    })
    const extractedFacts = l1Msg.content[0].type === 'text' ? l1Msg.content[0].text : ''

    // ── LAYER 2+3: SONNET — TITLE + RISK + LEGAL ANALYSIS ─────
    const l23Msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system: getLayer23(caseType),
      messages: [{
        role: 'user',
        content: `LAYER 2+3 — TITLE VERIFICATION + RISK + LEGAL ANALYSIS

CASE DETAILS:
Applicant: ${applicantName} | Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'} | Property: ${propertyAddress}
Bank: ${bankName} | APP ID: ${appId}
Boundaries: E=${boundaryEast || '?'} | W=${boundaryWest || '?'} | N=${boundaryNorth || '?'} | S=${boundarySouth || '?'}

LAYER 1 EXTRACTED FACTS (including EC_ROW_[N] analysis):
${extractedFacts}

MANDATORY META BLOCK — FILL COMPLETELY:
1. EC_APP_NUMBER = exact E-Application Number from receipt
2. EC_DATE = exact Date of Print
3. EC_SEARCH_FROM and EC_SEARCH_TO = exact dates
4. EC_ACTUAL_ROW_COUNT = count of ACTUAL ROWS found (not header count)
5. MORTGAGE_STATUS_SUMMARY = exact status — NONE / DISCHARGED (with deed no+date) / ACTIVE (with bank+deed no)
6. All names individually — NEVER "and others"

EC VERIFICATION — RE-READ FROM LAYER 1:
1. Read every EC_ROW_[N] entry from Layer 1 output
2. For every MORTGAGE_DETECTED=YES → check MORTGAGE_STATUS in Layer 1
3. DISCHARGED = confirmed by a Release row in EC or Release Deed submitted → do NOT override to ACTIVE
4. ACTIVE = no release found → flag in Meta and in alerts
5. Col 7 = NEVER MENTION | EC Applicant = COMPLETELY IGNORE`
      }]
    })
    const analysis = l23Msg.content[0].type === 'text' ? l23Msg.content[0].text : ''
    const meta = parseMeta(analysis)

    // ── LAYER 4: 4 PARALLEL CALLS ─────────────────────────────
    const [r4a, r4b, r4c, r4d] = await Promise.all([

      // Parts I + II + III + IV
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4A,
        messages: [{
          role: 'user',
          content: `Generate PART I (Borrower) + PART II (Mortgagor/Ownership) + PART III (Property Description) + PART IV (Documents List).

APPLICANT: ${meta.applicant || applicantName}
CO-APPLICANT: ${meta.coApplicant || coApplicant || 'Not Applicable'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY PARA: ${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || '?'} | W:${boundaryWest || '?'} | N:${boundaryNorth || '?'} | S:${boundarySouth || '?'}
EC_APP_NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC_DATE: ${meta.ecDate || 'As per documents'}
EC_SEARCH_FROM: ${meta.ecSearchFrom || 'As per documents'}
EC_SEARCH_TO: ${meta.ecSearchTo || 'As per documents'}
EC_ACTUAL_ROW_COUNT: ${meta.ecActualRowCount || 'As per documents'}
BANK: ${bankName}

LAYER 1+2+3 ANALYSIS:
${analysis}

RULE — PART IV: List ALL submitted documents. NO illegibility/blank/NOT PROVIDED remarks in Part IV. Those remarks go ONLY in Part IX.`
        }]
      }),

      // Parts V + VI + VII
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4B,
        messages: [{
          role: 'user',
          content: `Generate PART V (Title Chain) + PART VI (Revenue Records) + PART VII (EC Analysis — DEDICATED).

CASE TYPE: ${caseType}
SUBJECT PROPERTY: ${meta.propertyPara || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
APPLICANT: ${meta.applicant || applicantName}
EC_APP_NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC_DATE: ${meta.ecDate || 'As per documents'}
EC_SEARCH_FROM: ${meta.ecSearchFrom || 'As per documents'}
EC_SEARCH_TO: ${meta.ecSearchTo || 'As per documents'}
EC_ACTUAL_ROW_COUNT: ${meta.ecActualRowCount || 'As per documents'}
MORTGAGE_STATUS_SUMMARY: ${meta.mortgageStatusSummary || 'As per analysis'}

LAYER 1+2+3 ANALYSIS:
${analysis}

CRITICAL RULES:
- Part V: Oldest FIRST. First para NO "Thereafter". Each subsequent MUST start "Thereafter,". Final para includes EC App No.
- Part VII: This is DEDICATED EC section. Show EVERY actual EC row in table. Translate Gujarati types. NEVER Col 7. NEVER EC Applicant. For each mortgage: explicit DISCHARGED or ACTIVE status. For released mortgages: state "Charge Released and Satisfied per Stage 5 of Manual".`
        }]
      }),

      // Parts VIII + IX + X
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4C,
        messages: [{
          role: 'user',
          content: `Generate PART VIII (Regulatory Compliance) + PART IX (Risk Alerts) + PART X (Document Deficiency + Risk Assessment).

BANK: ${bankName}
PROPERTY: ${meta.propertyPara || propertyAddress}
RISK_LEVEL: ${meta.riskLevel}
MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi}
LENDING_SUITABILITY: ${meta.lendingSuitability}
MORTGAGE_STATUS: ${meta.mortgageStatusSummary}

LAYER 1+2+3 ANALYSIS:
${analysis}

RULES:
- Part IX: Put illegibility remarks HERE. NEVER flag EC-confirmed deeds. NEVER flag EC Applicant.
- Part IX: If mortgage is DISCHARGED per analysis — DO NOT flag as active mortgage alert.
- Part X: Section E must show mortgageability, SARFAESI, lending suitability, security adequacy — all four.`
        }]
      }),

      // Parts XI + XII + XIII + XIV
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, system: L4D,
        messages: [{
          role: 'user',
          content: `Generate PART XI (Legal Opinion + Verdict) + PART XII (Pre-Disbursement) + PART XIII (Post-Disbursement) + PART XIV (Final Recommendation).

CASE TYPE: ${caseType}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPOSED PURCHASER / MORTGAGOR: ${meta.applicant || applicantName}
BANK: ${bankName}
EXISTING BANK: ${meta.existingBank || 'N/A'}
MORTGAGE STATUS: ${meta.mortgageStatusSummary}
MORTGAGEABILITY: ${meta.mortgageability}

LAYER 1+2+3 ANALYSIS:
${analysis}

RULES: Part XI = EXACT legal opinion wording with actual names. Verdict must match Part IX alerts. Part XIV = select ONE from the five options in Manual Stage 10.`
        }]
      })
    ])

    const p1234 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error generating Parts I-IV</p>'
    const p567 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error generating Parts V-VII</p>'
    const p8910 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error generating Parts VIII-X</p>'
    const p11_14 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error generating Parts XI-XIV</p>'

    const reportHtml = buildReport({
      refNo, appId: appId || 'AUTO-000000', today,
      bankName: bankName || 'Bank',
      loanType: loanType || 'Loan Against Property',
      p1234, p567, p8910, p11_14,
    })

    const verdict = extractVerdict(analysis)
    let savedToDb = false, dbError = null

    if (userId && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('reports').insert({
          user_id: userId, case_type: caseType || 'lap',
          applicant_name: meta.applicant || applicantName || 'Unknown',
          bank_name: bankName || 'Unknown',
          property_address: meta.propertyPara || propertyAddress || 'Unknown',
          app_id: appId || refNo, verdict, report_html: reportHtml,
        })
        if (error) { dbError = error.message } else { savedToDb = true }
      } catch (err: any) { dbError = err.message }
    }

    return NextResponse.json({
      success: true, report: reportHtml, verdict,
      savedToDb, dbError,
      debug: { extractedFacts, analysis, metaParsed: meta },
    })

  } catch (error: any) {
    console.error('TITLEMATRIXAI error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Pipeline failed' },
      { status: 500 }
    )
  }
}