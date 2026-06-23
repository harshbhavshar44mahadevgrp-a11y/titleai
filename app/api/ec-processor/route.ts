// ================================================================
// app/api/ec-processor/route.ts
// STAGE 1: EC-ONLY extraction -- returns structured JSON
// AI sirf data padhta hai. CODE mortgage/release decide karta hai.
// ================================================================
export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// ================================================================
// BANK NAMES -- CODE level detection (deterministic)
// ================================================================
const BANK_PATTERNS = [
  'BANK', 'FINANCE', 'HOUSING FINANCE', 'FINANCIAL SERVICES',
  'NBFC', 'CAPITAL', 'FINCORP', 'HOME FINANCE', 'CREDIT',
  'BAJAJ', 'HDFC', 'SBI', 'AXIS', 'ICICI', 'KOTAK',
  'PNB', 'BOI', 'CANARA', 'UNION', 'BANK OF BARODA',
  'INDIABULLS', 'LIC', 'LICHFL', 'REPCO', 'PIRAMAL',
  'MUTHOOT', 'TATA CAPITAL', 'ADITYA BIRLA', 'INDIA BULLS',
  'FULLERTON', 'AAVAS', 'HOME FIRST', 'APTUS', 'SHRIRAM',
]

function isBank(name: string): boolean {
  if (!name) return false
  const upper = name.toUpperCase()
  return BANK_PATTERNS.some(pattern => upper.includes(pattern))
}

// ================================================================
// MORTGAGE LIFECYCLE ENGINE -- Pure code, zero AI
// Takes structured EC rows, returns definitive mortgage status
// ================================================================
interface ECRow {
  row_number: number
  col1_raw_text: string       // Raw type text from EC
  col2_property: string       // Property description
  col3_aapnar: string         // Executing party
  col4_lenar: string          // Claimant party
  col5_date: string           // Registration date
  col6_deed_no: string        // Deed/Registration number
}

interface ChargeRecord {
  charge_id: string
  mortgage_row: number
  lender: string
  borrower: string
  deed_no: string
  date: string
  status: 'ACTIVE' | 'RELEASED'
  released_by?: {
    row: number
    deed_no: string
    date: string
  }
}

interface LifecycleResult {
  charges: ChargeRecord[]
  active_mortgages: ChargeRecord[]
  released_mortgages: ChargeRecord[]
  unmatched_releases: Array<{row: number, bank: string, deed_no: string}>
  encumbrance_status: 'CLEAR' | 'ENCUMBERED' | 'CLEAR_WITH_PRIOR_RELEASE'
  summary: string
}

function runMortgageLifecycle(rows: ECRow[]): LifecycleResult {
  const charges: ChargeRecord[] = []
  const unmatched_releases: Array<{row: number, bank: string, deed_no: string}> = []

  // PASS 1: Create charge records for all MORTGAGE rows
  // Rule: col4 (Lenar/Claimant) = Bank - MORTGAGE
  for (const row of rows) {
    if (isBank(row.col4_lenar) && !isBank(row.col3_aapnar)) {
      charges.push({
        charge_id: `CHARGE_${row.row_number}`,
        mortgage_row: row.row_number,
        lender: row.col4_lenar,
        borrower: row.col3_aapnar,
        deed_no: row.col6_deed_no,
        date: row.col5_date,
        status: 'ACTIVE',
      })
    }
  }

  // PASS 2: Find all RELEASE rows and match with charges
  // ROLE FLIP RULE: col3 (Aapnar/Executing) = Bank - RELEASE
  for (const row of rows) {
    if (isBank(row.col3_aapnar)) {
      // Find matching charge where lender = this bank
      const bankUpper = row.col3_aapnar.toUpperCase()
      const matchedCharge = charges.find(c => {
        const lenderUpper = c.lender.toUpperCase()
        // Match if bank names share first significant word
        const bankWords = bankUpper.split(' ').filter(w => w.length > 3)
        return bankWords.some(word => lenderUpper.includes(word))
      })

      if (matchedCharge) {
        matchedCharge.status = 'RELEASED'
        matchedCharge.released_by = {
          row: row.row_number,
          deed_no: row.col6_deed_no,
          date: row.col5_date,
        }
      } else {
        // Release found but no matching mortgage in EC period
        unmatched_releases.push({
          row: row.row_number,
          bank: row.col3_aapnar,
          deed_no: row.col6_deed_no,
        })
      }
    }
  }

  const active = charges.filter(c => c.status === 'ACTIVE')
  const released = charges.filter(c => c.status === 'RELEASED')

  let encumbrance_status: LifecycleResult['encumbrance_status']
  if (active.length === 0 && released.length === 0) {
    encumbrance_status = 'CLEAR'
  } else if (active.length > 0) {
    encumbrance_status = 'ENCUMBERED'
  } else {
    encumbrance_status = 'CLEAR_WITH_PRIOR_RELEASE'
  }

  const summary = active.length === 0
    ? released.length > 0
      ? `Encumbrance CLEAR. Prior mortgage(s) by ${released.map(r => r.lender).join(', ')} fully released and satisfied.`
      : 'No mortgage found in EC. Property is clear of encumbrance.'
    : `ACTIVE MORTGAGE: ${active.map(a => `${a.lender} (Deed No. ${a.deed_no} dated ${a.date})`).join('; ')}. Charge is outstanding.`

  return { charges, active_mortgages: active, released_mortgages: released, unmatched_releases, encumbrance_status, summary }
}

// ================================================================
// API HANDLER
// ================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ecImages } = body // Array of {data: base64, mediaType: 'image/png'}

    if (!ecImages?.length) {
      return NextResponse.json({ success: false, error: 'No EC images provided' })
    }

    // Build Claude message with EC images
    const content: any[] = []
    for (const img of ecImages) {
      content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } })
    }

    content.push({
      type: 'text',
      text: `You are a data extraction engine. Extract the EC table data as JSON.

STRICT RULES:
- Col 1 = Type of Deed (first column)
- Col 2 = Property Description (second column)  
- Col 3 = Executing Party / Aapnar (third column) -- who GIVES/EXECUTES
- Col 4 = Claimant Party / Lenar (fourth column) -- who RECEIVES
- Col 5 = Date of Registration (fifth column)
- Col 6 = Registration/Deed Number (sixth/second-last column)
- Col 7 (LAST column) = DO NOT EXTRACT. IGNORE COMPLETELY.
- EC Applicant name from header = IGNORE. Not a party to any transaction.

Extract EVERY row. Do not skip any row including the last row.

Output ONLY valid JSON in this exact format:
{
  "ec_app_number": "string",
  "ec_date": "string",
  "ec_from": "string",
  "ec_to": "string",
  "rows": [
    {
      "row_number": 1,
      "col1_raw_text": "exact text from col 1",
      "col2_property": "property description",
      "col3_aapnar": "executing party full name",
      "col4_lenar": "claimant party full name",
      "col5_date": "DD/MM/YYYY",
      "col6_deed_no": "registration number"
    }
  ]
}

Output ONLY the JSON object. No explanation. No markdown.`
    })

    const res = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content }]
    })

    const rawText = res.content[0].type === 'text' ? res.content[0].text : '{}'
    const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let ecData: any
    try {
      ecData = JSON.parse(cleanJson)
    } catch {
      return NextResponse.json({ success: false, error: 'EC JSON parse failed', raw: rawText })
    }

    // Run deterministic mortgage lifecycle analysis (pure code -- no AI)
    const rows: ECRow[] = ecData.rows || []
    const lifecycle = runMortgageLifecycle(rows)

    return NextResponse.json({
      success: true,
      ec_app_number: ecData.ec_app_number || '',
      ec_date: ecData.ec_date || '',
      ec_from: ecData.ec_from || '',
      ec_to: ecData.ec_to || '',
      row_count: rows.length,
      rows,
      lifecycle,
    })

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
