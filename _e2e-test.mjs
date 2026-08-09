// TEMP end-to-end test — renders a synthetic 7/12 + FERFAR image and posts it to
// the running dev server's /api/analyze, then reports whether Revenue Record was captured.
import sharp from 'sharp'

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
const lines = [
  ['VILLAGE FORM No. 7/12  (SATBARA)', 20, true],
  ['Village (Mouje): KOBA   Taluka: GANDHINAGAR   District: GANDHINAGAR', 60],
  ['Survey / Block No.: 245/2      Total Area: 2-15-30  H.Are.SqMt.', 92],
  ['Land Use (Jaminno Upyog): Non-Agricultural (Bin Kheti)', 124],
  ['Tenure: Old Tenure (Juni Sharat)   Kabjedar/Khatedar: Shreeji Developers', 156],
  ['NA Conversion: Order No. NAB/GNR/245 dated 04/06/2010', 188],
  ['Boja/Encumbrance column: NIL     Ganot/Tenant column: NIL', 220],
  ['', 252],
  ['FERFAR / MUTATION REGISTER (Gamnamuna No. 6)', 284, true],
  ['Entry No. 1121   Date: 12/03/2005   Status: Certified', 320],
  ['   Sale (Vechan): Rameshbhai Patel  ->  Sunilkumar Patel', 348],
  ['   Sale Deed No. 4521 dated 12/03/2005. Survey 245/2.', 376],
  ['Entry No. 1250   Date: 20/09/2008   Status: Rejected', 412],
  ['   Objection filed; entry rejected by Mamlatdar.', 440],
  ['Entry No. 1410   Date: 08/07/2011   Status: Certified', 476],
  ['   Sale: Sunilkumar Patel -> M/s Shreeji Developers', 504],
  ['   Sale Deed No. 7788 dated 08/07/2011. Survey 245/2.', 532],
]
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="580">
<rect width="100%" height="100%" fill="white"/>
${lines.map(([t,y,b]) => `<text x="24" y="${y}" font-family="Arial" font-size="${b?24:20}" font-weight="${b?'bold':'normal'}" fill="black">${esc(t)}</text>`).join('\n')}
</svg>`

const png = await sharp(Buffer.from(svg)).png().toBuffer()
const b64 = png.toString('base64')
console.log('rendered image bytes:', png.length)

const body = {
  images: [{ mediaType: 'image/png', data: b64, docType: 'revenue' }],
  caseType: 'lap',
  bankName: 'Test Bank',
  applicantName: 'Test Applicant',
  propertyAddress: 'Survey 245/2, Koba, Gandhinagar',
}

console.log('posting to /api/analyze ...')
const t0 = Date.now()
const res = await fetch('http://localhost:3000/api/analyze', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
})
const j = await res.json()
console.log('HTTP', res.status, ' took', ((Date.now()-t0)/1000).toFixed(1)+'s')
if (!j.success) { console.log('API error:', j.error); process.exit(1) }

const html = j.report || ''
// Look for revenue-record signals in the produced report
const hits = {
  'Koba village in report': /koba/i.test(html),
  'Survey 245/2 in report': /245\/2/.test(html),
  'Entry 1121 (sale)': /1121/.test(html),
  'Entry 1410 (sale to Shreeji)': /1410/.test(html),
  'Rejected entry 1250 shown': /1250/.test(html),
  'NA order NAB/GNR/245': /NAB\/GNR\/245|NA.*245|Non-Agricultural.*[Oo]rder/i.test(html),
  'NOT provided / scan error (BAD)': /verification could not be completed|NOT PROVIDED FOR VERIFICATION|not found in the documents/i.test(html),
}
console.log('\n=== REVENUE RECORD CAPTURE CHECK ===')
for (const [k,v] of Object.entries(hits)) console.log((v?'YES':'no ').padEnd(4), k)

// ── MASTER SPEC §12 — the nine fixed Parts, in order, and the vocabulary they must use ──
const PARTS = [
  ['PART I', /PART I\s*[—-]\s*BORROWER, MORTGAGOR AND CURRENT OWNERSHIP/i],
  ['PART II', /PART II\s*[—-]\s*PROPERTY DESCRIPTION ALONG WITH BOUNDARIES/i],
  ['PART III', /PART III\s*[—-]\s*DESCRIPTION OF DOCUMENTS VERIFIED/i],
  ['PART IV', /PART IV\s*[—-]\s*CHRONOLOGICAL TITLE CHAIN/i],
  ['PART V', /PART V\s*[—-]\s*ALERTS/i],
  ['PART VI', /PART VI\s*[—-]\s*LEGAL OPINION/i],
  ['PART VII', /PART VII\s*[—-]\s*DOCUMENTS REQUIRED PRE-DISBURSEMENT/i],
  ['PART VIII', /PART VIII\s*[—-]\s*DOCUMENTS REQUIRED POST-DISBURSEMENT/i],
  ['PART IX', /PART IX\s*[—-]\s*FINAL RECOMMENDATION/i],
]
console.log('\n=== REPORT STRUCTURE (master spec §12) ===')
let prev = -1, ordered = true
for (const [name, re] of PARTS) {
  const at = html.search(re)
  if (at < 0 || at < prev) ordered = false
  if (at >= 0) prev = at
  console.log((at >= 0 ? 'YES' : 'no ').padEnd(4), name)
}
const vocab = {
  'Parts appear in order': ordered,
  'Sub-sections A/B/C in Part I': /A\. Borrower Details/i.test(html) && /B\. Mortgagor Details/i.test(html) && /C\. Current Ownership/i.test(html),
  'Part IV has EC sub-section': /Details of Encumbrance Certificate/i.test(html),
  'Part IV has Regulatory sub-section': /Regulatory and Statutory Compliance/i.test(html),
  'Part IV has Summary sub-section': /Summary of Title Chain/i.test(html),
  'Mortgageability classified': /Mortgageable|Conditionally Mortgageable|Not Mortgageable/i.test(html),
  'Risk tier is MODERATE or LOW only': /Lending Risk Tier/i.test(html) && !/HIGH RISK|UNACCEPTABLE RISK/i.test(html),
  'Confidence has no HIGH tier (BAD if yes)': /HIGH CONFIDENCE/i.test(html),
  'Final recommendation uses spec wording': /CLEAR AND MARKETABLE TITLE|CLEAR TITLE SUBJECT TO CONDITIONS|INSUFFICIENT DOCUMENTATION FOR FINAL TITLE CERTIFICATION/i.test(html),
  'Old "TITLE NOT CLEAR" wording gone (BAD if yes)': /TITLE NOT CLEAR/i.test(html),
  'EC table carries raw type + match confidence': /Type as Printed/i.test(html) && /Match Confidence/i.test(html),
  'paiki still in report body (BAD only inside prop-para)': /class="prop-para"[^>]*>[^<]*\bpaiki\b/i.test(html),
}
for (const [k,v] of Object.entries(vocab)) console.log((v?'YES':'no ').padEnd(4), k)
console.log('\nverdict returned by API:', j.verdict)
