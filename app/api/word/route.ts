import { NextRequest, NextResponse } from 'next/server';
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
    Header, Footer
} from 'docx';

const DARK_BLUE = '1B3A6B';
const GOLD = 'B8860B';
const LIGHT_GRAY = 'F2F2F2';
const WHITE = 'FFFFFF';
const GREEN_BG = 'E8F5E9';
const AMBER_BG = 'FFF8E1';

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const thickBorder = { style: BorderStyle.SINGLE, size: 12, color: DARK_BLUE };
const thickBorders = { top: thickBorder, bottom: thickBorder, left: thickBorder, right: thickBorder };

function sp(before = 0, after = 80) { return { before, after }; }

function para(text: string, opts: any = {}) {
    return new Paragraph({
        spacing: sp(opts.before || 0, opts.after !== undefined ? opts.after : 80),
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({
            text: text || '',
            bold: opts.bold || false,
            italics: opts.italic || false,
            size: opts.size || 20,
            color: opts.color || '000000',
            font: 'Arial',
        })],
    });
}

function emptyLine() { return new Paragraph({ spacing: sp(0, 60) }); }

function sectionTitle(text: string) {
    return new Paragraph({
        spacing: sp(160, 100),
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: DARK_BLUE, space: 1 } },
        children: [
            new TextRun({
                text: '  ' + text, bold: true, size: 22, color: WHITE, font: 'Arial',
            }),
        ],
        shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
    });
}

function cell(text: string, opts: any = {}) {
    return new TableCell({
        borders,
        width: { size: opts.width || 4680, type: WidthType.DXA },
        shading: { fill: opts.fill || WHITE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        columnSpan: opts.span,
        children: [new Paragraph({
            alignment: opts.align || AlignmentType.LEFT,
            children: [new TextRun({
                text: text || '—',
                bold: opts.bold || false,
                size: opts.size || 18,
                color: opts.color || '000000',
                font: 'Arial',
                italics: opts.italic || false,
            })],
        })],
    });
}

function twoColRow(label: string, value: string, labelWidth = 2800, valueWidth = 6560) {
    return new TableRow({
        children: [
            cell(label, { width: labelWidth, fill: LIGHT_GRAY, bold: true, size: 18 }),
            cell(value || '—', { width: valueWidth, size: 18 }),
        ]
    });
}

export async function POST(req: NextRequest) {
    try {
        const { data: r } = await req.json();
        if (!r) return NextResponse.json({ error: 'No report data' }, { status: 400 });

        const meta = r.reportMeta || {};
        const s1 = r.section1_basicDetails || {};
        const s2 = r.section2_propertyDescription || {};
        const s3 = r.section3_documentsVerified || [];
        const s4 = r.section4_titleChain || [];
        const s5 = r.section5_riskAnalysis || {};
        const s6 = r.section6_documentDemand || {};
        const s7 = r.section7_legalQA || {};
        const s8 = r.section8_finalOpinion || {};
        const ec = r.ecEntries || [];

        const header = new Header({
            children: [
                new Paragraph({
                    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: DARK_BLUE, space: 1 } },
                    spacing: sp(0, 80),
                    children: [
                        new TextRun({ text: 'TitleAI', bold: true, size: 28, color: DARK_BLUE, font: 'Arial' }),
                        new TextRun({ text: ' & ASSOCIATES', bold: true, size: 24, color: GOLD, font: 'Arial' }),
                        new TextRun({ text: `   |   TITLE SEARCH REPORT   |   Ref: ${meta.refNo || ''}   |   Date: ${meta.date || ''}`, size: 16, color: '666666', font: 'Arial' }),
                    ],
                }),
            ],
        });

        const footer = new Footer({
            children: [
                new Paragraph({
                    border: { top: { style: BorderStyle.SINGLE, size: 4, color: DARK_BLUE, space: 1 } },
                    spacing: sp(60, 0),
                    children: [
                        new TextRun({ text: 'TitleAI & Associates  |  support@titleai.in  |  www.titleai.in  |  CONFIDENTIAL', size: 16, color: '888888', font: 'Arial' }),
                    ],
                }),
            ],
        });

        const titleTable = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [new TableRow({
                children: [new TableCell({
                    borders: thickBorders,
                    shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
                    margins: { top: 160, bottom: 160, left: 240, right: 240 },
                    children: [
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'SUB: DOCUMENT SCRUTINY REPORT', bold: true, size: 32, color: WHITE, font: 'Arial' })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(60, 60), children: [new TextRun({ text: `${meta.bankName || 'Axis Bank Ltd.'}   |   ${meta.caseTypeLabel || ''}`, size: 20, color: 'AAAAAA', font: 'Arial' })] }),
                        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Ref. No.: ${meta.refNo || ''}   |   Date: ${meta.date || ''}`, size: 18, color: GOLD, font: 'Arial' })] }),
                    ],
                })]
            })]
        });

        const sec1Table = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2800, 6560],
            rows: [
                twoColRow('Applicant / Mortgagor (Proposed)', s1.applicantName),
                twoColRow('PAN No. (Vendee)', s1.panVendee),
                twoColRow('Address (Vendee)', s1.addressVendee),
                twoColRow('Constitution', s1.constitution || 'Individual'),
                twoColRow('Current Owner / Vendor', s1.currentOwner),
                twoColRow('PAN No. (Vendor)', s1.panVendor),
                twoColRow('DOB (Vendor)', s1.dobVendor),
                twoColRow('Vendor Address', s1.addressVendor),
                twoColRow('Loan Purpose', s1.loanPurpose),
                twoColRow('Proposed Sale Consideration', s1.saleConsideration),
                twoColRow('Token Amount Paid', s1.tokenAmount),
                twoColRow('Type of Mortgage', s1.mortgageType || 'Registered Mortgage Deed (Proposed)'),
                twoColRow('SRO Jurisdiction', s1.sroJurisdiction),
                twoColRow('Searching Advocate', s1.searchingAdvocate || 'TitleAI & Associates'),
            ],
        });

        const sec2Table = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2800, 6560],
            rows: [
                twoColRow('Scheme / Building Name', s2.schemeName),
                twoColRow('Flat No.', s2.flatNo),
                twoColRow('Block No.', s2.blockNo),
                twoColRow('Floor', s2.floor),
                twoColRow('Super Built Up Area', s2.superBuiltUpArea),
                twoColRow('Undivided Share (Built Up)', s2.undividedShare),
                twoColRow('Scheme Land Area', s2.schemeLandArea),
                twoColRow('Revenue Survey No.', s2.surveyNo),
                twoColRow('Final Plot No. (TPS)', s2.finalPlotNo),
                twoColRow('Town Planning Scheme No.', s2.tpsNo),
                twoColRow('Mouje (Village)', s2.mouje),
                twoColRow('Taluka', s2.taluka),
                twoColRow('District', s2.district),
                twoColRow('Registration District', s2.registrationDistrict),
                twoColRow('Land Nature', s2.landNature || 'Non-Agricultural (Bin Kheti) ✓'),
                twoColRow('Municipal Tenement No.', s2.municipalTenementNo),
                twoColRow('Boundary — East', s2.boundaryEast),
                twoColRow('Boundary — West', s2.boundaryWest),
                twoColRow('Boundary — North', s2.boundaryNorth),
                twoColRow('Boundary — South', s2.boundarySouth),
            ],
        });

        const sec3Rows = [
            new TableRow({
                children: [
                    cell('Sr.', { width: 500, fill: DARK_BLUE, bold: true, color: WHITE, size: 18 }),
                    cell('Document Type', { width: 2200, fill: DARK_BLUE, bold: true, color: WHITE, size: 18 }),
                    cell('Doc. No. / Ref.', { width: 1500, fill: DARK_BLUE, bold: true, color: WHITE, size: 18 }),
                    cell('Date', { width: 900, fill: DARK_BLUE, bold: true, color: WHITE, size: 18 }),
                    cell('Parties', { width: 2760, fill: DARK_BLUE, bold: true, color: WHITE, size: 18 }),
                    cell('Status', { width: 1500, fill: DARK_BLUE, bold: true, color: WHITE, size: 18 }),
                ]
            }),
            ...s3.map((d: any) => new TableRow({
                children: [
                    cell(String(d.srNo || ''), { width: 500, fill: LIGHT_GRAY }),
                    cell(d.documentType || '', { width: 2200 }),
                    cell(d.docNo || '', { width: 1500 }),
                    cell(d.date || '', { width: 900 }),
                    cell(d.parties || '', { width: 2760 }),
                    cell(d.status || '', {
                        width: 1500,
                        fill: (d.status || '').includes('✓') ? GREEN_BG : (d.status || '').includes('⚠') ? AMBER_BG : WHITE,
                        color: (d.status || '').includes('✓') ? '1B5E20' : (d.status || '').includes('⚠') ? '7B4F00' : '000000',
                    }),
                ]
            })),
        ];

        const sec3Table = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [500, 2200, 1500, 900, 2760, 1500],
            rows: sec3Rows,
        });

        const titleChainParas: any[] = [];
        s4.forEach((p: any) => {
            titleChainParas.push(new Paragraph({
                spacing: sp(120, 60),
                children: [new TextRun({ text: `PARA ${p.paraNo} — ${p.heading || ''}`, bold: true, size: 20, color: DARK_BLUE, font: 'Arial' })],
            }));
            titleChainParas.push(new Paragraph({
                spacing: sp(0, 120),
                children: [new TextRun({ text: p.content || '', size: 19, font: 'Arial', color: '222222' })],
            }));
        });

        const ecRows = [
            new TableRow({
                children: [
                    cell('Sr.', { width: 500, fill: DARK_BLUE, bold: true, color: WHITE }),
                    cell('Doc. No.', { width: 800, fill: DARK_BLUE, bold: true, color: WHITE }),
                    cell('Date', { width: 900, fill: DARK_BLUE, bold: true, color: WHITE }),
                    cell('First Party', { width: 2080, fill: DARK_BLUE, bold: true, color: WHITE }),
                    cell('Second Party / Bank', { width: 2080, fill: DARK_BLUE, bold: true, color: WHITE }),
                    cell('Remarks', { width: 3000, fill: DARK_BLUE, bold: true, color: WHITE }),
                ]
            }),
            ...ec.map((e: any) => new TableRow({
                children: [
                    cell(String(e.srNo || ''), { width: 500, fill: LIGHT_GRAY }),
                    cell(e.docNo || '', { width: 800 }),
                    cell(e.date || '', { width: 900 }),
                    cell(e.firstParty || '', { width: 2080 }),
                    cell(e.secondParty || '', { width: 2080 }),
                    cell(e.remarks || '', { width: 3000 }),
                ]
            })),
        ];

        const ecTable = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [500, 800, 900, 2080, 2080, 3000],
            rows: ecRows,
        });

        const riskParas: any[] = [];
        const riskColor = (s5.overallRisk || 'LOW').toUpperCase().includes('HIGH') ? 'C00000' :
            (s5.overallRisk || 'LOW').toUpperCase().includes('MEDIUM') ? 'B8500A' : '1E7A1E';

        riskParas.push(new Paragraph({
            spacing: sp(80, 80),
            children: [new TextRun({ text: `OVERALL RISK: ${s5.overallRisk || 'LOW'}`, bold: true, size: 22, color: riskColor, font: 'Arial' })],
        }));

        if (s5.positiveObservations?.length > 0) {
            riskParas.push(new Paragraph({ spacing: sp(80, 60), children: [new TextRun({ text: '5A. POSITIVE OBSERVATIONS — LOW RISK:', bold: true, size: 20, color: '1E7A1E', font: 'Arial' })] }));
            s5.positiveObservations.forEach((obs: string) => {
                riskParas.push(new Paragraph({ spacing: sp(0, 40), children: [new TextRun({ text: `✓  ${obs}`, size: 18, color: '1E7A1E', font: 'Arial' })] }));
            });
        }

        if (s5.conditions?.length > 0) {
            riskParas.push(emptyLine());
            riskParas.push(new Paragraph({ spacing: sp(80, 60), children: [new TextRun({ text: '5B. CONDITIONS / MEDIUM RISK OBSERVATIONS:', bold: true, size: 20, color: 'B8500A', font: 'Arial' })] }));
            s5.conditions.forEach((c: any) => {
                if (!c.title) return;
                riskParas.push(new Paragraph({ spacing: sp(80, 40), children: [new TextRun({ text: `⚠  CONDITION ${c.conditionNo}: ${c.title}`, bold: true, size: 19, color: 'B8500A', font: 'Arial' })] }));
                riskParas.push(new Paragraph({ spacing: sp(0, 80), children: [new TextRun({ text: c.description || '', size: 18, font: 'Arial', italics: true })] }));
            });
        }

        const demandParas: any[] = [];
        const demandSections = [
            { title: 'PRE-DISBURSEMENT — MANDATORY:', items: s6.preDisbursement || [], color: DARK_BLUE },
            { title: 'AT PAY ORDER:', items: s6.atPayOrder || [], color: '8B0000' },
            { title: 'POST DISBURSEMENT:', items: s6.postDisbursement || [], color: '555555' },
        ];

        demandSections.forEach(ds => {
            if (ds.items.length > 0) {
                demandParas.push(new Paragraph({ spacing: sp(100, 60), children: [new TextRun({ text: ds.title, bold: true, size: 20, color: ds.color, font: 'Arial' })] }));
                ds.items.forEach((item: string) => {
                    demandParas.push(new Paragraph({ spacing: sp(0, 40), children: [new TextRun({ text: `—  ${item}`, size: 18, font: 'Arial' })] }));
                });
                demandParas.push(emptyLine());
            }
        });

        const qaItems = [
            ['Q1. Nature of Title', s7.q1_natureOfTitle],
            ['Q2. Tenure', s7.q2_tenure],
            ['Q3. Area', s7.q3_area],
            ['Q4. Occupancy', s7.q4_occupancy],
            ['Q5. Local Body', s7.q5_localBody],
            ['Q6. NA Conversion', s7.q6_naConversion],
            ['Q7. Construction Permission', s7.q7_constructionPermission],
            ['Q8. EC Search', s7.q8_ecSearch],
            ['Q9. Encumbrances', s7.q9_encumbrances],
            ['Q10. Stamp Duty (Sale Deed)', s7.q10_stampDutySaleDeed],
            ['Q11. Mortgage Stamp Duty', s7.q11_mortgageStampDuty],
            ['Q12. RERA Status', s7.q12_reraStatus],
            ['Q13. Litigation Status', s7.q13_litigationStatus],
            ['Q14. ROC / CERSAI', s7.q14_rocCersai],
            ['Q15. Bank Lien Recording', s7.q15_bankLienRecording],
        ];

        const qaTable = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2400, 6960],
            rows: qaItems.map(([q, a]) => twoColRow(q as string, (a as string) || 'N/A', 2400, 6960)),
        });

        const opinionColor = s8.titleStatus === 'NOT_CLEAR' ? 'C00000' :
            s8.titleStatus === 'CLEAR_SUBJECT_TO' ? 'B8500A' : '1B6B1B';

        const opinionBox = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [
                new TableRow({
                    children: [new TableCell({
                        borders: thickBorders,
                        shading: { fill: opinionColor, type: ShadingType.CLEAR },
                        margins: { top: 120, bottom: 120, left: 240, right: 240 },
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: `⚖  ${s8.opinionHeading || 'TITLE IS CLEAR AND MARKETABLE'}`, bold: true, size: 26, color: WHITE, font: 'Arial' })],
                        })],
                    })]
                }),
                new TableRow({
                    children: [new TableCell({
                        borders,
                        margins: { top: 160, bottom: 160, left: 240, right: 240 },
                        children: [new Paragraph({
                            children: [new TextRun({ text: s8.opinionParagraph || '', size: 19, font: 'Arial', italics: true })],
                        })],
                    })]
                }),
            ],
        });

        const conditionParas: any[] = [];
        if (s8.conditions?.length > 0) {
            conditionParas.push(new Paragraph({
                spacing: sp(120, 60),
                children: [new TextRun({ text: '— SUBJECT TO THE FOLLOWING CONDITIONS —', bold: true, size: 20, color: opinionColor, font: 'Arial' })],
            }));
            s8.conditions.forEach((c: string) => {
                conditionParas.push(new Paragraph({
                    spacing: sp(0, 60),
                    children: [new TextRun({ text: `—  ${c}`, size: 18, font: 'Arial' })],
                }));
            });
        }

        const signatureTable = new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [4680, 4680],
            rows: [new TableRow({
                children: [
                    new TableCell({
                        borders,
                        margins: { top: 120, bottom: 120, left: 160, right: 160 },
                        children: [
                            para(`Place: Ahmedabad / Gandhinagar`),
                            para(`Date: ${meta.date || ''}`),
                        ],
                    }),
                    new TableCell({
                        borders,
                        margins: { top: 120, bottom: 120, left: 160, right: 160 },
                        children: [
                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Adv. TitleAI & Associates', bold: true, size: 20, color: DARK_BLUE, font: 'Arial' })] }),
                            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: sp(0, 300), children: [new TextRun({ text: 'Empanelled Property Advocate — Gujarat', size: 18, color: GOLD, font: 'Arial' })] }),
                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '(Seal & Signature)', size: 16, color: '888888', font: 'Arial', italics: true })] }),
                            new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: '__________________________', size: 18, font: 'Arial' })] }),
                        ],
                    }),
                ]
            })]
        });

        const doc = new Document({
            styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
            sections: [{
                properties: {
                    page: {
                        size: { width: 12240, height: 15840 },
                        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
                    },
                },
                headers: { default: header },
                footers: { default: footer },
                children: [
                    emptyLine(), titleTable, emptyLine(),
                    sectionTitle('SECTION 1 — BASIC DETAILS OF LOAN / MORTGAGE'),
                    emptyLine(), sec1Table, emptyLine(),
                    sectionTitle('SECTION 2 — DESCRIPTION OF SUBJECT PROPERTY'),
                    emptyLine(), sec2Table, emptyLine(),
                    sectionTitle('SECTION 3 — LIST OF DOCUMENTS RECEIVED & VERIFIED'),
                    emptyLine(), sec3Table, emptyLine(),
                    sectionTitle('SECTION 4 — TITLE CHAIN (OWNERSHIP HISTORY)'),
                    emptyLine(), ...titleChainParas,
                    sectionTitle('ENCUMBRANCE CERTIFICATE — 14 YEAR EC ENTRIES'),
                    emptyLine(), ecTable, emptyLine(),
                    new Paragraph({
                        spacing: sp(60, 100),
                        children: [new TextRun({ text: `EC STATUS: ${r.ecStatus || 'CLEAR'}`, bold: true, size: 20, color: (r.ecStatus || 'CLEAR') === 'CLEAR' ? '1E7A1E' : 'C00000', font: 'Arial' })],
                    }),
                    emptyLine(),
                    sectionTitle('SECTION 5 — RISK ANALYSIS'),
                    emptyLine(), ...riskParas, emptyLine(),
                    sectionTitle('SECTION 6 — DOCUMENT DEMAND LIST'),
                    emptyLine(), ...demandParas,
                    sectionTitle('SECTION 7 — LEGAL QUESTIONS & ANSWERS'),
                    emptyLine(), qaTable, emptyLine(),
                    sectionTitle('SECTION 8 — FINAL TITLE OPINION'),
                    emptyLine(), opinionBox, emptyLine(),
                    ...conditionParas, emptyLine(),
                    sectionTitle("SECTION 9 — ADVOCATE'S DECLARATION"),
                    emptyLine(),
                    new Paragraph({
                        spacing: sp(0, 120),
                        children: [new TextRun({ text: 'I hope everything is in order and the details furnished above are true to the best of my knowledge and belief. The opinion expressed herein is based on the documents provided to me and searches conducted by me. I am not responsible for any facts or documents not disclosed to me or not submitted for examination.', size: 18, font: 'Arial', italics: true })],
                    }),
                    emptyLine(), signatureTable, emptyLine(),
                    new Paragraph({
                        alignment: AlignmentType.CENTER, spacing: sp(80, 0),
                        children: [new TextRun({ text: `TitleAI & Associates  |  support@titleai.in  |  +91 98765 43210  |  www.titleai.in`, size: 16, color: '888888', font: 'Arial' })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `Ref: ${meta.refNo || ''}  |  Generated: ${meta.date || ''}  |  This report is computer generated and digitally authenticated by TitleAI & Associates.`, size: 14, color: 'AAAAAA', font: 'Arial', italics: true })],
                    }),
                ],
            }],
        });

        const buffer = await Packer.toBuffer(doc);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="TitleAI_Report_${(meta.refNo || 'Report').replace(/\//g, '_')}.docx"`,
            },
        });

    } catch (error: any) {
        console.error('Word generation error:', error);
        return NextResponse.json({ error: error.message || 'Word generation failed' }, { status: 500 });
    }
}