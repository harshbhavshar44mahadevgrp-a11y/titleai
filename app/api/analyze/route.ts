import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 180

const API_KEY = process.env.ANTHROPIC_API_KEY || ''
const HAIKU = 'claude-haiku-4-5-20251001'
const SONNET = 'claude-sonnet-4-6'

async function callClaude(model: string, system: string, userContent: any, maxTokens: number): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
            model, max_tokens: maxTokens, system,
            messages: [{ role: 'user', content: typeof userContent === 'string' ? userContent : userContent }]
        }),
    })
    if (!res.ok) throw new Error(await res.text())
    const d = await res.json()
    return d.content?.map((c: any) => c.text || '').join('') || ''
}

function safeJSON(raw: string): any {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) throw new Error('No JSON found')
    let s = m[0].replace(/[\x00-\x1F\x7F]/g, ' ').replace(/,(\s*[}\]])/g, '$1')
    try { return JSON.parse(s) } catch {
        let open = 0, arr = 0
        for (const c of s) { if (c==='{') open++; if (c==='}') open--; if (c==='[') arr++; if (c===']') arr-- }
        for (let i=0; i<arr; i++) s+=']'
        for (let i=0; i<open; i++) s+='}'
        return JSON.parse(s.replace(/,(\s*[}\]])/g, '$1'))
    }
}

export async function POST(req: NextRequest) {
    try {
        const { extractedText, imageFiles, caseType } = await req.json()
        if (!extractedText && (!imageFiles || imageFiles.length === 0)) {
            return NextResponse.json({ error: 'No content' }, { status: 400 })
        }

        const today = new Date().toLocaleDateString('en-IN')
        const text = extractedText ? extractedText.substring(0, 12000) : ''

        // ══════════════════════════════════════════
        // STEP 1 — HAIKU: EXTRACT RAW DATA
        // ══════════════════════════════════════════
        const s1content: any[] = []
        if (imageFiles?.length > 0) {
            for (const f of imageFiles) {
                s1content.push({ type: 'image', source: { type: 'base64', media_type: f.mediaType || 'image/jpeg', data: f.base64 } })
            }
        }
        if (text) {
            s1content.push({ type: 'text', text: `DOCUMENTS:\n${text}\n\nExtract data. Return JSON only:\n{"borrower":"buyer/purchaser from Draft Sale Deed","seller":"seller name","owner":"current owner in 7/12","sro":"Sub Registrar Office name","survey":"survey number","constitution":"Individual or Partnership Firm or Company or HUF","desc":"property description","land":"Bin Kheti or Kheti","boja":"NIL or details","tenant":"NIL or name","ec_status":"CLEAR or ENCUMBERED","ec_period":"EC period","na_no":"NA order number","na_date":"date","rera_no":"RERA number","rera_dev":"developer","rera_date":"date","partner_deed":false,"all_signed":false,"coowners":[],"minor":false,"death":false,"east":"","west":"","north":"","south":"","docs":[{"type":"","reg":"","date":"","seller":"","buyer":"","amt":""}]}` }
        )
        }

        const s1raw = await callClaude(HAIKU, 'Extract Gujarat property document data. If Gujarati text found, translate to English. Return JSON only.', s1content, 2000)
        const ex = safeJSON(s1raw)

        // ══════════════════════════════════════════
        // STEP 2 — SONNET: 9 STEP ANALYSIS + FULL REPORT
        // Sonnet does everything — no Haiku formatting
        // ══════════════════════════════════════════
        const s2raw = await callClaude(
            SONNET,
            `You are TitleAI — Senior Property Law Expert Gujarat India 30+ years experience.
You MUST follow ALL 9 STEPS and generate a COMPLETE legal scrutiny report.
GUJARAT RULES: Bin Kheti=Bank CAN lend, Kheti=CANNOT lend, EC=14 years exact, Partnership Deed mandatory, RERA mandatory post May 2017, All co-owners must sign, Minor=court permission mandatory.
BORROWER = buyer/purchaser from Draft Sale Deed — NEVER write seller name as borrower.
Return ONLY valid JSON. No markdown. No text before or after.`,
            `EXTRACTED DATA: ${JSON.stringify(ex)}
CASE TYPE: ${caseType || 'builder_purchase'}
TODAY: ${today}

Follow ALL 9 STEPS in your thinking, then return this complete JSON:

STEP 1: Classify all documents
STEP 2: Verify each document (5 questions each)
STEP 3: Build title chain oldest to newest - every seller must equal previous buyer
STEP 4: Check special situations (death, minor, POA, co-owners, partnership, HUF)
STEP 5: Check 7/12 - owner match, Bin Kheti vs Kheti, Boja, Tenant, Mutation
STEP 6: Check EC - exactly 14 years, active mortgage, court attachment
STEP 7: Check NA Order and RERA
STEP 8: Assess risk - HIGH/MEDIUM/LOW
STEP 9: Final decision - CLEAR/CLEAR_SUBJECT_TO/NOT_CLEAR

{
  "reportMeta": {"refNo": "TitleAI/2026/001", "date": "${today}"},
  "applicantName": "BUYER name from Draft Sale Deed - NOT seller - if unknown write As Per Draft Sale Deed",
  "ownerName": "current owner from 7/12 extract",
  "constitution": "Individual or Partnership Firm or Private Limited or HUF",
  "propertyNature": "Freehold Residential Flat or Plot or Commercial",
  "sroName": "Sub Registrar Office name from documents",
  "surveyNo": "survey number from documents",
  "propertyDescription": "complete property address with flat building TPS survey mouje taluka district",
  "boundaryEast": "east boundary or Not Mentioned in Documents",
  "boundaryWest": "west boundary or Not Mentioned in Documents",
  "boundaryNorth": "north boundary or Not Mentioned in Documents",
  "boundarySouth": "south boundary or Not Mentioned in Documents",
  "partI_documents": [
    {"srNo": 1, "documentName": "Document Type | Reg No | Date", "description": "Complete 2-3 sentence description of document role in title chain and key details"}
  ],
  "partII_titleFlow": [
    {"paraNo": 1, "content": "Complete detailed paragraph about title origin - who is original owner, how they got it, what documents show - with all names dates amounts survey numbers"},
    {"paraNo": 2, "content": "Complete paragraph about proposed transfer - seller to buyer, consideration amount, registration details, RERA compliance"},
    {"paraNo": 3, "content": "Complete paragraph about title chain assessment - is chain complete or broken, any gaps, co-owner issues, partnership issues"},
    {"paraNo": 4, "content": "Complete paragraph about EC and revenue records - EC period, status, 7/12 land use, boja, tenant"},
    {"paraNo": 5, "content": "Complete paragraph about NA Order, RERA, building approvals and regulatory compliance"}
  ],
  "partIII_issues": [
    {"severity": "High or Medium or Low", "issue": "Specific detailed legal issue", "suggestion": "Exact document or action required to resolve"}
  ],
  "partIV_opinion": "Based on scrutiny of documents submitted, the title of the subject property bearing Survey No. [X] situated at [complete location] presently stands in the name of [owner name]. The Encumbrance Certificate from SRO [name] reflects [status]. NA Order [details]. RERA registration [details]. The title chain [is complete / has gaps because reason]. In our opinion, the title of the said property is [CLEAR / CLEAR SUBJECT TO CONDITIONS / NOT CLEAR] and the bank [can / cannot] accept the same as security for the proposed loan, subject to [list all conditions numbered].",
  "documentsRequired": {
    "preDisbursement": ["Specific document 1", "Specific document 2", "minimum 5 specific items"],
    "atPayOrder": ["Updated EC from SRO within 3 months", "Original registered Sale Deed in bank custody", "Insurance policy endorsed in favour of bank"],
    "postDisbursement": ["Registered Mortgage Deed", "CERSAI Registration within 30 days", "Revenue mutation entry on 7/12 showing bank lien"]
  },
  "overallRisk": "HIGH or MEDIUM or LOW",
  "ecStatus": "CLEAR or ENCUMBERED or ATTACHED",
  "titleStatus": "CLEAR or CLEAR_SUBJECT_TO or NOT_CLEAR"
}`,
            10000
        )

        const final = safeJSON(s2raw)

        // Force fill critical fields
        if (!final.sroName || final.sroName === '—' || final.sroName === '') final.sroName = ex.sro || 'Not Available in Documents'
        if (!final.surveyNo || final.surveyNo === '—' || final.surveyNo === '') final.surveyNo = ex.survey || 'Not Available in Documents'
        if (!final.boundaryEast || final.boundaryEast === '') final.boundaryEast = ex.east || 'Not Mentioned in Documents'
        if (!final.boundaryWest || final.boundaryWest === '') final.boundaryWest = ex.west || 'Not Mentioned in Documents'
        if (!final.boundaryNorth || final.boundaryNorth === '') final.boundaryNorth = ex.north || 'Not Mentioned in Documents'
        if (!final.boundarySouth || final.boundarySouth === '') final.boundarySouth = ex.south || 'Not Mentioned in Documents'

        // Fix applicant name — never let seller be applicant
        if (!final.applicantName || final.applicantName === final.ownerName || final.applicantName === ex.seller) {
            final.applicantName = ex.borrower && ex.borrower !== ex.seller ? ex.borrower : 'As Per Draft Sale Deed'
        }

        // Ensure partII is array of objects not undefined
        if (!final.partII_titleFlow || !Array.isArray(final.partII_titleFlow)) {
            final.partII_titleFlow = [{"paraNo": 1, "content": "Title details as per documents submitted for scrutiny."}]
        }
        final.partII_titleFlow = final.partII_titleFlow.map((p: any, i: number) => ({
            paraNo: p.paraNo || i + 1,
            content: p.content || p.text || p.description || 'Refer submitted documents.'
        }))

        // Ensure partIII has issues
        if (!final.partIII_issues || !Array.isArray(final.partIII_issues) || final.partIII_issues.length === 0) {
            final.partIII_issues = [{"severity": "Low", "issue": "No major discrepancies noted in submitted documents.", "suggestion": "Bank may proceed with standard pre-disbursement conditions."}]
        }

        return NextResponse.json({ success: true, data: final })

    } catch (err: any) {
        console.error('API Error:', err)
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
    }
}
