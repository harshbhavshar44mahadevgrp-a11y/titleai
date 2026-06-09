import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { email, otp, submittedOtp } = await req.json();

        if (!email || !otp || !submittedOtp) {
            return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
        }

        if (otp !== submittedOtp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
        }

        const password = `${email}_TITLEMATRIX.AI_2026`;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, session: data.session, user: data.user });

    } catch (error: any) {
        console.error('Auth login error:', error);
        return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
    }
}