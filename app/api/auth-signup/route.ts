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

        const password = `${email}_titleai_2026`;

        // Create user in Supabase
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error && !error.message.includes('already registered')) {
            throw new Error(error.message);
        }

        // Sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) throw new Error(signInError.message);

        return NextResponse.json({ success: true, session: signInData.session, user: signInData.user });

    } catch (error: any) {
        console.error('Auth signup error:', error);
        return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
    }
}