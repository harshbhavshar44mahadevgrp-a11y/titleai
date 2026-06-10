import jsPDF from "jspdf";

export interface TitleReportData {
    refNo?: string; date?: string; barCode?: string; appId?: string;
    bankBranch?: string; bankCity?: string;
    borrowerName?: string; borrowerAddress?: string; borrowerConstitution?: string;
    mortgagorName?: string; mortgagorConstitution?: string; presentOwner?: string;
    documentsVerified?: string[];
    propertyDescription?: string;
    boundaryEast?: string; boundaryWest?: string; boundaryNorth?: string; boundarySouth?: string;
    propertyNature?: string;
    titleFlow?: string[];
    tenureNature?: string;
    s6a?: string; s6b?: string; s6c?: string; s6d?: string; s6e?: string;
    s7a?: string; s7b?: string; s7c?: string; s7d?: string; s7e?: string;
    s8?: string; s9a?: string; s9b?: string;
    s10a?: string; s10b?: string; s10c?: string;
    s11?: string; s12?: string; s13?: string;
    s14a?: string; s14b?: string; s14c?: string; s14d?: string; s14e?: string; s14f?: string;
    s15a?: string; s15b?: string; s16?: string;
    s17a?: string; s17b?: string; s17c?: string;
    s18?: string; s19heading?: string;
    s19a?: string; s19b?: string; s19c?: string;
    s19ba?: string; s19bb?: string; s19bc?: string; s19bd?: string; s19be?: string; s19bf?: string;
    s20?: string; s21?: string; s22?: string; s23?: string; s24?: string;
    finalOpinion?: string;
    preDisbursement?: string[]; atPayOrder?: string[];
    postDisbursement?: string[]; mandatoryMortgage?: string[];
    place?: string; closingDate?: string; advocateName?: string;
    riskDetails?: Array<{ level: string; category: string; issue: string; suggestion: string }>;
    overallRisk?: string; keyRisks?: string[]; keyPositives?: string[];
    partI_documents?: Array<{ srNo: number; documentName: string; description: string }>;
    partII_titleFlow?: Array<{ paraNo: number; content: string }>;
    partIII_issues?: Array<{ severity: string; issue: string; suggestion: string }>;
    partIV_opinion?: string;
    applicantName?: string;
    ownerName?: string;
    constitution?: string;
    sroName?: string;
    surveyNo?: string;
    documentsRequired?: { preDisbursement: string[]; atPayOrder: string[]; postDisbursement: string[] };
}

const ML = 20
const MR = 20
const PW = 210
const TW = PW - ML - MR

export function handleDownloadPDF(data: TitleReportData): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const refNo = data.refNo || `TITLEMATRIXAI/${new Date().getFullYear()}/DP`
    const reportDate = data.date || new Date().toLocaleDateString('en-IN')
    const advocateName = data.advocateName || 'TITLEMATRIXAI Platform'
    const place = data.place || 'Ahmedabad'

    let y = 20

    // ── FONTS ──
    const setFont = (style: 'normal' | 'bold', size: number) => {
        doc.setFont('helvetica', style)
        doc.setFontSize(size)
    }

    // ── WRITE TEXT WITH WRAP ──
    const writeText = (text: string, x: number, yPos: number, maxWidth: number, lineHeight: number = 5): number => {
        if (!text) return yPos
        const lines = doc.splitTextToSize(text, maxWidth)
        lines.forEach((line: string) => {
            if (yPos > 270) {
                doc.addPage()
                yPos = 20
            }
            doc.text(line, x, yPos)
            yPos += lineHeight
        })
        return yPos
    }

    const checkPage = (yPos: number, needed: number = 20): number => {
        if (yPos + needed > 275) {
            doc.addPage()
            return 20
        }
        return yPos
    }

    // ── REPORT TITLE (no firm header) ──
    setFont('bold', 13)
    doc.text('LEGAL SCRUTINY REPORT', PW / 2, y, { align: 'center' })
    y += 7

    setFont('normal', 9)
    doc.text(`Ref. No. ${refNo}`, ML, y)
    doc.text(`Date: ${reportDate}`, PW - MR, y, { align: 'right' })
    y += 5

    doc.text('To,', ML, y); y += 4
    setFont('bold', 9)
    doc.text(`${data.bankBranch || 'Axis Bank Ltd.'},`, ML, y); y += 4
    doc.text(`${data.bankCity || 'Ahmedabad'}.`, ML, y); y += 8

    // ── BASIC DETAILS ──
    setFont('bold', 10)
    doc.text('A.   DETAILS OF THE BORROWER / MORTGAGOR:', ML, y); y += 5
    doc.setLineWidth(0.2)
    doc.line(ML, y, PW - MR, y); y += 4

    const details = [
        ['Name of Applicant:', data.applicantName || data.borrowerName || '—'],
        ['Name of Owner:', data.ownerName || data.presentOwner || '—'],
        ['Constitution:', data.constitution || data.borrowerConstitution || 'Individual'],
        ['Nature of Property:', data.propertyNature || 'Freehold Residential Flat'],
        ['SRO:', data.sroName || '—'],
        ['Survey No.:', data.surveyNo || '—'],
    ]

    details.forEach(([label, value]) => {
        setFont('bold', 9)
        doc.text(label, ML, y)
        setFont('normal', 9)
        y = writeText(value, ML + 45, y, TW - 45)
        y += 1
    })
    y += 4

    // ── PROPERTY DESCRIPTION ──
    setFont('bold', 9)
    doc.text('Description of Property:', ML, y); y += 4
    setFont('normal', 9)
    y = writeText(data.propertyDescription || '—', ML, y, TW)
    y += 5

    doc.line(ML, y, PW - MR, y); y += 6

    // ── PART I ──
    y = checkPage(y, 20)
    setFont('bold', 11)
    doc.text('PART I — LIST OF DOCUMENTS SUBMITTED FOR SCRUTINY', ML, y); y += 5
    doc.line(ML, y, PW - MR, y); y += 5

    const docs = data.partI_documents || []
    if (docs.length > 0) {
        docs.forEach((d) => {
            y = checkPage(y, 15)
            setFont('bold', 9)
            y = writeText(`${d.srNo}.   ${d.documentName}`, ML, y, TW)
            setFont('normal', 9)
            y = writeText(d.description, ML + 5, y, TW - 5)
            y += 4
        })
    } else {
        const docsVerified = data.documentsVerified || []
        docsVerified.forEach((d, i) => {
            y = checkPage(y, 10)
            setFont('normal', 9)
            y = writeText(`${i + 1}.   ${d}`, ML, y, TW)
            y += 2
        })
    }
    y += 4

    doc.line(ML, y, PW - MR, y); y += 6

    // ── PART II ──
    y = checkPage(y, 20)
    setFont('bold', 11)
    doc.text('PART II — FLOW OF TITLE OF PROPERTY (HISTORY OF TITLE)', ML, y); y += 5
    doc.line(ML, y, PW - MR, y); y += 5

    const titleFlow = data.partII_titleFlow || []
    if (titleFlow.length > 0) {
        titleFlow.forEach((para) => {
            y = checkPage(y, 20)
            setFont('normal', 9)
            y = writeText(`${para.paraNo}.   ${para.content}`, ML, y, TW)
            y += 4
        })
    } else {
        const flow = data.titleFlow || []
        flow.forEach((para, i) => {
            y = checkPage(y, 20)
            setFont('normal', 9)
            y = writeText(`${i + 1}.   ${para}`, ML, y, TW)
            y += 4
        })
    }
    y += 4

    doc.line(ML, y, PW - MR, y); y += 6

    // ── PART III ──
    y = checkPage(y, 20)
    setFont('bold', 11)
    doc.text('PART III — DISCREPANCIES / QUERIES NOTED', ML, y); y += 5
    doc.line(ML, y, PW - MR, y); y += 5

    const issues = data.partIII_issues || []
    if (issues.length === 0) {
        setFont('normal', 9)
        doc.text('No discrepancies noted. Title chain is complete and clear.', ML, y); y += 6
    } else {
        issues.forEach((issue) => {
            y = checkPage(y, 20)
            setFont('bold', 9)
            doc.text(`Severity: ${issue.severity}`, ML, y); y += 4
            setFont('normal', 9)
            y = writeText(`Issue: ${issue.issue}`, ML, y, TW)
            y = writeText(`Suggestion: ${issue.suggestion}`, ML, y, TW)
            y += 4
        })
    }
    y += 4

    doc.line(ML, y, PW - MR, y); y += 6

    // ── PART IV ──
    y = checkPage(y, 20)
    setFont('bold', 11)
    doc.text('PART IV — FINAL CERTIFICATE / OPINION', ML, y); y += 5
    doc.line(ML, y, PW - MR, y); y += 5

    setFont('normal', 9)
    const opinion = data.partIV_opinion || data.finalOpinion || '—'
    y = writeText(opinion, ML, y, TW)
    y += 8

    // ── DOCUMENTS REQUIRED ──
    y = checkPage(y, 20)
    doc.line(ML, y, PW - MR, y); y += 6
    setFont('bold', 11)
    doc.text('DOCUMENTS REQUIRED', ML, y); y += 5
    doc.line(ML, y, PW - MR, y); y += 5

    const preDis = data.documentsRequired?.preDisbursement || data.preDisbursement || []
    const atPay = data.documentsRequired?.atPayOrder || data.atPayOrder || []
    const postDis = data.documentsRequired?.postDisbursement || data.postDisbursement || []

    if (preDis.length > 0) {
        y = checkPage(y, 15)
        setFont('bold', 9)
        doc.text('PRE-DISBURSEMENT:', ML, y); y += 4
        setFont('normal', 9)
        preDis.forEach((d, i) => {
            y = checkPage(y, 8)
            y = writeText(`${i + 1}.   ${d}`, ML + 5, y, TW - 5)
            y += 1
        })
        y += 3
    }

    if (atPay.length > 0) {
        y = checkPage(y, 15)
        setFont('bold', 9)
        doc.text('AT PAY ORDER:', ML, y); y += 4
        setFont('normal', 9)
        atPay.forEach((d, i) => {
            y = checkPage(y, 8)
            y = writeText(`${i + 1}.   ${d}`, ML + 5, y, TW - 5)
            y += 1
        })
        y += 3
    }

    if (postDis.length > 0) {
        y = checkPage(y, 15)
        setFont('bold', 9)
        doc.text('POST DISBURSEMENT:', ML, y); y += 4
        setFont('normal', 9)
        postDis.forEach((d, i) => {
            y = checkPage(y, 8)
            y = writeText(`${i + 1}.   ${d}`, ML + 5, y, TW - 5)
            y += 1
        })
        y += 5
    }

    // ── CLOSING ──
    y = checkPage(y, 40)
    doc.line(ML, y, PW - MR, y); y += 8

    setFont('normal', 9)
    doc.text('I hope everything is in order and meets your expectations.', ML, y); y += 8
    doc.text(`Place: ${place}.`, ML, y); y += 5
    doc.text(`Date: ${reportDate}`, ML, y); y += 12

    doc.text('Yours Truly,', PW - MR, y, { align: 'right' }); y += 20

    setFont('bold', 10)
    doc.text(advocateName, PW - MR, y, { align: 'right' }); y += 5
    setFont('normal', 8)
    doc.text('TITLEMATRIXAI', PW - MR, y, { align: 'right' }); y += 4
    doc.text('(Seal & Signature)', PW - MR, y, { align: 'right' }); y += 10

    // ── FOOTER LINE ──
    doc.setLineWidth(0.3)
    doc.line(ML, 285, PW - MR, 285)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('support@titlematrixai.com', ML, 290)
    doc.text('www.titlematrixai.com', PW - MR, 290, { align: 'right' })
    doc.text(`${refNo} | CONFIDENTIAL`, PW / 2, 290, { align: 'center' })

    // ── DISCLAIMER ──
    doc.addPage()
    let dy = 20
    setFont('bold', 10)
    doc.text('NOTES / DISCLAIMER:', ML, dy); dy += 6
    setFont('normal', 8)
    const disclaimers = [
        'This report is generated by TITLEMATRIXAI based on the documents provided.',
        'Authenticity of the original documents has not been physically verified and is assumed to be true.',
        'This report does not comment on the technical regularity (adherence to bye-laws/approvals) of the said property.',
        'It is advised to physically verify the property and ensure there is no tenant or dispute over possession.',
        'This AI-generated report should be reviewed and verified by a qualified legal professional before making any financial decisions.',
    ]
    disclaimers.forEach((d, i) => {
        dy = writeText(`${i + 1}.   ${d}`, ML, dy, TW)
        dy += 2
    })

    // ── SAVE ──
    const name = (data.applicantName || data.borrowerName || 'Report').replace(/[^a-zA-Z0-9]/g, '_')
    doc.save(`TITLEMATRIXAI_${name}_${reportDate.replace(/\//g, '-')}.pdf`)
}
