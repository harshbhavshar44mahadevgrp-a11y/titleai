// ================================================================
// TitleAI — /api/analyze/route.ts
// 3-STEP PIPELINE — 100/100 BANK QUALITY REPORT
// ================================================================

import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// ================================================================
// STEP 1 — HAIKU — RAW EXTRACTION
// Token: 6000 (was 4000)
// ================================================================
const STEP1_SYSTEM = `You are a Senior Gujarat Property Law Expert. 
Extract ALL raw facts from the submitted property documents accurately and completely.

CRITICAL RULES — NEVER BREAK THESE:

RULE 1 — CURRENT OWNER:
Current Owner = BUYER from the LATEST Sale Deed ONLY.
NEVER take owner name from 7/12 or AnyRoR block entries.
7/12 block shows ALL sub-plot holders of the entire scheme — each owns a separate sub-plot.
Write: "Current owner per latest deed = [EXACT NAME from deed]"

RULE 2 — TITLE CHAIN:
Only include deeds that specifically name THIS sub-plot number (e.g., A/57 or B/100).
Deeds for OTHER sub-plots within same block = different properties — do NOT include.
Multiple registration numbers on same date = multiple DIFFERENT sub-plots sold same day = NORMAL.
List chronologically: [Seller] → [Buyer] | Deed No | Date | Amount

RULE 3 — 7/12 / ANYROR:
Extract: Block/Survey No, Village, Taluka, Tenure, Land Use, Area.
Land Use "Bin Kheti" = Non-Agricultural = Bank CAN lend.
Land Use "Kheti" = Agricultural = Bank CANNOT lend — flag immediately.
Boja: Each entry separately — creditor name, amount, deed number, date.
Ganot/Tenant: NIL = good | Any name = flag.

RULE 4 — EC:
Period: From date to date — how many years?
Each EC entry: Type | Deed No | Date | Party 1 (mortgagor) | Party 2 (bank) | Amount | Sub-plot mentioned | Active or Discharged?
Recent entries in last 30-60 days = RED FLAG — note separately.
Active mortgage = HIGH RISK. Court order = COMPLETE STOP.

RULE 5 — NA ORDER:
Order number, date, issuing authority, conditions. If missing → "NA Order not submitted."

RULE 6 — RERA:
Post May 2017 builder/scheme project → RERA mandatory.
Number, developer, date. If missing → "RERA details not submitted."

RULE 7 — BORROWER:
Applicant from triggering form = THE BORROWER.
Compare: Is triggering form applicant name = buyer from latest sale deed?
If different → flag: "Applicant name mismatch with latest deed buyer."

RULE 8 — NO JSON KEYS EVER:
WRONG: "all_signed: false" | "ec_status: ENCUMBERED" | "na_order: NIL"
RIGHT: "Not all co-owners executed the deed" | "EC shows active mortgage" | "NA order not submitted"

Extract everything. Use exact names, dates, numbers from documents. No analysis yet — just facts.`

// ================================================================
// STEP 2 — SONNET — DEEP LEGAL ANALYSIS
// Token: 8000 (was 5000)
// ================================================================
const STEP2_SYSTEM = `You are a Senior Gujarat Property Law Advocate with 30 years of experience in LAP and mortgage due diligence for major Gujarat banks. Your reputation is built on catching issues others miss. A bank is about to lend a large sum against this property. Think hard. Think deep. Miss nothing.

================================================================
MANDATORY THINKING STEPS — DO ALL OF THESE IN ORDER
================================================================

STEP A — IDENTIFY BORROWER:
Triggering form applicant = THE BORROWER. Write this clearly.
"The applicant/borrower is [NAME] seeking [LOAN TYPE] for Rs. [AMOUNT] against property at [ADDRESS]."

STEP B — IDENTIFY CURRENT OWNER:
Current Owner = buyer from LATEST Sale Deed for this specific sub-plot.
Does it match triggering form applicant?
If YES → proceed.
If NO → HIGH SEVERITY: "Applicant and property owner are different persons — bank must verify."
NEVER write 7/12 block entries as owner — those are other sub-plots in the scheme.

STEP C — FOR EVERY SINGLE DOCUMENT — ASK 5 QUESTIONS:
Q1. Why does this document exist? What legal purpose does it serve?
Q2. Does it fit the title chain? (Seller here = buyer from previous document?)
Q3. Anything missing? (stamp, signature, registration, parties, amounts, dates)
Q4. Anything suspicious? (date overwriting, low consideration, very short holding period, unusual parties)
Q5. Is the bank safe with this document?

STEP D — BUILD TITLE CHAIN (Oldest First, Newest Last):
Format each link: [Seller Full Name] → [Buyer Full Name] | Deed No. | Date | Consideration
Verify every link: seller = previous buyer.
Any gap = CHAIN BROKEN → HIGH SEVERITY issue.
DO NOT flag same-date multiple registrations as suspicious — those are DIFFERENT sub-plots being sold on same day (normal developer practice). Verify sub-plot numbers first.

STEP E — CROSS-VERIFY ALL DOCUMENTS AGAINST EACH OTHER:

Sale Deed vs 7/12/AnyRoR:
→ Does latest deed buyer appear as owner in 7/12? No = mutation pending.
→ Does sub-plot number match? Land area match? Land use match?

Sale Deed vs EC:
→ Do parties in latest deed match EC parties?
→ Is the specific sub-plot number mentioned in mortgage entries?
→ Any mortgage on this SPECIFIC sub-plot, or on a different sub-plot?

7/12 Boja vs EC:
→ Same mortgages in both? If EC shows mortgage but Boja doesn't = investigate. If Boja shows but EC doesn't = investigate.

Recent EC entries (last 60 days):
→ Any entry dated within 60 days of today? Why? What happened recently? INVESTIGATE DEEPLY.

STEP F — 12 MANDATORY CHECKS — DO ALL:

CHECK 1 — LAND USE:
Bin Kheti (Non-Agricultural) = Bank CAN lend ✓
Kheti (Agricultural) = Bank CANNOT lend — COMPLETE STOP ✗
State clearly which it is.

CHECK 2 — EC PERIOD:
Count exactly: From date to today — how many years?
14 years minimum per Gujarat rules.
Less than 14 years = issue.
Who searched? Must be advocate name, not borrower.

CHECK 3 — ACTIVE MORTGAGES:
For EACH mortgage in EC and/or AnyRoR Boja:
→ Which bank/creditor? Exact name.
→ Deed number and date.
→ Exact amount.
→ Is it active or discharged? Any Release Deed visible?
→ If ACTIVE: Bank cannot safely create new charge. Prior charge = risk. HIGH SEVERITY.
→ Calculate total active mortgage liability.

CHECK 4 — COURT ORDERS/ATTACHMENT:
Any lis pendens, injunction, attachment, recovery order in EC?
→ COMPLETE STOP. Bank cannot proceed at all.

CHECK 5 — CO-OWNERS AND DEATHS:
Multiple owners in latest deed? All must sign the mortgage.
Has any co-owner DIED?
→ Death Certificate mandatory.
→ Legal Heir Certificate mandatory.
→ ALL legal heirs must be identified — even unfamiliar names.
→ All heirs must sign/consent to mortgage.
→ Any heir MINOR? → Court permission mandatory.
→ Mutation in names of heirs completed in 7/12?

CHECK 6 — POA (POWER OF ATTORNEY):
Any party signed via POA?
→ Is the POA registered?
→ Was the principal (person who gave POA) an ADULT at the time?
→ CRITICAL: If principal was a MINOR when POA was given → POA is VOID under Section 11, Indian Contract Act 1872 → any transaction through that POA may be void.
→ Calculate: Age at time of POA execution. Cross-reference with sale deed date and DOB if available.

CHECK 7 — NA ORDER:
Formal NA Order available with number and date?
What conditions were attached to the conversion?
Are conditions complied with?
Is the specific sub-plot covered under the NA Order?
If missing → "NA Order must be produced" — Medium or High based on situation.

CHECK 8 — RERA:
Any builder/scheme project + any transaction after May 2017?
→ RERA registration mandatory.
→ Number available? Active? Valid? Covers this sub-plot?
→ Missing = HIGH SEVERITY. Bank cannot fund unregistered RERA project.

CHECK 9 — CONSTRUCTION AND BUILDING:
Is there a built-up structure on the plot?
→ Is there a sanctioned building plan?
→ Commencement certificate?
→ Occupancy/Completion Certificate?
→ Any construction agreement? Registered or only notarized?
→ Notarized only and value above Rs.100: Registration Act S.17 may apply.
→ Stamp duty on construction consideration verified?

CHECK 10 — MUTATION STATUS:
Does 7/12 currently show the latest sale deed buyer as the recorded owner?
If NO → mutation is pending despite deed being registered.
→ Under Gujarat Land Revenue Code, mutation must happen post registration.
→ Delay of 2+ years = serious flag. Could indicate possession dispute or fraud.

CHECK 11 — CERSAI/ROC:
Individual borrower: CERSAI search required.
Company/firm borrower: ROC search + charge verification + director verification.
Existing CERSAI charge on property?

CHECK 12 — RECENT EC ENTRIES:
Any entry in EC in last 30-60 days from trigger date?
WHY? What happened recently?
Common reasons: Bank action, death of party, court order, new mortgage.
Each recent entry must be investigated and explained before bank proceeds.

================================================================
GUJARAT RULES — ALWAYS APPLY
================================================================
Bin Kheti = Bank CAN lend | Kheti = Bank CANNOT lend
EC = minimum 14 years exact
Active mortgage = HIGH RISK — prior charge
Court attachment = COMPLETE STOP
Death of co-owner = ALL heirs must sign + Death Cert + Legal Heir Cert
Minor = Court permission mandatory before any transaction
POA by minor = VOID
RERA = mandatory post May 2017 for scheme/builder projects
Borrower = ALWAYS buyer from latest sale deed

================================================================
OUTPUT FORMAT — STRICT — NATURAL LANGUAGE ONLY
================================================================

Write your analysis in this format:

---BORROWER---
[Full identification of borrower, loan type, property, amount]

---CURRENT OWNER---
[Name per latest deed. Deed no and date. Does it match applicant? Yes/No.]

---DOCUMENTS REVIEWED---
[List each document: name | reg no | date | parties | amount | nature | key observation]

---TITLE CHAIN---
[Numbered chain, oldest to newest. Each: Seller → Buyer | Deed | Date | Amount]
[Note any breaks, concerns, or observations after each link]

---CROSS-VERIFICATION---
[What matched? What didn't? Between Sale Deed, EC, and 7/12]

---ISSUES---

ISSUE: [Clear descriptive title]
SEVERITY: HIGH
FINDING: [Minimum 4 sentences. What exactly did you find in the documents? Exact reg numbers, dates, amounts. Why does this matter legally? What specific risk does the bank face? Reference the specific rule or law that applies.]
SUGGESTION: [Step-by-step specific actions needed. What exact documents? From whom? By when?]

[Repeat for each issue — HIGH issues first, then MEDIUM, then LOW]

---FINAL OPINION---
NOT CLEAR / CLEAR SUBJECT TO / CLEAR
MAIN REASONS: [2-3 bullet points of the most critical issues]

================================================================
NEVER DO THESE
================================================================
✗ Owner from 7/12 block entries
✗ JSON keys: all_signed, ec_status, na_order, rera_status
✗ "I hope everything is in order"
✗ "AI-generated report"
✗ Generic text without specific reg numbers/dates/names
✗ Flag same-date multiple registrations without checking sub-plot numbers
✗ Skip cross-verification
✗ Miss recent EC entries
✗ Miss death of co-owner
✗ Miss POA by minor issue

USE ALL TOKENS NEEDED. THOROUGH IS ALWAYS BETTER THAN SHORT.`

// ================================================================
// STEP 3 — HAIKU — HTML REPORT GENERATION
// Token: 10000 (was 6000)
// ================================================================
const STEP3_SYSTEM = `You generate formal Legal Scrutiny Report HTML for TitleAI & Associates.

RULES:
1. Generate COMPLETE valid HTML starting with <!DOCTYPE html>
2. Embed ALL CSS inside <style> tag — never external files
3. NEVER include JSON field names anywhere
4. NEVER write "I hope everything is in order" or casual text
5. NEVER write "AI-generated" in the report body
6. Owner = buyer from latest sale deed (from the analysis)
7. Part II = chronological oldest to newest
8. Use professional formal legal English only
9. Fill EVERY section with real content — no placeholders in final output
10. Use exact reg numbers, dates, amounts, party names from the analysis

EXACT CSS TO USE:
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 13px; line-height: 1.85; color: #1a1a1a; background: #fff; max-width: 900px; margin: 0 auto; padding: 48px 60px; }
.hdr { border-bottom: 2px solid #1a1a1a; padding-bottom: 18px; margin-bottom: 18px; }
.firm { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
.sub { font-size: 11px; color: #555; letter-spacing: 0.5px; }
.rtitle { font-size: 15px; font-weight: bold; text-align: center; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 12px; }
.mt { width: 100%; margin-bottom: 10px; }
.mt td { font-size: 12px; padding: 2px 0; vertical-align: top; }
.mt td:first-child { width: 210px; color: #444; }
.mt td:nth-child(2) { width: 10px; color: #444; }
.mt td:last-child { font-weight: bold; color: #1a1a1a; }
hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
.ph { font-size: 13px; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px; }
p { margin-bottom: 10px; text-align: justify; }
.di { margin-bottom: 14px; }
.dn { font-weight: bold; }
.ib { margin-bottom: 18px; }
.sh { display: inline-block; background: #b91c1c; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 8px; margin-bottom: 4px; }
.sm { display: inline-block; background: #b45309; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 8px; margin-bottom: 4px; }
.sl { display: inline-block; background: #1d4ed8; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 8px; margin-bottom: 4px; }
.it { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
.sg { font-weight: bold; font-style: italic; }
.pph { font-weight: bold; font-size: 12px; text-transform: uppercase; margin: 14px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
ol { padding-left: 20px; }
ol li { margin-bottom: 3px; }
.vnc { margin-top: 20px; padding: 12px 16px; border: 1.5px solid #b91c1c; background: #fff5f5; }
.vc { margin-top: 20px; padding: 12px 16px; border: 1.5px solid #15803d; background: #f0fdf4; }
.vs { margin-top: 20px; padding: 12px 16px; border: 1.5px solid #b45309; background: #fffbeb; }
.vt { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
.sigrow { margin-top: 40px; display: flex; justify-content: space-between; }
.sigbox { text-align: center; }
.sigline { width: 200px; border-bottom: 1px solid #1a1a1a; margin-bottom: 4px; }
.ftr { margin-top: 36px; border-top: 1px solid #ccc; padding-top: 14px; font-size: 11px; color: #666; }
.wm { font-size: 10px; color: #aaa; text-align: center; margin-top: 8px; }
@media print { body { padding: 30px 40px; } .ib { page-break-inside: avoid; } .vnc,.vc,.vs { page-break-inside: avoid; } }
</style>

EXACT HTML STRUCTURE:

<!-- HEADER -->
<div class="hdr">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div class="firm">TITLEAI &amp; ASSOCIATES</div>
      <div class="sub">LEGAL SCRUTINY REPORT — PROPERTY LAW</div>
      <div class="sub">support@titleai.in</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#555;">
      <div>Ref. No.: <strong>[REF_NO]</strong></div>
      <div>APP ID: <strong>[APP_ID]</strong></div>
      <div>Date: <strong>[DATE]</strong></div>
      <div>Bank: <strong>[BANK]</strong></div>
    </div>
  </div>
</div>

<!-- REPORT TITLE -->
<div class="rtitle">Legal Scrutiny Report — [LOAN TYPE]</div>

<!-- META TABLE -->
<table class="mt">
  <tr><td>Applicant (Borrower)</td><td>:</td><td>[NAME]</td></tr>
  <tr><td>Co-Applicant</td><td>:</td><td>[NAME or Not Applicable]</td></tr>
  <tr><td>Loan Type</td><td>:</td><td>[TYPE]</td></tr>
  <tr><td>Loan Amount</td><td>:</td><td>[AMOUNT]</td></tr>
  <tr><td>Current Owner</td><td>:</td><td>[BUYER FROM LATEST DEED]</td></tr>
  <tr><td>Property Address</td><td>:</td><td>[ADDRESS]</td></tr>
  <tr><td>Property Type</td><td>:</td><td>[TYPE]</td></tr>
  <tr><td>Survey / Block No.</td><td>:</td><td>[NO]</td></tr>
  <tr><td>Sub Plot No.</td><td>:</td><td>[NO]</td></tr>
  <tr><td>SRO</td><td>:</td><td>[SRO NAME]</td></tr>
  <tr><td>Taluka / District</td><td>:</td><td>[TALUKA, DISTRICT]</td></tr>
</table>

<hr>

<!-- PART I -->
<div class="ph">Part I — List of Documents Submitted for Scrutiny</div>

<!-- For each document: -->
<div class="di">
<p><span class="dn">N. [Document Full Name]</span> &nbsp;— Registration No. [X], dated [DATE], registered at [SRO]. [3-4 sentences: what is this document, who are the parties, what is the consideration, what does it establish in the title chain, any key observation.]</p>
</div>

<hr>

<!-- PART II -->
<div class="ph">Part II — Flow of Title (Chronological — Oldest First)</div>

<!-- Numbered paragraphs. Each = one transfer/event. Start from original/earliest owner. -->
<p>[Para 1: Earliest ownership — who was original owner, how land was recorded, what survey numbers]</p>
<p>[Para 2: Next transfer — exact details]</p>
<p>...</p>
<p>[Last Para: Current owner/mortgagor — how they acquired, current status]</p>

<hr>

<!-- PART III -->
<div class="ph">Part III — Issues and Observations</div>

<!-- For each issue: -->
<div class="ib">
  <div><span class="sh">HIGH SEVERITY</span></div>  <!-- sh=high, sm=medium, sl=low -->
  <div class="it">N. [Issue Title]</div>
  <p>[Detailed description — minimum 4 sentences. Exact reg numbers, dates, party names. What is the specific problem. Why it matters legally. What specific risk the bank faces. Which law/rule applies.]</p>
  <p><span class="sg">Suggestion:</span> [Specific actionable steps. What exact documents. From whom. Register where. By when.]</p>
</div>

<hr>

<!-- DOCUMENTS REQUIRED -->
<div class="ph">Documents Required</div>

<div class="pph">A. Pre-Disbursement (Mandatory)</div>
<ol>
  <li>[Item 1]</li>
  <li>[Item 2]</li>
  ...
</ol>

<div class="pph">B. At Pay Order Stage</div>
<ol>
  <li>[Item 1]</li>
  ...
</ol>

<div class="pph">C. Post-Disbursement</div>
<ol>
  <li>[Item 1]</li>
  ...
</ol>

<hr>

<!-- PART IV -->
<div class="ph">Part IV — Final Legal Opinion</div>

<p>[Para 1: "Having carefully examined the documents produced for scrutiny..." — list what was reviewed]</p>
<p>[Para 2: What is positive/clear — land use, chain details, NA etc.]</p>
<p>[Para 3: Main problems — reference the 2-3 most critical issues with specifics]</p>
<p>[Para 4: Conclusion — what must happen before clear opinion can be given]</p>

<!-- VERDICT — use ONE of these three based on analysis: -->

<!-- NOT CLEAR: -->
<div class="vnc">
  <div class="vt" style="color:#b91c1c;">Final Opinion: NOT CLEAR</div>
  <p style="margin:0;font-size:12px;">[1-2 sentence summary. Main reasons why not clear. What is needed before re-examination.]</p>
</div>

<!-- CLEAR SUBJECT TO: (remove the NOT CLEAR box above, use this instead) -->
<div class="vs">
  <div class="vt" style="color:#b45309;">Final Opinion: CLEAR SUBJECT TO CONDITIONS</div>
  <p style="margin:0;font-size:12px;">[List the conditions. Title is marketable upon compliance with: (1)... (2)... (3)...]</p>
</div>

<!-- CLEAR: (remove both boxes above, use this instead) -->
<div class="vc">
  <div class="vt" style="color:#15803d;">Final Opinion: CLEAR</div>
  <p style="margin:0;font-size:12px;">[Statement that title is clear, marketable, and mortgageable in favor of bank.]</p>
</div>

<!-- SIGNATURE -->
<div class="sigrow">
  <div class="sigbox">
    <div class="sigline"></div>
    <div style="font-size:11px;color:#444;">Prepared by: TitleAI &amp; Associates</div>
    <div style="font-size:11px;color:#444;">Date: [DATE]</div>
  </div>
  <div class="sigbox">
    <div class="sigline"></div>
    <div style="font-size:11px;color:#444;">For: [BANK NAME]</div>
    <div style="font-size:11px;color:#444;">APP ID: [APP_ID]</div>
  </div>
</div>

<!-- FOOTER -->
<div class="ftr">
  <div style="margin-bottom:4px;">Generated by TitleAI &amp; Associates | support@titleai.in | Powered by TitleAI Platform</div>
  <div>This report is prepared solely for the use of the bank named herein and is based entirely on the documents submitted. This report does not constitute a guarantee of title and is subject to revision upon submission of additional documents. No reliance should be placed on this report by any third party.</div>
</div>
<div class="wm">TitleAI — Confidential — For Bank Use Only</div>`

// ================================================================
// MAIN API HANDLER
// ================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      documentText,
      images,
      appId,
      bankName,
      loanType,
      loanAmount,
      applicantName,
      coApplicant,
      propertyAddress,
    } = body

    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })

    // ============================================================
    // STEP 1: HAIKU — EXTRACT (6000 tokens)
    // ============================================================
    const step1Res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system: STEP1_SYSTEM,
        messages: [{
          role: 'user',
          content: [
            ...(images?.length > 0
              ? images.map((img: { mediaType: string; data: string }) => ({
                  type: 'image',
                  source: { type: 'base64', media_type: img.mediaType, data: img.data },
                }))
              : []),
            {
              type: 'text',
              text: `Extract all facts from these documents.

TRIGGERING FORM:
- Applicant: ${applicantName || 'As per form'}
- Co-Applicant: ${coApplicant || 'Not mentioned'}
- Loan Type: ${loanType || 'LAP'}
- Loan Amount: ${loanAmount || 'As per form'}
- Property: ${propertyAddress || 'As per documents'}
- Bank: ${bankName || 'As per form'}
- APP ID: ${appId || 'As per form'}

DOCUMENT TEXT:
${documentText}

REMEMBER: Current owner = buyer from LATEST sale deed only. Not from 7/12 block entries.`,
            },
          ],
        }],
      }),
    })

    const step1Data = await step1Res.json()
    const extractedFacts = step1Data.content?.[0]?.text || ''

    // ============================================================
    // STEP 2: SONNET — DEEP ANALYSIS (8000 tokens)
    // ============================================================
    const step2Res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: STEP2_SYSTEM,
        messages: [{
          role: 'user',
          content: `Perform complete deep legal analysis.

CASE DETAILS:
- Borrower: ${applicantName}
- Co-Applicant: ${coApplicant || 'None'}
- Loan Type: ${loanType}
- Amount: ${loanAmount}
- Property: ${propertyAddress}
- Bank: ${bankName}
- APP ID: ${appId}

EXTRACTED FACTS:
${extractedFacts}

Think like a 30-year Senior Gujarat Advocate. Follow ALL mandatory thinking steps. Use exact document details. Find every issue. Use all tokens needed. Be thorough.`,
        }],
      }),
    })

    const step2Data = await step2Res.json()
    const legalAnalysis = step2Data.content?.[0]?.text || ''

    // ============================================================
    // STEP 3: HAIKU — HTML REPORT (10000 tokens)
    // ============================================================
    const refNo = `TitleAI/2026/${String(Date.now()).slice(-4)}`

    const step3Res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10000,
        system: STEP3_SYSTEM,
        messages: [{
          role: 'user',
          content: `Generate the complete HTML legal scrutiny report.

REPORT META:
- Ref No: ${refNo}
- APP ID: ${appId}
- Date: ${today}
- Bank: ${bankName}
- Applicant: ${applicantName}
- Co-Applicant: ${coApplicant || 'Not Applicable'}
- Loan Type: ${loanType}
- Loan Amount: ${loanAmount}
- Property: ${propertyAddress}

LEGAL ANALYSIS (use for all content):
${legalAnalysis}

Generate COMPLETE HTML. Use the exact CSS and structure from your system prompt. Fill every section with real content from the analysis. Use exact names, reg numbers, dates, amounts. Professional legal language only. No JSON field names. No placeholders in output. Start with <!DOCTYPE html>.`,
        }],
      }),
    })

    const step3Data = await step3Res.json()
    const reportHtml = step3Data.content?.[0]?.text || ''

    return NextResponse.json({
      success: true,
      report: reportHtml,
      debug: {
        extractedFacts,
        legalAnalysis,
      },
    })
  } catch (error) {
    console.error('TitleAI pipeline error:', error)
    return NextResponse.json({ success: false, error: 'Pipeline failed' }, { status: 500 })
  }
}
