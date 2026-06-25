// ================================================================
// TITLEMATRIXAI v3 -- /api/analyze/route.ts
// 3-STAGE ARCHITECTURE (Blueprint-based):
// Stage 1: ONE comprehensive extraction call (EC + all documents)
// Stage 2: Deterministic processing (mortgage lifecycle, title chain, risk score)
// Stage 3: Evidence-backed report generation (4 parallel calls)
// AI reads. Code decides. Report is always grounded in facts.
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
  'GRUH', 'SUNDARAM', 'INDIA BULLS', 'INDIA INFOLINE', 'IIFL',
]
function isBank(name: string): boolean {
  if (!name) return false
  const u = name.toUpperCase()
  return BANK_PATTERNS.some(p => u.includes(p))
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
  lender: string
  borrower: string
  deed_no: string
  date: string
  row: number
  status: 'ACTIVE' | 'RELEASED'
  release_deed_no?: string
  release_date?: string
}

interface RiskFinding {
  code: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  evidence: string
}

interface TxnRecord {
  seller: string
  buyer: string
  instrument: string
  date: string
  reg_no: string
  sub_registrar: string
}

// ================================================================
// STAGE 2A: DETERMINISTIC MORTGAGE LIFECYCLE
// ================================================================
function mortgageLifecycle(rows: ECRow[]): {
  active: Charge[]
  released: Charge[]
  summary: string
  encumbrance: string
} {
  const charges: Charge[] = []

  // PASS 1: Find all mortgages (col4=Bank, col3=Owner)
  for (const r of rows) {
    if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) {
      charges.push({
        lender: r.col4_lenar,
        borrower: r.col3_aapnar,
        deed_no: r.col6_deed_no,
        date: r.col5_date,
        row: r.row_number,
        status: 'ACTIVE'
      })
    }
  }

  // PASS 2: Find releases (col3=Bank = ROLE FLIP = Release)
  for (const r of rows) {
    if (isBank(r.col3_aapnar)) {
      const bankWords = r.col3_aapnar.toUpperCase().split(' ').filter((w: string) => w.length > 3)
      const match = charges.find(c =>
        bankWords.some((w: string) => c.lender.toUpperCase().includes(w))
      )
      if (match) {
        match.status = 'RELEASED'
        match.release_deed_no = r.col6_deed_no
        match.release_date = r.col5_date
      }
    }
  }

  const active = charges.filter(c => c.status === 'ACTIVE')
  const released = charges.filter(c => c.status === 'RELEASED')

  const encumbrance = active.length > 0
    ? 'ENCUMBERED'
    : released.length > 0 ? 'CLEAR_WITH_PRIOR_RELEASE' : 'CLEAR'

  const summary = active.length === 0
    ? released.length > 0
      ? `CLEAR. Prior mortgage by ${released.map(r => r.lender).join(', ')} stands fully RELEASED and DISCHARGED vide Release Deed No. ${released.map(r => r.release_deed_no).join(', ')}.`
      : 'CLEAR. No encumbrance found in EC.'
    : `ENCUMBERED. Active mortgage: ${active.map(a => `${a.lender} Deed No.${a.deed_no} dated ${a.date}`).join('; ')}`

  return { active, released, summary, encumbrance }
}

// ================================================================
// STAGE 2B: RISK SCORING (blueprint algorithm 10)
// ================================================================
function computeRiskScore(findings: RiskFinding[]): {
  score: number
  rating: 'RED' | 'AMBER' | 'GREEN'
} {
  const weights: Record<string, number> = { critical: 40, high: 25, medium: 10, low: 3 }
  let score = 0
  for (const f of findings) score += (weights[f.severity] || 3)
  score = Math.min(100, score)
  if (findings.some(f => f.severity === 'critical') || score >= 60) return { score, rating: 'RED' }
  if (score >= 25) return { score, rating: 'AMBER' }
  return { score, rating: 'GREEN' }
}

// ================================================================
// STAGE 2C: TITLE CHAIN NARRATIVE (blueprint algorithm 7)
// ================================================================
function buildChainNarrative(txns: TxnRecord[]): string {
  if (!txns.length) return 'Title chain to be verified from submitted documents.'
  const sorted = [...txns].sort((a, b) => {
    // Sort by date (DD/MM/YYYY or YYYY format)
    const parseDate = (d: string) => {
      if (!d) return 0
      const parts = d.split('/')
      if (parts.length === 3) return parseInt(parts[2] + parts[1] + parts[0])
      return parseInt(d.replace(/-/g, ''))
    }
    return parseDate(a.date) - parseDate(b.date)
  })
  return sorted.map((t, i) => {
    const prefix = i === 0 ? '' : 'Thereafter, '
    return `${prefix}${t.seller} executed and registered ${t.instrument} in favour of ${t.buyer} bearing Registration No. ${t.reg_no || '[as per document]'} dated ${t.date || '[as per document]'}${t.sub_registrar ? ` before Sub-Registrar, ${t.sub_registrar}` : ''}.`
  }).join(' ')
}

// ================================================================
// CSS
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:6px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555;font-weight:600}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:14px 18px;margin:10px 0 14px;font-style:italic;line-height:2.1}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.ib{margin-bottom:14px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px;letter-spacing:.5px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px;letter-spacing:.5px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px;letter-spacing:.5px}.it{font-weight:bold;font-size:13px;margin-bottom:4px;color:#1a1a1a}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:5px;padding-left:4px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px;font-weight:700}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;font-size:11px}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}.ec-unk{color:#b45309;font-style:italic}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:10px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}.vnc{margin-top:16px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vc{margin-top:16px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:16px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}.risk-badge{display:inline-block;padding:4px 12px;border-radius:3px;font-weight:bold;font-size:12px;margin-top:4px}@media print{body{padding:30px 40px}.ib{page-break-inside:avoid}}`

// ================================================================
// LEGAL OPINIONS (case-specific)
// ================================================================
function getLegalOpinion(ct: string, owner: string, applicant: string, existingBank: string): string {
  const op: Record<string, string> = {
    builder_purchase: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    resale: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
    bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${owner} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`,
    seller_bt: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of ${existingBank} and after the execution and registration of deed of release of mortgage unto and in favour of ${owner} and after the execution and registration of sale deed unto and in favour of ${applicant} and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of ${existingBank}.`,
    lap: `On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of ${owner} in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.`,
  }
  return op[ct] || op['lap']
}

// ================================================================
// EC TABLE HTML (deterministic - code builds this, not AI)
// ================================================================
function buildECTable(rows: ECRow[], lifecycle: any): string {
  let html = `<table class="ec-tbl"><tr><th>Sr.</th><th>Document Type</th><th>Deed No.</th><th>Date</th><th>Executing Party / Col 3 (Aapnar)</th><th>Claimant Party / Col 4 (Lenar)</th><th>Status</th></tr>`
  for (const row of rows) {
    const isReleaseRow = isBank(row.col3_aapnar) && !isBank(row.col4_lenar)
    const isMortgageRow = isBank(row.col4_lenar) && !isBank(row.col3_aapnar)
    const isActiveMortgage = lifecycle.active.some((c: Charge) => c.row === row.row_number)
    let statusClass = '', statusText = '', typeText = row.col1_raw_text || 'Transaction'
    if (isReleaseRow) {
      statusClass = 'ec-rel'
      statusText = 'RELEASED / DISCHARGED'
      typeText = 'Mortgage Release Deed'
    } else if (isMortgageRow && isActiveMortgage) {
      statusClass = 'ec-act'
      statusText = 'ACTIVE MORTGAGE'
      typeText = 'Mortgage Deed'
    } else if (isMortgageRow && !isActiveMortgage) {
      statusClass = 'ec-rel'
      statusText = 'MORTGAGE - RELEASED'
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
// MUTATION TABLE HTML
// ================================================================
function buildMutationTable(mutations: any[]): string {
  if (!mutations || !mutations.length) return '<p style="color:#666;font-size:12px;">Mutation entries not provided or not extracted.</p>'
  let html = `<table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Nature</th><th>From</th><th>To</th><th>Survey No.</th><th>Status</th></tr>`
  mutations.forEach((m: any, i: number) => {
    html += `<tr><td>${i + 1}</td><td>${m.entry_no || '--'}</td><td>${m.date || '--'}</td><td>${m.nature || '--'}</td><td>${m.from_name || '--'}</td><td>${m.to_name || '--'}</td><td>${m.survey_no || '--'}</td><td>${m.status || '--'}</td></tr>`
  })
  html += `</table>`
  return html
}

// ================================================================
// REPORT HTML BUILDER
// ================================================================
function buildReport(p: any): string {
  const ratingColor = p.riskRating === 'RED' ? '#b91c1c' : p.riskRating === 'AMBER' ? '#b45309' : '#15803d'
  const ratingBg = p.riskRating === 'RED' ? '#FEF2F2' : p.riskRating === 'AMBER' ? '#FFFBEB' : '#F0FDF4'
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report - ${p.refNo}</title><style>${CSS}</style></head><body>
<div class="hdr">
  <div>
    <div class="firm">TITLEMATRIXAI</div>
    <div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div>
    <div class="sub">Panel Legal Counsel - Mortgage, Banking &amp; Real Estate</div>
    <div class="sub">support@titlematrixai.com | www.titlematrixai.in</div>
  </div>
  <div class="hdr-right">
    <div><strong>Ref No.:</strong> ${p.refNo}</div>
    <div><strong>App ID:</strong> ${p.appId}</div>
    <div><strong>Date:</strong> ${p.today}</div>
    <div><strong>Bank:</strong> ${p.bankName}</div>
    <div class="risk-badge" style="background:${ratingBg};color:${ratingColor};border:1px solid ${ratingColor};">RISK: ${p.riskRating} (${p.riskScore}/100)</div>
  </div>
</div>
<div class="rtitle">LEGAL SCRUTINY REPORT - ${p.loanType}</div><hr>
${p.parts}
<hr>
<div class="sigrow">
  <div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div>
  <div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName}</div></div>
</div>
<div class="ftr">
  Generated by TITLEMATRIXAI | support@titlematrixai.com
  <div class="disc">DISCLAIMER: This report is prepared for ${p.bankName} (App ID: ${p.appId}). It is based solely on the documents produced for scrutiny and does not constitute a guarantee of title. Independent legal verification is recommended for high-value transactions.</div>
  <div class="wm">TITLEMATRIXAI - CONFIDENTIAL - FOR BANK USE ONLY</div>
</div>
</body></html>`
}

// ================================================================
// MAIN HANDLER
// ================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      images, caseType, appId, bankName,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth,
      userId, documentText, ecData
    } = body

    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TM/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`
    const loanTypeMap: Record<string, string> = {
      builder_purchase: 'Builder Purchase',
      resale: 'Resale Property',
      bt: 'Balance Transfer',
      seller_bt: 'Seller Balance Transfer',
      lap: 'LAP (Loan Against Property)'
    }

    // Build image content
    const imgContent: any[] = []
    if (images?.length) {
      for (const img of images) {
        imgContent.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.data }
        })
      }
    }

    // ============================================================
    // STAGE 1: COMPREHENSIVE FIELD EXTRACTION
    // ONE AI CALL extracts EC rows + ALL document fields
    // This is the blueprint "Structured field extraction" step
    // ============================================================
    let ecRows: ECRow[] = []
    let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '', row_count: 0 }
    let extractedFacts: any = {
      sale_deeds: [],
      mutation_entries: [],
      revenue_record: {},
      na_order: {},
      dev_permission: {},
      oc_bcc: {},
      rera: {},
      documents_found: [],
      property_description_consolidated: ''
    }

    if (ecData?.rows?.length) {
      // Frontend pre-processed EC -- use directly
      ecRows = ecData.rows
      ecMeta = {
        ec_app_number: ecData.ec_app_number || '',
        ec_date: ecData.ec_date || '',
        ec_from: ecData.ec_from || '',
        ec_to: ecData.ec_to || '',
        row_count: ecData.rows.length
      }
    } else {
      // Extract ALL facts from documents in one comprehensive call
      const extractContent: any[] = [...imgContent]

      if (documentText && String(documentText).trim().length > 50) {
        extractContent.push({
          type: 'text',
          text: `DOCUMENT TEXT FROM PDFs:\n${String(documentText).slice(0, 8000)}`
        })
      }

      extractContent.push({
        type: 'text',
        text: `You are an expert in Indian property legal documents especially Gujarat Sub-Registrar documents. Extract ALL information carefully from every document image shown.

================================================================
GUJARAT ENCUMBRANCE CERTIFICATE (EC) - DETAILED READING GUIDE
================================================================
EC document from Gujarat Sub-Registrar has this structure:

HEADER SECTION (very top of EC document):
- EC Application Number: Look for "Darkhast No." OR "E-No." OR "No." printed near title. -> ec_app_number
- Issue Date: When EC was generated -> ec_date  
- Period FROM date: "Muddatni Sharu Tarikh" or "From" date -> ec_from (DD/MM/YYYY)
- Period TO date: "Muddatni Ant Tarikh" or "To" date -> ec_to (DD/MM/YYYY)
- IGNORE: "Arji Karta" (applicant name) row - never extract this

EC TABLE - 7 COLUMNS (left to right):
  Col 1 (FIRST):       Deed type (Sale Deed / Mortgage / Release / Gift)
  Col 2 (SECOND):      Property description
  Col 3 (THIRD):       "Dastavej Kari Aapnar" = WHO GIVES = Executant party -> col3_aapnar
  Col 4 (FOURTH):      "Dastavej Kari Lenar" = WHO RECEIVES = Claimant party -> col4_lenar
  Col 5 (FIFTH):       Registration date -> col5_date
  Col 6 (SECOND LAST): Registration number / Deed number -> col6_deed_no
  Col 7 (LAST):        COMPLETELY IGNORE - never read, never extract

MORTGAGE vs RELEASE:
- Col3=BANK + Col4=OWNER = RELEASE DEED (mortgage discharged)
- Col3=OWNER + Col4=BANK = MORTGAGE DEED (active charge)

CRITICAL: Even if EC has ZERO transaction rows, still extract ec_app_number, ec_date, ec_from, ec_to from the header section of the EC document.

================================================================
OTHER DOCUMENTS
================================================================
- Sale Deed: seller name, buyer name, registration number, date, Sub-Registrar, survey no, flat no, area, boundaries
- 7/12 Extract: survey number, owner name (Khatedaar), area (Visata), land type
- Mutation: entry number, date, from/to names, survey number
- All Gujarati text: read visually from images, transliterate to English

Output ONLY valid JSON. No markdown. No explanation. No preamble:
{
  "ec_app_number": "",
  "ec_date": "",
  "ec_from": "",
  "ec_to": "",
  "ec_rows": [
    {
      "row_number": 1,
      "col1_raw_text": "",
      "col2_property": "",
      "col3_aapnar": "",
      "col4_lenar": "",
      "col5_date": "",
      "col6_deed_no": ""
    }
  ],
  "sale_deeds": [
    {
      "seller_names": [""],
      "buyer_names": [""],
      "execution_date": "",
      "registration_date": "",
      "registration_no": "",
      "sub_registrar_office": "",
      "survey_no": "",
      "plot_no": "",
      "flat_no": "",
      "floor_no": "",
      "wing": "",
      "building_name": "",
      "society_name": "",
      "area": "",
      "consideration_amount": "",
      "taluka": "",
      "district": "",
      "boundaries": { "east": "", "west": "", "north": "", "south": "" }
    }
  ],
  "mutation_entries": [
    {
      "entry_no": "",
      "date": "",
      "nature": "",
      "from_name": "",
      "to_name": "",
      "survey_no": "",
      "status": ""
    }
  ],
  "revenue_record": {
    "survey_no": "",
    "khata_no": "",
    "owner_name": "",
    "area": "",
    "land_type": "",
    "taluka": "",
    "district": ""
  },
  "na_order": { "order_no": "", "date": "", "authority": "", "purpose": "" },
  "dev_permission": { "permission_no": "", "date": "", "authority": "", "approved_area": "" },
  "oc_bcc": { "certificate_no": "", "date": "", "authority": "" },
  "rera": { "registration_no": "", "promoter_name": "", "expiry_date": "" },
  "property_description_consolidated": "",
  "documents_found": []
}`
      })

      try {
        const extractRes = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          temperature: 0,
          messages: [{ role: 'user', content: extractContent }]
        })
        const rawText = extractRes.content[0].type === 'text' ? extractRes.content[0].text : '{}'
        let extracted: any = {}
        const attempts = [
          rawText.trim(),
          rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(),
          (rawText.match(/\{[\s\S]*\}/) || ['{}'])[0]
        ]
        for (const attempt of attempts) {
          try { extracted = JSON.parse(attempt); break } catch { }
        }

        ecRows = extracted.ec_rows || []
        ecMeta = {
          ec_app_number: extracted.ec_app_number || '',
          ec_date: extracted.ec_date || '',
          ec_from: extracted.ec_from || '',
          ec_to: extracted.ec_to || '',
          row_count: ecRows.length
        }
        extractedFacts = {
          sale_deeds: extracted.sale_deeds || [],
          mutation_entries: extracted.mutation_entries || [],
          revenue_record: extracted.revenue_record || {},
          na_order: extracted.na_order || {},
          dev_permission: extracted.dev_permission || {},
          oc_bcc: extracted.oc_bcc || {},
          rera: extracted.rera || {},
          documents_found: extracted.documents_found || [],
          property_description_consolidated: extracted.property_description_consolidated || ''
        }

        // FALLBACK: If EC app number still missing, try dedicated EC extraction
        if (!ecMeta.ec_app_number && imgContent.length > 0) {
          try {
            const ecFallbackContent: any[] = [...imgContent]
            ecFallbackContent.push({
              type: 'text',
              text: `These are images of a Gujarat Encumbrance Certificate (EC). Find and extract ONLY the EC header information and table rows.

Look at the TOP of the EC document for:
1. Application/Reference number (Darkhast No / E-No) -> ec_app_number
2. Issue date of EC -> ec_date
3. Search period start date (From / Sharu) -> ec_from
4. Search period end date (To / Ant / Sudhi) -> ec_to

Look at the TABLE in the EC for rows with these 6 columns (ignore 7th/last column):
Col1=Deed type, Col2=Property, Col3=Executant(Aapnar/who gives), Col4=Claimant(Lenar/who receives), Col5=Date, Col6=Reg.No.

Output ONLY valid JSON, no markdown:
{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","ec_rows":[{"row_number":1,"col1_raw_text":"","col2_property":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}]}`
            })
            const ecFallbackRes = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 2000,
              temperature: 0,
              messages: [{ role: 'user', content: ecFallbackContent }]
            })
            const ecRaw2 = ecFallbackRes.content[0].type === 'text' ? ecFallbackRes.content[0].text : '{}'
            let ecExtracted2: any = {}
            const attempts2 = [ecRaw2.trim(), ecRaw2.replace(/```json
              ? /g,'').replace(/```
?/g,'').trim(), (ecRaw2.match(/\{[\s\S]*\}/) || ['{}'])[0]]
            for (const a of attempts2) { try { ecExtracted2 = JSON.parse(a); break } catch {} }
            if (ecExtracted2.ec_app_number || (ecExtracted2.ec_rows && ecExtracted2.ec_rows.length > 0)) {
              ecRows = ecExtracted2.ec_rows || ecRows
              ecMeta = {
                ec_app_number: ecExtracted2.ec_app_number || ecMeta.ec_app_number,
                ec_date: ecExtracted2.ec_date || ecMeta.ec_date,
                ec_from: ecExtracted2.ec_from || ecMeta.ec_from,
                ec_to: ecExtracted2.ec_to || ecMeta.ec_to,
                row_count: ecRows.length
              }
            }
          } catch(ecErr) { console.error('EC fallback failed:', ecErr) }
        }

      } catch (e) {
        console.error('Stage 1 extraction failed:', e)
        // Continue with empty facts -- report will show what's available
      }
    }

    // ============================================================
    // STAGE 2: DETERMINISTIC PROCESSING (code, not AI)
    // ============================================================

    // 2A: Mortgage lifecycle
    const lifecycle = mortgageLifecycle(ecRows)

    // 2B: Title chain from extracted sale deeds
    const txnRecords: TxnRecord[] = (extractedFacts.sale_deeds || [])
      .filter((sd: any) => (sd.seller_names && sd.seller_names.length > 0) || (sd.buyer_names && sd.buyer_names.length > 0))
      .map((sd: any) => ({
        seller: (sd.seller_names || []).filter(Boolean).join(' & ') || 'Unknown',
        buyer: (sd.buyer_names || []).filter(Boolean).join(' & ') || 'Unknown',
        instrument: 'Sale Deed',
        date: sd.registration_date || sd.execution_date || '',
        reg_no: sd.registration_no || '',
        sub_registrar: sd.sub_registrar_office || ''
      }))

    const chainNarrative = buildChainNarrative(txnRecords)

    // 2C: Resolve final values (form data takes priority over extracted)
    const firstDeed = extractedFacts.sale_deeds?.[0] || {}
    const lastDeed = extractedFacts.sale_deeds?.[extractedFacts.sale_deeds.length - 1] || {}

    const finalApplicant = applicantName || 'As per Application'
    const finalCoApp     = coApplicant || 'Not Applicable'
    const finalOwner     = currentOwner || (txnRecords.length > 0 ? txnRecords[txnRecords.length - 1].buyer : 'As per Documents')
    const finalBank      = bankName || 'Bank'
    const finalAddress   = propertyAddress || extractedFacts.property_description_consolidated || 'As per Documents'
    const finalEast      = boundaryEast  || lastDeed?.boundaries?.east  || firstDeed?.boundaries?.east  || 'As per Documents'
    const finalWest      = boundaryWest  || lastDeed?.boundaries?.west  || firstDeed?.boundaries?.west  || 'As per Documents'
    const finalNorth     = boundaryNorth || lastDeed?.boundaries?.north || firstDeed?.boundaries?.north || 'As per Documents'
    const finalSouth     = boundarySouth || lastDeed?.boundaries?.south || firstDeed?.boundaries?.south || 'As per Documents'

    const existingBank = lifecycle.active.length > 0
      ? lifecycle.active[0].lender
      : lifecycle.released.length > 0 ? lifecycle.released[0].lender : 'N/A'

    // 2D: Risk findings
    const riskFindings: RiskFinding[] = []

    if (lifecycle.active.length > 0) {
      riskFindings.push({
        code: 'ACTIVE_MORTGAGE',
        severity: 'critical',
        description: `Active charge / mortgage in favour of ${ lifecycle.active.map(a => a.lender).join(', ') } vide Deed No.${ lifecycle.active.map(a => a.deed_no).join(', ') } dated ${ lifecycle.active.map(a => a.date).join(', ') } without corresponding release deed.`,
        evidence: 'Encumbrance Certificate - EC table'
      })
    }

    if (ecMeta.ec_from && ecMeta.ec_to) {
      const fromYear = parseInt(ecMeta.ec_from.slice(-4)) || 0
      const currentYear = new Date().getFullYear()
      if (fromYear > 0 && currentYear - fromYear < 13) {
        riskFindings.push({
          code: 'SHORT_EC_PERIOD',
          severity: 'medium',
          description: `EC period(${ ecMeta.ec_from } to ${ ecMeta.ec_to }) covers less than 13 years.Minimum 30 - year search recommended.`,
          evidence: 'EC date range'
        })
      }
    }

    if (!extractedFacts.na_order?.order_no && (caseType === 'builder_purchase' || caseType === 'resale')) {
      riskFindings.push({
        code: 'NA_ORDER_NOT_PROVIDED',
        severity: 'medium',
        description: 'NA Order (Non-Agricultural Conversion Order) not provided for scrutiny.',
        evidence: 'Document checklist'
      })
    }

    if (!extractedFacts.oc_bcc?.certificate_no) {
      riskFindings.push({
        code: 'OC_NOT_PROVIDED',
        severity: 'low',
        description: 'Occupancy Certificate / Completion Certificate not provided.',
        evidence: 'Document checklist'
      })
    }

    const riskResult = computeRiskScore(riskFindings)

    // Build pre-computed HTML tables
    const ecTableHtml = ecRows.length > 0
      ? buildECTable(ecRows, lifecycle)
      : '<p style="color:#666;font-style:italic;">No EC entries extracted.</p>'

    const mutationTableHtml = buildMutationTable(extractedFacts.mutation_entries)
    const legalOpinion = getLegalOpinion(caseType, finalOwner, finalApplicant, existingBank)

    // ============================================================
    // GROUND TRUTH fed to all report-generation AI calls
    // Every fact here is verified by code -- AI cannot contradict
    // ============================================================
    const groundTruth = `
VERIFIED FACTS - USE EXACTLY AS PROVIDED - DO NOT INVENT OR HALLUCINATE:

              CASE INFORMATION:
              - Case Type: ${ caseType }(${ loanTypeMap[caseType] || 'LAP' })
            - App ID: ${ appId || refNo}
- Ref No: ${ refNo }
          - Date of Report: ${ today }
          - Bank: ${ finalBank }
          - Applicant Name: ${ finalApplicant }
          - Co - Applicant: ${ finalCoApp }
          - Current Owner / Mortgagor: ${ finalOwner }

PROPERTY DETAILS:
          - Address / Description: ${ finalAddress }
          - Survey No / Plot No: ${ firstDeed.survey_no || firstDeed.plot_no || lastDeed.survey_no || lastDeed.plot_no || 'As per documents' }
          - Flat / Unit No: ${ lastDeed.flat_no || firstDeed.flat_no || '' }
          - Floor / Wing: ${ lastDeed.floor_no || '' } ${ lastDeed.wing || '' }
          - Building / Society: ${ lastDeed.building_name || lastDeed.society_name || firstDeed.building_name || firstDeed.society_name || '' }
          - Area: ${ lastDeed.area || firstDeed.area || 'As per documents' }
          - Taluka: ${ firstDeed.taluka || lastDeed.taluka || '' }
          - District: ${ firstDeed.district || lastDeed.district || '' }
          - East Boundary: ${ finalEast }
          - West Boundary: ${ finalWest }
          - North Boundary: ${ finalNorth }
          - South Boundary: ${ finalSouth }

SALE DEEDS EXTRACTED(${(extractedFacts.sale_deeds || []).length} deeds):
${
          (extractedFacts.sale_deeds || []).map((sd: any, i: number) =>
            `  Deed ${i + 1}: Seller(s): ${(sd.seller_names || []).join(', ')} | Buyer(s): ${(sd.buyer_names || []).join(', ')} | Reg.No: ${sd.registration_no || 'N/A'} | Date: ${sd.registration_date || sd.execution_date || 'N/A'} | Sub-Registrar: ${sd.sub_registrar_office || 'N/A'} | Consideration: ${sd.consideration_amount || 'N/A'}`
          ).join('\n') || '  Not extracted from documents'
        }

TITLE CHAIN NARRATIVE(use this exactly in Part IV):
${ chainNarrative }

EC ENCUMBRANCE DATA:
        - EC App No: ${ ecMeta.ec_app_number || 'N/A' }
        - EC Date: ${ ecMeta.ec_date || 'N/A' }
        - EC Period: ${ ecMeta.ec_from || 'N/A' } to ${ ecMeta.ec_to || 'N/A' }
        - Total EC Entries: ${ ecMeta.row_count }
        - Encumbrance Status: ${ lifecycle.encumbrance }
        - Mortgage Summary: ${ lifecycle.summary }
        - Active Mortgages: ${ lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => `${a.lender} Deed:${a.deed_no} Date:${a.date}`).join(' | ') }
        - Released Mortgages: ${ lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => `${r.lender} released vide ${r.release_deed_no} dated ${r.release_date}`).join(' | ') }

REVENUE RECORD(7 / 12):
        - Survey No: ${ extractedFacts.revenue_record?.survey_no || 'NOT PROVIDED' }
        - Khata No: ${ extractedFacts.revenue_record?.khata_no || 'NOT PROVIDED' }
        - Owner in Revenue Record: ${ extractedFacts.revenue_record?.owner_name || 'NOT PROVIDED' }
        - Area: ${ extractedFacts.revenue_record?.area || 'NOT PROVIDED' }
        - Land Type: ${ extractedFacts.revenue_record?.land_type || 'NOT PROVIDED' }
        - Taluka / District: ${ extractedFacts.revenue_record?.taluka || '' } / ${extractedFacts.revenue_record?.district || ''}

MUTATION ENTRIES: ${ (extractedFacts.mutation_entries || []).length } entries found

REGULATORY APPROVALS:
        - NA Order: ${ extractedFacts.na_order?.order_no ? `No. ${extractedFacts.na_order.order_no} dated ${extractedFacts.na_order.date} by ${extractedFacts.na_order.authority}` : 'NOT PROVIDED' }
        - Development Permission: ${ extractedFacts.dev_permission?.permission_no ? `No. ${extractedFacts.dev_permission.permission_no} dated ${extractedFacts.dev_permission.date} by ${extractedFacts.dev_permission.authority}` : 'NOT PROVIDED' }
        - OC / BCC / Completion Certificate: ${ extractedFacts.oc_bcc?.certificate_no ? `No. ${extractedFacts.oc_bcc.certificate_no} dated ${extractedFacts.oc_bcc.date} by ${extractedFacts.oc_bcc.authority}` : 'NOT PROVIDED' }
        - RERA: ${ extractedFacts.rera?.registration_no ? `No. ${extractedFacts.rera.registration_no} Promoter: ${extractedFacts.rera.promoter_name}` : 'NOT PROVIDED' }

DOCUMENTS FOUND IN UPLOAD: ${ (extractedFacts.documents_found || []).join(', ') || 'As per uploaded files' }

RISK ASSESSMENT(DETERMINISTIC - CODE COMPUTED):
        - Risk Score: ${ riskResult.score } / 100
          - Risk Rating: ${ riskResult.rating }
        - Risk Findings: ${ riskFindings.length === 0 ? 'NONE' : riskFindings.map(r => `[${r.severity.toUpperCase()}] ${r.code}: ${r.description}`).join(' || ') }

LEGAL OPINION TEXT(use exactly in Part VIII):
${ legalOpinion }

ABSOLUTE RULES - NEVER VIOLATE:
        1. Never mention any company name other than TITLEMATRIXAI
        2. Never read or mention EC column 7 or EC applicant name
        3. Never mention loan amount or stamp paper number
        4. Never invent facts not listed above
        5. If approval says NOT PROVIDED - write "NOT PROVIDED" in report
        6. Released mortgage = CLEAR - do NOT flag as active encumbrance
        7. Active mortgage = flag as CRITICAL / HIGH severity in Part VI
        8. Use all boundary values EXACTLY as given above
        9. Applicant name in report = EXACTLY "${finalApplicant}"
        10. Bank name in report = EXACTLY "${finalBank}"
`

    // ============================================================
    // STAGE 3: PARALLEL REPORT GENERATION (4 calls)
    // AI writes legal text; all facts come from groundTruth above
    // ============================================================
    const [r4a, r4b, r4c, r4d] = await Promise.all([

      // CALL A: Part I, II, III
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 3500,
        temperature: 0,
        system: `You are a legal report writer for Indian property due diligence.Generate HTML using ONLY verified facts.STRICT RULES: (1) Part I Borrower table must contain EXACTLY these 3 rows only - Name of Borrower, Co - Applicant, Constitution.NO extra rows like Bank or App ID or Date in borrower table. (2) Co - Applicant value is "${finalCoApp}" - copy it EXACTLY, never replace with applicant name. (3) No markdown.Pure HTML only.`,
        messages: [{
          role: 'user',
          content: `${ groundTruth }

Generate PART I, PART II, PART III as HTML.

PART I - output this EXACT HTML(fill only[bracketed] parts, do NOT add extra rows):
        <hr><div class="ph" > PART I - BORROWER / MORTGAGOR / CURRENT OWNERSHIP </div>
          < div class="sph" > A.Borrower Details </div>
            < table class="mt" >
              <tr><td>Name of Borrower / Applicant < /td><td>:</td > <td>${ finalApplicant } </td></tr >
                <tr><td>Co - Applicant < /td><td>:</td > <td>${ finalCoApp } </td></tr >
                  <tr><td>Constitution < /td><td>:</td > <td>Individual < /td></tr >
                  </table>
                  < div class="sph" > B.Mortgagor / Current Owner Details </div>
                    < table class="mt" >
                      <tr><td>Name of Mortgagor < /td><td>:</td > <td>${ finalOwner } </td></tr >
                        <tr><td>Relation to Borrower < /td><td>:</td > <td>[Owner / Self / Builder as applicable from VERIFIED FACTS] < /td></tr >
                          <tr><td>Type of Transaction < /td><td>:</td > <td>${ loanTypeMap[caseType] || 'LAP' } </td></tr >
                            </table>
                            < div class="sph" > C.Current Ownership </div>
                              < table class="mt" >
                                <tr><td>Current Owner < /td><td>:</td > <td>${ finalOwner } </td></tr >
                                  <tr><td>Mode of Acquisition < /td><td>:</td > <td>[Sale Deed / Gift Deed / from VERIFIED FACTS sale deeds] < /td></tr >
                                    <tr><td>Registration Details < /td><td>:</td > <td>[Reg No and Date from latest sale deed in VERIFIED FACTS] < /td></tr >
                                      <tr><td>Sub - Registrar Office < /td><td>:</td > <td>[from VERIFIED FACTS sale deeds] < /td></tr >
                                        <tr><td>Proposed Purchaser / Mortgagor < /td><td>:</td > <td>${ finalApplicant } </td></tr >
                                          </table>

PART II structure:
        <hr><div class="ph" > PART II - PROPERTY DESCRIPTION </div>
          < div class="prop-para" >
            [Write a complete paragraph describing the property using ALL details from VERIFIED FACTS property section: flat no, floor, wing, building name, society name, survey no / plot no, area, taluka, district, full address.Be specific and complete.]
            </div>
            < table class="mt" >
              <tr><td>East < /td><td>:</td > <td>${ finalEast } </td></tr >
                <tr><td>West < /td><td>:</td > <td>${ finalWest } </td></tr >
                  <tr><td>North < /td><td>:</td > <td>${ finalNorth } </td></tr >
                    <tr><td>South < /td><td>:</td > <td>${ finalSouth } </td></tr >
                      <tr><td>Total Area < /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                        <tr><td>Survey / Plot No.< /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                          </table>

PART III structure:
        <hr><div class="ph" > PART III - LIST OF SCRUTINIZED DOCUMENTS </div>
        [Number each document.Include from VERIFIED FACTS: all sale deeds with dates and reg nos, EC with App No ${ ecMeta.ec_app_number } dated ${ ecMeta.ec_date } period ${ ecMeta.ec_from } to ${ ecMeta.ec_to } with ${ ecMeta.row_count } transactions, revenue records, approvals.NO illegibility remarks here.]

Start your output with: <hr><div class="ph" > PART I`
        }]
      }),

      // CALL B: Part IV, V
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        temperature: 0,
        system: 'You are a legal report writer for Indian property due diligence. Generate HTML report sections using ONLY verified facts. No markdown. Pure HTML.',
        messages: [{
          role: 'user',
          content: `${ groundTruth }

EC TABLE(pre - built HTML - insert exactly where indicated):
${ ecTableHtml }

MUTATION TABLE(pre - built HTML - insert exactly where indicated):
${ mutationTableHtml }

Generate PART IV and PART V as HTML.

PART IV structure:
        <hr><div class="ph" > PART IV - CHRONOLOGICAL TITLE CHAIN OF OWNERSHIP </div>
        [Write title chain paragraphs using TITLE CHAIN NARRATIVE from VERIFIED FACTS]
          RULES:
- Oldest deed first
          - First paragraph: NO "Thereafter"
            - Every subsequent paragraph MUST start with "Thereafter,"
            - For each deed: mention parties, deed type, Reg.No., date, Sub - Registrar
              - For released mortgage: "...Thereafter, the aforesaid charge in favour of [bank] stands fully discharged and released vide Release Deed No. [no.] dated [date], duly registered..."
                - For active mortgage: "...Thereafter, [owner] created mortgage / charge in favour of [bank] vide Mortgage Deed No. [no.] dated [date], which subsists and remains active as on date of this report..."
                  - Final paragraph: mention EC App No.${ ecMeta.ec_app_number } dated ${ ecMeta.ec_date } covering period ${ ecMeta.ec_from } to ${ ecMeta.ec_to }. State encumbrance status: ${ lifecycle.encumbrance }. ${ lifecycle.summary }

PART V structure:
        <hr><div class="ph" > PART V - APPROVALS AND REGULATORY COMPLIANCE </div>

          < div class="sph" > Revenue Records </div>
            < table class="mt" >
              <tr><td>Survey No.< /td><td>:</td > <td>[from VERIFIED FACTS revenue record] < /td></tr >
                <tr><td>Khata No.< /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                  <tr><td>Name of Owner in Revenue Record < /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                    <tr><td>Area as per Revenue Record < /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                      <tr><td>Land Classification < /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                        </table>

                        < div class="sph" > Mutation Entries </div>
                        [INSERT MUTATION TABLE HERE - use pre - built HTML]

        <div class="sph" > Regulatory Approvals </div>
          < table class="mt" >
            <tr><td>NA Order < /td><td>:</td > <td>[from VERIFIED FACTS approvals] < /td></tr >
              <tr><td>Development Permission / Layout Approval < /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                <tr><td>Building Plan / Sanctioned Plan < /td><td>:</td > <td>[from VERIFIED FACTS or NOT PROVIDED] < /td></tr >
                  <tr><td>RERA Registration < /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                    <tr><td>OC / BCC / Completion Certificate < /td><td>:</td > <td>[from VERIFIED FACTS] < /td></tr >
                      </table>

                      < div class="sph" > Encumbrance Certificate Analysis </div>
                        < p > Encumbrance Certificate bearing E - App No. < strong > ${ ecMeta.ec_app_number } </strong> dated ${ecMeta.ec_date} for period ${ecMeta.ec_from} to ${ecMeta.ec_to} issued by Sub-Registrar office. Total <strong>${ecMeta.row_count}</strong > transaction / s registered during the period: </p>
                        [INSERT EC TABLE HERE - use pre - built HTML]
        <p><strong>Encumbrance Status: ${ lifecycle.encumbrance }.</strong> ${lifecycle.summary}</p >

          Start your output with: <hr><div class="ph" > PART IV`
        }]
      }),

      // CALL C: Part VI, VII, VIII
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 5000,
        temperature: 0,
        system: 'You are a legal report writer for Indian property due diligence. Generate HTML report sections using ONLY verified facts. No markdown. Pure HTML.',
        messages: [{
          role: 'user',
          content: `${ groundTruth }

Generate PART VI, PART VII, PART VIII as HTML.

PART VI structure:
        <hr><div class="ph" > PART VI - ALERTS AND RISK OBSERVATIONS </div>
        RULES:
        - Maximum 5 - 6 alerts
          - Base alerts ONLY on RISK FINDINGS in VERIFIED FACTS
            - NEVER flag released mortgage as active (if encumbrance = CLEAR_WITH_PRIOR_RELEASE)
          - NEVER flag cleared EC entries as risks
            - For each finding use: <div class="ib" > <span class="sh" > CRITICAL < /span> or <span class="sh">HIGH</span > or < span class="sm" > MEDIUM < /span> or <span class="sl">LOW</span > <div class="it" > [Alert Title] < /div><p>[Detailed description citing evidence]</p > </div>
              - If no major risks: add one LOW alert saying "No major encumbrances or title defects found. Property appears marketable subject to standard conditions."

PART VII structure:
        <hr><div class="ph" > PART VII - DOCUMENT DEFICIENCY REPORT </div>
          < div class="sph" > A.Documents Available and Scrutinized < /div><ol>[From DOCUMENTS FOUND in VERIFIED FACTS plus what was submitted]</ol >
            <div class="sph" > B.Critical Documents Missing / Required < /div><ol>[Based on case type "${caseType}" - list what is typically required but NOT PROVIDED per VERIFIED FACTS approvals section. If all provided: write "NIL"]</ol >
              <div class="sph" > C.Documents Requiring Verification < /div><ol>[Any documents needing additional verification - or NIL]</ol >
                <div class="sph" > D.Illegible or Incomplete Documents < /div><ol>[If any - or NIL]</ol >
                  <div class="sph" > E.Overall Risk Assessment </div>
                    < table class="mt" >
                      <tr><td>Risk Score < /td><td>:</td > <td>${ riskResult.score } / 100</td > </tr>
                        < tr > <td>Risk Rating < /td><td>:</td > <td>${ riskResult.rating } </td></tr >
                          <tr><td>Encumbrance Status < /td><td>:</td > <td>${ lifecycle.encumbrance } </td></tr >
                            <tr><td>Mortgageability < /td><td>:</td > <td>[Mortgageable / Conditionally Mortgageable / Not Mortgageable] < /td></tr >
                            <tr><td>SARFAESI Enforceability < /td><td>:</td > <td>[Enforceable / Conditionally Enforceable] < /td></tr >
                              <tr><td>Lending Suitability < /td><td>:</td > <td>[Suitable / Conditionally Suitable / Not Suitable] < /td></tr >
                                </table>

PART VIII structure:
        <hr><div class="ph" > PART VIII - LEGAL OPINION AND VERDICT </div>
          < p style = "text-align:justify;" > ${ legalOpinion } </p>
          [Then add verdict box:]
${
          riskResult.rating === 'GREEN'
          ? '<div class="vc"><div class="vt">Verdict: Clear and Marketable Title</div><p>[2-3 lines: property has clear title, no encumbrances, safe for lending]</p></div>'
          : riskResult.rating === 'AMBER'
            ? '<div class="vs"><div class="vt">Verdict: Clear Title Subject to Conditions</div><p>[Conditions based on risk findings above]</p></div>'
            : '<div class="vnc"><div class="vt">Verdict: Title Not Clear</div><p>[Reasons from ACTIVE MORTGAGE or other critical risks in VERIFIED FACTS]</p></div>'
        }

Start your output with: <hr><div class="ph" > PART VI`
        }]
      }),

      // CALL D: Part IX, X, XI
      client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        temperature: 0,
        system: 'You are a legal report writer for Indian property due diligence. Generate HTML report sections. No markdown. Pure HTML.',
        messages: [{
          role: 'user',
          content: `${ groundTruth }

Generate PART IX, PART X, PART XI as HTML.

PART IX structure:
        <hr><div class="ph" > PART IX - PRE - DISBURSEMENT DOCUMENTS REQUIRED </div>
          <ol>
        [List documents required BEFORE loan disbursement.Customize for case type "${caseType}":
        - builder_purchase: Registered Sale Deed, Allotment Letter, Builder NOC, OC / BCC, Society Formation NOC, Property Tax Receipt
          - resale: Registered Sale Deed, Original Title Documents, Society NOC, OC, Tax Receipts
            - bt: Release Deed from existing lender ${ existingBank }, NOC from existing lender, Registered Sale Deed
              - seller_bt: Release Deed from ${ existingBank }, Tripartite Agreement, Registered Sale Deed
                - lap: Original Title Documents, Property Tax Receipts, Society NOC if applicable]
        </ol>

PART X structure:
        <hr><div class="ph" > PART X - POST - DISBURSEMENT DOCUMENTS REQUIRED </div>
          <ol>
        [List documents required AFTER disbursement:
        - Registered Mortgage Deed(original)
          - Note of Intimation of Mortgage to CRS / SRO
            - Insurance Policy(property + borrower life)
              - Share Certificate / Allotment Copy if applicable
                - Society Transfer Receipt
                  - Original Property Tax Receipts
                    - CERSAI registration confirmation]
        </ol>

PART XI structure:
        <hr><div class="ph" > PART XI - FINAL RECOMMENDATION </div>
          < div class="final-rec" >
            <div class="fr-title" > Final Title Status </div>
              < div class="fr-value" > ${ riskResult.rating === 'GREEN' ? 'CLEAR AND MARKETABLE TITLE' : riskResult.rating === 'AMBER' ? 'CLEAR TITLE SUBJECT TO CONDITIONS' : 'TITLE NOT CLEAR - REQUIRES RESOLUTION' } </div>
                </div>
                < p > [3 - 4 sentence summary.Must include: property identified as ${ finalAddress } belonging to ${ finalOwner }.Encumbrance status: ${ lifecycle.summary }.Risk rating ${ riskResult.rating }(score ${ riskResult.score } / 100).Recommendation for ${ finalBank } lending.]</p>
${ riskResult.rating !== 'GREEN' ? '<div class="sph">Conditions / Actions Required</div><ol>[list from risk findings]</ol>' : '' }

Start your output with: <hr><div class="ph" > PART IX`
        }]
      })
    ])

    // ============================================================
    // ASSEMBLE FINAL REPORT
    // ============================================================
    const parts = [r4a, r4b, r4c, r4d]
      .map(r => r.content[0].type === 'text' ? r.content[0].text : '')
      .join('\n')

    const html = buildReport({
      refNo,
      appId: appId || 'AUTO',
      today,
      bankName: finalBank,
      loanType: loanTypeMap[caseType] || 'LAP',
      riskRating: riskResult.rating,
      riskScore: riskResult.score,
      parts
    })

    const verdict = riskResult.rating === 'RED'
      ? 'NOT CLEAR'
      : riskResult.rating === 'GREEN' ? 'CLEAR' : 'CLEAR SUBJECT TO CONDITIONS'

    // Save to Supabase
    if (userId && supabase) {
      try {
        await supabase.from('reports').insert({
          user_id: userId,
          case_type: caseType || 'lap',
          applicant_name: finalApplicant,
          bank_name: finalBank,
          property_address: finalAddress,
          app_id: appId || refNo,
          verdict,
          report_html: html
        })
      } catch (e) {
        console.error('Supabase save error:', e)
      }
    }

    return NextResponse.json({
      success: true,
      report: html,
      verdict,
      lifecycle,
      riskScore: riskResult,
      ecData: { rows: ecRows, ...ecMeta },
      extractedFacts
    })

  } catch (e: any) {
    console.error('TITLEMATRIXAI v3 error:', e)
    return NextResponse.json(
      { success: false, error: e.message || 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}