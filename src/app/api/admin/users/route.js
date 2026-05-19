import { supabaseServer } from '@/lib/supabaseServer';

// Same hash function as lib/userIdentity.js — inlined to avoid localStorage
function deriveAppUserId(authId) {
  if (!authId) return '';
  let hash = 0;
  for (let i = 0; i < authId.length; i += 1) {
    hash = (hash * 31 + authId.charCodeAt(i)) >>> 0;
  }
  return String(hash & 0x7fffffff);
}

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer.auth.admin.listUsers();
    if (error) throw error;

    // Keep only regular users for the Users section
    const regularUsers = data.users.filter((u) => {
      const role = normalizeRole(u.user_metadata?.role);
      return role === 'user';
    });

    const users = regularUsers.map((u) => ({
      id: u.id,
      appId: deriveAppUserId(u.id), // numeric ID used by the backend
      email: u.email,
      name:
        u.user_metadata?.name ||
        u.user_metadata?.full_name ||
        `${u.user_metadata?.first_name || ''} ${u.user_metadata?.last_name || ''}`.trim() ||
        u.email?.split('@')?.[0] ||
        'No Name',
      phone: u.user_metadata?.phone || u.user_metadata?.phone_number || '',
      role: u.user_metadata?.role || 'user',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    }));

    return Response.json({ success: true, users, total: users.length });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role: 'user' },
    });

    if (error) throw error;

    return Response.json({ success: true, user: data.user });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
