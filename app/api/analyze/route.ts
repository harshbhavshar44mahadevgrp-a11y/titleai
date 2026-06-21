// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts
// MANUAL-COMPLIANT VERSION — 11-PART REPORT
// Based on: Master System Prompt Manual (1__Manual.docx)
// 4-Layer Architecture: L1=Extraction L2=Title L3=Risk L4=Report
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
  if (u.includes('NOT CLEAR') || u.includes('TITLE BREAK') || u.includes('TITLE NOT RECOMMENDED')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO') || u.includes('CONDITIONALLY MORTGAGEABLE')) return 'CLEAR SUBJECT TO'
  if (u.includes('CLEAR AND MARKETABLE') || u.includes('MORTGAGEABLE')) return 'CLEAR'
  return 'PENDING'
}

// ================================================================
// REPORT CSS
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
table.ec-tbl { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; }
table.ec-tbl th { background:#1B3A6B; color:#fff; padding:6px 8px; text-align:left; font-size:11px; }
table.ec-tbl td { border:1px solid #ddd; padding:6px 8px; vertical-align:top; }
table.ec-tbl tr:nth-child(even) { background:#f7f9fc; }
table.mut-tbl { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; }
table.mut-tbl th { background:#374151; color:#fff; padding:5px 8px; text-align:left; font-size:11px; }
table.mut-tbl td { border:1px solid #e5e7eb; padding:5px 8px; vertical-align:top; }
table.mut-tbl tr:nth-child(even) { background:#f9fafb; }
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
// LAYER 1 — HAIKU — DOCUMENT EXTRACTION ENGINE (Prompt 2 from Manual)
// ================================================================
const LAYER1_SYSTEM = `You are the Document Extraction Engine — Layer 1.
Your task per the Master System Prompt Manual: Extract ALL facts from submitted documents. Do NOT generate legal opinion.

NON-NEGOTIABLE (from Manual):
• Never assume facts | Never create facts | Never infer ownership without documents
• Never suppress adverse findings
• Unavailable info = "NOT PROVIDED FOR VERIFICATION."

CONFIDENCE LEVELS:
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
Classify each as: Available | Missing

PROPERTY DESCRIPTION — MANDATORY PARAGRAPH FORMAT (Exact format from Manual):
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."
If any field unavailable write "NOT PROVIDED FOR VERIFICATION" for that field only.

═══════════════════════════════════════════════════════
MUTATION ENTRIES — COLUMN RULES (Prompt 4 from Manual):
═══════════════════════════════════════════════════════
Extract for each Mutation Entry:
• Entry Number | Entry Date | Nature of Entry | Certified Status | Relevant Survey Number | Remarks
Ignore irrelevant columns.
Skip first column "Entry Details" — DO NOT READ.
Col 1 (after skip): Entry No + Date + Certified/Rejected
Col 2 (after skip): Nature — NA / Death / Transfer / Partition / Court order
Col 3 (after skip): Relevant Survey/Block No — SKIP if not subject property
Col 4 (after skip / LAST): DO NOT CONSIDER — NEVER MENTION IN REPORT

═══════════════════════════════════════════════════════
ENCUMBRANCE CERTIFICATE — MANUAL-SPECIFIED EXTRACTION (Prompt 4):
═══════════════════════════════════════════════════════
STEP 1 — From E-Application Receipt extract:
  (a) EC APPLICATION NUMBER = "e-Application No." — the unique EC reference number
  (b) EC APPLICATION DATE = "Date of Print" on E-Application Receipt
  (c) SEARCH PERIOD = "From Date" to "To Date" of search — MANDATORY in report

STEP 2 — Count ALL actual rows in EC table for subject property.
⚠️ NEVER TRUST EC HEADER COUNT ("X registered transactions") — COUNT ACTUAL TABLE ROWS YOURSELF.

STEP 3 — EC COLUMN MAPPING (from Manual — exact specification):
  Col 1 (First from Left): Type of Deed/Document — TRANSLATE TO ENGLISH (see table below)
  Col 2 (Second from Left): Property Description
  Col 3 (Third from Left): Executing Party / Dastavej Kari Aapnar = SELLER / MORTGAGOR
  Col 4 (Fourth from Left): Claimant Party / Dastavej Kari Lenar = BUYER / MORTGAGEE / BANK
  Col 5 (Fifth from Left): Date of Registration of Deed/Document
  Col 6 (Sixth / Second Last): Registration / Dastavej Number of Deed/Document
  Col 7 (Seventh / LAST): NOT REQUIRED — NEVER MENTION IN LEGAL SCRUTINY REPORT ← STRICT RULE FROM MANUAL
  NEVER REPRODUCE EC LAST COLUMN OR NAME OF APPLICANT ← STRICT RULE FROM MANUAL

STEP 4 — EC DOCUMENT TYPE INTELLIGENCE ENGINE (Col 1 Translation):
  ═══ FULL GUJARATI ↔ ENGLISH TABLE (from Manual, Prompt 4) ═══

  CATEGORY 1: SALE / OWNERSHIP TRANSFER → "Sale Deed / Ownership Transfer Deed"
  Gujarati: "વેચાણ દસ્તાવેજ" | "વેચાણખત" | "સંપૂર્ણ વેચાણખત" | "હસ્તાંતરણ દસ્તાવેજ"
  "માલિકી ફેરખત" | "માલિકી ફેર ખત" | "ફેર ખત" | "વેચાણ" | "Maliki Ferkhat" | "Sale Deed" | "Conveyance Deed"
  
  CATEGORY 2: MORTGAGE → "Mortgage Deed"
  Gujarati: "ગીરો દસ્તાવેજ" | "ગીરો ખત" | "ગીરોખત" | "સાદો ગીરો દસ્તાવેજ"
  "બોજો ખત" | "Giro" | "Mortgage" | "Simple Mortgage" | "Equitable Mortgage" | "Charge"
  
  CATEGORY 3: RELEASE OF MORTGAGE → "Release of Mortgage Deed / Reconveyance Deed"
  Gujarati: "ગીરો મુક્તિ" | "ગીરો મુક્તિખત" | "ગીરો મૂકેલી મિલકતનું ફેર માલિકી ફેર ખત"
  "મુક્તિખત" | "પુનઃ હસ્તાંતરણ દસ્તાવેજ" | "Giro Mukti" | "Giro Mukeli" | "Release" | "Reconveyance" | "Discharge of Mortgage" | "Satisfaction of Mortgage"
  ⚠️ SPECIAL: When this deed type is found — Col 3 (Aapnar) = Bank/Lender | Col 4 (Lenar) = Owner/Borrower
  → Underlying loan is FULLY DISCHARGED and property is FREE from mortgage lien

  CATEGORY 4: GIFT DEED → "Gift Deed"
  Gujarati: "બક્ષિસખત" | "ભેટખત" | "ભૂષણ" | "Bhet" | "Gift"

  CATEGORY 5: PARTITION DEED → "Partition Deed"
  Gujarati: "ભાગલા દસ્તાવેજ" | "ભાગ" | "વહેંચણી" | "ભાગ/વહેંચણી" | "Bhag" | "Partition" | "Family Settlement"

  CATEGORY 6: LEASE DEED → "Lease Deed"
  Gujarati: "ભાડાપટ્ટા દસ્તાવેજ" | "ભાડા પટ્ટો" | "Bhada Patto" | "Lease" | "Leave and License"

  CATEGORY 7: AGREEMENT TO SELL (with Possession) → "Agreement to Sale (with Possession)"
  Gujarati: "વેચાણ કરાર" | "બાનાખત" | "Banakhat" | "AoS"
  Only when "કબ્જા વગર"/"Without Possession" does NOT appear

  CATEGORY 8: AGREEMENT TO SELL WITHOUT POSSESSION → "Agreement to Sale WITHOUT Possession"
  Gujarati: "બાનાખત કબ્જા વગર" | "AoS Without Possession"
  ⚠️ CRITICAL: This is NOT a Sale Deed — NEVER classify as Sale Deed

  CATEGORY 9: POWER OF ATTORNEY (General) → "Power of Attorney (General)"
  Gujarati: "મુખત્યારનામું" | "સામાન્ય મુખત્યારનામું" | "Mukhtayarnamun" | "GPA" | "POA"

  CATEGORY 10: POWER OF ATTORNEY SECTION 45-A → "Power of Attorney under Section 45-A Registration Act"
  Gujarati: "45-એ મુજબનું મુખત્યારનામું" | "45-A મુજબ" | "45A" | "Registered POA 45-A"
  ⚠️ NOTE: Registered POA under Registration Act — different from General POA

  CATEGORY 11: SPECIAL POWER OF ATTORNEY → "Special Power of Attorney"
  Gujarati: "વિશેષ મુખત્યારનામું" | "SPA"

  CATEGORY 12: REVOCATION OF POA → "Revocation of Power of Attorney"
  Gujarati: "મુખત્યારનામું રદ" | "POA Cancellation" | "Revocation of POA"

  CATEGORY 13: WILL / TESTAMENT → "Will / Testament"
  Gujarati: "વસિયતનામું" | "ઇચ્છા પત્ર" | "Ichha Patr" | "Will" | "Testament"

  CATEGORY 14: WILL PROBATE → "Will Probate"
  Gujarati: "વસિયત પ્રમાણપત્ર" | "Probate"

  CATEGORY 15: DEVELOPMENT AGREEMENT → "Development Agreement / JDA"
  Gujarati: "વિકાસ કરાર" | "સંયુક્ત વિકાસ કરાર" | "JDA" | "Development" | "Builder Agreement"

  CATEGORY 16: RECTIFICATION DEED → "Rectification / Correction Deed"
  Gujarati: "સુધારા દસ્તાવેજ" | "ભૂલ સુધારો" | "Rectification" | "Correction Deed"

  CATEGORY 17: COURT ATTACHMENT / LIS PENDENS → "Court Attachment / Lis Pendens"
  Gujarati: "જપ્તી" | "Attachment" | "Stay Order" | "Lis Pendens" | "Court Order"
  ⚠️ CRITICAL: If found → TITLE BREAK alert — bank cannot proceed

  CATEGORY 18: CANCELLATION DEED → "Cancellation / Revocation Deed"
  Gujarati: "રદ ખત" | "રદબાતલ દસ્તાવેજ" | "Cancellation" | "Revocation"

  CATEGORY 19: DECLARATION DEED → "Declaration Deed"
  Gujarati: "ઘોષણા" | "જાહેરનામું" | "ઘોષણાપત્ર" | "Ghoshna" | "Declaration"

  CATEGORY 20: RELINQUISHMENT DEED → "Relinquishment Deed"
  Gujarati: "હક ત્યાગખત" | "Relinquishment"

  CATEGORY 21: EXCHANGE DEED → "Exchange Deed"
  Gujarati: "અદલાબદલી દસ્તાવેજ" | "Exchange"

  CATEGORY 22: FAMILY SETTLEMENT → "Deed of Family Settlement"
  Gujarati: "કુટુંબ સમાધાન દસ્તાવેજ" | "Family Settlement"

  CATEGORY 23: TRUST DEED → "Trust Deed"
  Gujarati: "ટ્રસ્ટ દસ્તાવેજ" | "Trust Deed"

  CATEGORY 24: ADOPTION DEED → "Adoption Deed"
  Gujarati: "દત્તક" | "Dattak" | "Adoption"

  ═══ WHEN TYPE IS UNCLEAR / UNRECOGNIZED ═══
  TIER A — Partial match: Check if any keyword from above table appears in the text
  TIER B — Context-based detection:
    IF Col 4 (Lenar) = Bank/NBFC/Financial Institution → MORTGAGE DEED
    IF Col 3 (Aapnar) = Bank/NBFC/Financial Institution → RELEASE OF MORTGAGE DEED
    IF both parties are individuals and no bank → SALE DEED or GIFT DEED or PARTITION DEED
    IF one party = Government/Authority → LEASE DEED or DEVELOPMENT AGREEMENT
  TIER C — Word-by-word Gujarati translation → output "Unknown Deed Type ([English translation])"
  RULE: ALWAYS output English type. NEVER leave Gujarati in report.

STEP 5 — RELEASE OF MORTGAGE — MANDATORY CHECK (RULE 17):
Before marking any mortgage as ACTIVE, check:
1. Is there a "ગીરો મુક્તિ" / Release row in EC AFTER the mortgage row? → DISCHARGED
2. Is Release of Mortgage Deed / Giro Mukeli submitted as document? → DISCHARGED
3. Is Index-II of Release submitted? → DISCHARGED
4. Is NOC / No-Dues Certificate from bank submitted? → DISCHARGED
If ANY of above = YES → Mortgage = FULLY DISCHARGED
NEVER report as active if release evidence exists.

MANDATORY — READ ALL EC ROWS (RULE 4A):
NEVER trust "X registered transactions" header — it is often WRONG.
READ EVERY ACTUAL ROW in EC table yourself.
For each row after a Mortgage row — check if it is Release/Giro Mukeli.
If Col 4 (Lenar) = Bank = MORTGAGE | If Col 3 (Aapnar) = Bank = RELEASE.

═══════════════════════════════════════════════════════
REGULATORY APPROVALS — CHECK ALL:
═══════════════════════════════════════════════════════
NA Order | Development Permission | Building Plan Approval | Commencement Certificate
RERA Registration | Fire NOC | Airport Authority NOC | BU Permission / Occupancy Certificate
Completion Certificate | Environmental Clearance
If not submitted = "NOT PROVIDED FOR VERIFICATION."

═══════════════════════════════════════════════════════
PERMANENT RULES — NEVER VIOLATE:
═══════════════════════════════════════════════════════
1. NEVER "and others" / "and co-transferees" — EVERY person named individually
2. Applicant = from Draft Sale Deed/Banakhat — Buyer section — NEVER from stamp paper
3. Current Owner = from LATEST submitted deed — deed > EC for ownership
4. All 4 boundaries MANDATORY — East | West | North | South
5. EC Col 7 (Last) = NEVER READ OR MENTION — strict Manual rule
6. EC Applicant / Applicant Name on EC Form = COMPLETELY IGNORE — zero property interest
7. Giro Mukeli = DISCHARGED — never report as active
8. Dukan = Shop | Banakhat Kabja Vagar = AoS Without Possession (NOT Sale Deed)
9. LOAN AMOUNT = NEVER mention anywhere
10. Subject property ONLY — verify Unit + Block + Floor match for EVERY EC entry`

// ================================================================
// LAYER 2+3 — SONNET — TITLE VERIFICATION + RISK ENGINE
// ================================================================
const LAYER23_BASE = `You are Layer 2 (Title Verification Engine) and Layer 3 (Risk & Mortgageability Engine) per the Master System Prompt Manual.

NON-NEGOTIABLE PRINCIPLES (from Manual):
• Never assume facts | Never create ownership | Never infer title without documents
• Never certify title continuity where any link is unsupported
• Never suppress adverse findings
• Clearly distinguish: Verified Facts | Missing Information | Legal Issues | Legal Conclusions
• Unavailable = "NOT PROVIDED FOR VERIFICATION."

TITLE CERTIFICATION RULE (from Manual):
Title certified ONLY when ALL satisfied:
✓ Ownership established from registered document
✓ Title continuity — every transfer documented
✓ Encumbrances verified — all mortgages discharged OR accounted for
✓ Revenue records reconciled with EC and registered documents
✓ Mortgageability assessed
Otherwise = "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

LAYER 3 — RISK CATEGORIES (from Manual):
HIGH | MODERATE | LOW

MORTGAGEABILITY (from Manual):
Mortgageable | Conditionally Mortgageable | Not Mortgageable
SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
Lending Suitability: Suitable | Conditionally Suitable | Not Suitable
Security Coverage Adequacy: Adequate | Conditional | Inadequate

EC RULES — SONNET MUST DO THIS:
1. Read EVERY ACTUAL ROW in EC table — ignore header count ("X transactions" is unreliable)
2. Translate EVERY Col 1 Gujarati type to English (use full translation table from Layer 1)
3. Col 3 = Aapnar/Seller/Mortgagor | Col 4 = Lenar/Buyer/Bank | Col 6 = Deed No | Col 5 = Date
4. If Col 4 (Lenar) = Bank → MORTGAGE → scan ALL remaining rows for Release/Giro Mukeli
5. If Release row found after mortgage → Mortgage = DISCHARGED
6. EC Col 7 (Last) = NEVER MENTION | EC Applicant = COMPLETELY IGNORE

TITLE CHAIN FROM MANUAL (Prompt 3):
Identify all title events: Sale Deed, Gift Deed, Exchange Deed, Partition Deed, Mortgage, Release,
Relinquishment, Development Agreement, Court Decree, Will, Succession, etc.
Verify every link: Previous Owner → Transfer Document → Current Owner
If any link missing → FLAG: TITLE BREAK — Severity: CRITICAL

FERFAR RULES:
Skip first column. Col1=Entry No+Date+Status | Col2=Nature | Col3=Survey(if relevant) | Col4(Last)=IGNORE

PERMANENT RULES:
1. NEVER "and others" — every person individually
2. Giro Mukeli = DISCHARGED — never active
3. Banakhat Kabja Vagar = AoS Without Possession — NEVER call Sale Deed
4. Subject property ONLY — Unit+Block+Floor match required
5. LOAN AMOUNT = NEVER mention`

function getLayer23(caseType: string): string {
  const caseModule: Record<string, string> = {
    builder_purchase: `
═══ CASE: BUILDER PURCHASE ═══
Proposed purchaser buys from Builder and seeks bank finance.

---META---
APPLICANT: [Full names — from Draft Sale Deed/Banakhat/Allotment — Buyer side — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search in respect of immovable property bearing..."]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Builder/Developer full names — from title documents]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Count of ACTUAL TABLE ROWS — not header count]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

BUILDER PURCHASE CHECKLIST:
1. Draft Sale Deed / Registered Banakhat / Letter of Allotment = MANDATORY
2. FERFAR for last 20-30 years chronological | EC for 13-14 years
3. Builder mutation in 7/12 = required — if absent flag in Part VI
4. Project Finance NOC = mandatory in Part IX if Builder has project loan
5. Builder NOC for Mortgage = Pre-Disbursement (Part IX) mandatory
6. NA Order = trace from documents or FERFAR

PART VIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    resale: `
═══ CASE: RESALE ═══
Current owner sells to proposed purchaser who seeks bank finance.

---META---
APPLICANT: [from Draft Sale Deed/Banakhat — Second Party/Vechan Lenar — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search in respect of..."]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [First Party/Vechan Aapnar — ALL names individually]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Count of ACTUAL TABLE ROWS]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

RESALE CHECKLIST:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. Draft Sale Deed / Banakhat between owner and purchaser = MANDATORY
3. FALSE DECLARATION CHECK: Banakhat says "no loan" but EC shows mortgage = HIGH ALERT

PART VIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    bt: `
═══ CASE: BALANCE TRANSFER ═══
Current owner transfers existing loan to another lender. NO property transfer.

---META---
APPLICANT: [Current owner/borrower — full names individually]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Count of ACTUAL TABLE ROWS]
EXISTING_BANK: [Name of existing mortgagee bank from EC]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

BALANCE TRANSFER CHECKLIST:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. Existing Mortgage Deed / LOD from existing Bank = trace from docs/EC
3. EC will show existing mortgage — identify Bank + Deed No + Date

PART VIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    seller_bt: `
═══ CASE: SELLER BT ═══
Current owner has existing loan AND sells to proposed purchaser. TWO simultaneous transactions.

---META---
APPLICANT: [Proposed purchaser — from Draft Deed/Banakhat — Buyer side]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Seller — First Party in Draft Deed — ALL names individually]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Count of ACTUAL TABLE ROWS]
EXISTING_BANK: [Name of existing mortgagee bank from EC]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

SELLER BT CHECKLIST:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. Draft Sale Deed/Banakhat between owner and purchaser = MANDATORY
3. FALSE DECLARATION: Banakhat says "no loan" but EC shows mortgage = HIGH ALERT
4. Existing Mortgage / LOD from existing Bank = trace from docs/EC

PART VIII LEGAL OPINION (EXACT WORDING):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    lap: `
═══ CASE: LAP / MORTGAGE ═══
Current owner seeks loan against own property. NO existing loan. NO property transfer.

---META---
APPLICANT: [Current owner/borrower — full names individually]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: [East: | West: | North: | South:]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [E-Application Number from EC Receipt]
EC_DATE: [Date of EC print/application]
EC_SEARCH_PERIOD: [From DD/MM/YYYY to DD/MM/YYYY]
EC_TOTAL_ENTRIES: [Count of ACTUAL TABLE ROWS]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
---END META---

LAP CHECKLIST:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. EC shows ANY mortgage/charge = UNDISCLOSED MORTGAGE = HIGH ALERT
3. CERSAI Search = Pre-Disbursement mandatory

PART VIII LEGAL OPINION (EXACT WORDING):
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
    mortgagor: g('MORTGAGOR'),
    propertyPara: g('PROPERTY_PARA'), propertyBoundaries: g('PROPERTY_BOUNDARIES'),
    currentOwner: g('CURRENT_OWNER'),
    ecAppNumber: g('EC_APP_NUMBER'),
    ecDate: g('EC_DATE'), ecSearchPeriod: g('EC_SEARCH_PERIOD'), ecTotalEntries: g('EC_TOTAL_ENTRIES'),
    existingBank: g('EXISTING_BANK'),
    riskLevel: g('RISK_LEVEL'),
    mortgageability: g('MORTGAGEABILITY'),
    sarfaesi: g('SARFAESI'), lendingSuitability: g('LENDING_SUITABILITY'),
  }
}

// ================================================================
// LAYER 4 — REPORT GENERATOR — 4 PARALLEL CALLS
// 11-PART STRUCTURE AS PER MANUAL (Prompt 6)
// L4A: PART I + II + III
// L4B: PART IV + V
// L4C: PART VI + VII + VIII
// L4D: PART IX + X + XI
// ================================================================

// ── L4A: PART I (Borrower/Mortgagor/Ownership) + PART II (Property) + PART III (Documents) ──
const L4A = `You are Layer 4 — Legal Report Generator. Generate HTML for PART I, PART II, PART III.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---. NO pipes.

═══════════════════════════════════════════════════════
PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP
(from Manual Prompt 6)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>

<div class="sph">A. Borrower Details</div>
<table class="mt">
  <tr><td>Name of Borrower/s</td><td>:</td><td>[Full name/s — every person individually — NEVER "and others"]</td></tr>
  <tr><td>Co-Borrower/Co-Applicant</td><td>:</td><td>[Full name/s or "Not Applicable"]</td></tr>
  <tr><td>Address</td><td>:</td><td>[Address as per documents]</td></tr>
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm / Private Ltd / HUF / Trust / Society]</td></tr>
</table>

<div class="sph">B. Mortgagor Details</div>
<table class="mt">
  <tr><td>Name of Mortgagor/s</td><td>:</td><td>[Full names — if same as borrower write "Same as Borrower/s above"]</td></tr>
  <tr><td>Address</td><td>:</td><td>[if same write "Same as above"]</td></tr>
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm / etc.]</td></tr>
</table>

<div class="sph">C. Current Ownership</div>
<table class="mt">
  <tr><td>Current Owner/s</td><td>:</td><td>[Full name/s individually — from latest deed — NEVER "and others"]</td></tr>
  <tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift Deed / etc.]</td></tr>
  <tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO]</td></tr>
</table>

═══════════════════════════════════════════════════════
PART II — PROPERTY DESCRIPTION
(from Manual Prompt 6)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART II — PROPERTY DESCRIPTION</div>

<div class="prop-para">[Full paragraph format: "Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor Number] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as "[Scheme Name]" constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village Name], Taluka: [Taluka Name], District [District Name]."]</div>

<div class="sph">Property Boundaries</div>
<table class="mt">
  <tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
  <tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
  <tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
  <tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

═══════════════════════════════════════════════════════
PART III — LIST OF SCRUTINIZED DOCUMENTS
(from Manual Prompt 6 — NO ILLEGIBILITY REMARKS)
═══════════════════════════════════════════════════════
CRITICAL MANUAL RULE: Include ALL submitted/uploaded documents.
DO NOT write remarks like "ILLEGIBLE", "BLANK", "NOT PROVIDED FOR VERIFICATION" in Part III.
Simply list every document with its basic details. Illegibility remarks go ONLY in Part VI Alerts.
NEVER list Mutation Entries in Part III. NEVER mention Stamp Paper No. / Stamp Duty / Registration Fees.
Latest document FIRST. Oldest LAST.

<hr><div class="ph">PART III — LIST OF SCRUTINIZED DOCUMENTS</div>

FORMAT FOR EACH DOCUMENT:
<div class="di">
  <p><span class="dn">N. [Document Type/Name] — Reg. No. / Sr. No. [X] | Dated: [DD-MM-YYYY]</span><br>
  [Executant/Aapnar name/s individually] unto and in favour of [Claimant/Lenar name/s individually]. [SRO name if registration document.] [2-3 sentences of key observation — NO illegibility remarks.]</p>
</div>

EC FORMAT IN PART III:
<div class="di">
  <p><span class="dn">N. Encumbrance Certificate (EC) — Application No.: [EC_APP_NUMBER] | Application Date: [DD-MM-YYYY] | Search Period: [From DD/MM/YYYY to DD/MM/YYYY]</span><br>
  EC obtained for search period from [From Date] to [To Date] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. The EC discloses [COUNT] registered transaction/s for the subject property as under:<br>
  Entry 1: [English Type of deed] — Deed No. [X] dated [DD/MM/YYYY] — Executing Party (Aapnar): [Full name/s] — Claimant Party (Lenar): [Full name/s or Bank name] — Status: [Active / Discharged vide Release Deed No. X dated DD/MM/YYYY].<br>
  [Repeat for EVERY ACTUAL ROW — every entry individually listed — NEVER Col 7 — NEVER EC Applicant]</p>
</div>

Revenue Record / 7-12 / Mutation Format:
<div class="di">
  <p><span class="dn">N. Village Form No. 7/12 / Revenue Record — Survey/Block No. [X] | Village: [Name] | Taluka: [Name] | District: [Name]</span><br>
  Land use: [Bin Kheti/Non-Agricultural]. [2-3 sentences of key details — ownership column, boja, tenancy.]</p>
</div>

RULES: NEVER "and others". NEVER EC Col 7. NEVER EC Applicant name. "Banakhat Kabja Vagar" = Agreement to Sale Without Possession.
START: <hr><div class="ph">PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
END after Part III last document entry.`

// ── L4B: PART IV (Title Chain) + PART V (Approvals) ──────────
const L4B = `You are Layer 4 — Legal Report Generator. Generate HTML for PART IV and PART V.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---.

═══════════════════════════════════════════════════════
PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY
(from Manual Prompts 3 & 6)
═══════════════════════════════════════════════════════
CRITICAL: Start from EARLIEST available record — original agricultural landowner from 7/12/FERFAR.
DO NOT start from builder or recent sale deed. Go to the ORIGIN.

Identify all title events (from Manual Prompt 3):
Sale Deed | Gift Deed | Exchange Deed | Settlement Deed | Partition Deed | Trust Deed
Mortgage Deed | Release of Mortgage | Development Agreement | Court Decree | Will | Succession
For each event: verify Previous Owner → Transfer Document → Current Owner
If any link missing → FLAG: TITLE BREAK (Severity: CRITICAL)

PART IV RULES:
1. OLDEST event FIRST — NEWEST LAST (chronological)
2. First paragraph: NO "Thereafter" — begin with earliest traceable record
3. Every subsequent paragraph: MUST start with "Thereafter,"
4. NEVER "and others" — every person individually
5. EC-confirmed deeds (copy not submitted): include naturally — no remark, no flag
6. End each transfer paragraph: Mutation Entry No + date if available
7. Mortgage entries: include with discharge status
8. Translate ALL Gujarati terms to English
9. If earliest record not traceable: "The history of the subject land prior to [date] could not be traced."

<hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>

FIRST PARAGRAPH (NO "Thereafter"):
<p>As per the revenue records produced, the subject land bearing [Survey/Block No.], Village [Name], Taluka [Name], District [Name] was originally held by [Original Owner full name/s] as [tenure type] as evidenced by [earliest Ferfar entry / Village Form 7/12 / government records]. [Any relevant details.] Entry to that effect recorded vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

SUBSEQUENT PARAGRAPHS (always start "Thereafter,"):
<p>Thereafter, [Seller full name/s] transferred the subject property to [Buyer full name/s] vide Registered [Deed Type] bearing Registration No. [X] dated [DD/MM/YYYY] registered at Sub-Registrar Office, [SRO Name] for a consideration of Rs. [Amount]. Entry to that effect recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

MORTGAGE PARAGRAPH:
<p>Thereafter, [Mortgagor full name/s] created a mortgage over the subject property in favour of [Bank full name] vide Registered Mortgage Deed bearing Registration No. [X] dated [DD/MM/YYYY] at SRO [Name]. [The said mortgage stands discharged vide Registered Release Deed No. [X] dated [DD/MM/YYYY] — no subsisting charge remains. / The said mortgage is subsisting and active as on the date of this report — no Release Deed produced.]</p>

FINAL PARAGRAPH:
<p>Thereafter, [Current Owner full name/s] holds the right, title and interest in the subject property as the present registered owner/s as confirmed by the Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC Date] covering search period from [From] to [To] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [Encumbrance status — no subsisting charge / subject to existing charge of {Bank}.]</p>

═══════════════════════════════════════════════════════
PART V — APPROVALS AND REGULATORY COMPLIANCE
(from Manual Prompt 6)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART V — APPROVALS AND REGULATORY COMPLIANCE</div>

For each Revenue Record submitted:
<div class="sph">Revenue Record Analysis — Village Form No. 7/12</div>
<table class="mt">
  <tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
  <tr><td>District</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
  <tr><td>Total Area</td><td>:</td><td>[H.Are.SqMt.]</td></tr>
  <tr><td>Land Use</td><td>:</td><td>[Bin Kheti / Non-Agricultural — flag if Agricultural/Kheti]</td></tr>
  <tr><td>Ownership Column</td><td>:</td><td>[Names as recorded — flag if current owner not reflected]</td></tr>
  <tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL / Details — cross-check with EC]</td></tr>
  <tr><td>Ganot / Tenant</td><td>:</td><td>[NIL / Name — flag if tenancy recorded]</td></tr>
</table>

<div class="sph">Mutation Entries — Chronological (Earlier to Present)</div>
<table class="mut-tbl">
  <tr><th>Sr.</th><th>Entry No.</th><th>Entry Date</th><th>Status</th><th>Nature of Entry</th><th>Details</th><th>Survey No.</th></tr>
  [One row per mutation entry for subject property]
</table>
<p>[Cross-check: EC entries vs Mutation entries — any discrepancy?]</p>

<div class="sph">Regulatory Approvals</div>
<table class="mt">
  <tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Order No., date, authority — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Commencement Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>RERA Registration</td><td>:</td><td>[RERA No., developer, date — OR "NOT PROVIDED FOR VERIFICATION." — Post May 2017: MANDATORY]</td></tr>
  <tr><td>Fire NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Airport Authority NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>BU Permission / Occupancy Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Completion Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Environmental Clearance</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
</table>

<div class="sph">Encumbrance Certificate Analysis</div>
<p>Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC Date] covering search period from [From Date] to [To Date] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. The EC discloses [TOTAL COUNT] registered transaction/s for the subject property:</p>
<table class="ec-tbl">
  <tr><th>Sr.</th><th>Type of Deed (English)</th><th>Deed No.</th><th>Date</th><th>Executing Party (Aapnar)</th><th>Claimant Party (Lenar)</th><th>Status</th></tr>
  [One row per ACTUAL EC table row — NEVER Col 7 — translate Gujarati type to English]
</table>
<p>[EC cross-check: Total rows found. Discrepancy with Mutation/Documents? Entry within last 60 days? Active undischarged mortgage?]</p>

START: <hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END after Part V last table.`

// ── L4C: PART VI (Alerts) + PART VII (Deficiency) + PART VIII (Legal Opinion) ──
const L4C = `You are Layer 4 — Legal Report Generator. Generate HTML for PART VI, PART VII, PART VIII.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---.

═══════════════════════════════════════════════════════
PART VI — ALERTS
(from Manual Prompt 6 — Issues, Objections, Adverse Findings)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART VI — ALERTS</div>
<p>The following alerts and legal issues have been identified during 4-Layer AI title verification. HIGH severity alerts are conditions precedent to sanction or disbursement.</p>

HIGH SEVERITY ALERT FORMAT (use for: Title Break, Active Mortgage, Court Order, Missing Mandatory Doc, False Declaration):
<div class="ib">
  <div><span class="sh">HIGH SEVERITY</span></div>
  <div class="it">N. [Specific Alert Title — max 10 words]</div>
  <p>[Finding — exact deed nos, dates, party names — 3-4 sentences. Why legally material. What bank risk.]</p>
  <p><span class="sg">Direction:</span> [Specific document / action required — from whom — by when.]</p>
</div>

MEDIUM SEVERITY FORMAT (use for: Missing Permissions, Mutation Pending, EC Short Period, Co-owner Issues):
<div class="ib">
  <div><span class="sm">MEDIUM SEVERITY</span></div>
  <div class="it">N. [Alert Title]</div>
  <p>[Finding — 2-3 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

LOW SEVERITY FORMAT (use for: Minor Deficiencies, Clerical Observations):
<div class="ib">
  <div><span class="sl">LOW SEVERITY</span></div>
  <div class="it">N. [Alert Title]</div>
  <p>[Finding — 1-2 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

NEVER FLAG in Part VI:
- EC-confirmed deeds where deed copy not submitted (include naturally in Part IV chain — not an alert)
- EC Applicant name (zero property interest)
- Stamp Paper numbers

ALSO include illegibility remarks here:
[If any submitted document is illegible/blank: <p>The following submitted document/s could not be verified: [Document name/s] — certain portions are illegible. Legible certified copies are required for complete verification.</p>]

If NO issues found: <p>No adverse findings or title alerts identified on examination of the documents produced for verification. The title appears clear from the documents produced.</p>

═══════════════════════════════════════════════════════
PART VII — DOCUMENT DEFICIENCY REPORT
(from Manual Prompt 6)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART VII — DOCUMENT DEFICIENCY REPORT</div>

<div class="sph">A. Documents Submitted and Available for Verification</div>
<ol>[List all submitted documents that are readable and verifiable]</ol>

<div class="sph">B. Documents Not Submitted (Expected but Absent)</div>
<ol>[List each mandatory missing document with reason it is required — OR "NIL — All expected documents have been produced."]</ol>

<div class="sph">C. Submitted Documents That Are Illegible / Incomplete</div>
<ol>[List documents submitted but cannot be read — OR "NIL."]</ol>

<div class="sph">D. Mortgageability & Risk Assessment</div>
<p><strong>Mortgageability:</strong> [Mortgageable / Conditionally Mortgageable / Not Mortgageable]</p>
<p><strong>SARFAESI Enforceability:</strong> [Enforceable / Conditionally Enforceable / Not Enforceable]</p>
<p><strong>Lending Suitability:</strong> [Suitable / Conditionally Suitable / Not Suitable]</p>
<p><strong>Security Coverage Adequacy:</strong> [Adequate / Conditional / Inadequate]</p>
<p><strong>Risk Level:</strong> [HIGH / MODERATE / LOW]</p>
<p><strong>Reasoning:</strong> [Brief specific explanation — 2-3 sentences]</p>

═══════════════════════════════════════════════════════
PART VIII — LEGAL OPINION
(from Manual Prompt 6)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART VIII — LEGAL OPINION</div>

Use EXACT case-specific wording from Layer 2+3 analysis. Fill actual names.

<p>[Exact legal opinion paragraph — fill actual names of builder/owner and proposed purchaser/mortgagor]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank[subject to charge of {existing bank} if BT/Seller BT].</p>

VERDICT BOX (choose one):
NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[N] HIGH SEVERITY alert/s identified. Primary concerns: [list top issues briefly]. Bank must not proceed until ALL HIGH SEVERITY alerts are fully resolved.</p></div>
CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is marketable and mortgageable subject to: [list specific conditions].</p></div>
CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. [Brief reason.]</p></div>

START: <hr><div class="ph">PART VI — ALERTS</div>
END after Part VIII verdict box closing div.`

// ── L4D: PART IX (Pre-Disbursement) + PART X (Post-Disbursement) + PART XI (Final Recommendation) ──
const L4D = `You are Layer 4 — Legal Report Generator. Generate HTML for PART IX, PART X, PART XI.
OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ##. NO **. NO ---.

═══════════════════════════════════════════════════════
PART IX — DOCUMENTS REQUIRED AT PRE-DISBURSEMENT STAGE
(from Manual Prompt 6 — Prompt 9)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART IX — DOCUMENTS REQUIRED — PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody and verified before disbursement of the loan:</p>
<ol>
  <li>[Specific document — exact name — from whom to be obtained — purpose/remark]</li>
  [Add all case-specific mandatory pre-disbursement documents]
</ol>

CASE-SPECIFIC PRE-DISBURSEMENT:
Builder Purchase: Original NOC from Builder for Mortgage | Original NOC from Project Finance Bank (if project loan) | Draft Sale Deed / Banakhat
Resale: Draft of Sale Deed / Registered Banakhat | Any missing mandatory documents
Balance Transfer: LOD from existing Bank | Foreclosure Letter | Outstanding Certificate | NOC from existing Bank | CERSAI Search | Updated EC
Seller BT: Draft Sale Deed / Banakhat | Foreclosure Letter | LOD | NOC from existing Bank | CERSAI Search | Updated EC
LAP: Original Registered Sale Deed | Updated EC | CERSAI Search confirming no prior charge

═══════════════════════════════════════════════════════
PART X — DOCUMENTS REQUIRED AT POST-DISBURSEMENT STAGE
(from Manual Prompt 6 — Prompt 10)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART X — DOCUMENTS REQUIRED — POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody within the stipulated timeframe after disbursement:</p>
<ol>
  <li>[Specific document — exact name — from whom — within what timeframe]</li>
  [Add all case-specific post-disbursement documents]
</ol>

CASE-SPECIFIC POST-DISBURSEMENT:
Builder Purchase: Final Registered Sale Deed executed by Builder unto Purchaser — within [X] days
Resale: Final Registered Sale Deed executed by Current Owner unto Purchaser — within [X] days
Balance Transfer: No-Due Certificate from existing Bank | Registered Release Deed from existing Bank | Original Title Documents from existing Bank | Updated EC confirming new mortgage
Seller BT: Registered Sale Deed in favour of Purchaser | Release Deed from existing Bank | No-Due Certificate | Updated EC | Original Title Documents
LAP: Registered Mortgage / MODT | CERSAI Registration Confirmation | Updated EC post-mortgage

═══════════════════════════════════════════════════════
PART XI — FINAL RECOMMENDATION
(from Manual Prompt 6 — Select one)
═══════════════════════════════════════════════════════
<hr><div class="ph">PART XI — FINAL RECOMMENDATION</div>

<div class="final-rec">
  <div class="fr-title">Final Title Status (as per Master System Prompt Manual):</div>
  <div class="fr-value">[Select ONE: CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE REQUIRES RECTIFICATION / TITLE NOT RECOMMENDED / INSUFFICIENT DOCUMENTATION FOR TITLE CERTIFICATION]</div>
</div>

<p style="margin-top:16px;">[2-3 sentence summary: overall title status, key conditions if any, recommendation to bank for proceeding or not.]</p>

START: <hr><div class="ph">PART IX — DOCUMENTS REQUIRED — PRE-DISBURSEMENT STAGE</div>
END after Part XI recommendation paragraph.`

// ================================================================
// HTML WRAPPER — 11 PARTS
// ================================================================
function buildReport(p: {
  refNo: string; appId: string; today: string; bankName: string; loanType: string
  p123: string; p45: string; p678: string; p9_10_11: string
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
${p.p45}
${p.p678}
${p.p9_10_11}
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
      docText += `\n\n=== PROPERTY BOUNDARIES FROM DETAILS SHEET (PRE-VERIFIED) ===\nEast (Purva): ${boundaryEast || 'As per documents'}\nWest (Pashchim): ${boundaryWest || 'As per documents'}\nNorth (Uttar): ${boundaryNorth || 'As per documents'}\nSouth (Dakshin): ${boundarySouth || 'As per documents'}\n=== END OF BOUNDARIES ===\n`
    }

    l1Content.push({
      type: 'text',
      text: `LAYER 1 — DOCUMENT EXTRACTION ENGINE (Prompt 2 from Manual)
Extract ALL facts. Do NOT generate legal opinion.

CASE DETAILS SHEET (PRE-VERIFIED ANCHORS):
Applicant: ${applicantName || 'As per documents'}
Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'}
Case Type: ${caseType} | Loan Type: ${loanType || 'LAP'} | Bank: ${bankName} | APP ID: ${appId}
Property: ${propertyAddress || 'As per documents'}
Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

SUBMITTED DOCUMENTS TEXT:
${docText}

EXTRACTION PRIORITIES:
1. NEVER "and others" — ALL names individually
2. EC APPLICATION NUMBER + DATE + SEARCH PERIOD = MANDATORY from E-Application Receipt
3. NEVER TRUST EC HEADER COUNT — count ALL actual table rows yourself
4. EC Col 7 (Last) = NEVER READ OR MENTION
5. EC Applicant name = COMPLETELY IGNORE
6. For EVERY EC row after a Mortgage row — check if it is Release/Giro Mukeli → DISCHARGED
7. FERFAR: Skip first col. Read Entry No+Date+Status, Nature, Survey No. Skip last col.
8. Property description in PARAGRAPH FORMAT
9. Giro Mukeli = DISCHARGED | Subject property ONLY — Unit+Block+Floor match
10. Translate ALL Gujarati document types to English using the 24-category table`
    })

    const l1Msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: LAYER1_SYSTEM,
      messages: [{ role: 'user', content: l1Content }]
    })
    const extractedFacts = l1Msg.content[0].type === 'text' ? l1Msg.content[0].text : ''

    // ── LAYER 2+3: SONNET — TITLE + RISK ANALYSIS ─────────────
    const l23Msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      system: getLayer23(caseType),
      messages: [{
        role: 'user',
        content: `LAYER 2+3 — TITLE VERIFICATION + RISK ENGINE

CASE DETAILS (PRE-VERIFIED):
Applicant: ${applicantName} | Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'} | Property: ${propertyAddress}
Bank: ${bankName} | APP ID: ${appId}
Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

LAYER 1 EXTRACTED FACTS:
${extractedFacts}

MANDATORY — FILL META BLOCK COMPLETELY:
1. PROPERTY_PARA = exact paragraph format from Manual
2. EC_APP_NUMBER = exact E-Application Number from EC Receipt
3. EC_DATE = exact EC print date
4. EC_SEARCH_PERIOD = exact from-to search period
5. EC_TOTAL_ENTRIES = count of ACTUAL TABLE ROWS (not header count)
6. RISK_LEVEL = HIGH / MODERATE / LOW based on findings
7. All names individually — NEVER "and others"

EC EXTRACTION — READ ALL ACTUAL ROWS:
⚠️ DO NOT TRUST EC HEADER ("X transactions") — count actual rows yourself
For each row: English Type (translate Gujarati) | Deed No | Date | Aapnar/Seller | Lenar/Buyer or Bank
If Lenar = Bank → MORTGAGE → check ALL subsequent rows for Release/Giro Mukeli → DISCHARGED if found
EC Col 7 = NEVER MENTION | EC Applicant = COMPLETELY IGNORE`
      }]
    })
    const analysis = l23Msg.content[0].type === 'text' ? l23Msg.content[0].text : ''
    const meta = parseMeta(analysis)

    // ── LAYER 4: 4 PARALLEL REPORT GENERATION ─────────────────
    const [r4a, r4b, r4c, r4d] = await Promise.all([

      // Parts I + II + III
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4A,
        messages: [{
          role: 'user',
          content: `Generate PART I (Borrower/Mortgagor/Ownership) + PART II (Property Description) + PART III (Documents List).

APPLICANT: ${meta.applicant || applicantName}
CO-APPLICANT: ${meta.coApplicant || coApplicant || 'Not Applicable'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY PARA: ${meta.propertyPara || propertyAddress}
BOUNDARIES: East: ${boundaryEast || '?'} | West: ${boundaryWest || '?'} | North: ${boundaryNorth || '?'} | South: ${boundarySouth || '?'}
EC APP NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC DATE: ${meta.ecDate || 'As per documents'}
EC SEARCH PERIOD: ${meta.ecSearchPeriod || 'As per documents'}
EC TOTAL ENTRIES: ${meta.ecTotalEntries || 'As per documents'}
BANK: ${bankName}

ANALYSIS FROM LAYERS 1-3:
${analysis}

MANUAL RULE — PART III: List ALL submitted documents WITHOUT any illegibility/blank/NOT PROVIDED remarks. Illegibility remarks go ONLY in Part VI Alerts. Never list Mutation Entries in Part III.`
        }]
      }),

      // Parts IV + V
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4B,
        messages: [{
          role: 'user',
          content: `Generate PART IV (Chronological Title Chain) + PART V (Revenue Records, Mutation Entries, Approvals, EC Analysis).

CASE TYPE: ${caseType}
SUBJECT PROPERTY: ${meta.propertyPara || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
APPLICANT: ${meta.applicant || applicantName}
EC APP NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC DATE: ${meta.ecDate || 'As per documents'}
EC SEARCH PERIOD: ${meta.ecSearchPeriod || 'As per documents'}
EC TOTAL ENTRIES: ${meta.ecTotalEntries || 'As per documents'}

ANALYSIS FROM LAYERS 1-3:
${analysis}

RULES:
- Part IV: Start from EARLIEST record. First para NO "Thereafter". All subsequent MUST start "Thereafter,". Final para includes EC Application No + search period.
- Part V EC table: EVERY actual EC row — translate Gujarati type to English — Col 7 NEVER — EC Applicant NEVER — Release = DISCHARGED status.`
        }]
      }),

      // Parts VI + VII + VIII
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4C,
        messages: [{
          role: 'user',
          content: `Generate PART VI (Alerts) + PART VII (Document Deficiency Report) + PART VIII (Legal Opinion + Verdict).

BANK: ${bankName}
PROPERTY: ${meta.propertyPara || propertyAddress}
RISK_LEVEL: ${meta.riskLevel}
MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi}
LENDING_SUITABILITY: ${meta.lendingSuitability}

ANALYSIS FROM LAYERS 1-3:
${analysis}

MANUAL RULES:
- Part VI: Illegibility remarks go HERE. NEVER flag EC-confirmed deeds. NEVER flag EC Applicant.
- Part VII section D: Include Mortgageability + SARFAESI + Lending Suitability + Risk Level assessment.
- Part VIII: Use EXACT legal opinion wording from case type. Fill actual names. Verdict must match issues.`
        }]
      }),

      // Parts IX + X + XI
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, system: L4D,
        messages: [{
          role: 'user',
          content: `Generate PART IX (Pre-Disbursement Documents) + PART X (Post-Disbursement Documents) + PART XI (Final Recommendation).

CASE TYPE: ${caseType}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPOSED PURCHASER / MORTGAGOR: ${meta.applicant || applicantName}
BANK: ${bankName}
EXISTING BANK (BT/Seller BT): ${meta.existingBank || 'as per EC analysis'}

ANALYSIS FROM LAYERS 1-3:
${analysis}

MANUAL RULES: Case-specific documents for Part IX and X. Part XI = select ONE from: CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE REQUIRES RECTIFICATION / TITLE NOT RECOMMENDED / INSUFFICIENT DOCUMENTATION FOR TITLE CERTIFICATION.`
        }]
      })
    ])

    const p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error generating Part I-III</p>'
    const p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error generating Part IV-V</p>'
    const p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error generating Part VI-VIII</p>'
    const p9_10_11 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error generating Part IX-XI</p>'

    const reportHtml = buildReport({
      refNo, appId: appId || 'AUTO-000000', today,
      bankName: bankName || 'Bank',
      loanType: loanType || 'Loan Against Property',
      p123, p45, p678, p9_10_11,
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