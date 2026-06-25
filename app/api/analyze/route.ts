export const maxDuration = 300
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
const client = new Anthropic()
const db = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null

const BANKS = ['BANK', 'FINANCE', 'HOUSING FINANCE', 'FINANCIAL', 'NBFC', 'CAPITAL', 'FINCORP',
  'BAJAJ', 'HDFC', 'SBI', 'AXIS', 'ICICI', 'KOTAK', 'PNB', 'BOI', 'CANARA', 'UNION',
  'INDIABULLS', 'LIC', 'LICHFL', 'REPCO', 'PIRAMAL', 'MUTHOOT', 'TATA CAPITAL',
  'ADITYA BIRLA', 'FULLERTON', 'AAVAS', 'HOME FIRST', 'APTUS', 'SHRIRAM', 'INDIA BULLS']
function isBank(n: string): boolean {
  if (!n) return false
  const u = n.toUpperCase()
  return BANKS.some(b => u.includes(b))
}
interface ECRow { row_number: number; col1_type: string; col2_property: string; col3_aapnar: string; col4_lenar: string; col5_date: string; col6_deed_no: string }
interface Charge { lender: string; borrower: string; deed_no: string; date: string; row: number; status: 'ACTIVE' | 'RELEASED'; release_deed_no?: string; release_date?: string }
function mortgageLifecycle(rows: ECRow[]) {
  const charges: Charge[] = []
  for (const r of rows) {
    if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar))
      charges.push({ lender: r.col4_lenar, borrower: r.col3_aapnar, deed_no: r.col6_deed_no, date: r.col5_date, row: r.row_number, status: 'ACTIVE' })
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
    ? released.length > 0 ? `CLEAR. Prior mortgage by ${released.map(r => r.lender).join(', ')} RELEASED vide Deed No. ${released.map(r => r.release_deed_no).join(', ')}.` : 'CLEAR. No mortgage found.'
    : `ENCUMBERED. Active: ${active.map(a => `${a.lender} Deed:${a.deed_no} Date:${a.date}`).join('; ')}`
  return { active, released, summary, encumbrance }
}
function buildECTable(rows: ECRow[], lc: any): string {
  if (!rows.length) return '<p>No EC entries found.</p>'
  let h = `<table class="ec-tbl"><tr><th>Sr.</th><th>Type</th><th>Deed No.</th><th>Date</th><th>Col 3 Aapnar</th><th>Col 4 Lenar</th><th>Status</th></tr>`
  for (const r of rows) {
    const isRelRow = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
    const isMortRow = isBank(r.col4_lenar) && !isBank(r.col3_aapnar)
    const isActMort = lc.active.some((c: Charge) => c.row === r.row_number)
    let cls = '', txt = '', type = r.col1_type || 'Unknown'
    if (isRelRow) { cls = 'ec-rel'; txt = 'RELEASED/DISCHARGED'; type = 'Reconveyance / Mortgage Release Deed' }
    else if (isMortRow && isActMort) { cls = 'ec-act'; txt = 'ACTIVE MORTGAGE'; type = 'Mortgage Deed' }
    else if (isMortRow && !isActMort) { cls = 'ec-rel'; txt = 'MORTGAGE - RELEASED'; type = 'Mortgage Deed' }
    else { cls = ''; txt = 'Transaction' }
    h += `<tr><td>${r.row_number}</td><td>${type}</td><td>${r.col6_deed_no || '--'}</td><td>${r.col5_date || '--'}</td><td>${r.col3_aapnar || '--'}</td><td>${r.col4_lenar || '--'}</td><td class="${cls}">${txt}</td></tr>`
  }
  return h + '</table>'
}
function getVerdict(t: string): string {
  const u = t.toUpperCase()
  if (u.includes('NOT CLEAR') || u.includes('TITLE BREAK')) return 'NOT CLEAR'
  if (u.includes('CLEAR TITLE SUBJECT TO') || u.includes('CLEAR SUBJECT TO')) return 'CLEAR SUBJECT TO'
  if (u.includes('CLEAR AND MARKETABLE') || u.includes('MORTGAGEABLE')) return 'CLEAR'
  return 'PENDING'
}
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;background:#fff;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}.firm{font-size:22px;font-weight:bold;letter-spacing:1px;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic;line-height:2}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa;border-radius:2px}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px;border-radius:2px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:5px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}.ec-unk{color:#b45309;font-style:italic}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px;vertical-align:top}table.mut tr:nth-child(even){background:#f9fafb}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5;border-radius:2px}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4;border-radius:2px}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb;border-radius:2px}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB;border-radius:2px}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify;line-height:1.6}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}.ib{page-break-inside:avoid}}`
const L1 = `You are Document Extraction Engine (Layer 1). Implements Prompt 2 + Prompt 4 + Steps 1-7 + Mortgage Lifecycle Engine.
NON-NEGOTIABLE: Never assume. Never create. Never suppress. Unavailable = "NOT PROVIDED FOR VERIFICATION."
PROMPT 2 -- EXTRACT FROM EVERY DOCUMENT:
Document Type | Registration Number | Registration Date | Executant (every person, NEVER "and others") | Claimant (every person) | Property Description | Survey No | Village | Taluka | District | Area | Boundaries
PROPERTY PARA FORMAT: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."
PROMPT 4 -- EC COLUMN MAPPING:
COL 1: Type of Deed | COL 2: Property | COL 3: Executing Party (Aapnar) | COL 4: Claimant (Lenar) | COL 5: Date | COL 6: Deed No | COL 7 (LAST): NEVER READ NEVER MENTION
EC Receipt: extract EC_APP_NUMBER, EC_DATE, EC_FROM, EC_TO
EC Applicant name = IGNORE. Count actual rows, ignore header count.
MORTGAGE LIFECYCLE ENGINE:
MORTGAGE = Col4 is Bank, Col3 is Owner -> create CHARGE RECORD (STATUS: ACTIVE)
RELEASE = Col3 is Bank (ROLE FLIP), Col4 is Owner -> find matching CHARGE -> STATUS: RELEASED
Release keywords: Giro Mukeli/Mukti/Release/Reconveyance/Discharge/Satisfaction
Output MORTGAGE_LIFECYCLE_SUMMARY: A.ACTIVE_MORTGAGES B.RELEASED_MORTGAGES C.UNMATCHED_RELEASES D.ENCUMBRANCE_STATUS
STEPS 1-7 EC CLASSIFICATION:
1.Capture RAW_COL1_TEXT 2.Normalize 3.Match taxonomy 4.Disambiguate (Bank Col3=Release, Bank Col4=Mortgage) 5.NO-GUESS RULE if uncertain 6.Confidence tag 7.Output EC_ROW_[N] with all fields
TAXONOMY: Sale Deed|Absolute Sale Deed|Conveyance Deed|Gift Deed|Release Deed|Relinquishment Deed|Partition Deed|Family Settlement Deed|Exchange Deed|Mortgage Deed|Simple Mortgage Deed|Equitable Mortgage|Mortgage Release Deed|Reconveyance Deed|Lease Deed|Leave and License Agreement|Rent Agreement|Development Agreement|Joint Development Agreement|Agreement to Sell|Agreement to Sell Without Possession|Banakhat|Power of Attorney|General Power of Attorney|Special Power of Attorney|POA under Section 45-A|Revocation of POA|Will|Probate|Succession Certificate|Legal Heir Certificate|Affidavit|Declaration Deed|Indemnity Bond|Rectification Deed|Confirmation Deed|Cancellation Deed|Settlement Deed|Trust Deed|Partnership Deed|Deed of Admission|Deed of Retirement|Deed of Dissolution|Lis Pendens
RULES: NEVER "and others" | EC Col 7 NEVER | EC Applicant IGNORE | Loan Amount NEVER | Stamp Paper NEVER`

const L23_BASE = `You are Layer 2 (Title Verification) and Layer 3 (Risk). Never assume. Never create. Never suppress. Unavailable = "NOT PROVIDED FOR VERIFICATION."
TITLE CHAIN: Every transfer needs documentary support. No support = TITLE BREAK CRITICAL.
RISK: HIGH|MODERATE|LOW | MORTGAGEABILITY: Mortgageable|Conditionally|Not | SARFAESI: Enforceable|Conditionally|Not | LENDING: Suitable|Conditionally|Not
EC VERIFICATION: RELEASED = do not flag. ACTIVE = flag HIGH SEVERITY. NEVER override RELEASED to ACTIVE. EC Col7 NEVER. EC Applicant IGNORE. Loan Amount NEVER.`

function getL23(ct: string): string {
  const op: Record<string, string> = {
    builder_purchase: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF BUILDER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
    resale: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [NAME OF PROPOSED PURCHASER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`,
    bt: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/BORROWER/MORTGAGOR] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,
    seller_bt: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid subject to charge of [NAME OF EXISTING BANK] and after the execution and registration of deed of release of mortgage unto and in favour of [NAME OF CURRENT OWNER/S] and after the execution and registration of sale deed unto and in favour of [NAME OF PROPOSED PURCHASER/S] and He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank subject to charge of [NAME OF EXISTING BANK]."`,
    lap: `"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [NAME OF CURRENT OWNER/S] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and He/She/They have/has legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt. The said immovable property will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."`
  }
  const meta: Record<string, string> = {
    builder_purchase: `---META---\nAPPLICANT: [Draft Sale Deed/Banakhat -- Buyer -- NEVER stamp paper]\nCO_APPLICANT: [Names or N/A]\nMORTGAGOR: [Same as Applicant]\nPROPERTY_PARA: [Full paragraph format]\nPROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]\nCURRENT_OWNER: [Builder/Developer]\nEC_APP_NUMBER: [from EC Receipt]\nEC_DATE: [Date of Print]\nEC_FROM: [start] | EC_TO: [end]\nEC_ROW_COUNT: [actual rows]\nMORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X / ACTIVE -- Bank:X Deed:Y]\nRISK_LEVEL: [HIGH/MODERATE/LOW]\nMORTGAGEABILITY: [Mortgageable/Conditionally/Not]\nSARFAESI: [Enforceable/Conditionally/Not]\nLENDING_SUITABILITY: [Suitable/Conditionally/Not]\nEXISTING_BANK: [N/A]\n---END META---`,
    resale: `---META---\nAPPLICANT: [Second Party -- Draft Deed/Banakhat -- NEVER stamp paper]\nCO_APPLICANT: [Names or N/A]\nMORTGAGOR: [Same as Applicant]\nPROPERTY_PARA: [Full paragraph]\nPROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]\nCURRENT_OWNER: [First Party -- ALL names]\nEC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]\nEC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]\nMORTGAGE_SUMMARY: [NONE / RELEASED vide Deed No.X / ACTIVE -- Bank:X Deed:Y]\nRISK_LEVEL: [HIGH/MODERATE/LOW]\nMORTGAGEABILITY: [Mortgageable/Conditionally/Not]\nSARFAESI: [Enforceable/Conditionally/Not]\nLENDING_SUITABILITY: [Suitable/Conditionally/Not]\nEXISTING_BANK: [N/A or bank if active]\n---END META---`,
    bt: `---META---\nAPPLICANT: [Current owner/borrower]\nCO_APPLICANT: [Names or N/A]\nMORTGAGOR: [Same as Applicant]\nPROPERTY_PARA: [Full paragraph]\nPROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]\nCURRENT_OWNER: [Same as Applicant]\nEC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]\nEC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]\nMORTGAGE_SUMMARY: [ACTIVE -- Bank:[X] Deed No:[Y] Date:[Z]]\nRISK_LEVEL: [HIGH/MODERATE/LOW]\nMORTGAGEABILITY: [Conditionally Mortgageable]\nSARFAESI: [Conditionally Enforceable]\nLENDING_SUITABILITY: [Conditionally Suitable]\nEXISTING_BANK: [Bank name from EC]\n---END META---`,
    seller_bt: `---META---\nAPPLICANT: [Proposed purchaser -- Buyer side]\nCO_APPLICANT: [Names or N/A]\nMORTGAGOR: [Same as Applicant]\nPROPERTY_PARA: [Full paragraph]\nPROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]\nCURRENT_OWNER: [Seller -- ALL names individually]\nEC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]\nEC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]\nMORTGAGE_SUMMARY: [ACTIVE -- Bank:[X] Deed No:[Y] Date:[Z]]\nRISK_LEVEL: [HIGH/MODERATE/LOW]\nMORTGAGEABILITY: [Conditionally Mortgageable]\nSARFAESI: [Conditionally Enforceable]\nLENDING_SUITABILITY: [Conditionally Suitable]\nEXISTING_BANK: [Bank name from EC]\n---END META---`,
    lap: `---META---\nAPPLICANT: [Current owner/borrower]\nCO_APPLICANT: [Names or N/A]\nMORTGAGOR: [Same as Applicant]\nPROPERTY_PARA: [Full paragraph]\nPROPERTY_BOUNDARIES: East:[X] | West:[X] | North:[X] | South:[X]\nCURRENT_OWNER: [Same as Applicant]\nEC_APP_NUMBER: [from receipt] | EC_DATE: [Date of Print]\nEC_FROM: [start] | EC_TO: [end] | EC_ROW_COUNT: [actual rows]\nMORTGAGE_SUMMARY: [NONE / UNDISCLOSED ACTIVE if found]\nRISK_LEVEL: [HIGH/MODERATE/LOW]\nMORTGAGEABILITY: [Mortgageable/Not]\nSARFAESI: [Enforceable/Not]\nLENDING_SUITABILITY: [Suitable/Not]\nEXISTING_BANK: [N/A]\n---END META---`
  }
  const k = ct in meta ? ct : 'lap'
  return L23_BASE + `\n=== CASE: ${k.toUpperCase().replace(/_/g, ' ')} ===\n` + meta[k] + `\n\nLEGAL OPINION (fill actual names):\n` + (op[k] || op['lap'])
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
    lendingSuitability: g('LENDING_SUITABILITY'), existingBank: g('EXISTING_BANK')
  }
}
const L4A = `Layer 4 -- PART I, PART II, PART III. PURE HTML ONLY.
PART I: <hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div>
<div class="sph">A. Borrower Details</div><table class="mt"><tr><td>Name of Borrower/s</td><td>:</td><td>[Every person -- NEVER "and others"]</td></tr><tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[Names or "Not Applicable"]</td></tr><tr><td>Address</td><td>:</td><td>[As per documents]</td></tr><tr><td>Constitution</td><td>:</td><td>[Individual / Partnership / Private Ltd / HUF / Trust]</td></tr></table>
<div class="sph">B. Mortgagor Details</div><table class="mt"><tr><td>Name of Mortgagor/s</td><td>:</td><td>[Same as Borrower/s above OR full names]</td></tr><tr><td>Address</td><td>:</td><td>[As per documents]</td></tr><tr><td>Constitution</td><td>:</td><td>[Individual]</td></tr></table>
<div class="sph">C. Current Ownership</div><table class="mt"><tr><td>Current Owner/s</td><td>:</td><td>[Full name/s from latest deed]</td></tr><tr><td>Mode of Acquisition</td><td>:</td><td>[Registered Sale Deed / Allotment / Gift / etc.]</td></tr><tr><td>Registration Details</td><td>:</td><td>[Deed No., Date, SRO]</td></tr></table>
PART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div>
<div class="prop-para">[Full paragraph: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as '[Name]' constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."]</div>
<table class="mt"><tr><td>East (Purva)</td><td>:</td><td>[boundary]</td></tr><tr><td>West (Pashchim)</td><td>:</td><td>[boundary]</td></tr><tr><td>North (Uttar)</td><td>:</td><td>[boundary]</td></tr><tr><td>South (Dakshin)</td><td>:</td><td>[boundary]</td></tr></table>
PART III: RULE -- ALL submitted documents. NO "ILLEGIBLE"/"BLANK"/"NOT PROVIDED" here -- Part VI only. Latest first.
<hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div>
Each doc: <div class="di"><p><span class="dn">N. [Type] -- Reg. No. [X] | Dated: [DD-MM-YYYY]</span><br>[Executant/s] unto and in favour of [Claimant/s]. [SRO.] [2-3 sentences.]</p></div>
EC: <div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [no] | Date: [date] | Period: [from] to [to]</span><br>EC bearing E-Application No. [no] dated [date] for search period [from] to [to] issued by IGR, Revenue Dept, Gujarat. [N] transaction/s found. [Summary.]</p></div>
START: <hr><div class="ph">PART I`

const L4B = `Layer 4 -- PART IV, PART V. PURE HTML ONLY.
PART IV: Oldest first. First para NO "Thereafter". Each subsequent MUST start "Thereafter,".
<hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
First: <p>[Earliest owner -- mutation entry No. X dated DD/MM/YYYY.]</p>
Each next: <p>Thereafter, [Seller/s] transferred to [Buyer/s] vide Registered [Type] No. [X] dated [DD/MM/YYYY] at SRO [Name]. Mutation No. [X] dated [DD/MM/YYYY].</p>
MORTGAGE -- IF RELEASED: <p>Thereafter, [Mortgagor/s] created mortgage in favour of [Bank] vide Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage stands discharged and charge fully released and satisfied vide [Reconveyance/Mortgage Release Deed] No. [Y] dated [DD/MM/YYYY] by [Bank] unto [Owner] -- no subsisting charge remains.</p>
MORTGAGE -- IF ACTIVE: <p>Thereafter, [Mortgagor/s] created mortgage in favour of [Bank] vide Mortgage Deed No. [X] dated [DD/MM/YYYY] at SRO [Name]. The said mortgage is subsisting and active -- no Release Deed found.</p>
Final: <p>Thereafter, [Current Owner/s] holds right, title and interest confirmed by EC E-App No. [EC_APP_NUMBER] dated [EC_DATE] period [EC_FROM] to [EC_TO]. Encumbrance Status: [ENCUMBRANCE_STATUS].</p>
RULE: NEVER say "no discharge" for RELEASED mortgage.
PART V: <hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div>
<div class="sph">Revenue Record</div><table class="mt"><tr><td>Village</td><td>:</td><td>[Name]</td></tr><tr><td>Taluka</td><td>:</td><td>[Name]</td></tr><tr><td>District</td><td>:</td><td>[Name]</td></tr><tr><td>Survey/Block No.</td><td>:</td><td>[No.]</td></tr><tr><td>Total Area</td><td>:</td><td>[H.Are.SqMt.]</td></tr><tr><td>Land Use</td><td>:</td><td>[Bin Kheti/Non-Agricultural = OK | Kheti/Agricultural = FLAG IMMEDIATELY]</td></tr><tr><td>Ownership</td><td>:</td><td>[Names -- flag if current owner not reflected]</td></tr><tr><td>Boja/Encumbrance</td><td>:</td><td>[NIL / Details]</td></tr><tr><td>Ganot/Tenant</td><td>:</td><td>[NIL / flag if found]</td></tr></table>
<div class="sph">Mutation Entries</div><table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Status</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>[rows]</table>
<div class="sph">Regulatory Approvals</div><table class="mt"><tr><td>NA Order</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr><tr><td>Development Permission</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr><tr><td>Building Plan</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr><tr><td>Commencement Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr><tr><td>RERA Registration</td><td>:</td><td>[RERA No. OR "NOT PROVIDED FOR VERIFICATION." -- Post May 2017: MANDATORY]</td></tr><tr><td>Fire NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr><tr><td>Airport NOC</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr><tr><td>OC / BU Permission</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr><tr><td>Completion Certificate</td><td>:</td><td>[Details OR "NOT PROVIDED FOR VERIFICATION."]</td></tr></table>
<div class="sph">Encumbrance Analysis</div>
<p>[EC_TABLE_HTML_PLACEHOLDER]</p>
<div class="sph">Mortgage Lifecycle Summary</div>
<table class="mt"><tr><td>A. Active Mortgages</td><td>:</td><td>[A. ACTIVE_MORTGAGES]</td></tr><tr><td>B. Released Mortgages</td><td>:</td><td>[B. RELEASED_MORTGAGES]</td></tr><tr><td>C. Unmatched Releases</td><td>:</td><td>[C. UNMATCHED_RELEASES]</td></tr><tr><td>D. Encumbrance Status</td><td>:</td><td>[D. ENCUMBRANCE_STATUS]</td></tr></table>
START: <hr><div class="ph">PART IV`

const L4C = `Layer 4 -- PART VI, PART VII, PART VIII. PURE HTML ONLY. Max 5 alerts.
PART VI: <hr><div class="ph">PART VI -- ALERTS</div><p>Alerts identified. HIGH = conditions precedent to sanction.</p>
HIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. [Title]</div><p>[Finding. 2-3 sentences.]</p><p><span class="sg">Direction:</span> [Action.]</p></div>
MEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. [Title]</div><p>[2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
LOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. [Title]</div><p>[1-2 sentences.]</p><p><span class="sg">Direction:</span> [Steps.]</p></div>
RULES: NEVER flag released mortgage. NEVER flag EC-confirmed deeds. NEVER flag EC Applicant. No alerts = <p>No material adverse findings. Title appears clear.</p>
PART VII: <hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div>
<div class="sph">A. Documents Submitted</div><ol>[all readable docs]</ol>
<div class="sph">B. Critical Missing</div><ol>[mandatory missing OR NIL]</ol>
<div class="sph">C. Important Missing</div><ol>[other missing OR NIL]</ol>
<div class="sph">D. Illegible/Incomplete</div><ol>[unreadable OR NIL]</ol>
<div class="sph">E. Risk Assessment</div><table class="mt"><tr><td>Risk Level</td><td>:</td><td>[HIGH/MODERATE/LOW]</td></tr><tr><td>Mortgageability</td><td>:</td><td>[Mortgageable/Conditionally/Not]</td></tr><tr><td>SARFAESI</td><td>:</td><td>[Enforceable/Conditionally/Not]</td></tr><tr><td>Lending Suitability</td><td>:</td><td>[Suitable/Conditionally/Not]</td></tr><tr><td>Security Coverage</td><td>:</td><td>[Adequate/Marginal/Inadequate]</td></tr><tr><td>Reasoning</td><td>:</td><td>[2-3 sentences]</td></tr></table>
PART VIII: <hr><div class="ph">PART VIII -- LEGAL OPINION</div>
<p>[EXACT legal opinion with actual names]</p>
<p>The said immovable property is/will be enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.</p>
<p>The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.</p>
VERDICT: HIGH alerts: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve ALL HIGH alerts before proceeding.</p></div>
MEDIUM/LOW only: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Mortgageable subject to: [conditions].</p></div>
No alerts: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">[Brief reason.]</p></div>
START: <hr><div class="ph">PART VI`

const L4D = `Layer 4 -- PART IX, PART X, PART XI. PURE HTML ONLY.
PART IX: <hr><div class="ph">PART IX -- PRE-DISBURSEMENT DOCUMENTS</div><p>Required BEFORE disbursement:</p>
<ol>[Case-specific: Builder Purchase: NOC from Builder|NOC from Project Finance Bank|Draft Sale Deed/Banakhat|Allotment Letter|Missing docs || Resale: Draft Sale Deed|Chain docs || BT: LOD from existing Bank|Foreclosure Letter|NOC|CERSAI|Updated EC || Seller BT: Draft Deed|Foreclosure|LOD|NOC|CERSAI|Updated EC || LAP: Original Sale Deed|Updated EC|CERSAI]</ol>
PART X: <hr><div class="ph">PART X -- POST-DISBURSEMENT DOCUMENTS</div><p>Required AFTER disbursement:</p>
<ol>[Case-specific: Builder Purchase: Final Registered Sale Deed || Resale: Final Registered Sale Deed || BT: No-Due Certificate|Release Deed from existing Bank|Original Title Docs|Updated EC || Seller BT: Sale Deed|Release Deed|No-Due Certificate|Updated EC || LAP: Registered Mortgage/MODT|CERSAI Confirmation|Updated EC]</ol>
PART XI: <hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div>
<div class="final-rec"><div class="fr-title">Final Title Status:</div><div class="fr-value">[CLEAR AND MARKETABLE TITLE / CLEAR TITLE SUBJECT TO CONDITIONS]</div></div>
<p style="margin-top:16px;">[3-4 sentences: overall status, conditions, bank can proceed, mortgage lifecycle summary.]</p>
START: <hr><div class="ph">PART IX`
function buildHtml(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; p123: string; p45: string; p678: string; p911: string }): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report</title><style>${CSS}</style></head><body>
<div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div>
<div class="hdr-right"><div><strong>Reference No.:</strong> ${p.refNo}</div><div><strong>Application ID:</strong> ${p.appId}</div><div><strong>Report Date:</strong> ${p.today}</div><div><strong>Bank:</strong> ${p.bankName}</div></div></div>
<div class="rtitle">LEGAL SCRUTINY REPORT -- ${p.loanType}</div><hr>
${p.p123}${p.p45}${p.p678}${p.p911}
<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ${p.today}</div></div>
<div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">${p.bankName}</div></div></div>
<div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: Prepared for ${p.bankName}, App ${p.appId}. Based on documents produced. Not a guarantee of title.</div><div class="wm">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div></div>
</body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { images, documentText, caseType, appId, bankName, loanType,
      applicantName, coApplicant, propertyAddress, currentOwner,
      boundaryEast, boundaryWest, boundaryNorth, boundarySouth, userId } = body
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const refNo = `TITLEMATRIXAI/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`
    const loanMap: Record<string, string> = { builder_purchase: 'Builder Purchase', resale: 'Resale Property', bt: 'Balance Transfer', seller_bt: 'Seller BT', lap: 'LAP (Loan Against Property)' }

    // Build image content array
    const imgContent: any[] = []
    if (images?.length) for (const img of images)
      imgContent.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })

    // ================================================================
    // STEP 0: DEDICATED EC EXTRACTION -- any how EC must be detected
    // ================================================================
    let ecRows: ECRow[] = []
    let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
    let lifecycle = { active: [] as Charge[], released: [] as Charge[], summary: 'No EC data.', encumbrance: 'UNKNOWN' }

    if (imgContent.length > 0) {
      try {
        const ecPrompt = [...imgContent, {
          type: 'text', text: `Find the Encumbrance Certificate (EC) document in these images.
EC title: "Milakat parna boja angenu patrak" OR "Encumbrance Certificate" (Gujarati/English).
It has a TABLE with property transaction rows.
Extract ALL rows. Output ONLY this JSON (no markdown):
{"found":true,"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"exact col1 text","col2_property":"","col3_aapnar":"executing party col3","col4_lenar":"claimant party col4","col5_date":"","col6_deed_no":""}]}
RULES: Extract EVERY row. Column 7 (last) = DO NOT extract. EC applicant from header = IGNORE.
If no EC found: {"found":false,"rows":[]}` }]

        const ecRes = await client.messages.create({
          model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0,
          messages: [{ role: 'user', content: ecPrompt }]
        })
        const ecRaw = ecRes.content[0].type === 'text' ? ecRes.content[0].text : '{}'
        const ecJson = JSON.parse(ecRaw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim())
        if (ecJson.found && ecJson.rows?.length > 0) {
          ecRows = ecJson.rows
          ecMeta = { ec_app_number: ecJson.ec_app_number || '', ec_date: ecJson.ec_date || '', ec_from: ecJson.ec_from || '', ec_to: ecJson.ec_to || '' }
          lifecycle = mortgageLifecycle(ecRows)
          console.log('EC extracted:', ecRows.length, 'rows | Status:', lifecycle.encumbrance)
        }
      } catch (e) { console.log('EC extraction error:', e) }
    }

    const ecTableHtml = buildECTable(ecRows, lifecycle)
    const ecGroundTruth = `
=== EC GROUND TRUTH (100% CORRECT -- DO NOT CONTRADICT) ===
EC App No: ${ecMeta.ec_app_number} | Date: ${ecMeta.ec_date} | Period: ${ecMeta.ec_from} to ${ecMeta.ec_to}
EC Rows: ${ecRows.length}
Encumbrance: ${lifecycle.encumbrance}
Summary: ${lifecycle.summary}
Active Mortgages: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => `${a.lender} Deed:${a.deed_no} Date:${a.date}`).join(' | ')}
Released Mortgages: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => `${r.lender} RELEASED vide ${r.release_deed_no} on ${r.release_date}`).join(' | ')}
RULE: RELEASED mortgage = DO NOT flag as alert. ACTIVE = flag HIGH SEVERITY.
=== END EC GROUND TRUTH ===`

    // ================================================================
    // LAYER 1: Full document extraction
    // ================================================================
    const l1Content = [...imgContent, {
      type: 'text', text: `LAYER 1 -- DOCUMENT EXTRACTION
CASE: ${caseType} | BANK: ${bankName} | APP: ${appId}
Applicant: ${applicantName} | Co: ${coApplicant || 'None'} | Owner: ${currentOwner}
Property: ${propertyAddress}
Boundaries: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}
${documentText || ''}
${ecGroundTruth}
EXTRACT ALL DOCUMENTS. Apply 7-Step for each EC row. Output MORTGAGE_LIFECYCLE_SUMMARY.
EC data already extracted above -- use it. EC Col 7 NEVER. EC Applicant IGNORE.` }]

    const l1Res = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
      system: L1, messages: [{ role: 'user', content: l1Content }]
    })
    const facts = l1Res.content[0].type === 'text' ? l1Res.content[0].text : ''

    // ================================================================
    // LAYER 2+3: Title + Risk
    // ================================================================
    const l23Res = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0,
      system: getL23(caseType),
      messages: [{
        role: 'user', content: `LAYER 2+3 -- TITLE + RISK
CASE: ${caseType} | BANK: ${bankName} | APP: ${appId}
APPLICANT: ${applicantName} | CO: ${coApplicant || 'None'} | OWNER: ${currentOwner}
PROPERTY: ${propertyAddress}
BOUNDARIES: E=${boundaryEast || '?'} W=${boundaryWest || '?'} N=${boundaryNorth || '?'} S=${boundarySouth || '?'}
${ecGroundTruth}
LAYER 1 FACTS: ${facts}
Fill META block using EC ground truth. RELEASED = DO NOT flag. ACTIVE = flag HIGH.` }]
    })
    const analysis = l23Res.content[0].type === 'text' ? l23Res.content[0].text : ''
    const meta = parseMeta(analysis)
    const existingBank = lifecycle.active.length > 0 ? lifecycle.active[0].lender : (lifecycle.released.length > 0 ? lifecycle.released[0].lender : 'N/A')

    // ================================================================
    // LAYER 4: 4 Parallel -- 11-Part Report
    // ================================================================
    const ctx = `${ecGroundTruth}\nLAYER 1: ${facts}\nLAYER 23: ${analysis}`
    const [r4a, r4b, r4c, r4d] = await Promise.all([
      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4A,
        messages: [{
          role: 'user', content: `Parts I+II+III.
APPLICANT: ${meta.applicant || applicantName} | CO: ${meta.coApplicant || coApplicant || 'N/A'}
MORTGAGOR: ${meta.mortgagor || meta.applicant || applicantName}
OWNER: ${meta.currentOwner || currentOwner} | PROPERTY: ${meta.propertyPara || propertyAddress}
BOUNDARIES: E:${boundaryEast || '?'} W:${boundaryWest || '?'} N:${boundaryNorth || '?'} S:${boundarySouth || '?'}
EC: App No.${meta.ecAppNumber || ecMeta.ec_app_number || '?'} Date:${meta.ecDate || ecMeta.ec_date || '?'} Period:${meta.ecFrom || ecMeta.ec_from || '?'} to ${meta.ecTo || ecMeta.ec_to || '?'} Rows:${ecRows.length}
BANK: ${bankName}
${ctx}
RULE: Part III NO illegibility/blank/not-provided remarks. Those go Part VI ONLY.` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: L4B,
        messages: [{
          role: 'user', content: `Parts IV+V.
CASE: ${caseType} | PROPERTY: ${meta.propertyPara || propertyAddress} | OWNER: ${meta.currentOwner || currentOwner}
EC: App No.${meta.ecAppNumber || ecMeta.ec_app_number || '?'} Period:${meta.ecFrom || ecMeta.ec_from || '?'} to ${meta.ecTo || ecMeta.ec_to || '?'}
MORTGAGE SUMMARY: ${lifecycle.summary}
ENCUMBRANCE: ${lifecycle.encumbrance}
${ctx}
Replace [EC_TABLE_HTML_PLACEHOLDER] with this exact HTML: ${ecTableHtml}
Rules: Part IV oldest first. First NO "Thereafter". Each subsequent MUST start "Thereafter,". RELEASED mortgage = "fully released and satisfied". ACTIVE = "subsisting and active".` }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: L4C,
        messages: [{
          role: 'user', content: `Parts VI+VII+VIII. Max 5 alerts.
BANK: ${bankName} | ENCUMBRANCE: ${lifecycle.encumbrance}
ACTIVE MORTGAGES: ${lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map(a => a.lender + ' Deed:' + a.deed_no).join(', ')}
RELEASED MORTGAGES: ${lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map(r => r.lender + ' RELEASED').join(', ')}
${ctx}
RULES: NEVER flag released mortgage. NEVER flag EC Applicant. Part VIII use exact legal opinion wording.
Legal opinion to use: ${(() => { const k = caseType in { builder_purchase: 1, resale: 1, bt: 1, seller_bt: 1, lap: 1 } ? caseType : 'lap'; const owner = meta.currentOwner || currentOwner; const app = meta.applicant || applicantName; const eb = existingBank; if (k === 'bt' || k === 'seller_bt') return `...valid subject to charge of ${eb} and after execution of release unto ${app}...`; return `...right title and interest of ${owner}...after Sale Deed unto ${app}...SARFAESI enforceable...`; })()}`
        }]
      }),

      client.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: L4D,
        messages: [{
          role: 'user', content: `Parts IX+X+XI.
CASE: ${caseType} | BANK: ${bankName} | OWNER: ${meta.currentOwner || currentOwner} | APPLICANT: ${meta.applicant || applicantName}
EXISTING BANK: ${existingBank} | ENCUMBRANCE: ${lifecycle.encumbrance} | ${lifecycle.summary}
Part XI select ONE: CLEAR AND MARKETABLE TITLE or CLEAR TITLE SUBJECT TO CONDITIONS.` }]
      })
    ])

    let p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error I-III</p>'
    let p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error IV-V</p>'
    let p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error VI-VIII</p>'
    const p911 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error IX-XI</p>'

    // ================================================================
    // LAYER 5: Validation -- catch and fix mistakes
    // ================================================================
    const errors: string[] = []
    if (lifecycle.released.length > 0 && (p45.toLowerCase().includes('no release') || p45.toLowerCase().includes('no discharge')))
      errors.push('ERROR: RELEASED mortgage incorrectly says no discharge in Part IV.')
    if (p123.toLowerCase().includes('illegible') || p123.toLowerCase().includes('not provided for verification'))
      errors.push('ERROR: Part III has illegibility remarks -- must move to Part VI.')

    if (errors.length > 0) {
      try {
        const fixRes = await client.messages.create({
          model: 'claude-sonnet-4-6', max_tokens: 5000, temperature: 0,
          system: `Fix ONLY the listed errors. Output: corrected Part IV HTML then ===P6=== then corrected Part VI HTML. Pure HTML only.`,
          messages: [{ role: 'user', content: `ERRORS:\n${errors.join('\n')}\n${ecGroundTruth}\nPART IV:\n${p45.substring(0, 3000)}\nPART VI:\n${p678.substring(0, 3000)}\nFix and output.` }]
        })
        const ft = fixRes.content[0].type === 'text' ? fixRes.content[0].text : ''
        if (ft.includes('===P6===')) {
          const pts = ft.split('===P6===')
          if (pts[0].trim()) p45 = pts[0].trim()
          if (pts[1]?.trim()) p678 = pts[1].trim()
        }
      } catch (e) { console.log('Validation fix failed:', e) }
    }

    const html = buildHtml({ refNo, appId: appId || 'AUTO', today, bankName: bankName || 'Bank', loanType: loanMap[caseType] || 'LAP', p123, p45, p678, p911 })
    const verdict = lifecycle.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR' : lifecycle.encumbrance === 'CLEAR' ? 'CLEAR' : 'CLEAR SUBJECT TO'

    if (userId && db) {
      try { await db.from('reports').insert({ user_id: userId, case_type: caseType || 'lap', applicant_name: meta.applicant || applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: meta.propertyPara || propertyAddress || 'Unknown', app_id: appId || refNo, verdict, report_html: html }) }
      catch (e) { console.log('DB save error:', e) }
    }
    return NextResponse.json({ success: true, report: html, verdict, lifecycle, ecRows, debug: { facts, analysis, ecMeta } })
  } catch (e: any) {
    console.error('TITLEMATRIXAI error:', e)
    return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
  }
}