import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This is a temporary endpoint to set up the first admin user
// You should remove or secure this endpoint after setting up your admin user
export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { email, adminSecret } = requestData;

    // Check if the admin secret is correct - replace this with your own secret
    // This is a simple security measure to prevent unauthorized access
    const ADMIN_SETUP_SECRET = process.env.NEXT_ADMIN_SETUP_SECRET || 'your-admin-setup-secret';

    if (adminSecret !== ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin secret' },
        { status: 401 }
      );
    }

    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found with the provided email' },
        { status: 404 }
      );
    }

    // Update the user's role to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userData.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user role', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} has been set as admin`,
      userId: userData.id
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
