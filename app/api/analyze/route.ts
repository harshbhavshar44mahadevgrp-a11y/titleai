// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts  v8.0
// 4-LAYER ARCHITECTURE × 16-PART REPORT
// Layer1=Haiku(Extraction) | Layer2=Sonnet(Title+EC+Revenue)
// Layer3=Sonnet(Risk+Mortgageability) | Layer4=Sonnet×4(Report)
// ================================================================
export const maxDuration = 300
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()

const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

function extractVerdict(text: string): string {
  const u = text.toUpperCase()
  if (u.includes('TITLE NOT RECOMMENDED') || u.includes('NOT CLEAR') || u.includes('TITLE BREAK')) return 'NOT CLEAR'
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
.ph { font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin:20px 0 8px; background:#1B3A6B; color:#fff; padding:6px 14px; }
.sph { font-size:12px; font-weight:bold; color:#1B3A6B; margin:12px 0 5px; border-left:3px solid #1B3A6B; padding-left:8px; }
.mt { width:100%; margin-bottom:10px; border-collapse:collapse; }
.mt td { font-size:12px; padding:4px 2px; vertical-align:top; }
.mt td:first-child { width:250px; color:#555; }
.mt td:nth-child(2) { width:14px; }
.mt td:last-child { font-weight:500; }
p { margin-bottom:10px; text-align:justify; }
.di { margin-bottom:14px; padding-bottom:10px; border-bottom:1px dotted #e5e7eb; }
.dn { font-weight:bold; }
.ib { margin-bottom:20px; padding:12px 14px; border-left:4px solid #e5e7eb; background:#fafafa; }
.sh { display:inline-block; background:#b91c1c; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; letter-spacing:0.5px; }
.sm { display:inline-block; background:#b45309; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; }
.sl { display:inline-block; background:#1d4ed8; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; }
.sc { display:inline-block; background:#6b7280; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; }
.it { font-weight:bold; font-size:13px; margin-bottom:5px; }
.sg { font-weight:bold; font-style:italic; color:#1B3A6B; }
.pph { font-weight:bold; font-size:12px; text-transform:uppercase; margin:12px 0 5px; border-bottom:1px solid #ccc; padding-bottom:3px; color:#1B3A6B; }
ol { padding-left:22px; margin-bottom:10px; }
ol li { margin-bottom:5px; }
.conf-high { color:#15803d; font-weight:bold; }
.conf-med  { color:#b45309; font-weight:bold; }
.conf-low  { color:#dc2626; font-weight:bold; }
.conf-none { color:#111; font-weight:bold; }
.risk-box { margin-top:16px; padding:14px 18px; border:2px solid #1B3A6B; border-radius:2px; background:#EFF3FB; }
.risk-title { font-size:12px; font-weight:bold; text-transform:uppercase; color:#1B3A6B; margin-bottom:8px; }
.risk-score { font-size:26px; font-weight:bold; }
.risk-low  { color:#15803d; }
.risk-mod  { color:#b45309; }
.risk-high { color:#dc2626; }
.morta-box { margin-top:12px; padding:12px 16px; border:1px solid #ccc; background:#f9f9f9; }
.vnc { margin-top:20px; padding:14px 18px; border:2px solid #b91c1c; background:#fff5f5; }
.vc  { margin-top:20px; padding:14px 18px; border:2px solid #15803d; background:#f0fdf4; }
.vs  { margin-top:20px; padding:14px 18px; border:2px solid #b45309; background:#fffbeb; }
.vt  { font-size:13px; font-weight:bold; text-transform:uppercase; margin-bottom:6px; }
.title-status { margin-top:20px; padding:16px 20px; border:3px solid #1B3A6B; background:#EFF3FB; }
.ts-title { font-size:11px; font-weight:bold; color:#1B3A6B; letter-spacing:1px; margin-bottom:6px; text-transform:uppercase; }
.ts-value { font-size:15px; font-weight:bold; color:#1B3A6B; }
.sigrow { margin-top:48px; display:flex; justify-content:space-between; align-items:flex-end; }
.sigbox { text-align:center; }
.sigline { width:200px; border-bottom:1px solid #1a1a1a; margin:0 auto 6px; height:40px; }
.ftr { margin-top:36px; border-top:1px solid #ccc; padding-top:14px; font-size:11px; color:#666; text-align:center; }
.disc { margin-top:10px; font-size:10px; color:#999; text-align:justify; line-height:1.6; }
.wm { font-size:10px; color:#bbb; text-align:center; margin-top:8px; letter-spacing:2px; text-transform:uppercase; }
@media print { body{padding:30px 40px;} .ib{page-break-inside:avoid;} }
`

// ================================================================
// LAYER 1 — HAIKU — DOCUMENT EXTRACTION ENGINE
// ================================================================
const LAYER1_SYSTEM = `You are the Document Extraction Engine — Layer 1 of a 4-Layer AI Title Verification Architecture.

YOUR ONLY JOB: Extract all facts from submitted documents. Do NOT generate legal opinion.

NON-NEGOTIABLE:
- NEVER assume facts | NEVER create facts | NEVER infer ownership without documents
- NEVER suppress adverse findings
- Unavailable info = "NOT PROVIDED FOR VERIFICATION."

CONFIDENCE LEVELS (assign to each extracted fact):
HIGH = Supported by registered document + government record + EC + revenue records
MEDIUM = Supported by at least two independent records
LOW = Supported by one document only
NO CONFIDENCE = Unsupported

EXTRACT FOR EACH DOCUMENT:
Type | Date | Registration No. | Executant (full names) | Claimant (full names) | Property Description | Survey/Block No. | Village | Taluka | District | Area | Boundaries
Classify: Available | Missing | Incomplete | Illegible
NEVER reproduce: Stamp Paper No. | Stamp Duty amount | Registration Fees | EC Last Column | E-Application No. | EC Applicant Name

FERFAR/MUTATION ENTRIES — COLUMN RULES:
Skip first column "Entry Details" entirely.
Col 1 (after skip): Entry No. + Date + Certified/Rejected
Col 2 (after skip): Details — NA conversion | Death | Transfer
Col 3 (after skip): Relevant Survey/Block No. — SKIP if not subject property
Col 4 (after skip/LAST): DO NOT CONSIDER — NEVER MENTION

EC ENGINE — ALL 7 COLUMNS:
Col 1: Type of Deed — "Maliki Feran/Vecho"=Sale | "Boja/Giro"=Mortgage | "Giro Mukeli"=Release of Mortgage | "Banakhat Kabja Vagar"=AoS Without Possession
Col 2: Property Description
Col 3: Executing Party "Aapnar" = SELLER / MORTGAGOR (gives the deed)
Col 4: Claimant Party "Lenar" = BUYER / MORTGAGEE / BANK (takes the deed)
Col 5: Date of Registration
Col 6 (Second Last): Registration/Dastavej Number
Col 7 (LAST): DO NOT READ — NEVER MENTION ANYWHERE
NEVER swap Col 3 (Aapnar/Seller) and Col 4 (Lenar/Buyer)
EC Applicant on form = empanelled advocate with ZERO property interest = COMPLETELY IGNORE
Always extract: EC Date + Search Period "શોધ અગર તપાસણી"

TITLE EVENTS TO EXTRACT:
Sale | Gift | Inheritance | Succession | Partition | Court Order | Development Agreement | POA | Mortgage | Release | Allotment | Builder Acquisition | NA Conversion | RERA | Possession

REVENUE RECORDS:
For each 7/12: Village | Taluka | District | Survey/Block No. | Total Area (H.Are.SqMt.) | Land Use (Bin Kheti/Kheti)

REGULATORY APPROVALS — CHECK EACH:
NA Order | Development Permission | Rajachitthi | Building Permission | Sanctioned Plan | Commencement Certificate | RERA | Fire NOC | Airport NOC | BU Permission/OC
If not provided: "NOT PROVIDED FOR VERIFICATION."

PERMANENT RULES:
1. NEVER "and others" — EVERY person named individually
2. Applicant = from Draft Sale Deed/Banakhat — Buyer section — NEVER from stamp paper
3. Current Owner = from LATEST submitted deed (deed > EC for ownership)
4. All 4 boundaries MANDATORY
5. Giro Mukeli / Release Deed = DISCHARGED — never report as active
6. Dukan=Shop | Banakhat Kabja Vagar=AoS Without Possession (NEVER call it Sale Deed)
7. LOAN AMOUNT = NEVER mention`

// ================================================================
// LAYER 2+3 — SONNET — TITLE VERIFICATION + RISK ENGINE
// ================================================================
const LAYER2_BASE = `You are the Title Verification Engine + Risk & Mortgageability Engine (Layers 2 and 3) of a 4-Layer AI Architecture for Banks and NBFCs.

NON-NEGOTIABLE:
- NEVER assume facts | NEVER create facts | NEVER infer ownership without documentary evidence
- NEVER certify title continuity where any link is unsupported
- NEVER suppress adverse findings
- Clearly distinguish: Verified Facts | Missing Information | Legal Issues | Legal Conclusions
- Unavailable info = "NOT PROVIDED FOR VERIFICATION."

TITLE CERTIFICATION RULE:
Title can be certified ONLY when ALL are satisfied:
✓ Ownership established from documentary evidence
✓ Title continuity established — every transfer supported
✓ Encumbrances verified — all mortgages discharged OR accounted for
✓ Revenue records reconciled with EC and registered documents
✓ Regulatory approvals verified
✓ Mortgageability assessed
Otherwise = "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

CONFIDENCE METHODOLOGY:
HIGH = Registered document + government record + EC + revenue records — all 4 support the fact
MEDIUM = At least two independent records support the fact
LOW = Only one document supports the fact
NO CONFIDENCE = Unsupported — no documentary evidence

RISK SCORING ENGINE:
Title Break = 100 | Litigation/Court Order = 90 | Existing Mortgage = 90 | Government Restriction = 85 | Acquisition Risk = 80 | Missing NA Order = 70 | Builder Title Defect = 70 | EC Mismatch = 60 | Missing Approval = 50 | Mutation Defect = 40 | Clerical Error = 10
Calculate TOTAL RISK SCORE from all issues found.
Risk Classification: 0-25=LOW RISK | 26-50=MODERATE RISK | 51-75=HIGH RISK | 76+=UNACCEPTABLE RISK

MORTGAGEABILITY ENGINE:
Mortgageable = Clear title, no encumbrance, all approvals present
Conditionally Mortgageable = Title acceptable subject to specific conditions
Not Mortgageable = Title break, critical defects, active undischarged mortgage

SARFAESI ENFORCEABILITY: Assess — Enforceable | Conditionally Enforceable | Not Enforceable

EC RULES — CRITICAL:
Col 3 (Aapnar) = SELLER/MORTGAGOR | Col 4 (Lenar) = BUYER/BANK | Col 7 = IGNORE
EC Applicant = empanelled advocate = COMPLETELY IGNORE — ZERO property interest
"Santosh Tansukh Thakrar" as EC Applicant = IGNORE completely — no property nexus

FERFAR RULES:
Skip first column. Col 1=Entry No+Date+Status | Col 2=Details | Col 3=Survey(if relevant) | Col 4(Last)=IGNORE

PERMANENT RULES:
1. NEVER "and others" — every person individually
2. Giro Mukeli = DISCHARGED — never report as active
3. Banakhat Kabja Vagar = AoS Without Possession — NEVER call Sale Deed
4. EC-confirmed deeds (copy not submitted) = include in chain naturally — NEVER flag
5. Subject property ONLY — verify Unit+Block+Floor for every EC entry
6. LOAN AMOUNT = NEVER mention`

function getLayer2System(caseType: string): string {
  const caseRules: Record<string, string> = {
    builder_purchase: `
CASE: BUILDER PURCHASE — Proposed purchaser buys from Builder and seeks bank finance.

MANDATORY META BLOCK:
---META---
APPLICANT: [Full name — from Draft Sale Deed/Banakhat/Allotment — Buyer — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership Firm / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant or specify]
MORTGAGOR_CONSTITUTION: [Individual / Partnership Firm / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL: Unit No.+Floor+Block+Scheme+Super Built-up Area+Land Area+Undivided Share+Survey No.+TP No.+FP No.+Mouje+Taluka+District+SRO]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Builder/Developer name — from title documents]
RISK_SCORE: [0-100 — calculated from all issues]
RISK_CLASS: [LOW RISK / MODERATE RISK / HIGH RISK / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
---END META---

BUILDER PURCHASE RULES:
1. Draft Sale Deed/Banakhat/Allotment = MANDATORY (mention at head of Part IV)
2. FERFAR for 20-30 years — chronological (Earlier to Present) aligned with EC
3. EC for 13-14 years — ALL entries — chronological — cross-check with FERFAR
4. EC date + Search Period mandatory
5. Builder mutation in 7/12 = required — absent = flag Part IX
6. Project Finance NOC = mandatory if Builder has project loan
7. Builder NOC for Mortgage = Pre-Disbursement mandatory
8. NA Order — trace from documents or FERFAR

PART XIII WORDING (EXACT):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    resale: `
CASE: RESALE — Current owner (not Builder) sells to proposed purchaser who seeks bank finance.

MANDATORY META BLOCK:
---META---
APPLICANT: [from Draft Sale Deed/Banakhat — Second Party/Vechan Lenar — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from last Registered Sale Deed unto Current Owner]
CURRENT_OWNER: [First Party/Vechan Aapnar — ALL names individually]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
---END META---

RESALE RULES:
1. Registered Sale Deed in favour of Current Owner = MANDATORY (trace from docs/EC/FERFAR)
2. Draft Sale Deed/Banakhat = MANDATORY
3. FERFAR 20-30 years | EC 13-14 years | Cross-check both
4. FALSE DECLARATION CHECK: Banakhat says "no charge" but EC shows mortgage = HIGH SEVERITY

PART XIII WORDING (EXACT):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    bt: `
CASE: BALANCE TRANSFER — Current owner transfers existing loan to new bank. NO property transfer.

MANDATORY META BLOCK:
---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Same as Applicant]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
---END META---

BT RULES:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. Registered Mortgage OR LOD = trace from docs/EC
3. EC will show existing mortgage — identify Bank + Deed No. + Date
4. LOD = Pre-Disbursement | No-Due Certificate + Release Deed = Post-Disbursement

PART XIII WORDING (EXACT):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    seller_bt: `
CASE: SELLER BT — Owner has existing loan AND sells to new purchaser. TWO simultaneous transactions.

MANDATORY META BLOCK:
---META---
APPLICANT: [Proposed purchaser — from Draft Deed/Banakhat — Buyer side]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Proposed purchaser]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Seller — First Party in Draft Deed/Banakhat]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
---END META---

SELLER BT RULES:
1. Sale Deed/Allotment/Share Certificate in favour of Current Owner = MANDATORY
2. Draft Sale Deed/Banakhat = MANDATORY
3. Registered Mortgage OR LOD = trace from docs/EC
4. FALSE DECLARATION: Banakhat says "no loan" but EC shows mortgage = HIGH SEVERITY
5. LOD + Foreclosure Letter = Pre-Disbursement | No-Due + Release Deed = Post-Disbursement

PART XIII WORDING (EXACT):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    lap: `
CASE: LAP/MORTGAGE — Current owner seeks loan against own property. NO existing loan. NO property transfer.

MANDATORY META BLOCK:
---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Same as Applicant]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
---END META---

LAP RULES:
1. Registered Sale Deed/Allotment/Share Certificate in favour of Current Owner = MANDATORY
2. EC shows ANY mortgage = UNDISCLOSED MORTGAGE = HIGH SEVERITY immediate flag
3. Original Registered Sale Deed = Pre-Disbursement mandatory

PART XIII WORDING (EXACT):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
  }

  return LAYER2_BASE + (caseRules[caseType] || caseRules['lap'])
}

function parseMeta(text: string) {
  const block = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const get = (key: string) => block.match(new RegExp(`^${key}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: get('APPLICANT'),
    coApplicant: get('CO_APPLICANT'),
    applicantConstitution: get('APPLICANT_CONSTITUTION'),
    mortgagor: get('MORTGAGOR'),
    mortgagorConstitution: get('MORTGAGOR_CONSTITUTION'),
    propertyDescription: get('PROPERTY_DESCRIPTION'),
    propertyBoundaries: get('PROPERTY_BOUNDARIES'),
    currentOwner: get('CURRENT_OWNER'),
    riskScore: get('RISK_SCORE'),
    riskClass: get('RISK_CLASS'),
    confidence: get('CONFIDENCE'),
    mortgageability: get('MORTGAGEABILITY'),
    sarfaesi: get('SARFAESI'),
  }
}

// ================================================================
// LAYER 4 — REPORT GENERATOR SYSTEM PROMPTS (PURE HTML)
// ================================================================

// STEP 3A — PART I + II + III
const L4_3A = `Generate HTML for PART I, PART II, PART III.
⚠️ PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ** NO ---.

PART I — BORROWER / MORTGAGOR DETAILS:
<hr><div class="ph">PART I — BORROWER / MORTGAGOR DETAILS</div>
<div class="sph">A. Name and Address of Borrower/s</div>
<table class="mt"><tr><td>Name</td><td>:</td><td>[Full names — individually]</td></tr><tr><td>Address</td><td>:</td><td>[As per documents]</td></tr></table>
<div class="sph">B. Constitution of Borrower/s</div>
<table class="mt"><tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm / Private Ltd. / Public Ltd. / HUF / Trust / Society]</td></tr></table>
<div class="sph">C. Name and Address of Mortgagor/s</div>
<table class="mt"><tr><td>Name</td><td>:</td><td>[Full names — if same as borrower write "Same as Borrower/s above"]</td></tr><tr><td>Address</td><td>:</td><td>[As per documents]</td></tr></table>
<div class="sph">D. Constitution of Mortgagor/s</div>
<table class="mt"><tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm etc.]</td></tr></table>
<div class="sph">E. Current Owner/s of the Property</div>
<table class="mt"><tr><td>Current Owner/s</td><td>:</td><td>[Full names individually — from latest deed/EC]</td></tr></table>

PART II — PROPERTY DESCRIPTION:
<hr><div class="ph">PART II — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES</div>
<table class="mt">
<tr><td>Property Type</td><td>:</td><td>[Flat/Shop/Bungalow/Plot/House]</td></tr>
<tr><td>Unit / Flat / Shop No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Floor</td><td>:</td><td>[Floor]</td></tr>
<tr><td>Block / Wing</td><td>:</td><td>[Block/Wing]</td></tr>
<tr><td>Scheme / Building Name</td><td>:</td><td>[Name]</td></tr>
<tr><td>Super Built-up Area</td><td>:</td><td>[Sq.Mtrs.]</td></tr>
<tr><td>Undivided Land Share</td><td>:</td><td>[If applicable / N.A.]</td></tr>
<tr><td>Survey / Block No.</td><td>:</td><td>[Details]</td></tr>
<tr><td>TP / FP No.</td><td>:</td><td>[Details]</td></tr>
<tr><td>Village (Mouje)</td><td>:</td><td>[Village]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Taluka]</td></tr>
<tr><td>District</td><td>:</td><td>[District]</td></tr>
<tr><td>SRO</td><td>:</td><td>[Sub-Registrar Office]</td></tr>
<tr><td>Land Use</td><td>:</td><td>[Bin Kheti (Non-Agricultural) / Agricultural / Other]</td></tr>
<tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

PART III — LIST OF SCRUTINISED DOCUMENTS:
<hr><div class="ph">PART III — LIST OF SCRUTINISED DOCUMENTS</div>
Latest first. 2-3 sentences each. NEVER Mutation Entries in Part III. NEVER stamp paper details.

Each doc: <div class="di"><p><span class="dn">N. [Name] — Reg. No. [X] | [DD-MM-YYYY]</span><br>[Executant] unto [Claimant]. [SRO. Key finding.]</p></div>

EC FORMAT: <div class="di"><p><span class="dn">N. Encumbrance Certificate — Period: [From] to [To] | Dated: [DD-MM-YYYY]</span><br>EC taken by Advocate [Name] for period [From] to [To] issued by Inspector General of Registration, Revenue Dept., Govt. of Gujarat. The EC discloses [COUNT] registered transaction/s for subject property:<br>Entry 1: [Type] — Deed No.[X] dated [DD/MM/YYYY] — Aapnar (Executing): [Name] — Lenar (Claimant): [Name/Bank] — [Active/Discharged].<br>Entry 2: [If exists — same format].</p></div>

RULES: NEVER "and others". EC Applicant = IGNORE. "Banakhat Kabja Vagar" = AoS Without Possession.
START: <hr><div class="ph">PART I — BORROWER / MORTGAGOR DETAILS</div>
END after Part III last document.`

// STEP 3B — PART IV + V + VI + VII
const L4_3B = `Generate HTML for PART IV, PART V, PART VI, PART VII.
⚠️ PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ** NO ---.

PART IV — CHRONOLOGICAL TITLE CHAIN:
Oldest to newest. NEVER "and others". First para no "Thereafter". Every subsequent starts "Thereafter,".
Each para ends with Mutation Entry No. + date.
EC-confirmed deeds = include naturally — no remark.
Mortgage entries = separate paragraph with discharge status.

FORMAT: <p>Thereafter, [Seller name/s] transferred subject property to [Buyer name/s] vide [Type] No.[X] dated [DD/MM/YYYY] at SRO [Name] for Rs.[X]. Entry recorded vide Mutation No.[X] dated [DD/MM/YYYY].</p>

FINAL PARA: <p>Thereafter, [Current Owner name/s] holds title as confirmed by EC dated [EC date] for period [From] to [To]. [Encumbrance status].</p>

PART V — REVENUE RECORD ANALYSIS:
Extract each 7/12/VF-6/Property Card:
<div class="sph">Village Form No. 7/12 — Survey/Block No. [X]</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr>
<tr><td>Survey/Block No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[H.Are.SqMt.]</td></tr>
<tr><td>Land Use</td><td>:</td><td>[Bin Kheti/Kheti/Other]</td></tr>
<tr><td>Ownership Column</td><td>:</td><td>[Names recorded]</td></tr>
<tr><td>Boja/Encumbrance</td><td>:</td><td>[NIL / Details]</td></tr>
<tr><td>Ganot/Tenant</td><td>:</td><td>[NIL / Details — flag if any]</td></tr>
</table>

PART VI — MUTATION ENTRY ANALYSIS:
List all Ferfar/Mutation entries chronologically (earliest to present):
<table class="mt" style="border:1px solid #ccc;">
<tr style="background:#EFF3FB;"><td><strong>Entry No.</strong></td><td><strong>Date</strong></td><td><strong>Status</strong></td><td><strong>Nature</strong></td><td><strong>Details</strong></td><td><strong>Survey No.</strong></td></tr>
[One row per entry]
</table>
<p>[Cross-check observation: EC entries vs Mutation entries — any discrepancy?]</p>

PART VII — ENCUMBRANCE ANALYSIS:
<hr><div class="ph">PART VII — ENCUMBRANCE ANALYSIS</div>
<p>Encumbrance Certificate dated [EC date] obtained for search period from [From] to [To] issued by Inspector General of Registration, Revenue Department, Government of Gujarat.</p>
[For each EC entry:]
<div class="di">
<p><span class="dn">Entry [N]: [Type of Deed]</span><br>
Deed No.: [X] | Date of Registration: [DD/MM/YYYY]<br>
Executing Party (Aapnar): [Full name/s]<br>
Claimant Party (Lenar): [Full name/s or Bank name]<br>
Status: [Active / Discharged vide Release Deed No. X dated DD/MM/YYYY]</p>
</div>
<p>[Overall EC observation: Total entries — any active mortgage — any recent entries — cross-check status]</p>

START: <hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END after Part VII.`

// STEP 3C — PART VIII + IX + X + XI + XII
const L4_3C = `Generate HTML for PART VIII, PART IX, PART X, PART XI, PART XII.
⚠️ PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ** NO ---.

PART VIII — APPROVALS AND REGULATORY COMPLIANCE:
<hr><div class="ph">PART VIII — APPROVALS AND REGULATORY COMPLIANCE</div>
For each approval — state if provided or "NOT PROVIDED FOR VERIFICATION.":
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
<tr><td>Building Permission / Sanctioned Plan</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
<tr><td>RERA Registration</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
<tr><td>BU Permission / Occupancy Certificate</td><td>:</td><td>[Details or NOT PROVIDED]</td></tr>
</table>

PART IX — LEGAL ISSUES (HIGH first, MEDIUM next, LOW last):
<hr><div class="ph">PART IX — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS</div>
<p>The following issues are identified. HIGH SEVERITY = conditions precedent to sanction.</p>

HIGH SEVERITY:
<div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[Exact reg nos, dates, names. Why material. Bank risk. — 3-4 sentences max.]</p><p><span class="sg">Direction:</span> [Specific remedy — from whom — by when.]</p></div>

MEDIUM SEVERITY:
<div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[2-3 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>

LOW SEVERITY:
<div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[1-2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>

NEVER FLAG: EC-confirmed deeds (copy not submitted) | EC Applicant name | Stamp Paper details

PART X — DOCUMENT DEFICIENCY REPORT:
<hr><div class="ph">PART X — DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">Available Documents</div><ol>[list]</ol>
<div class="sph">Missing Documents (Expected but Not Submitted)</div><ol>[list or "NIL — all expected documents produced."]</ol>
<div class="sph">Incomplete / Illegible Documents</div><ol>[list or "NIL."]</ol>

PART XI — MORTGAGEABILITY ASSESSMENT:
<hr><div class="ph">PART XI — MORTGAGEABILITY ASSESSMENT</div>
<div class="morta-box">
<p><strong>Mortgageability:</strong> [Mortgageable / Conditionally Mortgageable / Not Mortgageable]</p>
<p><strong>SARFAESI Enforceability:</strong> [Enforceable / Conditionally Enforceable / Not Enforceable]</p>
<p><strong>Lending Suitability:</strong> [Suitable / Conditionally Suitable / Not Suitable]</p>
<p><strong>Reasoning:</strong> [Brief explanation — why mortgageable or conditions or not]</p>
</div>

PART XII — RISK RATING:
<hr><div class="ph">PART XII — RISK RATING</div>
<div class="risk-box">
<div class="risk-title">Risk Assessment Engine</div>
<p><strong>Risk Score:</strong> <span class="risk-score risk-[low/mod/high]">[SCORE]/100</span></p>
<p><strong>Risk Classification:</strong> [LOW RISK / MODERATE RISK / HIGH RISK / UNACCEPTABLE RISK]</p>
<p><strong>Confidence Level:</strong> [HIGH / MEDIUM / LOW / NO CONFIDENCE]</p>
<p><strong>Primary Risk Factors:</strong> [Top 2-3 issues contributing to score]</p>
</div>
START: <hr><div class="ph">PART VIII — APPROVALS AND REGULATORY COMPLIANCE</div>
END after Part XII risk box.`

// STEP 3D — PART XIII + XIV + XV + XVI
const L4_3D = `Generate HTML for PART XIII, PART XIV, PART XV, PART XVI.
⚠️ PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ** NO ---.

PART XIII — LEGAL OPINION (use exact case-specific wording with actual names):
<hr><div class="ph">PART XIII — LEGAL OPINION AND FINAL RECOMMENDATION</div>
<p>[EXACT case-specific legal opinion paragraph — fill in actual names from analysis.]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act...</p>
<p>The property can be accepted by the way of SECURITY...</p>

DO NOT include "This opinion pertains to..." paragraph.

VERDICT BOX:
If NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[Reason — top issues]</p></div>
If CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">[Specific conditions]</p></div>
If CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">[Brief confirmation]</p></div>

PART XIV — PRE-DISBURSEMENT CONDITIONS:
<hr><div class="ph">PART XIV — DOCUMENTS REQUIRED — PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody before disbursement:</p>
<ol><li>[Specific document — exact description — one line each]</li></ol>

PART XV — POST-DISBURSEMENT CONDITIONS:
<hr><div class="ph">PART XV — DOCUMENTS REQUIRED — POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody post disbursement:</p>
<ol><li>[Specific document]</li></ol>

PART XVI — FINAL RECOMMENDATION:
<hr><div class="ph">PART XVI — FINAL RECOMMENDATION</div>
<div class="title-status">
<div class="ts-title">Final Title Status</div>
<div class="ts-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE REQUIRES RECTIFICATION / TITLE NOT RECOMMENDED / INSUFFICIENT DOCUMENTATION FOR TITLE CERTIFICATION]</div>
</div>

START: <hr><div class="ph">PART XIII — LEGAL OPINION AND FINAL RECOMMENDATION</div>
END after Part XVI title-status div.`

// ================================================================
// HTML BUILDER
// ================================================================
function buildHtml(p: {
  refNo: string; appId: string; today: string; bankName: string
  loanType: string; part123: string; part4567: string
  part891012: string; part13456: string
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
    <div class="sub">support@titlematrixai.com | www.titlematrixai.com</div>
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
${p.part123}
${p.part4567}
${p.part891012}
${p.part13456}
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
  Generated by TITLEMATRIXAI | support@titlematrixai.com | www.titlematrixai.com
  <div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ${p.bankName} in connection with Application ID ${p.appId}. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title or a legal warranty. This report is confidential and may not be reproduced or relied upon by any party other than the addressee bank without the express written consent of TITLEMATRIXAI.</div>
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

    // ── LAYER 1: HAIKU EXTRACTION ───────────────────────────────
    const layer1Content: any[] = []
    if (images?.length > 0) {
      for (const img of images) {
        layer1Content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
      }
    }

    let docText = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth) {
      docText += `\n\n=== PROPERTY BOUNDARIES (PRE-VERIFIED FROM DETAILS SHEET — USE EXACTLY) ===\nEast: ${boundaryEast || 'As per documents'}\nWest: ${boundaryWest || 'As per documents'}\nNorth: ${boundaryNorth || 'As per documents'}\nSouth: ${boundarySouth || 'As per documents'}\n===END===\n`
    }

    layer1Content.push({
      type: 'text',
      text: `LAYER 1 — DOCUMENT EXTRACTION ENGINE. Extract ALL facts from submitted documents.

CASE DETAILS SHEET (PRE-VERIFIED ANCHORS):
Applicant: ${applicantName || 'As per documents'}
Current Owner: ${currentOwner || 'As per documents'}
Case Type: ${caseType} | Loan Type: ${loanType || 'LAP'} | Bank: ${bankName} | APP ID: ${appId}
Co-Applicant: ${coApplicant || 'None'}
Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

CRITICAL NOTE — EC APPLICANT:
In the present case, Santosh Tansukh Thakrar is an empanelled advocate who has applied for EC in respect of the subjected property only. He has no relation or concern with the property. COMPLETELY IGNORE his name everywhere.

SUBMITTED DOCUMENTS:
${docText}

EXTRACTION RULES:
1. NEVER "and others" — ALL names individually
2. EC Col 7 = IGNORE | EC Applicant = IGNORE | Stamp Paper = IGNORE
3. ALL EC entries — count and extract each one with all column details
4. FERFAR: Skip first column. Col1=Entry No+Date+Status | Col2=Details | Col3=Survey(relevant only) | Col4=IGNORE
5. Assign CONFIDENCE (HIGH/MEDIUM/LOW/NO CONFIDENCE) to each major fact
6. Giro Mukeli = DISCHARGED | Subject property ONLY — Unit+Block+Floor match`
    })

    const layer1Msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: LAYER1_SYSTEM,
      messages: [{ role: 'user', content: layer1Content }]
    })
    const extractedFacts = layer1Msg.content[0].type === 'text' ? layer1Msg.content[0].text : ''

    // ── LAYER 2+3: SONNET TITLE+RISK ANALYSIS ──────────────────
    const layer23Msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: getLayer2System(caseType),
      messages: [{
        role: 'user',
        content: `LAYER 2+3 — TITLE VERIFICATION + RISK ENGINE.

CASE DETAILS:
Applicant: ${applicantName} | Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'}
Property: ${propertyAddress} | Bank: ${bankName} | APP ID: ${appId}
Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

EC APPLICANT NOTE: Santosh Tansukh Thakrar = empanelled advocate = ZERO property nexus = COMPLETELY IGNORE in ALL report sections.

LAYER 1 EXTRACTED FACTS:
${extractedFacts}

MANDATORY RULES:
1. Fill META block completely with accurate data
2. RISK_SCORE = sum of all applicable weighted scores (0-100)
3. CONFIDENCE = based on number of independent records supporting ownership
4. NEVER "and others" | EC Col7=IGNORE | Stamp Paper=IGNORE
5. EC-confirmed deeds (copy not submitted) = natural chain inclusion — NEVER flag as missing
6. All 4 boundaries from documents — MANDATORY`
      }]
    })
    const analysis = layer23Msg.content[0].type === 'text' ? layer23Msg.content[0].text : ''
    const meta = parseMeta(analysis)

    // ── LAYER 4: PARALLEL 4 CALLS — 16 PARTS ───────────────────
    const [r3a, r3b, r3c, r3d] = await Promise.all([

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4_3A,
        messages: [{
          role: 'user',
          content: `Generate Part I (Borrower/Mortgagor) + Part II (Property) + Part III (Documents).
APPLICANT: ${meta.applicant || applicantName} | CONSTITUTION: ${meta.applicantConstitution || 'Individual'}
CO-APPLICANT: ${meta.coApplicant || coApplicant || 'Not Applicable'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName} | CONSTITUTION: ${meta.mortgagorConstitution || 'Individual'}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY: ${meta.propertyDescription || propertyAddress}
BOUNDARIES: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}
BANK: ${bankName}
ANALYSIS: ${analysis.substring(0, 3000)}`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 5000, system: L4_3B,
        messages: [{
          role: 'user',
          content: `Generate Part IV (Title Chain) + Part V (Revenue) + Part VI (Mutation) + Part VII (EC Analysis).
CASE TYPE: ${caseType}
SUBJECT PROPERTY: ${meta.propertyDescription || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
APPLICANT: ${meta.applicant || applicantName}
ANALYSIS: ${analysis}`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 5000, system: L4_3C,
        messages: [{
          role: 'user',
          content: `Generate Part VIII (Approvals) + Part IX (Issues) + Part X (Deficiency) + Part XI (Mortgageability) + Part XII (Risk).
BANK: ${bankName} | PROPERTY: ${meta.propertyDescription || propertyAddress}
RISK_SCORE: ${meta.riskScore} | RISK_CLASS: ${meta.riskClass} | CONFIDENCE: ${meta.confidence}
MORTGAGEABILITY: ${meta.mortgageability} | SARFAESI: ${meta.sarfaesi}
ANALYSIS: ${analysis}
NOTE: NEVER flag EC Applicant (Santosh Tansukh Thakrar or any EC applicant).`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, system: L4_3D,
        messages: [{
          role: 'user',
          content: `Generate Part XIII (Legal Opinion) + Part XIV (Pre-Disbursement) + Part XV (Post-Disbursement) + Part XVI (Final Recommendation).
CASE TYPE: ${caseType}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPOSED PURCHASER/MORTGAGOR: ${meta.applicant || applicantName}
BANK: ${bankName}
EXISTING BANK (BT/Seller BT): extract from EC mortgage entry in analysis
MORTGAGEABILITY: ${meta.mortgageability} | RISK: ${meta.riskScore}
ANALYSIS: ${analysis}`
        }]
      })
    ])

    const part123 = r3a.content[0].type === 'text' ? r3a.content[0].text : '<p>Error Part I-III</p>'
    const part4567 = r3b.content[0].type === 'text' ? r3b.content[0].text : '<p>Error Part IV-VII</p>'
    const part891012 = r3c.content[0].type === 'text' ? r3c.content[0].text : '<p>Error Part VIII-XII</p>'
    const part13456 = r3d.content[0].type === 'text' ? r3d.content[0].text : '<p>Error Part XIII-XVI</p>'

    const reportHtml = buildHtml({
      refNo, appId: appId || 'AUTO-000000', today,
      bankName: bankName || 'Bank',
      loanType: loanType || 'Loan Against Property',
      part123, part4567, part891012, part13456,
    })

    const verdict = extractVerdict(analysis)
    let savedToDb = false, dbError = null

    if (userId && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('reports').insert({
          user_id: userId, case_type: caseType || 'lap',
          applicant_name: meta.applicant || applicantName || 'Unknown',
          bank_name: bankName || 'Unknown',
          property_address: meta.propertyDescription || propertyAddress || 'Unknown',
          app_id: appId || refNo, verdict, report_html: reportHtml,
        })
        if (error) { dbError = error.message } else { savedToDb = true }
      } catch (err: any) { dbError = err.message }
    }

    return NextResponse.json({
      success: true, report: reportHtml, verdict, savedToDb, dbError,
      debug: { extractedFacts, analysis, metaParsed: meta },
    })

  } catch (error: any) {
    console.error('TITLEMATRIXAI pipeline error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Pipeline failed' }, { status: 500 })
  }
}