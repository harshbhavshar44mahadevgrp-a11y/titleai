// ================================================================
// TITLEMATRIXAI -- /api/analyze/route.ts
// SOURCE: MASTER SYSTEM PROMPT (5__Claude_Changed_Version__2_.docx)
// 4-Layer | 11-Part Report | 7-Step EC | Mortgage Lifecycle Engine
// Pure ASCII | maxDuration=300 | temperature=0 | All Sonnet
// ================================================================
export const maxDuration = 300
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

function getVerdict(text: string): string {
  const u = text.toUpperCase()
  if (u.includes('NOT CLEAR') || u.includes('TITLE BREAK') || u.includes('DEFECTIVE')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO')) return 'CLEAR SUBJECT TO'
  if (u.includes('CLEAR AND MARKETABLE') || u.includes('MORTGAGEABLE')) return 'CLEAR'
  return 'PENDING'
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}
.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}
.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}
.sub{font-size:11px;color:#555;margin-top:2px}
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
.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}
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
.ec-rel{color:#15803d;font-weight:bold}
.ec-act{color:#b91c1c;font-weight:bold}
.ec-unk{color:#b45309;font-style:italic}
table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}
table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}
table.mut tr:nth-child(even){background:#f9fafb}
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
// LAYER 1 SYSTEM -- Prompt 2 + Prompt 4 + Steps 1-7 + Mortgage Lifecycle Engine
// ================================================================
const L1 = `You are the Document Extraction Engine (Layer 1) of a 4-Layer AI Title Verification System.
You implement: Prompt 2 (Document Extraction) + Prompt 4 (Revenue and EC Analysis) + Steps 1-7 (EC Classification) + Mortgage Lifecycle Analysis Engine.

NON-NEGOTIABLE:
- Never assume facts. Never create facts. Never infer without documents.
- Never suppress adverse findings.
- Unavailable = "NOT PROVIDED FOR VERIFICATION."

================================================================
PROMPT 2 -- DOCUMENT EXTRACTION
================================================================
For EVERY submitted document extract:
- Document Type | Registration Number | Registration Date (NOT stamp paper -- Registration Date only)
- Executant: EVERY person individually -- NEVER "and others"
- Claimant: EVERY person individually -- NEVER "and others"
- Property Description | Survey/Block No. | Village | Taluka | District | Area | Boundaries

PROPERTY DESCRIPTION MANDATORY FORMAT:
"Opinion on title and search in respect of immovable property bearing [Flat/Unit/Shop/Plot/Sub-Plot/Office] No. [Unit No.] on [Floor] Floor having Carpet Area admeasuring [Carpet Area] Sq. Mtrs., along with Balcony area admeasuring [Balcony Area] Sq. Mtrs. and Wash area admeasuring [Wash Area] Sq. Mtrs. together with undivided proportionate share area admeasuring [UDS Area] Sq. Mtrs. in the scheme known as '[Scheme Name]' constructed over Non-Agricultural land bearing Final Plot No. [FP No.] of T.P. Scheme No. [TP No.] allotted in lieu of Revenue/Block/Survey/City Survey No. [Survey No.], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."

Classify each document as Available or Missing.

================================================================
PROMPT 4 -- REVENUE AND EC ANALYSIS
================================================================

MUTATION ENTRIES:
- Skip first column "Entry Details"
- Extract: Entry Number | Entry Date | Nature | Certified/Rejected | Survey Number | Remarks
- Last column = IGNORE ALWAYS

EC STRICT COLUMN MAPPING (from Master System Prompt):
COL 1 (First):       Type of Deed/Document -- apply Steps 1-7
COL 2 (Second):      Property Description
COL 3 (Third):       Executing Party = "Dastavej Kari Aapnar" = who GIVES/EXECUTES/RELEASES
COL 4 (Fourth):      Claimant Party = "Dastavej Kari Lenar" = who RECEIVES
COL 5 (Fifth):       Date of Registration
COL 6 (Sixth/2nd Last): Registration Number
COL 7 (Seventh/LAST): NEVER READ. NEVER EXTRACT. NEVER MENTION. ABSOLUTE RULE.

EC RECEIPT -- EXTRACT ALL (MANDATORY):
EC_APP_NUMBER = "e-Application No." | EC_DATE = "Date of Print"
EC_FROM = search period start | EC_TO = search period end

EC HEADER COUNT IS UNRELIABLE. Count actual rows yourself.
EC Applicant name = ZERO property interest = COMPLETELY IGNORE.

MULTIPLE EC DOCUMENTS:
- Find and process EACH EC separately (EC-1, EC-2, EC-3...)
- Read ALL rows: Row 1, Row 2, Row 3... until no more rows
- LAST ROW is often the Release Deed -- NEVER stop reading early
- Cross-reference ALL ECs for mortgage-release matching

================================================================
MORTGAGE LIFECYCLE ANALYSIS ENGINE (from Master System Prompt)
================================================================

You are a Mortgage Lifecycle Analysis Engine.
Your responsibility is NOT merely to extract EC entries.
Your responsibility is to determine whether every mortgage remains ACTIVE or stands RELEASED.

STEP A -- FOR EVERY MORTGAGE ENTRY, CREATE A CHARGE RECORD:
CHARGE_[N]:
  LENDER: [Bank/NBFC name from Col 4 (Lenar)]
  BORROWER: [Owner name from Col 3 (Aapnar)]
  PROPERTY: [from Col 2]
  DEED_NO: [from Col 6]
  DATE: [from Col 5]
  STATUS: ACTIVE (initial state)

MORTGAGE RECOGNITION -- Col 3 (Aapnar) = Owner/Borrower AND Col 4 (Lenar) = Bank/Lender:
When Col 4 contains any Bank/Finance/NBFC name -> this row = MORTGAGE -> create CHARGE RECORD

Bank/Finance identifiers:
"BANK" / "FINANCE" / "HOUSING FINANCE" / "FINANCIAL" / "NBFC" / "CAPITAL" / "FINCORP"
"BAJAJ" / "HDFC" / "SBI" / "AXIS" / "ICICI" / "KOTAK" / "PNB" / "BOI" / "CANARA"
"INDIABULLS" / "LIC" / "LICHFL" / "REPCO" / "PIRAMAL" / "MUTHOOT" / "TATA" / "ADITYA"
"INDIA BULLS" / "HOME FINANCE" / any institution that provides loans

STEP B -- FOR EVERY RELEASE ENTRY, MATCH WITH CHARGE RECORD:
RELEASE RECOGNITION:
- PRIMARY: Col 3 (Aapnar) = Bank/Lender (ROLE FLIP -- Bank is now GIVING/EXECUTING the release)
  AND Col 4 (Lenar) = Owner/Borrower (owner RECEIVING title back)
- SECONDARY: Col 1 text contains any release keywords:
  "Release of Mortgage" / "Mortgage Release" / "Reconveyance" / "Discharge of Mortgage"
  "Satisfaction of Mortgage" / "Release of Charge" / "Mortgage Redemption"
  "Ghiro Mukti" / "Giro Mukti" / "Mukti" / "Mukeli" / "Released"
  "Giro Mukeli Milkatnu Fer Maliki Ferkhat" (transliteration of Gujarati release phrase)

ROLE FLIP RULE (CRITICAL -- from Master System Prompt):
MORTGAGE:  Col 3 (Aapnar) = BORROWER/OWNER  ->  Col 4 (Lenar) = LENDER/BANK
RELEASE:   Col 3 (Aapnar) = LENDER/BANK  ->  Col 4 (Lenar) = BORROWER/OWNER
When you see Bank in Col 3 (Aapnar/Executing Party) -> RELEASE EVENT -> update matching CHARGE to RELEASED

MATCHING RULE:
For each release event, find the CHARGE_[N] where LENDER matches the Bank in Col 3 of release.
If match found -> CHARGE_[N] STATUS = RELEASED

STEP C -- CONCLUSION OUTPUT (MANDATORY after all rows processed):
MORTGAGE_LIFECYCLE_SUMMARY:
  A. ACTIVE_MORTGAGES:
     [List each CHARGE_[N] with STATUS=ACTIVE]
     [If none: "NIL -- No active mortgage found"]
  B. RELEASED_MORTGAGES:
     [List each CHARGE_[N] with STATUS=RELEASED, and the release deed details]
     [If none: "NIL"]
  C. UNMATCHED_RELEASE_DOCUMENTS:
     [Release entries found but no matching mortgage in EC -- could be from outside EC period]
     [If none: "NIL"]
  D. ENCUMBRANCE_STATUS:
     [CLEAR -- No active mortgage] OR [ENCUMBERED -- Active mortgage exists] OR [PARTIALLY ENCUMBERED]

RULE: Never report a mortgage as ACTIVE if a corresponding release document is found.

================================================================
STEPS 1-7 -- EC DOCUMENT TYPE CLASSIFICATION ENGINE
================================================================

STEP 1 -- CAPTURE RAW TEXT:
Record EXACT text in Col 1 as-is. Store as RAW_DOC_TYPE_TEXT. Do NOT modify.

STEP 2 -- NORMALIZE:
Strip hyphens, punctuation, double spaces, trailing numbers.
Spacing variants = same. Transliteration variants = same.
OCR artifacts (broken chars, junk) -> skip to STEP 5.

STEP 3 -- MATCH (priority order):
1. Exact match -> EXACT MATCH
2. Root-word/synonym -> SYNONYM MATCH
3. Contextual (Col3/Col4 pattern) -> CONTEXTUAL MATCH
Never output a type not in the taxonomy table.

STEP 4 -- DISAMBIGUATION:
Sale Deed vs Agreement/Banakhat: Sale = actual transfer. Agreement = future promise.
Mortgage vs Release: ROLE FLIP TEST. Bank in Col3 = Release. Bank in Col4 = Mortgage.
Release vs Reconveyance: Prior mortgage in EC -> Reconveyance/Mortgage Release.
Mortgage vs Simple/Equitable: Default "Mortgage Deed" unless text says Simple/Equitable.
POA vs GPA vs SPA: GPA/SPA only if text says "General"/"Special".
Gift vs Relinquishment vs Family Settlement: Check parties and co-owner status.
Conservative: equally plausible -> broader category, flag for review.

STEP 5 -- NO-GUESS RULE:
Cannot match with MEDIUM+ confidence -> output:
"DOCUMENT TYPE NOT IDENTIFIABLE -- RAW TEXT: [text] -- REQUIRES MANUAL REVIEW"

STEP 6 -- CONFIDENCE TAG:
EXACT MATCH | SYNONYM MATCH | CONTEXTUAL MATCH | UNIDENTIFIED

STEP 7 -- OUTPUT SCHEMA FOR EACH EC ROW:
EC_ROW_[N]:
  RAW_COL1_TEXT: [exact raw Col 1 text]
  CLASSIFIED_TYPE: [English type OR Step 5 failure message]
  CONFIDENCE: [EXACT MATCH / SYNONYM MATCH / CONTEXTUAL MATCH / UNIDENTIFIED]
  COL3_AAPNAR: [full name/s]
  COL4_LENAR: [full name/s or Bank]
  COL5_DATE: [DD/MM/YYYY]
  COL6_DEED_NO: [Registration number]
  SUBJECT_PROPERTY_MATCH: [YES / NO]
  COL4_IS_BANK: [YES / NO]
  COL3_IS_BANK: [YES / NO]
  LIFECYCLE_ACTION: [CREATE_CHARGE / RELEASE_CHARGE / NO_ACTION]

================================================================
DOCUMENT TYPE TAXONOMY (English only -- use ONLY these):
================================================================
Sale Deed | Absolute Sale Deed | Conveyance Deed | Gift Deed
Release Deed | Relinquishment Deed | Partition Deed | Family Settlement Deed | Exchange Deed
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
Lis Pendens [CRITICAL ALERT -- flag immediately]

================================================================
PERMANENT RULES -- NEVER VIOLATE:
================================================================
1. NEVER "and others" -- every person individually
2. EC Col 7 (Last column) = NEVER read, extract, or mention
3. EC Applicant name = COMPLETELY IGNORE
4. Loan Amount = NEVER mention anywhere
5. Stamp Paper No = NEVER mention
6. Subject property ONLY -- Unit+Block+Floor match for every EC entry
7. Current Owner = from LATEST submitted deed`

// ================================================================
// LAYER 2+3 -- Prompt 3 + Prompt 5 + Legal Opinions
// ================================================================
const L23_BASE = `You are Layer 2 (Title Verification -- Prompt 3) and Layer 3 (Risk -- Prompt 5).

NON-NEGOTIABLE: Never assume. Never create. Never suppress. Unavailable = "NOT PROVIDED FOR VERIFICATION."

TITLE CERTIFICATION RULE:
Certify ONLY when: Ownership established + Title continuity + EC verified + Revenue reconciled + Mortgageability assessed.
Otherwise: "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION."

PROMPT 3 -- TITLE CHAIN:
Every transfer needs documentary support. No support -> TITLE BREAK | Severity: CRITICAL.
Recognize all deed types from master list including: Sale, Gift, Mortgage, Release, Partition, Settlement, Succession, Court Decree, POA, JDA, Development Agreement, Rectification, Cancellation.

PROMPT 5 -- RISK:
Risk: HIGH | MODERATE | LOW
Mortgageability: Mortgageable | Conditionally Mortgageable | Not Mortgageable
SARFAESI: Enforceable | Conditionally Enforceable | Not Enforceable
Lending Suitability: Suitable | Conditionally Suitable | Not Suitable
Security Coverage: Adequate | Marginal | Inadequate

EC VERIFICATION FROM LAYER 1 MORTGAGE LIFECYCLE SUMMARY:
- Read MORTGAGE_LIFECYCLE_SUMMARY from Layer 1
- ACTIVE_MORTGAGES = flag each as active encumbrance
- RELEASED_MORTGAGES = DO NOT flag as alert. Charge is satisfied. Fully discharged.
- UNMATCHED_RELEASE = note but do not flag as critical unless concerning
- ENCUMBRANCE_STATUS = use for overall assessment
- NEVER override RELEASED to ACTIVE without explicit justification
- EC Col 7 = NEVER | EC Applicant = IGNORE | Loan Amount = NEVER`

function getL23(ct: string): string {
  const op: Record<string, string> = {
    builder_purchase: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
    resale: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
    bt: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,
    seller_bt: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,
    lap: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`
  }
  const meta: Record<string, string> = {
    builder_purchase: `---META---
APPLICANT: [Draft Sale Deed/Banakhat/Allotment -- Buyer/Second Party -- NEVER stamp paper]
CO_APPLICANT: [Full names or N/A]
MORTGAGOR: [Same as Applicant]
PROPERTY_PARA: [Full paragraph format]
PROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]
CURRENT_OWNER: [Builder/Developer -- from title documents]
EC_APP_NUMBER: [from E-Application Receipt]
EC_DATE: [Date of Print]
EC_FROM: [start] | EC_TO: [end]
EC_ROW_COUNT: [actual rows across all ECs]
MORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X dated D / ACTIVE -- Bank:X Deed:Y]
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
MORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X dated D / ACTIVE -- Bank:X Deed:Y]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
SARFAESI: [Enforceable / Conditionally Enforceable / Not Enforceable]
LENDING_SUITABILITY: [Suitable / Conditionally Suitable / Not Suitable]
EXISTING_BANK: [N/A or bank if active]
---END META---`,
    bt: `---META---
APPLICANT: [Current owner/borrower -- full names]
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
MORTGAGE_SUMMARY: [NONE / UNDISCLOSED ACTIVE if found]
RISK_LEVEL: [HIGH / MODERATE / LOW]
MORTGAGEABILITY: [Mortgageable / Not Mortgageable if undisclosed]
SARFAESI: [Enforceable / Not Enforceable if encumbered]
LENDING_SUITABILITY: [Suitable / Not Suitable if encumbered]
EXISTING_BANK: [N/A]
---END META---`
  }
  const k = ct in meta ? ct : 'lap'
  return L23_BASE +
    `\n=== CASE: ${k.toUpperCase().replace(/_/g, ' ')} ===\n` +
    meta[k] +
    `\n\nLEGAL OPINION WORDING (Part VIII -- fill actual names):\n` +
    (op[k] || op['lap'])
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

// ================================================================
// LAYER 4 -- PROMPT 6 -- 11-PART REPORT
// ================================================================
const L4A = `Layer 4 Report Generator -- PART I, PART II, PART III.
PURE HTML ONLY. NO markdown. NO commentary outside HTML.

PART I: <hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt"><tr><td>Name of Borrower/s</td><td>:</td><td>[Every person individually -- NEVER "and others"]</td></tr>
<tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Names or "Not Applicable"]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Private Ltd / HUF / Trust]</td></tr></table>
<div class="sph">B. Mortgagor Details</div>
<table class="mt"><tr><td>Name of Mortgagor/s</td><td>:</td><td>[Same as Borrower/s above OR full names]</td></tr>
<tr><td>Address</td><td>:</td><td>[As per documents or "Same as above"]</td></tr>
<tr><td>Constitution</td><td>:</td><td>[Individual / etc.]</td></tr></table>
<div class="sph">C. Current Ownership</div>
<table class="mt"><tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest deed -- NEVER "and others"]</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift Deed / etc.]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO]</td></tr></table>

PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[Full paragraph: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt"><tr><td>East (Purva)</td><td>:</td><td>[boundary]</td></tr><tr><td>West (Pashchim)</td><td>:</td><td>[boundary]</td></tr>
<tr><td>North (Uttar)</td><td>:</td><td>[boundary]</td></tr><tr><td>South (Dakshin)</td><td>:</td><td>[boundary]</td></tr></table>

PART III: RULE FROM PROMPT 6 -- Include ALL submitted documents. NO "ILLEGIBLE" / "BLANK" / "NOT PROVIDED" remarks here -- those go in Part VI ONLY. No Mutation Entries. No Stamp Paper No. Latest first.
<hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
For each document: <div class="di"><p><span class="dn">N. [Document Type] -- Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Executant/s individually] unto and in favour of [Claimant/s individually]. [SRO.] [2-3 sentences -- NO illegibility remarks.]</p></div>
For EC: <div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [no] | Date: [date] | Period: [from] to [to]</span><br>EC bearing E-Application No. [no] dated [date] for search period [from] to [to] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [N] transaction/s found on row-by-row examination. [Brief summary.]</p></div>
NEVER: "and others" | EC Col 7 | EC Applicant.
START WITH: <hr><div class="ph">PART I`

const L4B = `Layer 4 Report Generator -- PART IV, PART V.
PURE HTML ONLY. NO markdown. NO commentary outside HTML.

PART IV: Rules: OLDEST FIRST. First paragraph NO "Thereafter". Every subsequent paragraph MUST start "Thereafter,". All names individually. All terms in English.
<hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
First paragraph (NO "Thereafter"): <p>[Earliest record -- original owner/s -- how held -- earliest mutation entry with number and date.]</p>
Subsequent (EACH starts "Thereafter,"): <p>Thereafter, [Seller/s individually] transferred to [Buyer/s individually] vide Registered [Deed Type] No. [X] dated [DD/MM/YYYY] at Sub-Registrar Office, [SRO]. Entry recorded vide Mutation No. [X] dated [DD/MM/YYYY].</p>

MORTGAGE PARAGRAPH -- USE CORRECT VERSION FROM LIFECYCLE SUMMARY:
If STATUS=RELEASED: <p>Thereafter, [Mortgagor/s] created a mortgage in favour of [Bank] vide Registered Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage stands discharged and the charge has been fully released and satisfied vide [Reconveyance/Mortgage Release Deed] No. [Y] dated [DD/MM/YYYY] executed by [Bank] unto [Owner] -- no subsisting charge remains on the subject property as on date.</p>
If STATUS=ACTIVE: <p>Thereafter, [Mortgagor/s] created a mortgage in favour of [Bank] vide Registered Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage is subsisting and active as on date -- no Release Deed or Discharge has been found in the EC or submitted documents.</p>
RULE: NEVER say "No discharge found" for any mortgage marked RELEASED in Mortgage Lifecycle Summary.

Final paragraph: <p>Thereafter, [Current Owner/s] holds right, title and interest as confirmed by Encumbrance Certificate E-Application No. [EC_APP_NUMBER] dated [EC_DATE] for period [EC_FROM] to [EC_TO]. Encumbrance Status: [from Lifecycle Summary D. ENCUMBRANCE_STATUS].</p>

PART V: <hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">Revenue Record</div>
<table class="mt"><tr><td>Village (Mouje)</td><td>:</td><td>[Name]</td></tr><tr><td>Taluka</td><td>:</td><td>[Name]</td></tr>
<tr><td>District</td><td>:</td><td>[Name]</td></tr><tr><td>Survey / Block No.</td><td>:</td><td>[Number]</td></tr>
<tr><td>Total Area</td><td>:</td><td>[H.Are.SqMt.]</td></tr>
<tr><td>Land Use</td><td>:</td><td>[Bin Kheti/Non-Agricultural = OK | Kheti/Agricultural = FLAG -- bank cannot lend on agricultural land]</td></tr>
<tr><td>Ownership Column</td><td>:</td><td>[Names -- flag if current owner not reflected]</td></tr>
<tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL / Details -- cross-check with EC Lifecycle Summary]</td></tr>
<tr><td>Ganot / Tenant</td><td>:</td><td>[NIL / Name -- flag if tenant recorded]</td></tr></table>
<div class="sph">Mutation Entries (Earlier to Present)</div>
<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Entry Date</th><th>Status</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>
[One row per mutation -- subject property only]</table>
<p>[Cross-check: EC vs Mutation vs Documents. Discrepancy?]</p>
<div class="sph">Regulatory Approvals</div>
<table class="mt">
<tr><td>NA Order / Land Use Conversion</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Development Permission / Rajachitthi</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Sanctioned Building Plan</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Commencement Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>RERA Registration</td><td>:</td><td>[RERA No., developer OR "NOT PROVIDED." -- Post May 2017: MANDATORY]</td></tr>
<tr><td>Fire NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Airport Authority NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Occupancy Certificate / BU Permission</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr>
<tr><td>Completion Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr></table>
<div class="sph">Encumbrance Certificate Analysis</div>
<p>EC E-Application No. [EC_APP_NUMBER] dated [EC_DATE] for period [EC_FROM] to [EC_TO]. Row-by-row: [EC_ROW_COUNT] transaction/s found:</p>
<table class="ec-tbl"><tr><th>Sr.</th><th>Classified Type</th><th>Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 -- Executing (Aapnar)</th><th>Col 4 -- Claimant (Lenar)</th><th>Lifecycle Status</th></tr>
[ONE ROW PER EC ENTRY -- NEVER Col 7 -- class="ec-rel" RELEASED | class="ec-act" ACTIVE | class="ec-unk" UNIDENTIFIED]
</table>
<div class="sph">Mortgage Lifecycle Summary</div>
<table class="mt"><tr><td>A. Active Mortgages</td><td>:</td><td>[From Layer 1 A. ACTIVE_MORTGAGES]</td></tr>
<tr><td>B. Released Mortgages</td><td>:</td><td>[From Layer 1 B. RELEASED_MORTGAGES]</td></tr>
<tr><td>C. Unmatched Releases</td><td>:</td><td>[From Layer 1 C. UNMATCHED_RELEASE_DOCUMENTS]</td></tr>
<tr><td>D. Encumbrance Status</td><td>:</td><td>[From Layer 1 D. ENCUMBRANCE_STATUS]</td></tr></table>
<p>[Summary cross-check: EC vs Mutation vs Documents. Any entry within 60 days?]</p>
START WITH: <hr><div class="ph">PART IV`

const L4C = `Layer 4 Report Generator -- PART VI, PART VII, PART VIII.
PURE HTML ONLY. NO markdown. NO commentary outside HTML.
CONCISE: Max 5-6 alerts. 2-3 sentences each.

PART VI: <hr><div class="ph">PART VI -- ALERTS</div>
<p>The following alerts were identified. HIGH SEVERITY conditions are precedent to sanction.</p>
[Illegibility/OCR remarks go HERE -- NOT in Part III]
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[Finding: specific deed nos, dates, parties. Legal risk. 2-3 sentences.]</p><p><span class="sg">Direction:</span> [Action required.]</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[1-2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
UNIDENTIFIED EC: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. Unidentified EC Entry -- Manual Review Required</div><p>EC Row [N]: type unclassifiable. RAW: [text]. Step 5 Failure Protocol. Manual advocate review required.</p><p><span class="sg">Direction:</span> Advocate to physically inspect EC and classify this entry.</p></div>
ALERT RULES: NEVER flag EC-confirmed deeds (no copy submitted). NEVER flag EC Applicant. NEVER flag RELEASED mortgage as active. If no alerts: <p>No material adverse findings. Title appears clear from documents produced.</p>

PART VII: <hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted and Available</div><ol>[All readable docs]</ol>
<div class="sph">B. Critical Missing Documents</div><ol>[Missing mandatory -- purpose -- risk -- OR "NIL"]</ol>
<div class="sph">C. Important Missing Documents</div><ol>[Other missing -- OR "NIL"]</ol>
<div class="sph">D. Submitted Documents -- Illegible / Incomplete</div><ol>[Unreadable -- OR "NIL"]</ol>
<div class="sph">E. Risk and Mortgageability (Prompt 5)</div>
<table class="mt"><tr><td>Title Risk Level</td><td>:</td><td>[HIGH / MODERATE / LOW]</td></tr>
<tr><td>Mortgageability</td><td>:</td><td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Conditionally Enforceable / Not Enforceable]</td></tr>
<tr><td>Lending Suitability</td><td>:</td><td>[Suitable / Conditionally Suitable / Not Suitable]</td></tr>
<tr><td>Security Coverage</td><td>:</td><td>[Adequate / Marginal / Inadequate]</td></tr>
<tr><td>Reasoning</td><td>:</td><td>[2-3 sentences]</td></tr></table>

PART VIII: <hr><div class="ph">PART VIII -- LEGAL OPINION</div>
<p>[EXACT legal opinion wording from Layer 2+3 with actual names filled in]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank[, subject to charge of [EXISTING BANK] if BT/Seller BT].</p>
VERDICT: HIGH alerts: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">[N] HIGH alert/s. Issues: [list]. Resolve ALL before proceeding.</p></div>
Only MEDIUM/LOW: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Mortgageable subject to: [conditions].</p></div>
No alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Clear, marketable and mortgageable. [Brief reason.]</p></div>
START WITH: <hr><div class="ph">PART VI`

const L4D = `Layer 4 Report Generator -- PART IX, PART X, PART XI.
PURE HTML ONLY. NO markdown. NO commentary outside HTML.

PART IX: <hr><div class="ph">PART IX -- DOCUMENTS REQUIRED -- PRE-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody BEFORE disbursement:</p>
<ol>[Case-specific list:
Builder Purchase: NOC from Builder for mortgage | NOC from Project Finance Bank if applicable | Draft Sale Deed / Registered Banakhat | Allotment Letter | Missing docs from Part VII
Resale: Draft Sale Deed / Registered Banakhat | Chain documents | Missing docs
Balance Transfer: LOD from existing Bank | Foreclosure Letter | Outstanding Certificate | NOC from existing Bank | CERSAI Search | Updated EC
Seller BT: Draft Sale Deed / Banakhat | Foreclosure Letter | LOD | NOC | CERSAI Search | Updated EC
LAP: Original Registered Sale Deed | Updated EC confirming NIL encumbrance | CERSAI Search]</ol>

PART X: <hr><div class="ph">PART X -- DOCUMENTS REQUIRED -- POST-DISBURSEMENT STAGE</div>
<p>The following documents are required to be taken into Bank custody AFTER disbursement:</p>
<ol>[Case-specific list:
Builder Purchase: Final Registered Sale Deed (Builder to Purchaser) | Original title documents from builder
Resale: Final Registered Sale Deed (Seller to Purchaser) | Original title documents
Balance Transfer: No-Due Certificate from existing Bank | Registered Release Deed from existing Bank | Original title documents | Updated EC confirming NIL
Seller BT: Registered Sale Deed (Owner to Purchaser) | Release Deed from existing Bank | No-Due Certificate | Original title documents | Updated EC
LAP: Registered Mortgage / MODT in favour of Bank | CERSAI Registration Acknowledgement | Updated EC post-mortgage]</ol>

PART XI: <hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec"><div class="fr-title">Final Title Status -- Select ONE (Prompt 6):</div>
<div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div></div>
<p style="margin-top:16px;">[3-4 sentences: overall title status, conditions if any, whether bank can proceed, key caveats from Mortgage Lifecycle Summary.]</p>
START WITH: <hr><div class="ph">PART IX`

// ================================================================
// HTML WRAPPER + POST HANDLER
// ================================================================
function buildHtml(p: {
  refNo: string; appId: string; today: string; bankName: string; loanType: string
  p123: string; p45: string; p678: string; p911: string
}): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report -- ${p.refNo}</title><style>${CSS}</style></head><body>
<div class="hdr"><div><div class="firm">TITLEMATRIXAI</div>
<div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div>
<div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div>
<div class="sub">support@titlematrixai.com &nbsp;|&nbsp; www.titlematrixai.com</div></div>
<div class="hdr-right"><div><strong>Reference No.:</strong> ${p.refNo}</div><div><strong>Application ID:</strong> ${p.appId}</div>
<div><strong>Report Date:</strong> ${p.today}</div><div><strong>Bank:</strong> ${p.bankName}</div></div></div>
<div class="rtitle">LEGAL SCRUTINY REPORT -- ${p.loanType}</div><hr>
${p.p123}${p.p45}${p.p678}${p.p911}
<hr><div class="sigrow">
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div>
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName} -- ${p.appId}</div></div></div>
<div class="ftr">Generated by TITLEMATRIXAI &nbsp;|&nbsp; support@titlematrixai.com
<div class="disc">DISCLAIMER: Prepared exclusively for ${p.bankName}, App ID ${p.appId}. Based solely on documents produced. Does not constitute a guarantee of title. Confidential -- For Bank Use Only.</div>
<div class="wm">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div></div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      documentText, images, caseType, appId, bankName, loanType,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId
    } = body

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`

    // LAYER 1 -- Sonnet -- Extraction + Lifecycle Engine
    const l1c: any[] = []
    if (images?.length) for (const img of images)
      l1c.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })

    let doc = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth)
      doc += `\n\n=== BOUNDARIES ===\nEast: ${boundaryEast || '?'}\nWest: ${boundaryWest || '?'}\nNorth: ${boundaryNorth || '?'}\nSouth: ${boundarySouth || '?'}\n`

    l1c.push({
      type: 'text', text: `LAYER 1 -- EXTRACTION + MORTGAGE LIFECYCLE ENGINE

CASE DETAILS:
Applicant: ${applicantName || 'As per documents'} | Co: ${coApplicant || 'None'}
Current Owner: ${currentOwner || 'As per documents'} | Case: ${caseType}
Loan Type: ${loanType || 'LAP'} | Bank: ${bankName} | APP: ${appId}
Property: ${propertyAddress || 'As per documents'}
Boundaries: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}

DOCUMENTS:
${doc}

EXECUTE IN ORDER:
1. Extract ALL documents individually -- NEVER "and others"
2. Find EVERY EC document submitted. Process each separately.
3. For each EC: read ALL rows (Row 1, Row 2, Row 3...). LAST ROW is often Release. Count actual rows.
4. Apply Steps 1-7 for each EC row Col 1 text.
5. Mortgage Lifecycle Engine:
   - For each COL4_IS_BANK=YES row: CREATE CHARGE RECORD
   - For each COL3_IS_BANK=YES row: this is RELEASE EVENT -> find matching charge -> RELEASED
   - Role Flip: Bank in Col 3 (Executing/Aapnar) = Release. Bank in Col 4 (Lenar) = Mortgage.
6. Cross-EC pairing: EC-1 mortgage + EC-2 release = RELEASED
7. Output MORTGAGE_LIFECYCLE_SUMMARY with A/B/C/D sections
8. EC Col 7 = NEVER READ OR MENTION. EC Applicant = IGNORE. Loan Amount = NEVER.`
    })

    const l1r = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
      system: L1, messages: [{ role: 'user', content: l1c }]
    })
    const facts = l1r.content[0].type === 'text' ? l1r.content[0].text : ''

    // LAYER 2+3 -- Sonnet -- Title + Risk + Meta
    const l23r = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
      system: getL23(caseType),
      messages: [{
        role: 'user', content: `LAYER 2+3 -- TITLE + RISK

CASE: ${caseType} | BANK: ${bankName} | APP: ${appId}
APPLICANT: ${applicantName} | CO: ${coApplicant || 'None'}
OWNER: ${currentOwner || 'As per documents'} | PROPERTY: ${propertyAddress}
BOUNDARIES: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}

LAYER 1 FACTS (includes MORTGAGE_LIFECYCLE_SUMMARY):
${facts}

FILL META:
- EC_APP_NUMBER, EC_DATE, EC_FROM, EC_TO, EC_ROW_COUNT from Layer 1
- MORTGAGE_SUMMARY: use Lifecycle Summary. Released = "RELEASED". Active = "ACTIVE -- Bank:X Deed:Y".
- All names individually. EC Col 7 = NEVER. EC Applicant = IGNORE.
- RELEASED mortgage -> DO NOT flag as alert. ACTIVE mortgage -> flag HIGH SEVERITY.`
      }]
    })
    const analysis = l23r.content[0].type === 'text' ? l23r.content[0].text : ''
    const meta = parseMeta(analysis)

    // LAYER 4 -- 4 Parallel Sonnet calls -- 11-Part Report
    const [r4a, r4b, r4c, r4d] = await Promise.all([
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4A,
        messages: [{
          role: 'user', content: `Parts I+II+III.
APPLICANT: ${meta.applicant || applicantName} | CO: ${meta.coApplicant || coApplicant || 'N/A'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
OWNER: ${meta.currentOwner || currentOwner}
PROPERTY: ${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || '?'} W:${boundaryWest || '?'} N:${boundaryNorth || '?'} S:${boundarySouth || '?'}
EC_APP_NUMBER: ${meta.ecAppNumber || '?'} | EC_DATE: ${meta.ecDate || '?'}
EC_FROM: ${meta.ecFrom || '?'} | EC_TO: ${meta.ecTo || '?'} | EC_ROWS: ${meta.ecRowCount || '?'}
BANK: ${bankName}
FACTS: ${facts}
ANALYSIS: ${analysis}
RULE: Part III -- NO illegibility/blank/not-provided remarks. Those go in Part VI ONLY.` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4B,
        messages: [{
          role: 'user', content: `Parts IV+V.
CASE: ${caseType} | PROPERTY: ${meta.propertyPara || propertyAddress}
OWNER: ${meta.currentOwner || currentOwner}
EC_APP_NUMBER: ${meta.ecAppNumber || '?'} | EC_DATE: ${meta.ecDate || '?'}
EC_FROM: ${meta.ecFrom || '?'} | EC_TO: ${meta.ecTo || '?'} | EC_ROWS: ${meta.ecRowCount || '?'}
MORTGAGE_SUMMARY: ${meta.mortgageSummary || 'As per analysis'}
FACTS: ${facts}
ANALYSIS: ${analysis}
RULES: Part IV oldest first. First NO "Thereafter". Each subsequent MUST start "Thereafter,". Final para includes EC App No.
Part V EC table: every actual row. Show Classified Type + Confidence. NEVER Col 7. NEVER EC Applicant.
RELEASED=class ec-rel | ACTIVE=class ec-act | UNIDENTIFIED=class ec-unk
Part V Mortgage Lifecycle Summary: fill A/B/C/D from Layer 1 facts.` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: L4C,
        messages: [{
          role: 'user', content: `Parts VI+VII+VIII. Max 5-6 alerts, concise.
BANK: ${bankName} | MORTGAGE: ${meta.mortgageSummary}
RISK: ${meta.riskLevel} | MORTGAGEABILITY: ${meta.mortgageability}
SARFAESI: ${meta.sarfaesi} | LENDING: ${meta.lendingSuitability}
FACTS: ${facts}
ANALYSIS: ${analysis}
RULES: Part VI -- illegibility remarks HERE. NEVER flag EC-confirmed deeds. NEVER flag EC Applicant. NEVER flag RELEASED mortgage. UNIDENTIFIED EC = Medium Severity.
Part VIII -- EXACT legal opinion wording with actual names. Verdict based on Part VI alerts.` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: L4D,
        messages: [{
          role: 'user', content: `Parts IX+X+XI.
CASE: ${caseType} | BANK: ${bankName}
OWNER: ${meta.currentOwner || currentOwner}
PURCHASER/MORTGAGOR: ${meta.applicant || applicantName}
EXISTING BANK: ${meta.existingBank || 'N/A'}
MORTGAGE: ${meta.mortgageSummary}
ANALYSIS: ${analysis}
Part XI: CLEAR AND MARKETABLE TITLE or CLEAR TITLE SUBJECT TO CONDITIONS. Include Lifecycle summary in final recommendation.` }]
      })
    ])

    const p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error Parts I-III</p>'
    const p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error Parts IV-V</p>'
    const p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error Parts VI-VIII</p>'
    const p911 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error Parts IX-XI</p>'

    const html = buildHtml({ refNo, appId: appId || 'AUTO', today, bankName: bankName || 'Bank', loanType: loanType || 'Loan Against Property', p123, p45, p678, p911 })
    const verdict = getVerdict(analysis)
    let savedToDb = false, dbError = null

    if (userId && supabase) {
      try {
        const { error } = await supabase.from('reports').insert({
          user_id: userId, case_type: caseType || 'lap',
          applicant_name: meta.applicant || applicantName || 'Unknown',
          bank_name: bankName || 'Unknown',
          property_address: meta.propertyPara || propertyAddress || 'Unknown',
          app_id: appId || refNo, verdict, report_html: html,
        })
        if (error) dbError = error.message; else savedToDb = true
      } catch (e: any) { dbError = e.message }
    }

    return NextResponse.json({ success: true, report: html, verdict, savedToDb, dbError, debug: { facts, analysis, metaParsed: meta } })
  } catch (e: any) {
    console.error('TITLEMATRIXAI error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
  }
}