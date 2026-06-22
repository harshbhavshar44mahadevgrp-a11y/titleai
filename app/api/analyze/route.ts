// ================================================================
// TITLEMATRIXAI -- /api/analyze/route.ts
// SOURCE: 5__Claude_Changed_Version__2_.docx -- EXACT IMPLEMENTATION
// 4-Layer Architecture | 11-Part Report | 7-Step EC Engine
// PURE ASCII -- No Gujarati in source code
// maxDuration=300 (Vercel Hobby) | temperature=0 (consistent)
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
  if (u.includes('NOT CLEAR') || u.includes('TITLE BREAK') || u.includes('DEFECTIVE')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO')) return 'CLEAR SUBJECT TO'
  if (u.includes('CLEAR AND MARKETABLE') || u.includes('MORTGAGEABLE')) return 'CLEAR'
  return 'PENDING'
}

// ================================================================
// CSS
// ================================================================
const REPORT_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}
.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}
.hdr-left .firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}
.hdr-left .sub{font-size:11px;color:#555;margin-top:2px}
.hdr-right{text-align:right;font-size:12px;line-height:2}
.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}
hr{border:none;border-top:1px solid #ccc;margin:16px 0}
.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}
.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}
.mt{width:100%;margin-bottom:10px;border-collapse:collapse}
.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}
.mt td:first-child{width:260px;color:#555}
.mt td:nth-child(2){width:14px}
.mt td:last-child{font-weight:500}
p{margin-bottom:10px;text-align:justify}
.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}
.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}
.dn{font-weight:bold}
.ib{margin-bottom:22px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}
.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}
.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}
.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}
.it{font-weight:bold;font-size:13px;margin-bottom:6px}
.sg{font-weight:bold;font-style:italic;color:#1B3A6B}
ol{padding-left:22px;margin-bottom:10px}
ol li{margin-bottom:5px}
table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}
table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}
table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}
table.ec-tbl tr:nth-child(even){background:#f7f9fc}
.ec-dis{color:#15803d;font-weight:bold}
.ec-act{color:#b91c1c;font-weight:bold}
.ec-unk{color:#b45309;font-style:italic}
table.mut-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
table.mut-tbl th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}
table.mut-tbl td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}
table.mut-tbl tr:nth-child(even){background:#f9fafb}
.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}
.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}
.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}
.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}
.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}
.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}
.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}
.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}
.sigbox{text-align:center}
.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}
.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}
.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}
.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}
@media print{body{padding:30px 40px}.ib{page-break-inside:avoid}}
`

// ================================================================
// LAYER 1 SYSTEM PROMPT
// Implements: Prompt 2 + Prompt 4 + Steps 1-7 + ROLE FLIP TEST
// ================================================================
const L1_SYSTEM = `You are the Document Extraction Engine (Layer 1).
Implements: Prompt 2 (Document Extraction) + Prompt 4 (Revenue and EC Analysis) + Steps 1-7 (EC Classification).

NON-NEGOTIABLE:
- Never assume facts. Never create facts. Never infer without documents.
- Never suppress adverse findings.
- Unavailable = "NOT PROVIDED FOR VERIFICATION."

================================================================
PROMPT 2 -- DOCUMENT EXTRACTION
================================================================
For EVERY submitted document extract:
- Document Type
- Registration Number (NOT stamp paper date -- Registration date only)
- Registration Date
- Executant (EVERY person individually -- NEVER "and others")
- Claimant (EVERY person individually -- NEVER "and others")
- Property Description
- Survey/Block Number, Village, Taluka, District, Area, Boundaries

PROPERTY DESCRIPTION -- MANDATORY PARAGRAPH FORMAT:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

================================================================
PROMPT 4 -- REVENUE AND EC ANALYSIS
================================================================

MUTATION ENTRIES:
- Skip first column "Entry Details"
- Extract: Entry Number | Entry Date | Nature | Certified/Rejected | Survey Number | Remarks
- Last column = IGNORE

EC COLUMN MAPPING (STRICT -- FROM MANUAL):
COL 1 (First from Left):    Type of Deed/Document -- APPLY STEPS 1-7 BELOW
COL 2 (Second):             Property Description
COL 3 (Third):              Executing Party = "Dastavej Kari Aapnar" = who GIVES/EXECUTES
COL 4 (Fourth):             Claimant Party = "Dastavej Kari Lenar" = who RECEIVES
COL 5 (Fifth):              Date of Registration
COL 6 (Sixth/Second Last):  Registration Number / Dastavej Number
COL 7 (Seventh/LAST):       NEVER READ. NEVER EXTRACT. NEVER MENTION. PERMANENT RULE.

EC APPLICATION RECEIPT -- EXTRACT ALL 4 (MANDATORY):
(a) EC_APP_NUMBER = "e-Application No." on receipt
(b) EC_DATE = "Date of Print" on receipt
(c) EC_FROM = search period start date
(d) EC_TO = search period end date

IMPORTANT: EC header "X registered transactions" = UNRELIABLE. Count actual table rows yourself.
EC Applicant name = ZERO property interest = COMPLETELY IGNORE.

================================================================
MORTGAGE FAMILY DISAMBIGUATION -- ROLE FLIP TEST (FROM MANUAL)
================================================================

MORTGAGE DEED (Loan Active/Outstanding):
- Col 3 (Executing/Aapnar) = BORROWER / OWNER (person who borrows)
- Col 4 (Claimant/Lenar)   = LENDER / BANK (who holds the mortgage)
- Property Status: CHARGED / ENCUMBERED
- Loan Status: OUTSTANDING / ACTIVE

DISCHARGE/RELEASE OF MORTGAGE (Loan Fully Repaid) -- ROLE IS FLIPPED:
- Col 3 (Executing/Aapnar) = LENDER / BANK (who releases) <-- BANK IS HERE
- Col 4 (Claimant/Lenar)   = BORROWER / OWNER (who gets property back) <-- OWNER IS HERE
- Property Status: DISCHARGED / CLEARED
- Loan Status: SETTLED / LIQUIDATED

DETECTION RULE -- PRIMARY (works even when Col 1 text is garbled):
After extracting ALL rows from ALL ECs:
- For each row where Col 3 (Aapnar) contains a Bank/NBFC/Finance company name:
  -> This is a DISCHARGE/RELEASE of mortgage
  -> Find the earlier row where that SAME Bank was in Col 4 (Lenar)
  -> That earlier mortgage is NOW DISCHARGED
  -> MORTGAGE_STATUS = DISCHARGED

DETECTION RULE -- SECONDARY (text-based confirmation):
Col 1 text containing any of these = Release/Discharge:
"Giro Mukeli" / "Giro Mukti" / "Mukeli" / "Mukti" / "Release" / "Reconveyance"
"Discharge" / "Satisfaction" / "Mortgage Release" / "Released"

Bank/Finance institution identifiers (use for Col 3 detection):
"BANK" / "FINANCE" / "HOUSING FINANCE" / "FINANCIAL" / "NBFC" / "CAPITAL"
"BAJAJ" / "HDFC" / "SBI" / "AXIS" / "ICICI" / "KOTAK" / "PNB" / "BOI"
"INDIABULLS" / "LIC" / "REPCO" / "PIRAMAL" / "MUTHOOT" / "TATA" / "ADITYA"

MULTIPLE EC DOCUMENTS:
- Process EACH EC document separately (EC-1, EC-2, EC-3...)
- Read ALL rows in EACH EC (Row 1, Row 2, Row 3... until no more rows)
- LAST ROW is often the Release Deed -- never stop reading early
- EC from newer period (e.g. 2024-2026) may contain the Release for a mortgage found in older EC (2011-2023)
- Cross-reference ALL ECs together for mortgage-release pairing

================================================================
STEPS 1-7 -- EC DOCUMENT TYPE CLASSIFICATION ENGINE
================================================================

STEP 1 -- CAPTURE RAW TEXT:
For each EC row, record the EXACT text in Col 1 as-is. Store as RAW_DOC_TYPE_TEXT. Do NOT modify.

STEP 2 -- NORMALIZE:
- Strip hyphens, punctuation, double spaces, trailing numbers
- Treat spacing variants as same: Vechan Khat = VechanKhat = Vechan-Khat
- Transliteration variants = same: Banakhat = Bana Khat
- If OCR artifacts (broken characters, junk) visible -> skip to STEP 5

STEP 3 -- MATCH (priority order):
1. Exact match -> confidence: EXACT MATCH
2. Root-word/synonym match -> confidence: SYNONYM MATCH
3. Contextual match (Col3/Col4 pattern) -> confidence: CONTEXTUAL MATCH
Never output a type not in the taxonomy table below.

STEP 4 -- DISAMBIGUATION CHECKS:
Pair                                 | Test
Sale Deed vs Agreement/Banakhat      | Sale = actual title transfer. Agreement = future promise.
Mortgage vs Release                  | ROLE FLIP TEST above. Bank in Col3 = Release. Bank in Col4 = Mortgage.
Release vs Reconveyance              | If prior mortgage in EC for same property -> Reconveyance/Mortgage Release
Mortgage vs Simple/Equitable         | Default "Mortgage Deed" unless text explicitly says Simple/Equitable
POA vs GPA vs SPA                    | Use GPA/SPA only if text says "General"/"Special"
Gift vs Relinquishment vs Family Sett| Check parties and co-owner status
Partition vs Family Settlement       | Partition = specific shares of one property only
Conservative rule: equally plausible -> broader category, flag for manual review.

STEP 5 -- NO-GUESS FAILURE PROTOCOL:
If type cannot be matched with MEDIUM+ confidence after Steps 1-4:
Output EXACTLY: DOCUMENT TYPE NOT IDENTIFIABLE -- RAW TEXT: [text] -- REQUIRES MANUAL REVIEW
Never guess. Never create facts.

STEP 6 -- CONFIDENCE TAG (one of):
EXACT MATCH | SYNONYM MATCH | CONTEXTUAL MATCH | UNIDENTIFIED

STEP 7 -- OUTPUT SCHEMA FOR EACH EC ROW:
EC_ROW_[N]:
  RAW_COL1_TEXT: [exact raw Col 1 text]
  CLASSIFIED_TYPE: [English type OR Step 5 failure message]
  CONFIDENCE: [EXACT MATCH / SYNONYM MATCH / CONTEXTUAL MATCH / UNIDENTIFIED]
  COL3_AAPNAR: [full name/s -- who executes/gives]
  COL4_LENAR: [full name/s or Bank from Col 4 -- who receives]
  COL5_DATE: [DD/MM/YYYY]
  COL6_DEED_NO: [Registration number]
  SUBJECT_PROPERTY_MATCH: [YES / NO]
  COL4_IS_BANK: [YES if Col4 = Bank/NBFC/Finance | NO]
  COL3_IS_BANK: [YES if Col3 = Bank/NBFC/Finance | NO]

================================================================
MORTGAGE-RELEASE PAIRING (after ALL rows extracted from ALL ECs):
================================================================

For EACH row where COL4_IS_BANK=YES (this is a Mortgage):
MORTGAGE_ANALYSIS_[N]:
  MORTGAGE_ROW: [row number and EC number]
  BANK_NAME: [bank from COL4_LENAR]
  DEED_NO: [COL6_DEED_NO]
  DATE: [COL5_DATE]
  
  METHOD_1 (Role Flip / Col3 Pattern):
  Scan ALL rows in ALL ECs: any row where COL3_IS_BANK=YES AND COL3_AAPNAR contains [BANK_NAME]?
  If YES: RELEASE_FOUND=YES | RELEASE_ROW=[N] | RELEASE_DEED_NO=[X] | RELEASE_DATE=[D]
  
  METHOD_2 (Text Match):
  Any row CLASSIFIED_TYPE = Release/Reconveyance/Mortgage Release/Discharge/Satisfaction?
  If YES AND same bank/property: RELEASE_FOUND=YES
  
  METHOD_3 (Submitted Documents):
  Is Release Deed / NOC / No-Dues Certificate submitted as a document? -> RELEASE_FOUND=YES
  
  FINAL_STATUS:
  Any method YES -> MORTGAGE_STATUS=DISCHARGED (charge fully released and satisfied)
  All methods NO  -> MORTGAGE_STATUS=ACTIVE (no release found)

================================================================
DOCUMENT TYPE TAXONOMY (English only -- use only these types):
================================================================
Sale Deed | Absolute Sale Deed | Conveyance Deed
Gift Deed | Release Deed | Relinquishment Deed
Partition Deed | Family Settlement Deed | Exchange Deed
Mortgage Deed | Simple Mortgage Deed | Equitable Mortgage
Mortgage Release Deed | Reconveyance Deed
Lease Deed | Leave and License Agreement | Rent Agreement
Development Agreement | Joint Development Agreement
Agreement to Sell | Agreement to Sell Without Possession | Banakhat
Power of Attorney | General Power of Attorney | Special Power of Attorney
POA under Section 45-A | Revocation of POA
Will | Probate | Succession Certificate | Legal Heir Certificate
Affidavit | Declaration Deed | Indemnity Bond
Rectification Deed | Confirmation Deed | Cancellation Deed
Settlement Deed | Trust Deed | Partnership Deed
Deed of Admission | Deed of Retirement | Deed of Dissolution
Lis Pendens [CRITICAL ALERT]

================================================================
PERMANENT RULES -- NEVER VIOLATE:
================================================================
1. NEVER "and others" -- every person individually
2. EC Col 7 (Last column) = NEVER read, extract, or mention
3. EC Applicant name = COMPLETELY IGNORE
4. Loan Amount = NEVER mention anywhere
5. Stamp Paper No = NEVER mention
6. Subject property ONLY -- verify Unit+Block+Floor match for every EC entry
7. Dukan = Shop | Banakhat Kabja Vagar = Agreement to Sell WITHOUT Possession (NOT Sale Deed)
8. Current Owner = from LATEST submitted deed`


// ================================================================
// LAYER 2+3 -- Prompt 3 (Title) + Prompt 5 (Risk) + Legal Opinion
// ================================================================
const L23_BASE = `You are Layer 2 (Title Verification -- Prompt 3) and Layer 3 (Risk and Mortgageability -- Prompt 5).

NON-NEGOTIABLE:
- Never assume. Never create. Never infer without documents.
- Never suppress adverse findings.
- Never certify if title continuity is incomplete.
- Unavailable = "NOT PROVIDED FOR VERIFICATION."

TITLE CERTIFICATION RULE:
Title certified ONLY when ALL satisfied:
[OK] Ownership established from registered document
[OK] Title continuity -- every transfer documented
[OK] EC verified -- all mortgages discharged or accounted for
[OK] Revenue records reconciled
[OK] Mortgageability assessed
Otherwise = "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

PROMPT 3 -- TITLE CHAIN:
Establish complete title flow. Every transfer must have documentary support.
If any link unsupported: FLAG = TITLE BREAK | Severity: CRITICAL
Recognize ALL deed types including Sale, Gift, Mortgage, Release, Partition, Settlement, Succession, Court Decree, POA, Rectification, Cancellation, JDA, Development Agreement.

PROMPT 5 -- MORTGAGEABILITY:
Risk: HIGH | MODERATE | LOW
Mortgageability: Mortgageable | Conditionally Mortgageable | Not Mortgageable
SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
Lending Suitability: Suitable | Conditionally Suitable | Not Suitable
Security Coverage: Adequate | Marginal | Inadequate

EC VERIFICATION (re-confirm from Layer 1):
- Read ALL EC_ROW_[N] and MORTGAGE_ANALYSIS_[N] from Layer 1
- MORTGAGE_STATUS=DISCHARGED -> DO NOT flag as active. Charge is satisfied.
- MORTGAGE_STATUS=ACTIVE -> Flag as active encumbrance in alerts.
- UNIDENTIFIED EC type -> Flag for manual review (Medium Severity).
- NEVER override DISCHARGED to ACTIVE without clear justification.
EC Col 7 = NEVER | EC Applicant = IGNORE | Loan Amount = NEVER`

function getL23(caseType: string): string {
  const opinions: Record<string, string> = {
    builder_purchase: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    resale: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK].`,
    seller_bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK].`,
    lap: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`
  }

  const metas: Record<string, string> = {
    builder_purchase: `---META---
APPLICANT: [From Draft Sale Deed/Banakhat/Allotment -- Buyer/Second Party -- NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Builder/Developer -- from title documents]
EC_APP_NUMBER: [from E-Application Receipt]
EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end]
EC_ROW_COUNT: [actual rows counted across all ECs]
MORTGAGE_SUMMARY: [NONE / DISCHARGED vide Deed No.X dated D / ACTIVE -- Bank:X Deed No:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A]
---END META---`,
    resale: `---META---
APPLICANT: [Second Party/Vechan Lenar -- Draft Deed/Banakhat -- NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [First Party/Vechan Aapnar -- ALL names -- from Draft Deed/Banakhat]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE / DISCHARGED vide Deed No.X dated D / ACTIVE -- Bank:X Deed No:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A or bank if active]
---END META---`,
    bt: `---META---
APPLICANT: [Current owner/borrower -- full names individually]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE -- Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Bank name from EC]
---END META---`,
    seller_bt: `---META---
APPLICANT: [Proposed purchaser -- Draft Deed/Banakhat -- Buyer side]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Seller -- First Party -- ALL names individually]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [ACTIVE -- Bank:[X] Deed No:[Y] Date:[Z]]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Conditionally Mortgageable]
SARFAESI: [Conditionally Enforceable]
LENDING_SUITABILITY: [Conditionally Suitable]
EXISTING_BANK: [Bank name from EC]
---END META---`,
    lap: `---META---
APPLICANT: [Current owner/borrower -- full names]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Same as Applicant]
EC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]
MORTGAGE_SUMMARY: [NONE -- EC clean / UNDISCLOSED ACTIVE if found]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Not Mortgageable if undisclosed]
SARFAESI: [Enforceable / Not Enforceable if encumbered]
LENDING_SUITABILITY: [Suitable / Not Suitable if encumbered]
EXISTING_BANK: [N/A]
---END META---`
  }

  const key = caseType in metas ? caseType : 'lap'
  return L23_BASE +
    `\n=== CASE TYPE: ${key.toUpperCase().replace(/_/g, ' ')} ===\n` +
    metas[key] +
    `\n\nLEGAL OPINION (Part VIII -- use this EXACT wording with actual names):\n"` +
    (opinions[key] || opinions['lap']) + `"`
}

function parseMeta(text: string) {
  const b = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const g = (k: string) => b.match(new RegExp(`^${k}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: g('APPLICANT'), coApplicant: g('CO_APPLICANT'), mortgagor: g('MORTGAGOR'),
    propertyPara: g('PROPERTY_PARA'), propertyBoundaries: g('PROPERTY_BOUNDARIES'),
    currentOwner: g('CURRENT_OWNER'), ecAppNumber: g('EC_APP_NUMBER'),
    ecDate: g('EC_DATE'), ecFrom: g('EC_FROM'), ecTo: g('EC_TO'),
    ecRowCount: g('EC_ROW_COUNT'), mortgageSummary: g('MORTGAGE_SUMMARY'),
    riskLevel: g('RISK_LEVEL'), mortgageability: g('MORTGAGEABILITY'),
    sarfaesi: g('SARFAESI'), lendingSuitability: g('LENDING_SUITABILITY'),
    existingBank: g('EXISTING_BANK'),
  }
}


// ================================================================
// LAYER 4 -- PROMPT 6 -- 11-PART REPORT
// L4A: Part I+II+III | L4B: Part IV+V | L4C: Part VI+VII+VIII | L4D: Part IX+X+XI
// ================================================================

const L4A = `Layer 4 -- Generate PART I, PART II, PART III.
OUTPUT PURE HTML ONLY. NO markdown. NO backticks. NO commentary.

PART I -- BORROWER / MORTGAGOR / CURRENT OWNERSHIP:
<hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt">
<tr><td>Name of Borrower/s</td><td>:</td><td>[Every person individually -- NEVER "and others"]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Names or "Not Applicable"]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Private Ltd / HUF / Trust / Society]</td></tr>
</table>
<div class="sph">B. Mortgagor Details</div>
<table class="mt">
<tr><td>Name of Mortgagor/s</td><td>:</td><td>[Same as Borrower/s above OR full names]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / etc.]</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest deed -- NEVER "and others"]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift Deed / etc.]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO]</td></tr>
</table>

PART II -- PROPERTY DESCRIPTION:
<hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[Full paragraph: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt">
<tr><td>East (Purva)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>West (Pashchim)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>South (Dakshin)</td><td>:</td><td>[boundary]</td></tr>
</table>

PART III -- LIST OF SCRUTINIZED DOCUMENTS:
RULE FROM MANUAL: Include ALL submitted documents. NO "ILLEGIBLE" / "BLANK" / "NOT PROVIDED" remarks here -- those go in Part VI ONLY. Never list Mutation Entries here. Never Stamp Paper No. Latest document FIRST.
<hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
For each document:
<div class="di"><p><span class="dn">N. [Document Type] -- Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Executant/s individually] unto and in favour of [Claimant/s individually]. [SRO name.] [2-3 sentence factual observation -- NO illegibility remarks.]</p></div>
For EC:
<div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [number] | Date: [date] | Period: [from] to [to]</span><br>EC bearing E-Application No. [number] dated [date] for search period [from] to [to] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [N] registered transaction/s found on row-by-row examination. [Brief summary of entries.]</p></div>
NEVER: "and others" | EC Col 7 | EC Applicant.
START OUTPUT with: <hr><div class="ph">PART I`

const L4B = `Layer 4 -- Generate PART IV and PART V.
OUTPUT PURE HTML ONLY. NO markdown. NO backticks. NO commentary.

PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY:
Rules: OLDEST FIRST -- NEWEST LAST. First paragraph: NO "Thereafter". Every subsequent paragraph: MUST start "Thereafter,". NEVER "and others". All terms in English.
<hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>

FIRST PARAGRAPH (NO "Thereafter"):
<p>[Earliest record -- original owner/s -- how held -- earliest mutation or revenue entry. Include specific mutation entry number if available.]</p>

SUBSEQUENT PARAGRAPHS (EACH must start "Thereafter,"):
<p>Thereafter, [Seller/s individually] transferred to [Buyer/s individually] vide Registered [Deed Type] No. [X] dated [DD/MM/YYYY] at Sub-Registrar Office, [SRO]. Consideration Rs. [Amount if available]. Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

MORTGAGE PARAGRAPH -- SELECT CORRECT VERSION:
IF MORTGAGE_STATUS = DISCHARGED:
<p>Thereafter, [Mortgagor/s] created a mortgage in favour of [Bank full name] vide Registered Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage stands discharged and the charge has been fully released and satisfied vide [Reconveyance / Mortgage Release Deed] No. [Y] dated [DD/MM/YYYY] executed by [Bank] unto and in favour of [Owner] -- no subsisting charge of [Bank] remains on the subject property as on date.</p>
IF MORTGAGE_STATUS = ACTIVE:
<p>Thereafter, [Mortgagor/s] created a mortgage in favour of [Bank full name] vide Registered Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage is subsisting and active as on the date of this report -- no Release Deed or Discharge document has been found in the Encumbrance Certificate or among the documents produced.</p>
RULE: DO NOT say "No discharge found" for any mortgage that Layer 1 marked as DISCHARGED.

FINAL PARAGRAPH:
<p>Thereafter, [Current Owner/s] holds right, title and interest in the subject property as confirmed by Encumbrance Certificate bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] covering search period [EC_FROM] to [EC_TO]. [Encumbrance status.]</p>

PART V -- APPROVALS AND REGULATORY COMPLIANCE:
<hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">Revenue Record</div>
<table class="mt">
<tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr>
<tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr>
<tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[H.Are.SqMt.]</td></tr>
<tr><td>Land Use</td><td>:</td><td>[Bin Kheti/Non-Agricultural = OK for bank | Kheti/Agricultural = FLAG IMMEDIATELY -- bank cannot lend]</td></tr>
<tr><td>Ownership Column</td><td>:</td><td>[Names -- flag if current owner not reflected]</td></tr>
<tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL / Details -- cross-check with EC]</td></tr>
<tr><td>Ganot / Tenant</td><td>:</td><td>[NIL / Name -- flag if tenant recorded]</td></tr>
</table>
<div class="sph">Mutation Entries (Earlier to Present -- Subject Property Only)</div>
<table class="mut-tbl"><tr><th>Sr.</th><th>Entry No.</th><th>Entry Date</th><th>Status</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>
[One row per mutation entry -- skip entries for other properties]
</table>
<p>[Cross-check: EC vs Mutation vs Documents. Any discrepancy?]</p>
<div class="sph">Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>RERA Registration</td><td>:</td><td>[RERA No., developer, validity OR "NOT PROVIDED FOR VERIFICATION." -- Post May 2017: MANDATORY]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
</table>
<div class="sph">Encumbrance Analysis -- All EC Rows</div>
<p>EC bearing E-Application No. [EC_APP_NUMBER] dated [EC_DATE] for search period [EC_FROM] to [EC_TO]. Row-by-row examination: [EC_ROW_COUNT] registered transaction/s found:</p>
<table class="ec-tbl">
<tr><th>Sr.</th><th>Classified Type</th><th>Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 -- Executing Party (Aapnar)</th><th>Col 4 -- Claimant Party (Lenar)</th><th>Status</th></tr>
[ONE ROW PER EC ENTRY -- NEVER Col 7 -- DISCHARGED=class ec-dis | ACTIVE=class ec-act | UNIDENTIFIED=class ec-unk]
</table>
<p>[Summary: entries count, discrepancy check with mutation/documents, any entry within 60 days?]</p>
START OUTPUT with: <hr><div class="ph">PART IV`

const L4C = `Layer 4 -- Generate PART VI, PART VII, PART VIII.
OUTPUT PURE HTML ONLY. NO markdown. NO backticks. NO commentary.
IMPORTANT: Keep alerts CONCISE -- max 5-6 alerts, 2-3 sentences each. Part VII = concise lists only.

PART VI -- ALERTS:
<hr><div class="ph">PART VI -- ALERTS</div>
<p>The following alerts were identified. HIGH SEVERITY conditions are precedent to sanction/disbursement.</p>
[Put illegibility/OCR remarks HERE -- NOT in Part III]

HIGH SEVERITY:
<div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Alert Title]</div><p>[Finding: specific deed nos, dates, parties. Why legally material. 2-3 sentences.]</p><p><span class="sg">Direction:</span> [Specific action required.]</p></div>

MEDIUM SEVERITY:
<div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Alert Title]</div><p>[Finding -- 2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>

LOW SEVERITY:
<div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Alert Title]</div><p>[Finding -- 1-2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>

UNIDENTIFIED EC ENTRY:
<div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. Unidentified EC Entry -- Manual Review Required</div><p>EC Row [N]: document type could not be classified. RAW TEXT: [text]. Step 5 Failure Protocol triggered. Manual advocate review required.</p><p><span class="sg">Direction:</span> Panel advocate to physically inspect EC and classify this entry.</p></div>

ALERT RULES:
- NEVER flag EC-confirmed deeds (copy not submitted) -- include in chain, no alert
- NEVER flag EC Applicant name
- NEVER flag DISCHARGED mortgage as active encumbrance
- If no alerts: <p>No material adverse findings from documents produced. Title appears clear.</p>

PART VII -- DOCUMENT DEFICIENCY REPORT:
<hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted and Available</div><ol>[All readable submitted documents]</ol>
<div class="sph">B. Critical Missing Documents (Required Before Sanction)</div><ol>[Missing mandatory docs -- purpose -- risk -- OR "NIL"]</ol>
<div class="sph">C. Important Missing Documents</div><ol>[Other missing docs -- OR "NIL"]</ol>
<div class="sph">D. Submitted Documents -- Illegible / Incomplete</div><ol>[Unreadable docs -- OR "NIL"]</ol>
<div class="sph">E. Risk and Mortgageability Assessment (Prompt 5)</div>
<table class="mt">
<tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
<tr><td>Mortgageability</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentence basis for assessment]</td></tr>
</table>

PART VIII -- LEGAL OPINION:
<hr><div class="ph">PART VIII -- LEGAL OPINION</div>
<p>[EXACT legal opinion wording from Layer 2+3 -- fill in actual builder/owner name and purchaser/mortgagor name]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank[, subject to charge of [EXISTING BANK NAME] if BT or Seller BT case].</p>

VERDICT BOX -- SELECT ONE BASED ON PART VI ALERTS:
If HIGH SEVERITY alerts exist: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[N] HIGH SEVERITY alert/s. Key issues: [brief list]. Resolve ALL HIGH SEVERITY alerts before proceeding.</p></div>
If only MEDIUM/LOW alerts: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Title is mortgageable subject to: [specific conditions].</p></div>
If no alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. [Brief reason.]</p></div>
START OUTPUT with: <hr><div class="ph">PART VI`

const L4D = `Layer 4 -- Generate PART IX, PART X, PART XI.
OUTPUT PURE HTML ONLY. NO markdown. NO backticks. NO commentary.

PART IX -- PRE-DISBURSEMENT DOCUMENTS (Prompt 6):
<hr><div class="ph">PART IX -- DOCUMENTS REQUIRED -- PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody BEFORE disbursement of the loan:</p>
<ol>
Builder Purchase: [1. NOC from Builder for creation of mortgage | 2. NOC from Project Finance Bank (if builder has project loan) | 3. Draft Sale Deed / Registered Banakhat / Agreement for Sale | 4. Allotment Letter in favour of borrower | 5. Any missing documents identified in Part VII]
Resale: [1. Draft Sale Deed / Registered Banakhat | 2. Chain documents for last 13 years | 3. Any missing documents from Part VII]
Balance Transfer: [1. List of Documents (LOD) from existing Bank | 2. Foreclosure Letter with validity date | 3. Outstanding Principal Certificate | 4. NOC from existing Bank | 5. CERSAI Search Certificate | 6. Updated EC covering gap period]
Seller BT: [1. Draft Sale Deed / Banakhat | 2. Foreclosure Letter from existing Bank | 3. LOD from existing Bank | 4. NOC from existing Bank | 5. CERSAI Search | 6. Updated EC]
LAP: [1. Original Registered Sale Deed or title document | 2. Updated EC confirming no encumbrance | 3. CERSAI Search confirming no prior charge]
</ol>

PART X -- POST-DISBURSEMENT DOCUMENTS (Prompt 6):
<hr><div class="ph">PART X -- DOCUMENTS REQUIRED -- POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody AFTER disbursement:</p>
<ol>
Builder Purchase: [1. Final Registered Sale Deed (Builder to Purchaser) -- within stipulated days of disbursement | 2. Original title documents from builder]
Resale: [1. Final Registered Sale Deed (Seller to Purchaser) -- within stipulated days | 2. Original title documents]
Balance Transfer: [1. No-Due Certificate from existing Bank | 2. Registered Release Deed from existing Bank | 3. Original title documents from existing Bank | 4. Updated EC post-release confirming NIL encumbrance]
Seller BT: [1. Registered Sale Deed (Owner to Purchaser) | 2. Release Deed from existing Bank | 3. No-Due Certificate | 4. Original title documents | 5. Updated EC post-release]
LAP: [1. Registered Mortgage Deed / MODT executed by Owner in favour of Bank | 2. CERSAI Registration Acknowledgement | 3. Updated EC post-mortgage creation]
</ol>

PART XI -- FINAL RECOMMENDATION (Prompt 6):
<hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec">
<div class="fr-title">Final Title Status -- Select ONE (from Prompt 6):</div>
<div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div>
</div>
<p style="margin-top:16px;">[Summary: 3-4 sentences -- overall title status, key conditions if any, whether bank can proceed, main caveats.]</p>
START OUTPUT with: <hr><div class="ph">PART IX`


// ================================================================
// HTML REPORT WRAPPER
// ================================================================
function buildReport(p: {
  refNo: string; appId: string; today: string
  bankName: string; loanType: string
  p123: string; p45: string; p678: string; p9_11: string
}): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report -- ${p.refNo}</title><style>${REPORT_CSS}</style></head><body>
<div class="hdr">
  <div class="hdr-left">
    <div class="firm">TITLEMATRIXAI</div>
    <div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div>
    <div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div>
    <div class="sub">support@titlematrixai.com &nbsp;|&nbsp; www.titlematrixai.com</div>
  </div>
  <div class="hdr-right">
    <div><strong>Reference No. :</strong> ${p.refNo}</div>
    <div><strong>Application ID :</strong> ${p.appId}</div>
    <div><strong>Report Date :</strong> ${p.today}</div>
    <div><strong>Bank :</strong> ${p.bankName}</div>
  </div>
</div>
<div class="rtitle">LEGAL SCRUTINY REPORT -- ${p.loanType}</div>
<hr>
${p.p123}
${p.p45}
${p.p678}
${p.p9_11}
<hr>
<div class="sigrow">
  <div class="sigbox"><div class="sigline"></div>
    <div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div>
    <div style="font-size:10px;color:#666;">Date: ${p.today}</div>
  </div>
  <div class="sigbox"><div class="sigline"></div>
    <div style="font-size:11px;font-weight:bold;">Authorised Signatory</div>
    <div style="font-size:10px;color:#666;">${p.bankName} -- APP ID: ${p.appId}</div>
  </div>
</div>
<div class="ftr">Generated by TITLEMATRIXAI &nbsp;|&nbsp; support@titlematrixai.com &nbsp;|&nbsp; www.titlematrixai.com
  <div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ${p.bankName} in connection with Application ID ${p.appId}. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title. Confidential -- For Bank Use Only.</div>
  <div class="wm">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div>
</div>
</body></html>`
}

// ================================================================
// MAIN API HANDLER -- POST /api/analyze
// ================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      documentText, images, caseType, appId, bankName, loanType,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId
    } = body

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`

    // -- LAYER 1: SONNET -- Document Extraction + 7-Step EC Engine --
    const l1Content: any[] = []
    if (images?.length > 0) {
      for (const img of images) {
        l1Content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
      }
    }

    let docText = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth) {
      docText += `\n\n=== BOUNDARIES FROM CASE DETAILS ===\nEast: ${boundaryEast || 'As per documents'}\nWest: ${boundaryWest || 'As per documents'}\nNorth: ${boundaryNorth || 'As per documents'}\nSouth: ${boundarySouth || 'As per documents'}\n`
    }

    l1Content.push({
      type: 'text',
      text: `LAYER 1 -- DOCUMENT EXTRACTION + 7-STEP EC ENGINE

CASE DETAILS (PRE-VERIFIED ANCHORS):
Applicant: ${applicantName || 'As per documents'}
Co-Applicant: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'}
Case Type: ${caseType}
Loan Type: ${loanType || 'LAP'}
Bank: ${bankName}
APP ID: ${appId}
Property: ${propertyAddress || 'As per documents'}
Boundaries: E=${boundaryEast || '?'} | W=${boundaryWest || '?'} | N=${boundaryNorth || '?'} | S=${boundarySouth || '?'}

SUBMITTED DOCUMENTS TEXT:
${docText}

MANDATORY EXECUTION STEPS:
1. Extract ALL documents individually -- NEVER "and others"
2. MULTIPLE EC DOCUMENTS: Find and process EACH EC separately (EC-1, EC-2, EC-3...)
3. FOR EACH EC -- READ EVERY ROW: Row 1, Row 2, Row 3... until no more rows exist
   - LAST ROW is often the Release/Discharge deed -- NEVER stop reading early
   - EC header "X transactions" = unreliable -- count actual rows yourself
4. Apply Steps 1-7 for EACH EC row Col 1 text
5. ROLE FLIP DETECTION: After extracting all rows from all ECs:
   - For each row where Col 3 (Aapnar) = Bank/Finance company -> RELEASE DEED -> prior mortgage = DISCHARGED
   - For each row where Col 4 (Lenar) = Bank/Finance company -> MORTGAGE DEED
6. CROSS-EC PAIRING: EC-1 (older) may show Mortgage, EC-2 (newer) may show its Release -> DISCHARGED
7. Output EC_ROW_[N] for every row in every EC submitted
8. Output MORTGAGE_ANALYSIS_[N] with all 3 methods and FINAL_STATUS
9. EC Col 7 (Last column) = NEVER READ OR MENTION
10. EC Applicant name = COMPLETELY IGNORE
11. Loan Amount = NEVER mention`
    })

    const l1Res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0,
      system: L1_SYSTEM,
      messages: [{ role: 'user', content: l1Content }]
    })
    const extractedFacts = l1Res.content[0].type === 'text' ? l1Res.content[0].text : ''

    // -- LAYER 2+3: SONNET -- Title + Risk + Legal Opinion --
    const l23Res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      temperature: 0,
      system: getL23(caseType),
      messages: [{
        role: 'user',
        content: `LAYER 2+3 -- TITLE VERIFICATION + RISK + LEGAL ANALYSIS

CASE: ${caseType} | BANK: ${bankName} | APP: ${appId}
APPLICANT: ${applicantName} | CO-APPLICANT: ${coApplicant || 'None'}
CURRENT OWNER: ${currentOwner || 'As per documents'}
PROPERTY: ${propertyAddress}
BOUNDARIES: E=${boundaryEast || '?'} | W=${boundaryWest || '?'} | N=${boundaryNorth || '?'} | S=${boundarySouth || '?'}

LAYER 1 EXTRACTED FACTS:
${extractedFacts}

FILL META BLOCK:
1. EC_APP_NUMBER, EC_DATE, EC_FROM, EC_TO from Layer 1 EC extraction
2. EC_ROW_COUNT = actual rows counted across all ECs
3. MORTGAGE_SUMMARY = from MORTGAGE_ANALYSIS_[N] FINAL_STATUS values
4. All names individually -- NEVER "and others"
5. EC Col 7 = NEVER | EC Applicant = IGNORE | Loan Amount = NEVER

KEY RULES:
- MORTGAGE_STATUS=DISCHARGED -> DO NOT flag as alert. Write "DISCHARGED" in summary.
- MORTGAGE_STATUS=ACTIVE -> Flag as HIGH SEVERITY active encumbrance.
- UNIDENTIFIED EC type -> Flag as MEDIUM SEVERITY for manual review.`
      }]
    })
    const analysis = l23Res.content[0].type === 'text' ? l23Res.content[0].text : ''
    const meta = parseMeta(analysis)

    // -- LAYER 4: 4 PARALLEL SONNET CALLS -- 11-Part Report --
    const [r4a, r4b, r4c, r4d] = await Promise.all([

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4A,
        messages: [{
          role: 'user',
          content: `Generate Parts I, II, III.
APPLICANT: ${meta.applicant || applicantName}
CO-APPLICANT: ${meta.coApplicant || coApplicant || 'Not Applicable'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPERTY PARA: ${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || '?'} W:${boundaryWest || '?'} N:${boundaryNorth || '?'} S:${boundarySouth || '?'}
EC_APP_NUMBER: ${meta.ecAppNumber || 'As per documents'}
EC_DATE: ${meta.ecDate || 'As per documents'}
EC_FROM: ${meta.ecFrom || '?'} | EC_TO: ${meta.ecTo || '?'}
EC_ROW_COUNT: ${meta.ecRowCount || 'As per documents'}
BANK: ${bankName}
LAYER 1 FACTS: ${extractedFacts}
LAYER 23 ANALYSIS: ${analysis}
RULE: Part III -- NO illegibility/blank/not provided remarks. Those go in Part VI ONLY.`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4B,
        messages: [{
          role: 'user',
          content: `Generate Parts IV, V.
CASE: ${caseType} | PROPERTY: ${meta.propertyPara || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
EC_APP_NUMBER: ${meta.ecAppNumber || '?'} | EC_DATE: ${meta.ecDate || '?'}
EC_FROM: ${meta.ecFrom || '?'} | EC_TO: ${meta.ecTo || '?'} | EC_ROW_COUNT: ${meta.ecRowCount || '?'}
MORTGAGE_SUMMARY: ${meta.mortgageSummary || 'As per analysis'}
LAYER 1 FACTS: ${extractedFacts}
LAYER 23 ANALYSIS: ${analysis}
RULES:
- Part IV: Oldest first. First paragraph NO "Thereafter". Each subsequent MUST start "Thereafter,".
- DISCHARGED mortgage: "stands discharged and charge fully released and satisfied" -- NEVER say "no discharge found"
- Part V EC table: every actual row, show Classified Type + Confidence. NEVER Col 7. NEVER EC Applicant.
- DISCHARGED = class="ec-dis" | ACTIVE = class="ec-act" | UNIDENTIFIED = class="ec-unk"`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: L4C,
        messages: [{
          role: 'user',
          content: `Generate Parts VI, VII, VIII. Keep concise -- max 5-6 alerts.
BANK: ${bankName}
MORTGAGE_SUMMARY: ${meta.mortgageSummary}
RISK: ${meta.riskLevel} | MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi} | LENDING: ${meta.lendingSuitability}
LAYER 1 FACTS: ${extractedFacts}
LAYER 23 ANALYSIS: ${analysis}
RULES:
- Part VI: Illegibility/OCR remarks go HERE. NEVER flag EC-confirmed deeds. NEVER flag Applicant name. NEVER flag DISCHARGED mortgage.
- Part VII: Concise lists. Section E = risk/mortgageability table from Layer 2+3.
- Part VIII: EXACT legal opinion wording with actual names filled in. Verdict matches Part VI alerts.`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: L4D,
        messages: [{
          role: 'user',
          content: `Generate Parts IX, X, XI.
CASE: ${caseType} | BANK: ${bankName}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PURCHASER/MORTGAGOR: ${meta.applicant || applicantName}
EXISTING BANK: ${meta.existingBank || 'N/A'}
MORTGAGE_SUMMARY: ${meta.mortgageSummary}
LAYER 23 ANALYSIS: ${analysis}
Part XI: Select ONE -- CLEAR AND MARKETABLE TITLE or CLEAR TITLE SUBJECT TO CONDITIONS.`
        }]
      })
    ])

    const p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error generating Parts I-III</p>'
    const p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error generating Parts IV-V</p>'
    const p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error generating Parts VI-VIII</p>'
    const p9_11 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error generating Parts IX-XI</p>'

    const reportHtml = buildReport({
      refNo, appId: appId || 'AUTO', today,
      bankName: bankName || 'Bank',
      loanType: loanType || 'Loan Against Property',
      p123, p45, p678, p9_11
    })

    const verdict = extractVerdict(analysis)
    let savedToDb = false
    let dbError = null

    if (userId && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('reports').insert({
          user_id: userId,
          case_type: caseType || 'lap',
          applicant_name: meta.applicant || applicantName || 'Unknown',
          bank_name: bankName || 'Unknown',
          property_address: meta.propertyPara || propertyAddress || 'Unknown',
          app_id: appId || refNo,
          verdict,
          report_html: reportHtml,
        })
        if (error) { dbError = error.message } else { savedToDb = true }
      } catch (err: any) {
        dbError = err.message
      }
    }

    return NextResponse.json({
      success: true,
      report: reportHtml,
      verdict,
      savedToDb,
      dbError,
      debug: { extractedFacts, analysis, metaParsed: meta }
    })

  } catch (error: any) {
    console.error('TITLEMATRIXAI error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Pipeline failed' },
      { status: 500 }
    )
  }
}