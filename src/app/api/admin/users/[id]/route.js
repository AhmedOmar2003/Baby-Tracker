import { supabaseServer } from '@/lib/supabaseServer';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { email, name, phone, password } = await request.json();

    const updateData = {
      user_metadata: { name, phone },
    };
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const { data, error } = await supabaseServer.auth.admin.updateUserById(id, updateData);
    if (error) throw error;

    return Response.json({ success: true, user: data.user });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { error } = await supabaseServer.auth.admin.deleteUser(id);
    if (error) throw error;

    return Response.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
