// lib/generateReport.ts
// Complete 2-step pipeline — Haiku extract → Sonnet analyze

export async function generateReport(files: { base64: string; mediaType: string }[]) {

    // ═══════════════════════════════════
    // STEP 1 — Haiku: Extract raw data
    // ═══════════════════════════════════
    console.log('Step 1: Extracting with Haiku...');

    const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
    });

    const extractData = await extractRes.json();

    if (!extractData.success) {
        throw new Error('Extraction failed: ' + extractData.error);
    }

    console.log('Step 1 done. Tokens used:', extractData.tokens_used);
    // Typical: ~2000-4000 tokens with Haiku = ₹2-3

    // ═══════════════════════════════════
    // STEP 2 — Sonnet: Legal thinking
    // ═══════════════════════════════════
    console.log('Step 2: Legal analysis with Sonnet...');

    const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted: extractData.extracted }),
    });

    const analyzeData = await analyzeRes.json();

    if (!analyzeData.success) {
        throw new Error('Analysis failed: ' + analyzeData.error);
    }

    console.log('Step 2 done. Tokens used:', analyzeData.tokens_used);
    // Typical: ~3000-5000 tokens with Sonnet = ₹8-12

    return {
        report: analyzeData.report,
        extracted: extractData.extracted,
        cost_breakdown: {
            step1_haiku: extractData.tokens_used,
            step2_sonnet: analyzeData.tokens_used,
            cache_savings: analyzeData.tokens_used.cache_read || 0,
        },
    };
}

// ═══════════════════════════════════
// File to Base64 helper
// ═══════════════════════════════════
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ═══════════════════════════════════
// Usage in upload page:
// ═══════════════════════════════════
/*
import { generateReport, fileToBase64 } from '@/lib/generateReport';

const handleGenerate = async () => {
  const files = await Promise.all(
    uploadedFiles.map(async (file) => ({
      base64: await fileToBase64(file),
      mediaType: file.type, // 'application/pdf' or 'image/jpeg'
    }))
  );
  
  const result = await generateReport(files);
  console.log('Report JSON:', result.report);
  console.log('Cost breakdown:', result.cost_breakdown);
  
  // Pass result.report to Word generator (report/route.ts)
};
*/