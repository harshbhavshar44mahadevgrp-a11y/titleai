// TITLEMATRIXAI FINAL PRODUCTION - EC + RELEASE PERMANENT
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

const AI = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const DB = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null

interface ECRow { row_number: number; col1_type: string; col3_aapnar: string; col4_lenar: string; col5_date: string; col6_deed_no: string }
interface Charge { row: number; lender: string; deed_no: string; date: string; release_deed_no: string; release_date: string }
interface LC { active: Charge[]; released: Charge[]; encumbrance: string; summary: string }

function isBank(n: string): boolean {
    if (!n || n.length < 2) return false
    const t = n.toLowerCase()
    return ['bank', 'finance', 'financial', 'housing', 'capital', 'credit', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'boi', 'canara', 'bajaj', 'lic', 'lichfl', 'gruh', 'aavas', 'piramal', 'tata capital', 'mahindra', 'bandhan', 'idfc', 'federal', 'nbfc', 'hfc', 'limited', 'ltd'].some(w => t.includes(w))
}

function buildLC(active: Charge[], released: Charge[]): LC {
    const enc = active.length > 0 ? 'ENCUMBERED' : released.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'
    const sum = active.length === 0 && released.length === 0 ? 'NIL encumbrance' : active.length > 0 ? 'ACTIVE: ' + active.map(a => a.lender + ' Deed:' + a.deed_no).join(' | ') : 'RELEASED: ' + released.map(r => r.lender + ' vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')
    return { active, released, encumbrance: enc, summary: sum }
}

function runLC(rows: ECRow[]): LC {
    const active: Charge[] = [], released: Charge[] = []
    for (const r of rows) {
        if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar))
            active.push({ row: r.row_number, lender: r.col4_lenar, deed_no: r.col6_deed_no || '', date: r.col5_date || '', release_deed_no: '', release_date: '' })
    }
    const RKW = ['release', 'reconveyance', 'discharge', 'satisfaction', 'no due', 'ga.f', 'ga.mu', 'ga.o', 'giro fer', 'giro mukeli', 'mukeli']
    for (const r of rows) {
        const c1 = (r.col1_type || '').toLowerCase()
        const S1 = RKW.some(k => c1.includes(k))
        const S2 = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        const S3 = c1.includes('mortgage') && isBank(r.col3_aapnar)
        if (S1 || S2 || S3) {
            const bn = isBank(r.col3_aapnar) ? r.col3_aapnar : isBank(r.col4_lenar) ? r.col4_lenar : r.col3_aapnar
            if (!bn) continue
            const bw = bn.toLowerCase().split(' ').filter((w: string) => w.length > 3)
            const mi = active.findIndex((a: Charge) => bw.some((w: string) => a.lender.toLowerCase().includes(w)))
            if (mi >= 0) { const m = active.splice(mi, 1)[0]; m.release_deed_no = r.col6_deed_no || ''; m.release_date = r.col5_date || ''; released.push(m); console.log('RELEASE S' + (S1 ? '1' : S2 ? '2' : '3') + ':' + bn) }
            else released.push({ row: r.row_number, lender: bn, deed_no: '', date: '', release_deed_no: r.col6_deed_no || '', release_date: r.col5_date || '' })
        }
    }
    return buildLC(active, released)
}

function ecTable(rows: ECRow[], lc: LC): string {
    if (!rows.length) return '<p>No EC entries found.</p>'
    let h = '<table class="ec-tbl"><tr><th>Sr.</th><th>Classified Type</th><th>Deed No.</th><th>Date</th><th>Col 3 Aapnar</th><th>Col 4 Lenar</th><th>Status</th></tr>'
    for (const r of rows) {
        const isRel = lc.released.some(x => x.release_deed_no === r.col6_deed_no) || (isBank(r.col3_aapnar) && !isBank(r.col4_lenar))
        const isActMort = lc.active.some(x => x.row === r.row_number)
        let cls = '', st = '', ct = r.col1_type || 'Transaction'
        if (isRel) { cls = 'ec-rel'; ct = 'Mortgage Release Deed'; st = 'DISCHARGED' }
        else if (isActMort) { cls = 'ec-act'; ct = 'Mortgage Deed - Active'; st = 'ACTIVE MORTGAGE' }
        else if (ct.toLowerCase().includes('sale')) st = 'Title Document'
        else st = 'Transaction'
        h += '<tr><td>' + r.row_number + '</td><td>' + ct + '</td><td>' + (r.col6_deed_no || '--') + '</td><td>' + (r.col5_date || '--') + '</td><td>' + (r.col3_aapnar || '--') + '</td><td>' + (r.col4_lenar || '--') + '</td><td class="' + cls + '">' + st + '</td></tr>'
    }
    return h + '</table>'
}

function opinion(ct: string, owner: string, applicant: string, exBank: string): string {
    const B = 'On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that'
    const S = 'The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority. The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank.'
    const T = 'the right, title and interest of ' + owner + ' in respect of the property described hereinabove are covered with all respective Title Deeds. The above referred property is legal, clear, marketable, free from anomalies, valid'
    const M = ' and a valid Registered Mortgage can be created, beyond reasonable doubt.'
    const ops: Record<string, string> = {
        builder_purchase: B + ' ' + T + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor' + M + ' ' + S,
        resale: B + ' ' + T + ' and after the execution and registration of Sale Deed unto and in favour of ' + applicant + ', He/She/They will have legal, clear, marketable, free from anomalies, valid and binding title on the Mortgagor' + M + ' ' + S,
        bt: B + ' ' + T + ' subject to charge of ' + exBank + M + ' ' + S,
        seller_bt: B + ' ' + T + ' subject to charge of ' + exBank + M + ' ' + S,
        lap: B + ' ' + T + ' and He/She/They have legal, clear, marketable, free from anomalies, valid and binding title' + M + ' ' + S,
    }
    return ops[ct] || ops['lap']
}

const CSS = '*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Georgia","Times New Roman",serif;font-size:13px;line-height:1.9;color:#1a1a1a;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between}.firm{font-size:22px;font-weight:bold;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol{padding-left:22px;margin-bottom:10px}ol li{margin-bottom:8px}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}table.mut{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}table.mut th{background:#374151;color:#fff;padding:5px 8px;font-size:11px}table.mut td{border:1px solid #e5e7eb;padding:5px 8px}table.tc-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.tc-tbl th{background:#374151;color:#fff;padding:5px 8px;font-size:10px}table.tc-tbl td{border:1px solid #e5e7eb;padding:5px 8px}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}'

function buildReport(refNo: string, appId: string, today: string, bankName: string, loanType: string, body: string): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report</title><style>' + CSS + '</style></head><body><div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel -- Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div><div class="hdr-right"><div><strong>Reference No.:</strong> ' + refNo + '</div><div><strong>Application ID:</strong> ' + appId + '</div><div><strong>Report Date:</strong> ' + today + '</div><div><strong>Bank:</strong> ' + bankName + '</div></div></div><div class="rtitle">LEGAL SCRUTINY REPORT -- ' + loanType + '</div><hr>' + body + '<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ' + today + '</div></div><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">' + bankName + '</div></div></div><div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: This Report is prepared exclusively for ' + bankName + ' for Application ID ' + appId + '.</div><div class="wm">TITLEMATRIXAI -- CONFIDENTIAL -- FOR BANK USE ONLY</div></div></body></html>'
}

function safeJSON(raw: string): any { try { const c = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(); const f = c.indexOf('{'); const l = c.lastIndexOf('}'); if (f >= 0 && l >= 0) return JSON.parse(c.substring(f, l + 1)); const fa = c.indexOf('['); const la = c.lastIndexOf(']'); if (fa >= 0 && la >= 0) return JSON.parse(c.substring(fa, la + 1)); return JSON.parse(c) } catch { return null } }

const EC_PROMPT = 'You are an expert at reading Gujarat IGR Encumbrance Certificates. Look at ALL images carefully.\n\nFIND THE EC: Look for government table titled "Milkat Parna Boja Angenu Patrak" or "Encumbrance Certificate".\n\nEC HEADER (extract from top):\n- e-Application No = ec_app_number\n- Date of Print = ec_date\n- Search Period From = ec_from, To = ec_to\n\nEC TABLE HAS 7 COLUMNS:\nCOL1=Deed Type | COL2=Property(SKIP) | COL3=Aapnar(Executing=WHO GIVES) | COL4=Lenar(Claimant=WHO RECEIVES) | COL5=Date | COL6=DeedNo(2nd last) | COL7=LAST=NEVER EXTRACT\n\nCRITICAL RULE:\nIF BANK IN COL3 = RELEASE DEED (bank releasing mortgage)\nIF BANK IN COL4 = MORTGAGE DEED (bank receiving mortgage)\n\nGUJARATI: ga.fa./ga.mu.fa./ga.o.fa./ga.o./giro fer/giro mukeli = Mortgage Release Deed\ngiro/ga.kha./ga.ta. = Mortgage Deed\nvechan = Sale Deed\n\nExtract EVERY row. Never skip. Last row often = Release Deed.\n\nOutput ONLY JSON:\n{"found":true,"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}]}\nIf no EC: {"found":false,"rows":[]}'

const M8_PROMPT = 'You are a senior property advocate. Look at ALL uploaded documents carefully.\n\nFIND MORTGAGES AND RELEASES:\n\nMORTGAGE: Any document where a bank/NBFC is the mortgagee/lender. Also in EC table: bank in COL4 (Lenar/right column) = Mortgage.\n\nRELEASE (check EVERYWHERE):\n1. EC table: bank name in COL3 (Aapnar/LEFT column/executing party) = Release Deed\n2. Any document: Release Deed, Reconveyance, No Due Certificate, NOC from Bank, Discharge, Satisfaction, Closure Letter, Full Payment, Mortgage Redemption\n3. Gujarati: ga.fa., ga.mu.fa., ga.o.fa., ga.o., giro fer, giro mukeli\n4. Even if EC does not show it - check ALL other uploaded documents\n\nCROSS REFERENCE: Match release to mortgage by same bank name\n\nONLY OUTPUT THIS JSON:\n{"encumbrances":[{"id":"1","type":"Mortgage","status":"CLEARED or ACTIVE","bank":"exact bank name","document_number":"deed no","date":"date","release_found":true,"release_document":"deed no or null","release_date":"date or null","release_by":"bank name or null","confidence":90}],"overall_status":"CLEAR or ENCUMBERED or CLEAR WITH PRIOR RELEASE"}'

const SYS_L1 = 'You are Document Extraction Engine of TITLEMATRIXAI.\nRULES: Never assume. Never invent. Use ONLY documents. Never use advocate name as applicant. Never "and others". EC Col7=NEVER READ. Stamp paper number=NEVER.\nExtract: doc type, registration date(IGR only), reg number, all executants, all claimants, property description with areas.\nPROPERTY PARA: "Opinion on title and search in respect of immovable property bearing [Type] No. [X] on [Floor] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as [Name] constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."\nOUTPUT: ---META---\nPROPERTY_PARA: [para]\nCURRENT_OWNER: [names]\nRED_FLAGS: [list or NONE]\n---END META---'

function SYS_L23(ct: string): string {
    const g: Record<string, string> = { builder_purchase: 'Builder Purchase: Developer title deeds | RERA mandatory post-2017 | Sale Deed from Developer to Applicant must exist', resale: 'Resale: 30-year title chain | EC cross-match', bt: 'Balance Transfer: EC must show ACTIVE mortgage from existing bank', seller_bt: 'Seller BT: Release existing mortgage + Sale to purchaser.', lap: 'LAP: Owner=Mortgagor. EC must show NIL or Released only.' }
    return 'You are Title Verification+Risk Engine of TITLEMATRIXAI.\nRULES: Never assume. EC Ground Truth=DO NOT CONTRADICT. RELEASED=NEVER flag as active. NEVER "and others".\nCASE: ' + ct.toUpperCase() + '\n' + g[ct] + '\nOUTPUT: ---META---\nPROPERTY_PARA: [para]\nCURRENT_OWNER: [names]\nRED_FLAGS: [list or NONE]\n---END META---'
}

const SYS_4A = 'Layer 4A -- PARTS I+II+III. PURE HTML. No markdown.\nCRITICAL: Applicant=FORM_APPLICANT always. Never advocate name. Part III=NO illegibility remarks.\nPART I: <hr><div class="ph">PART I -- BORROWER DETAILS / MORTGAGOR DETAILS / CURRENT OWNERSHIP</div><div class="sph">A. Borrower Details</div><table class="mt"><tr><td>Name of Borrower/s</td><td>:</td><td>[FORM_APPLICANT]</td></tr><tr><td>Co-Borrower / Co-Applicant</td><td>:</td><td>[FORM_CO or Not Applicable]</td></tr><tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr><tr><td>Constitution</td><td>:</td><td>[Individual/Partnership/Company]</td></tr></table><div class="sph">B. Mortgagor Details</div><table class="mt"><tr><td>Name of Mortgagor/s</td><td>:</td><td>[FORM_APPLICANT]</td></tr><tr><td>Address</td><td>:</td><td>As per documents submitted</td></tr><tr><td>Constitution</td><td>:</td><td>Individual</td></tr></table><div class="sph">C. Current Ownership</div><table class="mt"><tr><td>Current Owner/s</td><td>:</td><td>[FORM_OWNER]</td></tr><tr><td>Mode of Acquisition</td><td>:</td><td>[from documents]</td></tr><tr><td>Registration Details</td><td>:</td><td>[Deed No | Dated | SRO]</td></tr></table>\nPART II: <hr><div class="ph">PART II -- PROPERTY DESCRIPTION</div><div class="prop-para">[property paragraph]</div><table class="mt"><tr><td>East (Purva)</td><td>:</td><td>[FORM_EAST]</td></tr><tr><td>West (Pashchim)</td><td>:</td><td>[FORM_WEST]</td></tr><tr><td>North (Uttar)</td><td>:</td><td>[FORM_NORTH]</td></tr><tr><td>South (Dakshin)</td><td>:</td><td>[FORM_SOUTH]</td></tr></table>\nPART III: <hr><div class="ph">PART III -- LIST OF SCRUTINIZED DOCUMENTS</div><p>The following documents have been produced for examination and scrutiny:</p>[Each doc: <div class="di"><p><span class="dn">N. [Type] -- [No] | [Date]</span><br>[2 factual sentences only. NO illegibility.]</p></div>][EC: <div class="di"><p><span class="dn">N. Encumbrance Certificate -- E-App. No.: [APP] | Date: [DATE] | Period: [FROM] to [TO]</span><br>[N] transactions found. Encumbrance Status: [STATUS].</p></div>]\nSTART WITH: <hr><div class="ph">PART I'

const SYS_4B = 'Layer 4B -- PARTS IV+V. PURE HTML.\nPART IV RULES: 1.Oldest FIRST. 2.First para NEVER starts Thereafter. 3.Every next para MUST start Thereafter, 4.NEVER "and others" 5.RELEASED=stands discharged vide Release Deed No.[Y] dated [date]. 6.ACTIVE=is subsisting and active as on date -- no Release Deed found.\n<hr><div class="ph">PART IV -- CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div><p>[First para -- oldest -- NO Thereafter]</p><p>Thereafter, [next]</p><table class="tc-tbl"><tr><th>Sr.</th><th>Year</th><th>Deed Type</th><th>From</th><th>To</th><th>Reg. No.</th><th>SRO</th><th>Area</th><th>Status</th></tr>[rows]</table>\n<hr><div class="ph">PART V -- APPROVALS AND REGULATORY COMPLIANCE</div><div class="sph">A. Revenue Record</div><table class="mt"><tr><td>Village (Mouje)</td><td>:</td><td>[name]</td></tr><tr><td>Taluka</td><td>:</td><td>[name]</td></tr><tr><td>District</td><td>:</td><td>[name]</td></tr><tr><td>Survey / FP No.</td><td>:</td><td>[no]</td></tr><tr><td>Total Area</td><td>:</td><td>[area]</td></tr><tr><td>Land Use</td><td>:</td><td>[NA=OK|Kheti=FLAG]</td></tr><tr><td>Ownership</td><td>:</td><td>[owner or flag]</td></tr><tr><td>Boja / Encumbrance</td><td>:</td><td>[NIL or active details]</td></tr><tr><td>Ganot / Tenant</td><td>:</td><td>[NIL=OK|Tenant=FLAG]</td></tr><tr><td>Govt Acquisition</td><td>:</td><td>[None=OK|Any=CRITICAL]</td></tr></table><div class="sph">B. Mutation Entries</div><table class="mut"><tr><th>Sr.</th><th>Entry No.</th><th>Date</th><th>Certified/Rejected</th><th>Nature</th><th>Details</th><th>Survey No.</th></tr>[rows or NOT PROVIDED row]</table><div class="sph">C. Regulatory Approvals</div><table class="mt"><tr><td>NA Order</td><td>:</td><td>[or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Development Permission</td><td>:</td><td>[or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>RERA Registration</td><td>:</td><td>[RERA No. or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Fire NOC</td><td>:</td><td>[or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Airport Authority NOC</td><td>:</td><td>[or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Occupancy Certificate</td><td>:</td><td>[or NOT PROVIDED FOR VERIFICATION.]</td></tr><tr><td>Completion Certificate</td><td>:</td><td>[or NOT PROVIDED FOR VERIFICATION.]</td></tr></table><div class="sph">D. EC Analysis</div><p>[EC App No, period, rows, status]</p>[EC_TABLE_GOES_HERE]<div class="sph">E. Mortgage Lifecycle Summary</div><table class="mt"><tr><td>A. Active Mortgages</td><td>:</td><td>[NIL or Bank+Deed+Date ACTIVE]</td></tr><tr><td>B. Released Mortgages</td><td>:</td><td>[NIL or Bank DISCHARGED vide Deed No.X dated Y]</td></tr><tr><td>C. Unmatched Releases</td><td>:</td><td>NIL</td></tr><tr><td>D. Overall Status</td><td>:</td><td>[CLEAR/ENCUMBERED/CLEAR WITH PRIOR RELEASE]</td></tr></table>\nSTART WITH: <hr><div class="ph">PART IV'

const SYS_4C = 'Layer 4C -- PARTS VI+VII+VIII. PURE HTML. Max 5-6 alerts.\nNEVER flag RELEASED mortgage as active. NEVER advocate name. Illegibility ONLY in Part VI.\nHIGH: <div class="ib"><div><span class="sh">HIGH SEVERITY</span></div><div class="it">N. Title</div><p>Finding.</p><p><span class="sg">Direction:</span> Action.</p></div>\nMEDIUM: <div class="ib"><div><span class="sm">MEDIUM SEVERITY</span></div><div class="it">N. Title</div><p>Finding.</p><p><span class="sg">Direction:</span> Action.</p></div>\nLOW: <div class="ib"><div><span class="sl">LOW SEVERITY</span></div><div class="it">N. Title</div><p>Note.</p><p><span class="sg">Direction:</span> Note.</p></div>\n<hr><div class="ph">PART VII -- DOCUMENT DEFICIENCY REPORT</div><div class="sph">A. Submitted</div><ol>[list]</ol><div class="sph">B. Critical Missing</div><ol>[or <li>NIL</li>]</ol><div class="sph">C. Important Missing</div><ol>[or NIL]</ol><div class="sph">D. Illegible</div><ol>[or NIL]</ol><div class="sph">E. Risk Assessment</div><table class="mt"><tr><td>Title Risk</td><td>:</td><td>[HIGH/MODERATE/LOW]</td></tr><tr><td>Mortgageability</td><td>:</td><td>[Mortgageable/Conditionally/Not]</td></tr><tr><td>SARFAESI</td><td>:</td><td>[Enforceable/Conditionally/Not]</td></tr><tr><td>Lending Suitability</td><td>:</td><td>[Suitable/Conditionally/Not]</td></tr><tr><td>Security Coverage</td><td>:</td><td>[Adequate/Marginal/Inadequate]</td></tr><tr><td>Reasoning</td><td>:</td><td>[2-3 sentences]</td></tr></table>\n<hr><div class="ph">PART VIII -- LEGAL OPINION AND VERDICT</div>[INSERT_LEGAL_OPINION]\n[HIGH: <div class="vnc"><div class="vt" style="color:#b91c1c;">TITLE NOT CLEAR -- BANK SHOULD NOT PROCEED</div><p style="margin-top:8px;font-size:12px;">Resolve all HIGH SEVERITY before proceeding.</p></div>]\n[MEDIUM/LOW: <div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p style="margin-top:8px;font-size:12px;">Disbursement subject to conditions.</p></div>]\n[None: <div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p style="margin-top:8px;font-size:12px;">Title clear and mortgageable.</p></div>]\nSTART WITH: <hr><div class="ph">PART VI'

const SYS_4D = 'Layer 4D -- PARTS IX+X+XI. PURE HTML.\nEach item: <li><strong>[Name]</strong><br><em>Source:</em> [who/where]<br><em>Purpose:</em> [why needed]</li>\n<hr><div class="ph">PART IX -- DOCUMENTS REQUIRED AT PRE-DISBURSEMENT STAGE</div><p>The following documents are required BEFORE disbursement:</p><ol>[case-specific items]</ol>\n<hr><div class="ph">PART X -- DOCUMENTS REQUIRED AT POST-DISBURSEMENT STAGE</div><p>The following documents are required AFTER disbursement:</p><ol>[Original Sale Deed|MODT/Mortgage|CERSAI|Updated EC|Possession Letter|Society NOC|Mutation|Property Tax|OC/CC|Insurance]</ol>\n<hr><div class="ph">PART XI -- FINAL RECOMMENDATION</div><div class="final-rec"><div class="fr-title">Final Title Status:</div><div class="fr-value">[CLEAR AND MARKETABLE/CLEAR TITLE SUBJECT TO CONDITIONS/TITLE NOT CLEAR]</div></div><p style="margin-top:16px;">[5-6 sentences: title chain|EC App+period+status|mortgage lifecycle with deed nos|RERA|conditions (i)(ii)(iii)|SARFAESI|bank recommendation]</p>\nSTART WITH: <hr><div class="ph">PART IX'

function parseMeta(t: string) { const b = t.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''; const g = (k: string) => b.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi'))?.[1]?.trim() || ''; return { propertyPara: g('PROPERTY_PARA'), currentOwner: g('CURRENT_OWNER'), redFlags: g('RED_FLAGS') } }

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { images, caseType = 'lap', appId = 'AUTO', bankName = 'Bank', applicantName = '', coApplicant = '', currentOwner = '', propertyAddress = '', boundaryEast = '', boundaryWest = '', boundaryNorth = '', boundarySouth = '', userId = null } = body

        if (!images || images.length === 0)
            return NextResponse.json({ success: false, error: 'No documents uploaded. Please upload EC and property documents.' }, { status: 400 })

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const refNo = 'TITLEMATRIXAI/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4)
        const loanMap: Record<string, string> = { builder_purchase: 'Builder Purchase', resale: 'Resale Property', bt: 'Balance Transfer', seller_bt: 'Seller Balance Transfer', lap: 'LAP' }

        const imgs: any[] = images.map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))

        // EC EXTRACTION -- 3 PASSES
        let ecRows: ECRow[] = []
        let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
        let lc = runLC([])

        // Pass 1: Full extraction
        try {
            const r1 = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, messages: [{ role: 'user', content: [...imgs, { type: 'text', text: EC_PROMPT }] }] })
            const p1 = safeJSON(r1.content[0].type === 'text' ? r1.content[0].text : '{}')
            if (p1?.found) { ecRows = p1.rows || []; if (p1.ec_app_number) ecMeta.ec_app_number = p1.ec_app_number; if (p1.ec_date) ecMeta.ec_date = p1.ec_date; if (p1.ec_from) ecMeta.ec_from = p1.ec_from; if (p1.ec_to) ecMeta.ec_to = p1.ec_to; lc = runLC(ecRows); console.log('EC P1: rows=' + ecRows.length + ' status=' + lc.encumbrance) }
        } catch (e) { console.log('EC P1 err:', e) }

        // Pass 2: Header retry
        if (!ecMeta.ec_app_number || !ecMeta.ec_date) {
            try {
                const hq = 'Find the Encumbrance Certificate TOP HEADER in these images. Extract: 1) e-Application Number 2) Date of Print 3) Search period From 4) Search period To. Output JSON with keys ec_app_number, ec_date, ec_from, ec_to.'
                const r2 = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 500, temperature: 0, messages: [{ role: 'user', content: [...imgs, { type: 'text', text: hq }] }] })
                const p2 = safeJSON(r2.content[0].type === 'text' ? r2.content[0].text : '{}')
                if (p2?.ec_app_number && !ecMeta.ec_app_number) ecMeta.ec_app_number = p2.ec_app_number
                if (p2?.ec_date && !ecMeta.ec_date) ecMeta.ec_date = p2.ec_date
                if (p2?.ec_from && !ecMeta.ec_from) ecMeta.ec_from = p2.ec_from
                if (p2?.ec_to && !ecMeta.ec_to) ecMeta.ec_to = p2.ec_to
            } catch (e) { console.log('EC P2 err:', e) }
        }

        // Pass 3: Rows retry
        if (ecRows.length === 0) {
            try {
                const rq = EC_PROMPT + '\n\nCRITICAL: Look again at every image. Find EC table. Extract ALL rows. Last row is often Release Deed. Extract EXACT bank names.'
                const r3 = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, messages: [{ role: 'user', content: [...imgs, { type: 'text', text: rq }] }] })
                const p3 = safeJSON(r3.content[0].type === 'text' ? r3.content[0].text : '{}')
                if (p3?.found && p3.rows?.length > 0) { ecRows = p3.rows; if (!ecMeta.ec_app_number && p3.ec_app_number) ecMeta.ec_app_number = p3.ec_app_number; lc = runLC(ecRows); console.log('EC P3: rows=' + ecRows.length + ' status=' + lc.encumbrance) }
            } catch (e) { console.log('EC P3 err:', e) }
        }

        // MODULE 8 -- PERMANENT RELEASE DETECTION
        try {
            const m8 = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 2000, temperature: 0, messages: [{ role: 'user', content: [...imgs, { type: 'text', text: M8_PROMPT }] }] })
            const m8r = safeJSON(m8.content[0].type === 'text' ? m8.content[0].text : '{}')
            if (m8r?.encumbrances && Array.isArray(m8r.encumbrances)) {
                const active = [...lc.active], released = [...lc.released]
                for (const enc of m8r.encumbrances) {
                    if (!enc.type?.toLowerCase().includes('mortgage')) continue
                    const lk = (enc.bank || '').toLowerCase().split(' ').filter((w: string) => w.length > 3)
                    if (enc.release_found && enc.release_document) {
                        const ai = active.findIndex((a: Charge) => lk.some((w: string) => a.lender.toLowerCase().includes(w)))
                        if (ai >= 0) { const m = active.splice(ai, 1)[0]; m.release_deed_no = enc.release_document || ''; m.release_date = enc.release_date || ''; released.push(m); console.log('M8 RELEASE:' + enc.bank) }
                        else { const alrRel = released.some((r: Charge) => lk.some((w: string) => r.lender.toLowerCase().includes(w))); if (!alrRel) released.push({ row: 0, lender: enc.bank || '', deed_no: enc.document_number || '', date: enc.date || '', release_deed_no: enc.release_document || '', release_date: enc.release_date || '' }) }
                    }
                }
                lc = buildLC(active, released)
                console.log('M8 FINAL:' + lc.encumbrance + '|' + lc.summary)
            }
        } catch (e) { console.log('M8 err:', e) }

        console.log('EC FINAL: app=' + (ecMeta.ec_app_number || 'MISSING') + ' rows=' + ecRows.length + ' status=' + lc.encumbrance)
        const exBank = lc.active.length > 0 ? lc.active[0].lender : lc.released.length > 0 ? lc.released[0].lender : 'N/A'
        const ecTbl = ecTable(ecRows, lc)

        const GT = '=== EC GROUND TRUTH ===\nEC App No: ' + (ecMeta.ec_app_number || 'NOT PROVIDED') + '\nDate: ' + (ecMeta.ec_date || 'NOT PROVIDED') + '\nPeriod: ' + (ecMeta.ec_from || 'NOT PROVIDED') + ' to ' + (ecMeta.ec_to || 'NOT PROVIDED') + '\nRows: ' + ecRows.length + ' | Status: ' + lc.encumbrance + '\nSummary: ' + lc.summary + '\nActive: ' + (lc.active.length === 0 ? 'NONE' : lc.active.map(a => a.lender + ' Deed:' + a.deed_no).join(' | ')) + '\nReleased: ' + (lc.released.length === 0 ? 'NONE' : lc.released.map(r => r.lender + ' RELEASED vide ' + r.release_deed_no + ' on ' + r.release_date).join(' | ')) + '\nRULE: RELEASED=never flag active | COL7=NEVER\n=== END ==='

        const FORM = '=== FORM DATA (HIGHEST PRIORITY) ===\nFORM_APPLICANT: ' + applicantName + '\nFORM_CO: ' + (coApplicant || 'Not Applicable') + '\nFORM_OWNER: ' + (currentOwner || applicantName) + '\nFORM_BANK: ' + bankName + '\nFORM_PROPERTY: ' + propertyAddress + '\nFORM_EAST: ' + (boundaryEast || 'As per documents') + '\nFORM_WEST: ' + (boundaryWest || 'As per documents') + '\nFORM_NORTH: ' + (boundaryNorth || 'As per documents') + '\nFORM_SOUTH: ' + (boundarySouth || 'As per documents') + '\nRULE: Applicant=FORM_APPLICANT always. Never advocate name.\n=== END FORM ==='

        const op = opinion(caseType, currentOwner || applicantName, applicantName, exBank)

        const [l1r, l23r] = await Promise.all([
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: SYS_L1, messages: [{ role: 'user', content: [...imgs, { type: 'text', text: FORM + '\n\n' + GT }] }] }),
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, system: SYS_L23(caseType), messages: [{ role: 'user', content: [...imgs, { type: 'text', text: FORM + '\n\n' + GT }] }] })
        ])
        const l1t = l1r.content[0].type === 'text' ? l1r.content[0].text : ''
        const l23t = l23r.content[0].type === 'text' ? l23r.content[0].text : ''
        const meta = parseMeta(l1t + '\n' + l23t)
        const ctx = 'L1:\n' + l1t.substring(0, 2000) + '\n\nL23:\n' + l23t.substring(0, 2000) + '\n\n' + GT

        const [r4a, r4b, r4c, r4d] = await Promise.all([
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4A, messages: [{ role: 'user', content: FORM + '\nEC: App=' + ecMeta.ec_app_number + ' Date=' + ecMeta.ec_date + ' From=' + ecMeta.ec_from + ' To=' + ecMeta.ec_to + ' Rows=' + ecRows.length + ' Status=' + lc.encumbrance + '\nBANK: ' + bankName + '\n\n' + ctx }] }),
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 5000, temperature: 0, system: SYS_4B, messages: [{ role: 'user', content: FORM + '\nCASE: ' + caseType + '\n' + GT + '\nACTIVE: ' + (lc.active.length === 0 ? 'NONE' : lc.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(', ')) + '\nRELEASED: ' + (lc.released.length === 0 ? 'NONE' : lc.released.map(r => r.lender + ' RELEASED vide Deed:' + r.release_deed_no + ' on ' + r.release_date).join(', ')) + '\n\n' + ctx + '\nReplace [EC_TABLE_GOES_HERE] with:\n' + ecTbl }] }),
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 6000, temperature: 0, system: SYS_4C, messages: [{ role: 'user', content: FORM + '\nBANK: ' + bankName + '\nCASE: ' + caseType + '\n' + GT + '\n\n' + ctx + '\nReplace [INSERT_LEGAL_OPINION] with:\n<p>' + op + '</p>' }] }),
            AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0, system: SYS_4D, messages: [{ role: 'user', content: FORM + '\nCASE: ' + caseType + '\nBANK: ' + bankName + '\n' + GT + '\n\n' + ctx }] })
        ])

        const p123 = r4a.content[0].type === 'text' ? r4a.content[0].text : '<p>Error</p>'
        const p45 = r4b.content[0].type === 'text' ? r4b.content[0].text : '<p>Error</p>'
        const p678 = r4c.content[0].type === 'text' ? r4c.content[0].text : '<p>Error</p>'
        const p911 = r4d.content[0].type === 'text' ? r4d.content[0].text : '<p>Error</p>'

        const verdict = lc.encumbrance === 'ENCUMBERED' ? 'NOT CLEAR' : lc.active.length === 0 ? 'CLEAR' : 'CLEAR SUBJECT TO'
        const html = buildReport(refNo, appId || 'AUTO', today, bankName || 'Bank', loanMap[caseType] || 'LAP', p123 + p45 + p678 + p911)

        if (userId && DB) { try { await DB.from('reports').insert({ user_id: userId, case_type: caseType, applicant_name: applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: propertyAddress || 'Unknown', verdict, encumbrance_status: lc.encumbrance, ec_rows: ecRows.length, report_html: html }) } catch (e) { console.log('DB err:', e) } }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle: lc, ecRows, ecMeta })

    } catch (e: any) {
        console.error('Pipeline error:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}