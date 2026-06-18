// ================================================================
// TITLEMATRIXAI — /api/analyze/route.ts
// MASTER PROMPT v6.0 — 15-STAGE TITLE VERIFICATION ENGINE
// Builder Purchase | Resale | Balance Transfer | Seller BT | LAP
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

// ================================================================
// VERDICT EXTRACTOR
// ================================================================
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
.rtitle { font-size: 15px; font-weight: bold; text-align: center; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 12px; }
.mt { width: 100%; margin-bottom: 8px; border-collapse: collapse; }
.mt td { font-size: 12px; padding: 4px 0; vertical-align: top; }
.mt td:first-child { width: 220px; color: #444; }
.mt td:nth-child(2) { width: 16px; color: #444; }
.mt td:last-child { font-weight: bold; color: #1a1a1a; }
hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
.ph { font-size: 13px; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 12px; background: #1B3A6B; color: #fff; padding: 6px 12px; }
p { margin-bottom: 10px; text-align: justify; }
.di { margin-bottom: 14px; }
.dn { font-weight: bold; }
.ib { margin-bottom: 22px; padding-left: 14px; border-left: 3px solid #e5e7eb; }
.sh { display: inline-block; background: #b91c1c; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 9px; margin-bottom: 5px; letter-spacing: 0.5px; }
.sm { display: inline-block; background: #b45309; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 9px; margin-bottom: 5px; letter-spacing: 0.5px; }
.sl { display: inline-block; background: #1d4ed8; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 9px; margin-bottom: 5px; letter-spacing: 0.5px; }
.it { font-weight: bold; font-size: 13px; margin-bottom: 5px; }
.sg { font-weight: bold; font-style: italic; }
.pph { font-weight: bold; font-size: 12px; text-transform: uppercase; margin: 14px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; color: #1B3A6B; }
ol { padding-left: 22px; }
ol li { margin-bottom: 4px; }
.risk-box { margin-top: 20px; padding: 14px 18px; border: 1px solid #ccc; border-radius: 2px; background: #f9f9f9; }
.risk-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1B3A6B; margin-bottom: 8px; }
.risk-score { font-size: 24px; font-weight: bold; }
.risk-low { color: #15803d; }
.risk-mod { color: #b45309; }
.risk-high { color: #dc2626; }
.conf-box { margin-top: 12px; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 2px; }
.vnc { margin-top: 20px; padding: 14px 18px; border: 2px solid #b91c1c; background: #fff5f5; }
.vc { margin-top: 20px; padding: 14px 18px; border: 2px solid #15803d; background: #f0fdf4; }
.vs { margin-top: 20px; padding: 14px 18px; border: 2px solid #b45309; background: #fffbeb; }
.vt { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
.title-status { margin-top: 20px; padding: 16px 20px; border: 3px solid #1B3A6B; background: #EFF3FB; }
.ts-title { font-size: 12px; font-weight: bold; color: #1B3A6B; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
.ts-value { font-size: 16px; font-weight: bold; }
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
const STEP1_SYSTEM = `You are an AI-powered Property Title Verification Engine operating under a 15-Stage Title Verification Workflow for Banks, NBFCs, Housing Finance Companies, and Legal Scrutiny Officers.

YOU ARE NOT A DOCUMENT SUMMARIZATION ENGINE. YOU ARE A TITLE VERIFICATION ENGINE.

YOUR PURPOSE:
- Extract facts from documents
- Establish ownership
- Verify title continuity
- Detect defects and risks
- Identify missing documents

NON-NEGOTIABLE PRINCIPLES:
1. NEVER assume facts
2. NEVER create facts
3. NEVER infer ownership without documentary support
4. NEVER certify title if continuity cannot be established
5. NEVER suppress adverse findings
6. When information is unavailable: "NOT PROVIDED FOR VERIFICATION."

STAGE 1 — DOCUMENT INVENTORY:
For each document identify: Type | Date | Registration No. | Executant | Claimant | Issuing Authority | Property Description | Survey Number | Area
Categorize: Available | Missing | Incomplete | Illegible

STAGE 2 — PROPERTY IDENTIFICATION:
Verify: Village | Taluka | District | Survey No. | Block No. | Revenue Survey No. | Final Plot No. | T.P. Scheme No. | City Survey No. | Property Card No. | Building Name | Unit No. | Area | Boundaries
Raise objection for any mismatch.

STAGE 3 — TITLE EVENT EXTRACTION:
Extract all title-affecting events: Sale | Inheritance | Succession | Partition | Court Order | Gift | Exchange | N.A. Conversion | Development Agreement | Power of Attorney | Builder Acquisition | Mortgage | Release | RERA | Allotment | Possession
Prepare chronological title event history.

STAGE 4 — TITLE CONTINUITY TEST:
Verify ownership flow. Each transfer must be supported by documentary evidence.
If any ownership transition is unsupported — raise TITLE BREAK (CRITICAL Severity).

STAGE 5 — REVENUE RECORD VERIFICATION:
Verify: Village Form No. 6 | 7/12 | 8A | Hak Patrak | Property Card | Ferfar Entries
For each 7/12 mention: Village | Taluka | District | Survey/Block No. | Total Area (H.Are.SqMt.) | Land Use

STAGE 6 — FERFAR ANALYSIS ENGINE:
Skip first column "Entry Details". Extract:
- Col 1 (after skip): Date of Mutation Entry | Mutation Number | Certified OR Rejected
- Col 2 (after skip): Details of Mutation Entry — NA, Death, Transfer etc.
- Col 3 (after skip): Relevant Survey/Block Number (SKIP if not subject property)
- Col 4 (after skip/Last): DO NOT CONSIDER — NEVER MENTION
Arrange chronologically.

STAGE 7 — ENCUMBRANCE CERTIFICATE ENGINE:
For each EC entry extract: Type of Document | Property Description | Executing Party | Claimant Party | Registration Date | Registration Number
NEVER reproduce EC last column.
EC Columns: Col1=Type | Col2=Property | Col3=Executing Party (Aapnar/Seller) | Col4=Claimant Party (Lenar/Buyer) | Col5=Date | Col6=Reg No. | Col7=IGNORE COMPLETELY
Always mention: EC Date + Search Period from E-Application Receipt.

STAGE 8 — TITLE RECONCILIATION:
Cross-match: Revenue Records | Mutation Records | EC | Registered Documents
Detect: Missing Links | Ownership Mismatch | Area Mismatch | Survey No. Mismatch | Encumbrance Mismatch

STAGE 9 — DEVELOPMENT & REGULATORY APPROVAL ENGINE:
Verify if available: N.A. Order | Development Permission | Rajachitthi | Building Permission | Sanctioned Plan | Commencement Certificate | RERA | Fire NOC | Airport NOC | Environmental Clearance | BU Permission | OC
If unavailable: "NOT PROVIDED FOR VERIFICATION."

STAGE 10 — CASE-SPECIFIC SOP ENGINE:
Apply mandatory case-specific rules.

STAGE 11 — DOCUMENT DEFICIENCY ENGINE:
Available Documents | Expected Documents | Missing Documents

STAGE 12 — LEGAL RISK ENGINE:
Risk scoring: Title Break=100 | Court Litigation=90 | Existing Mortgage=90 | Missing NA Order=70 | Builder Title Defect=70 | EC Mismatch=60 | Missing Approval=50 | Missing Mutation=40 | Clerical Error=10
Risk Classification: 0-25=LOW | 26-50=MODERATE | 51-75=HIGH | 76+=UNACCEPTABLE

STAGE 13 — CONFIDENCE ENGINE:
Every major conclusion: HIGH CONFIDENCE | MEDIUM CONFIDENCE | LOW CONFIDENCE

STAGE 14 — MORTGAGEABILITY ENGINE:
Determine: Mortgageable | Conditionally Mortgageable | Not Mortgageable

STAGE 15 — LEGAL OPINION ENGINE:
Generate only after all validations complete.

MANDATORY EXTRACTION RULES — NEVER VIOLATE:
1. NEVER "and others" / "and co-transferees" — name EVERY person individually
2. Applicant = from Draft Sale Deed / Banakhat — Buyer section — NEVER from stamp paper
3. Current Owner = from LATEST submitted deed — deed > EC for ownership
4. All 4 boundaries MANDATORY — East | West | North | South from all documents
5. Giro Mukeli / Release Deed = mortgage DISCHARGED — never report as active
6. EC APPLICANT — CRITICAL PERMANENT RULE — NEVER VIOLATE:
   The person who APPLIED for the EC (name appearing in "Applicant" field of E-Application Receipt / EC Form) is an EMPANELLED ADVOCATE or BANK OFFICER who merely applied to obtain the EC on behalf of the bank/client.
   EC Applicant has ZERO legal nexus with the subject property.
   EC Applicant is NOT an owner | NOT a mortgagor | NOT a claimant | NOT a party of interest.
   COMPLETELY IGNORE the EC Applicant name in ALL analysis.
   NEVER mention EC Applicant name anywhere in the report.
   NEVER flag EC Applicant name as a title concern or ownership issue.
   NEVER treat EC Applicant as having any relation with the subject property.
   Example: If "Santosh Tansukh Thakrar" appears as EC Applicant — he is an empanelled advocate who applied for EC only — COMPLETELY IGNORE his name — he has NO concern with the property.
7. Partnership Firm: "M/s. [Name] (Partnership Firm) through Partners: (1)... (2)..."
8. Dukan=Shop | Banakhat Kabja Vagar=AoS Without Possession (NOT Sale Deed)
9. LOAN AMOUNT: NEVER mention
10. EC-confirmed deed (copy not submitted): include in chain naturally — no flag
11. Subject property ONLY — verify Unit+Block+Floor match for EVERY EC entry

Extract everything. Use exact names, dates, amounts, registration numbers. Facts only — no analysis yet.`

// ================================================================
// STEP 2 — BUILDER PURCHASE
// ================================================================
const STEP2_BUILDER = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience. Prepare a COMPLETE Legal Scrutiny Report for a BUILDER PURCHASE case following ALL mandatory rules.

BUILDER PURCHASE: Proposed purchaser intends to buy unit/flat/shop from Builder and seeks bank finance.

MANDATORY META BLOCK:
---META---
APPLICANT: [from Draft Sale Deed / Banakhat / Allotment — Buyer — NEVER from stamp paper]
CO_APPLICANT: [Full names or N/A]
PROPERTY_DESCRIPTION: [FULL: Unit No. + Floor + Block + Scheme + Super Built-up Area + Land Area + Undivided Share + Survey No. + TP No. + FP No. + Mouje + Taluka + District + SRO]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from Banakhat / Allotment / all pages including annexure / "ખૂંટ ચારની વિગત" — MANDATORY — "Not stated" ONLY if truly absent from ALL documents]
CURRENT_OWNER: [Builder/Developer name from title documents]
RISK_SCORE: [0-100 numeric score]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

EC APPLICANT — CRITICAL PERMANENT RULE:
The person named as "Applicant" on the EC Form / E-Application Receipt is an EMPANELLED ADVOCATE or BANK OFFICER who merely applied to obtain the EC.
This person has ABSOLUTE ZERO legal nexus with the subject property.
COMPLETELY IGNORE EC Applicant name in ALL parts of the report.
NEVER mention EC Applicant as owner/mortgagor/claimant/party of interest.
Example: "Santosh Tansukh Thakrar" as EC Applicant = empanelled advocate who applied for EC only = IGNORE completely — he has NO relation with the property.

BUILDER PURCHASE MANDATORY RULES:
1. Draft Sale Deed OR Notarized/Registered Banakhat OR Letter of Allotment = MANDATORY (mentioned in last para of Part III)
2. Property history from FERFAR/Mutation/Gamnamuna No. 6 for last 20-30 years — chronological (Earlier to Present)
3. Each 7/12: Village + Taluka + District + Survey/Block No. + Total Area + Land Use
4. EC details for last 13-14 years — chronological
5. EC 7 columns: Col1=Type | Col2=Property | Col3=Executing Party (Aapnar) | Col4=Claimant (Lenar) | Col5=Date | Col6=Reg No. | Col7=IGNORE
6. Mutation entry in Builder's name in 7/12 required — if absent mention in Part IV
7. EC date + Search Period from E-Application Receipt by Inspector General of Registration, Govt of Gujarat
8. Cross-check all EC entries with FERFAR/Mutation entries
9. Project Finance NOC from Bank = mandatory in Pre-Disbursement if Builder has project loan
10. Original NOC for Mortgage from Builder = mandatory in Pre-Disbursement
11. Draft Sale Deed/Banakhat/Allotment = mandatory in Pre-Disbursement
12. Final Registered Sale Deed = mandatory in Post-Disbursement
13. NA Order must be traced and mentioned
14. Sanctions/permissions mentioned only if provided or traceable from documents
15. Boundaries traced from last Notarized/Registered Banakhat OR Allotment Letter
16. FERFAR analysis: Skip first column. Col1=Date+No.+Status | Col2=Details | Col3=Survey No. (if relevant) | Col4=IGNORE

PART III (Title Chain): Oldest to newest. Start from agricultural landowners. Each transfer: "[Seller] transferred to [Buyer] vide [Type] No. [X] dated [DD/MM/YYYY] for Rs. [X]. Mutation Entry No. [X] dated [X] effected accordingly."
Last para of Part III = Draft Sale Deed/Banakhat/Allotment between Builder and proposed purchaser.

PART V — EXACT WORDING (MANDATORY):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS. MISS NOTHING.`

// ================================================================
// STEP 2 — RESALE
// ================================================================
const STEP2_RESALE = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience. Prepare a COMPLETE Legal Scrutiny Report for a RESALE case.

RESALE: Current owner (not Builder) intends to sell property to proposed purchaser who seeks bank finance.

MANDATORY META BLOCK:
---META---
APPLICANT: [from Draft Sale Deed / Banakhat — Second Party/Vechan Lenar — NEVER from stamp paper]
CO_APPLICANT: [Full names or N/A]
PROPERTY_DESCRIPTION: [FULL: Unit No. + Floor + Block + Scheme + Area + Survey No. + TP No. + FP No. + Mouje + Taluka + District + SRO]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from last Registered Sale Deed unto Current Owner — MANDATORY]
CURRENT_OWNER: [First Party/Vechan Aapnar in Draft Sale Deed/Banakhat — ALL names individually]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

EC APPLICANT — CRITICAL PERMANENT RULE:
The person named as "Applicant" on the EC Form is an EMPANELLED ADVOCATE or BANK OFFICER with ZERO property interest.
COMPLETELY IGNORE EC Applicant name. NEVER mention in any part of report.
Example: "Santosh Tansukh Thakrar" as EC Applicant = IGNORE completely.

RESALE MANDATORY RULES:
1. Draft Sale Deed between owner and proposed purchaser OR Notarized/Registered Banakhat = MANDATORY
2. Registered Sale Deed in favour of Current Owner = MANDATORY (trace from documents/EC/FERFAR)
3. FERFAR/Mutation for 20-30 years — chronological
4. Each 7/12: Village + Taluka + District + Survey/Block + Area + Land Use
5. EC for last 13-14 years — chronological
6. EC Columns: Col1=Type | Col2=Property | Col3=Aapnar(Seller) | Col4=Lenar(Buyer) | Col5=Date | Col6=Reg No. | Col7=IGNORE
7. Mutation entry: Current Owner/Land Owner/Builder/Society required in 7/12 — if absent flag in Part IV
8. EC date + Search Period mandatory
9. Cross-check all EC with FERFAR entries
10. Draft Sale Deed/Banakhat in Pre-Disbursement
11. Final Registered Sale Deed in Post-Disbursement
12. Boundaries from last Registered Sale Deed unto Current Owner
13. FERFAR: Skip first column. Col1=Date+No.+Status | Col2=Details | Col3=Survey (if relevant) | Col4=IGNORE
14. Para 1 & 2 "This opinion pertains to..." = NOT REQUIRED

PART V — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

// ================================================================
// STEP 2 — BALANCE TRANSFER
// ================================================================
const STEP2_BT = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience. Prepare a COMPLETE Legal Scrutiny Report for a BALANCE TRANSFER case.

BALANCE TRANSFER: Current owner has existing loan from Bank/FI and wants to transfer to another Bank/FI. NO property transfer occurs.

MANDATORY META BLOCK:
---META---
APPLICANT: [Current owner/borrower/mortgagor — full names]
CO_APPLICANT: [Full names or N/A]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from last Registered Sale Deed unto Current Owner]
CURRENT_OWNER: [Same as applicant]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

EC APPLICANT — CRITICAL PERMANENT RULE:
The person named as "Applicant" on the EC Form is an EMPANELLED ADVOCATE or BANK OFFICER with ZERO property interest.
COMPLETELY IGNORE EC Applicant name. NEVER mention in any part of report.

BALANCE TRANSFER MANDATORY RULES:
1. Registered Sale Deed in favour of Current Owner = MANDATORY
2. Registered Deed of Mortgage OR LOD = trace from documents/EC
3. FERFAR/Mutation for 20-30 years — chronological
4. Each 7/12: Village + Taluka + District + Survey/Block + Area + Land Use
5. EC for last 13-14 years — chronological
6. EC Columns: Col1=Type | Col2=Property | Col3=Aapnar | Col4=Lenar(Bank if mortgage) | Col5=Date | Col6=Reg No. | Col7=IGNORE
7. Mutation entry: Current Owner/Land Owner/Builder/Society in 7/12 — if absent flag
8. EC date + Search Period mandatory
9. Cross-check all EC with FERFAR
10. LOD from existing Bank = mandatory in Pre-Disbursement
11. No-Due Certificate + Registered Release of Mortgage Deed = Post-Disbursement
12. Boundaries from last Registered Sale Deed
13. Para 1 & 2 "This opinion pertains to..." = NOT REQUIRED

PART V — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

// ================================================================
// STEP 2 — SELLER BT
// ================================================================
const STEP2_SELLER_BT = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience. Prepare a COMPLETE Legal Scrutiny Report for a SELLER BT case — the most complex transaction type.

SELLER BT: Current owner has existing loan AND intends to sell property to proposed purchaser. TWO simultaneous transactions: (1) Seller's loan closure + mortgage release (2) Property sale + new mortgage.

MANDATORY META BLOCK:
---META---
APPLICANT: [Proposed purchaser — from Draft Sale Deed / Banakhat — Second Party/Buyer]
CO_APPLICANT: [Full names or N/A]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from last Registered Sale Deed/Banakhat]
CURRENT_OWNER: [Current owner/seller — First Party in Draft Sale Deed/Banakhat]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

EC APPLICANT — CRITICAL PERMANENT RULE:
The person named as "Applicant" on the EC Form is an EMPANELLED ADVOCATE or BANK OFFICER with ZERO property interest.
COMPLETELY IGNORE EC Applicant name. NEVER mention in any part of report.

SELLER BT MANDATORY RULES:
1. Registered Sale Deed/Allotment Deed/Share Certificate in favour of Current Owner = MANDATORY
2. Draft Sale Deed/Banakhat between owner and proposed purchaser = MANDATORY
3. Registered Deed of Mortgage OR LOD = trace from documents/EC
4. FERFAR/Mutation for 20-30 years — chronological
5. Each 7/12: Village + Taluka + District + Survey/Block + Area + Land Use
6. EC for last 13-14 years — chronological
7. EC Columns: Col1=Type | Col2=Property | Col3=Aapnar | Col4=Lenar | Col5=Date | Col6=Reg No. | Col7=IGNORE
8. Mutation: Current Owner/Builder/Society in 7/12 — if absent flag
9. LOD from existing Bank = Pre-Disbursement mandatory
10. Foreclosure Letter = Pre-Disbursement mandatory
11. No-Due Certificate + Release Deed = Post-Disbursement
12. Boundaries from last Registered Sale Deed/Banakhat
13. FALSE DECLARATION CHECK: If Banakhat says "no loan/charge" but EC shows mortgage — flag HIGH SEVERITY
14. Para 1 & 2 "This opinion pertains to..." = NOT REQUIRED

PART V — EXACT WORDING:
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR AND MARKETABLE
USE ALL 8000 TOKENS.`

// ================================================================
// STEP 2 — LAP / MORTGAGE
// ================================================================
const STEP2_LAP = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience. Prepare a COMPLETE Legal Scrutiny Report for a LAP / MORTGAGE case.

LAP/MORTGAGE: Current owner has NOT availed any loan and NOT created any charge. Now seeking loan against own property. NO property transfer.

MANDATORY META BLOCK:
---META---
APPLICANT: [Current owner/borrower/mortgagor — full names]
CO_APPLICANT: [Full names or N/A]
PROPERTY_DESCRIPTION: [FULL format]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from last Registered Sale Deed unto Current Owner]
CURRENT_OWNER: [Same as applicant]
RISK_SCORE: [0-100]
CONFIDENCE: [HIGH / MEDIUM / LOW]
MORTGAGEABILITY: [Mortgageable / Conditionally Mortgageable / Not Mortgageable]
---END META---

EC APPLICANT — CRITICAL PERMANENT RULE:
The person named as "Applicant" on the EC Form is an EMPANELLED ADVOCATE or BANK OFFICER with ZERO property interest.
COMPLETELY IGNORE EC Applicant name. NEVER mention in any part of report.

LAP MANDATORY RULES:
1. Registered Sale Deed/Allotment Deed/Share Certificate in favour of Current Owner = MANDATORY
2. Registered Sale Deed traced from documents/EC/FERFAR
3. FERFAR/Mutation for 20-30 years — chronological
4. Each 7/12: Village + Taluka + District + Survey/Block + Area + Land Use
5. EC for last 13-14 years — chronological
6. EC Columns: Col1=Type | Col2=Property | Col3=Aapnar | Col4=Lenar | Col5=Date | Col6=Reg No. | Col7=IGNORE
7. Mutation: Current Owner/Builder/Society in 7/12 — if absent flag
8. If EC shows ANY mortgage/charge = UNDISCLOSED MORTGAGE = HIGH SEVERITY immediate flag
9. Original Registered Sale Deed unto Current Owner = Pre-Disbursement mandatory
10. Boundaries from last Registered Sale Deed
11. Para 1 & 2 "This opinion pertains to..." = NOT REQUIRED
12. FERFAR: Skip first column. Col1=Date+No.+Status | Col2=Details | Col3=Survey (if relevant) | Col4=IGNORE

PART V — EXACT WORDING:
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

// ================================================================
// PARSE META
// ================================================================
function parseMeta(text: string) {
  const block = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
  const get = (key: string) => block.match(new RegExp(`^${key}:\\s*(.+)$`, 'mi'))?.[1]?.trim() || ''
  return {
    applicant: get('APPLICANT'),
    coApplicant: get('CO_APPLICANT'),
    propertyDescription: get('PROPERTY_DESCRIPTION'),
    propertyBoundaries: get('PROPERTY_BOUNDARIES'),
    currentOwner: get('CURRENT_OWNER'),
    riskScore: get('RISK_SCORE'),
    confidence: get('CONFIDENCE'),
    mortgageability: get('MORTGAGEABILITY'),
  }
}

// ================================================================
// STEP 3 SYSTEM PROMPTS
// ================================================================

const STEP3A_SYSTEM = `Generate HTML for PART I and PART II ONLY of a TITLEMATRIXAI Legal Scrutiny Report.

⚠️ CRITICAL: OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ### NO ** NO ---.

PART I — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES:
<hr><div class="ph">PART I — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES</div>
<table class="mt">
  <tr><td>Property</td><td>:</td><td>[Full property description]</td></tr>
  <tr><td>Survey No.</td><td>:</td><td>[Survey/Block/TP/FP details]</td></tr>
  <tr><td>Village / Taluka</td><td>:</td><td>[Village, Taluka, District, SRO]</td></tr>
  <tr><td>Land Use</td><td>:</td><td>[Bin Kheti / Agricultural etc.]</td></tr>
  <tr><td>Area</td><td>:</td><td>[Super Built-up / Carpet / Land / Undivided Share]</td></tr>
  <tr><td>East (Purva)</td><td>:</td><td>[East boundary]</td></tr>
  <tr><td>West (Pashchim)</td><td>:</td><td>[West boundary]</td></tr>
  <tr><td>North (Uttar)</td><td>:</td><td>[North boundary]</td></tr>
  <tr><td>South (Dakshin)</td><td>:</td><td>[South boundary]</td></tr>
</table>

PART II — LIST OF SCRUTINISED DOCUMENTS:
Latest first, oldest last. 2-3 sentences per document.
NEVER include Mutation Entries. NEVER mention Stamp Paper numbers.

FORMAT FOR EACH DOCUMENT:
<div class="di">
  <p><span class="dn">N. [Document Name] — Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>
  [Executant] unto and in favour of [Claimant]. [Key observation. SRO name. Amount if relevant.]</p>
</div>

RULES:
1. NEVER "and others" — every name individually
2. Latest FIRST — oldest LAST
3. EC: "taken by Advocate [Name]" NEVER "issued by"
4. EC APPLICANT: COMPLETELY IGNORE — NEVER mention EC Applicant as party/owner/claimant
5. "Banakhat Kabja Vagar" = Agreement to Sale Without Possession — NEVER call it Sale Deed

START WITH: <hr><div class="ph">PART I — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES</div>
Then PART I table.
Then: <hr><div class="ph">PART II — LIST OF SCRUTINISED DOCUMENTS</div>
Then document entries.
END after last document entry.`

const STEP3B_SYSTEM = `Generate HTML for PART III ONLY — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY.

⚠️ CRITICAL: OUTPUT PURE HTML ONLY. ZERO MARKDOWN. NO ## NO ### NO ** NO ---.

RULES:
1. OLDEST first — NEWEST last
2. First paragraph: NO "Thereafter" | Every subsequent paragraph: MUST start with "Thereafter,"
3. NEVER "and others" — every name individually
4. EC-confirmed deeds (not submitted): include naturally — no remark, no flag
5. End each transfer paragraph: "Entry to that effect recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY]."
6. Subject property ONLY — verify Unit+Block+Floor for every EC entry
7. Last paragraph = current title status
8. For Builder Purchase: last para = Draft Sale Deed/Banakhat/Allotment between Builder and proposed purchaser
9. Translate ALL Gujarati/Hindi terms to English

EC GOLDEN RULE: Count EC transfer entries for subject property = N. Part III must have exactly N paragraphs. Current Owner = buyer in LATEST EC entry.

FORMAT — FIRST PARAGRAPH (no "Thereafter"):
<p>[Earliest holder name/s] acquired the subject property being [property description briefly]. [How acquired — original allotment / agricultural land etc.] [Deed type, No., Date, Amount if known.] Entry to that effect recorded vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

FORMAT — EVERY SUBSEQUENT PARAGRAPH:
<p>Thereafter, [Seller full name/s] transferred the subject property to [Buyer full name/s] vide [Deed Type] No. [X] dated [DD/MM/YYYY] registered at SRO [Name] for a consideration of Rs. [X]. Entry to that effect recorded in revenue records vide Mutation Entry No. [X] dated [DD/MM/YYYY].</p>

FORMAT — FINAL PARAGRAPH:
<p>Thereafter, [Current Owner full name/s] holds [title/leasehold rights in] the subject property as the current owner/s. [Encumbrance status — clear / subject to existing mortgage in favour of {Bank}].</p>

START WITH EXACTLY: <hr><div class="ph">PART III — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END after final paragraph — NOTHING after.`

const STEP3C_SYSTEM = `Generate HTML for PART IV ONLY — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS with RISK ASSESSMENT.

⚠️ CRITICAL OUTPUT RULE: OUTPUT MUST BE PURE HTML ONLY.
ZERO MARKDOWN. NO ##. NO ###. NO **bold**. NO ---. NO *. NO bullet points with -.
ONLY valid HTML tags. If you write markdown, the report will break.

RULES:
1. HIGH SEVERITY first — MEDIUM next — LOW last
2. Every issue: exact reg nos, dates, names — briefly
3. Do NOT flag EC-confirmed deeds where copy not submitted
4. EC APPLICANT — ABSOLUTE RULE: NEVER flag EC Applicant name. EC Applicant (e.g. "Santosh Tansukh Thakrar") = empanelled advocate who applied for EC only — ZERO relation with property — COMPLETELY IGNORE.
5. Each issue: 3-4 sentences max + specific suggestion

EXACT HTML FORMAT FOR EACH HIGH SEVERITY ISSUE:
<div class="ib">
  <div><span class="sh">HIGH SEVERITY</span></div>
  <div class="it">1. [Issue Title Here]</div>
  <p>[Finding — 3-4 sentences with exact reg nos, dates, party names. Why legally material. What bank risk.]</p>
  <p><span class="sg">Direction:</span> [Specific actionable remedy — what document, from whom, by when.]</p>
</div>

EXACT HTML FORMAT FOR EACH MEDIUM SEVERITY ISSUE:
<div class="ib">
  <div><span class="sm">MEDIUM SEVERITY</span></div>
  <div class="it">1. [Issue Title Here]</div>
  <p>[Finding — 2-3 sentences.]</p>
  <p><span class="sg">Direction:</span> [Specific steps.]</p>
</div>

EXACT HTML FORMAT FOR EACH LOW SEVERITY ISSUE:
<div class="ib">
  <div><span class="sl">LOW SEVERITY</span></div>
  <div class="it">1. [Issue Title Here]</div>
  <p>[Finding — 1-2 sentences.]</p>
  <p><span class="sg">Direction:</span> [Steps.]</p>
</div>

RISK ASSESSMENT BOX — ADD AFTER ALL ISSUES:
<div class="risk-box">
  <div class="risk-title">RISK ASSESSMENT (15-Stage Engine)</div>
  <p><strong>Risk Score:</strong> <span class="risk-score risk-high">[SCORE]/100</span></p>
  <p><strong>Risk Classification:</strong> [LOW RISK / MODERATE RISK / HIGH RISK / UNACCEPTABLE RISK]</p>
  <p><strong>Confidence Level:</strong> [HIGH CONFIDENCE / MEDIUM CONFIDENCE / LOW CONFIDENCE]</p>
  <p><strong>Mortgageability:</strong> [Mortgageable / Conditionally Mortgageable / Not Mortgageable]</p>
</div>

USE: risk-low (green) for score 0-25 | risk-mod (amber) for 26-75 | risk-high (red) for 76+

START WITH EXACTLY: <hr><div class="ph">PART IV — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS</div>
<p>The following issues have been identified during title verification. HIGH SEVERITY issues are conditions precedent to sanction or disbursement.</p>
END after risk-box closing div — NOTHING AFTER.`

const STEP3D_SYSTEM = `Generate HTML for PART V, Documents Required, and Final Title Status.

⚠️ CRITICAL OUTPUT RULE: OUTPUT MUST BE PURE HTML ONLY.
ZERO MARKDOWN. NO ##. NO ###. NO **bold**. NO ---. NO tables with | pipes.
ONLY valid HTML tags.

PART V — LEGAL OPINION AND FINAL RECOMMENDATION:
Use EXACT case-specific wording from Step 2 analysis. Fill in actual names.
DO NOT include para starting "This opinion pertains to..." — NOT required.

DOCUMENTS REQUIRED FORMAT:
<hr>
<div class="ph">DOCUMENTS REQUIRED</div>
<div class="pph">Pre-Disbursement — Mandatory Before Sanction / Disbursement</div>
<ol>
  <li>[Specific document name — exact description — one line]</li>
  <li>[Next document]</li>
</ol>
<div class="pph">At Pay Order Stage</div>
<ol>
  <li>[Document if applicable — mainly Seller BT]</li>
</ol>
<div class="pph">Post-Disbursement — To Be Completed Within Stipulated Timeframe</div>
<ol>
  <li>[Document]</li>
</ol>

PART V FORMAT:
<hr>
<div class="ph">PART V — LEGAL OPINION AND FINAL RECOMMENDATION</div>
<p>[Case-specific legal opinion paragraph with exact names filled in.]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act...</p>
<p>The property can be accepted by the way of SECURITY...</p>

VERDICT BOX — CHOOSE ONE:

If NOT CLEAR:
<div class="vnc">
  <div class="vt" style="color:#b91c1c;">Final Legal Opinion: TITLE NOT CLEAR — BANK SHOULD NOT PROCEED</div>
  <p style="margin-top:8px;font-size:12px;">[N] HIGH SEVERITY issues identified. Primary concerns: [list briefly]. Bank must not proceed until resolved.</p>
</div>

If CLEAR SUBJECT TO CONDITIONS:
<div class="vs">
  <div class="vt" style="color:#b45309;">Final Legal Opinion: CLEAR TITLE SUBJECT TO CONDITIONS</div>
  <p style="margin-top:8px;font-size:12px;">Title is marketable subject to: [specific conditions briefly].</p>
</div>

If CLEAR:
<div class="vc">
  <div class="vt" style="color:#15803d;">Final Legal Opinion: CLEAR AND MARKETABLE TITLE</div>
  <p style="margin-top:8px;font-size:12px;">Title is clear, marketable and mortgageable. [Brief reason.]</p>
</div>

FINAL TITLE STATUS BOX — ADD AFTER VERDICT:
<div class="title-status">
  <div class="ts-title">Final Title Status</div>
  <div class="ts-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS / TITLE REQUIRES RECTIFICATION / TITLE NOT RECOMMENDED / INSUFFICIENT DOCUMENTATION FOR TITLE CERTIFICATION]</div>
</div>

START WITH: <hr><div class="ph">DOCUMENTS REQUIRED</div>
END after title-status closing div.`

// ================================================================
// HTML BUILDER
// ================================================================
function buildHtml(p: {
  refNo: string; appId: string; today: string; bankName: string
  applicantName: string; coApplicant: string; loanType: string
  propertyAddress: string; propertyBoundaries: string; currentOwner: string
  riskScore: string; confidence: string; mortgageability: string
  part12Html: string; part3Html: string; part4Html: string; part5Html: string
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

<table class="mt">
  <tr><td>Applicant</td><td>:</td><td>${p.applicantName}</td></tr>
  <tr><td>Co-Applicant</td><td>:</td><td>${p.coApplicant || 'Not Applicable'}</td></tr>
  <tr><td>Loan Type</td><td>:</td><td>${p.loanType}</td></tr>
  <tr><td>Current Owner(s)</td><td>:</td><td>${p.currentOwner}</td></tr>
  <tr><td>Property Description</td><td>:</td><td>${p.propertyAddress}</td></tr>
  <tr><td>Property Boundaries</td><td>:</td><td>${p.propertyBoundaries || 'As per documents'}</td></tr>
</table>

${p.part12Html}
${p.part3Html}
${p.part4Html}
${p.part5Html}

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
  <div class="disc">DISCLAIMER: This Legal Scrutiny Report is prepared exclusively for the use of ${p.bankName} in connection with Application ID ${p.appId}. It is based solely upon the documents produced for scrutiny and does not constitute a guarantee of title or a legal warranty. This report is confidential and may not be reproduced, disclosed, or relied upon by any party other than the addressee bank without the express written consent of TITLEMATRIXAI. The findings herein reflect the state of title as evidenced by the documents produced and do not account for any undisclosed encumbrances, adverse possessory claims, or defects not apparent from the documents examined.</div>
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

    // ── STEP 1: HAIKU — EXTRACT ALL FACTS ──────────────────────
    const step1Content: any[] = []

    if (images && images.length > 0) {
      for (const img of images) {
        step1Content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
      }
    }

    // Add boundaries to document text
    let enhancedDocText = documentText || ''
    if (boundaryEast || boundaryWest || boundaryNorth || boundarySouth) {
      enhancedDocText += `\n\n=== PROPERTY BOUNDARIES (PRE-VERIFIED — USE EXACTLY) ===\nEast: ${boundaryEast || 'As per documents'}\nWest: ${boundaryWest || 'As per documents'}\nNorth: ${boundaryNorth || 'As per documents'}\nSouth: ${boundarySouth || 'As per documents'}\n=== END ===\n`
    }

    step1Content.push({
      type: 'text',
      text: `Perform complete 15-stage title verification fact extraction.

DETAILS SHEET (PRE-VERIFIED ANCHORS):
- Applicant: ${applicantName || 'As per documents'}
- Current Owner: ${currentOwner || 'As per documents'}
- Case Type: ${caseType}
- Loan Type: ${loanType || 'LAP'}
- Property Description: ${propertyAddress || 'As per documents'}
- Bank: ${bankName || 'As per form'}
- APP ID: ${appId}
- Co-Applicant: ${coApplicant || 'Not mentioned'}
- Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

SUBMITTED DOCUMENTS:
${enhancedDocText}

IMPORTANT CASE-SPECIFIC NOTE — EC APPLICANT:
In the present case, Santosh Tansukh Thakrar is an empanelled advocate who has applied for EC in respect of the subjected property only. Santosh Tansukh Thakrar has no relation or concern whatsoever with the subjected property. COMPLETELY IGNORE his name in all analysis and report sections.

MANDATORY EXTRACTION RULES:
1. NEVER "and others" — ALL names individually
2. Applicant = from Lakhi Lenar/Vechan Lenar/Dwitiya Paksh in AoS — NEVER stamp paper
3. Current Owner = from LATEST submitted deed — deed > EC
4. All 4 boundaries MANDATORY
5. Giro Mukeli = mortgage DISCHARGED
6. ALL EC entries counted — EVERY Maliki Feran/Vecho = chain link
7. EC Applicant = IGNORE
8. EC Col7 = IGNORE
9. Subject property ONLY — verify Unit+Block+Floor for each EC entry
10. LOAN AMOUNT = NEVER mention
11. FERFAR: Skip first column. Col1=Date+No.+Status | Col2=Details | Col3=Survey(if relevant) | Col4=IGNORE`
    })

    const step1Msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: STEP1_SYSTEM,
      messages: [{ role: 'user', content: step1Content }]
    })

    const extractedFacts = step1Msg.content[0].type === 'text' ? step1Msg.content[0].text : ''

    // ── STEP 2: SONNET — DEEP LEGAL ANALYSIS ───────────────────
    const step2Msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: getStep2System(caseType),
      messages: [{
        role: 'user',
        content: `Perform complete 15-stage legal analysis and title verification.

DETAILS SHEET — PRE-VERIFIED ANCHORS:
- Applicant/Borrower: ${applicantName}
- Current Owner: ${currentOwner || 'As per documents'}
- Property: ${propertyAddress}
- Bank: ${bankName}
- Co-Applicant: ${coApplicant || 'Not mentioned'}
- APP ID: ${appId}
- Boundaries: East=${boundaryEast || '?'} | West=${boundaryWest || '?'} | North=${boundaryNorth || '?'} | South=${boundarySouth || '?'}

EXTRACTED FACTS FROM 15-STAGE ENGINE:
${extractedFacts}

IMPORTANT CASE-SPECIFIC NOTE — EC APPLICANT:
In the present case, Santosh Tansukh Thakrar is an empanelled advocate who has applied for EC in respect of the subjected property only. Santosh Tansukh Thakrar has no relation or concern whatsoever with the subjected property. COMPLETELY IGNORE his name in ALL parts of the report — Part I, Part II, Part III, Part IV, Part V — everywhere.

MANDATORY RULES — NEVER BREAK:
1. NEVER "and others" — every person's full name individually always
2. Applicant = Second Party/Vechan Lenar in AoS — NEVER stamp paper
3. Current Owner = First Party/Vechan Aapnar in AoS — submitted deed > EC
4. All 4 boundaries MANDATORY — check every document including all pages and annexures
5. Giro Mukeli / Release Deed / Index-II = mortgage DISCHARGED
6. EC-confirmed deeds (not submitted): Part III naturally — NEVER Part IV — NEVER Documents Required
7. EC LEFT Column (Aapnar) = SELLER | RIGHT Column (Lenar) = BUYER — NEVER swap
8. EC Col7 = IGNORE completely
9. "Banakhat Kabja Vagar" = AoS Without Possession — NEVER call Sale Deed
10. Partnership Firm = "M/s. [Name] (Partnership Firm) through Partners: (1)... (2)..."
11. PROPERTY_DESCRIPTION FULL FORMAT: Unit+Block+Scheme+Survey+TP+FP+Village+Taluka+District+SRO
12. RISK_SCORE must be numeric 0-100
13. CONFIDENCE must be HIGH/MEDIUM/LOW
14. MORTGAGEABILITY must be Mortgageable/Conditionally Mortgageable/Not Mortgageable

Think like a 30-year Senior Gujarat Advocate. Bank's crores depend on accuracy. Miss nothing.`
      }]
    })

    const legalAnalysis = step2Msg.content[0].type === 'text' ? step2Msg.content[0].text : ''
    const meta = parseMeta(legalAnalysis)

    // ── STEP 3: ALL 4 PARALLEL ──────────────────────────────────
    const [s3aMsg, s3bMsg, s3cMsg, s3dMsg] = await Promise.all([

      // 3A — Part I + Part II
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 5000,
        system: STEP3A_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part I (Property Description + Boundaries) and Part II (Documents List).

PROPERTY: ${meta.propertyDescription || propertyAddress}
BOUNDARIES: ${meta.propertyBoundaries || `East: ${boundaryEast} | West: ${boundaryWest} | North: ${boundaryNorth} | South: ${boundarySouth}`}
APPLICANT: ${meta.applicant || applicantName}
BANK: ${bankName}

ANALYSIS:
${legalAnalysis}

Rules: Latest doc first. NEVER mutation entries in Part II. NEVER stamp paper numbers. Every name individually.`
        }]
      }),

      // 3B — Part III
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: STEP3B_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part III — Chronological Title Chain (oldest to newest).

CASE TYPE: ${caseType}
SUBJECT PROPERTY: ${meta.propertyDescription || propertyAddress}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
APPLICANT: ${meta.applicant || applicantName}

ANALYSIS:
${legalAnalysis}

Rules: First para no "Thereafter". Every subsequent starts "Thereafter,". Every name individually. EC-confirmed deeds naturally in chain — no remark. Subject property ONLY.`
        }]
      }),

      // 3C — Part IV + Risk
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 6000,
        system: STEP3C_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part IV — Legal Issues + Risk Assessment.

PROPERTY: ${meta.propertyDescription || propertyAddress}
APPLICANT: ${meta.applicant || applicantName}
BANK: ${bankName}
RISK SCORE: ${meta.riskScore || 'calculate from analysis'}
CONFIDENCE: ${meta.confidence || 'calculate'}
MORTGAGEABILITY: ${meta.mortgageability || 'calculate'}

ANALYSIS:
${legalAnalysis}

CASE-SPECIFIC NOTE: In the present case, Santosh Tansukh Thakrar is an empanelled advocate who applied for EC only — ZERO relation with property — COMPLETELY IGNORE — NEVER mention in Part IV.

Rules: HIGH first, MEDIUM next, LOW last. Do NOT flag EC-confirmed deeds. Do NOT flag EC Applicant. Use exact reg nos and dates.`
        }]
      }),

      // 3D — Part V + Docs Required + Final Status
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: STEP3D_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate Part V (Legal Opinion) + Documents Required + Final Title Status.

CASE TYPE: ${caseType}
CURRENT OWNER: ${meta.currentOwner || currentOwner}
PROPOSED PURCHASER: ${meta.applicant || applicantName}
BANK: ${bankName}
EXISTING BANK (for BT/Seller BT): extract from EC mortgage entry
RISK SCORE: ${meta.riskScore}
CONFIDENCE: ${meta.confidence}
MORTGAGEABILITY: ${meta.mortgageability}

ANALYSIS:
${legalAnalysis}

Rules: Use EXACT case-specific wording for Part V. Do NOT include "This opinion pertains to..." paragraphs. Documents Required: specific, case-appropriate. Final Title Status: choose ONE from the 5 options.`
        }]
      })
    ])

    const part12Html = s3aMsg.content[0].type === 'text' ? s3aMsg.content[0].text : '<p>Error generating Part I/II</p>'
    const part3Html = s3bMsg.content[0].type === 'text' ? s3bMsg.content[0].text : '<p>Error generating Part III</p>'
    const part4Html = s3cMsg.content[0].type === 'text' ? s3cMsg.content[0].text : '<p>Error generating Part IV</p>'
    const part5Html = s3dMsg.content[0].type === 'text' ? s3dMsg.content[0].text : '<p>Error generating Part V</p>'

    // ── BUILD FINAL REPORT ──────────────────────────────────────
    const reportHtml = buildHtml({
      refNo,
      appId: appId || 'AUTO-000000',
      today,
      bankName: bankName || 'Bank',
      applicantName: meta.applicant || applicantName || 'As per Documents',
      coApplicant: meta.coApplicant || coApplicant || 'Not Applicable',
      loanType: loanType || 'Loan Against Property',
      propertyAddress: meta.propertyDescription || propertyAddress || 'As per Documents',
      propertyBoundaries: meta.propertyBoundaries || `East: ${boundaryEast || '—'} | West: ${boundaryWest || '—'} | North: ${boundaryNorth || '—'} | South: ${boundarySouth || '—'}`,
      currentOwner: meta.currentOwner || currentOwner || 'As per documents',
      riskScore: meta.riskScore || '—',
      confidence: meta.confidence || '—',
      mortgageability: meta.mortgageability || '—',
      part12Html,
      part3Html,
      part4Html,
      part5Html,
    })

    // ── SAVE TO SUPABASE ────────────────────────────────────────
    const verdict = extractVerdict(legalAnalysis)
    let savedToDb = false
    let dbError = null

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
      debug: { extractedFacts, legalAnalysis, metaParsed: meta },
    })

  } catch (error: any) {
    console.error('TITLEMATRIXAI pipeline error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Pipeline failed' }, { status: 500 })
  }
}