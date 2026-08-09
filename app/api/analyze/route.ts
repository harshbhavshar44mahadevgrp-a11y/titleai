// TITLEMATRIXAI FINAL v6 — PERFECT REPORT ENGINE
// Based on proven v5.3 + EC Pre-Screen + DocType Support
// 300 is this plan's hard ceiling — 800 was tried and the deploy was rejected at the
// "Deploying outputs" stage even though the build itself passed. So the pipeline has to FIT in
// 300s rather than ask for more: see the compact fact-sweep below, which is what a 14-file job
// was overrunning on.
export const maxDuration = 300
export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const AI = new Anthropic()
const DB = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null

// ================================================================
// EC LIFECYCLE ENGINE — PERMANENT RELEASE DETECTION
// ================================================================
// raw_type / match_conf are the two fields the master spec §4.7 requires ALONGSIDE the
// classified "Type of Document" — the text exactly as printed, and how the classification was
// reached. They supplement the classified type, they never replace it.
interface ECRow { row_number: number; col1_type: string; col2_property?: string; col3_aapnar: string; col4_lenar: string; col5_date: string; col6_deed_no: string; raw_type?: string; match_conf?: string }
interface Charge { lender: string; deed_no: string; date: string; release_deed_no: string; release_date: string }
interface LC { active: Charge[]; released: Charge[]; status: string; summary: string }
interface ECMeta { ec_app_number: string; ec_date: string; ec_from: string; ec_to: string }

function isBank(n: string): boolean {
    if (!n || n.length < 2) return false
    const t = n.toLowerCase()
    return ['bank', 'finance', 'financial', 'housing', 'capital', 'credit', 'hdfc', 'sbi', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'boi', 'canara', 'bajaj', 'lic', 'lichfl', 'gruh', 'aavas', 'piramal', 'limited', 'ltd', 'nbfc', 'hfc'].some(w => t.includes(w))
}
function buildLC(a: Charge[], r: Charge[]): LC {
    const s = a.length > 0 ? 'ENCUMBERED' : r.length > 0 ? 'CLEAR WITH PRIOR RELEASE' : 'CLEAR'
    const sum = a.length === 0 && r.length === 0 ? 'NIL encumbrance' : a.length > 0 ? 'ACTIVE: ' + a.map(x => x.lender + ' Deed:' + x.deed_no).join(' | ') : 'DISCHARGED: ' + r.map(x => x.lender + ' released vide Deed No.' + x.release_deed_no + ' dated ' + x.release_date).join(' | ')
    return { active: a, released: r, status: s, summary: sum }
}
function runLC(rows: ECRow[]): LC {
    const active: Charge[] = [], released: Charge[] = []
    for (const r of rows) if (isBank(r.col4_lenar) && !isBank(r.col3_aapnar)) active.push({ lender: r.col4_lenar, deed_no: r.col6_deed_no || '', date: r.col5_date || '', release_deed_no: '', release_date: '' })
    const RKW = ['release', 'reconveyance', 'discharge', 'satisfaction', 'no due', 'giro mukeli', 'ga.f', 'ga.mu', 'ga.o', 'mukeli', 'giro fer']
    for (const r of rows) {
        const c1 = (r.col1_type || '').toLowerCase()
        const S1 = RKW.some(k => c1.includes(k))
        const S2 = isBank(r.col3_aapnar) && !isBank(r.col4_lenar)
        if (S1 || S2) {
            const bn = isBank(r.col3_aapnar) ? r.col3_aapnar : isBank(r.col4_lenar) ? r.col4_lenar : r.col3_aapnar
            if (!bn) continue
            const bw = bn.toLowerCase().split(' ').filter((w: string) => w.length > 3)
            const mi = active.findIndex((a: Charge) => bw.some((w: string) => a.lender.toLowerCase().includes(w)))
            if (mi >= 0) { const m = active.splice(mi, 1)[0]; m.release_deed_no = r.col6_deed_no || ''; m.release_date = r.col5_date || ''; released.push(m); console.log('RELEASE:' + bn + ' Deed:' + m.release_deed_no) }
            else released.push({ lender: bn, deed_no: '', date: '', release_deed_no: r.col6_deed_no || '', release_date: r.col5_date || '' })
        }
    }
    return buildLC(active, released)
}

function parseJSON(raw: string): any { try { const c = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(); const f = c.indexOf('{'); const l = c.lastIndexOf('}'); if (f >= 0 && l >= 0) return JSON.parse(c.substring(f, l + 1)); return JSON.parse(c) } catch { return null } }

// ================================================================
// CANONICAL BILINGUAL DOCUMENT-TYPE TAXONOMY (master spec §8)
// ================================================================
// Single source of truth for Agent-1 style document-type matching. The classifier may output
// ONLY a type from this list; a term that matches nothing here must be flagged, never silently
// mapped to the nearest-sounding entry.
const TAXONOMY = `Sale Deed / વેચાણ દસ્તાવેજ | Absolute Sale Deed / સંપૂર્ણ વેચાણખત | Conveyance Deed / હસ્તાંતરણ દસ્તાવેજ | Gift Deed / બક્ષિસખત | Release Deed / મુક્તિખત | Relinquishment Deed / હક ત્યાગખત | Partition Deed / ભાગલા દસ્તાવેજ | Family Settlement Deed / કુટુંબ સમાધાન દસ્તાવેજ | Exchange Deed / અદલાબદલી દસ્તાવેજ | Mortgage Deed / ગીરો દસ્તાવેજ | Simple Mortgage / સાદો ગીરો દસ્તાવેજ | Equitable Mortgage / સમન્યાયી ગીરો | Mortgage Release Deed / ગીરો મુક્તિખત | Reconveyance Deed / પુનઃ હસ્તાંતરણ દસ્તાવેજ | Lease Deed / ભાડાપટ્ટા દસ્તાવેજ | Leave & License / ઉપયોગ પરવાનગી કરાર | Rent Agreement / ભાડા કરાર | Development Agreement / વિકાસ કરાર | JDA / સંયુક્ત વિકાસ કરાર | Agreement to Sell / વેચાણ કરાર | Banakhat / બનાખત | POA / મુખત્યારનામું | GPA / સામાન્ય મુખત્યારનામું | SPA / વિશેષ મુખત્યારનામું | Revocation of POA / મુખત્યારનામું રદ કરવાનું દસ્તાવેજ | Will / વસિયતનામું | Probate / વસિયત પ્રમાણપત્ર | Succession Certificate / વારસાઈ પ્રમાણપત્ર | Legal Heir Certificate / વારસદાર પ્રમાણપત્ર | Affidavit / સોગંદનામું | Declaration Deed / જાહેરનામું | Indemnity Bond / વળતર બાંહેધરી | Rectification Deed / સુધારા દસ્તાવેજ | Confirmation Deed / પુષ્ટિ દસ્તાવેજ | Cancellation Deed / રદબાતલ દસ્તાવેજ | Settlement Deed / સમાધાન દસ્તાવેજ | Trust Deed / ટ્રસ્ટ દસ્તાવેજ | Partnership Deed / ભાગીદારી દસ્તાવેજ | Deed of Admission / પ્રવેશ દસ્તાવેજ | Deed of Retirement / નિવૃત્તિ દસ્તાવેજ | Deed of Dissolution / વિસર્જન દસ્તાવેજ | Lis Pendens / લિસ પેન્ડન્સી`

// §4.6 — the ONLY permitted document-type match-confidence values. Anything else the model
// returns is honestly reported as UNIDENTIFIED rather than dressed up as a confident read.
// Returns '' when the classifier stated nothing — which is NOT the same as it saying the type is
// unidentifiable. Collapsing the two would flag every row as unidentifiable whenever the field is
// simply absent from the JSON.
const MATCH_TIERS = ['EXACT MATCH', 'SYNONYM MATCH', 'CONTEXTUAL MATCH', 'UNIDENTIFIED']
const normMatchConf = (c: string): string => {
    const u = String(c || '').toUpperCase().trim()
    return MATCH_TIERS.find(t => u.includes(t.split(' ')[0])) || ''
}

// §8 — EC entries must be presented chronologically, earliest to most recent. Dates arrive as
// DD/MM/YYYY, DD-MM-YYYY or DD.MM.YYYY. An unreadable date sorts last instead of being dropped.
function ecDateKey(d: string): number {
    const m = String(d || '').match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
    if (!m) return Number.MAX_SAFE_INTEGER
    const yy = Number(m[3])
    const y = m[3].length === 2 ? (yy <= 30 ? 2000 + yy : 1900 + yy) : yy
    return y * 10000 + Number(m[2]) * 100 + Number(m[1])
}

// §5 / §17.11 — "Paiki" is always rendered "out of" IN PROPERTY DESCRIPTIONS. Deliberately NOT
// applied to the Part IV narrative, where the firm's gold-standard chain keeps the source
// wording ("14366 Sq. Mtrs. paiki 4788.66 Sq. Mtrs.") verbatim.
const paikiOut = (s: string) => String(s == null ? '' : s).replace(/\bpaiki\b/gi, 'out of')

// ================================================================
// EC TABLE HTML BUILDER
// ================================================================
function buildECTable(rows: ECRow[], lc: LC, metas: ECMeta[]): string {
    if (!rows.length) return '<p style="color:#888;font-size:12px;">No EC entries found.</p>'
    // §8 — chronological, earliest to most recent (the extraction order is page order, not date order).
    const ordered = [...rows].sort((a, b) => ecDateKey(a.col5_date) - ecDateKey(b.col5_date))
    let h = '<table class="ec-tbl"><tr><th>Sr.</th><th>Type as Printed (Raw)</th><th>Classified Type</th><th>Match Confidence</th><th>Deed No.</th><th>Date</th><th>Col 3 — Aapnar (Executing)</th><th>Col 4 — Lenar (Claimant)</th><th>Status</th></tr>'
    ordered.forEach((r, i) => {
        const isRel = lc.released.some(x => x.release_deed_no === r.col6_deed_no) || (isBank(r.col3_aapnar) && !isBank(r.col4_lenar))
        const isAct = lc.active.some(x => x.deed_no === r.col6_deed_no)
        const cls = isRel ? 'ec-rel' : isAct ? 'ec-act' : ''
        const st = isRel ? '✅ DISCHARGED — Released and extinguished. No subsisting charge.' : isAct ? '⚠ ACTIVE MORTGAGE — Subsisting as on date. No Release Deed found.' : '✅ TITLE DOCUMENT — No encumbrance.'
        // §4.5 failure protocol: an unmatched type is flagged honestly, never mapped to the
        // nearest-sounding taxonomy entry. §4.6: only the four permitted tiers may appear here.
        const raw = r.raw_type || r.col1_type || ''
        const stated = normMatchConf(r.match_conf || '')
        const unmatched = !r.col1_type || stated === 'UNIDENTIFIED'
        // Release/mortgage is settled by EC column position + the prior mortgage in the same EC —
        // that is precisely §4.6's CONTEXTUAL MATCH, not a literal reading of the printed text.
        const ct = isRel ? 'Reconveyance / Mortgage Release Deed'
            : isAct ? 'Mortgage Deed'
                : unmatched ? 'DOCUMENT TYPE NOT IDENTIFIABLE — RAW TEXT: ' + (raw || '(blank)') + ' — REQUIRES MANUAL REVIEW'
                    : r.col1_type
        const conf = (isRel || isAct) ? 'CONTEXTUAL MATCH — derived from EC column position (judgment call, verify)'
            : unmatched ? 'UNIDENTIFIED'
                : stated ? (stated + (stated === 'CONTEXTUAL MATCH' ? ' — judgment call, verify' : ''))
                    : 'NOT STATED BY CLASSIFIER — REQUIRES MANUAL REVIEW'
        h += '<tr><td>' + (i + 1) + '</td><td>' + (raw || '--') + '</td><td>' + ct + '</td><td>' + conf + '</td><td>' + (r.col6_deed_no || '--') + '</td><td>' + (r.col5_date || '--') + '</td><td>' + (r.col3_aapnar || '--') + '</td><td>' + (r.col4_lenar || '--') + '</td><td class="' + cls + '">' + st + '</td></tr>'
    })
    return h + '</table>'
}

function buildLifecycleSection(lc: LC): string {
    const actRow = lc.active.length === 0 ? 'NIL' : lc.active.map(a => a.lender + ' — Mortgage Deed No. ' + a.deed_no + ' dated ' + a.date + ' — ACTIVE AND SUBSISTING.').join('<br>')
    const relRow = lc.released.length === 0 ? 'NIL' : lc.released.map(r => r.lender + ' — Mortgage Deed No. ' + r.deed_no + ' dated ' + r.date + ' — DISCHARGED vide Reconveyance / Release Deed No. ' + r.release_deed_no + ' dated ' + r.release_date + '. No subsisting charge remains.').join('<br>')
    return '<table class="mt"><tr><td>A. Active Mortgages</td><td>:</td><td>' + actRow + '</td></tr><tr><td>B. Released Mortgages</td><td>:</td><td>' + relRow + '</td></tr><tr><td>C. Unmatched Releases</td><td>:</td><td>NIL</td></tr><tr><td>D. Overall Encumbrance Status</td><td>:</td><td><strong>' + lc.status + '</strong> — ' + lc.summary + '</td></tr></table>'
}

// ================================================================
// CSS
// ================================================================
const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Georgia','Times New Roman',serif;font-size:13px;line-height:1.9;color:#1a1a1a;max-width:920px;margin:0 auto;padding:48px 60px}.hdr{border-bottom:3px solid #1B3A6B;padding-bottom:18px;margin-bottom:18px;display:flex;justify-content:space-between}.firm{font-size:22px;font-weight:bold;color:#1B3A6B}.sub{font-size:11px;color:#555;margin-top:2px}.hdr-right{text-align:right;font-size:12px;line-height:2}.rtitle{font-size:14px;font-weight:bold;text-align:center;text-decoration:underline;text-transform:uppercase;margin:16px 0 4px}hr{border:none;border-top:1px solid #ccc;margin:16px 0}.ph{font-size:12px;font-weight:bold;text-transform:uppercase;margin:22px 0 10px;background:#1B3A6B;color:#fff;padding:7px 14px}.sph{font-size:12px;font-weight:bold;color:#1B3A6B;margin:14px 0 6px;border-left:4px solid #1B3A6B;padding-left:10px;text-transform:uppercase}.mt{width:100%;margin-bottom:10px;border-collapse:collapse}.mt td{font-size:12px;padding:5px 4px;vertical-align:top;border-bottom:1px solid #f0f0f0}.mt td:first-child{width:260px;color:#555}.mt td:nth-child(2){width:14px}.mt td:last-child{font-weight:500}p{margin-bottom:10px;text-align:justify}.prop-para{background:#f7f9fc;border-left:4px solid #1B3A6B;padding:12px 16px;margin:10px 0 14px;font-style:italic}.di{margin-bottom:16px;padding-bottom:12px;border-bottom:1px dotted #ddd}.dn{font-weight:bold}.ib{margin-bottom:18px;padding:12px 16px;border-left:4px solid #e5e7eb;background:#fafafa}.sh{display:inline-block;background:#b91c1c;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sm{display:inline-block;background:#b45309;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.sl{display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:bold;padding:2px 10px;margin-bottom:6px}.it{font-weight:bold;font-size:13px;margin-bottom:6px}.sg{font-weight:bold;font-style:italic;color:#1B3A6B}ol,ul{padding-left:22px;margin-bottom:10px}ol li,ul li{margin-bottom:8px}ul.chain{padding-left:20px;margin:10px 0}ul.chain li{margin-bottom:10px;text-align:justify;line-height:1.9}table.ec-tbl{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px}table.ec-tbl th{background:#1B3A6B;color:#fff;padding:6px 8px;text-align:left;font-size:10px}table.ec-tbl td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}table.ec-tbl tr:nth-child(even){background:#f7f9fc}.ec-rel{color:#15803d;font-weight:bold}.ec-act{color:#b91c1c;font-weight:bold}.vc{margin-top:20px;padding:14px 18px;border:2px solid #15803d;background:#f0fdf4}.vs{margin-top:20px;padding:14px 18px;border:2px solid #b45309;background:#fffbeb}.vnc{margin-top:20px;padding:14px 18px;border:2px solid #b91c1c;background:#fff5f5}.vt{font-size:13px;font-weight:bold;text-transform:uppercase;margin-bottom:6px}.final-rec{margin-top:22px;padding:18px 22px;border:3px solid #1B3A6B;background:#EFF3FB}.fr-title{font-size:11px;font-weight:bold;color:#1B3A6B;margin-bottom:8px;text-transform:uppercase}.fr-value{font-size:16px;font-weight:bold;color:#1B3A6B}.sigrow{margin-top:50px;display:flex;justify-content:space-between}.sigbox{text-align:center}.sigline{width:200px;border-bottom:1px solid #1a1a1a;margin:0 auto 6px;height:40px}.ftr{margin-top:36px;border-top:1px solid #ccc;padding-top:14px;font-size:11px;color:#666;text-align:center}.disc{margin-top:10px;font-size:10px;color:#999;text-align:justify}.wm{font-size:10px;color:#bbb;text-align:center;margin-top:8px;letter-spacing:2px;text-transform:uppercase}@media print{body{padding:30px 40px}.ib{page-break-inside:avoid}}`

function buildReport(refNo: string, appId: string, today: string, bankName: string, loanType: string, body: string): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Legal Scrutiny Report</title><style>' + CSS + '</style></head><body><div class="hdr"><div><div class="firm">TITLEMATRIXAI</div><div class="sub">ADVOCATES, TITLE SEARCH &amp; LEGAL SCRUTINY CONSULTANTS</div><div class="sub">Panel Legal Counsel — Mortgage, Banking &amp; Real Estate Transactions</div><div class="sub">support@titlematrixai.com | www.titlematrixai.com</div></div><div class="hdr-right"><div><strong>Reference No.:</strong> ' + refNo + '</div><div><strong>Application ID:</strong> ' + appId + '</div><div><strong>Report Date:</strong> ' + today + '</div><div><strong>Bank:</strong> ' + bankName + '</div></div></div><div class="rtitle">LEGAL SCRUTINY REPORT — ' + loanType + '</div><hr>' + body + '<hr><div class="sigrow"><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">TITLEMATRIXAI</div><div style="font-size:10px;color:#666;">Date: ' + today + '</div></div><div class="sigbox"><div class="sigline"></div><div style="font-size:11px;font-weight:bold;">Authorised Signatory</div><div style="font-size:10px;color:#666;">' + bankName + '</div></div></div><div class="ftr">Generated by TITLEMATRIXAI | support@titlematrixai.com<div class="disc">DISCLAIMER: This Report is prepared exclusively for ' + bankName + ' for Application ID ' + appId + '. Based solely on documents produced. Does not constitute a guarantee of title.</div><div class="wm">TITLEMATRIXAI — CONFIDENTIAL — FOR BANK USE ONLY</div></div></body></html>'
}

function parseMeta(t: string) { const b = t.match(/---META---\s*([\s\S]*?)---END META---/i)?.[1] || ''; const g = (k: string) => b.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi'))?.[1]?.trim() || ''; return { applicant: g('APPLICANT'), applicantAddress: g('APPLICANT_ADDRESS'), coApplicant: g('CO_APPLICANT'), coApplicantAddress: g('CO_APPLICANT_ADDRESS'), mortgagor: g('MORTGAGOR'), mortgagorAddress: g('MORTGAGOR_ADDRESS'), propertyDescription: g('PROPERTY_DESCRIPTION'), propertyBoundaries: g('PROPERTY_BOUNDARIES'), currentOwner: g('CURRENT_OWNER'), constitution: g('CONSTITUTION'), modeOfAcquisition: g('MODE_OF_ACQUISITION'), registrationDetails: g('REGISTRATION_DETAILS') } }

// Internal verdict CODES stay exactly as they were — the dashboard, reports list and the
// `reports.verdict` column all filter on 'CLEAR' / 'CLEAR SUBJECT TO' / 'NOT CLEAR' / 'PENDING'.
// The master spec's wording is applied at RENDER time via VERDICT_LABEL, so Part IX reads exactly
// as the spec requires without breaking a single existing consumer.
function extractVerdict(t: string): string { const u = t.toUpperCase(); if (u.includes('TITLE NOT CLEAR') || u.includes('NOT CLEAR')) return 'NOT CLEAR'; if (u.includes('CLEAR SUBJECT TO')) return 'CLEAR SUBJECT TO'; if (u.includes('VERDICT: CLEAR')) return 'CLEAR'; return 'PENDING' }

// §12 PART IX offers exactly two recommendations. §1's Title Certification Rule supplies the
// third outcome — where ownership, continuity, encumbrance, revenue reconciliation and
// mortgageability are NOT all established, the report must not certify at all.
const VERDICT_LABEL: Record<string, string> = {
    'CLEAR': 'CLEAR AND MARKETABLE TITLE',
    'CLEAR SUBJECT TO': 'CLEAR TITLE SUBJECT TO CONDITIONS',
    'NOT CLEAR': 'INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION',
    'PENDING': 'INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION',
}

// §1 — "Never certify title continuity if documentary support is missing" and "certify title only
// when ownership, title continuity, encumbrances, revenue reconciliation and mortgageability are
// ALL established." A subsisting mortgage means encumbrances are NOT established, so a full
// clear-title certificate is refused HERE, in code — a prompt instruction alone can drift.
function gateVerdict(v: string, lc: LC): string {
    if (v === 'CLEAR' && lc.active.length > 0) {
        console.log('VERDICT GATE: CLEAR downgraded to CLEAR SUBJECT TO — ' + lc.active.length + ' subsisting charge(s)')
        return 'CLEAR SUBJECT TO'
    }
    return v
}

// House terminology, enforced in CODE (not just asked for in a prompt) so it can never drift:
//   • "registered under" — never "registered vide"
//   • "were entered" — never "have been entered"
// NOTE: "paiki" is deliberately NOT rewritten. The firm's gold-standard chain example keeps it
// verbatim ("14366 Sq. Mtrs. paiki 4788.66 Sq. Mtrs."), so the example — which is the authority
// on the house format — governs over the earlier paiki->"out of" instruction.
function normTerms(s: string): string {
    return String(s == null ? '' : s)
        .replace(/\bregistered\s+vide\b/gi, 'registered under')
        .replace(/\bhave\s+been\s+entered\b/gi, 'were entered')
}

// ================================================================
// SUBJECT-UNIT FILTER
// ================================================================
// A scheme holds many units and the revenue records carry a mutation entry for each sale of
// each one. Only the subject unit's own history (plus the land beneath the scheme) belongs in
// this report — a bullet about "Unit No. 8" or "Flat No. 301" is somebody else's property.
// Prompt rules alone were not enough, so the exclusion is done here, in code.
const UNIT_RE = /\b(?:Flat|Unit|Shop|Office|Premises|Villa|Tenement)\s*No\.?\s*([A-Za-z]?-?\s?\d+[A-Za-z]?)/gi
const unitKey = (s: string) => String(s || '').replace(/[^0-9a-z]/gi, '').toLowerCase()

// Pull the subject unit identifier (e.g. "203" out of "Flat No. 203, Second Floor, Block E").
function subjectUnitNo(desc: string): string {
    const m = new RegExp(UNIT_RE.source, 'i').exec(String(desc || ''))
    return m ? m[1].replace(/\s+/g, '') : ''
}

// True when a passage names one or more units but NONE of them is the subject unit — i.e. it is
// about another flat in the same scheme. Land-level text (which names no unit at all) is kept.
function aboutAnotherUnit(text: string, subjUnit: string): boolean {
    if (!subjUnit) return false
    const re = new RegExp(UNIT_RE.source, 'gi')
    const want = unitKey(subjUnit)
    let m: RegExpExecArray | null, named = false, isSubject = false
    while ((m = re.exec(String(text || ''))) !== null) {
        named = true
        if (unitKey(m[1]) === want) isSubject = true
    }
    return named && !isSubject
}

// ================================================================
// STEP 1 SYSTEM — PROVEN v5.3 EXTRACTION ENGINE
// ================================================================
const S1 = `You are a Senior Gujarat Property Law Expert. Extract ALL raw facts from documents accurately.

LANGUAGE RULE — ABSOLUTE, NO EXCEPTIONS:
Write EVERYTHING in formal English only. NEVER write any word, phrase, name, or text in Gujarati script anywhere in your output. If a document shows text in Gujarati (e.g. village name, owner name, land use, tenure, entry nature), write it in English transliteration or English translation only. Examples: 'Bin Kheti' not 'બિન ખેતી', 'Koba' not 'કોબા', 'Gandhinagar' not 'ગાંધીનગર'. This applies to every single field you extract — no Gujarati script whatsoever.

NEVER "AND OTHERS" — every person named individually.
APPLICANT = from AoS/Draft Sale Deed Buyer section ONLY. NEVER from stamp paper.
CURRENT OWNER = from latest submitted deed.

ADDRESSES — MANDATORY EXTRACTION (needed for Part I of the report):
Extract the FULL POSTAL ADDRESS of: (a) each Borrower/Applicant (proposed purchaser), (b) each
Co-Borrower/Co-Applicant, and (c) the Mortgagor. Take them from the address block of the
Draft Sale Deed / Agreement for Sale / Banakhat / Allotment Letter, or from any KYC or deed
recital that states the party's residential address. If an address genuinely does not appear in
any produced document, write exactly "NOT PROVIDED FOR VERIFICATION" — never invent one and
never substitute the property address for a party's residential address.
MORTGAGOR = the person who will create the mortgage. In a purchase case that is the
Applicant/Purchaser; in a LAP / Balance Transfer / Seller-BT case it is the existing owner of
the property. State who it is and why in one short line.

BOUNDARIES — SOURCE RULE: take the four boundaries from the LATEST provided deed. In a BUILDER
PURCHASE case take them instead from the Allotment Letter / Agreement for Sale / Draft Sale Deed
executed in favour of the proposed purchaser.

DOCUMENT-TYPE NAMING — use ONLY these canonical English names (bilingual reference):
${TAXONOMY}
Record the document's heading EXACTLY as printed as well. If a document's type matches nothing in
the list above, do NOT map it to the nearest-sounding entry — report it as
"DOCUMENT TYPE NOT IDENTIFIABLE — RAW TEXT: [exact printed text] — REQUIRES MANUAL REVIEW".
Disambiguation you must apply: Sale Deed vs Agreement to Sell/Banakhat (completed conveyance vs
promise of future sale); Gift vs Relinquishment vs Family Settlement (voluntary transfer without
consideration vs co-owner giving up own share vs multilateral family arrangement); Release vs
Reconveyance/Mortgage Release (generic release of a right vs restoration of title after the loan
is repaid — if a Mortgage Deed on the same survey number appears earlier, it is a Reconveyance);
Mortgage Deed vs Simple vs Equitable (use the generic name unless the text itself says Simple or
Equitable); POA vs GPA vs SPA (use GPA/SPA only when the text says General/Special); Partition vs
Family Settlement (one jointly-owned property vs broader or dispute-driven arrangement).
Where two remain equally plausible, choose the BROADER category and flag it for manual review —
never guess the subtype.

ABSOLUTE — THE LISTS BELOW ARE THINGS TO LOOK FOR, NOT THINGS TO REPORT:
The checklists that follow (and the document-type names above) tell you WHAT TO SEARCH THE PAGES
FOR. They are NOT a list of documents in this case. Write a line about an item ONLY if you can
actually see it on an uploaded page. If an item is not there, say NOTHING about it — do not write
"not found", "not available" or "not provided", because a later stage reads your output as the
list of what exists. Never let a checklist item become a fact.

LITIGATION / ENTITY / BUILDER SIGNALS — extract ONLY if actually visible on a page:
- Court case, stay order, injunction, attachment, acquisition, SARFAESI, DRT, NCLT proceeding,
  revenue appeal (RTS), mutation dispute, family dispute, partition suit, specific performance suit.
- Where an owner is a company/firm: CIN, director/authorised signatory, board resolution, charge,
  charge satisfaction, CERSAI, liquidation or strike-off status.
- Builder project: Development Agreement, RERA registration, development permission, commencement
  certificate, approved building plan, occupancy/completion certificate, BU permission, society
  registration, conveyance to society, share certificate.

EC COLUMN MAPPING — PERMANENT CRITICAL RULE:
LEFT COLUMN = Aapnar = SELLER/EXECUTOR = WHO GIVES THE DEED
RIGHT COLUMN = Lenar = BUYER/CLAIMANT = WHO TAKES THE DEED

EC RELEASE DETECTION — MOST CRITICAL:
IF BANK in LEFT COLUMN (Aapnar) = RELEASE DEED (bank releasing mortgage back)
IF BANK in RIGHT COLUMN (Lenar) = MORTGAGE DEED (bank receiving mortgage)
Gujarati: ga.fa./ga.mu.fa./ga.o.fa./giro mukeli/giro fer = Mortgage Release Deed

RULE 17 — MORTGAGE RELEASE:
Before marking mortgage ACTIVE — check ALL docs for:
Release Deed / Giro Mukeli / Reconveyance / NOC / Discharge
Bank in LEFT EC column = RELEASED — NEVER report as active

ALL 4 BOUNDARIES MANDATORY. Check every page including Gujarati "Khunt Charne Vigat".
EC RULE 4A: Count ALL entries. EVERY entry matters. NEVER miss second or subsequent entry. (This is for encumbrance verification only — EC is NOT used to build the chain.)
RULE 30 (REVISED): If a transaction's actual deed copy was not submitted but it is confirmed by Revenue Record (Mutation/FERFAR entry) — include it naturally in the chain using the Revenue Record details, NO flag as missing. Do NOT use EC entries for this purpose — only Revenue Record / Mutation entries may fill a chain link when the deed itself is absent.
MUTATION ENTRIES: NEVER in the property description — only in the chronological title chain narration.

20-25 YEAR TITLE HISTORY — MANDATORY DEEP SEARCH:
Do NOT limit extraction to only the EC search period (e.g., if EC covers 2011-2026, do not stop there).
ACTIVELY SEARCH every document for evidence of OLDER ownership history, including:
- Old Survey Numbers referenced in any deed (e.g. "allotted in lieu of Survey No. 59/2, 60, 61, 62")
- 7/12 (Satbara) / Village Form No. 7, 8-A, 12 extracts — these often show decades of mutation history
- FERFAR / Mutation Register / Gamnamuna No. 6 entries — extract EVERY entry visible, however old
- References inside any deed to "earlier owner", "ancestral property", "inherited from", "original allottee"
- Any NA Order, Conversion Order, or T.P. Scheme allotment document — these typically reference the ORIGINAL agricultural survey number and original landholder before the scheme was formed
- Partnership Deed clauses referencing how/when the firm acquired the land
- Any document mentioning "Old Tenure" / "Juni Sharat" / "Ganot" history

If a document references an OLDER survey number or an EARLIER transaction not shown in the EC period, EXTRACT IT — note the source document and approximate or exact date.
Goal: reconstruct title history covering AT LEAST 20-25 years (ideally 30 years) wherever the documents allow it, not merely the EC search window.
If genuinely no document references anything before the earliest EC entry, state that clearly — but only after confirming no such reference exists anywhere in the submitted documents.`

// ================================================================
// STEP 2 SYSTEMS — CASE SPECIFIC
// ================================================================
// §2 — every case type carries its own mandatory rules once selected. Kept as one compact block
// per type rather than a module system: same effect, nothing to maintain.
const CASE_SOP: Record<string, string> = {
    builder_purchase: 'Builder Purchase: verify the BUILDER\'s own title to the land, the Development Agreement/JDA, RERA registration, development permission, commencement certificate, approved plans, BU/Occupancy Certificate and the project mortgage (and whether the subject unit is released from it). Boundaries come from the Allotment Letter / Agreement for Sale / Draft Sale Deed in favour of the proposed purchaser. If the Builder\'s name does not appear in the revenue record, raise it as a MAJOR OBJECTION. Confirm the subject unit is traceable in the sanctioned plan / RERA / allotment records.',
    resale: 'Resale Purchase: verify the seller\'s acquisition deed and its registration, an unbroken chain to the seller, the mutation entry recording the seller\'s name, that any earlier mortgage stands discharged, society/association NOC and share certificate where applicable, and up-to-date tax/maintenance receipts.',
    bt: 'Balance Transfer: verify the existing lender\'s charge, the list of original title deeds held by that lender, the outstanding/foreclosure position, and confirm the existing charge will be released on takeover. The prior mortgage must be shown as subsisting until a Release/Reconveyance is produced.',
    seller_bt: 'Seller Balance Transfer: the seller\'s existing loan is being cleared out of the sale consideration. Verify the seller\'s lender, the subsisting charge, the tripartite arrangement, and require the Release/Reconveyance and return of original deeds as a pre-disbursement condition.',
    lap: 'LAP / Mortgage: the borrower is the existing owner. Verify the owner\'s title and possession, all subsisting charges, that the property is free of prior equitable mortgage, and its SARFAESI enforceability.',
    self_construction: 'Self-Construction: verify plot title, approved building plan, commencement permission, NA order, and stage-wise construction compliance. Report the property as land plus proposed construction.',
    composite: 'Composite Loan: treat plot acquisition and construction as two limbs — verify plot title AND construction approvals, and state both in the opinion.',
    plot_purchase: 'Plot Purchase: verify the NA/Conversion order, Final Plot / T.P. Scheme allotment, layout approval, fragmentation-act compliance, and that the plot is not agricultural or restricted-tenure land.',
    industrial: 'Industrial Property: verify GIDC/industrial allotment terms, lease conditions, transfer permission from the allotting authority, land-use compliance and pollution/environment consents.',
    commercial: 'Commercial Property: verify commercial land-use permission, BU permission for commercial use, and any occupancy or trade restrictions in the scheme documents.',
    agricultural: 'Agricultural Property: verify Old/New Tenure (Juni/Naa Sharat), Section 43 restrictions, agriculturist status of the purchaser, Fragmentation Act compliance, Ganot/tenancy entries and any Collector permission required for transfer. Flag every restriction expressly.',
    leasehold: 'Leasehold Property: verify the Lease Deed, unexpired lease term, lessor\'s consent to mortgage, transfer/assignment clauses, renewal terms and ground-rent position. State that the security is leasehold, not freehold.',
    govt_allotted: 'Government Allotted Property: verify the allotment/grant order, its conditions, lock-in or non-transfer period, premium payment, regularisation order and the allotting authority\'s permission to mortgage.',
    inherited: 'Inherited Property: verify the death certificate, Will/Probate/Succession or Legal Heir Certificate, the family tree, the legal-heir mutation entry, and that EVERY heir has joined the transaction. A missing heir is a CRITICAL defect.',
    gift: 'Gift Property: verify the registered Gift Deed, acceptance by the donee, the donor\'s competence and title, whether the gift is conditional or revocable, and the mutation entry recording it.',
}

function getS2(ct: string): string {
    const base = `You are a Senior Gujarat Property Law Advocate with 30+ years of experience.
Prepare a complete Legal Scrutiny Report for a ${ct.replace(/_/g, ' ').toUpperCase()} case.

CASE-SPECIFIC MANDATORY RULES FOR THIS CASE TYPE:
${CASE_SOP[ct] || 'Apply the general title-verification SOP. Identify the case type from the documents produced and apply the rules proper to it.'}

MANDATORY META BLOCK FIRST:
---META---
APPLICANT: [PRIMARY proposed purchaser only — the FIRST named buyer from Draft/AoS Buyer section — NEVER from stamp paper. If two or more buyers are jointly named, put only the first one here and put the rest in CO_APPLICANT below — do not combine all names into this one field.]
APPLICANT_ADDRESS: [FULL postal address of the Applicant named above, taken from the address block of the Draft Sale Deed / Agreement for Sale / Banakhat / Allotment Letter or any deed recital stating it. If no produced document states it, write exactly "NOT PROVIDED FOR VERIFICATION". NEVER substitute the property address and NEVER invent one.]
CO_APPLICANT: [every OTHER named buyer besides the first, separated by " & " if more than one — e.g. if the AoS names two buyers jointly, the second buyer's full name goes here, NOT "N/A". Only write "Not Applicable" if there is genuinely a single named buyer with no joint applicant.]
CO_APPLICANT_ADDRESS: [FULL postal address of the Co-Applicant(s), same sourcing rule as APPLICANT_ADDRESS. "Not Applicable" if there is no co-applicant; "NOT PROVIDED FOR VERIFICATION" if there is one but no document states the address.]
MORTGAGOR: [the party who will CREATE the mortgage — in a purchase case (Builder Purchase / Resale / Plot Purchase) that is the Applicant/Purchaser; in LAP / Balance Transfer / Seller BT it is the existing owner of the property. Give the full name(s).]
MORTGAGOR_ADDRESS: [FULL postal address of the Mortgagor, same sourcing rule. "NOT PROVIDED FOR VERIFICATION" if no document states it.]
CURRENT_OWNER: [from latest deed — full name, and "a Partnership Firm"/"Pvt Ltd" etc if applicable]
CONSTITUTION: [This describes the BORROWER/APPLICANT(S) specifically — NOT the seller, NOT the developer, NOT the current owner. If the Applicant(s) are named natural persons (e.g. "Sunilkumar Rajendrabhai Patel"), Constitution = "Individual" — this applies even when there are two or more individual co-applicants. Only write "Partnership Firm" if the Applicant ITSELF is named as a firm (e.g. "M/s. XYZ, a Partnership Firm" is the actual buyer/borrower). Do not copy the seller's or developer's constitution here by mistake — check whose constitution this field is asking for every time.]
MODE_OF_ACQUISITION: [e.g. "Sale Deed" / "Registered Sale Deed" / "Allotment by Developer" — how Current Owner acquired the property]
REGISTRATION_DETAILS: [Document No. [X] | Dated: [DD-MM-YYYY] | SRO: [name] — of the deed by which Current Owner acquired title]
PROPERTY_DESCRIPTION: [MANDATORY EXACT PARAGRAPH FORMAT — a SINGLE compact paragraph carrying every area figure together. Fill every blank, do not paraphrase, do not shorten, do not split into sentences:
"Opinion on title and search in respect of immovable property bearing Flat/Unit/Shop/Plot/Sub Plot/Office No. [X] on [Nth] Floor having Carpet Area admeasuring [X] Sq. Mtrs., along with Balcony area admeasuring [X] Sq. Mtrs. and Wash area admeasuring [X] Sq. Mtrs. together with undivided proportionate share area admeasuring [X] Sq. Mtrs. in the scheme known as "[Scheme Name]" constructed over Non-Agricultural land bearing Final Plot No. [X] of T.P. Scheme No. [X] allotted in lieu of Revenue/Block/Survey/City Survey No. [X], situate lying and being at Mouje: [Village], Taluka: [Taluka], District [District]."
Keep only the unit word that actually applies (Flat / Unit / Shop / Plot / Sub Plot / Office) — delete the others.
If any individual area component (Balcony/Wash/UPS) is not applicable or not found in documents, omit that specific clause naturally rather than leaving a blank.
IN THIS FIELD ONLY, write "out of" wherever the source says "paiki" — e.g. "Survey No. 288 Paiki" becomes "Survey No. 288 out of". (In the Part IV narrative "paiki" is kept exactly as the source states it.)]
PROPERTY_BOUNDARIES: [East (Purva): | West (Pashchim): | North (Uttar): | South (Dakshin): — take them from the LATEST provided deed. In a BUILDER PURCHASE case take them from the Allotment Letter / Agreement for Sale / Draft Sale Deed executed in favour of the proposed purchaser instead. Check every document including annexures. All four are mandatory.]
---END META---

LANGUAGE RULE — ABSOLUTE, NO EXCEPTIONS:
Write EVERYTHING in formal English only. NEVER write any word, phrase, or text in Gujarati script anywhere in this report. Village names, owner names, land use terms, entry descriptions — everything must be in English only. Example: write 'Non-Agricultural (Bin Kheti)' not 'બિન ખેતી', write 'Koba' not 'કોબા'.

PERMANENT RULES — NEVER BREAK:
1. NEVER "and others" — every name individually always
2. Applicant = Buyer from Draft/AoS ONLY. Never from stamp paper.
3. ALL 4 boundaries mandatory — check every document including annexures
4. Part III (documents scrutinised) = chronological, earliest first | Part IV (title chain) = oldest first with "Thereafter,"
5. Mortgage Release / Giro Mukeli / Bank in LEFT EC column = DISCHARGED — NEVER report as active
6. EC Applicant name = COMPLETELY IGNORE. The EC's LAST column is never extracted and never mentioned.
7. NEVER mention loan amount
8. Dukan = Shop in English
9. NEVER list mutation entries in Part I or Part II — they belong only in the Part IV narration

NON-NEGOTIABLE PRINCIPLES (apply to everything you produce):
- Never assume facts. Never create facts. Never invent ownership, dates, survey numbers or legal events.
- Never certify title continuity where documentary support is missing. Never suppress an adverse finding.
- Keep these four apart and never blend them: VERIFIED FACTS (Part IV) | MISSING INFORMATION (Parts VII/VIII) | LEGAL ISSUES (Part V) | LEGAL CONCLUSIONS (Parts VI and IX).
- Confidence tiers, used exactly as named: MEDIUM CONFIDENCE = supported by a registered document AND a government record AND the EC AND the revenue record. LOW CONFIDENCE = supported by a single document only. NO CONFIDENCE = unsupported. There is no "HIGH" tier.
- TITLE CERTIFICATION RULE: certify title ONLY when ownership, title continuity, encumbrance position, revenue reconciliation and mortgageability are ALL established. If any one of them is not, the report must state exactly: INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION.
- Revenue entries are CORROBORATIVE evidence, never conclusive proof of title. Revenue records are not mandatory for reconstruction where other produced documents establish the position; equally, a certified mutation entry does not require a matching deed, nor a deed a matching mutation entry.

MANDATORY TERMINOLOGY AND DRAFTING STANDARD (SOP — apply to EVERY sentence you write):
- "paiki": in the PROPERTY_DESCRIPTION field write "out of". Everywhere else — the Part IV narrative — keep "paiki" EXACTLY as the source states it, e.g. "admeasuring 14366 Sq. Mtrs. paiki 4788.66 Sq. Mtrs." That is the firm's house wording in the narrative; do not translate or drop it there.
- Use "registered under" — NEVER "registered vide". e.g. "registered under Sr. No. 4521".
- Keep the phrase "unto and in favour of" exactly as-is.
- Use "were entered" — NEVER "have been entered".
- Keep units (Sq. Mtrs. / Hectares / Acres) EXACTLY as given in the documents — never convert.
- Third person, formal legal drafting language throughout.
- PRESERVE EVERY FACTUAL DETAIL EXACTLY: never alter dates, names, survey numbers, measurements, registration numbers, mutation numbers, authority names or project names. You may only improve grammar, structure and readability — never a fact.
- Standard transition phrases to use: "From the available revenue records and documents produced before me, it transpires that...", "Thereafter,...", "Subsequently,...", "Further, it transpires that...", "Upon verification of the available records,..."
- Write PROPERTY HISTORY, not document history. Never write a separate paragraph per uploaded document ("Sale Deed says... Mutation says... EC says..."). If a Sale Deed, a Mutation entry and an EC row all describe the SAME transfer, that is ONE ownership event and gets ONE paragraph.
- Cross-verification between documents is INTERNAL reasoning only — never clutter the narrative with it.

EC COLUMN RULE — PERMANENT:
LEFT/Aapnar = WHO GIVES | RIGHT/Lenar = WHO RECEIVES
BANK IN LEFT = RELEASE DEED | BANK IN RIGHT = MORTGAGE DEED

PART IV "THEREAFTER" RULE:
First paragraph = NO "Thereafter"
EVERY subsequent paragraph MUST start "Thereafter,"
RELEASED mortgage: "stands discharged vide Reconveyance/Release Deed No.[X] dated [date]"
ACTIVE mortgage: "is subsisting and active as on date — no Release Deed found"

TITLE CHAIN SOURCE — PERMANENT RULE — REVENUE RECORD ONLY, NEVER EC:
The chronological title chain (Part IV) MUST be constructed from Revenue Record data (7/12, Village Form 7/8-A/12, FERFAR/Mutation Register entries — see Revenue Record Ground Truth) and the actual registered deeds submitted (Sale Deed, Mortgage Deed, Release Deed, Declaration Deed, Partition Deed, etc).
The Encumbrance Certificate (EC) is NEVER the source for this chain. EC rows are used ONLY for encumbrance/mortgage status verification — they do not drive or anchor the historical narrative.
Gujarat banking practice requires a minimum 20-25 year (ideally 30 year) title chain. Build it using:
- Old/original Survey Numbers (pre-TP Scheme allotment) found in any deed or revenue record
- 7/12, Village Form 7/8-A/12, FERFAR/Mutation Register entries — every entry, even partial or old ones
- Registered deeds themselves (their recitals, dates, parties, consideration)
- Any deed recital mentioning prior ownership, inheritance, or earlier transactions
Start the chain from the EARLIEST point established by Revenue Record / deed evidence — not from any EC entry, not from the EC search window.
Only state "chain limited to documents produced" if you have genuinely found zero Revenue Record or deed references to anything earlier after checking all documents.
Construct the fullest, deepest, most complete chronological chain the Revenue Record and registered deeds support.

ENTRY COVERAGE: The Revenue Record Ground Truth lists the Mutation/FERFAR entries whose particulars are actually legible (number-only entries are already excluded). Walk through each of THOSE by Entry No. and Date — never compress several into a vague summary sentence. Do NOT invent or pad entries whose particulars were not legible, and never write filler such as "details not fully visible" — an entry with nothing to say does not belong in the history at all.

EC ANALYSIS FORMAT (exactly like this):
EC bearing E-Application No. [APP_NO] dated [DATE] for search period [FROM] to [TO] issued by Inspector General of Registration, Revenue Department, Government of Gujarat. [N] registered transactions found on row-by-row examination.

PART VI LEGAL OPINION (standard certifying language, to be used only when the title genuinely is clear):
"On perusal of the copies of documents referred to herein above, which I believe to be true and genuine and on examination of the entire chain of the documents and what is stated herein above, I do hereby certify that the right, title and interest of [CURRENT OWNER] in respect of the property described hereinabove are covered with all respective Title Deeds the above referred property is legal, clear, marketable, free from anomalies, valid and after the execution and registration of Sale Deed unto and in favour of [APPLICANT], He/She/They will have legal, clear, marketable, free from anomalies, valid and binding on the Mortgagor and a valid Registered Mortgage can be created, beyond reasonable doubt.
The said immovable property is enforceable under SARFAESI Act, and further no permission for creation of mortgage is required to be obtained from any government authority.
The property can be accepted by the way of SECURITY for the loan/advances granted or to be granted and a valid Equitable/Registered Mortgage can be created over the said property in favour of your bank."

MORTGAGEABILITY (Part VI): classify the property as exactly one of — Mortgageable / Conditionally Mortgageable / Not Mortgageable — and state the lending risk on the two permitted tiers: MODERATE or LOW. Keep the reasoning short and summarised, not exhaustive prose.

VERDICT: NOT CLEAR / CLEAR SUBJECT TO / CLEAR
USE ALL TOKENS. MISS NOTHING.`
    return base
}

// ================================================================
// STEP 3A — PART I SYSTEM
// ================================================================
const S3A = `Generate HTML for PART III ONLY — Description of Documents Verified / Scrutinized.
(Part I — Borrower, Mortgagor and Current Ownership — and Part II — Property Description with Boundaries — are generated separately and already appear before this. Start directly with Part III.)

═══ STRICT INPUT-DRIVEN RULE — THIS OVERRIDES EVERY OTHER CONVENIENCE DEFAULT ═══
- List ONLY documents that were ACTUALLY uploaded / produced for scrutiny. If one document was
  produced, the list has exactly one entry; if ten were produced, exactly ten.
- NEVER infer or add a document because it is "typically expected" in this kind of transaction.
  NEVER add RERA, EC, Property Card, Mutation Entries, NA Order, BU Permission or Development
  Permission unless that document was actually produced.
- If a document is absent, OMIT IT ENTIRELY — no placeholder, no "Not Available", no assumption
  of its existence.
- NEVER add remarks like "ILLEGIBLE", "NOT PROVIDED FOR VERIFICATION" or "BLANK".
- Do NOT mention E-Application Receipt / E-Challan details beyond the date and search period.
- If a registration number (or any other field) is unavailable, write exactly
  "Registration Number not available in the uploaded document" — NEVER fabricate it.
- Formal English, third person. No Gujarati script. NEVER "and others" — name every party.

═══ TERMINOLOGY (MANDATORY) ═══
- "registered under" — NEVER "registered vide".
- Keep the phrase "unto and in favour of" exactly.
- Keep "paiki" exactly as it appears in the source (house wording) — do not translate it.
- Keep units (Sq. Mtrs. / Hectares / Acres) exactly as given.
- Name each document by the type printed ON THAT DOCUMENT. Do not consult or reproduce any list of
  document types — a list of types is NOT a list of documents, and nothing may be added because it
  appears on such a list.

═══ EXACT TEMPLATES — use the one matching each uploaded document ═══
- Registered Deed: Copy of "[Document Type]" dated "[Execution Date]" registered under Serial No. "[Registration Number]" executed by "[Executant]" unto and in favour of "[Claimant]".
- Government Order: Copy of "[Order Type]" bearing No. "[Order Number]" dated "[Order Date]" issued by "[Authority Name]".
- Government Permission: Copy of "[Permission Type]" bearing No. "[Permission Number]" dated "[Permission Date]" issued by "[Authority Name]".
- Certificate: Copy of "[Certificate Type]" bearing No. "[Certificate Number]" dated "[Certificate Date]".
- RERA: Copy of Gujarat RERA Registration Certificate bearing Registration No. "[Registration Number]" dated "[Registration Date]".
- Encumbrance Certificate: Encumbrance Certificate dated "[EC Date]" covering the search period from "[From Year]" to "[To Year]".
- Revenue Record: Copy of Revenue Record pertaining to Survey No. "[Survey Number]".
- Property Card: Copy of Property Card pertaining to City Survey No. "[City Survey Number]".
- Mutation Entries: Computerized Mutation Entries for the Search Period.
- Notarized Document: Copy of Notarized "[Document Type]" dated "[Date]" executed by "[Party Name]".

FORMAT — one <div class="di"> per ACTUALLY-PRODUCED document, nothing more:
<div class="di"><p><span class="dn">1.</span> [the exact template sentence for that document]</p></div>

═══ COMPLETENESS — BOTH DIRECTIONS ARE FAILURES ═══
Before you output, count the documents in your context and count your <div class="di"> entries.
The two numbers MUST be equal.
- ADDING a document that was not produced is a fabricated fact. This is the worse failure.
- DROPPING a document that WAS produced is equally unacceptable — the bank relies on this list.
Every produced document gets EXACTLY ONE entry: not zero, not two. If two uploads are two pages
of the SAME instrument, that is one document. If a document's type or number is unclear, still
LIST IT and write "Registration Number not available in the uploaded document" — never omit it
because a field is missing, and never omit it because you are unsure what to call it.

ORDER: chronological — earliest document first, latest last. Never randomised. A document whose
date cannot be determined goes LAST — ordering must never cause a document to be dropped.

START: <hr><div class="ph">PART III — DESCRIPTION OF DOCUMENTS VERIFIED / SCRUTINIZED</div>
<p>The following documents have been produced for examination and scrutiny:</p>
END: after the last document entry.`

// ================================================================
// STEP 3B — PART IV — CHRONOLOGICAL TITLE CHAIN (house-format writer)
// ================================================================
// The firm's required chain format is a single flowing chronological narrative of PROPERTY
// history — an opening "belonged to" line, then one bullet per title-affecting event.
// Crucially the chain is NOT only Nondh entries: NA/Collector orders, NOCs, Development
// Permission, construction, project mortgage and finally the Builder→Purchaser document all
// appear as their own bullets, in date order, interleaved with the mutation bullets.
const S3B = `You are writing PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY, in the firm's mandatory house format.

LANGUAGE: Formal English, third person. NEVER Gujarati script. Dates ALWAYS as DD.MM.YYYY.

═══════════════════════════════════════════
THIS IS THE EXACT FORMAT — COPY ITS STRUCTURE AND PHRASING EXACTLY
(The names/numbers below are ONLY a worked example. Use the REAL data from your context.)
═══════════════════════════════════════════
<p>For the available documents and revenue records presented before me, it transpires that Prior to the year 1994, the agricultural land bearing Survey No. 210 admeasuring 16299 Sq. Mtrs. belonged to Mathurbhai Parsottamdas, Prahladbhai Parsottamdas and Somabhai Parsottamdas.</p>
<ul class="chain">
<li>Thereafter, as per the Mutation Entry No. 2302 dated 14.02.1995 of the revenue records, it transpires that the said Somabhai Parsottamdas died. Hence name of his legal heirs i.e. Amrutbhai Somabhai, Ramanbhai Somabhai, Lilaben Somabhai, Indiraben Somabhai, Premilaben Somabhai and Puriben wd/o Somabhai Parsottambhai were mutated in the revenue records. A note to this entry has been certified by Concern Authority in the revenue records.</li>
<li>Thereafter, as per the Mutation Entry No. 2369 dated 13.10.1995 of the revenue records, it transpires that the said Mathurbhai Parsottamdas had sold, conveyed and transferred his portion of share i.e. 1/3 portion of share from the survey No. 210 admeasuring 14366 Sq. Mtrs. paiki 4788.66 Sq. Mtrs. unto and in favour of Vinodchandra Shantilal Parikh HUF by executing sale deed registered under Sr. No. 4739 dated 28.09.1995. A note to this entry has been certified by Concern Authority in the revenue records.</li>
<li>Thereafter, as per the Mutation Entry No. 2887 dated 15.11.2003 of the revenue records, it transpires that the Collector, Gandhinagar by vide its order dated 24.10.2003 granted Non-Agricultural use permission for residential purpose of the land bearing survey No. 210.</li>
<li>Thereafter, as per the Mutation Entry No. 2933 dated 25.05.2004 of the revenue records, it transpires that the said Vinodchandra Shantilal Parikh HUF had sold, conveyed and transferred a non-agricultural land bearing the survey No. 210 admeasuring 14366 Sq. Mtrs. unto and in favour of Vardhaman Kutir (Koba) Co. Op. Housing Society Limited by executing sale deed registered under Sr. No. 6704 dated 23.10.2003. A note to this entry has been certified by Concern Authority on dated 07.04.2004 in the revenue records.</li>
<li>Thereafter, as per the Mutation Entry No. 5815 dated 30.06.2021 of the revenue records, it transpires that pursuant to order No. KJP/SR/Gandhi/163/2020-21 dated 29.06.2021 issued by Concern officer, Gandhinagar, A KJP durasti order was passed. According to said order, a non-agricultural land bearing Survey No. 210 admeasuring 14366 Sq. Mtrs. was divided into two parts and New Survey No. 210/001 admeasuring 14265 Sq. Mtrs. was owned and occupied by M/s. Sevi Infrastructure Limited. A note to this entry has been certified by Concern Authority on dated 17.07.2021 in the revenue records.</li>
<li>Thereafter, the Collector, Gandhinagar by vide its order No. 2248/06/03/054/2021 dated 03.11.2021 granted Non-Agricultural use permission for residential purpose of the land bearing survey No. 210/001 admeasuring 8569 Sq. Mtrs.</li>
<li>Thereafter, Airport Authority of India had issued No Objection Certificate for Height Clearance vide NOC ID. AHME/WEST/B/032021/536203 dated 31.03.2021 in relation to the proposed scheme.</li>
<li>Thereafter, Development Permission issued by Gandhinagar Municipal Corporation vide its Rajachithhi No. PRM:GUDA/KOBA/61/07/2020/1199/2021-22 dated 20.01.2022 and approved construction plans.</li>
<li>Thereafter, said M/s. S.B REALTY, a Partnership firm developed and constructed residential units in a building known as "SATVAN HARMONY" on the said land.</li>
<li>Thereafter, State Level Environment Impact Assessment Authority Gujarat had issued Environment Clearance Certificate vide No. SEIAA/GUJ/EC/8(a)/1984/2021 dated 20.12.2021 in relation to the said scheme.</li>
<li>Thereafter, M/s. S.B REALTY, a partnership firm, had availed a project loan from Bajaj Housing Finance Limited by executing a Registered Mortgage Deed No. 37424 dated 24.08.2022.</li>
<li>Thereafter, said M/s. S.B REALTY, a Partnership firm through its authorized partner had sold, conveyed and transferred the said property bearing Flat No. 401 on Fourth floor of Block "D" having RERA Carpet area admeasuring 138.09 Sq. Mtrs. along with wash area admeasuring 5.60 Sq. Mtrs. and Balcony area admeasuring 8.60 Sq. Mtrs.; Total area admeasuring 152.29 Sq. Mtrs. in the scheme known as "SATVAN HARMONY" together with undivided portion of share in land admeasuring 39.64 Sq. Mtrs.; constructed on Non-Agricultural land bearing Final Plot No. 49/1/2 admeasuring 8020 Sq. Mtrs. of Town Planning Scheme No. 01 (KOBA) allotted in lieu of Survey No. 210/001 admeasuring 8564 Sq. Mtrs.; situated, lying &amp; being at Mouje: Koba, Taluka: Gandhinagar of Registration District Gandhinagar &amp; Sub District Gandhinagar Zone – 02 within state of Gujarat unto and in favour of (1) Sunilkumar Rajendrabhai Patel &amp; (2) Pradip Rajendrabhai Patel by executing agreement to sale registered under Sr. No. 3342 dated 05.02.2026.</li>
</ul>
═══════════════════════════════════════════

MANDATORY STRUCTURE:
1. ONE opening <p>: "For the available documents and revenue records presented before me, it transpires that Prior to the year [YEAR], the agricultural land bearing Survey No. [X] admeasuring [X] Sq. Mtrs. belonged to [original owner names]." — take the earliest owner/year the documents actually establish. If the earliest year is not established, open with "For the available documents and revenue records presented before me, it transpires that the land bearing Survey No. [X] admeasuring [X] Sq. Mtrs. belonged to [names]."
2. Then ONE <ul class="chain"> containing ONE <li> per title-affecting event, EARLIEST → LATEST. Every <li> starts with "Thereafter, ".
3. Close </ul>. Write NOTHING after it.

THE CHAIN IS PROPERTY HISTORY — NOT ONLY MUTATION ENTRIES:
Include, in date order, EVERY title-affecting event the documents establish:
• Mutation/FERFAR (Nondh) entries — from the Revenue Record Ground Truth
• Collector / NA / Conversion orders, KJP durasti orders
• Airport Authority NOC, Fire NOC, Environment Clearance
• Development Permission / Rajachitthi / approved construction plans
• RERA registration
• Construction of the scheme by the builder
• Project loan / Mortgage Deed, and its Release/Reconveyance if any
• FINALLY the document in favour of the Proposed Purchaser (see MANDATORY LAST BULLET)

SENTENCE PATTERNS — use these exactly:
• Mutation entry: "Thereafter, as per the Mutation Entry No. [NO] dated [DD.MM.YYYY] of the revenue records, it transpires that [what happened]. A note to this entry has been certified by Concern Authority[ on dated [DD.MM.YYYY]] in the revenue records."
• Sale: "the said [SELLER] had sold, conveyed and transferred [property/share/area] unto and in favour of [BUYER] by executing sale deed registered under Sr. No. [NO] dated [DD.MM.YYYY]."
• Death/inheritance: "the said [NAME] died. Hence name of his legal heirs i.e. [all names] were mutated in the revenue records."
• NA permission: "the [Authority] by vide its order[ No. [NO]] dated [DD.MM.YYYY] granted Non-Agricultural use permission for [purpose] purpose of the land bearing survey No. [X][ admeasuring [X] Sq. Mtrs.]."
• Order-based event with no mutation: "Thereafter, the [Authority] by vide its order No. [NO] dated [DD.MM.YYYY] [what it granted]."
• NOC/Clearance: "Thereafter, [Authority] had issued [document] vide [No./ID] [NO] dated [DD.MM.YYYY] in relation to the said scheme."
• Development Permission: "Thereafter, Development Permission issued by [Authority] vide its Rajachithhi No. [NO] dated [DD.MM.YYYY] and approved construction plans."
• Construction: "Thereafter, said [Builder] developed and constructed [residential/commercial] units in a building known as \\"[SCHEME]\\" on the said land."
• Project mortgage: "Thereafter, [Builder] had availed a project loan from [Lender] by executing a Registered Mortgage Deed No. [NO] dated [DD.MM.YYYY]."

MANDATORY LAST BULLET — NEVER OMIT:
The FINAL <li> must record the document by which the Proposed Purchaser acquires the property:
"Thereafter, said [BUILDER/SELLER][ through its authorized partner] had sold, conveyed and transferred the said property bearing [FULL unit description — unit no., floor, block, carpet/wash/balcony/total area, scheme name, undivided share, Final Plot No., T.P. Scheme No., in lieu of Survey No., Mouje/Taluka/District] unto and in favour of [(1) PURCHASER &amp; (2) CO-PURCHASER] by executing [agreement to sale / sale deed / allotment] registered under Sr. No. [NO] dated [DD.MM.YYYY]."
Use the Draft Sale Deed / Registered Agreement for Sale (Banakhat) / Notarized Agreement for Sale / Letter of Allotment actually produced. If NONE was produced, write instead:
"Thereafter, no Draft Sale Deed, Agreement for Sale, Banakhat or Letter of Allotment executed by the Builder unto and in favour of the Proposed Purchaser has been produced — NOT PROVIDED FOR VERIFICATION."

ABSOLUTE RULES:
- SUBJECT-PROPERTY FILTER — READ THE "SUBJECT PROPERTY" BLOCK AT THE TOP OF YOUR CONTEXT FIRST. This report concerns exactly ONE property (e.g. "Flat No. 203 on Second Floor of Block E") standing on ONE land identification number. Write the history of THAT property and THAT land only:
  • Land-level events on the subject Survey/Block/Final Plot number (including its earlier or renumbered forms) — INCLUDE; they trace how the land reached the builder.
  • Events on the SUBJECT unit — INCLUDE, especially the document in its favour to the Proposed Purchaser.
  • Events on ANY OTHER unit of the same scheme (different flat/shop/office number, different block or floor), or on a DIFFERENT survey/block number — EXCLUDE ENTIRELY. Another purchaser's flat, its sale, its mortgage or its mutation entry has no place in this chain; do not mention it even in passing.
  • A unit-level event you cannot confidently tie to the subject unit — leave it out rather than report someone else's property.
- ONLY WRITE EVENTS WITH REAL SUBSTANCE. If an event's particulars are not legible/available, LEAVE IT OUT of the chain entirely — do not write a bullet for it. NEVER write filler such as "The details of this entry are not fully visible in the available pages of the revenue records" or "an entry was recorded ... details not available". A bullet that does not say WHAT actually happened (who transferred what to whom, or which order/permission/NOC was granted) must not exist. The Ground Truth already excludes number-only mutation entries — do not reintroduce them.
- NEVER invent a Mutation Entry number. Only the numbers listed in the Revenue Record Ground Truth's VALID NONDH list may follow the words "Mutation Entry No.".
- A NOC, Development Permission, RERA certificate, Environment Clearance, court order or bare deed is NOT a mutation entry — it gets its OWN bullet WITHOUT any "Mutation Entry No.".
- Each event appears EXACTLY ONCE. Never repeat an entry, and never list entry numbers in a summary sentence.
- If a Sale Deed, a Mutation entry and an EC row describe the SAME transfer, that is ONE event = ONE bullet.
- Never assume or create facts. If a fact is not in the documents, leave it out or write NOT PROVIDED FOR VERIFICATION.
- Keep areas/units exactly as given. Keep "paiki" exactly as it appears in the source (as in the example above).
- CERTIFICATION STATUS (each Ground Truth entry carries "Status:"): only CERTIFIED, ownership-relevant entries belong in this narrative. A purely administrative entry stays out. An entry that is Rejected / Cancelled / Disputed / Pending / Uncertified must NOT be narrated here as if it moved title — it is reported in Part V (Alerts) instead. Revenue entries are corroborative evidence, never conclusive proof of title.
- Do NOT require every mutation entry to have a matching deed, or every deed to have a matching mutation entry. Reconstruct from the best available evidence.

START: <hr><div class="ph">PART IV — CHRONOLOGICAL TITLE CHAIN AND HISTORY OF PROPERTY</div>
END: after the closing </ul>. The EC details, the regulatory-compliance sub-section and the Part IV summary are written separately and follow your output — do not write them yourself.`

// ================================================================
// STEP 3C — PART V (REGULATORY) + PART VI (ALERTS) SYSTEM
// ================================================================
const S3C = `You generate THREE sub-sections that CONTINUE Part IV, in this exact order: (1) the EC narrative; (2) "Regulatory and Statutory Compliance"; (3) "Summary of Title Chain". Items 2-3 use a <div class="sph"> sub-heading. Write NO "PART" header at all — Part IV is already open, and PART V is written separately by another writer. Formal English only, NEVER Gujarati script (write 'Non-Agricultural (Bin Kheti)', 'Koba').

CORE RULE: Never assume facts. Never create facts. Never suppress an adverse finding. Wherever information is unavailable, expressly state: NOT PROVIDED FOR VERIFICATION.

IMPORTANT — DO NOT DUPLICATE THE CHAIN: the chronological chain (mutation entries, NA/Collector orders, NOCs, Development Permission, RERA, construction, project mortgage and the document in favour of the Proposed Purchaser) is ALREADY written above as the body of Part IV. Do NOT restate those events. Write only the three sub-sections.

═══ (1) PART IV SUB-SECTION — EC NARRATIVE (NO new PART header, NO sub-heading) ═══

ALREADY EMITTED BY THE SYSTEM, DIRECTLY ABOVE YOUR OUTPUT — do NOT repeat any of it: the
"Details of Encumbrance Certificate (EC)" sub-heading, the E-Application/search-period sentence,
the full row-by-row EC table, and the mortgage lifecycle table. Do NOT reproduce that table.
Your output CONTINUES from there and begins with these two paragraphs:

<p>[Chronological walk-through — EARLIEST TO MOST RECENT — of the MATERIAL EC entries: for each, its document type, registration number, date, executing party (Col 3) and claimant party (Col 4), and what it did to the title. Do not compress several entries into "various transactions" — name them. State the overall encumbrance position at the end: subsisting mortgage, or all charges discharged and by which Release/Reconveyance Deed. NEVER reproduce the EC's last column, the EC applicant name, or any E-Application Receipt / E-Challan detail beyond the date and search period. A released/discharged mortgage is stated as discharged, never as active. If no EC was produced, write only: Encumbrance Certificate — NOT PROVIDED FOR VERIFICATION.]</p>
<p>[ONE short cross-verification paragraph: whether the EC entries reconcile with the mutation entries and the registered documents, naming any of these that is actually present — missing mutation, unreflected sale, mortgage mismatch, ownership mismatch, survey mismatch, area mismatch. If everything reconciles, say so in one sentence. If any EC entry's document type could not be identified, say it requires manual review.]</p>

═══ (2) PART IV SUB-SECTION — REGULATORY (NO new PART header) ═══

<div class="sph">Regulatory and Statutory Compliance</div>
<table class="mt">
[ONE row per item that is ACTUALLY relevant to this matter, format <tr><td>[Item]</td><td>:</td><td>[status — number and date if produced, or "NOT PROVIDED FOR VERIFICATION", or "Not Applicable"]</td></tr>. Draw only from what the documents establish. Candidate items: RERA Registration; Development Permission; Commencement Certificate; Approved Building Plan; Occupancy / Completion Certificate; BU Permission; NOCs (Fire, Environment, Airport/Height Clearance); N.A. / Conversion Order; Collector Order; T.P. Scheme / Final Plot record; GUDA/AUDA/SUDA or Municipal permission; Section 43 restriction; Agricultural land transfer restriction; Fragmentation Act position; Old Tenure / New Tenure (Juni / Naa Sharat); Gujarat Stamp Act and Registration Act compliance. Omit rows that have no bearing on this property — do not pad the table.]
</table>

═══ (3) PART IV SUB-SECTION — SUMMARY (NO new PART header) ═══

<div class="sph">Summary of Title Chain</div>
<p>[3-5 sentences closing Part IV: the earliest established owner and year; how title devolved to the present owner/builder in one line; the present owner and the instrument vesting title in them; the encumbrance position; and whether the chain is continuous and unbroken on the documents produced. State the conclusion only — do not re-list the events.]</p>

END: after the Summary of Title Chain paragraph. Do NOT write PART V.`

// ================================================================
// STEP 3C2 — PART V (ALERTS) — split out of S3C so it runs in parallel.
// S3C was writing four sections in one call and had become the slowest branch of the
// parallel wave, which is what pushed a 14-file job past the 300s platform ceiling.
// ================================================================
const S3C2 = `Generate HTML for PART V — ALERTS ONLY. Formal English, NEVER Gujarati script.
Write nothing before the PART V header and nothing after the last alert. The Part IV sub-sections
(EC details, Regulatory and Statutory Compliance, Summary of Title Chain) are written separately —
do not write or repeat them.

CORE RULE: Never assume facts. Never create facts. Never suppress an adverse finding.

<hr><div class="ph">PART V — ALERTS</div>
[Each alert, most severe first, as concise standalone text with NO surrounding commentary — no preamble, no closing remark. Format:
CRITICAL/HIGH: <div class="ib"><div><span class="sh">CRITICAL</span></div><div class="it">N. [Title]</div><p>[2-3 sentences with exact deed/entry numbers]</p><p><span class="sg">Direction:</span> [action required]</p></div>
MODERATE: same with class "sm" | LOW: same with class "sl"]
Raise an alert (do not stay silent) for any of these that is present on the documents produced:
- TITLE CHAIN BREAK (severity CRITICAL — any ownership transition lacking documentary support)
- Missing owner in the chain | duplicate owner | ownership overlap | multiple conflicting buyers or sellers
- Missing sale deed | missing mutation entry | missing EC
- Survey number conflict | area conflict | boundary conflict | date conflict | property identity mismatch across transfers
- Invalid or unregistered transfer | POA-based sale risk | minor-owner sale risk
- A mutation entry that is Rejected / Cancelled / Disputed / Pending / Uncertified but material to title
- Builder's name absent from the revenue record (MAJOR OBJECTION) | Builder title defect
- Missing N.A. Order, Collector Order or development approval
- EC mismatch with the mutation / revenue records
- Litigation, stay order, injunction, attachment, acquisition, SARFAESI, DRT, NCLT, revenue appeal (RTS), partition or specific-performance suit
- Where the owner is a company/firm: unsatisfied charge, CERSAI charge, liquidation, strike-off, or missing board resolution
- Subject unit not traceable in the sanctioned plan / RERA / allotment records
- Existing subsisting mortgage or charge
Each alert states: what the defect is, the affected document, its legal implication, and the action required.
NEVER flag: released/discharged mortgages | EC-confirmed deeds | EC applicant name.
If no adverse finding exists on the documents produced, write a single <div class="ib"><div><span class="sl">LOW</span></div><div class="it">1. No material adverse findings</div><p>No material adverse finding was noted on the documents produced. Standard pre-disbursement verification is recommended.</p></div>

END: after the last alert.`

// ================================================================
// STEP 3D — PARTS VII-XI SYSTEM
// ================================================================
const S3D1 = `Generate HTML for PART VI — LEGAL OPINION ONLY. Formal English. Keep it summarised — this is an opinion, not a restatement of the file.

<hr><div class="ph">PART VI — LEGAL OPINION</div>
<p>[Legal opinion — 4 to 6 sentences. If the title is clear, expressly state that: legal title is established; marketable title is established; mortgageable title is established; SARFAESI enforceability is established; and the security is acceptable. If defects exist, issue a QUALIFIED opinion instead and state the defect. Cover: whether ownership and title continuity are established from the revenue record mutation chain and the documents produced; the encumbrance/mortgage position (subsisting or fully discharged, with the release/reconveyance deed if any); and any conditions the bank must satisfy. Do not repeat the chain — state its conclusion.]</p>

<div class="sph">Mortgageability</div>
<table class="mt">
<tr><td>Mortgageability Classification</td><td>:</td><td>[EXACTLY one of: Mortgageable / Conditionally Mortgageable / Not Mortgageable]</td></tr>
<tr><td>Basis</td><td>:</td><td>[1-2 short sentences — summarised, not exhaustive]</td></tr>
<tr><td>SARFAESI Enforceability</td><td>:</td><td>[Enforceable / Not Enforceable / Requires verification — with a half-line reason]</td></tr>
</table>

<div class="sph">Lending Risk</div>
Compute the risk score by ADDING the score of every risk factor that is actually present on the documents produced. Use EXACTLY this table:
Title Break = 100 | Court Litigation = 90 | Acquisition Risk = 80 | Missing N.A. Order OR relevant Mutation Entry = 70 | Builder Title Defect = 70 | EC Mismatch = 60 | Missing Development Approval = 50 | Missing Mutation = 40 | Builder Name Missing in Revenue Record = 40 | Existing Mortgage = 10 | Minor Clerical Error = 10
<table class="mt">
<tr><td>Risk Factors Present</td><td>:</td><td>[each factor found and its score, e.g. "Missing Development Approval (50); Existing Mortgage (10)" — or "None identified"]</td></tr>
<tr><td>Total Risk Score</td><td>:</td><td>[the sum]</td></tr>
<tr><td>Lending Risk Tier</td><td>:</td><td>[EXACTLY one of the two permitted tiers — LOW if the total is 25 or below, MODERATE if the total is 26 or above. There is no HIGH or UNACCEPTABLE tier; where the risk is severe, that is expressed by classifying the property "Not Mortgageable" above and by the CRITICAL alerts in Part V.]</td></tr>
</table>

<div class="sph">Confidence Level</div>
<table class="mt">
<tr><td>Confidence Level</td><td>:</td><td>[EXACTLY one of: MEDIUM CONFIDENCE / LOW CONFIDENCE / NO CONFIDENCE. MEDIUM = supported by a registered document AND a government record AND the EC AND the revenue record. LOW = supported by a single document only. NO CONFIDENCE = unsupported. There is no HIGH tier — never write one.]</td></tr>
<tr><td>Basis</td><td>:</td><td>[1-2 sentences on what documentary support drives this level]</td></tr>
</table>

ABSOLUTE RULE: NEVER issue an unconditional approval when a CRITICAL risk exists (e.g. a TITLE BREAK, or any ownership transition unsupported by documentary evidence). In that event the opinion must be qualified, the property must not be classified "Mortgageable", and the report must not certify a clear and marketable title.
TITLE CERTIFICATION RULE: certify title only where ownership, title continuity, encumbrance position, revenue reconciliation and mortgageability are ALL established. If any one of them could not be completed on the documents produced, state exactly: INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION.

START: <hr><div class="ph">PART VI — LEGAL OPINION</div>
END: after the Confidence Level table. Do NOT write the final recommendation — Part IX is generated separately.`

// ================================================================
// STEP 3E — PART IX-XI SYSTEM (split from S3D for parallel speed)
// ================================================================
const S3D2 = `Generate HTML for PART VII, PART VIII and PART IX ONLY. Formal English, summarised. These follow Part VI.

<hr><div class="ph">PART VII — DOCUMENTS REQUIRED PRE-DISBURSEMENT</div>
<ol>[Each item ONE line: <li><strong>[Document Name]</strong> — [one-line purpose]</li>. Derive these from what is actually missing or needed on THIS matter — e.g. any document flagged NOT PROVIDED FOR VERIFICATION, an unresolved Part V alert, missing N.A. Order, missing mutation entry, missing development approval, Builder's title document, Builder's NOC/consent for mortgage, Release/Reconveyance of a subsisting charge, original title deeds held by an existing lender. Do not pad with generic items that this file does not need.]</ol>

<hr><div class="ph">PART VIII — DOCUMENTS REQUIRED POST-DISBURSEMENT</div>
<ol>[5-7 items, ONE line each — e.g. Registered/Equitable Mortgage creation, CERSAI charge registration, original title deeds, property insurance, ROC/CHG charge filing if the borrower is a company, Society NOC / Share Certificate, Occupancy/BU Permission on completion.]</ol>

<hr><div class="ph">PART IX — FINAL RECOMMENDATION</div>
[Use the VERDICT given in context VERBATIM — do not reword it, do not soften it, do not upgrade it.
If VERDICT is "CLEAR AND MARKETABLE TITLE":
<div class="vc"><div class="vt" style="color:#15803d;">CLEAR AND MARKETABLE TITLE</div><p>[brief reason]</p></div>
If VERDICT is "CLEAR TITLE SUBJECT TO CONDITIONS":
<div class="vs"><div class="vt" style="color:#b45309;">CLEAR TITLE SUBJECT TO CONDITIONS</div><p>Mortgageable subject to: [short list of the conditions]</p></div>
If VERDICT is "INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION":
<div class="vnc"><div class="vt" style="color:#b91c1c;">INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION</div><p>[what could not be established, and what is required to complete the certification]</p></div>]
<div class="final-rec"><div class="fr-title">FINAL RECOMMENDATION:</div><div class="fr-value">[the same VERDICT text, verbatim]</div></div>
<p>[3-4 sentences: title-chain conclusion | encumbrance status | outstanding conditions | SARFAESI enforceability | bank recommendation.]</p>

START: <hr><div class="ph">PART VII — DOCUMENTS REQUIRED PRE-DISBURSEMENT</div>
END: after the final recommendation paragraph.`


// ================================================================
// EC PRE-SCREEN PROMPT
// ================================================================
const EC_PS = `Look at ALL uploaded images. Find the Encumbrance Certificate (EC) table.

EC COLUMN MAPPING — FIXED, EVERY EC FOLLOWS THIS LAYOUT:
COL 1 = Type of Deed/Document
COL 2 = Property Description
COL 3 = Aapnar = Executing Party = LEFT = WHO GIVES
COL 4 = Lenar = Claimant Party = RIGHT = WHO RECEIVES
COL 5 = Date of Registration
COL 6 = Registration / Dastavej Number (the SECOND-LAST column)
LAST COLUMN = NEVER extract it, never output it, never mention it.
Also NEVER extract or output the "Name of Applicant" field — it has no connection to the property.
Do not output E-Application Receipt or E-Challan details beyond the date and the search period.

BANK IN COL 3 = RELEASE DEED | BANK IN COL 4 = MORTGAGE DEED

ec_date = the date of print shown on the e-application, nothing else.
ec_from / ec_to = the search period from/to dates on the e-application.

DOCUMENT-TYPE CLASSIFICATION — NO GUESSING:
1. Copy the type EXACTLY as printed (original script, including any Gujarati) into "raw_type" BEFORE classifying.
2. Normalise it (strip stray punctuation, hyphens, entry numbers), then match it against THIS canonical taxonomy and nothing else:
${TAXONOMY}
3. Match in priority order: exact match -> synonym/root-word match (e.g. root "ગીરો" -> mortgage family, then disambiguate) -> contextual match (using the executant/claimant pattern).
4. Put the canonical ENGLISH name in "col1_type". NEVER output a type that is not in the taxonomy above. NEVER map a genuinely new term to the nearest-sounding entry.
5. Mandatory disambiguation before you finalise a type:
   - Sale Deed vs Agreement to Sell/Banakhat: registered conveyance (actual transfer) vs a promise of future sale. Check whether a later Sale Deed on the same survey number appears elsewhere in this EC.
   - Sale Deed vs Conveyance Deed vs Absolute Sale Deed: same family unless the printed text itself says "Absolute".
   - Gift vs Relinquishment vs Family Settlement: voluntary transfer without consideration vs a co-owner giving up their own share vs a multilateral family arrangement. Check the party count and co-ownership.
   - Release vs Reconveyance vs Mortgage Release: a generic release of a right vs restoration of title after the loan is repaid. If a Mortgage Deed for the SAME survey number appears EARLIER in this EC, classify it as Reconveyance / Mortgage Release Deed, not a generic Release.
   - Mortgage Deed vs Simple vs Equitable: use the generic "Mortgage Deed" unless the text explicitly says "Simple" or "Equitable".
   - POA vs GPA vs SPA: use GPA/SPA only when the text explicitly says "General"/"Special"; otherwise generic POA.
   - Partition vs Family Settlement: one jointly-owned property vs a broader or dispute-driven arrangement.
   - If two remain equally plausible, pick the BROADER, more conservative category and set match_conf to "CONTEXTUAL MATCH" so an advocate reviews it. Never guess the subtype.
6. "match_conf" must be EXACTLY one of: "EXACT MATCH" | "SYNONYM MATCH" | "CONTEXTUAL MATCH" | "UNIDENTIFIED".
7. If nothing in the taxonomy matches with at least medium confidence, set col1_type to "" and match_conf to "UNIDENTIFIED", and still fill raw_type. An honest "not identifiable" is correct; a wrong classification is a fabricated fact.
8. If the extracted characters are visibly corrupted (broken conjuncts, junk characters), do NOT silently repair them — set match_conf to "UNIDENTIFIED" and put what you can see in raw_type.

Extract EVERY EC row — do not stop early, do not summarise, do not skip a row because it looks
routine. Every single row of the EC table must appear in "rows".
Also check ALL documents for a Release Deed / Giro Mukeli / Reconveyance.

KEEP THE OUTPUT COMPACT so the JSON is never cut off mid-array:
- "col2_property": ONLY the identifier (e.g. "Survey No. 210/001" or "Flat No. 401, Block D"). Do
  NOT copy the full property description paragraph.
- "raw_type": just the type heading as printed, not the whole cell.

Output ONLY JSON:
{"ec_app_number":"","ec_date":"","ec_from":"","ec_to":"","rows":[{"row_number":1,"col1_type":"","raw_type":"","match_conf":"","col2_property":"","col3_aapnar":"","col4_lenar":"","col5_date":"","col6_deed_no":""}],"pre_screen_releases":[{"bank":"","deed_no":"","date":"","source":""}]}`

const REV_PS = 'LANGUAGE: Output ONLY English in JSON fields. No Gujarati script anywhere in output.\nTranslate status words: પ્રમાણિત=Certified | કબજાની પ્રમાણિત=Certified | હુકમથી પ્રમાણિત=Certified by Court Order | રદ=Rejected | ચકાસ=Under Revision | બાકી=Pending\nSTATUS CLASSIFICATION — the "s" field must be EXACTLY one of: Certified | Certified by Court Order | Uncertified | Cancelled | Disputed | Pending | Rejected. This drives whether the entry may enter the title narrative, so read the status column carefully for every single entry and never leave it blank when it is visible.\nTranslate terms: Bin Kheti=Non-Agricultural | Juni Sharat=Old Tenure | Naa Sharat=New Tenure | Vechan=Sale | Hukam=Court Order | Warsi=Inheritance | Bhagat=Partition\nGujarati digits: ૦=0 ૧=1 ૨=2 ૩=3 ૪=4 ૫=5 ૬=6 ૭=7 ૮=8 ૯=9 — convert ALL Gujarati digits to Arabic numerals in dates and numbers.\n\n═══════════════════════════════════════════\nWHAT IS A MUTATION ENTRY — AND WHAT IS NOT (READ FIRST, ABSOLUTE)\n═══════════════════════════════════════════\nA Mutation/FERFAR entry (Nondh) comes ONLY from the Revenue Record "Entry Details" / FERFAR /\nGamnamuna No. 6 register. Each real entry has a NUMERIC Nondh number (e.g. 3710, 4080, 11685),\na date, a change-type (Sale / Order / Inheritance / NA / etc.), a certified/rejected status, and\na narrative. These numeric Nondh entries are the ONLY thing that goes into the "entries" array.\n\nThe following are NOT mutation entries — NEVER put them in the "entries" array, NEVER invent a\nNondh number for them, NEVER give them a text "entry number":\n- AAI / Airport NOC, Height Clearance NOC\n- GUDA / AUDA / development permission, building plan approval\n- RERA registration certificate / Form-C\n- A registered Sale Deed, Mortgage Deed, Release Deed, Declaration Deed BY ITSELF (the DEED is\n  NOT a Nondh; only the FERFAR Nondh that RECORDS that deed is an entry, and its number is the\n  numeric Nondh number, not the deed/document number)\n- Index-2, tax receipts, layout plans, jantri\nIf you cannot find the FERFAR "Entry Details" register with numeric Nondh entries in the images,\nreturn entries:[] and fill only the 7/12 header fields — do NOT manufacture entries from deeds,\nNOCs, permissions or certificates. An empty entries array is CORRECT and far better than fake\nentries built from non-FERFAR documents.\n\nCOUNT DISCIPLINE: The FERFAR "Entry Details" register usually holds MANY numeric Nondh entries\n(commonly 10-25). Do NOT stop after a handful. Read the entire "Entry Details" / Gamnamuna 6\nsection top to bottom and extract EVERY numeric Nondh entry you can see, oldest to newest.\nSCAN WINDOW: cover the LAST 20-30 YEARS of computerized mutation entries. Do not stop at the EC\nsearch period — go back as far as the register shows.\n\n═══════════════════════════════════════════\n\nFind Revenue Records in ALL uploaded images: Village Form 6, 7/12 (Satbara), 8-A, Property Card, Hakk Patrak, Mutation Register, FERFAR Register, Gamnamuma No. 6.\n\n══════════════════════════════════════════\nVILLAGE FORM NO. 7 (7/12 SATBARA) — EXTRACT:\n══════════════════════════════════════════\nFrom Village Form 7 extract these fields:\n- Village name (Mouje), Taluka, District\n- Survey Number / Block Number / Final Plot Number (old AND new if both visible)\n- Total Area in H.Are.SqMt. or Sq.Mtrs.\n- Land Use (Jaminno Upyog): Non-Agricultural / Agricultural\n- Current owner name (Kabjedar/Khatedar column) — translate to English\n- Boja/Encumbrance column — list ALL entry numbers visible\n- Ganot/Tenant column — NIL if blank\n- Any NA Order or Land Use conversion reference visible in the document\n\n══════════════════════════════════════════\nFERFAR / MUTATION REGISTER / GAMNAMUMA NO. 6 — COLUMN STRUCTURE (PER SOP):\n══════════════════════════════════════════\nEach Nondh/Mutation entry in FERFAR has these columns reading left to right:\n\nCOLUMN 1 (Leftmost) = Entry Date + Mutation Entry Number + Status (Certified / Rejected / Hukam)\n  → ALWAYS extract: Mutation Entry Number, Date, Status from this column\n  → NOTE: Skip the very FIRST sub-column of Entry Details if it is only administrative/serial numbering\n  → The actual Date + Number + Status is what you need from Column 1\n\nCOLUMN 2 (Second from left) = Complete Mutation Details (most important column):\n  → Contains: Nature of change (Sale / Court Order / Inheritance / Death / NA Conversion / Partition etc.)\n  → Contains: All party names — sellers, buyers, applicants, respondents\n  → Contains: Deed references (Sale Deed No., Court Order No., Case No.)\n  → Contains: Consideration amounts if sale\n  → Contains: Court name, case number, order date for court order entries\n  → EXTRACT EVERYTHING from Column 2 and reconstruct the full English narrative\n\nCOLUMN 3 (Third from left) = Survey/Block Number:\n  → Include ONLY if the Survey/Block Number relates to the SUBJECT PROPERTY\n  → If a different property, skip this column entirely for that entry\n\nCOLUMN 4 (Last column) = Remarks:\n  → Extract any legally relevant remarks\n\n══════════════════════════════════════════\nCRITICAL RULES:\n══════════════════════════════════════════\n1. Read ALL pages from beginning to end — do NOT stop after first few entries\n2. Extract EVERY entry — Sale, Court Order, Inheritance, Death, NA Conversion, Rejected entries — ALL\n3. REJECTED entries are LEGALLY IMPORTANT — always extract and report them with Status=REJECTED\n4. PARTIAL EXTRACTION IS VALID — if you cannot read some fields, return empty string for that field\n   NEVER return {found:false} unless the document is genuinely not a Revenue Record at all\n5. Date and Number are in Column 1 — search thoroughly, never output empty date if it is visible\n6. For Court Order entries: extract case number, court name, order date, parties, and what was decided\n7. NA Order references: extract the Non-Agricultural order number and date if visible anywhere\n8. Translate all Gujarati party names: અરજદાર=Applicant | સામાવાળા=Respondent | વેચાણ આપનાર=Seller | વેચાણ લેનાર=Buyer\n9. PER-ENTRY COMPLETENESS — MANDATORY, THE MOST IMPORTANT RULE: for EVERY entry object you MUST fill "d" (the entry DATE from Column 1) AND "r" (the FULL narrative from Column 2). An entry that has "e" (a number) but an empty "d" or empty "r" is a FAILED read — go back to that same row, re-read Column 1 for its date + status and Column 2 for its parties + nature + deed/case number, and fill them before you output. Also fill "s" (status), "po" (previous owner/seller/applicant), "no" (new owner/buyer/respondent) and "n" (nature) whenever they are visible in that row. NEVER emit a number-only entry — a list of bare Nondh numbers with no dates or details is exactly what we must avoid. Read the date, status, both parties, the nature, and the deed/case reference for each and every numeric Nondh, one row at a time, top to bottom.\n\nOUTPUT ONLY THIS JSON — no other text before or after:\n{"document_type_found":"FERFAR OR 7-12 OR Property Card OR mixed","village":"","taluka":"","district":"","survey_block_no":"","total_area":"","land_use":"","tenure":"","ownership_column":"","boja_column":"","ganot_column":"","na_order":"","entries":[{"e":"entry_no","d":"date_DD/MM/YYYY","cd":"certification_date_if_different","s":"Certified OR Certified by Court Order OR Uncertified OR Cancelled OR Disputed OR Pending OR Rejected","po":"sellers OR applicants OR previous owner — all names in English","no":"buyers OR respondents OR new owner — all names in English","n":"Sale OR Court Order OR Inheritance OR Death OR NA Conversion OR Partition OR Gift OR Mortgage OR Release","r":"complete narrative in English — all parties, deed/case numbers, amounts, what happened and what was decided","sv":"survey_block_no if related to subject property","sd":"deed number OR court case number and date","rm":"any legal remarks or notes"}]}\nPARTIAL RULE: Return whatever you can read. Empty string for unreadable fields. Never found:false unless no revenue record exists.'

// ================================================================
// MAIN API HANDLER
// ================================================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            images, caseType = 'lap', appId = 'AUTO', bankName = 'Bank',
            loanType = 'Loan Against Property', applicantName = '', coApplicant = '',
            currentOwner = '', propertyAddress = '', boundaryEast = '', boundaryWest = '',
            boundaryNorth = '', boundarySouth = '', userId = null,
            // revData: pre-computed Revenue Record from the dedicated revenue-scan pass (see
            // below). When present, the main pipeline uses it directly and does NOT re-scan
            // revenue — so the register never has to share the 4.5MB request with other docs.
            revData: providedRevData = null,
            // mode: 'revenue-scan' = run ONLY the deep FERFAR scan on these images and return
            // the structured revData. Anything else = normal full report generation.
            mode = 'full',
        } = body

        if (!images || images.length === 0)
            return NextResponse.json({ success: false, error: 'No documents uploaded. Please upload EC and property documents.' }, { status: 400 })

        // ── DEDICATED REVENUE-RECORD SCAN (its own request, its own 4.5MB budget) ──
        // The frontend sends the tagged Revenue detail register (Gam Namuna 6 / Hakkpatrak)
        // here BY ITSELF — in page-chunks if it is long — so every mutation-entry page is
        // deep-scanned at full quality regardless of how many OTHER documents the client
        // uploaded. This is what makes the per-Nondh date/detail reliable for a SaaS flow
        // where users dump all their files. Returns just the structured revData JSON.
        if (mode === 'revenue-scan') {
            try {
                const scanImgs = images.map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
                // temperature:0 — this is an OCR/extraction task, not creative writing. At the
                // default temperature (1.0) the SAME register read differently on each run: once
                // full detail, once "not legible" — the inconsistency the user saw. Deterministic
                // reading makes the result the same every time for the same document.
                const rs = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0, messages: [{ role: 'user', content: [...scanImgs, { type: 'text', text: REV_PS }] }] })
                const _rb = rs.content.find(b => b.type === 'text')
                const rawText = _rb && _rb.type === 'text' ? _rb.text : ''
                const parsed = parseJSON(rawText)
                const _e = (parsed && (parsed.mutation_entries || parsed.entries)) || []
                console.log('REVENUE-SCAN chunk: imgs=' + scanImgs.length + ' entries=' + _e.length + ' village=' + (parsed?.village || '?'))
                return NextResponse.json({ success: true, revData: parsed })
            } catch (e: any) {
                console.log('REVENUE-SCAN err:', e?.message || e)
                return NextResponse.json({ success: false, error: e?.message || 'revenue scan failed', revData: null }, { status: 200 })
            }
        }

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        const refNo = 'TITLEMATRIXAI/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-4)
        // §2 — the full case-classification list. The upload form currently offers the first five;
        // the rest are here so a case type added to the form needs no change in this route.
        const loanMap: Record<string, string> = {
            builder_purchase: 'BUILDER PURCHASE', resale: 'RESALE PURCHASE', bt: 'BALANCE TRANSFER',
            seller_bt: 'SELLER BALANCE TRANSFER', lap: 'LOAN AGAINST PROPERTY / MORTGAGE',
            self_construction: 'SELF-CONSTRUCTION', composite: 'COMPOSITE LOAN', plot_purchase: 'PLOT PURCHASE',
            industrial: 'INDUSTRIAL PROPERTY', commercial: 'COMMERCIAL PROPERTY', agricultural: 'AGRICULTURAL PROPERTY',
            leasehold: 'LEASEHOLD PROPERTY', govt_allotted: 'GOVERNMENT ALLOTTED PROPERTY',
            inherited: 'INHERITED PROPERTY', gift: 'GIFT PROPERTY',
        }

        // Separate by docType tag
        const allImgs: any[] = images.map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const ecImgs: any[] = images.filter((img: any) => img.docType && img.docType === 'ec').map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const relImgs: any[] = images.filter((img: any) => img.docType && (img.docType === 'release' || img.docType === 'mortgage')).map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const revImgs: any[] = images.filter((img: any) => img.docType && img.docType === 'revenue').map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
        const psImgs = ecImgs.length > 0 ? [...ecImgs, ...relImgs] : allImgs
        console.log('Images: all=' + allImgs.length + ' EC-tagged=' + ecImgs.length + ' Release/Mortgage=' + relImgs.length + ' Revenue-tagged=' + revImgs.length)

        // ── UPLOADED-FILE INVENTORY — the only hard ground truth for "what was produced" ──
        // The frontend sends a name + docType tag per page (multi-page PDFs arrive as name_p1,
        // name_p2 ...). Until now the route threw the names away and the Part III writer had to
        // infer the document list from prose, which is exactly how documents got invented and
        // real ones got dropped. The inventory is now stated explicitly to every writer.
        const docInventory = (() => {
            const m = new Map<string, { pages: number; tags: Set<string> }>()
            for (const img of images) {
                const base = String(img.name || 'Unnamed upload').replace(/_p\d+$/i, '').trim() || 'Unnamed upload'
                const e = m.get(base) || { pages: 0, tags: new Set<string>() }
                e.pages++
                if (img.docType && img.docType !== 'auto') e.tags.add(img.docType)
                m.set(base, e)
            }
            const lines = [...m.entries()].map(([n, e], i) =>
                '  ' + (i + 1) + '. ' + n + (e.tags.size ? ' [tagged: ' + [...e.tags].join(', ') + ']' : '') + ' — ' + e.pages + ' page' + (e.pages > 1 ? 's' : ''))
            return [
                '=== FILES ACTUALLY PRODUCED FOR SCRUTINY — ' + m.size + ' FILE(S). THIS LIST IS COMPLETE AND CLOSED ===',
                ...lines,
                'HOW TO USE THIS LIST:',
                '- NOTHING may be listed as scrutinised that does not come out of these files. If a document',
                '  is not in these files it WAS NOT PRODUCED — omit it entirely, no placeholder, no',
                '  "Not Available", no assumption that it exists.',
                '- EVERY one of these files must be accounted for. Do not silently skip a file because it is',
                '  hard to read or because you are unsure what to call it.',
                '- The mapping is not always one-to-one: a single file may contain more than one instrument',
                '  (list each instrument separately), and two files may be two parts of one instrument',
                '  (list it once). Judge by the instruments, but every file must be represented.',
                '===',
            ].join('\n')
        })()
        console.log('DOC INVENTORY: ' + (docInventory.match(/\n {2}\d+\. /g) || []).length + ' distinct files from ' + images.length + ' pages')

        const FORM = ['=== FORM DATA (ALWAYS PRIORITY) ===', 'FORM_APPLICANT: ' + applicantName, 'FORM_CO: ' + (coApplicant || 'Not Applicable'), 'FORM_OWNER: ' + (currentOwner || applicantName), 'FORM_BANK: ' + bankName, 'FORM_PROPERTY: ' + propertyAddress, 'EAST: ' + boundaryEast, 'WEST: ' + boundaryWest, 'NORTH: ' + boundaryNorth, 'SOUTH: ' + boundarySouth, 'Applicant = FORM_APPLICANT always. Never advocate name.', '==='].join('\n')

        // ── STEP 0 + STEP 1 — ALL RUN IN PARALLEL (was sequential, fixes 504 timeout) ──
        // EC prescreen, Revenue prescreen, and Haiku fact-extraction all hit images
        // independently and have no dependency on each other's output, so they
        // fire concurrently instead of one after another.
        let ecRows: ECRow[] = [], ecMetas: ECMeta[] = [], lc = runLC([]), preReleases: any[] = []
        let revData: any = null
        let revScanError = false
        let facts = ''

        // Did the frontend already deep-scan the Revenue Record in its own dedicated request?
        // If so, use that result and SKIP the in-request revenue scan entirely — the register
        // was read at full budget separately, so we must not (and need not) re-scan it here.
        const usePreScan = !!providedRevData
        if (usePreScan) {
            const _pe = (providedRevData.mutation_entries || providedRevData.entries) || []
            const hasSignal = providedRevData.found !== false && (
                _pe.length > 0 ||
                !!(providedRevData.document_type_found || providedRevData.village || providedRevData.taluka || providedRevData.district || providedRevData.survey_block_no || providedRevData.ownership_column)
            )
            revData = hasSignal ? providedRevData : null
            console.log('REV: pre-computed revData provided by dedicated scan — hasSignal=' + hasSignal + ' entries=' + _pe.length)
        }

        // 8000, not 3000: each EC row now carries raw_type, match_conf and a short property
        // reference on top of the original five fields. At 3000 the JSON was being cut off
        // mid-array, parseJSON returned null, and the report came out with NO EC data at all.
        const ecPrescreen = AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0, messages: [{ role: 'user', content: [...psImgs, { type: 'text', text: EC_PS }] }] })
            .then(ps => {
                const p = parseJSON(ps.content[0].type === 'text' ? ps.content[0].text : '{}')
                if (p?.rows?.length > 0) {
                    // NO subject-unit filter on EC rows — deliberately. It was tried and reverted:
                    // an EC row's Property Description routinely names some other unit of the same
                    // scheme in passing, so filtering on it silently dropped genuine land-level rows
                    // AND could hide a subsisting charge. Suppressing an encumbrance is far worse
                    // than showing one extra row, so EVERY extracted EC row is kept and reported.
                    // The unit filter stays where it is safe: the revenue-record mutation entries.
                    ecRows = p.rows
                    lc = runLC(ecRows)
                    if (p.ec_app_number) ecMetas.push({ ec_app_number: p.ec_app_number, ec_date: p.ec_date || '', ec_from: p.ec_from || '', ec_to: p.ec_to || '' })
                    if (p.pre_screen_releases?.length > 0) preReleases = p.pre_screen_releases
                    console.log('EC P0: rows=' + ecRows.length + ' status=' + lc.status)
                }
            })
            .catch(e => console.log('PS err:', e))

        // Revenue Record scan focus — THE KEY FIX.
        // Previously this scanned ALL images (EC + deeds + NOC + GUDA + RERA + 7/12) together.
        // With many clear EC/deed pages next to a single hard-to-read Gujarati 7/12 page, the
        // model's attention drifted to the EC/deed content and it built the chain from deed
        // numbers instead of the FERFAR Nondh entries — exactly the "chain from EC" symptom.
        // When revenue documents ARE tagged (docType:'revenue'), scan ONLY those, so the
        // 7/12 / FERFAR register gets its own focused deep scan with zero EC/deed distraction.
        // Fall back to all images only when nothing is tagged as revenue.
        const revPrescreenImgs = revImgs.length > 0 ? revImgs : allImgs
        console.log('REV scan focus: ' + (revImgs.length > 0 ? ('TAGGED revenue images only (' + revImgs.length + ')') : 'ALL images (no revenue tag)'))
        // No thinking / no temperature here on purpose: this is a pure JSON-extraction
        // call. On claude-sonnet-4-6 the old `thinking:{type:'enabled',budget_tokens}`
        // shape is rejected (400), and passing temperature alongside thinking is invalid —
        // that 400 was silently killing every Revenue Record scan (revScanError=true).
        // Bigger max_tokens so a long FERFAR/Mutation JSON isn't truncated mid-array.
        const revPrescreen = usePreScan
            // Dedicated scan already ran — nothing to do here.
            ? Promise.resolve()
            : AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0, messages: [{ role: 'user', content: [...revPrescreenImgs, { type: 'text', text: REV_PS }] }] })
                .then(rs => {
                    const _rb = rs.content.find(b => b.type === 'text')
                    const rawText = _rb && _rb.type === 'text' ? _rb.text : ''
                    console.log('REV RAW (first 300 chars):', rawText.substring(0, 300))
                    const r = parseJSON(rawText)
                    // A scan "counts" if it isn't an explicit found:false AND it carries at
                    // least one real signal — a document type, a location field, a survey no,
                    // or one or more mutation/FERFAR entries. This stops an empty/garbage object
                    // from being reported as "PROVIDED: YES — 0 entries" (which reads as broken).
                    const _ents = (r && (r.mutation_entries || r.entries)) || []
                    const hasSignal = !!r && r.found !== false && (
                        _ents.length > 0 ||
                        !!(r.document_type_found || r.village || r.taluka || r.district || r.survey_block_no || r.ownership_column)
                    )
                    if (hasSignal) {
                        revData = r
                        console.log('REV P0 SUCCESS: docType=' + (r.document_type_found || '?') + ' village=' + (r.village || '?') + ' survey=' + (r.survey_block_no || '?') + ' mutations=' + _ents.length + ' source=fallback-all')
                    } else if (r && r.found === false) {
                        console.log('REV P0: model explicitly returned found:false — no revenue record visible in images')
                    } else if (r) {
                        console.log('REV P0: parsed JSON had no usable Revenue Record signal (all fields empty) — treating as not-found')
                    } else {
                        console.log('REV P0 PARSE FAILED: raw length=' + rawText.length + ' parseJSON returned null — likely truncated JSON from token budget. Source=' + (revImgs.length > 0 ? 'tagged' : 'fallback-all'))
                    }
                })
                .catch(e => { revScanError = true; console.log('REV PS err:', e?.message || e) })

        // SPEED: don't make Haiku re-read the heavy high-res Revenue pages — REV_PS already
        // deep-scans those and feeds their facts via the Revenue Ground Truth. When a Revenue
        // doc is tagged, S1 skips it and reads only the deed/EC pages, so the single biggest
        // duplicated vision cost in the pipeline (8 large 7/12/FERFAR images processed twice)
        // is removed. If nothing is tagged as revenue, S1 keeps reading everything.
        const s1Imgs = revImgs.length > 0
            ? images.filter((img: any) => img.docType !== 'revenue').map((img: any) => ({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } }))
            : allImgs
        // The per-document sweep is what Parts III and IV depend on, so it stays — but it is written
        // as COMPACT pipe-delimited lines, not prose blocks. Prose blocks over 14 files pushed this
        // call to ~10k generated tokens and it became the long pole that overran the 300s ceiling.
        // Same completeness, a fraction of the tokens.
        const sweep = '\n\nFIRST, sweep the uploaded pages ONE DOCUMENT AT A TIME and output a section headed "DOCUMENT SWEEP" containing ONE COMPACT LINE per document, in this exact pipe format and nothing more:\n' +
            'TITLE AS PRINTED | Date: DD.MM.YYYY | No.: <registration/order number or "not stated"> | Parties: <executant> -> <claimant> | Property: <unit/survey identifier> | Authority: <issuing authority, if any>\n' +
            'Rules for the sweep: one line per document, never two documents on one line, never one document on two lines. Do NOT skip a document because it is hard to read — write its title and "not legible" in the fields you cannot read. Do NOT add a line for a document that is not in the uploaded pages. Keep each line to a single line — no prose, no commentary.\n' +
            'THEN, below the sweep, give the detailed facts (ownership history, boundaries, addresses, encumbrances, approvals) in your normal form.'
        const step1Promise = AI.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 7000, system: S1, messages: [{ role: 'user', content: [...s1Imgs, { type: 'text', text: docInventory + '\n\n' + FORM + '\n\nExtract ALL facts. Case: ' + caseType + '. Property: ' + propertyAddress + sweep }] }] })
            .then(s1 => {
                facts = s1.content[0].type === 'text' ? s1.content[0].text : ''
                console.log('STEP1: facts extracted, length=' + facts.length)
            })
            .catch(e => console.log('STEP1 err:', e))

        // Per-phase timings. The pipeline has three sequential phases and when the whole thing is
        // killed at the platform timeout the 504 says nothing about WHICH phase ran long. These
        // lines make the next slow run diagnosable instead of guesswork.
        const T0 = Date.now()
        const secs = (from: number) => ((Date.now() - from) / 1000).toFixed(1) + 's'

        await Promise.all([ecPrescreen, revPrescreen, step1Promise])
        console.log('TIMING phase A (EC + Revenue + facts, parallel over ' + images.length + ' pages): ' + secs(T0))

        // ── RELEASE THE PAGE IMAGES ──
        // Everything from here on is pure text. Holding the base64 for every uploaded page — plus
        // the copies the SDK made to serialise each vision request — all the way to the end of the
        // request is what killed a 10-page run: the pipeline finished in 235s but the process was
        // then OOM-killed, which the platform reports as INTERNAL_FUNCTION_INVOCATION_FAILED with
        // no JS exception to log. Dropping the references here lets the collector reclaim it before
        // the analysis and the six report writers run.
        const revImgCount = revImgs.length
        for (const arr of [allImgs, ecImgs, relImgs, revImgs, psImgs, s1Imgs, images as any[]]) arr.length = 0
        if (global.gc) global.gc()

        // Apply pre-screen releases
        
        if (preReleases.length > 0) {
            const a = [...lc.active], r = [...lc.released]
            for (const ps of preReleases) {
                const bw = ps.bank.toLowerCase().split(' ').filter((w: string) => w.length > 3)
                if (!r.some((x: Charge) => bw.some((w: string) => x.lender.toLowerCase().includes(w)))) {
                    const ai = a.findIndex((x: Charge) => bw.some((w: string) => x.lender.toLowerCase().includes(w)))
                    if (ai >= 0) { const m = a.splice(ai, 1)[0]; m.release_deed_no = ps.deed_no || ''; m.release_date = ps.date || ''; r.push(m); console.log('PS RELEASE:' + ps.bank) }
                    else r.push({ lender: ps.bank, deed_no: '', date: '', release_deed_no: ps.deed_no || '', release_date: ps.date || '' })
                }
            }
            lc = buildLC(a, r)
        }
        console.log('FINAL LC:' + lc.status + '|' + lc.summary)

        const ecGT = ['=== EC GROUND TRUTH ===', 'EC App No: ' + (ecMetas.map(m => m.ec_app_number).join(', ') || 'NOT PROVIDED'), 'EC Date: ' + (ecMetas.map(m => m.ec_date).join(' | ') || 'NOT PROVIDED'), 'EC Period: ' + (ecMetas.map(m => m.ec_from + ' to ' + m.ec_to).join(' | ') || 'NOT PROVIDED'), 'EC Rows: ' + ecRows.length, 'Status: ' + lc.status, 'Summary: ' + lc.summary, 'Active: ' + (lc.active.length === 0 ? 'NONE' : lc.active.map(a => a.lender + ' Deed:' + a.deed_no + ' Date:' + a.date).join(' | ')), 'Released: ' + (lc.released.length === 0 ? 'NONE' : lc.released.map(r => r.lender + ' RELEASED vide Deed No.' + r.release_deed_no + ' dated ' + r.release_date).join(' | ')), 'RULE: Released = NEVER flag as active. Bank in LEFT EC col = Release.', '==='].join('\n')

        // Compact EC line for the Part IV cross-verification sentence ONLY. Deliberately
        // omits the deed-by-deed Active/Released rows — those are exactly what the chain-writer
        // was copying into chain paragraphs. It gets just App No + period + overall status.
        const ecCrossVerifyLine = 'EC for cross-verification only — E-Application No.: ' +
            (ecMetas.map(m => m.ec_app_number).join(', ') || 'NOT PROVIDED') +
            ' | Period: ' + (ecMetas.map(m => m.ec_from + ' to ' + m.ec_to).join(' | ') || 'NOT PROVIDED') +
            ' | Overall encumbrance status: ' + lc.status +
            '. Use this ONLY to write the single closing sentence; do NOT create chain paragraphs from it.'

        let revGT = ''
        if (revData) {
            // Support both old field names and new compact field names
            const allEntries = revData.mutation_entries || revData.entries || []
            // A Nondh only belongs in the chain if its SUBSTANCE is legible — i.e. it says what
            // actually happened (a narrative, the parties, or the nature of the change). A
            // number-only entry produces nothing but filler ("the details of this entry are not
            // fully visible..."), which is exactly what must NOT appear in the history. Filtering
            // here means those entries never reach the chain writer at all.
            const hasSubstance = (m: any) => !!String(
                (m.r || m.reason_of_mutation || '') + (m.po || m.previous_owner || '') +
                (m.no || m.new_owner || '') + (m.n || m.nature || '')
            ).trim()
            // SUBJECT-UNIT FILTER — a scheme's register carries a mutation entry for every unit
            // sold. An entry that names some OTHER flat/unit is another purchaser's property and
            // must never reach the chain. Entries that name no unit at all are land-level and stay.
            // The form's property field is the most reliable statement of which unit this report is
            // about (meta.propertyDescription is not extracted yet at this point in the pipeline).
            // If no unit can be identified there, the filter stays off rather than guessing.
            const subjUnit = subjectUnitNo(propertyAddress)
            const entryText = (m: any) => [
                m.r || m.reason_of_mutation, m.po || m.previous_owner, m.no || m.new_owner,
                m.sd || m.supporting_document, m.rm || m.remarks, m.sv || m.relevant_survey_no,
            ].filter(Boolean).join(' ')
            const otherUnit = (m: any) => aboutAnotherUnit(entryText(m), subjUnit)
            const entries = allEntries.filter((m: any) => hasSubstance(m) && !otherUnit(m))
            const skippedBlank = allEntries.filter((m: any) => !hasSubstance(m)).length
            const skippedOther = allEntries.filter((m: any) => hasSubstance(m) && otherUnit(m)).length
            const skipped = allEntries.length - entries.length
            console.log('Revenue entries: ' + allEntries.length + ' scanned -> ' + entries.length + ' kept | ' +
                skippedBlank + ' number-only | ' + skippedOther + ' about another unit' +
                (subjUnit ? ' (subject unit = ' + subjUnit + ')' : ' (no subject unit identified — unit filter off)'))
            const mutLines = entries.map((m: any, idx: number) =>
                '  ' + (idx + 1) + '. Entry No.' + (m.e || m.entry_no || '?') +
                ' | Date:' + (m.d || m.entry_date || 'not stated') +
                (((m.cd || m.certification_date) ? (' | Certified:' + (m.cd || m.certification_date)) : '') +
                    ' | Status:' + (m.s || m.status || '?') +
                    ' | PREV OWNER: ' + (m.po || m.previous_owner || 'not stated') +
                    ' -> NEW OWNER: ' + (m.no || m.new_owner || 'not stated') +
                    ' | Nature:' + (m.n || m.nature || '?') +
                    ((m.r || m.reason_of_mutation) ? (' | Reason:' + (m.r || m.reason_of_mutation)) : '') +
                    ((m.sv || m.relevant_survey_no) ? (' | Survey:' + (m.sv || m.relevant_survey_no)) : '') +
                    ((m.sd || m.supporting_document) ? (' | Doc:' + (m.sd || m.supporting_document)) : '') +
                    ((m.rm || m.remarks) ? (' | Remarks:' + (m.rm || m.remarks)) : ''))
            )
            revGT = ['', '=== REVENUE RECORD GROUND TRUTH (deep-scanned 7/12 / Property Card / FERFAR) ===',
                'Village: ' + (revData.village || 'NOT PROVIDED'),
                'Taluka: ' + (revData.taluka || 'NOT PROVIDED'),
                'District: ' + (revData.district || 'NOT PROVIDED'),
                'Survey/Block No: ' + (revData.survey_block_no || 'NOT PROVIDED'),
                'Total Area: ' + (revData.total_area || 'NOT PROVIDED'),
                'Land Use: ' + (revData.land_use || 'NOT PROVIDED'),
                'Tenure: ' + (revData.tenure || 'NOT PROVIDED'),
                'Ownership Column: ' + (revData.ownership_column || 'NOT PROVIDED'),
                'Boja/Encumbrance Column: ' + (revData.boja_column || 'NOT PROVIDED'),
                'Ganot/Tenant Column: ' + (revData.ganot_column || 'NOT PROVIDED'),
                // SOP point 5: the NA / land-use conversion order must be traced and stated.
                // REV_PS extracts it as `na_order`, but it was never forwarded to the chain
                // writer — so add it to the Ground Truth here.
                'NA / Conversion Order: ' + (revData.na_order || 'NOT STATED IN REVENUE RECORD'),
                // Hard whitelist of the ONLY valid Nondh (Mutation Entry) numbers. The chain was
                // once built from EC/registered-DEED document numbers (e.g. 9871, 27734), which
                // are NOT Nondh numbers. Only these numbers may follow "Mutation Entry No.".
                'VALID NONDH (MUTATION ENTRY) NUMBERS — ONLY THESE MAY FOLLOW THE WORDS "Mutation Entry No.": ' +
                    (entries.map((m: any) => m.e || m.entry_no).filter(Boolean).join(', ') || 'NONE'),
                'CRITICAL: A registered Sale/Mortgage/Release DEED document number is NOT a Nondh number. NEVER write "Mutation Entry No. <deed number>". A deed number may appear inside a bullet as "registered under Sr. No. X" but is never the mutation entry number.',
                'FERFAR/Mutation Entries with LEGIBLE PARTICULARS (' + entries.length + ' of ' + allEntries.length + ' scanned; the other ' + skipped + ' are number-only and have been deliberately EXCLUDED). Write ONE bullet for each of these, oldest to newest:',
                ...mutLines,
                'RULE: Every entry listed here has legible substance — write it. Entries whose particulars were not legible are already excluded and must NOT be mentioned in the chain at all: never write filler such as "the details of this entry are not fully visible". Use these entries to trace the title back as far as the records allow. Treat this as authoritative revenue record data.',
                '==='
            ].join('\n')
            console.log('Revenue GT built: ' + entries.length + ' mutation entries')
        }

        const GT = ecGT + revGT

        // ── STEP 2: Deep legal analysis (Sonnet) — facts already extracted in parallel above ──
        // 4500: enough that the enlarged META block cannot squeeze out the analysis behind it, but
        // this call is the one fully SEQUENTIAL block in the pipeline, so every token here is
        // wall-clock the whole request pays for. The writers no longer depend on the analysis alone
        // — they get the raw facts too — so it does not need to be exhaustive.
        const TS2 = Date.now()
        const s2 = await AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4500, system: getS2(caseType), messages: [{ role: 'user', content: docInventory + '\n\n' + FORM + '\n\n' + GT + '\n\nEXTRACTED FACTS:\n' + facts }] })
        console.log('TIMING phase B (legal analysis): ' + secs(TS2))
        const analysis = s2.content[0].type === 'text' ? s2.content[0].text : ''
        const meta = parseMeta(analysis)

        const ecTbl = buildECTable(ecRows, lc, ecMetas)
        const lcSection = buildLifecycleSection(lc)
        // `verdict` stays in the legacy code vocabulary for the DB and the dashboards.
        // `verdictLabel` is what the report itself prints, in the master spec's exact wording.
        const verdict = gateVerdict(extractVerdict(analysis), lc)
        const verdictLabel = VERDICT_LABEL[verdict] || VERDICT_LABEL['PENDING']

        // Three genuinely different scenarios, each needs its own honest message —
        // previously all three collapsed into one misleading "not tagged" sentence
        // even when a file WAS tagged but the scan simply didn't recognize it.
        let revenueProvidedFlag: string
        if (revData) {
            revenueProvidedFlag = (() => {
                const ents = revData.mutation_entries || revData.entries || []
                return 'REVENUE_RECORD_PROVIDED: YES — ' + ents.length + ' Mutation/FERFAR entries deep-scanned. Only the entries listed under "FERFAR/Mutation Entries with LEGIBLE PARTICULARS" in the Revenue Record Ground Truth belong in the chain — write one bullet for each of those. Mutation entries whose particulars were not legible are excluded on purpose and must NOT be mentioned at all.'
            })()
        } else if (revScanError) {
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: SCAN_ERROR — a Revenue Record scan was attempted but failed due to a technical error (not a content issue). Do NOT claim Revenue Record was examined or was absent. State plainly: "Revenue Record verification could not be completed due to a technical error during processing; please retry or verify manually before disbursement."'
        } else if (revImgCount > 0 || usePreScan) {   // revImgs was emptied above — use the saved count
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: TAGGED_BUT_NOT_RECOGNIZED — a document WAS specifically tagged as Revenue Record/7-12, and was scanned, but the scan could not identify recognizable 7/12, Mutation, or FERFAR content in it. Do NOT say "not tagged or produced." Instead state plainly: "A Revenue Record document was submitted for this case; however, the content could not be positively identified as a Village Form 7/12, Property Card, or Mutation Register extract on automated review. Independent manual verification of the Revenue Record is recommended before disbursement."'
        } else {
            revenueProvidedFlag = 'REVENUE_RECORD_PROVIDED: NOT_FOUND — a complete scan of all uploaded documents was performed automatically but no recognizable Revenue Record (7/12 / Property Card / Mutation Register / FERFAR) was identified. Do NOT claim Revenue Record was examined. State plainly: Revenue Record (7/12 / Mutation extract) was not found in the documents produced for examination; independent verification of the Revenue Record is recommended before disbursement.'
        }
        // SPEED: 5k chars of analysis is enough for the report writers (they also have FORM +
        // GT + facts). Trimming from 8k trims input tokens across the parallel Part III-IX
        // writers without losing anything they need.
        // SUBJECT-PROPERTY IDENTITY — the filter EVERY section is written through. A scheme has many
        // units and the revenue records / EC carry entries for all of them; only the land under the
        // scheme and THIS unit belong in this report. Built from the form + the extracted property
        // description + the revenue survey number, so a writer can match on unit no./block/floor AND
        // on the land identification number.
        const subjUnitNo = subjectUnitNo(propertyAddress) || subjectUnitNo(meta.propertyDescription || '')
        const subjectProperty = [
            '=== SUBJECT PROPERTY — THIS REPORT IS ABOUT THIS ONE PROPERTY ONLY ===',
            subjUnitNo
                ? ('*** THE SUBJECT UNIT IS No. ' + subjUnitNo + '. ANY event about a unit with a DIFFERENT number is FORBIDDEN in this report — do not write it, do not mention it. ***')
                : '*** Identify the subject unit from the description below and report on that unit only. ***',
            'As stated in the case form: ' + (propertyAddress || 'NOT PROVIDED'),
            'Full description extracted from the documents: ' + normTerms(meta.propertyDescription || propertyAddress || 'NOT PROVIDED'),
            'Land identification (Revenue Record): Survey/Block No. ' + ((revData && revData.survey_block_no) || 'NOT PROVIDED') +
            (revData && revData.village ? ', Mouje: ' + revData.village : '') +
            (revData && revData.taluka ? ', Taluka: ' + revData.taluka : '') +
            (revData && revData.district ? ', District: ' + revData.district : ''),
            'Boundaries: ' + (normTerms(meta.propertyBoundaries || '') || 'NOT PROVIDED'),
            '',
            'MANDATORY FILTER — apply this to EVERY event/entry/row before you write it:',
            '1. INCLUDE land-level events for the land identification number above (its Survey/Block/',
            '   Final Plot/T.P. Scheme number, including its earlier or renumbered forms) — these trace',
            '   how the land devolved to the present owner/builder and are part of this property history.',
            '2. INCLUDE events concerning THIS unit (the exact unit/flat/shop/office number, floor and',
            '   block named above) — in particular the document in its favour to the Proposed Purchaser.',
            '3. EXCLUDE every event concerning ANY OTHER unit in the same scheme (a different flat/shop/',
            '   office number, a different block or a different floor) and any event on a DIFFERENT survey/',
            '   block number. Another purchaser\'s flat, its sale, its mortgage or its mutation entry is NOT',
            '   part of this report — omit it entirely, do not even mention it in passing.',
            '4. If a unit-level event cannot be confidently tied to the subject unit, leave it out rather',
            '   than risk reporting someone else\'s property.',
            '===',
        ].join('\n')

        // The writers get the RAW extracted facts as well as the condensed analysis. The analysis
        // alone was losing per-document detail — S2 compresses, and its META block now eats a large
        // slice of the window — so sections were written from a summary of a summary. `facts` is
        // what the vision pass actually read off the pages, and it is the deepest source available.
        const ctx = docInventory + '\n\n' + subjectProperty + '\n\n' + FORM + '\n\n' + GT + '\n\n' + revenueProvidedFlag +
            '\n\nEXTRACTED FACTS (raw, read directly off the uploaded pages — use these for detail):\n' + facts.substring(0, 14000) +
            '\n\nANALYSIS:\n' + analysis.substring(0, 8000) +
            '\n\nAPPLICANT: ' + (meta.applicant || applicantName) + '\nOWNER: ' + (meta.currentOwner || currentOwner) + '\nCASE: ' + caseType + '\nBANK: ' + bankName


        // ── STEP 3: Parallel HTML generation (4x Sonnet) — each call isolated so one failure can't sink the whole report ──
        const safeStep3 = (label: string, p: Promise<any>) => p.catch(e => {
            console.log('STEP3 ' + label + ' err:', e?.message || e)
            return { content: [{ type: 'text', text: '<p style="color:#b91c1c;"><em>' + label + ' could not be generated (' + (e?.message ? String(e.message).substring(0, 150) : 'unknown error') + '). Please retry — other sections of this report are unaffected.</em></p>' }] }
        })
        // PART IV (the chain) is AI-written — and it MUST be. The firm's house format is a
        // single chronological PROPERTY history that interleaves mutation entries with NA/Collector
        // orders, NOCs, Development Permission, construction, the project mortgage and finally the
        // Builder→Purchaser document. Those non-mutation events live in the deeds/facts, not in the
        // Revenue Record, so a chain built only from revData (as it was) could never produce them.
        // The Revenue Ground Truth still pins the mutation bullets: only its VALID NONDH numbers may
        // follow "Mutation Entry No.", which is what stops NOCs/permissions getting fake Nondh numbers.
        const ctxS3B = [
            subjectProperty,
            '',
            '=== REVENUE RECORD GROUND TRUTH — the ONLY source of Mutation Entry numbers ===',
            revGT || '(No Revenue Record Ground Truth available — see the flag below.)',
            revenueProvidedFlag,
            '',
            '=== ALL OTHER TITLE EVENTS (deeds, NA/Collector orders, NOCs, Development Permission,',
            'RERA, construction, project mortgage, and the document in favour of the Proposed',
            'Purchaser) — take these from the facts and analysis below and give each its OWN bullet',
            'in date order, WITHOUT any "Mutation Entry No." ===',
            'EXTRACTED FACTS:\n' + facts.substring(0, 14000),
            '',
            'ANALYSIS:\n' + analysis.substring(0, 8000),
            '',
            '=== EC (for cross-reference of the same transfers — do NOT create separate bullets from EC rows) ===',
            ecCrossVerifyLine,
            '',
            '=== FORM DATA — the Proposed Purchaser for the mandatory last bullet ===',
            FORM,
            'PROPOSED PURCHASER: ' + (meta.applicant || applicantName),
            'CO-PURCHASER: ' + (meta.coApplicant || coApplicant || 'Not Applicable'),
            'CURRENT OWNER / SELLER: ' + (meta.currentOwner || currentOwner),
            'CASE TYPE: ' + caseType,
        ].join('\n')

        const TS3 = Date.now()
        const [r3a, r3b, r3c, r3c2, r3d1, r3d2] = await Promise.all([
            // Token budgets sized to what each section now has to WRITE. They were left at their old
            // values when the sections grew, and every one of them was truncating mid-output — which
            // is what dropped documents from Part III and detail from Parts IV-VI.
            safeStep3('Part III — documents', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 5000, system: S3A, messages: [{ role: 'user', content: ctx }] })),
            safeStep3('Part IV — chain', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, temperature: 0, system: S3B, messages: [{ role: 'user', content: ctxS3B }] })),
            safeStep3('Part IV tail', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3C, messages: [{ role: 'user', content: ctx + '\n\n=== EC DATA — ALREADY RENDERED INTO THE REPORT ABOVE YOUR OUTPUT. This is source data for your narrative paragraphs ONLY. Do NOT output any of this HTML. ===\n' + ecTbl + '\n' + lcSection }] })),
            safeStep3('Part V — alerts', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3C2, messages: [{ role: 'user', content: ctx + '\n\n=== EC DATA (source for encumbrance-related alerts) ===\n' + ecTbl + '\n' + lcSection }] })),
            safeStep3('Part VI', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4500, system: S3D1, messages: [{ role: 'user', content: ctx + '\n\nVERDICT: ' + verdictLabel }] })),
            safeStep3('Parts VII-IX', AI.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 4000, system: S3D2, messages: [{ role: 'user', content: ctx + '\n\nVERDICT: ' + verdictLabel }] }))
        ])

        console.log('TIMING phase C (5 report writers, parallel): ' + secs(TS3) + ' | TOTAL pipeline: ' + secs(T0))

        const BT3 = String.fromCharCode(96).repeat(3)
        const stripFences = (t: string): string => {
            let s = t.trim()
            const htmlFence = BT3 + 'html'
            if (s.toLowerCase().startsWith(htmlFence)) s = s.slice(htmlFence.length)
            else if (s.startsWith(BT3)) s = s.slice(BT3.length)
            if (s.endsWith(BT3)) s = s.slice(0, -BT3.length)
            s = s.split(BT3).join('')
            return s.trim()
        }
        // normTerms on every generated section — the house terminology ("registered under",
        // "were entered") is enforced in code across the whole report, so no AI section can drift.
        const p1 = normTerms(stripFences(r3a.content[0].type === 'text' ? r3a.content[0].text : ''))
        const part3 = normTerms(stripFences(r3b.content[0].type === 'text' ? r3b.content[0].text : ''))
        // The EC heading and table are emitted deterministically as ecBlock. If the model echoes
        // them anyway, drop the duplicate rather than print the table twice.
        const p3 = normTerms(stripFences(r3c.content[0].type === 'text' ? r3c.content[0].text : '') + stripFences(r3c2.content[0].type === 'text' ? r3c2.content[0].text : ''))
            .replace(/<table class="ec-tbl">[\s\S]*?<\/table>/gi, '')
            .replace(/<div class="sph">\s*Details of Encumbrance Certificate[^<]*<\/div>/gi, '')
        const p4 = normTerms(stripFences(r3d1.content[0].type === 'text' ? r3d1.content[0].text : '') + stripFences(r3d2.content[0].type === 'text' ? r3d2.content[0].text : ''))

        // §5 / §17.11 — "paiki" becomes "out of" in the property description, and only there.
        // Enforced in code so it cannot drift, exactly like normTerms.
        const finalPropDesc = paikiOut(normTerms(meta.propertyDescription || ('As per documents submitted — ' + propertyAddress)))
        const finalBounds = normTerms(meta.propertyBoundaries || '')

        // ── PART I — BORROWER, MORTGAGOR AND CURRENT OWNERSHIP (built deterministically) ──
        // §12 puts A. Borrower Details / B. Mortgagor Details / C. Current Ownership first.
        // Form values win over the model's extraction for names (the form is what the advocate
        // typed); addresses only exist in the documents, so they come from the META block.
        const NP = 'NOT PROVIDED FOR VERIFICATION'
        const borrower = meta.applicant || applicantName || NP
        const coBorrower = meta.coApplicant || coApplicant || 'Not Applicable'
        const isNoCo = /^not applicable$/i.test(String(coBorrower).trim())
        const mortgagor = meta.mortgagor || meta.currentOwner || currentOwner || borrower
        const row = (l: string, v: string) => '<tr><td>' + l + '</td><td>:</td><td>' + (String(v || '').trim() || NP) + '</td></tr>'
        const part1 =
            '<hr><div class="ph">PART I — BORROWER, MORTGAGOR AND CURRENT OWNERSHIP</div>' +
            '<div class="sph">A. Borrower Details</div>' +
            '<table class="mt">' +
            row('Name of Borrower', borrower) +
            row('Address of Borrower', meta.applicantAddress) +
            row('Name of Co-Borrower', coBorrower) +
            (isNoCo ? '' : row('Address of Co-Borrower', meta.coApplicantAddress)) +
            row('Constitution of Borrower', meta.constitution) +
            '</table>' +
            '<div class="sph">B. Mortgagor Details</div>' +
            '<table class="mt">' +
            row('Name of Mortgagor', mortgagor) +
            row('Address of Mortgagor', meta.mortgagorAddress) +
            '</table>' +
            '<div class="sph">C. Current Ownership</div>' +
            '<table class="mt">' +
            row('Present Owner of the Property', meta.currentOwner || currentOwner) +
            row('Mode of Acquisition', meta.modeOfAcquisition) +
            row('Registration Details', meta.registrationDetails) +
            '</table>'

        // ── PART II — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES (deterministic) ──
        let boundsRows = ''
        if (finalBounds) {
            const eMatch = finalBounds.match(/East[^:]*:\s*([^|]+)/i)
            const wMatch = finalBounds.match(/West[^:]*:\s*([^|]+)/i)
            const nMatch = finalBounds.match(/North[^:]*:\s*([^|]+)/i)
            const sMatch = finalBounds.match(/South[^:]*:\s*([^|]+)/i)
            boundsRows =
                '<tr><td>East (Purva)</td><td>:</td><td>' + (eMatch ? eMatch[1].trim() : (boundaryEast || 'As per documents')) + '</td></tr>' +
                '<tr><td>West (Pashchim)</td><td>:</td><td>' + (wMatch ? wMatch[1].trim() : (boundaryWest || 'As per documents')) + '</td></tr>' +
                '<tr><td>North (Uttar)</td><td>:</td><td>' + (nMatch ? nMatch[1].trim() : (boundaryNorth || 'As per documents')) + '</td></tr>' +
                '<tr><td>South (Dakshin)</td><td>:</td><td>' + (sMatch ? sMatch[1].trim() : (boundarySouth || 'As per documents')) + '</td></tr>'
        } else {
            boundsRows =
                '<tr><td>East (Purva)</td><td>:</td><td>' + (boundaryEast || 'As per documents') + '</td></tr>' +
                '<tr><td>West (Pashchim)</td><td>:</td><td>' + (boundaryWest || 'As per documents') + '</td></tr>' +
                '<tr><td>North (Uttar)</td><td>:</td><td>' + (boundaryNorth || 'As per documents') + '</td></tr>' +
                '<tr><td>South (Dakshin)</td><td>:</td><td>' + (boundarySouth || 'As per documents') + '</td></tr>'
        }
        // ── PART IV SUB-SECTION — EC, built in CODE ──
        // The EC table and lifecycle table were computed deterministically and then merely handed to
        // the model as reference text, with no instruction to output them — so whether any EC data
        // reached the report at all depended on the model choosing to echo it. It is now emitted
        // directly. As long as rows were extracted, the EC data cannot go missing from the report.
        const ecm = ecMetas[0]
        const ecHead = ecm
            ? ('Encumbrance Certificate bearing E-Application No. ' + (ecm.ec_app_number || 'not stated in the copy produced') +
                ' dated ' + (ecm.ec_date || 'not stated') + ' for the search period ' + (ecm.ec_from || 'not stated') +
                ' to ' + (ecm.ec_to || 'not stated') + ', issued by the Inspector General of Registration, Revenue Department, Government of Gujarat. ' +
                ecRows.length + ' registered transaction' + (ecRows.length === 1 ? ' was' : 's were') + ' found on row-by-row examination.')
            : ecRows.length > 0
                ? (ecRows.length + ' registered transaction' + (ecRows.length === 1 ? ' was' : 's were') + ' found on row-by-row examination of the Encumbrance Certificate produced. The E-Application number and search period were not legible in the copy produced.')
                : 'Encumbrance Certificate — NOT PROVIDED FOR VERIFICATION.'
        const ecBlock = '<div class="sph">Details of Encumbrance Certificate (EC)</div><p>' + ecHead + '</p>' +
            (ecRows.length > 0 ? ecTbl + lcSection : '')
        console.log('EC BLOCK: rows=' + ecRows.length + ' meta=' + (ecm ? 'yes' : 'no') + ' status=' + lc.status)

        const part2 =
            '<hr><div class="ph">PART II — PROPERTY DESCRIPTION ALONG WITH BOUNDARIES</div>' +
            '<div class="prop-para">' + finalPropDesc + '</div>' +
            '<p><strong>Bounded as Under:</strong></p>' +
            '<table class="mt">' + boundsRows + '</table>'

        // FINAL REPORT FORMAT — the nine fixed Parts of the master spec §12, in order:
        //   PART I    — Borrower, Mortgagor and Current Ownership     (part1, deterministic)
        //   PART II   — Property Description along with Boundaries    (part2, deterministic)
        //   PART III  — Description of Documents Verified/Scrutinized (p1  = S3A)
        //   PART IV   — Chronological Title Chain and History         (part3 = S3B chain, then
        //               ecBlock = the EC heading/table/lifecycle built in code, then p3's
        //               remaining Part IV sub-sections: EC narrative, Regulatory, Summary)
        //   PART V    — Alerts                                        (p3 continues = S3C)
        //   PART VI   — Legal Opinion (+ Mortgageability, Lending Risk, Confidence)  (p4 = S3D1)
        //   PART VII  — Documents Required Pre-Disbursement           (p4 continues = S3D2)
        //   PART VIII — Documents Required Post-Disbursement          (p4 continues = S3D2)
        //   PART IX   — Final Recommendation                          (p4 continues = S3D2)
        const html = buildReport(refNo, appId, today, bankName, loanMap[caseType] || loanType,
            part1 + part2 + p1 + part3 + ecBlock + p3 + p4
        )

        if (userId && DB) { try { await DB.from('reports').insert({ user_id: userId, case_type: caseType, applicant_name: meta.applicant || applicantName || 'Unknown', bank_name: bankName || 'Unknown', property_address: meta.propertyDescription || propertyAddress || 'Unknown', app_id: appId || refNo, verdict, report_html: html }) } catch (e) { console.log('DB:', e) } }

        return NextResponse.json({ success: true, report: html, verdict, lifecycle: lc, ecRows, ecMetas })

    } catch (e: any) {
        console.error('Pipeline:', e)
        return NextResponse.json({ success: false, error: e.message || 'Pipeline failed' }, { status: 500 })
    }
}