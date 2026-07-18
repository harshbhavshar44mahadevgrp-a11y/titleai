import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { email, password, username } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }
        const uname = (username || '').trim();
        if (!uname || !/^[a-zA-Z0-9._ ]{3,24}$/.test(uname)) {
            return NextResponse.json({ error: 'Username zaroori hai (3-24 characters — letters, numbers, . _ )' }, { status: 400 });
        }

        // Username unique rahe — CRM mein dhundhna easy ho
        const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const taken = existing?.users?.some(
            u => (u.user_metadata?.username || '').toLowerCase() === uname.toLowerCase()
        );
        if (taken) {
            return NextResponse.json({ error: `Username "${uname}" pehle se liya hua hai — koi aur try karo` }, { status: 409 });
        }

        // Admin create with email_confirm — project ka "Confirm email" ON hai,
        // isse user bina confirmation mail ke turant login kar sakta hai.
        const { error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { username: uname },
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
