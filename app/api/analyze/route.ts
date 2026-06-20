// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts  v9.0 DEFINITIVE
// 4-LAYER ARCHITECTURE × 16-PART REPORT
// Based on Master System Prompt — All Rules Implemented
// ================================================================
export const maxDuration = 300
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
  if (u.includes('TITLE NOT RECOMMENDED') || u.includes('NOT CLEAR') || u.includes('TITLE BREAK')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO') || u.includes('CONDITIONALLY MORTGAGEABLE')) return 'CLEAR SUBJECT TO'
  if (u.includes('CLEAR AND MARKETABLE') || u.includes('MORTGAGEABLE')) return 'CLEAR'
  return 'PENDING'
}

// ================================================================
// CSS — PROFESSIONAL LEGAL REPORT STYLE
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
.pph { font-weight:bold; font-size:12px; text-transform:uppercase; margin:14px 0 6px; border-bottom:1px solid #ccc; padding-bottom:3px; color:#1B3A6B; }
ol { padding-left:22px; margin-bottom:10px; }
ol li { margin-bottom:5px; }
table.ec-tbl { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; }
table.ec-tbl th { background:#1B3A6B; color:#fff; padding:6px 8px; text-align:left; font-size:11px; }
table.ec-tbl td { border:1px solid #ddd; padding:6px 8px; vertical-align:top; }
table.ec-tbl tr:nth-child(even) { background:#f7f9fc; }
table.mut-tbl { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; }
table.mut-tbl th { background:#374151; color:#fff; padding:5px 8px; text-align:left; font-size:11px; }
table.mut-tbl td { border:1px solid #e5e7eb; padding:5px 8px; vertical-align:top; }
table.mut-tbl tr:nth-child(even) { background:#f9fafb; }
.risk-box { margin-top:16px; padding:16px 20px; border:2px solid #1B3A6B; border-radius:3px; background:#EFF3FB; }
.risk-title { font-size:12px; font-weight:bold; text-transform:uppercase; color:#1B3A6B; margin-bottom:10px; letter-spacing:0.5px; }
.risk-score { font-size:28px; font-weight:bold; }
.risk-low { color:#15803d; }
.risk-mod { color:#b45309; }
.risk-high { color:#dc2626; }
.morta-box { margin-top:12px; padding:14px 18px; border:1px solid #1B3A6B; border-radius:2px; background:#f0f7ff; }
.vnc { margin-top:20px; padding:14px 18px; border:2px solid #b91c1c; background:#fff5f5; border-radius:2px; }
.vc  { margin-top:20px; padding:14px 18px; border:2px solid #15803d; background:#f0fdf4; border-radius:2px; }
.vs  { margin-top:20px; padding:14px 18px; border:2px solid #b45309; background:#fffbeb; border-radius:2px; }
.vt  { font-size:13px; font-weight:bold; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px; }
.title-status { margin-top:22px; padding:18px 22px; border:3px solid #1B3A6B; background:#EFF3FB; border-radius:2px; }
.ts-title { font-size:11px; font-weight:bold; color:#1B3A6B; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase; }
.ts-value { font-size:16px; font-weight:bold; color:#1B3A6B; }
.sigrow { margin-top:50px; display:flex; justify-content:space-between; align-items:flex-end; }
.sigbox { text-align:center; }
.sigline { width:200px; border-bottom:1px solid #1a1a1a; margin:0 auto 6px; height:40px; }
.ftr { margin-top:36px; border-top:1px solid #ccc; padding-top:14px; font-size:11px; color:#666; text-align:center; }
.disc { margin-top:10px; font-size:10px; color:#999; text-align:justify; line-height:1.6; }
.wm { font-size:10px; color:#bbb; text-align:center; margin-top:8px; letter-spacing:2px; text-transform:uppercase; }
@media print { body{padding:30px 40px;} .ib{page-break-inside:avoid;} }
`

// ================================================================
// LAYER 1 — HAIKU — DOCUMENT EXTRACTION ENGINE (Prompt 2)
// ================================================================
const LAYER1_SYSTEM = `You are the Document Extraction Engine — Layer 1 of a 4-Layer AI Title Verification System for Banks and NBFCs.

YOUR ONLY TASK: Extract ALL facts from submitted documents. Do NOT generate legal opinion.

NON-NEGOTIABLE:
• NEVER assume facts | NEVER create facts | NEVER infer ownership without documents
• NEVER suppress adverse findings
• Unavailable info = "NOT PROVIDED FOR VERIFICATION."

CONFIDENCE LEVELS (assign to each fact):
HIGH = Supported by registered document + government record + EC + revenue records (all 4)
MEDIUM = Supported by at least two independent records
LOW = Supported by one document only
NO CONFIDENCE = Unsupported

═══════════════════════════════════════════════════════
DOCUMENT INVENTORY — FOR EACH DOCUMENT EXTRACT:
═══════════════════════════════════════════════════════
1. Document Type
2. Date
3. Registration Number (NEVER stamp paper number / stamp duty / registration fee)
4. Executant (full names — EVERY person individually — NEVER "and others")
5. Claimant (full names — EVERY person individually)
6. Property Description
7. Survey/Block Number
8. Village | Taluka | District | Area | Boundaries
Classify: Available | Missing | Incomplete | Illegible

PROPERTY DESCRIPTION — MANDATORY PARAGRAPH FORMAT:
Extract property details and format exactly as:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."
If any field is not available from documents, write "NOT PROVIDED FOR VERIFICATION" for that field only.

═══════════════════════════════════════════════════════
FERFAR / MUTATION ENTRIES — STRICT COLUMN RULES:
═══════════════════════════════════════════════════════
SKIP first column "Entry Details" — DO NOT READ IT.
Col 1 (after skip): Entry No. + Date of Entry + Certified/Rejected status
Col 2 (after skip): Nature — NA conversion | Death of owner | Transfer | Partition | Court order
Col 3 (after skip): Relevant Survey/Block No. — SKIP if not subject property
Col 4 (after skip / LAST): DO NOT CONSIDER — NEVER MENTION IN REPORT

═══════════════════════════════════════════════════════
ENCUMBRANCE CERTIFICATE — STRICT EXTRACTION RULES:
═══════════════════════════════════════════════════════
STEP 1 — Extract from E-Application Receipt (3 MANDATORY fields):
  (a) EC APPLICATION NUMBER = "e-Application No." / "E-Arji Nambar" shown on E-Application Receipt
      This is the unique EC reference number — MUST be extracted and mentioned in report.
  (b) EC APPLICATION DATE = "Date of Print" / "Chhapavani Tarikh" on E-Application Receipt
  (c) SEARCH PERIOD / DURATION = "From Date" to "To Date" of "શોધ અગર તપાસણી" (Duration of Search)
      Example: "01/01/2010 to 11/06/2026"
  ALL THREE ARE MANDATORY — mention all three in report.

STEP 2 — Count ALL entries for subject property. NEVER miss any entry.

STEP 3 — For EACH entry read ALL columns carefully:

  Col 1: TYPE OF DOCUMENT (Gujarati) — MUST TRANSLATE TO ENGLISH:
  ═══ COMPLETE GUJARATI → ENGLISH TRANSLATION TABLE ═══
  "માલિકી ફેરખત" OR "માલિકી ફેર ખત" OR "વેચાણ" = Sale Deed / Ownership Transfer Deed
  "ગીરો ખત" OR "ગીરોખત" OR "ગીરો" = Mortgage Deed
  "ગીરો મુક્તિ" OR "ગીરો મુક્તિ પ્ત્ર" = Release of Mortgage Deed
  "ગીરો મુક્તિ મિલ્કત ફેર માલ" = Release of Mortgage & Transfer of Ownership
  "ગીરો મુકેલી મિલકતનું ફેરે માલિકી ફેર ખત" = Release of Mortgage Deed with Re-Transfer of Ownership of Property
  "બાનાખત" = Agreement to Sale (with Possession)
  "બાનાખત કબ્જા વગર" = Agreement to Sale WITHOUT Possession (NOT a Sale Deed)
  "ભેટ ખત" OR "ભૂષણ" = Gift Deed
  "ભાડા પટ્ટો" = Lease Deed
  "ભાગ" OR "વહેંચણી" = Partition Deed
  "સ્થાવર મિલ્કત ખત" = Immovable Property Deed
  "દત્તક" = Adoption Deed
  "ઘોષણા" = Declaration Deed
  "બ્ મૂળ ખત" = Original Document
  "સત્તા ખત" OR "સત્તાનામુ" = Power of Attorney
  "45-એ મુજબનું મુખત્યારનામું" OR "45-A મુજબ મુખ્ત્યારનામું" = Power of Attorney under Section 45-A of the Registration Act
  "ઇચ્છા પત્ર" = Will / Testament
  "ખત" = Deed (generic — read full context to determine type)
  RULE: ALWAYS translate the Gujarati document type to English. NEVER leave it in Gujarati in the report.

  Col 2: Property Description (as per EC)
  Col 3: Executing Party "દસ્તાવેજ કરી આપનાર" (Dastavej Kari Aapnar) = SELLER / MORTGAGOR
         (the person who GIVES / EXECUTES the deed)
  Col 4: Claimant Party "દસ્તાવેજ કરી લેનાર" (Dastavej Kari Lenar) = BUYER / MORTGAGEE / BANK
         (the person who TAKES / RECEIVES the deed)
  Col 5: Date of Registration of the deed
  Col 6 (Second Last): Registration Number / Dastavej Number of the deed
  Col 7 (LAST): NEVER READ — NEVER MENTION ANYWHERE IN REPORT — COMPLETELY IGNORE
  CRITICAL: NEVER swap Col 3 (Aapnar/Seller) and Col 4 (Lenar/Buyer)

STEP 4 — Verify EVERY entry relates to subject property (Unit No. + Block + Floor exact match)
         If any entry is for a DIFFERENT property — SKIP that entry entirely.
STEP 5 — For each mortgage entry: check if Release Deed / Giro Mukeli exists in documents or EC

CRITICAL EC APPLICANT RULE:
The "Applicant" name on E-Application Receipt = person who applied to OBTAIN the EC (empanelled advocate / bank officer).
This person has ZERO relation with the property and ZERO legal interest.
NEVER reproduce EC Applicant name | NEVER mention in any report section | COMPLETELY IGNORE.
Example: "Santosh Tansukh Thakrar" as EC Applicant = empanelled advocate who applied for EC = IGNORE completely.

═══════════════════════════════════════════════════════
REGULATORY APPROVALS — CHECK AND REPORT EACH:
═══════════════════════════════════════════════════════
NA Order | Development Permission | Rajachitthi | Building Permission | Sanctioned Plan | Commencement Certificate | RERA Registration | Fire NOC | Airport Authority NOC | BU Permission / Occupancy Certificate
If not provided = "NOT PROVIDED FOR VERIFICATION."

═══════════════════════════════════════════════════════
PERMANENT RULES — NEVER VIOLATE:
═══════════════════════════════════════════════════════
1. NEVER "and others" / "and co-transferees" / "and another" — EVERY person named individually
2. Applicant = from Draft Sale Deed/Banakhat — Buyer/Second Party section — NEVER from stamp paper
3. Current Owner = from LATEST submitted deed — deed takes priority over EC
4. All 4 boundaries MANDATORY — East | West | North | South
5. Giro Mukeli / Release Deed / Index-II = mortgage DISCHARGED — never report as active
6. Dukan = Shop | Banakhat Kabja Vagar = AoS Without Possession (NEVER call it Sale Deed)
7. LOAN AMOUNT = NEVER mention anywhere
8. EC Applicant = COMPLETELY IGNORE
9. Subject property ONLY — verify Unit+Block+Floor for every EC entry before including`

// ================================================================
// LAYER 2+3 — SONNET — TITLE VERIFICATION + RISK ENGINE
// ================================================================
const LAYER23_BASE = `You are the Title Verification Engine (Layer 2) and Risk & Mortgageability Engine (Layer 3) of a 4-Layer AI Architecture for Banks and NBFCs.

═══════════════════════════════════════════════════════
NON-NEGOTIABLE PRINCIPLES:
═══════════════════════════════════════════════════════
• NEVER assume facts | NEVER create ownership | NEVER infer title without documentary evidence
• NEVER certify title continuity where any link is unsupported
• NEVER suppress adverse findings
• Clearly distinguish: Verified Facts | Missing Information | Legal Issues | Legal Conclusions
• Unavailable info = "NOT PROVIDED FOR VERIFICATION."

═══════════════════════════════════════════════════════
TITLE CERTIFICATION RULE:
═══════════════════════════════════════════════════════
Title certified ONLY when ALL satisfied:
✓ Ownership established from registered document
✓ Title continuity — every transfer has documentary support
✓ Encumbrances verified — all mortgages discharged OR accounted for
✓ Revenue records reconciled with EC and registered documents
✓ Regulatory approvals verified
✓ Mortgageability assessed
Otherwise = "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

═══════════════════════════════════════════════════════
CONFIDENCE LEVELS:
═══════════════════════════════════════════════════════
HIGH = Registered document + government record + EC + revenue records (all 4 support)
MEDIUM = At least two independent records support
LOW = Only one document supports
NO CONFIDENCE = Unsupported — no documentary evidence

═══════════════════════════════════════════════════════
LAYER 3 — RISK SCORING ENGINE:
═══════════════════════════════════════════════════════
Title Break = 100 | Litigation/Court Order = 90 | Existing Active Mortgage = 90 | Government Restriction = 85 | Acquisition Risk = 80 | Missing NA Order = 70 | Builder Title Defect = 70 | EC Mismatch = 60 | Missing Approval = 50 | Mutation Defect = 40 | Clerical Error = 10
Sum all applicable scores → TOTAL RISK SCORE
0-25 = LOW RISK | 26-50 = MODERATE RISK | 51-75 = HIGH RISK | 76+ = UNACCEPTABLE RISK

═══════════════════════════════════════════════════════
MORTGAGEABILITY ENGINE:
═══════════════════════════════════════════════════════
Mortgageable = Clear title, no active encumbrance, approvals verified
Conditionally Mortgageable = Title acceptable subject to specific conditions
Not Mortgageable = Title break, critical defects, undischarged mortgage

SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
LENDING SUITABILITY: Suitable | Conditionally Suitable | Not Suitable
SECURITY COVERAGE: Adequate | Conditional | Inadequate

═══════════════════════════════════════════════════════
EC CRITICAL RULES — SONNET MUST DO THIS ANALYSIS:
═══════════════════════════════════════════════════════
EC APPLICATION DETAILS — Extract from E-Application Receipt:
  (a) EC APPLICATION NUMBER = "e-Application No." / "IGR-NIC(G)..." number on the receipt
  (b) EC APPLICATION DATE = "Date of Print" on E-Application Receipt
  (c) SEARCH PERIOD = "From Date" to "To Date" of "શોધ અગર તપાસણી"

EC ENTRY READING — FOR EVERY SINGLE ENTRY IN EC TABLE:
EC has 7 columns — read each column carefully:
  Col 1 (LEFTMOST): Type of Deed — ALWAYS IN GUJARATI — TRANSLATE TO ENGLISH using this table:
    "માલિકી ફેરખત" OR "માલિકી ફેર ખત" OR "વેચાણ" = Sale Deed / Ownership Transfer
    "ગીરો ખત" OR "ગીરોખત" OR "ગીરો" = Mortgage Deed
    "ગીરો મુક્તિ" OR "ગીરો મુક્તિ પ્ત્ર" = Release of Mortgage Deed
    "ગીરો મુક્તિ મિલ્કત ફેર માલ" = Release of Mortgage & Transfer of Ownership
    "ગીરો મુકેલી મિલકતનું ફેરે માલિકી ફેર ખત" = Release of Mortgage Deed with Re-Transfer of Ownership
    "બાનાખત" = Agreement to Sale (with Possession)
    "બાનાખત કબ્જા વગર" = Agreement to Sale WITHOUT Possession (NOT a Sale Deed)
    "ભેટ ખત" OR "ભૂષણ" = Gift Deed
    "ભાડા પટ્ટો" = Lease Deed
    "ભાગ" OR "વહેંચણી" = Partition Deed
    "સ્થાવર મિલ્કત ખત" = Immovable Property Deed
    "સત્તા ખત" OR "સત્તાનામુ" = Power of Attorney
    "45-એ મુજબનું મુખત્યારનામું" OR "45-A મુજબ" = Power of Attorney under Section 45-A
    "ઇચ્છા પત્ર" = Will / Testament
    "ઘોષણા" = Declaration Deed
    "ખત" = Deed (check context for exact type)
  Col 2: Property Description (as mentioned in EC)
  Col 3: "દસ્તાવેજ કરી આપનાર" (Aapnar) = SELLER / MORTGAGOR — person who GIVES the deed
  Col 4: "દસ્તાવેજ કરી લેનાર" (Lenar) = BUYER / MORTGAGEE / BANK — person who TAKES the deed
  Col 5: Date of Registration of deed
  Col 6 (Second Last): Registration / Dastavej Number
  Col 7 (LAST): COMPLETELY IGNORE — NEVER MENTION IN REPORT

CRITICAL: NEVER swap Col 3 (Aapnar/Seller) and Col 4 (Lenar/Buyer)
EC Applicant = empanelled advocate = COMPLETELY IGNORE — ZERO property interest
"Santosh Tansukh Thakrar" as EC Applicant = empanelled advocate = IGNORE in ALL report sections
EC-confirmed deeds (copy not submitted) = include in chain naturally — NEVER flag as missing

FERFAR: Skip first column. Col1=Entry No+Date+Status | Col2=Nature | Col3=Survey(if relevant) | Col4(Last)=IGNORE

PERMANENT RULES:
1. NEVER "and others" — every person individually — always
2. Giro Mukeli = DISCHARGED — never report as active
3. Banakhat Kabja Vagar = AoS Without Possession — NEVER call Sale Deed
4. Subject property ONLY — verify Unit+Block+Floor match for every EC entry
5. LOAN AMOUNT = NEVER mention`

function getLayer23(caseType: string): string {
  const caseModule: Record<string, string> = {
    builder_purchase: `
═══ CASE: BUILDER PURCHASE ═══
Proposed purchaser buys unit/flat/shop from Builder and seeks bank finance.

---META---
APPLICANT: [Full name/s — from Draft Sale Deed/Banakhat/Allotment — Buyer/Second Party — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership Firm / Private Ltd / Public Ltd / HUF / Trust / Society]
MORTGAGOR: [Same as Applicant — specify if different]
MORTGAGOR_CONSTITUTION: [Individual / Partnership Firm / Private Ltd / Public Ltd / HUF / Trust]
PROPERTY_PARA: [Full paragraph format — "Opinion on title and search in respect of immovable property bearing..."]
PROPERTY_BOUNDARIES: [East: [X] | West: [X] | North: [X] | South: [X]]
CURRENT_OWNER: [Builder/Developer full name/s — from title documents]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Number]
RISK_SCORE: [0-100 — sum of weighted scores]
RISK_CLASS: [LOW RISK / MODERATE RISK / HIGH RISK / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

BUILDER PURCHASE MANDATORY:
1. Draft Sale Deed OR Notarized/Registered Banakhat OR Letter of Allotment = MANDATORY — mention at head of Part IV
2. FERFAR/Mutation for last 20-30 years — chronological (Earlier to Present) — aligned with EC
3. EC for last 13-14 years — ALL entries — chronological — cross-check with FERFAR
4. EC application date + duration of search = MANDATORY in Part VII
5. Builder mutation in 7/12 = required — if absent flag in Part IX
6. Project Finance NOC = mandatory in Part XIV if Builder has project loan
7. Builder NOC for Mortgage = Pre-Disbursement (Part XIV) mandatory
8. NA Order = trace from documents or FERFAR

PART XIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    resale: `
═══ CASE: RESALE ═══
Current owner (not Builder) sells property to proposed purchaser who seeks bank finance.

---META---
APPLICANT: [from Draft Sale Deed/Banakhat — Second Party/Vechan Lenar — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership Firm / Private Ltd / Public Ltd / HUF / Trust / Society]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_CONSTITUTION: [Individual / Partnership Firm / etc.]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search in respect of..."]
PROPERTY_BOUNDARIES: [East: [X] | West: [X] | North: [X] | South: [X]]
CURRENT_OWNER: [First Party/Vechan Aapnar — ALL names individually — from Draft Deed/Banakhat]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Number]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

RESALE MANDATORY:
1. Registered Sale Deed in favour of Current Owner = MANDATORY (trace from docs/EC/FERFAR)
2. Draft Sale Deed OR Notarized/Registered Banakhat between owner and purchaser = MANDATORY
3. FERFAR 20-30 years | EC 13-14 years | EC application date + search period mandatory
4. Boundaries from last Registered Sale Deed unto Current Owner
5. FALSE DECLARATION CHECK: Banakhat says "no loan/Boja/charge" but EC shows mortgage = HIGH SEVERITY

PART XIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    bt: `
═══ CASE: BALANCE TRANSFER ═══
Current owner transfers existing loan from one bank to another. NO property transfer.

---META---
APPLICANT: [Current owner/borrower — full names individually]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership Firm / Private Ltd / Public Ltd / HUF / Trust]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_CONSTITUTION: [Individual / Partnership Firm / etc.]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search in respect of..."]
PROPERTY_BOUNDARIES: [East: [X] | West: [X] | North: [X] | South: [X]]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Number]
EXISTING_BANK: [Name of existing mortgagee bank from EC]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

BALANCE TRANSFER MANDATORY:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. Registered Deed of Mortgage OR List of Documents (LOD) = trace from docs/EC
3. EC will show existing mortgage — identify existing Bank + Deed No. + Date
4. LOD from existing Bank = Pre-Disbursement | No-Due Certificate + Release Deed = Post-Disbursement

PART XIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    seller_bt: `
═══ CASE: SELLER BT ═══
Current owner has existing loan AND sells property to proposed purchaser. TWO simultaneous transactions.

---META---
APPLICANT: [Proposed purchaser — from Draft Deed/Banakhat — Second Party/Buyer]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership Firm / Private Ltd / Public Ltd / HUF / Trust]
MORTGAGOR: [Proposed purchaser — same as applicant]
MORTGAGOR_CONSTITUTION: [Individual / Partnership Firm / etc.]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search in respect of..."]
PROPERTY_BOUNDARIES: [East: [X] | West: [X] | North: [X] | South: [X]]
CURRENT_OWNER: [Seller — First Party in Draft Deed/Banakhat — ALL names individually]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Number]
EXISTING_BANK: [Name of existing mortgagee bank from EC]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

SELLER BT MANDATORY:
1. Registered Sale Deed/Allotment/Share Certificate in favour of Current Owner = MANDATORY
2. Draft Sale Deed/Banakhat between owner and purchaser = MANDATORY
3. Registered Deed of Mortgage OR LOD = trace from docs/EC
4. FALSE DECLARATION: Banakhat says "no loan/charge" but EC shows mortgage = HIGH SEVERITY flag
5. LOD + Foreclosure Letter = Pre-Disbursement | No-Due Certificate + Release Deed = Post-Disbursement

PART XIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    lap: `
═══ CASE: LAP / MORTGAGE ═══
Current owner seeks loan against own property. NO existing loan. NO property transfer.

---META---
APPLICANT: [Current owner/borrower — full names individually]
CO_APPLICANT: [Full names or N/A]
APPLICANT_CONSTITUTION: [Individual / Partnership Firm / Private Ltd / Public Ltd / HUF / Trust]
MORTGAGOR: [Same as Applicant]
MORTGAGOR_CONSTITUTION: [Individual / Partnership Firm / etc.]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search in respect of..."]
PROPERTY_BOUNDARIES: [East: [X] | West: [X] | North: [X] | South: [X]]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Number]
RISK_SCORE: [0-100]
RISK_CLASS: [LOW / MODERATE / HIGH / UNACCEPTABLE RISK]
CONFIDENCE: [HIGH / MEDIUM / LOW / NO CONFIDENCE]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

LAP MANDATORY:
1. Registered Sale Deed/Allotment/Share Certificate in favour of Current Owner = MANDATORY
2. EC shows ANY mortgage/Boja/charge = UNDISCLOSED MORTGAGE = HIGH SEVERITY immediate flag
3. Original Registered Sale Deed unto Current Owner = Pre-Disbursement mandatory
4. CERSAI Search confirming no prior charge = Pre-Disbursement mandatory

PART XIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
  }
  return LAYER23_BASE + (caseModule[caseType] || caseModule['lap'])
}

// ================================================================
// PARSE META
// ================================================================
function parseMeta(text: string) {
  const b = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const g = (k: string) => b.match(new RegExp(`^${k}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'),
    applicantConstitution: g('APPLICANT_CONSTITUTION'),
    mortgagor: g('MORTGAGOR'), mortgagorConstitution: g('MORTGAGOR_CONSTITUTION'),
    propertyPara: g('PROPERTY_PARA'), propertyBoundaries: g('PROPERTY_BOUNDARIES'),
    currentOwner: g('CURRENT_OWNER'),
    ecAppNumber: g('EC_APP_NUMBER'),
    ecDate: g('EC_DATE'), ecSearchPeriod: g('EC_SEARCH_PERIOD'), ecTotalEntries: g('EC_TOTAL_ENTRIES'),
    existingBank: g('EXISTING_BANK'),
    riskScore: g('RISK_SCORE'), riskClass: g('RISK_CLASS'),
    confidence: g('CONFIDENCE'), mortgageability: g('MORTGAGEABILITY'),
    sarfaesi: g('SARFAESI'), lendingSuitability: g('LENDING_SUITABILITY'),
  }
}

// ================================================================
// LAYER 4 — REPORT GENERATOR — 4 PARALLEL CALLS (Pure HTML)
// ================================================================

// ── 3A: PART I + II + III ──────────────────────────────────────
const L4A = `You are the Legal Report Generator — Layer 4. Generate HTML for PART I, PART II, PART III.
⚠️ OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---. NO pipes.

═══════════════════════════════════════════════════════
PART I — BORROWER / MORTGAGOR DETAILS
═══════════════════════════════════════════════════════
<hr><div class="ph">PART I — BORROWER / MORTGAGOR DETAILS</div>

<div class="sph">A. Name and Address of Borrower/s</div>
<table class="mt">
  <tr><td>Name of Borrower/s</td><td>:</td><td>[Full name/s — every person individually — NEVER "and others"]</td></tr>
  <tr><td>Address of Borrower/s</td><td>:</td><td>[Address as per documents]</td></tr>
</table>

<div class="sph">B. Constitution of Borrower/s</div>
<table class="mt">
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm / Private Limited Company / Public Limited Company / HUF / Trust / Society / Co-operative Housing Society]</td></tr>
</table>

<div class="sph">C. Name and Address of Mortgagor/s</div>
<table class="mt">
  <tr><td>Name of Mortgagor/s</td><td>:</td><td>[Full names — if same as borrower write "Same as Borrower/s above"]</td></tr>
  <tr><td>Address of Mortgagor/s</td><td>:</td><td>[Address — if same write "Same as above"]</td></tr>
</table>

<div class="sph">D. Constitution of Mortgagor/s</div>
<table class="mt">
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm / Private Ltd / etc.]</td></tr>
</table>

<div class="sph">E. Current Owner/s of the Property</div>
<table class="mt">
  <tr><td>Current Owner/s</td><td>:</td><td>[Full name/s individually — from latest deed — NEVER "and others"]</td></tr>
</table>

═══════════════════════════════════════════════════════
PART II — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES
═══════════════════════════════════════════════════════
<hr><div class="ph">PART II — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES</div>

PROPERTY DESCRIPTION MUST BE IN PARAGRAPH FORMAT:
<div class="prop-para">Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor Number] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as "[Scheme Name]" constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village Name], Taluka: [Taluka Name], District [District Name].</div>

<table class="mt">
  <tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
  <tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
  <tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
  <tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

═══════════════════════════════════════════════════════
PART III — LIST OF SCRUTINISED DOCUMENTS
═══════════════════════════════════════════════════════
CRITICAL RULE FOR PART III:
Include ALL submitted/uploaded documents — even those that are illegible, blank, or incomplete.
But DO NOT write remarks like "ILLEGIBLE", "BLANK", "NOT PROVIDED FOR VERIFICATION" in Part III.
Simply list the document with its basic details. Remarks about illegibility go ONLY in Part VIII.

Latest document FIRST. Oldest LAST. Never include Mutation Entries. Never mention Stamp Paper No. / Stamp Duty / Registration Fees.

FORMAT FOR EACH DOCUMENT:
<div class="di">
  <p><span class="dn">N. [Document Type/Name] — Reg. No. / Sr. No. [X] | Dated: [DD-MM-YYYY]</span><br>
  [Executant/Aapnar name/s individually] unto and in favour of [Claimant/Lenar name/s individually]. [SRO name if registration document.] [2-3 sentences of key observation — no illegibility remarks.]</p>
</div>

EC FORMAT IN PART III (include always):
<div class="di">
  <p><span class="dn">N. Encumbrance Certificate (EC) — Application Date: [DD-MM-YYYY] | Search Period: [From DD/MM/YYYY to DD/MM/YYYY]</span><br>
  EC obtained by Advocate [Name/Not stated] for search period from [From Date] to [To Date] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. The EC discloses [COUNT] registered transaction/s for the subject property as under:<br>
  Entry 1: [Type of deed] — Deed No. [X] dated [DD/MM/YYYY] — Executing Party (Aapnar): [Full name/s] — Claimant Party (Lenar): [Full name/s or Bank name] — Status: [Active / Discharged vide Release Deed No. X dated DD/MM/YYYY].<br>
  [Repeat for each entry — every entry individually listed]</p>
</div>

RULES: NEVER "and others". EC Applicant = IGNORE. "Banakhat Kabja Vagar" = Agreement to Sale Without Possession.
START: <hr><div class="ph">PART I — BORROWER / MORTGAGOR DETAILS</div>
END after Part III last document entry.`

// ── 3B: PART IV + V + VI + VII ────────────────────────────────
const L4B = `You are the Legal Report Generator — Layer 4. Generate HTML for PART IV, PART V, PART VI, PART VII.
⚠️ OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---.

═══ PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY ═══
<hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>

CRITICAL RULE — TRACE FROM THE VERY BEGINNING:
Start from the EARLIEST available record in ALL submitted documents + FERFAR + EC.
This means going back to:
- The original agricultural landowner/s (from 7/12 and FERFAR oldest entries)
- OR the original government allotment/scheme creation
- OR the original revenue survey owner/s
- Whichever is the EARLIEST traceable event
DO NOT start from the builder or the recent sale deed. Go to the ORIGIN of the title.

COMPLETE CHRONOLOGICAL SEQUENCE — MUST COVER ALL:
1. ORIGINAL AGRICULTURAL / SURVEY LAND OWNERSHIP (from earliest FERFAR entry or 7/12)
2. NON-AGRICULTURAL CONVERSION (NA Order — if available from FERFAR/documents)
3. DEVELOPMENT AGREEMENT / TP SCHEME / GOVERNMENT ACQUISITION (if applicable)
4. BUILDER / DEVELOPER ACQUISITION of the land/scheme
5. CONSTRUCTION / SCHEME DEVELOPMENT
6. INDIVIDUAL UNIT CREATION and allotment to current/earlier owners
7. ALL SUBSEQUENT TRANSFERS (Sale Deeds, Gift Deeds, etc.) in chronological order
8. ALL MORTGAGE CREATIONS and RELEASES in chronological order
9. CURRENT STATUS as confirmed by EC

RULES:
1. OLDEST event FIRST — NEWEST LAST — always strictly chronological
2. FIRST paragraph: NO "Thereafter" — begin with the absolute earliest traceable event
3. EVERY subsequent paragraph: MUST start with "Thereafter,"
4. NEVER "and others" — every person individually — always
5. EC-confirmed deeds (copy not submitted): include naturally — no remark, no flag
6. End each transfer paragraph: mention Mutation Entry No. + date if available
7. For Builder Purchase: last paragraph = Draft Sale Deed/Banakhat/Allotment between Builder and purchaser
8. Mortgage entries: separate paragraph with discharge status
9. Translate ALL Gujarati terms to English
10. If earliest record not traceable: state "The history of the subject land prior to [earliest available date] could not be traced from the documents produced. The earliest available record is as under:"

FIRST PARAGRAPH — EARLIEST ORIGIN:
<p>As per the revenue records produced, the subject land bearing [Survey/Block No.], Village [Name], Taluka [Name], District [Name] was originally held by [Original Landowner full name/s] as [tenure type — e.g. agricultural/occupancy holder] as evidenced by [Village Form 7/12 / earliest Ferfar entry / earliest available record]. [Any relevant details about original holding.] Entry to that effect was recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY] [— OR — as per the earliest available revenue record].</p>

NA CONVERSION PARAGRAPH (if applicable):
<p>Thereafter, the aforesaid land was converted from agricultural to non-agricultural use vide [NA Order No., if available] dated [Date] issued by [Authority]. Entry to that effect was recorded vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

BUILDER/DEVELOPER ACQUISITION PARAGRAPH:
<p>Thereafter, [Builder/Developer full name] acquired the subject land / scheme through [Development Agreement / Purchase / Government Allotment] vide [Deed Type] No. [X] dated [DD/MM/YYYY]. [Brief details.] Entry recorded vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

INDIVIDUAL UNIT TRANSFER PARAGRAPH:
<p>Thereafter, [Seller full name/s] transferred the subject property being [Unit/Flat/Shop No.] to [Buyer full name/s] vide Registered [Deed Type] bearing Registration No. [X] dated [DD/MM/YYYY] registered at Sub-Registrar Office, [SRO Name] for a consideration of Rs. [Amount]. Entry to that effect was recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

MORTGAGE PARAGRAPH:
<p>Thereafter, [Mortgagor full name/s] created a mortgage over the subject property in favour of [Bank/Mortgagee full name] vide Registered Mortgage Deed bearing Registration No. [X] dated [DD/MM/YYYY] registered at SRO [Name]. [The said mortgage stands discharged vide Registered Release Deed No. [X] dated [DD/MM/YYYY] / The said mortgage is subsisting and active as on the date of this report — no Release Deed produced.]</p>

FINAL CURRENT STATUS PARAGRAPH:
<p>Thereafter, [Current Owner full name/s] holds the right, title and interest in the subject property as the present registered owner/s as confirmed by the Encumbrance Certificate bearing E-Application No. [EC App Number] dated [EC Date] covering search period from [From] to [To] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [Encumbrance status — no subsisting charge / subject to existing charge of {Bank}.]</p>

═══ PART V — REVENUE RECORD ANALYSIS ═══
<hr><div class="ph">PART V — REVENUE RECORD ANALYSIS</div>

For each 7/12 / Village Form / Property Card submitted:
<div class="sph">Village Form No. 7/12 — Survey / Block No. [X]</div>
<table class="mt">
  <tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
  <tr><td>District</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
  <tr><td>Total Area (H.Are.SqMt.)</td><td>:</td><td>[Area in Hectares / Are / Sq.Mtrs.]</td></tr>
  <tr><td>Land Use (Jaminno Upyog)</td><td>:</td><td>[Bin Kheti (Non-Agricultural) / Kheti (Agricultural) — flag if Agricultural]</td></tr>
  <tr><td>Ownership Column (Kashedari)</td><td>:</td><td>[Names as recorded in 7/12]</td></tr>
  <tr><td>Boja / Encumbrance (in 7/12)</td><td>:</td><td>[NIL / Details of Boja if any]</td></tr>
  <tr><td>Ganot / Tenant (Khaate)</td><td>:</td><td>[NIL / Name — flag if any tenant recorded]</td></tr>
  <tr><td>Remarks</td><td>:</td><td>[Any special observation]</td></tr>
</table>
[Repeat for each 7/12 submitted]
[If no revenue record submitted: <p>No revenue records (Village Form 7/12, AnyRoR, Property Card, Satbara Utara) have been submitted for verification. Verification of land use classification, ownership recording, and absence of tenancy rights could not be completed from the copies produced. NOT PROVIDED FOR VERIFICATION.</p>]

═══ PART VI — MUTATION ENTRY ANALYSIS ═══
<hr><div class="ph">PART VI — MUTATION ENTRY ANALYSIS</div>

<p>Mutation / Ferfar entries recorded in revenue records for the subject survey/block number for the last [X] years are as under (chronological — Earlier to Present):</p>

<table class="mut-tbl">
  <tr>
    <th>Sr.</th><th>Entry No.</th><th>Entry Date</th><th>Status</th><th>Nature of Entry</th><th>Details</th><th>Survey/Block No.</th>
  </tr>
  [One row per mutation entry]
  <tr><td>[N]</td><td>[Entry No.]</td><td>[DD/MM/YYYY]</td><td>[Certified/Rejected]</td><td>[NA / Death / Transfer / Partition / Court Order / etc.]</td><td>[Brief details from Col 2]</td><td>[Survey No. if relevant to subject property — blank if not relevant]</td></tr>
</table>

<p>[Cross-check observation: Are all EC entries reflected in mutation entries? Are all mutation entries consistent with registered documents? Any discrepancy?]</p>
[If no mutation entries: <p>Ferfar / Mutation entries for the subject survey/block number have not been submitted for verification. NOT PROVIDED FOR VERIFICATION.</p>]

═══ PART VII — ENCUMBRANCE ANALYSIS ═══
<hr><div class="ph">PART VII — ENCUMBRANCE ANALYSIS</div>

<p>Encumbrance Certificate (EC) obtained bearing E-Application No. [EC Application Number] dated [EC Date] for search period from [From Date] to [To Date] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. The EC discloses [TOTAL COUNT] registered transaction/s for the subject property as under:</p>

<table class="ec-tbl">
  <tr>
    <th>Sr.</th><th>Type of Deed</th><th>Deed No.</th><th>Date</th><th>Executing Party (Aapnar)</th><th>Claimant Party (Lenar)</th><th>Status</th>
  </tr>
  [One row per EC entry]
  <tr><td>[N]</td><td>[Sale/Mortgage/Release/AoS]</td><td>[Reg. No.]</td><td>[DD/MM/YYYY]</td><td>[Full name/s individually]</td><td>[Full name/s or Bank]</td><td>[Active / Discharged vide No. X dated DD/MM/YYYY]</td></tr>
</table>

<p>[EC cross-check observation: Total entries found. Cross-check with registered documents and mutation entries. Any discrepancy between EC and FERFAR? Any entry within last 60 days? Any active undischarged mortgage?]</p>
[If no EC: <p>Encumbrance Certificate has not been submitted for verification. Verification of encumbrances and registered transactions for the subject property could not be completed. NOT PROVIDED FOR VERIFICATION.</p>]

START: <hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END after Part VII.`

// ── 3C: PART VIII + IX + X + XI + XII ────────────────────────
const L4C = `You are the Legal Report Generator — Layer 4. Generate HTML for PART VIII, PART IX, PART X, PART XI, PART XII.
⚠️ OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---.

═══ PART VIII — APPROVALS AND REGULATORY COMPLIANCE ═══
<hr><div class="ph">PART VIII — APPROVALS AND REGULATORY COMPLIANCE</div>

CRITICAL RULE: Documents that are illegible, blank, or incomplete should be mentioned here WITH remarks.
State each approval individually — "Provided and verified" OR "NOT PROVIDED FOR VERIFICATION."

<table class="mt">
  <tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Order No., date, authority — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Commencement Certificate / Bandhakam Parvangi</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>RERA Registration</td><td>:</td><td>[RERA No., developer, date — OR "NOT PROVIDED FOR VERIFICATION." — Post May 2017 projects: MANDATORY]</td></tr>
  <tr><td>Fire NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Airport Authority of India NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION." — flag if North boundary shows Airport]</td></tr>
  <tr><td>BU Permission / Occupancy Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Environmental Clearance</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
</table>

[If any submitted document is illegible/blank — mention it here:
<p>The following submitted document/s could not be read/verified: [Document name/s] — certain portions / entire document is illegible / blank. Independent verification of the contents of these documents has not been possible from the copies produced. Legible certified copies are required.</p>]

═══ PART IX — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS ═══
<hr><div class="ph">PART IX — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS</div>
<p>The following issues have been identified during 15-stage title verification using 4-Layer AI Engine. HIGH SEVERITY issues are conditions precedent to sanction or disbursement. Bank shall not proceed where CRITICAL / HIGH SEVERITY issues remain unresolved.</p>

HIGH SEVERITY FORMAT:
<div class="ib">
  <div><span class="sh">HIGH SEVERITY</span></div>
  <div class="it">N. [Specific Issue Title — max 10 words]</div>
  <p>[Finding — exact reg nos, dates, party names — 3-4 sentences. Why legally material. What specific bank risk.]</p>
  <p><span class="sg">Direction:</span> [Specific document required — exact name — from whom — by when — what action.]</p>
</div>

MEDIUM SEVERITY:
<div class="ib">
  <div><span class="sm">MEDIUM SEVERITY</span></div>
  <div class="it">N. [Issue Title]</div>
  <p>[Finding — 2-3 sentences.]</p>
  <p><span class="sg">Direction:</span> [Specific steps.]</p>
</div>

LOW SEVERITY:
<div class="ib">
  <div><span class="sl">LOW SEVERITY</span></div>
  <div class="it">N. [Issue Title]</div>
  <p>[Finding — 1-2 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

NEVER FLAG:
- EC-confirmed deeds where deed copy not submitted (include naturally in chain — not an issue)
- EC Applicant name (zero property interest — not an issue)
- Stamp Paper numbers or stamp duty amounts

═══ PART X — DOCUMENT DEFICIENCY REPORT ═══
<hr><div class="ph">PART X — DOCUMENT DEFICIENCY REPORT</div>

<div class="sph">A. Documents Submitted and Available for Verification</div>
<ol>[List all submitted documents that are readable and verifiable]</ol>

<div class="sph">B. Documents Not Submitted (Expected but Absent)</div>
<ol>[List each mandatory missing document — OR "NIL — All expected documents have been produced."]</ol>

<div class="sph">C. Submitted Documents That Are Illegible / Incomplete / Blank</div>
<ol>[List documents that were submitted but cannot be read — OR "NIL."]</ol>

═══ PART XI — MORTGAGEABILITY ASSESSMENT ═══
<hr><div class="ph">PART XI — MORTGAGEABILITY ASSESSMENT</div>

<div class="morta-box">
  <p><strong>Mortgageability:</strong> [Mortgageable / Conditionally Mortgageable / Not Mortgageable]</p>
  <p><strong>SARFAESI Enforceability:</strong> [Enforceable / Conditionally Enforceable / Not Enforceable]</p>
  <p><strong>Lending Suitability:</strong> [Suitable / Conditionally Suitable / Not Suitable]</p>
  <p><strong>Security Coverage Adequacy:</strong> [Adequate / Conditional / Inadequate]</p>
  <p><strong>Reasoning:</strong> [Brief but specific explanation — why mortgageable or conditions or why not — 3-4 sentences]</p>
</div>

═══ PART XII — RISK RATING ═══
<hr><div class="ph">PART XII — RISK RATING</div>

<div class="risk-box">
  <div class="risk-title">4-Layer AI Risk Assessment Engine</div>
  <p><strong>Total Risk Score:</strong> <span class="risk-score risk-[low/mod/high]">[SCORE]/100</span></p>
  <p><strong>Risk Classification:</strong> [LOW RISK (0-25) / MODERATE RISK (26-50) / HIGH RISK (51-75) / UNACCEPTABLE RISK (76+)]</p>
  <p><strong>Confidence Level:</strong> [HIGH / MEDIUM / LOW / NO CONFIDENCE]</p>
  <p><strong>Primary Risk Factors Contributing to Score:</strong></p>
  <ol>
    <li>[Risk factor 1 — issue name and score e.g. "Missing Title Deed = 100"]</li>
    <li>[Risk factor 2 — if any]</li>
    <li>[Risk factor 3 — if any]</li>
  </ol>
</div>

START: <hr><div class="ph">PART VIII — APPROVALS AND REGULATORY COMPLIANCE</div>
END after Part XII risk-box closing div.`

// ── 3D: PART XIII + XIV + XV + XVI ────────────────────────────
const L4D = `You are the Legal Report Generator — Layer 4. Generate HTML for PART XIII, PART XIV, PART XV, PART XVI.
⚠️ OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---.

═══ PART XIII — LEGAL OPINION AND FINAL RECOMMENDATION ═══
<hr><div class="ph">PART XIII — LEGAL OPINION AND FINAL RECOMMENDATION</div>

DO NOT include paragraph starting "This opinion pertains to..." — NOT REQUIRED.
Use EXACT case-specific wording provided in Layer 2+3 analysis. Fill actual names.

<p>[Exact legal opinion paragraph with actual names of current owner/builder and proposed purchaser/mortgagor filled in]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank[subject to charge of {existing bank} if applicable].</p>

VERDICT BOX (choose one based on issues found):
NOT CLEAR:
<div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[Number] HIGH SEVERITY issue/s identified. Primary concerns: [list top 3 issues briefly]. Bank must not proceed until ALL HIGH SEVERITY issues are fully resolved.</p></div>

CLEAR SUBJECT TO CONDITIONS:
<div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is marketable and mortgageable subject to: [list specific conditions — each condition one line].</p></div>

CLEAR AND MARKETABLE:
<div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. [Brief reason why clear — 1-2 sentences.]</p></div>

═══ PART XIV — PRE-DISBURSEMENT CONDITIONS ═══
<hr><div class="ph">PART XIV — DOCUMENTS REQUIRED — PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be obtained / taken into Bank custody / verified before disbursement of the loan:</p>
<ol>
  <li>[Specific document — exact name — from whom to be obtained — purpose/remark]</li>
  [Add all case-specific mandatory pre-disbursement documents]
</ol>

═══ PART XV — POST-DISBURSEMENT CONDITIONS ═══
<hr><div class="ph">PART XV — DOCUMENTS REQUIRED — POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be obtained / taken into Bank custody within the stipulated timeframe after disbursement:</p>
<ol>
  <li>[Specific document — exact name — from whom — within what timeframe]</li>
  [Add all case-specific mandatory post-disbursement documents]
</ol>

═══ PART XVI — FINAL RECOMMENDATION ═══
<hr><div class="ph">PART XVI — FINAL RECOMMENDATION</div>

<div class="title-status">
  <div class="ts-title">Final Title Status — Select One:</div>
  <div class="ts-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE REQUIRES RECTIFICATION / TITLE NOT RECOMMENDED / INSUFFICIENT DOCUMENTATION FOR TITLE CERTIFICATION]</div>
</div>

START: <hr><div class="ph">PART XIII — LEGAL OPINION AND FINAL RECOMMENDATION</div>
END after Part XVI title-status closing div.`

// ================================================================
// HTML WRAPPER
// ================================================================
function buildReport(p: {
  refNo: string; appId: string; today: string; bankName: string; loanType: string
  p123: string; p4567: string; p891012: string; p13456: string
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
${p.p123}
${p.p4567}
${p.p891012}
${p.p13456}
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
  <div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ${p.bankName} in connection with Application ID ${p.appId}. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title or a legal warranty. This report is confidential and may not be reproduced, disclosed or relied upon by any party other than the addressee bank without the express written consent of TITLEMATRIXAI. The findings herein reflect the state of title as evidenced by the documents produced and do not account for any undisclosed encumbrances, adverse possessory claims, or defects not apparent from the documents examined.</div>
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
      docText += `\n\n=== PROPERTY BOUNDARIES FROM DETAILS SHEET (PRE-VERIFIED — USE EXACTLY AS IS) ===\nEast (Purva): ${boundaryEast || 'As per documents'}\nWest (Pashchim): ${boundaryWest || 'As per documents'}\nNorth (Uttar): ${boundaryNorth || 'As per documents'}\nSouth (Dakshin): ${boundarySouth || 'As per documents'}\n=== END OF BOUNDARIES ===\n`
    }

    l1Content.push({
      type: 'text',
      text: `LAYER 1 — DOCUMENT EXTRACTION ENGINE
Extract ALL facts. Do NOT generate legal opinion.

CASE DETAILS SHEET (PRE-VERIFIED ANCHORS — USE AS REFERENCE):
Applicant: ${applicantName || 'As per documents'}
Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'}
Case Type: ${caseType} | Loan Type: ${loanType || 'LAP'} | Bank: ${bankName} | APP ID: ${appId}
Property: ${propertyAddress || 'As per documents'}
Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

CRITICAL NOTE — EC APPLICANT IN THIS CASE:
"Santosh Tansukh Thakrar" is an empanelled advocate who has applied for EC in respect of the subject property only. He has no relation or concern with the subject property whatsoever. COMPLETELY IGNORE his name in ALL sections of the report.

SUBMITTED DOCUMENTS TEXT:
${docText}

EXTRACTION PRIORITIES:
1. NEVER "and others" — ALL names individually
2. EC APPLICATION DATE + SEARCH PERIOD = MANDATORY — extract from E-Application Receipt
3. EC Col 7 = IGNORE | EC Applicant name = IGNORE | Stamp Paper details = IGNORE
4. ALL EC entries — count and list each one individually
5. FERFAR: Skip Col1 (Entry Details). Col1after=Entry No+Date+Status | Col2after=Nature | Col3after=Survey(if relevant) | Col4after(Last)=IGNORE
6. Property description in PARAGRAPH FORMAT
7. Assign CONFIDENCE level to ownership facts
8. Giro Mukeli = DISCHARGED | Subject property ONLY — Unit+Block+Floor match for EC entries`
    })

    const l1Msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: LAYER1_SYSTEM,
      messages: [{ role: 'user', content: l1Content }]
    })
    const extractedFacts = l1Msg.content[0].type === 'text' ? l1Msg.content[0].text : ''

    // ── LAYER 2+3: SONNET — TITLE + RISK ANALYSIS ─────────────
    const l23Msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: getLayer23(caseType),
      messages: [{
        role: 'user',
        content: `LAYER 2+3 — TITLE VERIFICATION + RISK ENGINE

CASE DETAILS (PRE-VERIFIED):
Applicant: ${applicantName} | Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'} | Property: ${propertyAddress}
Bank: ${bankName} | APP ID: ${appId}
Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

EC APPLICANT NOTE: Santosh Tansukh Thakrar = empanelled advocate = applied for EC only = ZERO property nexus = COMPLETELY IGNORE in ALL sections.

LAYER 1 EXTRACTED FACTS:
${extractedFacts}

FILL META BLOCK COMPLETELY:
1. PROPERTY_PARA = exact paragraph format ("Opinion on title and search in respect of immovable property bearing...")
2. EC_APP_NUMBER = exact E-Application Number from EC receipt
3. EC_DATE = exact EC application/print date
4. EC_SEARCH_PERIOD = exact from-to search period
5. EC_TOTAL_ENTRIES = total count of entries in EC for subject property
6. RISK_SCORE = sum of all applicable weighted scores (be precise, not generic)
7. CONFIDENCE = based on how many independent records support ownership claim
8. All names individually — NEVER "and others"

EC EXTRACTION — MANDATORY — DO THIS NOW:
Read the EC from the extracted facts. For EVERY entry in the EC table:
- Translate the Gujarati document type to English using the translation table in your system prompt
- Extract: Entry No. | Type (English) | Deed Registration No. | Date | Aapnar (Col 3 = Seller/Mortgagor) | Lenar (Col 4 = Buyer/Bank) | Active or Discharged
List ALL entries clearly — do not miss any entry.
Col 7 of EC = IGNORE | EC Applicant name = IGNORE`
      }]
    })
    const analysis = l23Msg.content[0].type === 'text' ? l23Msg.content[0].text : ''
    const meta = parseMeta(analysis)

    // ── LAYER 4: 4 PARALLEL REPORT GENERATION ─────────────────
    const [r3a, r3b, r3c, r3d] = await Promise.all([

      // Part I + II + III
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4A,
        messages: [{
          role: 'user',
          content: `Generate Part I (Borrower/Mortgagor) + Part II (Property Description) + Part III (Documents List).

APPLICANT: ${meta.applicant || applicantName}
CO-APPLICANT: ${meta.coApplicant || coApplicant || 'Not Applicable'}
APPLICANT CONSTITUTION: ${meta.applicantConstitution || 'Individual'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
MORTGAGOR CONSTITUTION: ${meta.mortgagorConstitution || 'Individual'}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY PARA: ${meta.propertyPara || propertyAddress}
BOUNDARIES: East: ${boundaryEast || '?'} | West: ${boundaryWest || '?'} | North: ${boundaryNorth || '?'} | South: ${boundarySouth || '?'}
EC DATE: ${meta.ecDate || 'As per documents'}
EC SEARCH PERIOD: ${meta.ecSearchPeriod || 'As per documents'}
EC TOTAL ENTRIES: ${meta.ecTotalEntries || 'As per documents'}
BANK: ${bankName}

ANALYSIS FROM LAYERS 1-3:
${analysis}

CRITICAL PART III RULE: List ALL submitted documents (even illegible/blank ones) WITHOUT any illegibility remarks. Include description of every document. Illegibility remarks go ONLY in Part VIII.`
        }]
      }),

      // Part IV + V + VI + VII
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 5000, system: L4B,
        messages: [{
          role: 'user',
          content: `Generate Part IV (Title Chain) + Part V (Revenue Records) + Part VI (Mutation Entries) + Part VII (EC Analysis).

CASE TYPE: ${caseType}
SUBJECT PROPERTY: ${meta.propertyPara || meta.propertyPara || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
APPLICANT: ${meta.applicant || applicantName}
EC APPLICATION NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC DATE: ${meta.ecDate || 'As per documents'}
EC SEARCH PERIOD: ${meta.ecSearchPeriod || 'As per documents'}
EC TOTAL ENTRIES: ${meta.ecTotalEntries || 'As per documents'}

ANALYSIS FROM LAYERS 1-3:
${analysis}

CRITICAL RULES:
- Part IV: Start from EARLIEST available record. First para NO "Thereafter". Every subsequent MUST start "Thereafter,". EC-confirmed deeds naturally in chain. Final para must include EC Application No. + date + search period.
- Part VI: Use table format for mutation entries. Col4(Last) of FERFAR = IGNORE.
- Part VII: Use table format for ALL EC entries. Show E-Application No. + date + search period at top. For each entry: translate Gujarati deed type to English. Col 7 = NEVER mention. EC Applicant = IGNORE.
- Santosh Tansukh Thakrar = EC Applicant = COMPLETELY IGNORE.`
        }]
      }),

      // Part VIII + IX + X + XI + XII
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 5000, system: L4C,
        messages: [{
          role: 'user',
          content: `Generate Part VIII (Approvals) + Part IX (Issues) + Part X (Deficiency) + Part XI (Mortgageability) + Part XII (Risk).

BANK: ${bankName} | PROPERTY: ${meta.propertyPara || propertyAddress}
RISK_SCORE: ${meta.riskScore} | RISK_CLASS: ${meta.riskClass}
CONFIDENCE: ${meta.confidence} | MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi} | LENDING_SUITABILITY: ${meta.lendingSuitability}

ANALYSIS FROM LAYERS 1-3:
${analysis}

CRITICAL RULES:
- Part VIII: Mention illegible/blank submitted documents HERE with remarks (not in Part III).
- Part IX: NEVER flag EC-confirmed deeds. NEVER flag EC Applicant (Santosh Tansukh Thakrar = zero property interest).
- Part XII: Show individual risk factors and their weighted scores contributing to total.`
        }]
      }),

      // Part XIII + XIV + XV + XVI
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, system: L4D,
        messages: [{
          role: 'user',
          content: `Generate Part XIII (Legal Opinion) + Part XIV (Pre-Disbursement) + Part XV (Post-Disbursement) + Part XVI (Final Recommendation).

CASE TYPE: ${caseType}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPOSED PURCHASER / MORTGAGOR: ${meta.applicant || applicantName}
BANK: ${bankName}
EXISTING BANK (for BT / Seller BT): ${meta.existingBank || 'extract from EC analysis'}
MORTGAGEABILITY: ${meta.mortgageability} | RISK: ${meta.riskScore}

ANALYSIS FROM LAYERS 1-3:
${analysis}

RULES: Use EXACT wording from Part XIII as provided in Layer 2+3 analysis — fill actual names. Pre-Disbursement and Post-Disbursement must be case-specific and comprehensive. Final Recommendation must match verdict.`
        }]
      })
    ])

    const p123 = r3a.content[0].type === 'text' ? r3a.content[0].text : '<p>Error generating Part I-III</p>'
    const p4567 = r3b.content[0].type === 'text' ? r3b.content[0].text : '<p>Error generating Part IV-VII</p>'
    const p891012 = r3c.content[0].type === 'text' ? r3c.content[0].text : '<p>Error generating Part VIII-XII</p>'
    const p13456 = r3d.content[0].type === 'text' ? r3d.content[0].text : '<p>Error generating Part XIII-XVI</p>'

    const reportHtml = buildReport({
      refNo, appId: appId || 'AUTO-000000', today,
      bankName: bankName || 'Bank',
      loanType: loanType || 'Loan Against Property',
      p123, p4567, p891012, p13456,
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
    console.error('TITLEMATRIXAI v9.0 error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Pipeline failed' },
      { status: 500 }
    )
  }
}