import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { files } = body;

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        const haikuBlocks: any[] = files.map((f: any) => ({
            type: 'document',
            source: {
                type: 'base64',
                media_type: f.mediaType || 'application/pdf',
                data: f.base64,
            },
        }));

        haikuBlocks.push({
            type: 'text',
            text: `Extract ALL data from these Gujarat property documents. Translate ALL Gujarati text to English.
Be thorough — miss nothing. Every number, date, name, survey no must be captured.

Return ONLY valid JSON — no markdown, no explanation:
{
  "documents_found": [
    {
      "type": "",
      "doc_number": "",
      "date": "",
      "from_party": "",
      "to_party": "",
      "consideration": "",
      "property_description": "",
      "sro": "",
      "stamp_duty": "",
      "remarks": ""
    }
  ],
  "property": {
    "survey_no": "",
    "sub_plot_no": "",
    "fp_no": "",
    "tps_no": "",
    "scheme_name": "",
    "flat_no": "",
    "floor": "",
    "block_no": "",
    "carpet_area": "",
    "built_up_area": "",
    "undivided_share": "",
    "village": "",
    "taluka": "",
    "district": "",
    "area_sqmt": "",
    "land_use": "",
    "boundaries": { "north": "", "south": "", "east": "", "west": "" }
  },
  "ec_data": {
    "search_by": "",
    "search_period": "",
    "sro": "",
    "epayment_no": "",
    "entries": [
      {
        "doc_no": "",
        "date": "",
        "type": "",
        "first_party": "",
        "second_party": "",
        "consideration": "",
        "remarks": ""
      }
    ],
    "status": "CLEAR"
  },
  "seven_twelve": {
    "survey_no": "",
    "owner_name": "",
    "area": "",
    "land_use": "",
    "tenure": "",
    "boja_column": "NIL",
    "ganoat": "NIL",
    "mutation_no": "",
    "mutation_date": "",
    "potakharab": ""
  },
  "na_order": {
    "order_no": "",
    "date": "",
    "authority": "",
    "applicant": "",
    "survey_no": "",
    "area": ""
  },
  "permissions": [
    {
      "type": "",
      "permission_no": "",
      "date": "",
      "issued_by": "",
      "details": ""
    }
  ],
  "rera": {
    "registration_no": "",
    "date": "",
    "valid_upto": "",
    "project_name": ""
  },
  "applicant": {
    "name": "",
    "pan": "",
    "address": "",
    "contact": ""
  },
  "bank_file": {
    "file_no": "",
    "barcode": "",
    "product": "",
    "bank": "",
    "loan_type": "",
    "loan_amount": "",
    "dsa": "",
    "sm_name": ""
  },
  "mutations": [
    {
      "mutation_no": "",
      "date": "",
      "reason": "",
      "from_party": "",
      "to_party": "",
      "certified_by": ""
    }
  ]
}`,
        });

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 4000,
                messages: [{ role: 'user', content: haikuBlocks }],
            }),
            signal: AbortSignal.timeout(280000),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Claude API error ${res.status}: ${err}`);
        }

        const data = await res.json();
        const text = data.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('');

        const extracted = JSON.parse(text.replace(/```json|```/g, '').trim());

        return NextResponse.json({ success: true, data: extracted });

    } catch (error: any) {
        console.error('Extract route error:', error);
        return NextResponse.json({ error: error.message || 'Extraction failed' }, { status: 500 });
    }
}