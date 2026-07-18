import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Admin create with email_confirm — project ka "Confirm email" ON hai,
        // isse user bina confirmation mail ke turant login kar sakta hai.
        const { error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) {
            // Pehle se registered hai toh page ka signInWithPassword aage sambhal lega
            if (error.message.toLowerCase().includes('already') || error.code === 'email_exists') {
                return NextResponse.json({ success: true, existing: true });
            }
            throw new Error(error.message);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Auth signup error:', error);
        return NextResponse.json({ error: error.message || 'Signup failed' }, { status: 500 });
    }
}
