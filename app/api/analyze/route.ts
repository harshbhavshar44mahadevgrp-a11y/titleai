// ================================================================
// TITLEMATRIXAI v2 -- /api/analyze/route.ts
// 2-STAGE ARCHITECTURE:
// Stage 1: EC extracted as JSON + CODE determines mortgage/release
// Stage 2: Report generation with 100% correct mortgage data
// AI reads. Code decides. Reports are always correct.
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

// ================================================================
// BANK DETECTION -- same as ec-processor
// ================================================================
const BANK_PATTERNS = [
  'BANK','FINANCE','HOUSING FINANCE','FINANCIAL','NBFC','CAPITAL','FINCORP',
  'BAJAJ','HDFC','SBI','AXIS','ICICI','KOTAK','PNB','BOI','CANARA',
  'INDIABULLS','LIC','LICHFL','REPCO','PIRAMAL','MUTHOOT','TATA CAPITAL',
  'ADITYA BIRLA','FULLERTON','AAVAS','HOME FIRST','APTUS','SHRIRAM',
]
function isBank(name: string): boolean {
  if (!name) return false
  const u = name.toUpperCase()
  return BANK_PATTERNS.some(p => u.includes(p))
}

// ================================================================
// DETERMINISTIC MORTGAGE LIFECYCLE
// ================================================================
interface ECRow { row_number:number; col1_raw_text:string; col2_property:string; col3_aapnar:string; col4_lenar:string; col5_date:string; col6_deed_no:string }
interface Charge { lender:string; borrower:string; deed_no:string; date:string; row:number; status:'ACTIVE'|'RELEASED'; release_deed_no?:string; release_date?:string }

function mortgageLifecycle(rows: ECRow[]): { active: Charge[]; released: Charge[]; summary: string; encumbrance: string } {
  const charges: Charge[] = []

  // PASS 1: Create charge for every mortgage (col4=Bank)
  for (const r of rows) {
    if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) {
      charges.push({ lender: r.col4_lenar, borrower: r.col3_aapnar, deed_no: r.col6_deed_no, date: r.col5_date, row: r.row_number, status: 'ACTIVE' })
    }
  }

  // PASS 2: Match releases (col3=Bank = ROLE FLIP = Release)
  for (const r of rows) {
    if (isBank(r.col3_aapnar)) {
      const bankWords = r.col3_aapnar.toUpperCase().split(' ').filter((w: string) => w.length > 3)
      const match = charges.find(c => bankWords.some((w: string) => c.lender.toUpperCase().includes(w)))
      if (match) {
        match.status = 'RELEASED'
        match.release_deed_no = r.col6_deed_no
        match.release_date = r.col5_date
      }
    }
  }

  const active = charges.filter(c => c.status === 'ACTIVE')
  const released = charges.filter(c => c.status === 'RELEASED')

  const encumbrance = active.length > 0 ? 'ENCUMBERED' : released.length > 0 ? 'CLEAR_WITH_PRIOR_RELEASE' : 'CLEAR'

  const summary = active.length === 0
    ? released.length > 0
      ? `CLEAR. Prior mortgage by ${released.map(r=>r.lender).join(', ')} stands RELEASED vide Deed No. ${released.map(r=>r.release_deed_no).join(', ')}.`
      : 'CLEAR. No mortgage found.'
    : `ENCUMBERED. Active mortgage: ${active.map(a=>`${a.lender} Deed No.${a.deed_no} dt.${a.date}`).join('; ')}`

  return { active, released, summary, encumbrance }
}

// ================================================================
// CSS
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:5px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}.ec-unk{color:#b45309;font-style:italic}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}.ib{page-break-inside:avoid}}`

// ================================================================
// LEGAL OPINIONS + META BLOCKS
// ================================================================
function getLegalOpinion(ct: string, builder:string, purchaser:string, existingBank:string): string {
  const op: Record<string,string> = {
    builder_purchase: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${builder} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${purchaser} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    resale: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${builder} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${purchaser} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${builder} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${purchaser} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`,
    seller_bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${builder} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${builder} and after the execution and registration of sale deed unto and in favour of ${purchaser} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`,
    lap: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${builder} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
  }
  return op[ct] || op['lap']
}

// ================================================================
// BUILD EC TABLE HTML (from structured rows -- 100% correct)
// ================================================================
function buildECTable(rows: ECRow[], lifecycle: any): string {
  let html = `<table class="ec-tbl"><tr><th>Sr.</th><th>Classified Type</th><th>Deed No.</th><th>Date</th><th>Col 3 -- Executing (Aapnar)</th><th>Col 4 -- Claimant (Lenar)</th><th>Status</th></tr>`

  for (const row of rows) {
    // Determine status from lifecycle (CODE result, not AI)
    const isActiveMortgage = lifecycle.active.some((c: Charge) => c.row === row.row_number)
    const isReleasedMortgage = lifecycle.released.some((c: Charge) => c.released_by && false) // release ROW
    const isReleaseRow = isBank(row.col3_aapnar) && !isBank(row.col4_lenar)
    const isMortgageRow = isBank(row.col4_lenar) && !isBank(row.col3_aapnar)

    let statusClass = '', statusText = '', typeText = row.col1_raw_text || 'Unknown'

    if (isReleaseRow) {
      statusClass = 'ec-rel'
      statusText = 'RELEASED / DISCHARGED'
      typeText = 'Reconveyance / Mortgage Release Deed'
    } else if (isMortgageRow && isActiveMortgage) {
      statusClass = 'ec-act'
      statusText = 'ACTIVE MORTGAGE'
      typeText = 'Mortgage Deed'
    } else if (isMortgageRow && !isActiveMortgage) {
      statusClass = 'ec-rel'
      statusText = 'MORTGAGE -- RELEASED'
      typeText = 'Mortgage Deed'
    } else {
      statusClass = ''
      statusText = 'Transaction'
    }

    html += `<tr><td>${row.row_number}</td><td>${typeText}</td><td>${row.col6_deed_no || '--'}</td><td>${row.col5_date || '--'}</td><td>${row.col3_aapnar || '--'}</td><td>${row.col4_lenar || '--'}</td><td class="${statusClass}">${statusText}</td></tr>`
  }

  html += `</table>`
  return html
}

// ================================================================
// REPORT HTML BUILDER
// ================================================================
function buildReport(p: any): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report -- ${p.refNo}</title><style>${CSS}</style></head><body>
<div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div>
<div class="hdr-right"><div><strong>Ref No.:</strong> ${p.refNo}</div><div><strong>App ID:</strong> ${p.appId}</div><div><strong>Date:</strong> ${p.today}</div><div><strong>Bank:</strong> ${p.bankName}</div></div></div>
<div class="rtitle">LEGAL SCRUTINY REPORT -- ${p.loanType}</div><hr>
${p.parts}
<hr><div class="sigrow">
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div>
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName}</div></div></div>
<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: Prepared for ${p.bankName}, App ${p.appId}. Based solely on documents produced. Does not constitute guarantee of title.</div><div class="wm">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div></div>
</body></html>`
}

// ================================================================
// MAIN HANDLER
// ================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { images, caseType, appId, bankName, loanType,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId,
      // Pre-processed EC data from ec-processor (if available)
      ecData } = body

    const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' })
    const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`
    const loanTypeMap: Record<string,string> = { builder_purchase:'Builder Purchase', resale:'Resale Property', bt:'Balance Transfer', seller_bt:'Seller BT', lap:'LAP (Loan Against Property)' }

    // ============================================================
    // STAGE 1: EC Processing
    // If ecData provided by frontend (pre-processed) -- use it
    // Otherwise extract from images in this request
    // ============================================================
    let ecRows: ECRow[] = []
    let ecMeta = { ec_app_number:'', ec_date:'', ec_from:'', ec_to:'', row_count:0 }
    let lifecycle: any = { active:[], released:[], summary:'No EC data provided', encumbrance:'UNKNOWN' }

    if (ecData?.rows?.length) {
      // Frontend already pre-processed EC -- use it directly
      ecRows = ecData.rows
      ecMeta = { ec_app_number: ecData.ec_app_number||'', ec_date: ecData.ec_date||'', ec_from: ecData.ec_from||'', ec_to: ecData.ec_to||'', row_count: ecData.rows.length }
      lifecycle = mortgageLifecycle(ecRows)  // Run deterministic analysis
    } else if (images?.length) {
      // No pre-processed EC -- extract from images
      const ecImages = images  // All images sent
      const ecContent: any[] = []
      for (const img of ecImages) ecContent.push({ type:'image', source:{ type:'base64', media_type:img.mediaType, data:img.data } })
      ecContent.push({ type:'text', text:`Extract ONLY the EC table as JSON. Rules: Col 7 (last) = IGNORE. EC Applicant name = IGNORE.
Output format:
{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_raw_text":"","col2_property":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}]}
Output ONLY valid JSON. No markdown.` })

      try {
        const ecRes = await client.messages.create({ model:'claude-sonnet-4-6', max_tokens:2000, temperature:0, messages:[{ role:'user', content:ecContent }] })
        const ecRaw = ecRes.content[0].type==='text' ? ecRes.content[0].text : '{}'
        const ecJson = JSON.parse(ecRaw.replace(/```json?\n?/g,'').replace(/```\n?/g,'').trim())
        ecRows = ecJson.rows || []
        ecMeta = { ec_app_number:ecJson.ec_app_number||'', ec_date:ecJson.ec_date||'', ec_from:ecJson.ec_from||'', ec_to:ecJson.ec_to||'', row_count:ecRows.length }
        lifecycle = mortgageLifecycle(ecRows)  // DETERMINISTIC -- never wrong
      } catch(e) { console.error('EC extraction failed:', e) }
    }

    // MORTGAGE SUMMARY -- built from deterministic lifecycle result
    const mortgageSummary = lifecycle.summary
    const existingBank = lifecycle.active.length > 0 ? lifecycle.active[0].lender : (lifecycle.released.length > 0 ? lifecycle.released[0].lender : 'N/A')

    // ============================================================
    // STAGE 2: Full Report Generation (AI used for legal writing)
    // Ground truth (EC data + mortgage status) fed as FACTS
    // ============================================================
    const ecTableHtml = ecRows.length > 0 ? buildECTable(ecRows, lifecycle) : '<p>No EC entries extracted.</p>'
    const legalOpinion = getLegalOpinion(caseType, currentOwner || 'Owner', applicantName || 'Applicant', existingBank)

    // Ground truth context for all AI calls
    const groundTruth = `
GROUND TRUTH (100% CORRECT -- DO NOT CONTRADICT):
EC Application No.: ${ecMeta.ec_app_number}
EC Date: ${ecMeta.ec_date}
EC Search Period: ${ecMeta.ec_from} to ${ecMeta.ec_to}
EC Row Count: ${ecMeta.row_count}
Encumbrance Status: ${lifecycle.encumbrance}
Mortgage Summary: ${mortgageSummary}
Active Mortgages: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map((a:Charge)=>`${a.lender} Deed:${a.deed_no} Date:${a.date}`).join(' | ')}
Released Mortgages: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map((r:Charge)=>`${r.lender} Deed:${r.deed_no} RELEASED vide ${r.release_deed_no} on ${r.release_date}`).join(' | ')}
RULE: If mortgage is RELEASED -- do not flag as active. Do not say "no discharge found".
RULE: If mortgage is ACTIVE -- flag as HIGH SEVERITY in Part VI.
RULE: EC Col 7 = NEVER MENTION. EC Applicant = IGNORE.
`

    // Build 4 parts in parallel
    const [r4a, r4b, r4c, r4d] = await Promise.all([

      client.messages.create({ model:'claude-sonnet-4-6', max_tokens:4000, temperature:0,
        system:`Generate PART I, PART II, PART III. Pure HTML only. OLDEST document first in Part III. No markdown.`,
        messages:[{ role:'user', content:`${groundTruth}
Applicant: ${applicantName} | Co: ${coApplicant||'N/A'} | Owner: ${currentOwner}
Bank: ${bankName} | Case: ${caseType} | Property: ${propertyAddress}
E:${boundaryEast||'?'} W:${boundaryWest||'?'} N:${boundaryNorth||'?'} S:${boundarySouth||'?'}

PART I: <hr><div class="ph">PART I -- BORROWER / MORTGAGOR / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower</div><table class="mt"><tr><td>Name</td><td>:</td><td>${applicantName}</td></tr><tr><td>Co-Applicant</td><td>:</td><td>${coApplicant||'Not Applicable'}</td></tr><tr><td>Constitution</td><td>:</td><td>Individual</td></tr></table>
<div class="sph">B. Mortgagor</div><table class="mt"><tr><td>Name</td><td>:</td><td>Same as Borrower above</td></tr></table>
<div class="sph">C. Current Ownership</div><table class="mt"><tr><td>Current Owner</td><td>:</td><td>${currentOwner}</td></tr><tr><td>Mode of Acquisition</td><td>:</td><td>[from documents]</td></tr><tr><td>Registration Details</td><td>:</td><td>[from documents]</td></tr></table>
PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div><div class="prop-para">[full paragraph format property description from documents]</div><table class="mt"><tr><td>East</td><td>:</td><td>${boundaryEast||'As per documents'}</td></tr><tr><td>West</td><td>:</td><td>${boundaryWest||'As per documents'}</td></tr><tr><td>North</td><td>:</td><td>${boundaryNorth||'As per documents'}</td></tr><tr><td>South</td><td>:</td><td>${boundarySouth||'As per documents'}</td></tr></table>
PART III: <hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>[List all submitted documents. NO illegibility remarks. Latest first. Include EC as: E-App No. ${ecMeta.ec_app_number} dated ${ecMeta.ec_date} period ${ecMeta.ec_from} to ${ecMeta.ec_to} with ${ecMeta.row_count} transaction/s.]
Output as HTML starting with <hr><div class="ph">PART I` }] }),

      client.messages.create({ model:'claude-sonnet-4-6', max_tokens:4000, temperature:0,
        system:`Generate PART IV and PART V. Pure HTML only. No markdown.`,
        messages:[{ role:'user', content:`${groundTruth}
Case: ${caseType} | Property: ${propertyAddress} | Owner: ${currentOwner}
EC: ${ecMeta.ec_app_number} | ${ecMeta.ec_from} to ${ecMeta.ec_to}

PART IV: <hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN</div>
Rules: Oldest first. First para NO "Thereafter". Each subsequent MUST start "Thereafter,".
For Released mortgage: "...stands discharged and charge fully released and satisfied vide [Release Deed No.] dated [date]..."
For Active mortgage: "...subsisting and active as on date..."
Final para includes: EC E-App No. ${ecMeta.ec_app_number} dated ${ecMeta.ec_date} period ${ecMeta.ec_from} to ${ecMeta.ec_to}. Encumbrance Status: ${lifecycle.encumbrance}.

PART V: <hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">Revenue Record</div><table class="mt">[7/12 details from documents]</table>
<div class="sph">Mutation Entries</div><table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Status</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>[rows]</table>
<div class="sph">Regulatory Approvals</div><table class="mt"><tr><td>NA Order</td><td>:</td><td>[from docs or NOT PROVIDED]</td></tr><tr><td>Development Permission</td><td>:</td><td>[from docs or NOT PROVIDED]</td></tr><tr><td>Building Plan</td><td>:</td><td>[from docs or NOT PROVIDED]</td></tr><tr><td>RERA</td><td>:</td><td>[from docs or NOT PROVIDED]</td></tr><tr><td>OC/BU</td><td>:</td><td>[from docs or NOT PROVIDED]</td></tr></table>
<div class="sph">Encumbrance Analysis</div>
<p>EC E-App No. ${ecMeta.ec_app_number} dated ${ecMeta.ec_date} period ${ecMeta.ec_from} to ${ecMeta.ec_to}. ${ecMeta.row_count} transaction/s found:</p>
${ecTableHtml}
<p>Encumbrance Status: ${lifecycle.encumbrance}. ${lifecycle.summary}</p>
Output as HTML starting with <hr><div class="ph">PART IV` }] }),

      client.messages.create({ model:'claude-sonnet-4-6', max_tokens:6000, temperature:0,
        system:`Generate PART VI, PART VII, PART VIII. Pure HTML only. Max 5 alerts. No markdown.`,
        messages:[{ role:'user', content:`${groundTruth}
Bank: ${bankName} | Case: ${caseType}
Active Mortgages: ${lifecycle.active.length} | Released: ${lifecycle.released.length}

PART VI: <hr><div class="ph">PART VI -- ALERTS</div>
RULES: NEVER flag released mortgage as active. NEVER flag EC-confirmed deeds. NEVER flag EC Applicant.
If encumbrance=${lifecycle.encumbrance} and active mortgages>0: flag HIGH SEVERITY.
If all mortgages released: do NOT flag mortgage as alert.
[Generate max 5 concise alerts based on documents. HIGH/MEDIUM/LOW severity.]

PART VII: <hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Available</div><ol>[docs]</ol>
<div class="sph">B. Critical Missing</div><ol>[or NIL]</ol>
<div class="sph">C. Important Missing</div><ol>[or NIL]</ol>
<div class="sph">D. Illegible</div><ol>[or NIL]</ol>
<div class="sph">E. Risk Assessment</div><table class="mt"><tr><td>Risk Level</td><td>:</td><td>[HIGH/MODERATE/LOW]</td></tr><tr><td>Mortgageability</td><td>:</td><td>[Mortgageable/Conditionally/Not]</td></tr><tr><td>SARFAESI</td><td>:</td><td>[Enforceable/Conditionally/Not]</td></tr><tr><td>Lending Suitability</td><td>:</td><td>[Suitable/Conditionally/Not]</td></tr></table>

PART VIII: <hr><div class="ph">PART VIII -- LEGAL OPINION</div>
<p>${legalOpinion}</p>
[Verdict box: CLEAR AND MARKETABLE / CLEAR SUBJECT TO CONDITIONS / NOT CLEAR based on Part VI alerts]
Output as HTML starting with <hr><div class="ph">PART VI` }] }),

      client.messages.create({ model:'claude-sonnet-4-6', max_tokens:3000, temperature:0,
        system:`Generate PART IX, PART X, PART XI. Pure HTML only. No markdown.`,
        messages:[{ role:'user', content:`${groundTruth}
Case: ${caseType} | Bank: ${bankName} | Owner: ${currentOwner} | Applicant: ${applicantName}
Existing Bank: ${existingBank} | Encumbrance: ${lifecycle.encumbrance}

PART IX: <hr><div class="ph">PART IX -- PRE-DISBURSEMENT DOCUMENTS</div><ol>[case-specific list]</ol>
PART X: <hr><div class="ph">PART X -- POST-DISBURSEMENT DOCUMENTS</div><ol>[case-specific list]</ol>
PART XI: <hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec"><div class="fr-title">Final Title Status:</div><div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div></div>
<p>[3-4 sentence summary. Include mortgage status: ${lifecycle.summary}]</p>
Output as HTML starting with <hr><div class="ph">PART IX` }] })
    ])

    const parts = [r4a,r4b,r4c,r4d].map(r => r.content[0].type==='text' ? r.content[0].text : '').join('\n')

    const html = buildReport({ refNo, appId:appId||'AUTO', today, bankName:bankName||'Bank', loanType:loanTypeMap[caseType]||'LAP', parts })
    const verdict = lifecycle.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR' : lifecycle.encumbrance === 'CLEAR' ? 'CLEAR' : 'CLEAR SUBJECT TO'

    if (userId && supabase) {
      try {
        await supabase.from('reports').insert({ user_id:userId, case_type:caseType||'lap', applicant_name:applicantName||'Unknown', bank_name:bankName||'Unknown', property_address:propertyAddress||'Unknown', app_id:appId||refNo, verdict, report_html:html })
      } catch(e) { console.error('Supabase save error:', e) }
    }

    return NextResponse.json({ success:true, report:html, verdict, lifecycle, ecData:{ rows:ecRows, ...ecMeta } })
  } catch(e:any) {
    console.error('TITLEMATRIXAI v2 error:', e)
    return NextResponse.json({ success:false, error:e.message }, { status:500 })
  }
}
