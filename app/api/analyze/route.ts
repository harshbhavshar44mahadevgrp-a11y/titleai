// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts
// SOURCE: 5__Claude_Changed_Version.docx + Document 4 (Steps 1-7)
// 11-Part Report | 4-Layer | 7-Step EC Engine
// RELEASE DEED DETECTION: PRIMARY = Col3/Col4 Pattern (bulletproof)
// SECONDARY = Text match (backup only)
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
.sh { display:inline-block; background:#b91c1c; color:#fff; font-size:10px; font-weight:bold; padding:2px 10px; margin-bottom:6px; border-radius:2px; }
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
.ec-dis { color:#15803d; font-weight:bold; }
.ec-act { color:#b91c1c; font-weight:bold; }
.ec-unk { color:#b45309; font-style:italic; }
table.mut-tbl { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; }
table.mut-tbl th { background:#374151; color:#fff; padding:5px 8px; text-align:left; font-size:11px; }
table.mut-tbl td { border:1px solid #e5e7eb; padding:5px 8px; vertical-align:top; }
table.mut-tbl tr:nth-child(even) { background:#f9fafb; }
.vnc { margin-top:20px; padding:14px 18px; border:2px solid #b91c1c; background:#fff5f5; border-radius:2px; }
.vc  { margin-top:20px; padding:14px 18px; border:2px solid #15803d; background:#f0fdf4; border-radius:2px; }
.vs  { margin-top:20px; padding:14px 18px; border:2px solid #b45309; background:#fffbeb; border-radius:2px; }
.vt  { font-size:13px; font-weight:bold; text-transform:uppercase; margin-bottom:6px; }
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
// LAYER 1 — SONNET — DOCUMENT EXTRACTION + 7-STEP EC ENGINE
// CRITICAL FIX: Release detection uses Col3/Col4 PATTERN first,
// text matching second — works even with garbled Gujarati text
// ================================================================
const LAYER1_SYSTEM = `You are the Document Extraction Engine for a Property Title Verification System.

NON-NEGOTIABLE:
• Never assume facts | Never create facts | Never infer without documents
• Never suppress adverse findings | Unavailable = "NOT PROVIDED FOR VERIFICATION."

════════════════════════════════════════════════
⚡⚡⚡ CRITICAL: HOW ગીરો (GIRO) WORKS IN EC ⚡⚡⚡
MUST READ BEFORE PROCESSING ANY EC ENTRY
════════════════════════════════════════════════

"ગીરો" alone OR "ગીરો ખત" OR "ગ.ખ." = MORTGAGE DEED
→ In mortgage: Col 3 (Aapnar) = OWNER, Col 4 (Lenar) = BANK

"ગીરો" + "મૂ" OR "ગીરો" + "મ" modifier = RELEASE OF MORTGAGE (NOT a mortgage!)
→ "ગીરો મૂ..." = "Mortgage RELEASED" — the mortgage is OVER
→ "ગીરો મૂકેલી" = RELEASED mortgage = RECONVEYANCE DEED
→ "ગીરો મૂ.." anything = Release, Release, Release — NEVER a Mortgage
→ In release: Col 3 (Aapnar) = BANK (releasing), Col 4 (Lenar) = OWNER (receiving back)

RULE R1 — TEXT DETECTION (check Col 1 for ANY of these):
If Col 1 contains: "ગીરો મૂ" OR "ગ.મ." OR "Giro Mukeli" OR "Giro Mukti" OR "Mukeli" OR "Mukti"
OR "Release" OR "Reconveyance" OR "Discharge" OR "Satisfaction" OR "Released" OR "મૂ"
→ CLASSIFY = "Reconveyance / Mortgage Release Deed" → MORTGAGE = DISCHARGED

RULE R2 — COLUMN PATTERN (check Col 3 for any Bank/Finance name):
If Col 3 (Executing Party / Aapnar) contains ANY of these → RELEASE DEED:
"BANK" | "FINANCE" | "HOUSING FINANCE" | "FINANCIAL" | "NBFC" | "LIMITED" (if financial)
"BAJAJ" | "HDFC" | "SBI" | "AXIS" | "ICICI" | "KOTAK" | "YES BANK" | "PNB" | "BOI"
"INDIABULLS" | "LIC" | "LICHFL" | "REPCO" | "PIRAMAL" | "MUTHOOT"
ANY institution name that looks like a bank or finance company
→ CLASSIFY = "Reconveyance / Mortgage Release Deed" → MORTGAGE = DISCHARGED
→ Reason: Banks are EXECUTING a release — they give up charge, owner gets property back

RULE R3 — REVERSE PATTERN (check Col 4 for any Bank/Finance name):
If Col 4 (Claimant / Lenar) contains any Bank/Finance name → MORTGAGE DEED
→ CLASSIFY = "Mortgage Deed" → Bank is RECEIVING the mortgage

RULE R4 — COMBINATION CHECK (FINAL):
If Col 1 TEXT = Release-type AND Col 3 = Bank → 100% CONFIRMED Release Deed
If Col 1 TEXT = unclear/garbled BUT Col 3 = Bank → Still a Release Deed (trust pattern over text)
If Col 1 TEXT = "ગીરો" alone AND Col 4 = Bank → Mortgage Deed

⚠️ BAJAJ HOUSING FINANCE LIMITED = a financial institution = BANK for this purpose
⚠️ Any "HOUSING FINANCE" company = bank for release detection purposes
⚠️ When BAJAJ HFL (or any bank) is in Col 3 → they are RELEASING the mortgage → RELEASE DEED

════════════════════════════════════════════════
DOCUMENT EXTRACTION (Prompt 2)
════════════════════════════════════════════════
For every submitted document extract:
• Document Type | Registration Number | Registration Date (NOT stamp paper)
• Executant — EVERY name individually — NEVER "and others"
• Claimant — EVERY name individually
• Property Description | Survey/Block No. | Village | Taluka | District | Area | Boundaries

PROPERTY DESCRIPTION FORMAT:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

════════════════════════════════════════════════
MUTATION ENTRIES EXTRACTION (Prompt 4)
════════════════════════════════════════════════
Skip first column "Entry Details" always. Extract:
Entry Number | Entry Date | Nature | Certified/Rejected | Survey Number | Remarks
Last column = IGNORE.

════════════════════════════════════════════════
EC EXTRACTION — COLUMN MAPPING (Prompt 4 — STRICT)
════════════════════════════════════════════════
COL 1 (First):       Type of Deed — APPLY 7-STEP ENGINE BELOW
COL 2 (Second):      Property Description
COL 3 (Third):       Executing Party = "Dastavej Kari Aapnar" = who GIVES/EXECUTES
COL 4 (Fourth):      Claimant Party = "Dastavej Kari Lenar" = who RECEIVES
COL 5 (Fifth):       Date of Registration
COL 6 (Sixth/2nd Last): Registration Number
COL 7 (Seventh/LAST): ⛔ NEVER READ. NEVER EXTRACT. NEVER MENTION. PERMANENT RULE.

FROM E-APPLICATION RECEIPT — EXTRACT ALL 4 (MANDATORY):
(a) EC_APP_NUMBER = "e-Application No." on receipt
(b) EC_DATE = "Date of Print" on receipt
(c) EC_FROM = search period start date
(d) EC_TO = search period end date

⚠️ EC HEADER COUNT IS UNRELIABLE: "X registered transactions" in header = often WRONG.
COUNT ACTUAL TABLE ROWS YOURSELF. Never trust the header number.

EC APPLICANT (person who applied for EC) = ZERO property interest = COMPLETELY IGNORE.

════════════════════════════════════════════════
7-STEP EC DOCUMENT TYPE ENGINE (from Document 5)
════════════════════════════════════════════════

STEP 1 — CAPTURE RAW TEXT:
For each EC row, record the EXACT text in Col 1 as-is (Gujarati/English/mixed).
Store as RAW_DOC_TYPE_TEXT. Do NOT correct or interpret yet.

STEP 2 — NORMALIZE:
• Strip hyphens, punctuation, double spaces, trailing numbers
• Treat spacing variants as same: "વેચાણખત"="વેચાણ ખત"="વેચાણ-ખત"
• Treat transliteration variants as same: "Banakhat"="Bana Khat"="બાનાખત"
• If OCR artifacts visible (broken ligatures, junk chars) → skip to STEP 5

STEP 3 — MATCH (priority order):
1. Exact match → confidence: EXACT MATCH
2. Root-word/synonym match → confidence: SYNONYM MATCH
3. Contextual match (Col3/Col4 pattern) → confidence: CONTEXTUAL MATCH
Never output a type not in the taxonomy table below.

STEP 4 — DISAMBIGUATION CHECKS:
| Pair | Test |
| Sale Deed vs Agreement/Banakhat | Sale = actual title transfer. Agreement = future promise. |
| Mortgage vs Simple/Equitable | Default "Mortgage Deed" unless text explicitly says Simple/Equitable. |
| Release vs Reconveyance vs Mortgage Release | If prior mortgage exists in EC for same property → Reconveyance/Mortgage Release |
| POA vs GPA vs SPA | Use GPA/SPA only if text explicitly says "General"/"Special" |
| Gift vs Relinquishment vs Family Settlement | Check parties and whether co-owners of same property |
| Partition vs Family Settlement | Partition = specific shares of one property only |
Conservative rule: when equally plausible → use broader category, flag for manual review.

STEP 5 — NO-GUESS FAILURE PROTOCOL:
If type cannot be matched with MEDIUM+ confidence after Steps 1-4:
Output EXACTLY: DOCUMENT TYPE NOT IDENTIFIABLE — RAW TEXT: [text] — REQUIRES MANUAL REVIEW
Never guess. Never create facts.

STEP 6 — CONFIDENCE TAG (one of):
• EXACT MATCH | SYNONYM MATCH | CONTEXTUAL MATCH | UNIDENTIFIED

STEP 7 — MANDATORY OUTPUT FIELDS FOR EACH EC ENTRY:
Output each row as:
EC_ROW_[N]:
  RAW_COL1_TEXT: [exact raw Col 1 text]
  CLASSIFIED_TYPE: [English classification OR failure message from Step 5]
  CONFIDENCE: [EXACT MATCH / SYNONYM MATCH / CONTEXTUAL MATCH / UNIDENTIFIED]
  COL3_AAPNAR: [full name/s from Col 3 — who executes/gives]
  COL4_LENAR: [full name/s or Bank from Col 4 — who receives]
  COL5_DATE: [DD/MM/YYYY]
  COL6_DEED_NO: [Registration number]
  SUBJECT_PROPERTY_MATCH: [YES / NO — based on Unit+Block+Floor]
  COL4_IS_BANK: [YES if Col4 contains Bank/NBFC name | NO]
  COL3_IS_BANK: [YES if Col3 contains Bank/NBFC name | NO]

════════════════════════════════════════════════
⚠️ RELEASE DEED DETECTION — READ THIS CAREFULLY ⚠️
════════════════════════════════════════════════

HOW MORTGAGE AND RELEASE APPEAR IN EC:

MORTGAGE ENTRY looks like this:
  Col 3 (Aapnar) = PROPERTY OWNER / BORROWER (person creating mortgage)
  Col 4 (Lenar)  = BANK / LENDER (receiving the mortgage)
  → COL4_IS_BANK = YES → this is a MORTGAGE

RELEASE DEED ENTRY looks like this:
  Col 3 (Aapnar) = BANK / LENDER (bank releasing/discharging the mortgage)
  Col 4 (Lenar)  = PROPERTY OWNER / BORROWER (owner getting property back)
  → COL3_IS_BANK = YES → this is a RELEASE OF MORTGAGE

⚡ PRIMARY DETECTION METHOD (USE THIS FIRST — works even when Col 1 text is garbled):
After extracting ALL rows, look at the Col3/Col4 pattern:

FOR EACH ROW WHERE COL3_IS_BANK = YES:
  → The BANK in Col 3 (Aapnar) is EXECUTING/RELEASING the mortgage
  → The OWNER in Col 4 (Lenar) is RECEIVING title back
  → This is a RELEASE / RECONVEYANCE deed
  → Find the earlier mortgage row where that SAME BANK was in Col 4 (Lenar)
  → That mortgage is NOW DISCHARGED

This detection works REGARDLESS of what Col 1 says.
Even if Col 1 is blank, garbled, or unreadable — the Col 3/Col 4 pattern PROVES it is a release.

⚡ SECONDARY DETECTION (text-based — use as confirmation):
Col 1 text matches any of these = Release:
"ગીરો મૂકેલી મિલકતનું ફેર માલિકી ફેર ખત"
"ગીરો મુક્તિ" / "ગ.મ." / "Giro Mukti" / "Giro Mukeli"
"ગીરો મુક્તિખત" / "Mortgage Release" / "Release of Mortgage"
"Reconveyance" / "Discharge of Mortgage" / "Satisfaction of Mortgage"
"મુક્તિખત" / "Release Deed"

════════════════════════════════════════════════
MORTGAGE-RELEASE PAIRING OUTPUT (after all rows extracted):
════════════════════════════════════════════════

For EACH MORTGAGE ROW found:
MORTGAGE_[N]_ANALYSIS:
  MORTGAGE_ROW: [row number]
  BANK_NAME: [Bank name from COL4_LENAR of mortgage row]
  DEED_NO: [COL6_DEED_NO]
  DATE: [COL5_DATE]
  
  RELEASE_CHECK_METHOD_1 (Col3 Pattern):
  → Scan ALL rows: any row where COL3_IS_BANK=YES AND COL3_AAPNAR contains [BANK_NAME]?
  → If YES: RELEASE_FOUND=YES | RELEASE_ROW=[N] | RELEASE_DEED_NO=[X] | RELEASE_DATE=[D]
  
  RELEASE_CHECK_METHOD_2 (Text Match):
  → Scan ALL rows: any row where CLASSIFIED_TYPE = Release/Reconveyance/Mortgage Release?
  → If YES AND same bank or same property: RELEASE_FOUND=YES
  
  RELEASE_CHECK_METHOD_3 (Submitted Documents):
  → Is Release of Mortgage Deed submitted as document? → RELEASE_FOUND=YES
  → Is Index-II of Release Deed submitted? → RELEASE_FOUND=YES
  → Is NOC/No-Dues Certificate from bank submitted? → RELEASE_FOUND=YES
  
  FINAL_STATUS:
  → IF any Method found YES: MORTGAGE_STATUS=DISCHARGED — charge fully released and satisfied
  → IF all Methods = NO: MORTGAGE_STATUS=ACTIVE — no release found

════════════════════════════════════════════════
TAXONOMY TABLE — USE ONLY THESE TYPES (Prompt 4)
MOST IMPORTANT DISAMBIGUATION:
  "ગીરો" ALONE = Mortgage Deed
  "ગીરો" + "મૂ" TOGETHER = Reconveyance Deed (NOT Mortgage!)
════════════════════════════════════════════════
Mortgage Deed               → ગીરો ખત / ગ.ખ. / ગીરો (ALONE — no "મૂ" after it) / Giro / Boja / Mortgage
  ↑ ONLY when Col 4 (Lenar) = Bank, AND Col 1 text does NOT contain "મૂ"

Reconveyance Deed           → ગીરો મૂ... / ગ.મ. / ગીરો મૂકેલી... / Giro Mukeli / Giro Mukti / Release of Mortgage / Mortgage Release / Reconveyance / Discharge of Mortgage / Satisfaction
  ↑ ANY "ગીરો" + "મૂ" combination = Release. "ગ.મ." = Release. Bank in Col 3 = Release.

Mortgage Release Deed       → ગીરો મુક્તિ / ગ.મ. / Giro Mukti / ગીરો મુક્તિ ખત
Release Deed                → મુક્તિ ખત / Release Deed (generic)

Sale Deed                   → વેચાણ દસ્તાવેજ / વેચાણખત / ફ.ખ. / Maliki Ferkhat / Sale / Conveyance
Absolute Sale Deed          → સંપૂર્ણ વેચાણખત
Gift Deed                   → બક્ષિસ ખત / ભેટ ખત / ભૂષણ
Relinquishment Deed         → હક ત્યાગ ખત
Partition Deed              → ભાગ / ભ.પ. / ભાગલા દસ્તાવેજ
Family Settlement Deed      → કુટુંબ સમાધાન દસ્તાવેજ
Exchange Deed               → અદલાબદલી દસ્તાવેજ
Simple Mortgage Deed        → સાદો ગીરો (only if text explicitly says "Simple"/"Sado")
Equitable Mortgage          → સમન્યાયી ગીરો (only if text says "Equitable")
Lease Deed                  → ભાડા પટ્ટો / ભ.પ.
Leave and License Agreement → ઉપયોગ પરવાનગી કરાર
Rent Agreement              → ભાડા કરાર
Development Agreement       → વિકાસ કરાર / JDA
Joint Development Agreement → સંયુક્ત વિકાસ કરાર
Agreement to Sell           → વેચાણ કરાર / Banakhat (with possession)
Agreement to Sell (No Poss) → બાનાખત કબ્જા વગર ← NEVER = Sale Deed
Power of Attorney           → મુખ્ત્યારનામું / POA (generic)
General Power of Attorney   → સામાન્ય મુખ. / GPA
Special Power of Attorney   → વિશેષ મુખ. / SPA
POA under Section 45-A      → 45-એ / 45-A
Revocation of POA           → મુખ. રદ
Will                        → વસિયત / ઇચ્છા પત્ર
Probate                     → વસિયત પ્રમાણ
Succession Certificate      → વારસાઈ પ્રમાણ
Legal Heir Certificate      → વારસ
Declaration Deed            → ઘોષ / Declaration
Rectification Deed          → સુધારા
Cancellation Deed           → રદ / Cancellation
Lis Pendens                 → Court Attachment / Stay ← CRITICAL ALERT

════════════════════════════════════════════════
PERMANENT RULES — NEVER VIOLATE:
════════════════════════════════════════════════
1. NEVER "and others" — every person individually
2. EC Col 7 (Last column) = NEVER read, extract, or mention
3. EC Applicant name = COMPLETELY IGNORE
4. Loan Amount = NEVER mention
5. Stamp Paper No = NEVER mention
6. Subject property ONLY — Unit+Block+Floor match for every EC entry
7. Dukan = Shop | Banakhat Kabja Vagar = Agreement to Sell WITHOUT Possession (NOT Sale Deed)
8. Current Owner = from latest submitted deed`


// ================================================================
// LAYER 2+3 — SONNET — TITLE + RISK + LEGAL
// ================================================================
const LAYER23_BASE = `You are Layer 2 (Title Verification) and Layer 3 (Risk & Mortgageability).

NON-NEGOTIABLE:
• Never assume | Never create | Never infer without documents
• Never certify if title continuity is incomplete
• Never suppress adverse findings
• Unavailable = "NOT PROVIDED FOR VERIFICATION."

TITLE CERTIFICATION RULE:
Title certified ONLY when ALL satisfied:
✓ Ownership established from registered document
✓ Title continuity — every transfer documented
✓ EC verified — all mortgages discharged or accounted for
✓ Revenue records reconciled
✓ Mortgageability assessed
Otherwise = "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

RISK: HIGH | MODERATE | LOW
MORTGAGEABILITY: Mortgageable | Conditionally Mortgageable | Not Mortgageable
SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
LENDING SUITABILITY: Suitable | Conditionally Suitable | Not Suitable

EC VERIFICATION — RE-CONFIRM FROM LAYER 1:
⚠️ Read ALL EC_ROW_[N] and MORTGAGE_[N]_ANALYSIS from Layer 1.
⚠️ MORTGAGE_STATUS=DISCHARGED = DO NOT flag as alert. Charge is satisfied.
⚠️ MORTGAGE_STATUS=ACTIVE = Flag as active encumbrance in alerts.
⚠️ UNIDENTIFIED EC type = Flag for manual review (Medium Severity).
NEVER override DISCHARGED to ACTIVE without explicit justification.
EC Col 7 = NEVER | EC Applicant = IGNORE | Loan Amount = NEVER`

function getLayer23(caseType: string): string {
  const legalOpinion: Record<string, string> = {
    builder_purchase: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
    resale: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
    bt: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,
    seller_bt: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,
    lap: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
  }

  const metaBlocks: Record<string, string> = {
    builder_purchase: `
---META---
APPLICANT: [From Draft Sale Deed/Banakhat/Allotment — Buyer/Second Party — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph — "Opinion on title and search..."]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Builder/Developer — from title documents]
EC_APP_NUMBER: [from E-Application Receipt]
EC_DATE: [Date of Print]
EC_FROM: [start date] | EC_TO: [end date]
EC_ROW_COUNT: [actual rows counted]
MORTGAGE_SUMMARY: [NONE / DISCHARGED vide Deed No.X dated D / ACTIVE — Bank:X Deed No:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A]
---END META---`,
    resale: `
---META---
APPLICANT: [Second Party/Vechan Lenar — Draft Deed/Banakhat — NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [First Party/Vechan Aapnar — ALL names — from Draft Deed/Banakhat]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE / DISCHARGED vide Deed No.X dated D / ACTIVE — Bank:X Deed No:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A or bank if found and active]
---END META---`,
    bt: `
---META---
APPLICANT: [Current owner/borrower — full names individually]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE — Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Bank name from EC mortgage entry]
---END META---`,
    seller_bt: `
---META---
APPLICANT: [Proposed purchaser — Draft Deed/Banakhat — Buyer side]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Seller — First Party — ALL names individually]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE — Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Bank name from EC]
---END META---`,
    lap: `
---META---
APPLICANT: [Current owner/borrower — full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE — EC clean / UNDISCLOSED ACTIVE if found]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Not Mortgageable if undisclosed]
SARFAESI: [Enforceable / Not Enforceable if encumbered]
LENDING_SUITABILITY: [Suitable / Not Suitable if encumbered]
EXISTING_BANK: [N/A]
---END META---`,
  }

  const key = caseType in metaBlocks ? caseType : 'lap'
  return LAYER23_BASE +
    `\n═══ CASE: ${key.toUpperCase().replace('_', ' ')} ═══` +
    metaBlocks[key] +
    `\nLEGAL OPINION WORDING (Part VIII — use exactly):\n` + (legalOpinion[key] || legalOpinion['lap'])
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
// LAYER 4 — 11-PART REPORT (Prompt 6)
// ================================================================

const L4A = `Layer 4 — Generate PART I, PART II, PART III. PURE HTML ONLY. NO markdown.

PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP
<hr><div class="ph">PART I — BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt">
<tr><td>Name of Borrower/s</td><td>:</td><td>[Every person individually — NEVER "and others"]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Names or "Not Applicable"]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Private Ltd / HUF / Trust / Society]</td></tr>
</table>
<div class="sph">B. Mortgagor Details</div>
<table class="mt">
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[If same as borrower: "Same as Borrower/s above"]</td></tr>
<tr><td>Address</td><td>:</td><td>[If same: "Same as above"]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / etc.]</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest deed — NEVER "and others"]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift / etc.]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO]</td></tr>
</table>

PART II — PROPERTY DESCRIPTION
<hr><div class="ph">PART II — PROPERTY DESCRIPTION</div>
<div class="prop-para">[Full paragraph: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt">
<tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

PART III — LIST OF SCRUTINIZED DOCUMENTS
RULE: Include ALL submitted documents. NO "ILLEGIBLE", "BLANK", "NOT PROVIDED" remarks here. Those go in Part VI ONLY. Never list Mutation Entries. Never Stamp Paper No. Latest FIRST.
<hr><div class="ph">PART III — LIST OF SCRUTINIZED DOCUMENTS</div>
FORMAT:
<div class="di"><p><span class="dn">N. [Document Type] — Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Executant name/s individually] unto and in favour of [Claimant name/s individually]. [SRO.] [2-3 sentence observation — no illegibility remarks.]</p></div>
EC FORMAT:
<div class="di"><p><span class="dn">N. Encumbrance Certificate — E-App. No.: [EC_APP_NUMBER] | Date: [EC_DATE] | Search Period: [EC_FROM] to [EC_TO]</span><br>EC bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] for search period [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [EC_ROW_COUNT] registered transaction/s found on row-by-row examination. [Brief summary.]</p></div>
NEVER: "and others" | EC Col 7 | EC Applicant.
START: <hr><div class="ph">PART I END after Part III.`

const L4B = `Layer 4 — Generate PART IV and PART V. PURE HTML ONLY. NO markdown.

PART IV — CHRONOLOGICAL TITLE CHAIN (Prompt 3)
OLDEST FIRST — NEWEST LAST. First para: NO "Thereafter". Every subsequent: MUST start "Thereafter,". NEVER "and others". All Gujarati → English. EC-confirmed deeds = include naturally (no remark).
<hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
FIRST PARA (NO "Thereafter"):
<p>[Earliest record — original agricultural owner/s — how held — earliest Ferfar/7-12 entry. Mutation Entry No. X dated DD/MM/YYYY.]</p>
SUBSEQUENT PARAS (EACH starts "Thereafter,"):
<p>Thereafter, [Seller/s full name/s] transferred the subject property to [Buyer/s full name/s] vide Registered [Deed Type] bearing Registration No. [X] dated [DD/MM/YYYY] registered at Sub-Registrar Office, [SRO Name]. Consideration Rs. [Amount]. Entry recorded vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>
MORTGAGE PARA — TWO VERSIONS, USE CORRECT ONE:

IF DISCHARGED (Release Deed found — either in EC as "ગીરો મૂ..." entry OR as submitted document):
<p>Thereafter, [Mortgagor/s] created a mortgage over the subject property in favour of [Bank full name] vide Registered Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage subsequently stands discharged and the charge has been fully released and satisfied vide [Reconveyance / Mortgage Release Deed / Reconveyance Deed] No. [Y] dated [DD/MM/YYYY] executed by [Bank] unto and in favour of [Owner] — no subsisting charge of [Bank] remains on the subject property as on date.</p>

IF ACTIVE (No release deed found in EC or documents):
<p>Thereafter, [Mortgagor/s] created a mortgage over the subject property in favour of [Bank full name] vide Registered Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage is subsisting and active as on the date of this report — no Release Deed, Reconveyance Deed or Discharge document has been found in the Encumbrance Certificate or among the documents produced.</p>

⚠️ DO NOT say "No discharge found" for any mortgage that Layer 1 marked as DISCHARGED.
⚠️ A "ગીરો મૂ..." entry in EC = the mortgage IS discharged. Do not say otherwise.
FINAL PARA:
<p>Thereafter, [Current Owner/s] holds the right, title and interest in the subject property as the present registered owner/s as confirmed by the Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] covering search period from [EC_FROM] to [EC_TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [Encumbrance status statement.]</p>

PART V — APPROVALS AND REGULATORY COMPLIANCE
<hr><div class="ph">PART V — APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">Revenue Record</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr>
<tr><td>Survey/Block No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[H.Are.SqMt.]</td></tr>
<tr><td>Land Use</td><td>:</td><td>[Bin Kheti/Non-Agricultural = OK | Kheti/Agricultural = FLAG IMMEDIATELY]</td></tr>
<tr><td>Ownership Column</td><td>:</td><td>[Names — flag if current owner not reflected]</td></tr>
<tr><td>Boja/Encumbrance</td><td>:</td><td>[NIL / Details — cross-check with EC]</td></tr>
<tr><td>Ganot/Tenant</td><td>:</td><td>[NIL / Name — flag if tenant recorded]</td></tr>
</table>
<div class="sph">Mutation Entries (Earlier to Present)</div>
<table class="mut-tbl"><tr><th>Sr.</th><th>Entry No.</th><th>Entry Date</th><th>Status</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>[rows for subject property only]</table>
<p>[Cross-check: EC vs Mutation vs Documents. Discrepancy?]</p>
<div class="sph">Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>RERA Registration</td><td>:</td><td>[RERA No., developer OR "NOT PROVIDED FOR VERIFICATION." — Post May 2017: MANDATORY]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
</table>
<div class="sph">Encumbrance Analysis — All EC Rows</div>
<p>EC bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] for search period [EC_FROM] to [EC_TO]. On row-by-row physical examination: [EC_ROW_COUNT] registered transaction/s found:</p>
<table class="ec-tbl"><tr><th>Sr.</th><th>Classified Type</th><th>Match Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 — Aapnar (Executing)</th><th>Col 4 — Lenar (Claimant)</th><th>Status</th></tr>
[ONE ROW PER ACTUAL EC ROW — NEVER Col 7 — Use: class="ec-dis" for DISCHARGED | class="ec-act" for ACTIVE | class="ec-unk" for UNIDENTIFIED]
</table>
<p>[EC summary and cross-check with mutation/documents. Any entry within 60 days?]</p>
START: <hr><div class="ph">PART IV END after Part V.`

const L4C = `Layer 4 — Generate PART VI, PART VII, PART VIII. PURE HTML ONLY. NO markdown.

PART VI — ALERTS
<hr><div class="ph">PART VI — ALERTS</div>
<p>The following alerts were identified. HIGH SEVERITY = conditions precedent to sanction/disbursement.</p>
[Put illegibility/OCR remarks HERE if any]
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[Finding — exact nos, dates, parties — 3-4 sentences — bank risk.]</p><p><span class="sg">Direction:</span> [Action — from whom — by when.]</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[2-3 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[1-2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
UNIDENTIFIED EC: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. Unidentified EC Entry — Manual Review Required</div><p>EC Row [N]: document type could not be classified from text. RAW: [text]. Step 5 Failure Protocol triggered. Manual advocate review required before report is relied upon.</p><p><span class="sg">Direction:</span> Panel advocate to physically inspect EC and classify this entry manually.</p></div>
RULES: NEVER flag EC-confirmed deeds (copy not submitted). NEVER flag EC Applicant. NEVER flag DISCHARGED mortgage as active encumbrance.
If no alerts: <p>No material adverse findings identified from documents produced. Title appears clear.</p>

PART VII — DOCUMENT DEFICIENCY REPORT
<hr><div class="ph">PART VII — DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted and Available</div><ol>[List all readable docs]</ol>
<div class="sph">B. Critical Missing Documents</div><ol>[Missing mandatory docs — purpose — risk — OR "NIL"]</ol>
<div class="sph">C. Important Missing Documents</div><ol>[Other missing docs — OR "NIL"]</ol>
<div class="sph">D. Submitted Documents — Illegible / Incomplete</div><ol>[Unreadable docs — OR "NIL"]</ol>
<div class="sph">E. Risk & Mortgageability (Prompt 5)</div>
<table class="mt">
<tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
<tr><td>Mortgageability</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentence basis]</td></tr>
</table>

PART VIII — LEGAL OPINION
<hr><div class="ph">PART VIII — LEGAL OPINION</div>
<p>[EXACT legal opinion wording from Layer 2+3 — fill actual names — builder/owner and purchaser/mortgagor]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank[subject to charge of {existing bank} if BT/Seller BT].</p>
VERDICT:
NOT CLEAR: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[N] HIGH alerts. Key: [brief list]. Resolve ALL before proceeding.</p></div>
CLEAR SUBJECT TO: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Mortgageable subject to: [conditions].</p></div>
CLEAR: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Clear, marketable and mortgageable. [Brief reason.]</p></div>
START: <hr><div class="ph">PART VI END after Part VIII verdict.`

const L4D = `Layer 4 — Generate PART IX, PART X, PART XI. PURE HTML ONLY. NO markdown.

PART IX — DOCUMENTS REQUIRED — PRE-DISBURSEMENT (Prompt 6)
<hr><div class="ph">PART IX — DOCUMENTS REQUIRED — PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody BEFORE disbursement:</p>
<ol>[Case-specific list with document name, source, purpose:
Builder Purchase: NOC from Builder for Mortgage | NOC from Project Finance Bank (if loan) | Draft Sale Deed / Registered Banakhat
Resale: Draft Sale Deed / Registered Banakhat | Missing documents identified
Balance Transfer: List of Documents (LOD) from existing Bank | Foreclosure Letter | Outstanding Certificate | NOC from existing Bank | CERSAI Search | Updated EC
Seller BT: Draft Sale Deed / Banakhat | Foreclosure Letter | LOD | NOC | CERSAI Search | Updated EC
LAP: Original Registered Sale Deed | Updated EC | CERSAI Search (no prior charge)]</ol>

PART X — DOCUMENTS REQUIRED — POST-DISBURSEMENT (Prompt 6)
<hr><div class="ph">PART X — DOCUMENTS REQUIRED — POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody AFTER disbursement:</p>
<ol>[Case-specific list:
Builder Purchase: Final Registered Sale Deed (Builder → Purchaser)
Resale: Final Registered Sale Deed (Owner → Purchaser)
Balance Transfer: No-Due Certificate | Registered Release Deed from existing Bank | Original Title Documents | Updated EC
Seller BT: Registered Sale Deed (Owner → Purchaser) | Release Deed from existing Bank | No-Due Certificate | Original Title Documents | Updated EC
LAP: Registered Mortgage / MODT in favour of Bank | CERSAI Confirmation | Updated EC post-mortgage]</ol>

PART XI — FINAL RECOMMENDATION (Prompt 6)
<hr><div class="ph">PART XI — FINAL RECOMMENDATION</div>
<div class="final-rec">
<div class="fr-title">Final Title Status — Select ONE:</div>
<div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div>
</div>
<p style="margin-top:16px;">[Summary: 3-4 sentences — overall title status, conditions if any, whether bank can proceed.]</p>
START: <hr><div class="ph">PART IX END after Part XI.`


function buildReport(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; p123: string; p45: string; p678: string; p9_11: string }): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report — ${p.refNo}</title><style>${REPORT_CSS}</style></head><body>
<div class="hdr"><div class="hdr-left"><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel — Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com &nbsp;|&nbsp; www.titlematrixai.com</div></div>
<div class="hdr-right"><div><strong>Reference No. :</strong> ${p.refNo}</div><div><strong>Application ID :</strong> ${p.appId}</div><div><strong>Report Date :</strong> ${p.today}</div><div><strong>Bank :</strong> ${p.bankName}</div></div></div>
<div class="rtitle">LEGAL SCRUTINY REPORT — ${p.loanType}</div><hr>
${p.p123}${p.p45}${p.p678}${p.p9_11}
<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div>
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName} — APP ID: ${p.appId}</div></div></div>
<div class="ftr">Generated by TITLEMATRIXAI &nbsp;|&nbsp; support@titlematrixai.com<div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ${p.bankName} in connection with Application ID ${p.appId}. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title.</div><div class="wm">TITLEMATRIXAI — Confidential — For Bank Use Only</div></div>
</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentText, images, caseType, appId, bankName, loanType,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId } = body

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`

    // LAYER 1
    const l1Content: any[] = []
    if (images?.length > 0) for (const img of images)
      l1Content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })

    let docText = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth)
      docText += `\n\n=== BOUNDARIES FROM CASE DETAILS ===\nEast: ${boundaryEast || '?'}\nWest: ${boundaryWest || '?'}\nNorth: ${boundaryNorth || '?'}\nSouth: ${boundarySouth || '?'}\n=== END ===\n`

    l1Content.push({
      type: 'text', text: `LAYER 1 — DOCUMENT EXTRACTION + 7-STEP EC ENGINE

CASE DETAILS (PRE-VERIFIED):
Applicant: ${applicantName || 'As per documents'} | Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'} | Case: ${caseType}
Loan Type: ${loanType || 'LAP'} | Bank: ${bankName} | APP ID: ${appId}
Property: ${propertyAddress || 'As per documents'}
Boundaries: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}

DOCUMENTS TEXT:
${docText}

MANDATORY STEPS:
1. Extract ALL documents individually — NEVER "and others"

2. ⚠️ MULTIPLE ECs — PROCESS ALL:
   Find EVERY EC document submitted. Process EC-1, EC-2, EC-3 separately.
   Newer EC (later search year like 2024-2026) has newest entries. Cross-reference ALL.

3. FOR EACH EC — READ EVERY SINGLE ROW:
   Count actual rows. Read Row 1, Row 2, Row 3 until no more rows exist.
   LAST ROW is often the Release Deed — never stop at Row 2.
   EC says "3 rows" → find all 3. Row garbled → state it and use COL3/COL4 pattern.

4. CROSS-EC PAIRING:
   EC-1 (2011-2023) may show MORTGAGE. EC-2 (2024-2026) may show its RELEASE.
   Bank in Col3 of any row in any EC = RELEASE of prior mortgage = DISCHARGED.

5. Apply 7-Step to EACH row in EVERY EC.

6. ⚡ RELEASE (PRIMARY): COL3_IS_BANK=YES → Release Deed → that mortgage = DISCHARGED

7. ⚡ RELEASE (TEXT): "Giro Muk" / "ගíරō" + "मू" / "ガíரō மū" = Release of Mortgage

8. Output EC_ROW_[N] for every row in every EC submitted.

9. Output MORTGAGE_[N]_ANALYSIS with all 3 methods and FINAL_STATUS.

10. EC Col 7 (Last column) = NEVER READ OR MENTION.

11. EC Applicant = COMPLETELY IGNORE` })

    const l1Msg = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
      system: LAYER1_SYSTEM, messages: [{ role: 'user', content: l1Content }]
    })
    const extractedFacts = l1Msg.content[0].type === 'text' ? l1Msg.content[0].text : ''

    // LAYER 2+3
    const l23Msg = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
      system: getLayer23(caseType),
      messages: [{
        role: 'user', content: `LAYER 2+3 — TITLE + RISK + LEGAL

CASE: ${caseType} | BANK: ${bankName} | APP: ${appId}
APPLICANT: ${applicantName} | CO-APPLICANT: ${coApplicant || 'None'}
CURRENT OWNER: ${currentOwner || 'As per documents'} | PROPERTY: ${propertyAddress}
BOUNDARIES: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}

LAYER 1 EXTRACTED FACTS (EC_ROW_[N] + MORTGAGE_[N]_ANALYSIS):
${extractedFacts}

FILL META:
1. EC_APP_NUMBER, EC_DATE, EC_FROM, EC_TO, EC_ROW_COUNT from Layer 1
2. MORTGAGE_SUMMARY — from MORTGAGE_[N]_ANALYSIS FINAL_STATUS
3. All names individually | EC Col 7 = NEVER | EC Applicant = IGNORE

⚠️ IF MORTGAGE_STATUS=DISCHARGED in Layer 1 → DO NOT flag as active encumbrance.
⚠️ IF MORTGAGE_STATUS=ACTIVE → flag in alerts as active mortgage.` }]
    })
    const analysis = l23Msg.content[0].type === 'text' ? l23Msg.content[0].text : ''
    const meta = parseMeta(analysis)

    // LAYER 4 — 4 PARALLEL
    const [r4a, r4b, r4c, r4d] = await Promise.all([
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4A, messages: [{
          role: 'user', content:
            `Parts I+II+III.
APPLICANT: ${meta.applicant || applicantName} | CO-APPLICANT: ${meta.coApplicant || coApplicant || 'N/A'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY PARA: ${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || '?'} W:${boundaryWest || '?'} N:${boundaryNorth || '?'} S:${boundarySouth || '?'}
EC_APP_NUMBER: ${meta.ecAppNumber || '?'} | EC_DATE: ${meta.ecDate || '?'}
EC_FROM: ${meta.ecFrom || '?'} | EC_TO: ${meta.ecTo || '?'} | EC_ROW_COUNT: ${meta.ecRowCount || '?'}
BANK: ${bankName}
ANALYSIS: ${analysis}
RULE: NO illegibility remarks in Part III — those go in Part VI ONLY.` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4B, messages: [{
          role: 'user', content:
            `Parts IV+V.
CASE: ${caseType} | PROPERTY: ${meta.propertyPara || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
EC_APP_NUMBER: ${meta.ecAppNumber || '?'} | EC_DATE: ${meta.ecDate || '?'}
EC_FROM: ${meta.ecFrom || '?'} | EC_TO: ${meta.ecTo || '?'} | EC_ROW_COUNT: ${meta.ecRowCount || '?'}
MORTGAGE_SUMMARY: ${meta.mortgageSummary || 'As per analysis'}
ANALYSIS: ${analysis}
RULES: Part IV oldest first, first para NO "Thereafter", each subsequent MUST start "Thereafter,". Final para includes EC App No + search period.
Part V EC table: every actual row, show Classified Type + Match Confidence. NEVER Col 7. NEVER EC Applicant. DISCHARGED = class ec-dis. ACTIVE = class ec-act. UNIDENTIFIED = class ec-unk.` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4C, messages: [{
          role: 'user', content:
            `Parts VI+VII+VIII.
BANK: ${bankName} | MORTGAGE: ${meta.mortgageSummary}
RISK: ${meta.riskLevel} | MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi} | LENDING: ${meta.lendingSuitability}
ANALYSIS: ${analysis}
RULES: Part VI = illegibility HERE. NEVER flag EC-confirmed deeds. NEVER flag EC Applicant. NEVER flag DISCHARGED mortgage as active. Flag UNIDENTIFIED EC entries as Medium Severity.
Part VIII = EXACT legal opinion wording with actual names filled in.` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: L4D, messages: [{
          role: 'user', content:
            `Parts IX+X+XI.
CASE: ${caseType} | BANK: ${bankName}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PURCHASER/MORTGAGOR: ${meta.applicant || applicantName}
EXISTING BANK: ${meta.existingBank || 'N/A'} | MORTGAGE: ${meta.mortgageSummary}
ANALYSIS: ${analysis}
Part XI: select ONE — CLEAR AND MARKETABLE TITLE or CLEAR TITLE SUBJECT TO CONDITIONS.` }]
      })
    ])

    const p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error Parts I-III</p>'
    const p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error Parts IV-V</p>'
    const p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error Parts VI-VIII</p>'
    const p9_11 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error Parts IX-XI</p>'

    const reportHtml = buildReport({
      refNo, appId: appId || 'AUTO', today, bankName: bankName || 'Bank',
      loanType: loanType || 'Loan Against Property', p123, p45, p678, p9_11
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
      success: true, report: reportHtml, verdict, savedToDb, dbError,
      debug: { extractedFacts, analysis, metaParsed: meta }
    })

  } catch (error: any) {
    console.error('TITLEMATRIXAI error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Pipeline failed' }, { status: 500 })
  }
}