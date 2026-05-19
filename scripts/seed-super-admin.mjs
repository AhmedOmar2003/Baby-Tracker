import fs from 'node:fs';
import path from 'node:path';

const TARGET_EMAIL = 'admin@admin.com';
const TARGET_PASSWORD = '123456a';
const TARGET_ROLE = 'SuperAdmin';
const TARGET_FIRST_NAME = 'Super';
const TARGET_LAST_NAME = 'Admin';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const env = loadEnvFile(path.resolve(process.cwd(), '.env.local'));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.'
  );
}

const adminHeaders = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
};

async function adminGetUsers() {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`,
    {
      headers: adminHeaders,
    }
  );

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.msg || body?.message || 'Failed to fetch users');
  }

  return body?.users || [];
}

async function adminCreateUser() {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      email: TARGET_EMAIL,
      password: TARGET_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: TARGET_FIRST_NAME,
        last_name: TARGET_LAST_NAME,
        role: TARGET_ROLE,
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.msg || body?.message || 'Failed to create user');
  }

  return body;
}

async function adminUpdateUser(userId) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      password: TARGET_PASSWORD,
      user_metadata: {
        first_name: TARGET_FIRST_NAME,
        last_name: TARGET_LAST_NAME,
        role: TARGET_ROLE,
      },
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.msg || body?.message || 'Failed to update user');
  }

  return body;
}

async function upsertSuperAdmin() {
  const users = await adminGetUsers();
  const existingUser = users.find(
    (user) => String(user?.email || '').toLowerCase() === TARGET_EMAIL
  );

  if (existingUser) {
    await adminUpdateUser(existingUser.id);
    return 'updated';
  }

  await adminCreateUser();
  return 'created';
}

try {
  const action = await upsertSuperAdmin();
  console.log(`Super admin ${action}: ${TARGET_EMAIL} with role ${TARGET_ROLE}`);
} catch (error) {
  console.error('Failed to seed super admin:', error.message || error);
  process.exitCode = 1;
}
