// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts
// SOURCE: 5__Claude_Changed_Version.docx — COMPLETE IMPLEMENTATION
// 4-Layer Architecture | 11-Part Report | 7-Step EC Engine
// ZERO STEPS MISSING — All Prompts 2-6 + Steps 1-7 implemented
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
  if (u.includes('NOT CLEAR') || u.includes('TITLE BREAK') || u.includes('DEFECTIVE')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO')) return 'CLEAR SUBJECT TO'
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
.ec-released { color:#15803d; font-weight:bold; }
.ec-active { color:#b91c1c; font-weight:bold; }
.ec-unident { color:#b45309; font-style:italic; }
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
// LAYER 1 — HAIKU — PROMPT 2 + PROMPT 4 + STEPS 1-7
// ================================================================
const LAYER1_SYSTEM = `You are the Document Extraction Engine — Layer 1.
Implements: Prompt 2 (Document Extraction) + Prompt 4 (Revenue & EC Analysis) + Steps 1-7 (EC Type Classification).

NON-NEGOTIABLE:
• Never assume facts | Never create facts | Never infer without documents
• Never suppress adverse findings
• Unavailable = "NOT PROVIDED FOR VERIFICATION."

CONFIDENCE LEVELS:
HIGH = Registered document + government record + EC + revenue records (all 4)
MEDIUM = At least two independent records
LOW = One document only | NO CONFIDENCE = Unsupported

════════════════════════════════════════════════════
PROMPT 2 — DOCUMENT EXTRACTION (ALL DOCUMENTS)
════════════════════════════════════════════════════
For EVERY submitted document extract:
1. Document Type | 2. Registration Number | 3. Registration Date (NOT stamp paper date)
4. Executant — EVERY person individually — NEVER "and others"
5. Claimant — EVERY person individually
6. Property Description | 7. Survey/Block Number
8. Village | Taluka | District | Area | Boundaries
Classify: Available | Missing | Illegible | Incomplete

PROPERTY DESCRIPTION PARAGRAPH FORMAT (mandatory):
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

════════════════════════════════════════════════════
PROMPT 4 — MUTATION ENTRIES EXTRACTION
════════════════════════════════════════════════════
SKIP first column "Entry Details". For each entry extract:
Entry Number | Entry Date | Nature of Entry | Certified/Rejected Status | Relevant Survey Number | Remarks
Last column = IGNORE completely.

════════════════════════════════════════════════════
PROMPT 4 — EC COLUMN MAPPING (STRICT — FROM MANUAL)
════════════════════════════════════════════════════
COL 1 (First from Left):  Type of Deed/Document — APPLY STEPS 1-7 BELOW
COL 2 (Second):           Property Description
COL 3 (Third):            Executing Party = "Dastavej Kari Aapnar" = SELLER / MORTGAGOR / LENDER
COL 4 (Fourth):           Claimant Party = "Dastavej Kari Lenar" = BUYER / MORTGAGEE / BANK / BORROWER
COL 5 (Fifth):            Date of Registration
COL 6 (Sixth/Second Last): Registration Number / Dastavej Number
COL 7 (Seventh/LAST):    ⛔ NEVER READ. NEVER EXTRACT. NEVER MENTION. PERMANENT RULE FROM MANUAL.

EC HEADER COUNT: ⚠️ NEVER TRUST "X registered transactions" in header — count ACTUAL TABLE ROWS yourself.

EC APPLICATION RECEIPT — EXTRACT MANDATORY:
(a) EC_APP_NUMBER = "e-Application No." on receipt
(b) EC_DATE = "Date of Print" on receipt
(c) EC_FROM = Start date of search period
(d) EC_TO = End date of search period

NEVER REPRODUCE EC APPLICANT NAME — person who applied for EC has ZERO property interest — IGNORE.

════════════════════════════════════════════════════
STEPS 1-7 — EC DOCUMENT TYPE CLASSIFICATION ENGINE
(From Claude_Changed_Version.docx — EXACT IMPLEMENTATION)
════════════════════════════════════════════════════

STEP 1 — CAPTURE RAW TEXT:
For every EC Col 1, record the EXACT text as printed, in original script (Gujarati/English/mixed).
Store as RAW_DOC_TYPE_TEXT — retain for reference even after classification.
Do NOT correct, interpret or modify the raw text at this stage.

STEP 2 — NORMALIZE BEFORE MATCHING:
Apply normalization to RAW_DOC_TYPE_TEXT:
- Strip page-break hyphens, stray punctuation, double spaces, trailing entry numbers
- Treat spacing variants as equivalent: "વેચાણખત" = "વેચાણ ખત" = "વેચાણ-ખત"
- Treat transliteration variants as equivalent: "Banakhat" = "Bana Khat" = "બાનાખત"
- ⚠️ If text shows OCR artifacts (isolated conjunct fragments, broken ligatures, junk characters) → DO NOT guess → Route to STEP 5 FAILURE PROTOCOL immediately

STEP 3 — MATCH AGAINST CANONICAL TAXONOMY (priority order):
Match against the master Gujarati-English table below in this order:
1. EXACT MATCH — normalized text equals a table entry exactly → confidence: EXACT MATCH
2. SYNONYM/ROOT-WORD MATCH — shares legal root (e.g., "ગીરો" root matches Mortgage family) → confidence: SYNONYM MATCH
3. CONTEXTUAL MATCH — use Col 3/Col 4 pattern (bank↔borrower vs seller↔buyer) to confirm → confidence: CONTEXTUAL MATCH
⛔ NEVER output a type not in the taxonomy table. Unknown = Step 5.

STEP 4 — MANDATORY DISAMBIGUATION CHECKS:
Before finalizing, apply these disambiguation tests:

| Confusable Pair | Distinguishing Test |
|---|---|
| Sale Deed vs Agreement to Sell / Banakhat | Sale Deed = actual title transfer. Agreement = future promise. Check if registered as conveyance or agreement. |
| Sale Deed vs Conveyance vs Absolute Sale Deed | All transfer title — same family. Use exact word from document. Don't invent distinction. |
| Gift Deed vs Relinquishment vs Family Settlement | Gift = any person, no consideration. Relinquishment = co-owner gives up share. Family Settlement = multilateral family arrangement. Check parties. |
| Release Deed vs Reconveyance vs Mortgage Release | If prior Mortgage Deed for same property exists in EC → classify as Reconveyance / Mortgage Release Deed, NOT generic Release. |
| Mortgage Deed vs Simple Mortgage vs Equitable Mortgage | Default to "Mortgage Deed" unless text explicitly says "Simple" or "Equitable". |
| POA vs GPA vs SPA | Use GPA/SPA only when text explicitly says "General" or "Special". Otherwise use generic "Power of Attorney". |
| Partition Deed vs Family Settlement | Partition = specific shares of one property. Family Settlement = broader, multiple properties/disputes. |
If two entries remain equally plausible → use BROADER/MORE CONSERVATIVE category → flag for manual review.

STEP 5 — FAILURE PROTOCOL (NO-GUESS RULE):
If after Steps 1-4, type cannot be matched with at least MEDIUM confidence:
⛔ DO NOT output any taxonomy label.
Output exactly: DOCUMENT TYPE NOT IDENTIFIABLE — RAW TEXT: [RAW_DOC_TYPE_TEXT] — REQUIRES MANUAL REVIEW
This follows from master rule: "Never assume facts. Never create facts."

STEP 6 — CONFIDENCE TAGGING:
Tag each EC entry's document type with ONE of:
- EXACT MATCH — raw text directly matched taxonomy
- SYNONYM MATCH — matched via root word / spelling variant
- CONTEXTUAL MATCH — matched using Col3/Col4 pattern (flag as judgment call)
- UNIDENTIFIED — Step 5 Failure Protocol triggered

STEP 7 — OUTPUT SCHEMA FOR EACH EC ENTRY:
Output each EC entry in this format:
EC_ENTRY_[N]:
  RAW_DOC_TYPE_TEXT: [exact raw Col 1 text]
  CLASSIFIED_TYPE: [English type from taxonomy OR "DOCUMENT TYPE NOT IDENTIFIABLE — RAW TEXT: [X] — REQUIRES MANUAL REVIEW"]
  MATCH_CONFIDENCE: [EXACT MATCH / SYNONYM MATCH / CONTEXTUAL MATCH / UNIDENTIFIED]
  COL2_PROPERTY: [from Col 2 — does it match subject property Unit+Block+Floor?]
  COL3_AAPNAR: [full name/s from Col 3]
  COL4_LENAR: [full name/s or bank name from Col 4]
  COL5_DATE: [DD/MM/YYYY]
  COL6_DEED_NO: [Registration number]
  SUBJECT_MATCH: [YES / NO — based on Unit+Block+Floor comparison]
  IS_MORTGAGE: [YES — if COL4_LENAR = any Bank/NBFC/Financial Institution / NO]
  IS_RELEASE: [YES — if CLASSIFIED_TYPE = Mortgage Release / Reconveyance / Release of Mortgage / NO]

════════════════════════════════════════════════════
MORTGAGE-RELEASE PAIRING (Prompt 4 + Step 4):
════════════════════════════════════════════════════
After extracting ALL EC entries, for EACH IS_MORTGAGE=YES entry:

PAIRING_CHECK_FOR_ENTRY_[N]:
  MORTGAGE_BANK: [bank name from COL4_LENAR]
  MORTGAGE_DEED_NO: [COL6_DEED_NO]
  MORTGAGE_DATE: [COL5_DATE]
  
  SEARCH ALL SUBSEQUENT ENTRIES: Is there any IS_RELEASE=YES entry where:
    - COL3_AAPNAR = same bank that was in COL4_LENAR of mortgage?
    - That release entry comes AFTER this mortgage entry in EC (later date)?
  
  IF MATCHING RELEASE FOUND:
    MORTGAGE_STATUS: DISCHARGED
    DISCHARGED_BY_ENTRY: [entry number]
    RELEASE_DEED_NO: [COL6_DEED_NO of release entry]
    RELEASE_DATE: [COL5_DATE of release entry]
    NOTE: "Per Prompt 4 Manual — Executing Party (Col 3) = Lender/Bank releasing mortgage. Claimant Party (Col 4) = Property Owner/Borrower receiving title back. Charge Released and Satisfied."
  
  IF NO MATCHING RELEASE FOUND IN EC:
    ALSO CHECK SUBMITTED DOCUMENTS:
    - Release of Mortgage Deed submitted? → DISCHARGED
    - Index-II of Release submitted? → DISCHARGED
    - NOC / No-Dues Certificate submitted? → DISCHARGED
    IF NONE: MORTGAGE_STATUS: ACTIVE — No release found

════════════════════════════════════════════════════
MASTER GUJARATI-ENGLISH TAXONOMY TABLE (Prompt 4)
════════════════════════════════════════════════════
Use ONLY these classifications. No others.

Sale Deed                    → વેચાણ દસ્તાવેજ / વેચાણખત / Maliki Ferkhat / ફેર ખત / ફ.ખ.
Absolute Sale Deed           → સંપૂર્ણ વેચાણખત
Conveyance Deed              → હસ્તાંતરણ દસ્તાવેજ
Gift Deed                    → બક્ષિસખત / ભેટખત / ભૂષણ / ભ.ખ.
Release Deed                 → મુક્તિખત / રિલીઝ ડીડ
Relinquishment Deed          → હક ત્યાગખત
Partition Deed               → ભાગલા દસ્તાવેજ / ભાગ / ભ.પ.
Family Settlement Deed       → કુટુંબ સમાધાન દસ્તાવેજ
Exchange Deed                → અદલાબદલી દસ્તાવેજ
Mortgage Deed                → ગીરો દસ્તાવેજ / ગીરો ખત / ગ.ખ. / Giro / Boja / Mortgage
Simple Mortgage Deed         → સાદો ગીરો દસ્તાવેજ (only if text says "Simple"/"Sado")
Equitable Mortgage           → સમન્યાયી ગીરો (only if text says "Equitable")
Mortgage Release Deed        → ગીરો મુક્તિખત / ગ.મ. / Giro Mukti
Reconveyance Deed            → પુનઃ હસ્તાંતરણ / ગીરો મૂકેલી મિલકતનું ફેર માલિકી ફેર ખત / Giro Mukeli Milkatnu Fer Maliki Ferkhat
Lease Deed                   → ભાડાપટ્ટા દસ્તાવેજ / ભ.પ.
Leave and License Agreement  → ઉપયોગ પરવાનગી કરાર
Rent Agreement               → ભાડા કરાર
Development Agreement        → વિકાસ કરાર / JDA
Joint Development Agreement  → સંયુક્ત વિકાસ કરાર (only if text says "Joint"/"Sanyukt")
Agreement to Sell            → વેચાણ કરાર / Banakhat (WITH possession) / બ.ખ.
Agreement to Sell (No Poss.) → બાનાખત કબ્જા વગર / AoS Without Possession ← NEVER call Sale Deed
Power of Attorney            → મુખત્યારનામું / POA (generic — use when text not specific)
General Power of Attorney    → સામાન્ય મુખત્યારનામું / GPA (only if text says "General"/"Samanya")
Special Power of Attorney    → વિશેષ મુખત્યારનામું / SPA (only if text says "Special"/"Vishesh")
POA under Section 45-A       → 45-એ / 45-A / 45A (Registered POA under Registration Act)
Revocation of POA            → મુખત્યારનામું રદ / POA Cancellation
Will                         → વસિયતનામું / ઇચ્છા પત્ર / Testament
Probate                      → વસિયત પ્રમાણપત્ર
Succession Certificate       → વારસાઈ પ્રમાણપત્ર
Legal Heir Certificate       → વારસદાર પ્રમાણપત્ર
Affidavit                    → સોગંદનામું
Declaration Deed             → જાહેરનામું / ઘોષણાપત્ર / ઘોષણા
Indemnity Bond               → વળતર બાંહેધરી
Rectification Deed           → સુધારા દસ્તાવેજ / Correction Deed
Confirmation Deed            → પુષ્ટિ દસ્તાવેજ
Cancellation Deed            → રદબાતલ દસ્તાવેજ / Cancellation / Revocation
Settlement Deed              → સમાધાન દસ્તાવેજ
Trust Deed                   → ટ્રસ્ટ દસ્તાવેજ
Partnership Deed             → ભાગીદારી દસ્તાવેજ
Deed of Admission            → પ્રવેશ દસ્તાવેજ
Deed of Retirement           → નિવૃત્તિ દસ્તાવેજ
Deed of Dissolution          → વિસર્જન દસ્તાવેજ
Lis Pendens                  → લિસ પેન્ડન્સી / Court Attachment / Attachment / Stay ← CRITICAL ALERT

════════════════════════════════════════════════════
LEGACY FONT / OCR FAILURE HANDLING:
════════════════════════════════════════════════════
If extracted Gujarati text shows symptoms of legacy font corruption:
- Conjunct characters split and reordered
- Isolated junk characters / fragments
- Text that looks like "ક્ષવકાસ કરાર" instead of "વિકાસ કરાર"
→ Flag as UNIDENTIFIED per Step 5.
→ Output: DOCUMENT TYPE NOT IDENTIFIABLE — RAW TEXT: [corrupted text] — REQUIRES MANUAL REVIEW
→ Also attempt CONTEXTUAL MATCH using Col3/Col4 as fallback and note it.

════════════════════════════════════════════════════
PERMANENT RULES — NEVER VIOLATE:
════════════════════════════════════════════════════
1. NEVER "and others" — every person individually
2. EC Col 7 (Last column) = NEVER read, extract, or mention — permanent rule
3. EC Applicant name = COMPLETELY IGNORE — zero property interest
4. Loan Amount = NEVER mention anywhere
5. Stamp Paper No / Stamp Duty = NEVER mention
6. Subject property ONLY — verify Unit+Block+Floor match for every EC entry
7. Dukan = Shop | Banakhat Kabja Vagar = AoS Without Possession (NOT Sale Deed)
8. Current Owner = from LATEST submitted deed (deed takes priority over EC)`


// ================================================================
// LAYER 2+3 — SONNET — PROMPT 3 + PROMPT 5 + LEGAL OPINION
// ================================================================
const LAYER23_BASE = `You are Layer 2 (Title Verification — Prompt 3) and Layer 3 (Mortgageability & Risk — Prompt 5).

NON-NEGOTIABLE:
• Never assume | Never create | Never infer without documents
• Never certify if title continuity is incomplete | Never suppress adverse findings
• Unavailable = "NOT PROVIDED FOR VERIFICATION."

TITLE CERTIFICATION RULE:
Title certified ONLY when ALL satisfied:
✓ Ownership established from registered document
✓ Title continuity — every transfer documented
✓ Encumbrances verified — all mortgages discharged or accounted for
✓ Revenue records reconciled with EC and registered documents
✓ Mortgageability assessed
Otherwise = "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

PROMPT 3 — TITLE CHAIN VERIFICATION:
Establish complete title flow. For each transfer verify: Previous Owner → Transfer Instrument → Current Owner.
Recognize all deed types including: Sale Deed, Gift Deed, Exchange Deed, Settlement Deed, Release Deed,
Relinquishment Deed, Partition Deed, Trust Deed, Court Decree, Will, Succession, Mortgage, Release of Mortgage,
Development Agreement, Agreement to Sell, Banakhat, Rectification Deed, Cancellation Deed.
If any ownership link unsupported: FLAG — TITLE BREAK — Severity: CRITICAL

PROMPT 5 — MORTGAGEABILITY:
Risk: HIGH | MODERATE | LOW
Mortgageability: Mortgageable | Conditionally Mortgageable | Not Mortgageable
SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
Lending Suitability: Suitable | Conditionally Suitable | Not Suitable
Security Coverage: Adequate | Marginal | Inadequate

EC VERIFICATION — RE-CONFIRM FROM LAYER 1:
1. Read all EC_ENTRY_[N] from Layer 1 output
2. For each IS_MORTGAGE=YES entry — verify MORTGAGE_STATUS (DISCHARGED or ACTIVE)
3. DISCHARGED = confirmed release exists → DO NOT flag as active
4. ACTIVE = no release found → flag as active encumbrance
5. NEVER override DISCHARGED to ACTIVE without clear justification
6. Respect Step 5 UNIDENTIFIED entries — do not guess them

EC Col 7 = NEVER MENTION | EC Applicant = IGNORE | Loan Amount = NEVER
NEVER "and others" | Subject property ONLY | Banakhat Kabja Vagar = AoS Without Possession`

function getLayer23(caseType: string): string {
  const cases: Record<string, string> = {

    builder_purchase: `
═══ BUILDER PURCHASE ═══
---META---
APPLICANT: [From Draft Sale Deed/Banakhat/Allotment — Buyer section — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Builder/Developer — from title documents]
EC_APP_NUMBER: [from E-Application Receipt]
EC_DATE: [Date of Print from receipt]
EC_FROM: [search period start]
EC_TO: [search period end]
EC_ROW_COUNT: [actual rows found — not header count]
MORTGAGE_SUMMARY: [NONE / DISCHARGED vide Deed No.X dated D / ACTIVE — Bank:X Deed No:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A]
---END META---
LEGAL OPINION (Part VIII — exact wording):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    resale: `
═══ RESALE ═══
---META---
APPLICANT: [Second Party/Vechan Lenar — Draft Deed/Banakhat — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [First Party/Vechan Aapnar — ALL names — from Draft Deed/Banakhat]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end]
EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE / DISCHARGED vide Deed No.X dated D / ACTIVE — Bank:X Deed No:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A or bank if found]
---END META---
LEGAL OPINION (Part VIII — exact wording):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,

    bt: `
═══ BALANCE TRANSFER ═══
---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end]
EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE — Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Bank name from EC mortgage entry]
---END META---
LEGAL OPINION (Part VIII — exact wording):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    seller_bt: `
═══ SELLER BT ═══
---META---
APPLICANT: [Proposed purchaser — Draft Deed/Banakhat — Buyer side]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Seller — First Party — ALL names individually]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end]
EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE — Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Bank name from EC]
---END META---
LEGAL OPINION (Part VIII — exact wording):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,

    lap: `
═══ LAP / MORTGAGE ═══
---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt]
EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end]
EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE — no mortgage found / UNDISCLOSED ACTIVE — Bank:X if found]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Not Mortgageable if undisclosed found]
SARFAESI: [Enforceable / Not Enforceable if encumbered]
LENDING_SUITABILITY: [Suitable / Not Suitable if encumbered]
EXISTING_BANK: [N/A]
---END META---
LEGAL OPINION (Part VIII — exact wording):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
  }
  return LAYER23_BASE + (cases[caseType] || cases['lap'])
}

function parseMeta(text: string) {
  const b = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const g = (k: string) => b.match(new RegExp(`^${k}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'), mortgagor: g('MORTGAGOR'),
    propertyPara: g('PROPERTY_PARA'), propertyBoundaries: g('PROPERTY_BOUNDARIES'),
    currentOwner: g('CURRENT_OWNER'),
    ecAppNumber: g('EC_APP_NUMBER'), ecDate: g('EC_DATE'),
    ecFrom: g('EC_FROM'), ecTo: g('EC_TO'), ecRowCount: g('EC_ROW_COUNT'),
    mortgageSummary: g('MORTGAGE_SUMMARY'),
    riskLevel: g('RISK_LEVEL'), mortgageability: g('MORTGAGEABILITY'),
    sarfaesi: g('SARFAESI'), lendingSuitability: g('LENDING_SUITABILITY'),
    existingBank: g('EXISTING_BANK'),
  }
}


// ================================================================
// LAYER 4 — PROMPT 6 — 11-PART REPORT
// L4A: Part I+II+III | L4B: Part IV+V | L4C: Part VI+VII+VIII | L4D: Part IX+X+XI
// ================================================================

const L4A = `You are Layer 4 — Report Generator. Generate PART I, PART II, PART III.
OUTPUT PURE HTML ONLY. NO markdown. NO ## NO ** NO ---.

════════════════════
PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP
════════════════════
<hr><div class="ph">PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>

<div class="sph">A. Borrower Details</div>
<table class="mt">
  <tr><td>Name of Borrower/s</td><td>:</td><td>[Full name/s — every person individually — NEVER "and others"]</td></tr>
  <tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Full names or "Not Applicable"]</td></tr>
  <tr><td>Address</td><td>:</td><td>[Address as per documents]</td></tr>
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership Firm / Private Ltd / HUF / Trust / Society]</td></tr>
</table>

<div class="sph">B. Mortgagor Details</div>
<table class="mt">
  <tr><td>Name of Mortgagor/s</td><td>:</td><td>[Full names — if same as borrower: "Same as Borrower/s above"]</td></tr>
  <tr><td>Address</td><td>:</td><td>[if same: "Same as above"]</td></tr>
  <tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / etc.]</td></tr>
</table>

<div class="sph">C. Current Ownership</div>
<table class="mt">
  <tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest deed — NEVER "and others"]</td></tr>
  <tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift Deed / etc.]</td></tr>
  <tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO]</td></tr>
</table>

════════════════════
PART II — PROPERTY DESCRIPTION
════════════════════
<hr><div class="ph">PART II — PROPERTY DESCRIPTION</div>
<div class="prop-para">[FULL PARAGRAPH: "Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt">
  <tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
  <tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
  <tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
  <tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

════════════════════
PART III — LIST OF SCRUTINIZED DOCUMENTS
════════════════════
CRITICAL RULE from Prompt 6: Include ALL submitted documents. DO NOT write "ILLEGIBLE", "BLANK", "NOT PROVIDED FOR VERIFICATION" in Part III. Those remarks go ONLY in Part VI Alerts. Never list Mutation Entries here. Never mention Stamp Paper No. Latest FIRST — Oldest LAST.

<hr><div class="ph">PART III — LIST OF SCRUTINIZED DOCUMENTS</div>

FORMAT:
<div class="di">
  <p><span class="dn">N. [Document Type] — Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>
  [Executant name/s individually] unto and in favour of [Claimant name/s individually]. [SRO.] [2-3 sentences — no illegibility remarks.]</p>
</div>

EC FORMAT:
<div class="di">
  <p><span class="dn">N. Encumbrance Certificate (EC) — E-App. No.: [EC_APP_NUMBER] | Date: [EC_DATE] | Search Period: [EC_FROM] to [EC_TO]</span><br>
  EC bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] covering search period from [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. On physical row-by-row examination, [EC_ROW_COUNT] registered transaction/s found for subject property. [Brief summary of entries.]</p>
</div>

NEVER: "and others" | EC Col 7 | EC Applicant | Stamp Paper No.
START: <hr><div class="ph">PART I
END after Part III last entry.`

const L4B = `You are Layer 4 — Report Generator. Generate PART IV and PART V.
OUTPUT PURE HTML ONLY. NO markdown. NO ## NO ** NO ---.

════════════════════
PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY (Prompt 3)
════════════════════
Start from EARLIEST available record — original agricultural landowner. DO NOT start from builder or recent deed.
OLDEST FIRST — NEWEST LAST.
First paragraph: NO "Thereafter". Every subsequent: MUST start "Thereafter,".
NEVER "and others". All Gujarati terms → English. EC-confirmed deeds: include naturally.

<hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>

FIRST PARA (no "Thereafter"):
<p>As per the revenue records produced, the subject land bearing [Survey/Block No.], Village [Name], Taluka [Name], District [Name] was originally held by [Original Owner/s full name/s] as [tenure type] as evidenced by [earliest Ferfar entry / Village Form 7/12 / available records]. Entry recorded vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

SUBSEQUENT PARAS (each starts "Thereafter,"):
<p>Thereafter, [Seller/s full name/s] transferred the subject property to [Buyer/s full name/s] vide Registered [Deed Type] bearing Registration No. [X] dated [DD/MM/YYYY] registered at Sub-Registrar Office, [SRO]. Consideration Rs. [Amount]. Entry recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

MORTGAGE PARA:
<p>Thereafter, [Mortgagor/s full name/s] created a mortgage over the subject property in favour of [Bank full name] vide Registered Mortgage Deed bearing Registration No. [X] dated [DD/MM/YYYY] at SRO [Name]. [DISCHARGED: The said mortgage stands discharged and charge has been released and satisfied vide [Mortgage Release Deed / Reconveyance Deed] No. [X] dated [DD/MM/YYYY] executed by [Bank] unto [Owner] — no subsisting charge remains. / ACTIVE: The said mortgage is subsisting and active — no Release Deed or discharge document found.]</p>

FINAL PARA:
<p>Thereafter, [Current Owner/s full name/s] holds the right, title and interest in the subject property as the present registered owner/s as confirmed by the Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] covering search period from [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [Encumbrance status.]</p>

════════════════════
PART V — APPROVALS AND REGULATORY COMPLIANCE (Prompt 6)
════════════════════
<hr><div class="ph">PART V — APPROVALS AND REGULATORY COMPLIANCE</div>

<div class="sph">Revenue Record Analysis</div>
<table class="mt">
  <tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
  <tr><td>District</td><td>:</td><td>[Name]</td></tr>
  <tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
  <tr><td>Total Area (H.Are.SqMt.)</td><td>:</td><td>[Area]</td></tr>
  <tr><td>Land Use (Jaminno Upyog)</td><td>:</td><td>[Bin Kheti / Non-Agricultural = Bank can lend | Kheti / Agricultural = FLAG — bank cannot lend]</td></tr>
  <tr><td>Ownership Column</td><td>:</td><td>[Names — flag if current owner not reflected]</td></tr>
  <tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL / Details — cross-check with EC]</td></tr>
  <tr><td>Ganot / Tenant</td><td>:</td><td>[NIL / Name — flag if any tenant recorded]</td></tr>
</table>

<div class="sph">Mutation Entries (Earlier to Present — Subject Property Only)</div>
<table class="mut-tbl">
  <tr><th>Sr.</th><th>Entry No.</th><th>Entry Date</th><th>Status</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>
  [One row per mutation — skip entries for other properties]
</table>
<p>[Cross-check: EC vs Mutation vs Documents. Any discrepancy?]</p>

<div class="sph">Regulatory Approvals</div>
<table class="mt">
  <tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Commencement Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>RERA Registration</td><td>:</td><td>[RERA No., developer, date — OR "NOT PROVIDED FOR VERIFICATION." — Post May 2017: MANDATORY]</td></tr>
  <tr><td>Fire NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Airport Authority NOC</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
  <tr><td>Completion Certificate</td><td>:</td><td>[Details — OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
</table>

<div class="sph">Encumbrance Analysis — All EC Entries</div>
<p>Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] for search period [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. On physical row-by-row examination of the EC table, [EC_ROW_COUNT] registered transaction/s found:</p>
<table class="ec-tbl">
  <tr><th>Sr.</th><th>Classified Type (English)</th><th>Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 — Executing Party (Aapnar)</th><th>Col 4 — Claimant Party (Lenar)</th><th>Status</th></tr>
  [One row per ACTUAL EC entry — NEVER Col 7 — Show confidence tag from Step 6 — Show DISCHARGED/ACTIVE/UNIDENTIFIED]
  [Use class="ec-released" for DISCHARGED | class="ec-active" for ACTIVE | class="ec-unident" for UNIDENTIFIED]
</table>
<p>[EC summary: total entries, any discrepancy with mutation/documents, any entry within last 60 days, overall encumbrance status]</p>

START: <hr><div class="ph">PART IV
END after Part V EC summary paragraph.`

const L4C = `You are Layer 4 — Report Generator. Generate PART VI, PART VII, PART VIII.
OUTPUT PURE HTML ONLY. NO markdown. NO ## NO ** NO ---.

════════════════════
PART VI — ALERTS (Prompt 6)
════════════════════
<hr><div class="ph">PART VI — ALERTS</div>
<p>The following alerts were identified during 4-Layer AI title verification. HIGH SEVERITY alerts are conditions precedent to sanction/disbursement. Bank must not proceed until HIGH SEVERITY alerts are resolved.</p>

[Put illegibility/OCR remarks HERE if any — not in Part III]

HIGH SEVERITY (Title Break | Active Mortgage | Lis Pendens | Missing Mandatory Doc | False Declaration):
<div class="ib">
  <div><span class="sh">HIGH SEVERITY</span></div>
  <div class="it">N. [Alert Title — specific]</div>
  <p>[Finding: exact deed nos, dates, parties. Why legally material. Bank risk. 3-4 sentences.]</p>
  <p><span class="sg">Direction:</span> [Specific action — document name — from whom — by when.]</p>
</div>

MEDIUM SEVERITY (Missing Approval | Mutation Pending | Short EC | Co-owner issues):
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

UNIDENTIFIED EC ENTRIES: If any EC entry was flagged UNIDENTIFIED in Layer 1:
<div class="ib">
  <div><span class="sm">MEDIUM SEVERITY</span></div>
  <div class="it">N. Unidentified EC Entry — Manual Review Required</div>
  <p>EC entry [N] contains document type text that could not be classified: RAW TEXT: [text]. This entry requires advocate manual review for correct classification. Step 5 Failure Protocol triggered per Master System Prompt.</p>
  <p><span class="sg">Direction:</span> Panel advocate to physically inspect EC and classify this entry manually before report is relied upon.</p>
</div>

NEVER FLAG: EC-confirmed deeds (copy not submitted) | EC Applicant name | Stamp Paper.
NEVER flag DISCHARGED mortgage as active.
If NO alerts: <p>No material adverse findings identified from examination of documents produced. Title appears clear from documents produced.</p>

════════════════════
PART VII — DOCUMENT DEFICIENCY REPORT (Prompt 6)
════════════════════
<hr><div class="ph">PART VII — DOCUMENT DEFICIENCY REPORT</div>

<div class="sph">A. Documents Submitted and Available</div>
<ol>[List all readable submitted documents]</ol>

<div class="sph">B. Critical Missing Documents (Required Before Sanction)</div>
<ol>[List each missing mandatory document — Purpose — Risk if absent — OR "NIL"]</ol>

<div class="sph">C. Important Missing Documents</div>
<ol>[Other missing docs — OR "NIL"]</ol>

<div class="sph">D. Submitted Documents — Illegible / Incomplete</div>
<ol>[Documents submitted but unreadable — OR "NIL"]</ol>

<div class="sph">E. Risk & Mortgageability Assessment (Prompt 5)</div>
<table class="mt">
  <tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
  <tr><td>Mortgageability</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
  <tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
  <tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
  <tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
  <tr><td>Assessment Basis</td><td>:</td><td>[2-3 sentence reasoning]</td></tr>
</table>

════════════════════
PART VIII — LEGAL OPINION (Prompt 6)
════════════════════
<hr><div class="ph">PART VIII — LEGAL OPINION</div>

[Use EXACT case-specific wording from Layer 2+3 analysis. Fill actual names.]

<p>[Exact legal opinion paragraph — actual builder/owner name and purchaser/mortgagor name]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank[subject to charge of {existing bank} if BT/Seller BT].</p>

VERDICT BOX (select based on Part VI alerts):
NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[N] HIGH SEVERITY alert/s. Key issues: [brief list]. Proceed only after ALL HIGH SEVERITY alerts resolved.</p></div>
CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is mortgageable subject to: [specific conditions — one per line].</p></div>
CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. [Brief reason.]</p></div>

START: <hr><div class="ph">PART VI
END after Part VIII verdict box closing div.`

const L4D = `You are Layer 4 — Report Generator. Generate PART IX, PART X, PART XI.
OUTPUT PURE HTML ONLY. NO markdown. NO ## NO ** NO ---.

════════════════════
PART IX — DOCUMENTS REQUIRED — PRE-DISBURSEMENT (Prompt 6)
════════════════════
<hr><div class="ph">PART IX — DOCUMENTS REQUIRED TO BE TAKEN INTO BANK CUSTODY AT PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody and verified BEFORE disbursement of the loan:</p>
<ol>
  [Case-specific list — specific document names — from whom — purpose]
  Builder Purchase: Original NOC from Builder for Mortgage | NOC from Project Finance Bank (if project loan) | Draft Sale Deed / Registered Banakhat
  Resale: Draft Sale Deed / Registered Banakhat | All identified missing documents
  Balance Transfer: List of Documents (LOD) from existing Bank | Foreclosure Letter with validity | Outstanding Principal Certificate | NOC from existing Bank | CERSAI Search | Updated EC
  Seller BT: Draft Sale Deed / Banakhat | Foreclosure Letter | LOD | NOC from existing Bank | CERSAI Search | Updated EC
  LAP: Original Registered Sale Deed | Updated EC confirming no encumbrance | CERSAI Search confirming no prior charge
</ol>

════════════════════
PART X — DOCUMENTS REQUIRED — POST-DISBURSEMENT (Prompt 6)
════════════════════
<hr><div class="ph">PART X — DOCUMENTS REQUIRED TO BE TAKEN INTO BANK CUSTODY AT POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody within stipulated timeframe AFTER disbursement:</p>
<ol>
  Builder Purchase: Final Registered Sale Deed (Builder → Purchaser) — within [X] days of disbursement
  Resale: Final Registered Sale Deed (Owner → Purchaser) — within [X] days
  Balance Transfer: No-Due Certificate from existing Bank | Registered Release Deed from existing Bank | Original Title Documents from existing Bank | Updated EC post-release
  Seller BT: Registered Sale Deed (Owner → Purchaser) | Release Deed from existing Bank | No-Due Certificate | Original Title Documents | Updated EC
  LAP: Registered Mortgage / MODT executed by Owner in favour of Bank | CERSAI Registration Confirmation | Updated EC post-mortgage
</ol>

════════════════════
PART XI — FINAL RECOMMENDATION (Prompt 6)
════════════════════
<hr><div class="ph">PART XI — FINAL RECOMMENDATION</div>
<div class="final-rec">
  <div class="fr-title">Final Title Status — Select ONE (from Prompt 6 of Master System Prompt):</div>
  <div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div>
</div>
<p style="margin-top:16px;">[Summary: 3-4 sentences — overall title status, conditions if any, whether bank can proceed, key caveats.]</p>

START: <hr><div class="ph">PART IX
END after Part XI summary paragraph.`


// ================================================================
// HTML WRAPPER — 11 PARTS
// ================================================================
function buildReport(p: {
  refNo: string; appId: string; today: string; bankName: string; loanType: string
  p123: string; p45: string; p678: string; p9_11: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Legal Scrutiny Report — ${p.refNo}</title>
<style>${REPORT_CSS}</style></head>
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
${p.p9_11}
<hr>
<div class="sigrow">
  <div class="sigbox"><div class="sigline"></div>
    <div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div>
    <div style="font-size:10px;color:#666;">Advocates &amp; Legal Scrutiny Consultants</div>
    <div style="font-size:10px;color:#666;">Date: ${p.today}</div>
  </div>
  <div class="sigbox"><div class="sigline"></div>
    <div style="font-size:11px;font-weight:bold;">Authorised Signatory</div>
    <div style="font-size:10px;color:#666;">${p.bankName}</div>
    <div style="font-size:10px;color:#666;">APP ID: ${p.appId}</div>
  </div>
</div>
<div class="ftr">Generated by TITLEMATRIXAI &nbsp;|&nbsp; support@titlematrixai.com &nbsp;|&nbsp; www.titlematrixai.com
  <div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ${p.bankName} in connection with Application ID ${p.appId}. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title. This report is confidential and may not be reproduced or relied upon by any party other than the addressee bank without express written consent of TITLEMATRIXAI.</div>
  <div class="wm">TITLEMATRIXAI — Confidential — For Bank Use Only</div>
</div>
</body></html>`
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

    // ── LAYER 1: HAIKU ─────────────────────────────────────────
    const l1Content: any[] = []
    if (images?.length > 0) {
      for (const img of images) {
        l1Content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
      }
    }

    let docText = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth) {
      docText += `\n\n=== BOUNDARIES FROM CASE DETAILS SHEET ===\nEast: ${boundaryEast || 'As per documents'}\nWest: ${boundaryWest || 'As per documents'}\nNorth: ${boundaryNorth || 'As per documents'}\nSouth: ${boundarySouth || 'As per documents'}\n=== END ===\n`
    }

    l1Content.push({
      type: 'text',
      text: `LAYER 1 — DOCUMENT EXTRACTION ENGINE
Implements: Prompt 2 + Prompt 4 + Steps 1-7 (EC Classification)

CASE DETAILS (PRE-VERIFIED ANCHORS):
Applicant: ${applicantName || 'As per documents'}
Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'}
Case Type: ${caseType} | Loan Type: ${loanType || 'LAP'} | Bank: ${bankName} | APP ID: ${appId}
Property: ${propertyAddress || 'As per documents'}
Boundaries: E=${boundaryEast || '?'} | W=${boundaryWest || '?'} | N=${boundaryNorth || '?'} | S=${boundarySouth || '?'}

SUBMITTED DOCUMENTS TEXT:
${docText}

MANDATORY INSTRUCTIONS:
1. NEVER "and others" — all names individually
2. EC: Extract E-Application No., Date of Print, Search Period — ALL MANDATORY
3. ⚠️ COUNT ACTUAL EC TABLE ROWS — DO NOT USE HEADER COUNT ("X transactions" header is unreliable)
4. For EACH EC row: apply Steps 1-7 → capture RAW_DOC_TYPE_TEXT → normalize → match → confidence tag
5. Apply STEP 4 DISAMBIGUATION: Is this Mortgage or Release? Check prior entries. Release = Col3(Aapnar) is Bank.
6. Apply STEP 5 NO-GUESS RULE: If type unclear = "DOCUMENT TYPE NOT IDENTIFIABLE — RAW TEXT: [X]"
7. Output each EC entry as EC_ENTRY_[N] with all Step 7 fields
8. PAIR each mortgage with release — output MORTGAGE_STATUS: DISCHARGED or ACTIVE
9. EC Col 7 (Last) = NEVER READ OR MENTION
10. EC Applicant = COMPLETELY IGNORE`
    })

    const l1Msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: LAYER1_SYSTEM,
      messages: [{ role: 'user', content: l1Content }]
    })
    const extractedFacts = l1Msg.content[0].type === 'text' ? l1Msg.content[0].text : ''

    // ── LAYER 2+3: SONNET ──────────────────────────────────────
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

LAYER 1 EXTRACTED FACTS (including EC_ENTRY_[N] with Steps 1-7 output):
${extractedFacts}

FILL META BLOCK:
1. EC_APP_NUMBER = from E-Application Receipt
2. EC_DATE = Date of Print from receipt
3. EC_FROM, EC_TO = search period dates
4. EC_ROW_COUNT = actual rows counted by Layer 1 (not header)
5. MORTGAGE_SUMMARY = from Layer 1 pairing results
6. All names individually — NEVER "and others"

EC VERIFICATION:
- Re-read all EC_ENTRY_[N] from Layer 1
- For IS_MORTGAGE=YES: verify MORTGAGE_STATUS from pairing result
- DISCHARGED = do NOT flag as active encumbrance
- ACTIVE = flag in alerts
- UNIDENTIFIED entries = flag for manual review (Medium Severity)
- EC Col 7 = NEVER | EC Applicant = IGNORE`
      }]
    })
    const analysis = l23Msg.content[0].type === 'text' ? l23Msg.content[0].text : ''
    const meta = parseMeta(analysis)

    // ── LAYER 4: 4 PARALLEL ────────────────────────────────────
    const [r4a, r4b, r4c, r4d] = await Promise.all([

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4A,
        messages: [{
          role: 'user',
          content: `Generate PART I + PART II + PART III.
APPLICANT: ${meta.applicant || applicantName}
CO-APPLICANT: ${meta.coApplicant || coApplicant || 'Not Applicable'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY PARA: ${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || '?'} W:${boundaryWest || '?'} N:${boundaryNorth || '?'} S:${boundarySouth || '?'}
EC_APP_NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC_DATE: ${meta.ecDate || 'As per documents'}
EC_FROM: ${meta.ecFrom || 'As per documents'} | EC_TO: ${meta.ecTo || 'As per documents'}
EC_ROW_COUNT: ${meta.ecRowCount || 'As per documents'}
BANK: ${bankName}
ANALYSIS: ${analysis}
RULE — PART III: NO illegibility remarks here. Those go in Part VI only.`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4B,
        messages: [{
          role: 'user',
          content: `Generate PART IV (Title Chain) + PART V (Revenue Records + Approvals + EC Table).
CASE: ${caseType} | PROPERTY: ${meta.propertyPara || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
EC_APP_NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC_DATE: ${meta.ecDate || 'As per documents'}
EC_FROM: ${meta.ecFrom || 'As per documents'} | EC_TO: ${meta.ecTo || 'As per documents'}
EC_ROW_COUNT: ${meta.ecRowCount || 'As per documents'}
MORTGAGE_SUMMARY: ${meta.mortgageSummary || 'As per analysis'}
ANALYSIS: ${analysis}
RULES:
- Part IV: Oldest first. First para NO "Thereafter". Each subsequent MUST start "Thereafter,". Final para includes EC App No + search period.
- Part V EC table: show EVERY actual row. Show CLASSIFIED_TYPE (English) and MATCH_CONFIDENCE from Layer 1. NEVER Col 7. NEVER EC Applicant. Released = ec-released class. Active = ec-active class. Unidentified = ec-unident class.`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, system: L4C,
        messages: [{
          role: 'user',
          content: `Generate PART VI (Alerts) + PART VII (Deficiency + Risk) + PART VIII (Legal Opinion + Verdict).
BANK: ${bankName} | MORTGAGE_SUMMARY: ${meta.mortgageSummary}
RISK: ${meta.riskLevel} | MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi} | LENDING: ${meta.lendingSuitability}
ANALYSIS: ${analysis}
RULES:
- Part VI: Illegibility remarks HERE. NEVER flag EC-confirmed deeds (no copy = include in chain, not alert). NEVER flag EC Applicant. NEVER flag DISCHARGED mortgage as active. Flag UNIDENTIFIED EC entries as Medium Severity.
- Part VII: All 5 sections (A-E) including risk/mortgageability assessment.
- Part VIII: EXACT legal opinion wording with actual names. Verdict matches Part VI alerts.`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, system: L4D,
        messages: [{
          role: 'user',
          content: `Generate PART IX (Pre-Disbursement) + PART X (Post-Disbursement) + PART XI (Final Recommendation).
CASE: ${caseType}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PURCHASER/MORTGAGOR: ${meta.applicant || applicantName}
BANK: ${bankName} | EXISTING BANK: ${meta.existingBank || 'N/A'}
MORTGAGE: ${meta.mortgageSummary}
ANALYSIS: ${analysis}
RULE — Part XI: Select ONE from Prompt 6: CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS`
        }]
      })
    ])

    const p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error: Parts I-III</p>'
    const p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error: Parts IV-V</p>'
    const p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error: Parts VI-VIII</p>'
    const p9_11 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error: Parts IX-XI</p>'

    const reportHtml = buildReport({
      refNo, appId: appId || 'AUTO-000000', today,
      bankName: bankName || 'Bank', loanType: loanType || 'Loan Against Property',
      p123, p45, p678, p9_11,
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
    return NextResponse.json({ success: false, error: error.message || 'Pipeline failed' }, { status: 500 })
  }
}