import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { email, name, phone, password } = await request.json();

    const updateData = {
      user_metadata: { name, phone },
    };
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (error) throw error;

    return Response.json({ success: true, user: data.user });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return Response.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
