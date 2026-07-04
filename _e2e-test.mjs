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
  'PART IV chain present': /PART IV/i.test(html),
  'NOT provided / scan error (BAD)': /verification could not be completed|NOT PROVIDED FOR VERIFICATION|not found in the documents/i.test(html),
}
console.log('\n=== REVENUE RECORD CAPTURE CHECK ===')
for (const [k,v] of Object.entries(hits)) console.log((v?'YES':'no ').padEnd(4), k)
