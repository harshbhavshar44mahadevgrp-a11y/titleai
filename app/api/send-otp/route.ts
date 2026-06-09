import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: email,
                subject: 'TITLEMATRIX.AI — Your OTP Code',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #020208; color: #fff; padding: 32px; border-radius: 12px;">
            <h2 style="color: #6366f1;">TITLEMATRIX.AI & Associates</h2>
            <p style="color: #aaa;">Your One-Time Password:</p>
            <div style="font-size: 40px; font-weight: 900; color: #f59e0b; letter-spacing: 8px; margin: 24px 0;">${otp}</div>
            <p style="color: #666; font-size: 13px;">Valid for 10 minutes. Do not share with anyone.</p>
          </div>
        `,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Resend error: ${err}`);
        }

        // Store OTP in response (frontend will save to localStorage temporarily)
        return NextResponse.json({ success: true, otp });

    } catch (error: any) {
        console.error('Send OTP error:', error);
        return NextResponse.json({ error: error.message || 'OTP send failed' }, { status: 500 });
    }
}