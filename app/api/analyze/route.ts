// TITLEMATRIXAI FINAL — EC + RELEASE PERMANENT DETECTION
// Based on v5.3 + EC Release Fix
export const maxDuration = 300
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new Anthropic()

const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

function extractVerdict(text: string): string {
    const u = text.toUpperCase()
    if (u.includes('VERDICT: NOT CLEAR') || u.includes('TITLE NOT CLEAR')) return 'NOT CLEAR'
    if (u.includes('VERDICT: CLEAR SUBJECT TO') || u.includes('CLEAR SUBJECT TO')) return 'CLEAR SUBJECT TO'
    if (u.includes('VERDICT: CLEAR')) return 'CLEAR'
    return 'PENDING'
}

function parseMetaSection(text: string) {
    const block = text.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''
    const get = (k: string) => block.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi'))?.[1]?.trim() || ''
    return { applicant: get('APPLICANT'), coApplicant: get('CO_APPLICANT'), propertyDescription: get('PROPERTY_DESCRIPTION'), propertyBoundaries: get('PROPERTY_BOUNDARIES'), currentOwner: get('CURRENT_OWNER') }
}


// ================================================================
// EC RELEASE DETECTION — PERMANENT ENGINE
// ================================================================
interface ECRow { row_number: number; col1_type: string; col3_aapnar: string; col4_lenar: string; col5_date: string; col6_deed_no: string }
interface Charge { lender: string; deed_no: string; date: string; release_deed_no: string; release_date: string }

function isBank(n: string): boolean {
    if (!n || n.length < 2) return false
    const t = n.toLowerCase()
    return ['bank', 'finance', 'financial', 'housing', 'capital', 'credit', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'boi', 'canara', 'bajaj', 'lic', 'lichfl', 'gruh', 'aavas', 'piramal', 'limited', 'ltd', 'nbfc', 'hfc'].some(w => t.includes(w))
}

function detectECLifecycle(rows: ECRow[]): { active: Charge[]; released: Charge[]; status: string; summary: string } {
    const active: Charge[] = [], released: Charge[] = []
    const RKW = ['release', 'reconveyance', 'discharge', 'satisfaction', 'no due', 'giro mukeli', 'ga.f', 'ga.mu', 'ga.o', 'mukeli', 'giro fer']

    for (const r of rows) {
        if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar))
            active.push({ lender: r.col4_lenar, deed_no: r.col6_deed_no || '', date: r.col5_date || '', release_deed_no: '', release_date: '' })
    }

    for (const r of rows) {
        const c1 = (r.col1_type || '').toLowerCase()
        const S1 = RKW.some(k => c1.includes(k))
        const S2 = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        if (S1 || S2) {
            const bn = isBank(r.col3_aapnar) ? r.col3_aapnar : r.col4_lenar
            if (!bn) continue
            const bw = bn.toLowerCase().split(' ').filter((w: string) => w.length > 3)
            const mi = active.findIndex((a: Charge) => bw.some((w: string) => a.lender.toLowerCase().includes(w)))
            if (mi >= 0) {
                const m = active.splice(mi, 1)[0]
                m.release_deed_no = r.col6_deed_no || ''
                m.release_date = r.col5_date || ''
                released.push(m)
                console.log('EC RELEASE: ' + bn + ' Deed:' + m.release_deed_no + ' via S' + (S1 ? '1' : '2'))
            } else {
                released.push({ lender: bn, deed_no: '', date: '', release_deed_no: r.col6_deed_no || '', release_date: r.col5_date || '' })
            }
        }
    }

    const status = active.length > 0 ? 'ENCUMBERED' : released.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'
    const summary = active.length === 0 && released.length === 0 ? 'NIL encumbrance' :
        active.length > 0 ? 'ACTIVE: ' + active.map(a => a.lender + ' Deed:' + a.deed_no).join(' | ') :
            'DISCHARGED: ' + released.map(r => r.lender + ' released vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')
    return { active, released, status, summary }
}


// ================================================================
// STEP 0 — EC PRE-SCREEN (runs before everything)
// ================================================================
const EC_PRESCREEN = 'Look at ALL uploaded images. Find Encumbrance Certificate (EC).\n\nEC TABLE COLUMN RULES — PERMANENT:\nCOL 3 = Aapnar = Executing Party = WHO GIVES\nCOL 4 = Lenar = Claimant Party = WHO RECEIVES\n\nIF BANK IN COL 3 (Aapnar) = RELEASE DEED (bank releasing mortgage back)\nIF BANK IN COL 4 (Lenar) = MORTGAGE DEED (bank receiving mortgage)\n\nGUJARATI: ga.fa./ga.mu.fa./ga.o.fa./giro mukeli/giro fer = Release Deed\n\nAlso check ALL uploaded documents for:\nRelease Deed, Reconveyance, Giro Mukeli, No Due Certificate, Discharge Letter\n\nExtract EVERY EC row:\n- EC App Number\n- EC Date\n- EC Period From and To\n- Each row: deed type, deed number, date, col3_aapnar (exact name), col4_lenar (exact name)\n\nOUTPUT ONLY JSON:\n{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}],"pre_screen_releases":[{"bank":"","deed_no":"","date":"","source":"EC or document"}]}'

// ================================================================
// CSS
// ================================================================
const CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 13px; line-height: 1.85; color: #1a1a1a; background: #fff; max-width: 900px; margin: 0 auto; padding: 48px 60px; }
.hdr { border-bottom: 2px solid #1a1a1a; padding-bottom: 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
.hdr-left .firm { font-size: 20px; font-weight: bold; letter-spacing: 1px; }
.hdr-left .sub { font-size: 11px; color: #555; letter-spacing: 0.5px; margin-top: 2px; }
.hdr-right { text-align: right; font-size: 12px; line-height: 1.9; }
.rtitle { font-size: 15px; font-weight: bold; text-align: center; text-decoration: underline; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 12px; }
.mt { width: 100%; margin-bottom: 8px; border-collapse: collapse; }
.mt td { font-size: 12px; padding: 3px 0; vertical-align: top; }
.mt td:first-child { width: 220px; color: #444; }
.mt td:nth-child(2) { width: 16px; color: #444; }
.mt td:last-child { font-weight: bold; color: #1a1a1a; }
hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
.ph { font-size: 13px; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 12px; }
p { margin-bottom: 10px; text-align: justify; }
.di { margin-bottom: 14px; }
.dn { font-weight: bold; }
.ib { margin-bottom: 22px; padding-left: 14px; border-left: 3px solid #e5e7eb; }
.sh { display: inline-block; background: #b91c1c; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 9px; margin-bottom: 5px; letter-spacing: 0.5px; }
.sm { display: inline-block; background: #b45309; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 9px; margin-bottom: 5px; letter-spacing: 0.5px; }
.sl { display: inline-block; background: #1d4ed8; color: #fff; font-size: 10px; font-weight: bold; padding: 2px 9px; margin-bottom: 5px; letter-spacing: 0.5px; }
.it { font-weight: bold; font-size: 13px; margin-bottom: 5px; }
.sg { font-weight: bold; font-style: italic; }
.pph { font-weight: bold; font-size: 12px; text-transform: uppercase; margin: 14px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
ol { padding-left: 22px; } ol li { margin-bottom: 4px; }
.vnc { margin-top: 20px; padding: 14px 18px; border: 2px solid #b91c1c; background: #fff5f5; }
.vc { margin-top: 20px; padding: 14px 18px; border: 2px solid #15803d; background: #f0fdf4; }
.vs { margin-top: 20px; padding: 14px 18px; border: 2px solid #b45309; background: #fffbeb; }
.vt { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
.sigrow { margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
.sigbox { text-align: center; }
.sigline { width: 200px; border-bottom: 1px solid #1a1a1a; margin: 0 auto 6px; height: 40px; }
.ftr { margin-top: 36px; border-top: 1px solid #ccc; padding-top: 14px; font-size: 11px; color: #666; text-align: center; }
.disc { margin-top: 10px; font-size: 10px; color: #999; text-align: justify; }
.wm { font-size: 10px; color: #bbb; text-align: center; margin-top: 8px; letter-spacing: 2px; text-transform: uppercase; }
table.ec-tbl { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
table.ec-tbl th { background: #1B3A6B; color: #fff; padding: 5px 7px; font-size: 10px; text-align: left; }
table.ec-tbl td { border: 1px solid #ddd; padding: 5px 7px; vertical-align: top; }
table.ec-tbl tr:nth-child(even) { background: #f7f9fc; }
.ec-rel { color: #15803d; font-weight: bold; }
.ec-act { color: #b91c1c; font-weight: bold; }
@media print { body { padding: 30px 40px; } .ib { page-break-inside: avoid; } }`


// ================================================================
// SYSTEM PROMPTS — FROM ORIGINAL v5.3 (PROVEN WORKING)
// ================================================================
const STEP1_SYS = `You are a Senior Gujarat Property Law Expert. Extract ALL raw facts from documents accurately.

NEVER USE "AND OTHERS" — every person named individually.
APPLICANT = from AoS/Draft Sale Deed Buyer section ONLY.
CURRENT OWNER = from latest submitted deed.

EC COLUMN MAPPING — CRITICAL — PERMANENT RULE:
LEFT COLUMN = Aapnar = SELLER/EXECUTOR (one who GIVES the deed)
RIGHT COLUMN = Lenar = BUYER/CLAIMANT (one who TAKES the deed)

EC RELEASE DETECTION — MOST CRITICAL NEW RULE:
IF BANK NAME appears in LEFT COLUMN (Aapnar/Dastavej Kari Aapnar) of any EC entry:
= THIS IS A RELEASE DEED — Bank is RELEASING mortgage back to owner
= Mark this entry as RELEASED — mortgage stands DISCHARGED

IF BANK NAME appears in RIGHT COLUMN (Lenar/Dastavej Kari Lenar) of any EC entry:
= THIS IS A MORTGAGE DEED — Bank is RECEIVING the mortgage
= Mark this entry as ACTIVE MORTGAGE unless separate Release Deed exists

GUJARATI RELEASE DEED RECOGNITION:
"Giro Mukeli" = Mortgage Released
"Giro Mukeli Milkatnu Fer Maliki Ferkhat" = Release of Mortgage Deed
"ga.fa." / "ga.mu.fa." / "ga.o.fa." / "ga.o." = Release Deed abbreviations
Bank in LEFT EC column = ALWAYS Release Deed — never misidentify

MORTGAGE RELEASE CHECK — RULE 17 (PERMANENT):
Before marking any mortgage ACTIVE — check ALL documents for:
1. Release Deed / Giro Mukeli / Reconveyance Deed
2. Index-II of Release Deed
3. NOC/No Dues Certificate from mortgagee bank
4. EC entry with Bank in LEFT column (Aapnar) = Release
If ANY release evidence found = mortgage DISCHARGED — NEVER report as active

EC MULTIPLE ENTRIES — RULE 4A:
Count ALL entries. Read EVERY entry. If bank in RIGHT column = MORTGAGE. If bank in LEFT column = RELEASE.
NEVER say "no mortgage" without checking EVERY entry.

EC DOCUMENT TYPES:
"Maliki Feran/Vecho" = Sale/Transfer
"Boja/Giro" = Mortgage
"Giro Mukeli" = Release of Mortgage
"Banakhat Kabja Vagar" = Agreement to Sale WITHOUT Possession (NOT a Sale Deed)

ALL 4 BOUNDARIES MANDATORY. Extract from every source including Gujarati "Khunt Charne Vigat" section.
SRO RULE A: NEVER list Mutation entries in Part I.
RULE 30: EC-confirmed deed (copy not submitted) = include naturally in chain — NO flag.`

function getStep2Sys(ct: string): string {
    const base = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare a complete Legal Scrutiny Report. Follow every instruction. Miss nothing.

MANDATORY META BLOCK FIRST:
---META---
APPLICANT: [proposed purchaser full name — from Draft/AoS Buyer section — NEVER from stamp paper]
CO_APPLICANT: [names or N/A]
PROPERTY_DESCRIPTION: [FULL: Unit+Floor+Block+Scheme+Survey No.+TP No.+FP No.+Village+Taluka+District+SRO]
PROPERTY_BOUNDARIES: [East: | West: | North: | South: — from ALL documents including Banakhat]
CURRENT_OWNER: [owner name from latest deed]
---END META---

PERMANENT RULES — NEVER BREAK:
1. NEVER "and others" — every name individually
2. All 4 boundaries mandatory
3. Part I latest first | Part II oldest first with "Thereafter,"
4. EC Applicant = IGNORE completely
5. NEVER mention loan amount
6. Dukan = Shop
7. NEVER list mutation entries in Part I
8. Mortgage Release document / Giro Mukeli / Bank in LEFT EC column = DISCHARGED — NEVER report as active

EC COLUMN RULE — PERMANENT:
LEFT/Aapnar = WHO GIVES | RIGHT/Lenar = WHO RECEIVES
BANK IN LEFT (Aapnar) = RELEASE DEED (bank releasing mortgage)
BANK IN RIGHT (Lenar) = MORTGAGE DEED (bank receiving mortgage)

RULE 17 — RELEASE VERIFICATION:
Check ALL documents for Giro Mukeli / Release Deed / NOC / Discharge.
Bank in LEFT EC column = Release — mark mortgage as DISCHARGED immediately.
NEVER say "no release found" if bank appears in left/Aapnar column of any EC entry.

PART IV LEGAL OPINION (Builder Purchase format):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [CURRENT OWNER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [APPLICANT], He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR
USE ALL TOKENS. MISS NOTHING.`
    return base
}

const STEP3A_SYS = `Generate HTML for PART I ONLY — Schedule of Documents Reviewed.
LATEST document FIRST — OLDEST LAST.
NEVER "and others". NEVER mutation entries in Part I. NEVER stamp paper numbers.
EC-confirmed deed (copy not submitted): list naturally — no remark.
Giro Mukeli / Release Deed: list as "Reconveyance / Release Deed" with parties.
START: <hr><div class="ph">PART I — SCHEDULE OF DOCUMENTS REVIEWED</div>
END: after last document entry. Nothing else.`

const STEP3B_SYS = `Generate HTML for PART II ONLY — Chronological Title Chain.
OLDEST first. NEVER "and others". First para = no "Thereafter". Every next para = starts "Thereafter,".
EC bank in LEFT column = Release — write "stands discharged vide Release Deed No.[X] dated [date]".
EC bank in RIGHT column = Mortgage.
SUBJECT PROPERTY ONLY — exact unit/block/floor match.
Rule 30: EC-confirmed deed not submitted = include naturally, no flag.
START: <hr><div class="ph">PART II — CHRONOLOGICAL TITLE CHAIN</div>
END: after last paragraph. Nothing else.`

const STEP3C_SYS = `Generate HTML for PART III ONLY — Legal Issues.
HIGH first, MEDIUM next, LOW last.
NEVER flag: EC-confirmed deeds where copy not submitted | EC applicant | Released mortgages.
SHORT and POINT-WISE. Exact deed numbers, dates, names.
START: <hr><div class="ph">PART III — LEGAL ISSUES, OBJECTIONS AND ADVERSE FINDINGS</div>
END: after last issue block. Nothing else.`

const STEP3D_SYS = `Generate HTML for Documents Required + Part IV + Verdict.
Case-specific legal certificate paragraph in Part IV (CLEAR verdict only).
Do NOT list EC-confirmed deeds in Documents Required.
Verdict must match issues found.
START: <hr><div class="ph">DOCUMENTS REQUIRED</div>
END: after verdict box closing div. Nothing else.`


// ================================================================
// REPORT BUILDER
// ================================================================
function buildHtml(p: { refNo: string; appId: string; today: string; bankName: string; loanType: string; applicant: string; coApp: string; propDesc: string; propBounds: string; owner: string; part1: string; part2: string; part3: string; part4: string; ecRows: ECRow[]; lifecycle: { active: Charge[]; released: Charge[]; status: string; summary: string } }): string {
    let ecTbl = ''
    if (p.ecRows.length > 0) {
        ecTbl = '<hr><div class="ph">EC TABLE — ENCUMBRANCE ANALYSIS</div><table class="ec-tbl"><tr><th>Sr.</th><th>Type</th><th>Deed No.</th><th>Date</th><th>Col 3 Aapnar</th><th>Col 4 Lenar</th><th>Status</th></tr>'
        for (const r of p.ecRows) {
            const isRel = p.lifecycle.released.some(x => x.release_deed_no === r.col6_deed_no) || (isBank(r.col3_aapnar) && !isBank(r.col4_lenar))
            const isAct = p.lifecycle.active.some(x => x.deed_no === r.col6_deed_no)
            const cls = isRel ? 'ec-rel' : isAct ? 'ec-act' : ''
            const st = isRel ? 'DISCHARGED' : isAct ? 'ACTIVE MORTGAGE' : 'Title Document'
            ecTbl += '<tr><td>' + r.row_number + '</td><td>' + (r.col1_type || '--') + '</td><td>' + (r.col6_deed_no || '--') + '</td><td>' + (r.col5_date || '--') + '</td><td>' + (r.col3_aapnar || '--') + '</td><td>' + (r.col4_lenar || '--') + '</td><td class="' + cls + '">' + st + '</td></tr>'
        }
        ecTbl += '</table>'
    }

    const lcBox = '<hr><div class="ph">MORTGAGE LIFECYCLE SUMMARY</div><table class="mt"><tr><td>Active Mortgages</td><td>:</td><td>' + (p.lifecycle.active.length === 0 ? 'NIL' : p.lifecycle.active.map(a => a.lender + ' — Deed No.' + a.deed_no + ' dated ' + a.date).join(' | ')) + '</td></tr><tr><td>Released Mortgages</td><td>:</td><td>' + (p.lifecycle.released.length === 0 ? 'NIL' : p.lifecycle.released.map(r => r.lender + ' — DISCHARGED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')) + '</td></tr><tr><td>Overall Status</td><td>:</td><td><strong>' + p.lifecycle.status + '</strong></td></tr></table>'

    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report</title><style>' + CSS + '</style></head><body><div class="hdr"><div class="hdr-left"><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel — Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div><div class="hdr-right"><div><strong>Reference No. :</strong> ' + p.refNo + '</div><div><strong>Application ID :</strong> ' + p.appId + '</div><div><strong>Report Date :</strong> ' + p.today + '</div><div><strong>Bank :</strong> ' + p.bankName + '</div></div></div><div class="rtitle">LEGAL SCRUTINY REPORT — ' + p.loanType + '</div><table class="mt"><tr><td>Applicant</td><td>:</td><td>' + p.applicant + '</td></tr><tr><td>Co-Applicant</td><td>:</td><td>' + (p.coApp || 'Not Applicable') + '</td></tr><tr><td>Current Owner</td><td>:</td><td>' + p.owner + '</td></tr><tr><td>Property</td><td>:</td><td>' + p.propDesc + '</td></tr><tr><td>Boundaries</td><td>:</td><td>' + (p.propBounds || 'As per documents') + '</td></tr></table>' + p.part1 + p.part2 + ecTbl + lcBox + p.part3 + p.part4 + '<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ' + p.today + '</div></div><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">' + p.bankName + ' | APP ID: ' + p.appId + '</div></div></div><div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: Prepared exclusively for ' + p.bankName + ' for Application ID ' + p.appId + '. Based solely on documents produced. Does not constitute a guarantee of title.</div><div class="wm">TITLEMATRIXAI — CONFIDENTIAL — FOR BANK USE ONLY</div></div></body></html>'
}


// ================================================================
// MAIN API HANDLER
// ================================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { images, caseType = 'lap', appId = 'AUTO', bankName = 'Bank', loanType = 'Loan Against Property', applicantName = '', coApplicant = '', currentOwner = '', propertyAddress = '', userId = null } = body

        if (!images || images.length === 0)
            return NextResponse.json({ success: false, error: 'No documents uploaded. Please upload EC and property documents.' }, { status: 400 })

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const refNo = 'TITLEMATRIXAI/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4)
        // Separate EC-tagged images from other images
        const imgs: any[] = images.map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const ecImgs: any[] = images
            .filter((img: any) => img.docType && img.docType.toLowerCase().includes('ec') || img.docType && img.docType.toLowerCase().includes('encumbrance'))
            .map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const releaseImgs: any[] = images
            .filter((img: any) => img.docType && (img.docType.toLowerCase().includes('release') || img.docType.toLowerCase().includes('reconveyance') || img.docType.toLowerCase().includes('mortgage')))
            .map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        console.log('Images: total=' + imgs.length + ' EC-tagged=' + ecImgs.length + ' Release/Mortgage-tagged=' + releaseImgs.length)
        // Use EC-tagged images for pre-screen if available, otherwise use all images
        const preScreenImgs = ecImgs.length > 0 ? [...ecImgs, ...releaseImgs] : imgs
        const loanMap: Record<string, string> = { builder_purchase: 'BUILDER PURCHASE', resale: 'RESALE PROPERTY', bt: 'BALANCE TRANSFER', seller_bt: 'SELLER BALANCE TRANSFER', lap: 'LOAN AGAINST PROPERTY' }

        // ============================================================
        // STEP 0: EC PRE-SCREEN — Find release BEFORE anything else
        // ============================================================
        let ecRows: ECRow[] = []
        let ecMeta = { ec_app_number: '', ec_date: '', ec_from: '', ec_to: '' }
        let lifecycle = detectECLifecycle([])
        let preReleases: Array<{ bank: string; deed_no: string; date: string }> = []

        try {
            const ps = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, temperature: 0, messages: [{ role: 'user', content: [...preScreenImgs, { type: 'text', text: EC_PRESCREEN }] }] })
            const raw = ps.content[0].type === 'text' ? ps.content[0].text : '{}'
            const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const f = clean.indexOf('{'), l = clean.lastIndexOf('}')
            if (f >= 0 && l >= 0) {
                const parsed = JSON.parse(clean.substring(f, l + 1))
                if (parsed.rows?.length > 0) ecRows = parsed.rows
                if (parsed.ec_app_number) ecMeta.ec_app_number = parsed.ec_app_number
                if (parsed.ec_date) ecMeta.ec_date = parsed.ec_date
                if (parsed.ec_from) ecMeta.ec_from = parsed.ec_from
                if (parsed.ec_to) ecMeta.ec_to = parsed.ec_to
                if (parsed.pre_screen_releases?.length > 0) preReleases = parsed.pre_screen_releases
                lifecycle = detectECLifecycle(ecRows)
                console.log('PRE-SCREEN: rows=' + ecRows.length + ' status=' + lifecycle.status + ' releases=' + preReleases.length)
            }
        } catch (e) { console.log('Pre-screen err:', e) }

        // Apply pre-screen releases to lifecycle
        if (preReleases.length > 0) {
            const act2 = [...lifecycle.active], rel2 = [...lifecycle.released]
            for (const ps of preReleases) {
                const bw = ps.bank.toLowerCase().split(' ').filter((w: string) => w.length > 3)
                const alrRel = rel2.some((r: Charge) => bw.some((w: string) => r.lender.toLowerCase().includes(w)))
                if (!alrRel) {
                    const ai = act2.findIndex((a: Charge) => bw.some((w: string) => a.lender.toLowerCase().includes(w)))
                    if (ai >= 0) { const m = act2.splice(ai, 1)[0]; m.release_deed_no = ps.deed_no || ''; m.release_date = ps.date || ''; rel2.push(m); console.log('PRE-SCREEN RELEASE: ' + ps.bank) }
                    else rel2.push({ lender: ps.bank, deed_no: '', date: '', release_deed_no: ps.deed_no || '', release_date: ps.date || '' })
                }
            }
            lifecycle = { active: act2, released: rel2, status: act2.length > 0 ? 'ENCUMBERED' : rel2.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR', summary: '' }
        }

        const GT = '=== EC GROUND TRUTH ===\nEC App No: ' + (ecMeta.ec_app_number || 'NOT PROVIDED') + '\nDate: ' + (ecMeta.ec_date || 'NOT PROVIDED') + '\nPeriod: ' + (ecMeta.ec_from || '?') + ' to ' + (ecMeta.ec_to || '?') + '\nRows: ' + ecRows.length + '\nStatus: ' + lifecycle.status + '\n' + lifecycle.summary + '\nActive: ' + (lifecycle.active.length === 0 ? 'NONE' : lifecycle.active.map((a: Charge) => a.lender + ' Deed:' + a.deed_no).join(' | ')) + '\nReleased: ' + (lifecycle.released.length === 0 ? 'NONE' : lifecycle.released.map((r: Charge) => r.lender + ' RELEASED vide ' + r.release_deed_no + ' on ' + r.release_date).join(' | ')) + '\nRULE: Released = NEVER flag as active\n==='

        const FORM = '=== FORM DATA ===\nFORM_APPLICANT: ' + applicantName + '\nFORM_CO: ' + (coApplicant || 'Not Applicable') + '\nFORM_OWNER: ' + (currentOwner || applicantName) + '\nFORM_BANK: ' + bankName + '\nFORM_PROPERTY: ' + propertyAddress + '\nApplicant from form ALWAYS wins\n==='

        // ============================================================
        // STEP 1: Extract facts
        // ============================================================
        const s1content: any[] = [...imgs, { type: 'text', text: FORM + '\n\n' + GT + '\n\nExtract ALL facts from these documents. ' + (propertyAddress ? 'Subject property: ' + propertyAddress : '') + '\nCase type: ' + caseType }]
        const s1 = await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 6000, system: STEP1_SYS, messages: [{ role: 'user', content: s1content }] })
        const facts = s1.content[0].type === 'text' ? s1.content[0].text : ''

        // ============================================================
        // STEP 2: Deep legal analysis
        // ============================================================
        const s2 = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, system: getStep2Sys(caseType), messages: [{ role: 'user', content: FORM + '\n\n' + GT + '\n\nEXTRACTED FACTS:\n' + facts }] })
        const analysis = s2.content[0].type === 'text' ? s2.content[0].text : ''
        const meta = parseMetaSection(analysis)
        const verdict = extractVerdict(analysis)

        // ============================================================
        // STEP 3A-D: Parallel HTML generation
        // ============================================================
        const ctx = FORM + '\n\n' + GT + '\n\nANALYSIS:\n' + analysis.substring(0, 3000)
        const [r3a, r3b, r3c, r3d] = await Promise.all([
            client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: STEP3A_SYS, messages: [{ role: 'user', content: ctx }] }),
            client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 3000, system: STEP3B_SYS, messages: [{ role: 'user', content: ctx }] }),
            client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 5000, system: STEP3C_SYS, messages: [{ role: 'user', content: ctx }] }),
            client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: STEP3D_SYS, messages: [{ role: 'user', content: 'CASE: ' + caseType + '\nAPPLICANT: ' + (meta.applicant || applicantName) + '\nOWNER: ' + (meta.currentOwner || currentOwner) + '\nBANK: ' + bankName + '\n\n' + ctx }] })
        ])

        const html = buildHtml({
            refNo, appId, today, bankName, loanType: loanMap[caseType] || loanType,
            applicant: meta.applicant || applicantName, coApp: meta.coApplicant || coApplicant,
            propDesc: meta.propertyDescription || propertyAddress, propBounds: meta.propertyBoundaries,
            owner: meta.currentOwner || currentOwner,
            part1: r3a.content[0].type === 'text' ? r3a.content[0].text : '',
            part2: r3b.content[0].type === 'text' ? r3b.content[0].text : '',
            part3: r3c.content[0].type === 'text' ? r3c.content[0].text : '',
            part4: r3d.content[0].type === 'text' ? r3d.content[0].text : '',
            ecRows, lifecycle
        })

        if (userId && supabaseAdmin) {
            try {
                await supabaseAdmin.from('reports').insert({ user_id: userId, case_type: caseType, applicant_name: meta.applicant || applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: meta.propertyDescription || propertyAddress || 'Unknown', app_id: appId || refNo, verdict, report_html: html })
            } catch (e) { console.log('DB err:', e) }
        }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle, ecRows, ecMeta })

    } catch (e: any) {
        console.error('Pipeline error:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}