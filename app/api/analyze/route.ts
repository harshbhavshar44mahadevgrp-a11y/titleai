// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts
// MASTER PROMPT v7.0 — 15-STAGE — 7 PART REPORT FORMAT
// PART I: Borrower | PART II: Property | PART III: Docs
// PART IV: Title Chain | PART V: Issues | PART VI: Opinion
// PART VII: Documents Required | Risk | Confidence | Title Status
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
  if (u.includes('TITLE NOT RECOMMENDED') || u.includes('VERDICT: NOT CLEAR') || u.includes('TITLE NOT CLEAR')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO') || u.includes('CONDITIONALLY MORTGAGEABLE')) return 'CLEAR SUBJECT TO'
  if (u.includes('CLEAR AND MARKETABLE') || u.includes('VERDICT: CLEAR') || u.includes('MORTGAGEABLE')) return 'CLEAR'
  return 'PENDING'
}

// ================================================================
// REPORT CSS
// ================================================================
const REPORT_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 13px; line-height: 1.85; color: #1a1a1a; background: #fff; max-width: 900px; margin: 0 auto; padding: 48px 60px; }
.hdr { border-bottom: 2px solid #1a1a1a; padding-bottom: 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
.hdr-left .firm { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
.hdr-left .sub { font-size: 11px; color: #555; letter-spacing: 0.5px; margin-top: 2px; }
.hdr-right { text-align: right; font-size: 12px; line-height: 1.9; }
.rtitle { font-size: 15px; font-weight: bold; text-align: center; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 4px; }
hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
.ph { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 10px; background: #1B3A6B; color: #fff; padding: 6px 14px; }
.sph { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #1B3A6B; margin: 12px 0 6px; border-bottom: 1px solid #1B3A6B; padding-bottom: 3px; }
.mt { width: 100%; margin-bottom: 10px; border-collapse: collapse; }
.mt td { font-size: 12px; padding: 4px 2px; vertical-align: top; }
.mt td:first-child { width: 240px; color: #444; }
.mt td:nth-child(2) { width: 16px; }
.mt td:last-child { font-weight: 500; color: #1a1a1a; }
p { margin-bottom: 10px; text-align: justify; }
.di { margin-bottom: 16px; }
.dn { font-weight: bold; }
.ib { margin-bottom: 22px; padding: 12px 14px; border-left: 4px solid #e5e7eb; background: #fafafa; }
.sh { display: inline-block; background: #b91c1c; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 10px; margin-bottom: 6px; letter-spacing: 0.5px; border-radius: 2px; }
.sm { display: inline-block; background: #b45309; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 10px; margin-bottom: 6px; letter-spacing: 0.5px; border-radius: 2px; }
.sl { display: inline-block; background: #1d4ed8; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 10px; margin-bottom: 6px; letter-spacing: 0.5px; border-radius: 2px; }
.it { font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #1a1a1a; }
.sg { font-weight: bold; font-style: italic; color: #1B3A6B; }
.pph { font-weight: bold; font-size: 12px; text-transform: uppercase; margin: 14px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; color: #1B3A6B; }
ol { padding-left: 22px; margin-bottom: 10px; }
ol li { margin-bottom: 5px; }
.risk-box { margin-top: 20px; padding: 14px 18px; border: 1px solid #1B3A6B; border-radius: 2px; background: #EFF3FB; }
.risk-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #1B3A6B; margin-bottom: 8px; letter-spacing: 0.5px; }
.risk-score { font-size: 22px; font-weight: bold; }
.risk-low { color: #15803d; }
.risk-mod { color: #b45309; }
.risk-high { color: #dc2626; }
.vnc { margin-top: 20px; padding: 14px 18px; border: 2px solid #b91c1c; background: #fff5f5; border-radius: 2px; }
.vc { margin-top: 20px; padding: 14px 18px; border: 2px solid #15803d; background: #f0fdf4; border-radius: 2px; }
.vs { margin-top: 20px; padding: 14px 18px; border: 2px solid #b45309; background: #fffbeb; border-radius: 2px; }
.vt { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
.title-status { margin-top: 20px; padding: 16px 20px; border: 3px solid #1B3A6B; background: #EFF3FB; border-radius: 2px; }
.ts-title { font-size: 11px; font-weight: bold; color: #1B3A6B; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
.ts-value { font-size: 15px; font-weight: bold; color: #1B3A6B; }
.sigrow { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
.sigbox { text-align: center; }
.sigline { width: 200px; border-bottom: 1px solid #1a1a1a; margin: 0 auto 6px; height: 40px; }
.ftr { margin-top: 36px; border-top: 1px solid #ccc; padding-top: 14px; font-size: 11px; color: #666; text-align: center; }
.disc { margin-top: 10px; font-size: 10px; color: #999; text-align: justify; line-height: 1.6; }
.wm { font-size: 10px; color: #bbb; text-align: center; margin-top: 8px; letter-spacing: 2px; text-transform: uppercase; }
@media print { body { padding: 30px 40px; } .ib { page-break-inside: avoid; } }
`

// ================================================================
// STEP 1 — HAIKU — 15-STAGE FACT EXTRACTION
// ================================================================
const STEP1_SYSTEM = `You are a Title Verification Engine — NOT a document summarization engine.

PURPOSE: Extract facts | Establish ownership | Verify title continuity | Detect defects | Identify missing documents.

NON-NEGOTIABLE:
- NEVER assume facts | NEVER create facts | NEVER infer ownership without documents
- NEVER certify title without continuity
- NEVER suppress adverse findings
- Unavailable info = "NOT PROVIDED FOR VERIFICATION."

STAGE 1 — DOCUMENT INVENTORY:
For each document: Type | Date | Registration No. | Executant | Claimant | Property Description | Survey No. | Area
Categorize: Available | Missing | Incomplete | Illegible
IMPORTANT: NEVER reproduce Stamp Paper number, Stamp Duty amount, Registration Fee details.

STAGE 2 — PROPERTY IDENTIFICATION:
Extract: Village | Taluka | District | Block No. | Revenue Survey No. | Final Plot No. | TP Scheme No. | City Survey No. | Building Name/No. | Scheme Name | Unit No. | Area | All 4 Boundaries
Raise objection for any mismatch.

STAGE 3 — TITLE EVENT EXTRACTION:
Sale | Inheritance | Succession | Partition | Court Order | Gift | N.A. Conversion | Development Agreement | POA | Builder Acquisition | Mortgage | Release | RERA | Allotment | Possession
Prepare chronological title event history.

STAGE 4 — TITLE CONTINUITY TEST:
Each transfer = documentary evidence required (deed or revenue record or registered document).
Unsupported transition = TITLE BREAK (CRITICAL Severity).

STAGE 5 — REVENUE RECORD VERIFICATION:
Village Form 6 | 7/12 | 8A | Hak Patrak | Property Card | Ferfar Entries
For each 7/12: Village | Taluka | District | Survey/Block No. | Total Area (H.Are.SqMt.) | Land Use

STAGE 6 — FERFAR ANALYSIS ENGINE:
SKIP FIRST COLUMN "Entry Details" — DO NOT READ IT.
After skipping first column:
Col 1: Date of Mutation Entry + Entry Number + Certified/Rejected
Col 2: Details — NA conversion | Death of chain owner | Transfer details
Col 3: Relevant Survey/Block Number — SKIP if not subject property
Col 4 (LAST): DO NOT CONSIDER — NEVER MENTION
Arrange chronologically.

STAGE 7 — EC ENGINE — CRITICAL:
STEP A: From E-Application Receipt extract: (a) EC Date (b) Search Period
STEP B: COUNT total entries for SUBJECT PROPERTY ONLY
STEP C: For EACH entry read columns:
  Col 1: Type of Deed — "Maliki Feran/Vecho"=Sale | "Boja/Giro"=Mortgage | "Giro Mukeli"=Release | "Banakhat"=AoS
  Col 2: Property Description
  Col 3: Executing Party "Aapnar" = SELLER / MORTGAGOR (gives deed)
  Col 4: Claimant Party "Lenar" = BUYER / MORTGAGEE / BANK (takes deed)
  Col 5: Date of Registration
  Col 6 (Second Last): Registration/Dastavej Number
  Col 7 (LAST): DO NOT READ — NEVER MENTION IN REPORT
NEVER reproduce: EC Last Column | E-Application Number | Name of EC Applicant
EC Applicant = empanelled advocate/bank officer = COMPLETELY IGNORE — ZERO property interest

STEP D: Verify each entry = subject property (Unit No. + Block + Floor exact match)
STEP E: Check mortgage entries — Release Deed exists? = DISCHARGED. No Release = ACTIVE.

STAGE 8 — TITLE RECONCILIATION:
Cross-match Revenue Records | Mutation | EC | Registered Documents
Detect: Missing Links | Ownership Mismatch | Area Mismatch | Encumbrance Mismatch

STAGE 9 — REGULATORY APPROVALS:
Check and mention if provided: NA Order | Development Permission | Rajachitthi | Building Permission | Sanctioned Plan | CC/Bandhakam Parvangi | RERA | Fire NOC | Airport NOC | BU Permission/OC
If not provided: "NOT PROVIDED FOR VERIFICATION."

STAGE 10 — CASE SOP: Apply case-specific rules.
STAGE 11 — DOCUMENT DEFICIENCY: Available | Expected | Missing
STAGE 12 — RISK ENGINE: Title Break=100 | Court=90 | Mortgage=90 | NA Missing=70 | Builder Defect=70 | EC Mismatch=60 | Approval Missing=50 | Mutation Missing=40 | Clerical=10
STAGE 13 — CONFIDENCE: HIGH / MEDIUM / LOW for each conclusion
STAGE 14 — MORTGAGEABILITY: Mortgageable | Conditionally Mortgageable | Not Mortgageable
STAGE 15 — LEGAL OPINION: Only after all validations complete.

PERMANENT RULES — NEVER VIOLATE:
1. NEVER "and others" / "and co-transferees" — name EVERY person individually
2. Applicant = from Draft Sale Deed/Banakhat — Buyer section — NEVER from stamp paper
3. Current Owner = from LATEST submitted deed — deed priority over EC
4. All 4 boundaries MANDATORY
5. Giro Mukeli/Release Deed = DISCHARGED — never report as active
6. EC Applicant = COMPLETELY IGNORE
7. Dukan=Shop | Banakhat Kabja Vagar=AoS Without Possession (NOT Sale Deed)
8. LOAN AMOUNT = NEVER mention
9. EC-confirmed deed = include in chain naturally — no flag
10. Subject property ONLY — verify Unit+Block+Floor for every EC entry`

// ================================================================
// STEP 2 — CASE-SPECIFIC DEEP ANALYSIS (ALL 5 CASES)
// ================================================================
const STEP2_BUILDER = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare COMPLETE legal analysis for a BUILDER PURCHASE case.

BUILDER PURCHASE: Proposed purchaser intends to buy from Builder and seeks bank finance.

---META---
APPLICANT: [Full name — from Draft Sale Deed/Banakhat/Allotment — Buyer — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
APPLICANT_ADDRESS: [As per documents]
APPLICANT_CONSTITUTION: [Individual / Partnership Firm / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant if same person — otherwise specify]
MORTGAGOR_ADDRESS: [As per documents]
MORTGAGOR_CONSTITUTION: [Individual / Partnership Firm / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL: Unit No.+Floor+Block+Scheme+Super Built-up Area+Land Area+Undivided Share+Survey No.+TP No.+FP No.+Mouje+Taluka+District+SRO]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Builder/Developer name from title documents]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

MANDATORY RULES:
1. NEVER "and others" — every name individually
2. EC Applicant = COMPLETELY IGNORE (empanelled advocate with zero property interest)
3. EC Col 7 = NEVER mention | Stamp Paper details = NEVER mention
4. Draft Sale Deed/Banakhat/Allotment = MANDATORY — mention at head of Part IV (Title Chain)
5. FERFAR for last 20-30 years — chronological
6. EC for last 13-14 years — chronological — ALL entries
7. Cross-check EC with FERFAR
8. Builder mutation in 7/12 required — if absent flag in Part V
9. Project Finance NOC = mandatory if Builder has project loan
10. Builder NOC for Mortgage = mandatory Pre-Disbursement
11. NA Order must be traced
12. Boundaries from last Banakhat/Allotment

PART VI — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

const STEP2_RESALE = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare COMPLETE legal analysis for a RESALE case.

RESALE: Current owner (not Builder) intends to sell to proposed purchaser who seeks bank finance.

---META---
APPLICANT: [from Draft Sale Deed/Banakhat — Second Party/Vechan Lenar — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
APPLICANT_ADDRESS: [As per documents]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant or specify]
MORTGAGOR_ADDRESS: [As per documents]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from last Registered Sale Deed unto Current Owner]
CURRENT_OWNER: [First Party/Vechan Aapnar in Draft Deed/Banakhat — ALL names individually]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

MANDATORY RULES:
1. NEVER "and others" — every name individually
2. EC Applicant = COMPLETELY IGNORE
3. Registered Sale Deed in favour of Current Owner = MANDATORY (trace from docs/EC/FERFAR)
4. Draft Sale Deed/Banakhat between owner and proposed purchaser = MANDATORY
5. FERFAR for 20-30 years | EC for 13-14 years | Cross-check both
6. Boundaries from last Registered Sale Deed unto Current Owner
7. "This opinion pertains to..." para = NOT REQUIRED

PART VI — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

const STEP2_BT = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare COMPLETE legal analysis for a BALANCE TRANSFER case.

BALANCE TRANSFER: Current owner has existing loan and wants to transfer to another Bank. NO property transfer.

---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
APPLICANT_ADDRESS: [As per documents]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_ADDRESS: [As per documents]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Same as applicant]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

MANDATORY RULES:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. Registered Deed of Mortgage OR LOD = trace from docs/EC
3. FERFAR for 20-30 years | EC for 13-14 years | Cross-check both
4. EC will show existing mortgage — identify Bank + Deed No. + Date
5. EC Applicant = IGNORE | EC Col 7 = IGNORE
6. LOD from existing Bank = Pre-Disbursement mandatory
7. No-Due Certificate + Release Deed = Post-Disbursement
8. "This opinion pertains to..." para = NOT REQUIRED

PART VI — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

const STEP2_SELLER_BT = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare COMPLETE legal analysis for a SELLER BT case — most complex transaction.

SELLER BT: Owner has existing loan AND wants to sell. TWO simultaneous transactions.

---META---
APPLICANT: [Proposed purchaser — from Draft Deed/Banakhat — Buyer side]
CO_APPLICANT: [Full names or N/A]
APPLICANT_ADDRESS: [As per documents]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Proposed purchaser — same as applicant]
MORTGAGOR_ADDRESS: [As per documents]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Seller — First Party in Draft Deed/Banakhat]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

MANDATORY RULES:
1. Registered Sale Deed/Allotment/Share Certificate in favour of Current Owner = MANDATORY
2. Draft Sale Deed/Banakhat between owner and proposed purchaser = MANDATORY
3. Registered Deed of Mortgage OR LOD = trace from docs/EC
4. FALSE DECLARATION: If Banakhat says "no loan" but EC shows mortgage = HIGH SEVERITY
5. FERFAR for 20-30 years | EC for 13-14 years | EC Applicant = IGNORE
6. LOD + Foreclosure Letter = Pre-Disbursement mandatory
7. No-Due Certificate + Release Deed = Post-Disbursement
8. "This opinion pertains to..." para = NOT REQUIRED

PART VI — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

const STEP2_LAP = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare COMPLETE legal analysis for a LAP / MORTGAGE case.

LAP: Current owner has NO existing loan. Seeking loan against own property. NO property transfer.

---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
APPLICANT_ADDRESS: [As per documents]
APPLICANT_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_ADDRESS: [As per documents]
MORTGAGOR_CONSTITUTION: [Individual / Partnership / Company / HUF / Trust]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Same as applicant]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

MANDATORY RULES:
1. Registered Sale Deed/Allotment/Share Certificate in favour of Current Owner = MANDATORY
2. If EC shows ANY mortgage/charge = UNDISCLOSED MORTGAGE = HIGH SEVERITY immediate flag
3. FERFAR for 20-30 years | EC for 13-14 years | EC Applicant = IGNORE
4. Original Registered Sale Deed unto Current Owner = Pre-Disbursement mandatory
5. "This opinion pertains to..." para = NOT REQUIRED

PART VI — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

function getStep2System(caseType: string): string {
  switch (caseType) {
    case 'builder_purchase': return STEP2_BUILDER
    case 'resale': return STEP2_RESALE
    case 'bt': return STEP2_BT
    case 'seller_bt': return STEP2_SELLER_BT
    case 'lap': return STEP2_LAP
    default: return STEP2_LAP
  }
}

function parseMeta(text: string) {
  const block = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const get = (key: string) => block.match(new RegExp(`^${key}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: get('APPLICANT'),
    coApplicant: get('CO_APPLICANT'),
    applicantAddress: get('APPLICANT_ADDRESS'),
    applicantConstitution: get('APPLICANT_CONSTITUTION'),
    mortgagor: get('MORTGAGOR'),
    mortgagorAddress: get('MORTGAGOR_ADDRESS'),
    mortgagorConstitution: get('MORTGAGOR_CONSTITUTION'),
    propertyDescription: get('PROPERTY_DESCRIPTION'),
    propertyBoundaries: get('PROPERTY_BOUNDARIES'),
    currentOwner: get('CURRENT_OWNER'),
    riskScore: get('RISK_SCORE'),
    confidence: get('CONFIDENCE'),
    mortgageability: get('MORTGAGEABILITY'),
  }
}

// ================================================================
// STEP 3 SYSTEM PROMPTS — PURE HTML ONLY
// ================================================================

// STEP 3A — PART I + PART II
const STEP3A_SYSTEM = `Generate HTML for PART I and PART II ONLY.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ### NO ** NO ---.

PART I — NAME, ADDRESS AND CONSTITUTION:
<hr><div class="ph">PART I — BORROWER / MORTGAGOR DETAILS</div>
<div class="sph">A. Name and Address of Borrower/s</div>
<table class="mt">
  <tr><td>Name of Borrower/s</td><td>:</td><td>[Full name/s individually]</td></tr>
  <tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
</table>
<div class="sph">B. Constitution of Borrower/s</div>
<table class="mt">
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm / Private Limited Company / Public Limited Company / HUF / Trust / Society]</td></tr>
</table>
<div class="sph">C. Name and Address of Mortgagor/s</div>
<table class="mt">
  <tr><td>Name of Mortgagor/s</td><td>:</td><td>[Full name/s — if same as borrower write "Same as Borrower/s above"]</td></tr>
  <tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
</table>
<div class="sph">D. Constitution of Mortgagor/s</div>
<table class="mt">
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm etc.]</td></tr>
</table>
<div class="sph">E. Current Owner/s of the Property</div>
<table class="mt">
  <tr><td>Current Owner/s</td><td>:</td><td>[Full name/s individually — from latest deed]</td></tr>
</table>

PART II — PROPERTY DESCRIPTION:
<hr><div class="ph">PART II — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES</div>
<table class="mt">
  <tr><td>Property Type</td><td>:</td><td>[Flat/Shop/Bungalow/Plot etc.]</td></tr>
  <tr><td>Unit / Flat / Shop No.</td><td>:</td><td>[Unit number]</td></tr>
  <tr><td>Floor</td><td>:</td><td>[Floor]</td></tr>
  <tr><td>Block / Wing</td><td>:</td><td>[Block/Wing]</td></tr>
  <tr><td>Scheme / Building Name</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Super Built-up Area</td><td>:</td><td>[Area in Sq.Mtrs.]</td></tr>
  <tr><td>Undivided Land Share</td><td>:</td><td>[If applicable]</td></tr>
  <tr><td>Survey / Block No.</td><td>:</td><td>[Survey/Block details]</td></tr>
  <tr><td>TP / FP No.</td><td>:</td><td>[TP Scheme and FP details]</td></tr>
  <tr><td>Village (Mouje)</td><td>:</td><td>[Village name]</td></tr>
  <tr><td>Taluka</td><td>:</td><td>[Taluka]</td></tr>
  <tr><td>District</td><td>:</td><td>[District]</td></tr>
  <tr><td>SRO</td><td>:</td><td>[Sub-Registrar Office name]</td></tr>
  <tr><td>Land Use</td><td>:</td><td>[Bin Kheti (Non-Agricultural) / Agricultural]</td></tr>
  <tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
  <tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
  <tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
  <tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

RULES: Every name individually. NEVER "and others". EC Applicant = IGNORE.`

// STEP 3B — PART III + PART IV
const STEP3B_SYSTEM = `Generate HTML for PART III and PART IV ONLY.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ### NO ** NO ---.

PART III — LIST OF SCRUTINISED DOCUMENTS:
Latest first, oldest last. NEVER include Mutation Entries. NEVER mention Stamp Paper details.

FORMAT EACH DOCUMENT:
<div class="di">
  <p><span class="dn">N. [Document Name] — Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>
  [Executant/Aapnar] unto and in favour of [Claimant/Lenar]. [SRO. Key observation.]</p>
</div>

EC FORMAT IN PART III:
<div class="di">
  <p><span class="dn">N. Encumbrance Certificate — Period: [From DD/MM/YYYY] to [DD/MM/YYYY] | EC Dated: [DD-MM-YYYY]</span><br>
  EC taken by Advocate [Name] for the period [From] to [To] issued by Inspector General of Registration, Revenue Department, Government of Gujarat.
  The EC discloses [COUNT] registered transaction/s for the subject property:<br>
  Entry 1: [Type] — Deed No. [X] dated [DD/MM/YYYY] — Aapnar (Executing Party): [Full name] — Lenar (Claimant Party): [Full name/Bank] — [Active/Discharged].<br>
  Entry 2: [If exists] — Deed No. [X] dated [DD/MM/YYYY] — Aapnar: [Name] — Lenar: [Name/Bank] — [Active/Discharged vide Release Deed No. X].</p>
</div>

PART IV — CHRONOLOGICAL TITLE CHAIN:
Oldest first. NEVER "and others".

FORMAT FIRST PARAGRAPH:
<p>[Earliest holder/s] acquired/held the subject property. [Original acquisition — allotment/agricultural/etc.] [Deed type, No., Date, Amount.] Entry recorded vide Mutation No. [X] dated [DD/MM/YYYY].</p>

FORMAT SUBSEQUENT PARAGRAPHS (always start "Thereafter,"):
<p>Thereafter, [Seller name/s] transferred the subject property to [Buyer name/s] vide [Deed Type] No. [X] dated [DD/MM/YYYY] registered at SRO [Name] for consideration of Rs. [X]. Entry recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

FORMAT MORTGAGE IN CHAIN:
<p>Thereafter, [Mortgagor name] created mortgage over the subject property in favour of [Bank/Mortgagee name] vide Registered Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. [Said mortgage stands discharged vide Release Deed No. X / Said mortgage is ACTIVE and subsisting as of date of this report.]</p>

FORMAT FINAL PARAGRAPH:
<p>Thereafter, [Current Owner name/s] holds title in the subject property as the current registered owner/s as confirmed by Encumbrance Certificate dated [EC date] covering search period from [From] to [To]. [Encumbrance status.]</p>

START: <hr><div class="ph">PART III — LIST OF SCRUTINISED DOCUMENTS</div>
Then docs. Then: <hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
Then chain paragraphs. END after final paragraph.`

// STEP 3C — PART V (Issues + Risk)
const STEP3C_SYSTEM = `Generate HTML for PART V ONLY — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ### NO ** NO ---.

OPENING:
<hr><div class="ph">PART V — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS</div>
<p>The following issues have been identified during 15-stage title verification. HIGH SEVERITY issues are conditions precedent to sanction or disbursement.</p>

HIGH SEVERITY ISSUES FIRST:
<div class="ib">
  <div><span class="sh">HIGH SEVERITY</span></div>
  <div class="it">1. [Specific Issue Title]</div>
  <p>[Finding — exact reg nos, dates, party names — 3-4 sentences. Why legally material. Bank risk.]</p>
  <p><span class="sg">Direction:</span> [Specific document required — from whom — by when.]</p>
</div>

MEDIUM SEVERITY:
<div class="ib">
  <div><span class="sm">MEDIUM SEVERITY</span></div>
  <div class="it">1. [Issue Title]</div>
  <p>[Finding — 2-3 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

LOW SEVERITY:
<div class="ib">
  <div><span class="sl">LOW SEVERITY</span></div>
  <div class="it">1. [Issue Title]</div>
  <p>[1-2 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

NEVER FLAG: EC-confirmed deeds (copy not submitted) | EC Applicant name | Stamp Paper details

RISK ASSESSMENT AFTER ALL ISSUES:
<div class="risk-box">
  <div class="risk-title">Risk Assessment — 15-Stage Verification Engine</div>
  <p><strong>Risk Score:</strong> <span class="risk-score risk-[low/mod/high]">[SCORE]/100</span> &nbsp;&nbsp; <strong>Classification:</strong> [LOW / MODERATE / HIGH / UNACCEPTABLE] RISK</p>
  <p><strong>Confidence Level:</strong> [HIGH / MEDIUM / LOW] CONFIDENCE</p>
  <p><strong>Mortgageability:</strong> [Mortgageable / Conditionally Mortgageable / Not Mortgageable]</p>
</div>

END after risk-box.`

// STEP 3D — PART VI + PART VII + Status
const STEP3D_SYSTEM = `Generate HTML for PART VI, PART VII, and Final Title Status.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ### NO ** NO ---.

PART VI — LEGAL OPINION (use exact case-specific wording — fill actual names):
<hr><div class="ph">PART VI — LEGAL OPINION AND FINAL RECOMMENDATION</div>
<p>[Case-specific legal opinion paragraph with exact names filled in.]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act...</p>
<p>The property can be accepted by the way of SECURITY...</p>

DO NOT include "This opinion pertains to..." paragraph — NOT required.

VERDICT BOX:
If NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[Brief reason]</p></div>
If CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">[Conditions]</p></div>
If CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">[Brief confirmation]</p></div>

PART VII — DOCUMENTS REQUIRED:
<hr><div class="ph">PART VII — DOCUMENTS REQUIRED</div>
<div class="pph">A. Documents Required — Pre-Disbursement (Mandatory Before Sanction)</div>
<ol>
  <li>[Specific document — exact description]</li>
</ol>
<div class="pph">B. Documents Required — Post-Disbursement</div>
<ol>
  <li>[Specific document]</li>
</ol>

FINAL TITLE STATUS:
<div class="title-status">
  <div class="ts-title">Final Title Status</div>
  <div class="ts-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE REQUIRES RECTIFICATION / TITLE NOT RECOMMENDED / INSUFFICIENT DOCUMENTATION FOR TITLE CERTIFICATION]</div>
</div>

START: <hr><div class="ph">PART VI — LEGAL OPINION AND FINAL RECOMMENDATION</div>
END after title-status div.`

// ================================================================
// HTML BUILDER
// ================================================================
function buildHtml(p: {
  refNo: string; appId: string; today: string; bankName: string
  loanType: string; applicantName: string; part12Html: string
  part34Html: string; part5Html: string; part67Html: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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

${p.part12Html}
${p.part34Html}
${p.part5Html}
${p.part67Html}

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

    // ── STEP 1: HAIKU ──────────────────────────────────────────
    const step1Content: any[] = []
    if (images && images.length > 0) {
      for (const img of images) {
        step1Content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
      }
    }

    let enhancedDocText = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth) {
      enhancedDocText += `\n\n=== PROPERTY BOUNDARIES (PRE-VERIFIED — USE EXACTLY) ===\nEast: ${boundaryEast || 'As per documents'}\nWest: ${boundaryWest || 'As per documents'}\nNorth: ${boundaryNorth || 'As per documents'}\nSouth: ${boundarySouth || 'As per documents'}\n=== END ===\n`
    }

    step1Content.push({
      type: 'text',
      text: `Perform complete 15-stage title verification fact extraction.

CASE DETAILS SHEET (PRE-VERIFIED ANCHORS):
- Applicant: ${applicantName || 'As per documents'}
- Current Owner: ${currentOwner || 'As per documents'}
- Case Type: ${caseType}
- Loan Type: ${loanType || 'LAP'}
- Property: ${propertyAddress || 'As per documents'}
- Bank: ${bankName}
- APP ID: ${appId}
- Co-Applicant: ${coApplicant || 'None'}
- Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

IMPORTANT — EC APPLICANT IN PRESENT CASE:
Santosh Tansukh Thakrar is an empanelled advocate who has applied for EC in respect of the subjected property only. Santosh Tansukh Thakrar has no relation or concern whatsoever with the subjected property. COMPLETELY IGNORE his name.

SUBMITTED DOCUMENTS:
${enhancedDocText}

KEY RULES:
1. NEVER "and others" — ALL names individually
2. EC Col 7 = IGNORE | EC Applicant = IGNORE | Stamp Paper details = IGNORE
3. ALL EC entries for subject property — count and extract each one
4. Giro Mukeli = DISCHARGED | FERFAR Col 4 (Last) = IGNORE
5. Subject property ONLY — Unit+Block+Floor match for every EC entry`
    })

    const step1Msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: STEP1_SYSTEM,
      messages: [{ role: 'user', content: step1Content }]
    })
    const extractedFacts = step1Msg.content[0].type === 'text' ? step1Msg.content[0].text : ''

    // ── STEP 2: SONNET ─────────────────────────────────────────
    const step2Msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: getStep2System(caseType),
      messages: [{
        role: 'user',
        content: `Perform complete 15-stage legal analysis.

CASE DETAILS (PRE-VERIFIED):
- Applicant: ${applicantName}
- Current Owner: ${currentOwner || 'As per documents'}
- Property: ${propertyAddress}
- Bank: ${bankName}
- Co-Applicant: ${coApplicant || 'None'}
- Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

IMPORTANT: Santosh Tansukh Thakrar = empanelled advocate who applied for EC only = ZERO property nexus = COMPLETELY IGNORE in ALL report sections.

EXTRACTED FACTS:
${extractedFacts}

MANDATORY RULES:
1. NEVER "and others" — every person individually
2. Fill META block completely — include APPLICANT_CONSTITUTION and MORTGAGOR_CONSTITUTION
3. EC Applicant = IGNORE | EC Col 7 = IGNORE | Stamp Paper = IGNORE
4. EC-confirmed deeds: include naturally in chain — NEVER flag in Part V
5. All 4 boundaries MANDATORY
6. RISK_SCORE numeric 0-100 | CONFIDENCE: HIGH/MEDIUM/LOW | MORTGAGEABILITY: one of 3 options`
      }]
    })
    const legalAnalysis = step2Msg.content[0].type === 'text' ? step2Msg.content[0].text : ''
    const meta = parseMeta(legalAnalysis)

    // ── STEP 3: ALL 4 PARALLEL ─────────────────────────────────
    const [s3aMsg, s3bMsg, s3cMsg, s3dMsg] = await Promise.all([

      // 3A — Part I (Borrower/Mortgagor) + Part II (Property)
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: STEP3A_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part I (Borrower/Mortgagor details) and Part II (Property Description + Boundaries).

APPLICANT: ${meta.applicant || applicantName}
CO-APPLICANT: ${meta.coApplicant || coApplicant || 'Not Applicable'}
APPLICANT ADDRESS: ${meta.applicantAddress || 'As per documents'}
APPLICANT CONSTITUTION: ${meta.applicantConstitution || 'Individual'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
MORTGAGOR ADDRESS: ${meta.mortgagorAddress || 'As per documents'}
MORTGAGOR CONSTITUTION: ${meta.mortgagorConstitution || 'Individual'}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY: ${meta.propertyDescription || propertyAddress}
BOUNDARIES: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

ANALYSIS: ${legalAnalysis.substring(0, 2000)}`
        }]
      }),

      // 3B — Part III (Documents) + Part IV (Title Chain)
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 5000,
        system: STEP3B_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part III (Documents List) and Part IV (Title Chain).

CASE TYPE: ${caseType}
SUBJECT PROPERTY: ${meta.propertyDescription || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
APPLICANT: ${meta.applicant || applicantName}

ANALYSIS:
${legalAnalysis}

RULES:
- Part III: Latest doc first. EC = show ALL entries with Entry numbers, Aapnar/Lenar names, dates. NEVER stamp paper details.
- Part IV: Oldest first. First para no "Thereafter". Every subsequent starts "Thereafter,". EC-confirmed deeds = include naturally.
- EC Applicant = IGNORE. Subject property ONLY.`
        }]
      }),

      // 3C — Part V (Issues + Risk)
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 5000,
        system: STEP3C_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part V — Legal Issues + Risk Assessment.

PROPERTY: ${meta.propertyDescription || propertyAddress}
BANK: ${bankName}
RISK SCORE: ${meta.riskScore || 'calculate'}
CONFIDENCE: ${meta.confidence || 'calculate'}
MORTGAGEABILITY: ${meta.mortgageability || 'calculate'}

ANALYSIS:
${legalAnalysis}

RULES: HIGH first, MEDIUM next, LOW last. NEVER flag EC-confirmed deeds. NEVER flag EC Applicant (Santosh Tansukh Thakrar or anyone who applied for EC).`
        }]
      }),

      // 3D — Part VI (Opinion) + Part VII (Docs) + Title Status
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: STEP3D_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part VI (Legal Opinion) + Part VII (Documents Required) + Final Title Status.

CASE TYPE: ${caseType}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPOSED PURCHASER/MORTGAGOR: ${meta.applicant || applicantName}
BANK: ${bankName}
EXISTING BANK (BT/Seller BT): extract from EC mortgage entry in analysis
MORTGAGEABILITY: ${meta.mortgageability}

ANALYSIS:
${legalAnalysis}

RULES: Exact case-specific Part VI wording. Part VII A = Pre-Disbursement, Part VII B = Post-Disbursement. Final Title Status = one of 5 options.`
        }]
      })
    ])

    const part12Html = s3aMsg.content[0].type === 'text' ? s3aMsg.content[0].text : '<p>Error Part I/II</p>'
    const part34Html = s3bMsg.content[0].type === 'text' ? s3bMsg.content[0].text : '<p>Error Part III/IV</p>'
    const part5Html = s3cMsg.content[0].type === 'text' ? s3cMsg.content[0].text : '<p>Error Part V</p>'
    const part67Html = s3dMsg.content[0].type === 'text' ? s3dMsg.content[0].text : '<p>Error Part VI/VII</p>'

    const reportHtml = buildHtml({
      refNo,
      appId: appId || 'AUTO-000000',
      today,
      bankName: bankName || 'Bank',
      loanType: loanType || 'Loan Against Property',
      applicantName: meta.applicant || applicantName || 'As per Documents',
      part12Html,
      part34Html,
      part5Html,
      part67Html,
    })

    const verdict = extractVerdict(legalAnalysis)
    let savedToDb = false, dbError = null

    if (userId && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('reports').insert({
          user_id: userId,
          case_type: caseType || 'lap',
          applicant_name: meta.applicant || applicantName || 'Unknown',
          bank_name: bankName || 'Unknown',
          property_address: meta.propertyDescription || propertyAddress || 'Unknown',
          app_id: appId || refNo,
          verdict,
          report_html: reportHtml,
        })
        if (error) { dbError = error.message } else { savedToDb = true }
      } catch (err: any) { dbError = err.message }
    }

    return NextResponse.json({
      success: true, report: reportHtml, verdict, savedToDb, dbError,
      debug: { extractedFacts, legalAnalysis, metaParsed: meta },
    })

  } catch (error: any) {
    console.error('TITLEMATRIXAI pipeline error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Pipeline failed' }, { status: 500 })
  }
}