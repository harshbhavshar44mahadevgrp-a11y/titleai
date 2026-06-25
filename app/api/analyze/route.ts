// ================================================================
// TITLEMATRIXAI v4 -- /api/analyze/route.ts
// STAGE 1A + 1B: PARALLEL extraction (general docs + dedicated EC)
// STAGE 2: Deterministic code (mortgage lifecycle, risk score)
// STAGE 3: 4 parallel report generation calls
// EC extracted by dedicated call -- no matter what
// temperature: 0 on ALL calls -- consistent every time
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
// BANK DETECTION
// ================================================================
const BANK_PATTERNS = [
  'BANK', 'FINANCE', 'HOUSING FINANCE', 'FINANCIAL', 'NBFC', 'CAPITAL', 'FINCORP',
  'BAJAJ', 'HDFC', 'SBI', 'AXIS', 'ICICI', 'KOTAK', 'PNB', 'BOI', 'CANARA',
  'INDIABULLS', 'LIC', 'LICHFL', 'REPCO', 'PIRAMAL', 'MUTHOOT', 'TATA CAPITAL',
  'ADITYA BIRLA', 'FULLERTON', 'AAVAS', 'HOME FIRST', 'APTUS', 'SHRIRAM',
  'GRUH', 'SUNDARAM', 'IIFL',
]
function isBank(name: string): boolean {
  if (!name) return false
  const u = name.toUpperCase()
  return BANK_PATTERNS.some(p => u.includes(p))
}

// ================================================================
// SAFE JSON PARSE -- tries multiple strategies
// ================================================================
function safeJsonParse(raw: string): any {
  const strategies = [
    raw.trim(),
    raw.replace(/^[\s\S]*?(?=\{)/, '').replace(/\}[\s\S]*$/, '}'),
    raw.replace(/`{3}json[\r\n]?/g, '').replace(/`{3}[\r\n]?/g, '').trim(),
  ]
  for (const s of strategies) {
    try { const r = JSON.parse(s); if (r && typeof r === 'object') return r } catch { }
  }
  return {}
}

// Strip markdown code blocks and preamble from AI HTML output
function cleanAiOutput(text: string): string {
  // Remove markdown code block wrappers
  text = text.replace(/`{3}html[\r\n]?/g, '').replace(/`{3}[\r\n]?/g, '')
  // Remove AI preamble (anything before first HTML tag)
  const firstTag = text.search(/<(hr|div|table|p|h[1-6])/i)
  if (firstTag > 0) text = text.slice(firstTag)
  return text.trim()
}

// ================================================================
// INTERFACES
// ================================================================
interface ECRow {
  row_number: number
  col1_raw_text: string
  col2_property: string
  col3_aapnar: string
  col4_lenar: string
  col5_date: string
  col6_deed_no: string
}
interface Charge {
  lender: string; borrower: string; deed_no: string; date: string
  row: number; status: 'ACTIVE' | 'RELEASED'
  release_deed_no?: string; release_date?: string
}
interface RiskFinding {
  code: string; severity: 'critical' | 'high' | 'medium' | 'low'
  description: string; evidence: string
}
interface TxnRecord {
  seller: string; buyer: string; instrument: string
  date: string; reg_no: string; sub_registrar: string
}

// ================================================================
// STAGE 2A: DETERMINISTIC MORTGAGE LIFECYCLE
// ================================================================
function mortgageLifecycle(rows: ECRow[]): { active: Charge[]; released: Charge[]; summary: string; encumbrance: string } {
  const charges: Charge[] = []
  for (const r of rows) {
    if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) {
      charges.push({ lender: r.col4_lenar, borrower: r.col3_aapnar, deed_no: r.col6_deed_no, date: r.col5_date, row: r.row_number, status: 'ACTIVE' })
    }
  }
  for (const r of rows) {
    if (isBank(r.col3_aapnar)) {
      const words = r.col3_aapnar.toUpperCase().split(' ').filter((w: string) => w.length > 3)
      const match = charges.find(c => words.some((w: string) => c.lender.toUpperCase().includes(w)))
      if (match) { match.status = 'RELEASED'; match.release_deed_no = r.col6_deed_no; match.release_date = r.col5_date }
    }
  }
  const active = charges.filter(c => c.status === 'ACTIVE')
  const released = charges.filter(c => c.status === 'RELEASED')
  const encumbrance = active.length > 0 ? 'ENCUMBERED' : released.length > 0 ? 'CLEAR_WITH_PRIOR_RELEASE' : 'CLEAR'
  const summary = active.length === 0
    ? released.length > 0
      ? `CLEAR. Prior mortgage by ${released.map(r => r.lender).join(', ')} fully RELEASED vide Deed No. ${released.map(r => r.release_deed_no).join(', ')}.`
      : 'CLEAR. No encumbrance found in EC.'
    : `ENCUMBERED. Active mortgage: ${active.map(a => `${a.lender} Deed No.${a.deed_no} dt.${a.date}`).join('; ')}`
  return { active, released, summary, encumbrance }
}

// ================================================================
// STAGE 2B: RISK SCORING
// ================================================================
function computeRiskScore(findings: RiskFinding[]): { score: number; rating: 'RED' | 'AMBER' | 'GREEN' } {
  const weights: Record<string, number> = { critical: 40, high: 25, medium: 10, low: 3 }
  let score = Math.min(100, findings.reduce((s, f) => s + (weights[f.severity] || 3), 0))
  if (findings.some(f => f.severity === 'critical') || score >= 60) return { score, rating: 'RED' }
  if (score >= 25) return { score, rating: 'AMBER' }
  return { score, rating: 'GREEN' }
}

// ================================================================
// STAGE 2C: TITLE CHAIN NARRATIVE
// ================================================================
function buildChainNarrative(txns: TxnRecord[]): string {
  if (!txns.length) return 'Title chain to be verified from submitted documents.'
  const sorted = [...txns].sort((a, b) => {
    const p = (d: string) => { const pts = d.split('/'); return pts.length === 3 ? parseInt(pts[2] + pts[1].padStart(2, '0') + pts[0].padStart(2, '0')) : parseInt(d.replace(/\D/g, '')) }
    return p(a.date) - p(b.date)
  })
  return sorted.map((t, i) => {
    const pre = i === 0 ? '' : 'Thereafter, '
    return `${pre}${t.seller} executed and registered ${t.instrument} in favour of ${t.buyer} bearing Registration No. ${t.reg_no || '[as per document]'} dated ${t.date || '[as per document]'}${t.sub_registrar ? ` before the Sub-Registrar, ${t.sub_registrar}` : ''}.`
  }).join(' ')
}

// ================================================================
// CSS
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:6px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555;font-weight:600}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:14px 18px;margin:10px 0 14px;font-style:italic;line-height:2.1}.ib{margin-bottom:14px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px;letter-spacing:.5px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px;letter-spacing:.5px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px;letter-spacing:.5px}.it{font-weight:bold;font-size:13px;margin-bottom:4px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:5px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px;font-weight:700}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:10px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}.vnc{margin-top:16px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vc{margin-top:16px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:16px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}.risk-badge{display:inline-block;padding:4px 12px;border-radius:3px;font-weight:bold;font-size:12px;margin-top:4px}@media print{body{padding:30px 40px}}`

// ================================================================
// LEGAL OPINIONS
// ================================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
  const o: Record<string, string> = {
    builder_purchase: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    resale: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${owner} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`,
    seller_bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${owner} and after the execution and registration of sale deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`,
    lap: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
  }
  return o[ct] || o['lap']
}

// ================================================================
// EC TABLE HTML
// ================================================================
function buildECTable(rows: ECRow[], lifecycle: any): string {
  let html = `<table class="ec-tbl"><tr><th>Sr.</th><th>Document Type</th><th>Deed No.</th><th>Date</th><th>Executing Party (Aapnar / Col 3)</th><th>Claimant Party (Lenar / Col 4)</th><th>Status</th></tr>`
  for (const row of rows) {
    const isRelease = isBank(row.col3_aapnar) && !isBank(row.col4_lenar)
    const isMortgage = isBank(row.col4_lenar) && !isBank(row.col3_aapnar)
    const isActive = lifecycle.active.some((c: Charge) => c.row === row.row_number)
    let sc = '', st = '', tt = row.col1_raw_text || 'Transaction'
    if (isRelease) { sc = 'ec-rel'; st = 'RELEASED / DISCHARGED'; tt = 'Mortgage Release Deed' }
    else if (isMortgage && isActive) { sc = 'ec-act'; st = 'ACTIVE MORTGAGE'; tt = 'Mortgage Deed' }
    else if (isMortgage && !isActive) { sc = 'ec-rel'; st = 'MORTGAGE - RELEASED'; tt = 'Mortgage Deed' }
    else { sc = ''; st = 'Transaction' }
    html += `<tr><td>${row.row_number}</td><td>${tt}</td><td>${row.col6_deed_no || '--'}</td><td>${row.col5_date || '--'}</td><td>${row.col3_aapnar || '--'}</td><td>${row.col4_lenar || '--'}</td><td class="${sc}">${st}</td></tr>`
  }
  return html + `</table>`
}

// ================================================================
// MUTATION TABLE HTML
// ================================================================
function buildMutationTable(mutations: any[]): string {
  if (!mutations || !mutations.length) return '<p style="color:#666;font-size:12px;">Mutation entries not provided or not extracted.</p>'
  let html = `<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Nature</th><th>From</th><th>To</th><th>Survey No.</th><th>Status</th></tr>`
  mutations.forEach((m: any, i: number) => {
    html += `<tr><td>${i + 1}</td><td>${m.entry_no || '--'}</td><td>${m.date || '--'}</td><td>${m.nature || '--'}</td><td>${m.from_name || '--'}</td><td>${m.to_name || '--'}</td><td>${m.survey_no || '--'}</td><td>${m.status || '--'}</td></tr>`
  })
  return html + `</table>`
}

// ================================================================
// REPORT HTML BUILDER
// ================================================================
function buildReport(p: any): string {
  const rc = p.riskRating === 'RED' ? '#b91c1c' : p.riskRating === 'AMBER' ? '#b45309' : '#15803d'
  const rb = p.riskRating === 'RED' ? '#FEF2F2' : p.riskRating === 'AMBER' ? '#FFFBEB' : '#F0FDF4'
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report - ${p.refNo}</title><style>${CSS}</style></head><body>
<div class="hdr">
  <div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel - Mortgage, Banking &amp; Real Estate</div><div class="sub">support@titlematrixai.com | www.titlematrixai.in</div></div>
  <div class="hdr-right"><div><strong>Ref No.:</strong> ${p.refNo}</div><div><strong>App ID:</strong> ${p.appId}</div><div><strong>Date:</strong> ${p.today}</div><div><strong>Bank:</strong> ${p.bankName}</div><div class="risk-badge" style="background:${rb};color:${rc};border:1px solid ${rc};">RISK: ${p.riskRating} (${p.riskScore}/100)</div></div>
</div>
<div class="rtitle">LEGAL SCRUTINY REPORT - ${p.loanType}</div><hr>
${p.parts}
<hr>
<div class="sigrow">
  <div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div>
  <div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName}</div></div>
</div>
<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: This report is prepared for ${p.bankName} (App ID: ${p.appId}). Based solely on documents produced for scrutiny. Does not constitute guarantee of title.</div><div class="wm">TITLEMATRIXAI - CONFIDENTIAL - FOR BANK USE ONLY</div></div>
</body></html>`
}

// ================================================================
// MAIN HANDLER
// ================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { images, caseType, appId, bankName, applicantName, coApplicant,
      propertyAddress, currentOwner, boundaryEast, boundaryWest, boundaryNorth,
      boundarySouth, userId, documentText, ecData } = body

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TM/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`
    const loanTypeMap: Record<string, string> = { builder_purchase: 'Builder Purchase', resale: 'Resale Property', bt: 'Balance Transfer', seller_bt: 'Seller Balance Transfer', lap: 'LAP (Loan Against Property)' }

    // Build image content array
    const imgContent: any[] = []
    if (images?.length) {
      for (const img of images) {
        imgContent.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
      }
    }

    // ============================================================
    // STAGE 1: PARALLEL EXTRACTION
    // 1A: General extraction (sale deed, 7/12, mutation, approvals)
    // 1B: Dedicated EC extraction (ALWAYS runs, no matter what)
    // Both run simultaneously -- faster + more reliable
    // ============================================================
    let ecRows: ECRow[] = []
    let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '', row_count: 0 }
    let extractedFacts: any = {
      sale_deeds: [], mutation_entries: [], revenue_record: {},
      na_order: {}, dev_permission: {}, oc_bcc: {}, rera: {},
      documents_found: [], property_description_consolidated: ''
    }

    if (ecData?.rows?.length) {
      // Pre-processed EC from frontend
      ecRows = ecData.rows
      ecMeta = { ec_app_number: ecData.ec_app_number || '', ec_date: ecData.ec_date || '', ec_from: ecData.ec_from || '', ec_to: ecData.ec_to || '', row_count: ecData.rows.length }
    } else if (imgContent.length > 0 || (documentText && documentText.trim().length > 50)) {

      // -- 1A: GENERAL EXTRACTION PROMPT --
      const generalContent: any[] = [...imgContent]
      if (documentText && String(documentText).trim().length > 50) {
        generalContent.push({ type: 'text', text: `DOCUMENT TEXT FROM PDFs:\n${String(documentText).slice(0, 7000)}` })
      }
      generalContent.push({
        type: 'text', text: `You are an Indian property document expert. Extract all information from these documents EXCEPT the EC table (handle separately).

Focus on extracting from:
- Sale Deeds: seller names, buyer names, dates, registration number, sub-registrar, survey no, plot no, flat no, floor, wing, building, society, area, consideration, boundaries, taluka, district
- 7/12 / Revenue Record: survey number (e.g. 214), ALL khata numbers listed (may be many like 73,137,1022...), owner name, total area with units (e.g. 2-16-42-10 H.Are.SqMt or 14068 Sq.Mt), land classification/type (e.g. Paiki Bin Kheti / Jirayat / Non-Agricultural), taluka, district
- Mutation entries: entry number, date, nature, from/to names, survey no, status
- NA Order: order number, date, authority
- Development Permission: permission number, date, authority, approved area
- OC / BCC / Completion Certificate: certificate number, date, authority
- RERA: registration number, promoter name
- All other documents: list them in documents_found

Output ONLY valid JSON, no markdown, no explanation:
{"sale_deeds":[{"seller_names":[],"buyer_names":[],"execution_date":"","registration_date":"","registration_no":"","sub_registrar_office":"","survey_no":"","plot_no":"","flat_no":"","floor_no":"","wing":"","building_name":"","society_name":"","area":"","consideration_amount":"","taluka":"","district":"","boundaries":{"east":"","west":"","north":"","south":""}}],"mutation_entries":[{"entry_no":"","date":"","nature":"","from_name":"","to_name":"","survey_no":"","status":""}],"revenue_record":{"survey_no":"","khata_no":"","owner_name":"","area":"","land_type":"","taluka":"","district":""},"na_order":{"order_no":"","date":"","authority":""},"dev_permission":{"permission_no":"","date":"","authority":"","approved_area":""},"oc_bcc":{"certificate_no":"","date":"","authority":""},"rera":{"registration_no":"","promoter_name":""},"property_description_consolidated":"","documents_found":[]}` })

      // -- 1B: DEDICATED EC EXTRACTION PROMPT --
      const ecContent: any[] = [...imgContent]
      ecContent.push({
        type: 'text', text: `You are an expert in Gujarat Sub-Registrar Encumbrance Certificates (EC). Find the EC document in these images and extract its data.

WHAT TO LOOK FOR - Gujarat EC document has:
- TITLE: "Badha Dastavejo ni Nondh" OR "Encumbrance Certificate" OR table with Gujarati headers
- HEADER at top of document:
  * Application Number = "Darkhast No." OR "E-No." OR any reference number -> ec_app_number
  * Issue date of EC -> ec_date (DD/MM/YYYY)
  * Period FROM date = "Muddatni Sharu Tarikh" OR "From" -> ec_from (DD/MM/YYYY)
  * Period TO date = "Muddatni Ant Tarikh" OR "To" OR "Sudhi" -> ec_to (DD/MM/YYYY)
  * IGNORE the "Arji Karta" (applicant name) row

- TABLE with 7 columns (IGNORE last/7th column completely):
  Col 1: Deed type (Vikray Patra/Sale, Baynama/Agreement, Mortgage/Girvitpatra, Release etc.)
  Col 2: Property description
  Col 3: "Dastavej Kari Aapnar" = WHO GIVES = Executant -> col3_aapnar
  Col 4: "Dastavej Kari Lenar" = WHO RECEIVES = Claimant -> col4_lenar
  Col 5: Registration date -> col5_date
  Col 6 (2nd LAST): Registration number -> col6_deed_no
  Col 7 (LAST): IGNORE COMPLETELY

IMPORTANT RULES:
- Even if EC has ZERO transaction rows, still extract app number, date, from, to from header
- Each data row in table = one entry in ec_rows array
- If you cannot find EC document, return empty strings but keep the JSON structure
- Read Gujarati text visually from images

Output ONLY valid JSON, no markdown:
{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","ec_rows":[{"row_number":1,"col1_raw_text":"","col2_property":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}]}` })

      // RUN BOTH IN PARALLEL
      const [genResult, ecResult] = await Promise.all([
        client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 2500, temperature: 0, messages: [{ role: 'user', content: generalContent }] }).catch(() => null),
        client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 2000, temperature: 0, messages: [{ role: 'user', content: ecContent }] }).catch(() => null),
      ])

      // Parse general extraction
      if (genResult) {
        const genRaw = genResult.content[0]?.type === 'text' ? genResult.content[0].text : '{}'
        const genData = safeJsonParse(genRaw)
        extractedFacts = {
          sale_deeds: genData.sale_deeds || [],
          mutation_entries: genData.mutation_entries || [],
          revenue_record: genData.revenue_record || {},
          na_order: genData.na_order || {},
          dev_permission: genData.dev_permission || {},
          oc_bcc: genData.oc_bcc || {},
          rera: genData.rera || {},
          documents_found: genData.documents_found || [],
          property_description_consolidated: genData.property_description_consolidated || ''
        }
      }

      // Parse EC extraction
      if (ecResult) {
        const ecRaw = ecResult.content[0]?.type === 'text' ? ecResult.content[0].text : '{}'
        const ecData2 = safeJsonParse(ecRaw)
        ecRows = ecData2.ec_rows || []
        ecMeta = {
          ec_app_number: ecData2.ec_app_number || '',
          ec_date: ecData2.ec_date || '',
          ec_from: ecData2.ec_from || '',
          ec_to: ecData2.ec_to || '',
          row_count: ecRows.length
        }
      }
    }

    // ============================================================
    // STAGE 2: DETERMINISTIC PROCESSING (code, not AI)
    // ============================================================

    // 2A: Mortgage lifecycle
    const lifecycle = mortgageLifecycle(ecRows)

    // 2B: Title chain
    const txnRecords: TxnRecord[] = (extractedFacts.sale_deeds || [])
      .filter((sd: any) => (sd.seller_names?.length || sd.buyer_names?.length))
      .map((sd: any) => ({
        seller: (sd.seller_names || []).filter(Boolean).join(' & ') || 'Unknown',
        buyer: (sd.buyer_names || []).filter(Boolean).join(' & ') || 'Unknown',
        instrument: 'Sale Deed',
        date: sd.registration_date || sd.execution_date || '',
        reg_no: sd.registration_no || '',
        sub_registrar: sd.sub_registrar_office || ''
      }))
    const chainNarrative = buildChainNarrative(txnRecords)

    // 2C: Resolve final values (form > extracted > default)
    const firstDeed = extractedFacts.sale_deeds?.[0] || {}
    const lastDeed = extractedFacts.sale_deeds?.[extractedFacts.sale_deeds?.length - 1] || {}
    const finalApplicant = applicantName || 'As per Application'
    const finalCoApp = coApplicant || 'Not Applicable'
    const finalOwner = currentOwner || (txnRecords.length > 0 ? txnRecords[txnRecords.length - 1].buyer : 'As per Documents')
    const finalBank = bankName || 'Bank'
    const finalAddress = propertyAddress || extractedFacts.property_description_consolidated || 'As per Documents'
    const finalEast = boundaryEast || lastDeed?.boundaries?.east || firstDeed?.boundaries?.east || 'As per Documents'
    const finalWest = boundaryWest || lastDeed?.boundaries?.west || firstDeed?.boundaries?.west || 'As per Documents'
    const finalNorth = boundaryNorth || lastDeed?.boundaries?.north || firstDeed?.boundaries?.north || 'As per Documents'
    const finalSouth = boundarySouth || lastDeed?.boundaries?.south || firstDeed?.boundaries?.south || 'As per Documents'
    const existingBank = lifecycle.active[0]?.lender || lifecycle.released[0]?.lender || 'N/A'

    // 2D: Risk findings
    const riskFindings: RiskFinding[] = []
    if (lifecycle.active.length > 0) {
      riskFindings.push({ code: 'ACTIVE_MORTGAGE', severity: 'critical', description: `Active mortgage in favour of ${lifecycle.active.map(a => a.lender).join(', ')} vide Deed No. ${lifecycle.active.map(a => a.deed_no).join(', ')} dated ${lifecycle.active.map(a => a.date).join(', ')}.`, evidence: 'Encumbrance Certificate' })
    }
    if (!extractedFacts.na_order?.order_no && (caseType === 'builder_purchase' || caseType === 'resale')) {
      riskFindings.push({ code: 'NA_ORDER_MISSING', severity: 'medium', description: 'NA Order (Non-Agricultural Conversion Order) not provided for scrutiny.', evidence: 'Document checklist' })
    }
    if (!extractedFacts.oc_bcc?.certificate_no) {
      riskFindings.push({ code: 'OC_MISSING', severity: 'low', description: 'Occupancy Certificate / Completion Certificate not provided.', evidence: 'Document checklist' })
    }
    const riskResult = computeRiskScore(riskFindings)

    // Pre-build HTML tables
    const ecTableHtml = ecRows.length > 0 ? buildECTable(ecRows, lifecycle) : '<p style="color:#666;font-style:italic;">No EC entries found.</p>'
    const mutTableHtml = buildMutationTable(extractedFacts.mutation_entries)
    const legalOpinion = getLegalOpinion(caseType, finalOwner, finalApplicant, existingBank)

    // ============================================================
    // GROUND TRUTH -- all verified facts fed to report AI
    // ============================================================
    const GT = `
VERIFIED FACTS - USE EXACTLY - DO NOT CHANGE OR HALLUCINATE:

CASE: ${caseType} | ${loanTypeMap[caseType] || 'LAP'} | App ID: ${appId || refNo} | Ref: ${refNo} | Date: ${today}
BANK: ${finalBank}
APPLICANT: ${finalApplicant}
CO-APPLICANT: ${finalCoApp}
CURRENT OWNER / MORTGAGOR: ${finalOwner}

PROPERTY:
Address: ${finalAddress}
Survey/Plot No: ${firstDeed.survey_no || firstDeed.plot_no || lastDeed.survey_no || 'As per documents'}
Flat/Unit: ${lastDeed.flat_no || firstDeed.flat_no || ''}
Floor/Wing: ${lastDeed.floor_no || ''} ${lastDeed.wing || ''}
Building/Society: ${lastDeed.building_name || lastDeed.society_name || firstDeed.building_name || ''}
Area: ${lastDeed.area || firstDeed.area || 'As per documents'}
Taluka: ${firstDeed.taluka || lastDeed.taluka || ''}
District: ${firstDeed.district || lastDeed.district || ''}
East: ${finalEast} | West: ${finalWest} | North: ${finalNorth} | South: ${finalSouth}

SALE DEEDS (${(extractedFacts.sale_deeds || []).length} found):
${(extractedFacts.sale_deeds || []).map((sd: any, i: number) => `  Deed ${i + 1}: Seller: ${(sd.seller_names || []).join(', ') || 'Unknown'} | Buyer: ${(sd.buyer_names || []).join(', ') || 'Unknown'} | Reg.No: ${sd.registration_no || 'N/A'} | Date: ${sd.registration_date || sd.execution_date || 'N/A'} | Sub-Reg: ${sd.sub_registrar_office || 'N/A'} | Consideration: ${sd.consideration_amount || 'N/A'}`).join('\n') || '  Not extracted'}

TITLE CHAIN: ${chainNarrative}

EC DATA:
App No: ${ecMeta.ec_app_number || 'N/A'} | Date: ${ecMeta.ec_date || 'N/A'} | Period: ${ecMeta.ec_from || 'N/A'} to ${ecMeta.ec_to || 'N/A'} | Entries: ${ecMeta.row_count}
Encumbrance Status: ${lifecycle.encumbrance}
Summary: ${lifecycle.summary}
Active Mortgages: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => `${a.lender} Deed:${a.deed_no} Date:${a.date}`).join(' | ')}
Released Mortgages: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => `${r.lender} released vide ${r.release_deed_no} on ${r.release_date}`).join(' | ')}

REVENUE RECORD (7/12):
Survey No: ${extractedFacts.revenue_record?.survey_no || 'NOT PROVIDED'}
Khata No: ${extractedFacts.revenue_record?.khata_no || 'NOT PROVIDED'}
Owner: ${extractedFacts.revenue_record?.owner_name || 'NOT PROVIDED'}
Area: ${extractedFacts.revenue_record?.area || 'NOT PROVIDED'}
Land Type: ${extractedFacts.revenue_record?.land_type || 'NOT PROVIDED'}
Taluka/District: ${extractedFacts.revenue_record?.taluka || ''} / ${extractedFacts.revenue_record?.district || ''}

MUTATION ENTRIES: ${(extractedFacts.mutation_entries || []).length} found

REGULATORY APPROVALS:
NA Order: ${extractedFacts.na_order?.order_no ? `No. ${extractedFacts.na_order.order_no} dated ${extractedFacts.na_order.date} by ${extractedFacts.na_order.authority}` : 'NOT PROVIDED'}
Dev Permission: ${extractedFacts.dev_permission?.permission_no ? `No. ${extractedFacts.dev_permission.permission_no} dated ${extractedFacts.dev_permission.date} by ${extractedFacts.dev_permission.authority}` : 'NOT PROVIDED'}
OC/BCC: ${extractedFacts.oc_bcc?.certificate_no ? `No. ${extractedFacts.oc_bcc.certificate_no} dated ${extractedFacts.oc_bcc.date}` : 'NOT PROVIDED'}
RERA: ${extractedFacts.rera?.registration_no ? `No. ${extractedFacts.rera.registration_no} Promoter: ${extractedFacts.rera.promoter_name}` : 'NOT PROVIDED'}
Documents Found: ${(extractedFacts.documents_found || []).join(', ') || 'As per uploaded files'}

RISK: Score ${riskResult.score}/100 | Rating: ${riskResult.rating}
Findings: ${riskFindings.length === 0 ? 'NONE' : riskFindings.map(r => `[${r.severity.toUpperCase()}] ${r.code}: ${r.description}`).join(' || ')}

LEGAL OPINION TEXT (copy exactly in Part VIII):
${legalOpinion}

ABSOLUTE RULES:
1. Never mention any company other than TITLEMATRIXAI
2. Never mention EC column 7 or EC applicant name
3. Never mention loan amount or stamp paper number
4. Never invent facts not listed above
5. NOT PROVIDED fields = write "NOT PROVIDED" in report
6. Released mortgage = never flag as active
7. Co-Applicant = EXACTLY "${finalCoApp}" -- do not change this
8. Applicant = EXACTLY "${finalApplicant}"
9. Bank = EXACTLY "${finalBank}"
10. Part I Borrower table = ONLY 3 rows: Name of Borrower, Co-Applicant, Constitution
`

    // ============================================================
    // STAGE 3: 4 PARALLEL REPORT GENERATION CALLS
    // ============================================================
    const [r4a, r4b, r4c, r4d] = await Promise.all([

      // CALL A: Part I, II, III
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3500, temperature: 0,
        system: `You are a legal report writer generating a LEGAL HTML DOCUMENT. CRITICAL OUTPUT RULES: (1) Output ONLY raw HTML - start DIRECTLY with <hr><div class="ph">PART I - NEVER add preamble text or markdown code blocks or backticks. (2) Part I Borrower table has EXACTLY 3 rows ONLY: Name of Borrower, Co-Applicant, Constitution - NO other rows. (3) Co-Applicant MUST be EXACTLY "${finalCoApp}" - copy verbatim. (4) Never use triple backticks. Never say "I'll generate" or "Let me". Start directly with HTML.`,
        messages: [{
          role: 'user', content: `${GT}

Generate PART I, PART II, PART III as HTML.

PART I - output EXACTLY this structure:
<hr><div class="ph">PART I - BORROWER / MORTGAGOR / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div>
<table class="mt">
<tr><td>Name of Borrower / Applicant</td><td>:</td><td>${finalApplicant}</td></tr>
<tr><td>Co-Applicant</td><td>:</td><td>${finalCoApp}</td></tr>
<tr><td>Constitution</td><td>:</td><td>Individual</td></tr>
</table>
<div class="sph">B. Mortgagor / Current Owner Details</div>
<table class="mt">
<tr><td>Name of Mortgagor</td><td>:</td><td>${finalOwner}</td></tr>
<tr><td>Relation to Borrower</td><td>:</td><td>[Builder / Owner / Self as applicable]</td></tr>
<tr><td>Type of Transaction</td><td>:</td><td>${loanTypeMap[caseType] || 'LAP'}</td></tr>
</table>
<div class="sph">C. Current Ownership</div>
<table class="mt">
<tr><td>Current Owner</td><td>:</td><td>${finalOwner}</td></tr>
<tr><td>Mode of Acquisition</td><td>:</td><td>[from VERIFIED FACTS sale deeds]</td></tr>
<tr><td>Registration Details</td><td>:</td><td>[Reg No and date from latest deed in VERIFIED FACTS]</td></tr>
<tr><td>Sub-Registrar Office</td><td>:</td><td>[from VERIFIED FACTS]</td></tr>
<tr><td>Proposed Purchaser / Mortgagor</td><td>:</td><td>${finalApplicant}</td></tr>
</table>

PART II - Property description paragraph + boundaries table. Use ALL property details from VERIFIED FACTS.

PART III - List all scrutinized documents with dates and registration numbers from VERIFIED FACTS. Include EC as: Encumbrance Certificate (EC) -- App No: ${ecMeta.ec_app_number || 'N/A'}, EC Date: ${ecMeta.ec_date || 'N/A'}, Period: ${ecMeta.ec_from || 'N/A'} to ${ecMeta.ec_to || 'N/A'}, Total Transactions: ${ecMeta.row_count}, Status: ${lifecycle.encumbrance}.

Start with: <hr><div class="ph">PART I` }]
      }),

      // CALL B: Part IV, V
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0,
        system: 'Legal report writer. Output ONLY raw HTML starting with <hr>. Never use markdown code blocks or backticks. Never add preamble text. Start directly with HTML.',
        messages: [{
          role: 'user', content: `${GT}

EC TABLE HTML (insert exactly where shown):
${ecTableHtml}

MUTATION TABLE HTML (insert exactly where shown):
${mutTableHtml}

Generate PART IV and PART V.

PART IV - Chronological title chain:
Rules: Oldest first. First para NO "Thereafter". Each next MUST start "Thereafter,". Use TITLE CHAIN from VERIFIED FACTS. Released mortgage: "...stands fully discharged and released vide Release Deed No. [X] dated [Y]..." Active mortgage: "...subsisting and active charge as on date..." Final para: EC App No ${ecMeta.ec_app_number || 'N/A'} dated ${ecMeta.ec_date || 'N/A'} period ${ecMeta.ec_from || 'N/A'} to ${ecMeta.ec_to || 'N/A'}. Encumbrance: ${lifecycle.encumbrance}. ${lifecycle.summary}

PART V - Approvals and compliance. Include revenue records, [INSERT MUTATION TABLE], regulatory approvals, [INSERT EC TABLE], EC analysis with status: ${lifecycle.encumbrance}. ${lifecycle.summary}

Start with: <hr><div class="ph">PART IV` }]
      }),

      // CALL C: Part VI, VII, VIII
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 5000, temperature: 0,
        system: 'Legal report writer. Output ONLY raw HTML starting with <hr>. Never use markdown code blocks or backticks. Never add preamble text. Start directly with HTML.',
        messages: [{
          role: 'user', content: `${GT}

Generate PART VI, PART VII, PART VIII.

PART VI - Max 5-6 alerts. Use <div class="ib"><span class="sh">CRITICAL</span> or <span class="sh">HIGH</span> or <span class="sm">MEDIUM</span> or <span class="sl">LOW</span><div class="it">[Title]</div><p>[Details]</p></div>. Never flag released mortgage as active. Base on RISK FINDINGS in VERIFIED FACTS.

PART VII - Document deficiency with sections A (available), B (critical missing), C (requiring verification), D (illegible - NIL if none), E (risk assessment table with Risk Score: ${riskResult.score}/100, Rating: ${riskResult.rating}, Encumbrance: ${lifecycle.encumbrance}, Mortgageability, SARFAESI, Lending Suitability).

PART VIII - Legal opinion: <p>${legalOpinion}</p> Then verdict based on rating ${riskResult.rating}: GREEN=vc class CLEAR AND MARKETABLE TITLE, AMBER=vs class CLEAR SUBJECT TO CONDITIONS, RED=vnc class TITLE NOT CLEAR.

Start with: <hr><div class="ph">PART VI` }]
      }),

      // CALL D: Part IX, X, XI
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 2500, temperature: 0,
        system: 'Legal report writer. HTML only. No markdown.',
        messages: [{
          role: 'user', content: `${GT}

Generate PART IX (pre-disbursement docs for case type ${caseType}), PART X (post-disbursement docs), PART XI (final recommendation with final-rec div class, title status ${riskResult.rating === 'GREEN' ? 'CLEAR AND MARKETABLE TITLE' : riskResult.rating === 'AMBER' ? 'CLEAR TITLE SUBJECT TO CONDITIONS' : 'TITLE NOT CLEAR'}, 3-4 sentence summary including EC status: ${lifecycle.summary} and risk score ${riskResult.score}/100 ${riskResult.rating}).

Start with: <hr><div class="ph">PART IX` }]
      })
    ])

    // ============================================================
    // ASSEMBLE FINAL REPORT
    // ============================================================
    const parts = [r4a, r4b, r4c, r4d].map(r => r.content[0]?.type === 'text' ? r.content[0].text : '').map(cleanAiOutput).join('\n')
    const html = buildReport({ refNo, appId: appId || 'AUTO', today, bankName: finalBank, loanType: loanTypeMap[caseType] || 'LAP', riskRating: riskResult.rating, riskScore: riskResult.score, parts })
    const verdict = riskResult.rating === 'RED' ? 'NOT CLEAR' : riskResult.rating === 'GREEN' ? 'CLEAR' : 'CLEAR SUBJECT TO CONDITIONS'

    if (userId && supabase) {
      try {
        await supabase.from('reports').insert({ user_id: userId, case_type: caseType || 'lap', applicant_name: finalApplicant, bank_name: finalBank, property_address: finalAddress, app_id: appId || refNo, verdict, report_html: html })
      } catch (e) { console.error('Supabase error:', e) }
    }

    return NextResponse.json({ success: true, report: html, verdict, lifecycle, riskScore: riskResult, ecData: { rows: ecRows, ...ecMeta }, extractedFacts })

  } catch (e: any) {
    console.error('TITLEMATRIXAI v4 error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Analysis failed. Please try again.' }, { status: 500 })
  }
}