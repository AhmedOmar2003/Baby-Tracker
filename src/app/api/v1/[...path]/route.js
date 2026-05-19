import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { deriveAppUserId } from '@/lib/userIdentity';

const tableCache = new Map();

// ── In-process TTL cache (30 s) for expensive Supabase admin list calls ──
const _ttlCache = new Map();
const TTL_MS = 30_000;
function cacheGet(key) {
  const e = _ttlCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL_MS) { _ttlCache.delete(key); return null; }
  return e.value;
}
function cacheSet(key, value) { _ttlCache.set(key, { value, ts: Date.now() }); return value; }
function cacheInvalidate() { _ttlCache.clear(); }

function jsonRows(rows, status = 200) {
  return NextResponse.json({ data: { rows } }, { status });
}

function jsonMessage(msg, status = 200) {
  return NextResponse.json({ msg }, { status });
}

function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return Boolean(value);
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

function normalizePath(path) {
  return Array.isArray(path) ? path.filter(Boolean) : [];
}

async function resolveTable(candidates) {
  const cacheKey = candidates.join('|');
  if (tableCache.has(cacheKey)) {
    return tableCache.get(cacheKey);
  }

  for (const candidate of candidates) {
    const { error } = await supabaseServer.from(candidate).select('*').limit(1);
    if (!error) {
      tableCache.set(cacheKey, candidate);
      return candidate;
    }
  }

  return null;
}

async function selectAll(candidates) {
  const table = await resolveTable(candidates);
  if (!table) {
    const resource = inferResourceType(candidates);
    if (resource === 'article' || resource === 'medicine' || resource === 'vaccine' || resource === 'dose') {
      return await getContentRows(resource);
    }
    if (resource === 'child') {
      return await getAllChildrenFromMeta();
    }
    if (resource === 'reservation') {
      return await getAllReservationsFromMeta();
    }
    if (resource === 'child_dose') {
      return await getAllChildDosesFromMeta();
    }
    return [];
  }
  const { data, error } = await supabaseServer.from(table).select('*');
  if (error) throw error;
  const rows = data || [];
  if (rows.length > 0) return rows;

  const resource = inferResourceType(candidates);
  if (resource === 'article' || resource === 'medicine' || resource === 'vaccine' || resource === 'dose') {
    return await getContentRows(resource);
  }
  if (resource === 'child') {
    return await getAllChildrenFromMeta();
  }
  if (resource === 'reservation') {
    return await getAllReservationsFromMeta();
  }
  if (resource === 'child_dose') {
    return await getAllChildDosesFromMeta();
  }
  return rows;
}

async function selectById(candidates, idColumns, id) {
  const table = await resolveTable(candidates);
  if (!table) {
    const rows = await selectAll(candidates);
    for (const row of rows) {
      for (const column of idColumns) {
        if (`${row?.[column] ?? ''}` === `${id}`) {
          return row;
        }
      }
    }
    return null;
  }

  for (const column of idColumns) {
    const { data, error } = await supabaseServer
      .from(table)
      .select('*')
      .eq(column, id)
      .limit(1);

    if (!error && data?.length) {
      return data[0];
    }
  }

  const resource = inferResourceType(candidates);
  if (resource === 'article' || resource === 'medicine' || resource === 'vaccine' || resource === 'dose' || resource === 'child') {
    const rows = await selectAll(candidates);
    for (const row of rows) {
      for (const column of idColumns) {
        if (`${row?.[column] ?? ''}` === `${id}`) {
          return row;
        }
      }
    }
  }

  return null;
}

async function updateById(candidates, idColumns, id, payload) {
  const table = await resolveTable(candidates);
  if (!table) {
    const resource = inferResourceType(candidates);
    if (resource === 'article' || resource === 'medicine' || resource === 'vaccine' || resource === 'dose') {
      return await updateContentUser(resource, id, payload);
    }
    if (resource === 'child') {
      const found = await findChildLocation(id);
      if (!found) return null;
      const nextChildren = found.children.map((child, index) =>
        index === found.index ? { ...child, ...payload } : child
      );
      const updated = await updateUserMetaArray(found.user.id, 'children', nextChildren);
      if (!updated) return null;
      return nextChildren[found.index];
    }
    return null;
  }

  for (const column of idColumns) {
    const { data, error } = await supabaseServer
      .from(table)
      .update(payload)
      .eq(column, id)
      .select('*')
      .limit(1);

    if (!error && data?.length) {
      return data[0];
    }
  }

  return null;
}

async function deleteById(candidates, idColumns, id) {
  const table = await resolveTable(candidates);
  if (!table) {
    const resource = inferResourceType(candidates);
    if (resource === 'article' || resource === 'medicine' || resource === 'vaccine' || resource === 'dose') {
      return await deleteContentUser(resource, id);
    }
    if (resource === 'child') {
      const found = await findChildLocation(id);
      if (!found) return false;
      const nextChildren = found.children.filter((_, index) => index !== found.index);
      const updated = await updateUserMetaArray(found.user.id, 'children', nextChildren);
      return !!updated;
    }
    if (resource === 'child_dose') {
      const found = await findChildDoseLocation(id);
      if (!found) return false;
      const nextChildDoses = found.childDoses.filter((_, index) => index !== found.index);
      const updated = await updateUserMetaArray(found.user.id, 'child_doses', nextChildDoses);
      return !!updated;
    }
    return false;
  }

  for (const column of idColumns) {
    const { error } = await supabaseServer.from(table).delete().eq(column, id);
    if (!error) return true;
  }

  return false;
}

function mapUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    user_id: user.id,
    first_name: meta.first_name || '',
    last_name: meta.last_name || '',
    email: user.email || meta.email || '',
    phone_number: meta.phone_number || '',
    whatsapp: meta.whatsapp || '',
    role: meta.role || 'user',
    image_url: meta.image_url || null,
    verified: meta.verified ?? false,
    specialization: meta.specialization || '',
    license_number: meta.license_number || '',
    bio: meta.bio || '',
    rating: toNumber(meta.rating) || 0,
  };
}

function mapArticle(row) {
  if (!row) return null;
  return {
    ...row,
    _id: row._id ?? row.id ?? row.article_id,
    isFeatured: row.isFeatured ?? row.is_featured ?? false,
    publicationDate: row.publicationDate ?? row.publication_date ?? '',
  };
}

function mapMedicine(row) {
  if (!row) return null;
  return {
    ...row,
    _id: row._id ?? row.id ?? row.medicine_id,
    sideEffects: row.sideEffects ?? row.side_effects ?? [],
    prescriptionRequired:
      row.prescriptionRequired ?? row.prescription_required ?? false,
  };
}

function mapVaccine(row) {
  if (!row) return null;
  return {
    ...row,
    vaccine_id: row.vaccine_id ?? row.id ?? row._id,
    is_mandatory: row.is_mandatory ?? row.isMandatory ?? false,
  };
}

function mapDose(row) {
  if (!row) return null;
  return {
    ...row,
    dose_id: row.dose_id ?? row.id ?? row._id,
  };
}

function mapChild(row) {
  if (!row) return null;
  return {
    ...row,
    child_id: row.child_id ?? row.id ?? row._id,
  };
}

function mapReservation(row, relations = {}) {
  if (!row) return null;
  const child = relations.child || {};
  const doctor = relations.doctor || {};
  const dose = relations.dose || {};
  const parent = relations.parent || {};
  return {
    ...row,
    reservation_id: row.reservation_id ?? row.id ?? row._id,
    availability_id: row.availability_id ?? row.availabilityId ?? null,
    reservation_day: row.reservation_day ?? row.available_day ?? row.reservationDay ?? '',
    reservation_kind: row.reservation_kind || (row.child_dose_id ? 'Dose reservation' : 'Doctor appointment'),
    child_name: `${child.first_name || ''} ${child.last_name || ''}`.trim(),
    user_name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(),
    doctor_name: `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim(),
    dose_name: dose.dose_name || row.dose_name || (row.child_dose_id ? '' : 'Doctor appointment'),
  };
}

function mapChildDose(row, relations = {}) {
  if (!row) return null;
  const child = relations.child || {};
  const doctor = relations.doctor || {};
  const dose = relations.dose || {};
  return {
    ...row,
    child_dose_id: row.child_dose_id ?? row.id ?? row._id,
    child_first_name: child.first_name || row.child_first_name || '',
    doctor_first_name: doctor.first_name || row.doctor_first_name || '',
    dose_name: dose.dose_name || row.dose_name || '',
  };
}

async function getAdminUsers() {
  const cached = cacheGet('admin_users');
  if (cached) return cached;
  const { data, error } = await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return cacheSet('admin_users', data?.users || []);
}

function inferResourceType(candidates) {
  const joined = candidates.join('|').toLowerCase();
  if (joined.includes('child_doses') || joined.includes('childdose') || joined.includes('child_dose')) return 'child_dose';
  if (joined.includes('article')) return 'article';
  if (joined.includes('medicine')) return 'medicine';
  if (joined.includes('vaccine')) return 'vaccine';
  if (joined.includes('dose')) return 'dose';
  if (joined.includes('child')) return 'child';
  if (joined.includes('reservation')) return 'reservation';
  return null;
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function createContentEmail(resource, id) {
  return `${resource}-${id}@babytracker.local`;
}

function createContentPassword(resource) {
  const suffix = globalThis.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(16).slice(2, 10);
  return `Content-${resource}-${suffix}!`;
}

function mapContentUser(user, resource) {
  if (!user) return null;
  const meta = user.user_metadata || {};

  if (resource === 'article') {
    return {
      ...meta,
      id: user.id,
      _id: user.id,
      title: meta.title || '',
      content: meta.content || '',
      author: meta.author || '',
      publicationDate: meta.publicationDate || meta.publication_date || '',
      tags: normalizeList(meta.tags),
      category: meta.category || '',
      status: meta.status || 'published',
      views: toNumber(meta.views) || 0,
      references: normalizeList(meta.references),
      isFeatured: meta.isFeatured ?? meta.is_featured ?? false,
      image: meta.image || null,
    };
  }

  if (resource === 'medicine') {
    return {
      ...meta,
      id: user.id,
      _id: user.id,
      name: meta.name || '',
      description: meta.description || '',
      dosage: meta.dosage || '',
      manufacturer: meta.manufacturer || '',
      price: toNumber(meta.price) || 0,
      category: meta.category || '',
      prescriptionRequired: meta.prescriptionRequired ?? meta.prescription_required ?? false,
      sideEffects: normalizeList(meta.sideEffects || meta.side_effects),
      image: meta.image || null,
    };
  }

  if (resource === 'vaccine') {
    return {
      ...meta,
      id: user.id,
      vaccine_id: user.id,
      vaccine_name: meta.vaccine_name || '',
      description: meta.description || '',
      min_age: toNumber(meta.min_age) ?? 0,
      max_age: toNumber(meta.max_age) ?? 0,
      doses_required: toNumber(meta.doses_required) ?? 0,
      is_mandatory: meta.is_mandatory ?? meta.isMandatory ?? false,
      dose_id: meta.dose_id || null,
      image: meta.image || null,
    };
  }

  if (resource === 'dose') {
    return {
      ...meta,
      id: user.id,
      dose_id: user.id,
      dose_name: meta.dose_name || '',
      recommended_age: toNumber(meta.recommended_age) ?? 0,
      description: meta.description || '',
      image: meta.image || null,
    };
  }

  return null;
}

async function getContentUsers(resource) {
  const users = await getAdminUsers();
  return users.filter((user) => `${user?.user_metadata?.content_type || ''}` === resource);
}

async function getContentRows(resource) {
  const key = `content_rows_${resource}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const users = await getContentUsers(resource);
  return cacheSet(key, users.map((user) => mapContentUser(user, resource)).filter(Boolean));
}

async function findContentUserById(resource, id) {
  const users = await getContentUsers(resource);
  return users.find((user) => `${user.id}` === `${id}` || `${user?.user_metadata?.content_id || ''}` === `${id}`) || null;
}

async function createContentUser(resource, payload) {
  const { data, error } = await supabaseServer.auth.admin.createUser({
    email: payload.email || createContentEmail(resource, globalThis.crypto?.randomUUID?.() || Date.now()),
    password: payload.password || createContentPassword(resource),
    email_confirm: true,
    user_metadata: {
      role: 'Content',
      content_type: resource,
      ...payload,
    },
  });

  if (error) throw error;
  return mapContentUser(data.user, resource);
}

async function updateContentUser(resource, id, payload) {
  const existing = await findContentUserById(resource, id);
  if (!existing) return null;

  const { data, error } = await supabaseServer.auth.admin.updateUserById(existing.id, {
    user_metadata: {
      ...(existing.user_metadata || {}),
      role: 'Content',
      content_type: resource,
      ...payload,
    },
  });

  if (error) throw error;
  return mapContentUser(data.user, resource);
}

async function deleteContentUser(resource, id) {
  const existing = await findContentUserById(resource, id);
  if (!existing) return false;
  const { error } = await supabaseServer.auth.admin.deleteUser(existing.id);
  if (error) throw error;
  return true;
}

async function getAllUsersWithMetaKey(key) {
  const users = await getAdminUsers();
  return users
    .filter((user) => Array.isArray(user?.user_metadata?.[key]) && user.user_metadata[key].length > 0)
    .map((user) => ({
      user,
      items: normalizeList(user.user_metadata?.[key]),
    }));
}

async function getAllChildrenFromMeta() {
  const parents = await getAllUsersWithMetaKey('children');
  return parents.flatMap(({ items }) => items.map(mapChild).filter(Boolean));
}

async function getAllChildDosesFromMeta() {
  const parents = await getAllUsersWithMetaKey('child_doses');
  return parents.flatMap(({ items }) => items.map((item) => item).filter(Boolean));
}

async function getAllReservationsFromMeta() {
  const parents = await getAllUsersWithMetaKey('reservations');
  return parents.flatMap(({ items }) => items.map((item) => item).filter(Boolean));
}

async function findChildLocation(childId) {
  const users = await getAdminUsers();
  for (const user of users) {
    const children = normalizeList(user?.user_metadata?.children);
    const index = children.findIndex((child) => `${child?.child_id ?? child?.id ?? child?._id}` === `${childId}`);
    if (index >= 0) {
      return { user, children, index, child: children[index] };
    }
  }
  return null;
}

async function findChildDoseLocation(childDoseId) {
  const users = await getAdminUsers();
  for (const user of users) {
    const childDoses = normalizeList(user?.user_metadata?.child_doses);
    const index = childDoses.findIndex(
      (row) => `${row?.child_dose_id ?? row?.id ?? row?._id}` === `${childDoseId}`
    );
    if (index >= 0) {
      return { user, childDoses, index, childDose: childDoses[index] };
    }
  }
  return null;
}

async function findReservationLocation(reservationId) {
  const users = await getAdminUsers();
  for (const user of users) {
    const reservations = normalizeList(user?.user_metadata?.reservations);
    const index = reservations.findIndex(
      (row) => `${row?.reservation_id ?? row?.id ?? row?._id}` === `${reservationId}`
    );
    if (index >= 0) {
      return { user, reservations, index, reservation: reservations[index] };
    }
  }
  return null;
}

async function updateUserMetaArray(userId, key, nextItems) {
  const { data, error } = await supabaseServer.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  const existingMeta = data.user.user_metadata || {};
  const res = await supabaseServer.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMeta,
      [key]: nextItems,
    },
  });
  if (res.error) return null;
  return res.data.user;
}

async function findParentUserByAppId(appUserId) {
  const users = await getAdminUsers();
  return users.find((user) => deriveAppUserId(user.id) === `${appUserId}`) || null;
}

// ── Notification helpers (stored in user_metadata.notifications[]) ──
async function getNotificationsForUser(appUserId) {
  const user = await findParentUserByAppId(appUserId);
  if (!user) return [];
  return normalizeList(user.user_metadata?.notifications || []);
}

async function addNotificationForUser(appUserId, notification) {
  const user = await findParentUserByAppId(appUserId);
  if (!user) return null;
  const existingMeta = user.user_metadata || {};
  const current = normalizeList(existingMeta.notifications);
  const next = [notification, ...current].slice(0, 50);
  const res = await supabaseServer.auth.admin.updateUserById(user.id, {
    user_metadata: { ...existingMeta, notifications: next },
  });
  if (res.error) return null;
  return notification;
}

async function updateNotificationsForUser(appUserId, updaterFn) {
  const user = await findParentUserByAppId(appUserId);
  if (!user) return null;
  const existingMeta = user.user_metadata || {};
  const current = normalizeList(existingMeta.notifications);
  const next = updaterFn(current);
  const res = await supabaseServer.auth.admin.updateUserById(user.id, {
    user_metadata: { ...existingMeta, notifications: next },
  });
  if (res.error) return null;
  return next;
}

function makeNotification({ title, message, type = 'general', link = '/profile' }) {
  return {
    id: globalThis.crypto?.randomUUID?.() || `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    message: message || '',
    type,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}

async function getUserByAppId(appUserId) {
  const user = await findParentUserByAppId(appUserId);
  return user ? mapUser(user) : null;
}

async function getDoctorsList() {
  const cached = cacheGet('doctors_list');
  if (cached) return cached;
  const users = await getAdminUsers();
  return cacheSet('doctors_list', users.filter((u) => u?.user_metadata?.role === 'Doctor').map(mapUser));
}

async function getDoctorById(id) {
  const { data, error } = await supabaseServer.auth.admin.getUserById(id);
  if (error || !data?.user) return null;
  return mapUser(data.user);
}

const APPOINTMENT_TABLE_CANDIDATES = [
  'doctor_appointments',
  'doctor_appointment',
  'doctor_availability',
  'doctoravailability',
  'doctorappoinment',
  'doctor_appoinment',
  'doctor_appoinments',
  'appoinment',
  'appoinments',
  'appointment',
  'appointments',
  'availability',
];

function createAppointmentId() {
  return globalThis.crypto?.randomUUID?.() || `appt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapAppointmentSlot(row) {
  if (!row) return null;
  return {
    ...row,
    availability_id:
      row.availability_id ??
      row.availabilityId ??
      row.appointment_id ??
      row.appointmentId ??
      row.slot_id ??
      row.id ??
      row._id ??
      createAppointmentId(),
    doctor_id: row.doctor_id ?? row.doctorId ?? '',
    available_day: row.available_day ?? row.availableDay ?? '',
    start_time: row.start_time ?? row.startTime ?? '',
    end_time: row.end_time ?? row.endTime ?? '',
  };
}

function getAppointmentsFromMeta(user) {
  const meta = user?.user_metadata || {};
  const appointments = Array.isArray(meta.appointments) ? meta.appointments : [];
  return appointments.map(mapAppointmentSlot).filter(Boolean);
}

async function updateDoctorAppointmentsInMeta(doctorId, appointments) {
  const { data, error } = await supabaseServer.auth.admin.getUserById(doctorId);
  if (error || !data?.user) return null;
  const existingMeta = data.user.user_metadata || {};
  const res = await supabaseServer.auth.admin.updateUserById(doctorId, {
    user_metadata: {
      ...existingMeta,
      appointments,
    },
  });
  if (res.error) return null;
  return appointments.map(mapAppointmentSlot);
}

async function getDoctorAppointmentsFromMeta(doctorId) {
  const { data, error } = await supabaseServer.auth.admin.getUserById(doctorId);
  if (error || !data?.user) return [];
  return getAppointmentsFromMeta(data.user);
}

async function findDoctorWithAppointment(slotId) {
  const users = await getAdminUsers();
  for (const user of users) {
    const role = `${user?.user_metadata?.role || ''}`.toLowerCase();
    if (role !== 'doctor') continue;
    const appointments = getAppointmentsFromMeta(user);
    const index = appointments.findIndex((item) => `${item.availability_id}` === `${slotId}`);
    if (index >= 0) {
      return { user, appointments, index };
    }
  }
  return null;
}

async function getAppointmentRows(doctorId) {
  const table = await resolveTable(APPOINTMENT_TABLE_CANDIDATES);
  if (!table) return getDoctorAppointmentsFromMeta(doctorId);

  const { data, error } = await supabaseServer
    .from(table)
    .select('*')
    .eq('doctor_id', doctorId);

  if (error) throw error;
  return (data || []).map(mapAppointmentSlot);
}

async function getChildRow(childId) {
  return await selectById(['child', 'children'], ['child_id', 'id', '_id'], childId);
}

async function getDoseRow(doseId) {
  return await selectById(['dose', 'doses'], ['dose_id', 'id', '_id'], doseId);
}

async function getReservationRowsForUser(userId) {
  const table = await resolveTable(['reservation', 'reservations']);
  if (!table) {
    const rows = await getAllReservationsFromMeta();
    return rows.filter((row) => `${row.user_id}` === `${userId}`);
  }
  const { data, error } = await supabaseServer
    .from(table)
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  const rows = data || [];
  if (rows.length > 0) return rows;
  const metaRows = await getAllReservationsFromMeta();
  return metaRows.filter((row) => `${row.user_id}` === `${userId}`);
}

async function getChildDoseRowsForChild(childId) {
  const table = await resolveTable(['child_doses', 'childdose', 'child_dose']);
  if (!table) {
    const rows = await getAllChildDosesFromMeta();
    return rows.filter((row) => `${row.child_id}` === `${childId}`);
  }
  const { data, error } = await supabaseServer
    .from(table)
    .select('*')
    .eq('child_id', childId);
  if (error) throw error;
  const rows = data || [];
  if (rows.length > 0) return rows;
  const metaRows = await getAllChildDosesFromMeta();
  return metaRows.filter((row) => `${row.child_id}` === `${childId}`);
}

async function joinReservations(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const child = row.child_id ? await getChildRow(row.child_id) : null;
      const parent = row.user_id ? await getUserByAppId(row.user_id) : null;
      const doctor = row.doctor_id ? await getDoctorById(row.doctor_id) : null;
      const childDose = row.child_dose_id
        ? await selectById(
            ['child_doses', 'childdose', 'child_dose'],
            ['child_dose_id', 'id', '_id'],
            row.child_dose_id
          )
        : null;
      const dose = childDose?.dose_id ? await getDoseRow(childDose.dose_id) : null;
      return mapReservation(row, { child, parent, doctor, dose });
    })
  );
}

async function joinChildDoses(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const child  = row.child_id  ? await getChildRow(row.child_id)     : null;
      const doctor = row.doctor_id ? await getDoctorById(row.doctor_id)  : null;
      const dose   = row.dose_id   ? await getDoseRow(row.dose_id)       : null;
      const parent = row.user_id   ? await getUserByAppId(row.user_id)   : null;
      return {
        ...mapChildDose(row, { child, doctor, dose }),
        user_name: parent ? `${parent.first_name || ''} ${parent.last_name || ''}`.trim() : '',
        user_id: row.user_id,
      };
    })
  );
}

async function handleGet(path, url) {
  const [resource, action, id] = normalizePath(path);

  if (resource === 'user') {
    if (action === 'userById' && id) {
      const user = await getDoctorById(id) || await getUserById(id);
      if (!user) return jsonMessage('User not found', 404);
      return jsonRows([user]);
    }
    if (action === 'userByEmail') {
      const email = (url.searchParams.get('email') || id || '').trim().toLowerCase();
      if (!email) return jsonMessage('email is required', 400);
      const users = await getAdminUsers();
      const found = users.find((user) => `${user.email || ''}`.toLowerCase() === email) || null;
      if (!found) return jsonMessage('User not found', 404);
      return jsonRows([mapUser(found)]);
    }
  }

  if (resource === 'doctor') {
    if (action === 'getAll') {
      const doctors = await getDoctorsList();
      return jsonRows(doctors);
    }
    if (action === 'Appointments' && id) {
      const rows = await getAppointmentRows(id);
      return jsonRows(rows);
    }
    if (action && !['getAll', 'Appointments'].includes(action) && !id) {
      const doctor = await getDoctorById(action);
      if (!doctor) return jsonMessage('Doctor not found', 404);
      return jsonRows([doctor]);
    }
  }

  if (resource === 'article') {
    const rows = await selectAll(['article', 'articles']);
    const mapped = rows.map(mapArticle);
    if (action === 'getAll') {
      const isFeatured = url.searchParams.get('isFeatured');
      if (isFeatured === null) return jsonRows(mapped);
      return jsonRows(mapped.filter((row) => row.isFeatured === toBool(isFeatured)));
    }
    if (action === 'search') {
      const title = (url.searchParams.get('title') || '').toLowerCase();
      const author = (url.searchParams.get('author') || '').toLowerCase();
      const tags = (url.searchParams.get('tags') || '').toLowerCase();
      const category = (url.searchParams.get('category') || '').toLowerCase();
      const isFeatured = url.searchParams.get('isFeatured');
      const filtered = mapped.filter((row) => {
        const rowTags = Array.isArray(row.tags) ? row.tags.join(',') : `${row.tags || ''}`;
        const matches =
          (!title || `${row.title || ''}`.toLowerCase().includes(title)) &&
          (!author || `${row.author || ''}`.toLowerCase().includes(author)) &&
          (!tags || rowTags.toLowerCase().includes(tags)) &&
          (!category || `${row.category || ''}`.toLowerCase().includes(category));
        if (!matches) return false;
        if (isFeatured === null) return true;
        return row.isFeatured === toBool(isFeatured);
      });
      return jsonRows(filtered);
    }
    if (action === 'articleById' && id) {
      const row = mapped.find((item) => `${item._id}` === `${id}`);
      if (!row) return jsonMessage('Article not found', 404);
      return jsonRows([row]);
    }
  }

  if (resource === 'medicine') {
    const rows = await selectAll(['medicine', 'medicines']);
    const mapped = rows.map(mapMedicine);
    if (action === 'getAll') {
      return jsonRows(mapped);
    }
    if (action === 'search') {
      const name = (url.searchParams.get('name') || '').toLowerCase();
      const category = (url.searchParams.get('category') || '').toLowerCase();
      const sideEffects = (url.searchParams.get('sideEffects') || '').toLowerCase();
      const filtered = mapped.filter((row) => {
        const side = Array.isArray(row.sideEffects) ? row.sideEffects.join(',') : `${row.sideEffects || ''}`;
        return (
          (!name || `${row.name || ''}`.toLowerCase().includes(name)) &&
          (!category || `${row.category || ''}`.toLowerCase().includes(category)) &&
          (!sideEffects || side.toLowerCase().includes(sideEffects))
        );
      });
      return jsonRows(filtered);
    }
    if (action === 'medicineById' && id) {
      const row = mapped.find((item) => `${item._id}` === `${id}`);
      if (!row) return jsonMessage('Medicine not found', 404);
      return jsonRows([row]);
    }
  }

  if (resource === 'vaccine') {
    const rows = await selectAll(['vaccine', 'vaccines']);
    const mapped = rows.map(mapVaccine);
    if (action === 'getAll') {
      return jsonRows(mapped);
    }
    if (action === 'vaccineById' && id) {
      const row = mapped.find((item) => `${item.vaccine_id}` === `${id}`);
      if (!row) return jsonMessage('Vaccine not found', 404);
      return jsonRows([row]);
    }
    if (action === 'vaccinesByDoseId' && id) {
      const filtered = mapped.filter((item) => `${item.dose_id ?? item.doseId ?? ''}` === `${id}`);
      return jsonRows(filtered);
    }
  }

  if (resource === 'dose') {
    if (action === 'getAll') {
      const rows = await selectAll(['dose', 'doses']);
      return jsonRows(rows.map(mapDose));
    }
    if (action === 'childDoses' && id) {
      const rows = await getChildDoseRowsForChild(id);
      const joined = await joinChildDoses(rows);
      return jsonRows(joined);
    }
  }

  if (resource === 'child_dose') {
    if (action === 'all') {
      const table = await resolveTable(['child_doses', 'childdose', 'child_dose']);
      let rows = [];
      if (table) {
        const { data, error } = await supabaseServer.from(table).select('*');
        if (!error && data?.length > 0) rows = data;
      }
      if (rows.length === 0) rows = await getAllChildDosesFromMeta();
      const joined = await joinChildDoses(rows);
      return jsonRows(joined);
    }
  }

  if (resource === 'child') {
    if (action === 'myChildren') {
      const userId = url.searchParams.get('user_id');
      if (!userId) return jsonMessage('user_id is required', 400);
      const rows = await selectAll(['child', 'children']);
      const mapped = rows.map(mapChild).filter((row) => `${row.user_id}` === `${userId}`);
      return jsonRows(mapped);
    }
    if (action === 'childById' && id) {
      const row = await selectById(['child', 'children'], ['child_id', 'id', '_id'], id);
      if (!row) return jsonMessage('Child not found', 404);
      return jsonRows([mapChild(row)]);
    }
  }

  if (resource === 'reservation') {
    if (action === 'myReservations') {
      const userId = url.searchParams.get('user_id');
      if (!userId) return jsonMessage('user_id is required', 400);
      const rows = await getReservationRowsForUser(userId);
      const joined = await joinReservations(rows);
      return jsonRows(joined);
    }
    if (action === 'all') {
      const table = await resolveTable(['reservation', 'reservations']);
      let rows = [];
      if (table) {
        const { data, error } = await supabaseServer.from(table).select('*').order('reservation_date', { ascending: false });
        if (!error && data?.length > 0) rows = data;
      }
      if (rows.length === 0) rows = await getAllReservationsFromMeta();
      const joined = await joinReservations(rows);
      return jsonRows(joined);
    }
  }

  if (resource === 'notification') {
    if (action === 'forUser') {
      const userId = url.searchParams.get('user_id');
      if (!userId) return jsonMessage('user_id is required', 400);
      const notifications = await getNotificationsForUser(userId);
      return jsonRows(notifications);
    }
  }

  if (resource === 'Auth' && action === 'logout') {
    return jsonMessage('Logged out');
  }

  return jsonMessage('Endpoint not found', 404);
}

async function getUserById(id) {
  const { data, error } = await supabaseServer.auth.admin.getUserById(id);
  if (error || !data?.user) return null;
  return mapUser(data.user);
}

async function handlePost(path, url, body) {
  const [resource, action] = normalizePath(path);

  if (resource === 'child' && action === 'create') {
    const table = await resolveTable(['child', 'children']);
    const payload = {
      user_id: body.user_id,
      first_name: body.first_name,
      last_name: body.last_name,
      gender: body.gender,
      date_of_birth: body.date_of_birth,
      weight: toNumber(body.weight),
      height: toNumber(body.height),
    };
    if (!table) {
      const parent = await findParentUserByAppId(body.user_id);
      if (!parent) return jsonMessage('Parent user not found', 404);
      const currentChildren = normalizeList(parent.user_metadata?.children);
      const nextChild = {
        child_id: globalThis.crypto?.randomUUID?.() || `child-${Date.now()}`,
        ...payload,
      };
      const saved = await updateUserMetaArray(parent.id, 'children', [...currentChildren, nextChild]);
      if (!saved) return jsonMessage('Child store unavailable', 500);
      return jsonRows([mapChild(nextChild)], 201);
    }
    const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
    if (error) return jsonMessage(error.message, 500);
    return jsonRows((data || []).map(mapChild), 201);
  }

  if (resource === 'reservation' && action === 'create') {
    const table = await resolveTable(['reservation', 'reservations']);
    const payload = {
      user_id: body.user_id,
      doctor_id: body.doctor_id,
      child_id: body.child_id,
      child_dose_id: body.child_dose_id,
      availability_id: body.availability_id || null,
      reservation_day: body.reservation_day || body.available_day || null,
      reservation_kind: body.reservation_kind || (body.child_dose_id ? 'Dose reservation' : 'Doctor appointment'),
      reservation_date: body.reservation_date,
      reservation_time: body.reservation_time || body.time || null,
      status: body.status || 'Pending',
      notes: body.notes || null,
    };
    if (!table) {
      const parent = await findParentUserByAppId(body.user_id);
      if (!parent) return jsonMessage('Parent user not found', 404);
      const currentReservations = normalizeList(parent.user_metadata?.reservations);
      const nextReservation = {
        reservation_id: globalThis.crypto?.randomUUID?.() || `reservation-${Date.now()}`,
        ...payload,
      };
      const saved = await updateUserMetaArray(parent.id, 'reservations', [...currentReservations, nextReservation]);
      if (!saved) return jsonMessage('Reservation store unavailable', 500);
      return jsonRows([nextReservation], 201);
    }
    const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
    if (error) return jsonMessage(error.message, 500);
    return jsonRows(data || [], 201);
  }

  if (resource === 'child_dose' && action === 'create') {
    const table = await resolveTable(['child_doses', 'childdose', 'child_dose']);
    const payload = {
      user_id: body.user_id,
      child_id: body.child_id,
      dose_id: body.dose_id,
      doctor_id: body.doctor_id || null,
      scheduled_date: body.scheduled_date || null,
      administered_date: body.administered_date || null,
      status: body.status || 'Pending',
      notes: body.notes || null,
    };
    if (!table) {
      const parent = await findParentUserByAppId(body.user_id);
      if (!parent) return jsonMessage('Parent user not found', 404);
      const currentChildDoses = normalizeList(parent.user_metadata?.child_doses);
      const nextChildDose = {
        child_dose_id: globalThis.crypto?.randomUUID?.() || `child-dose-${Date.now()}`,
        ...payload,
      };
      const saved = await updateUserMetaArray(parent.id, 'child_doses', [...currentChildDoses, nextChildDose]);
      if (!saved) return jsonMessage('Child dose store unavailable', 500);
      return jsonRows([nextChildDose], 201);
    }
    const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
    if (error) return jsonMessage(error.message, 500);
    return jsonRows(data || [], 201);
  }

  if (resource === 'notification' && action === 'create') {
    const { user_id, title, message, type = 'general', link = '/profile' } = body || {};
    if (!user_id || !title) return jsonMessage('user_id and title are required', 400);
    const notification = makeNotification({ title, message, type, link });
    const saved = await addNotificationForUser(user_id, notification);
    if (!saved) return jsonMessage('Failed to create notification — user not found', 404);
    return jsonRows([saved], 201);
  }

  if (resource === 'doctor' && action === 'create') {
    const payload = body || {};
    const { data, error } = await supabaseServer.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        first_name: payload.first_name || '',
        last_name: payload.last_name || '',
        phone_number: payload.phone_number || '',
        whatsapp: payload.whatsapp || '',
        bio: payload.bio || '',
        rating: toNumber(payload.rating) || 0,
        role: payload.role || 'Doctor',
        specialization: payload.specialization || '',
        license_number: payload.license_number || '',
        verified: toBool(payload.verified),
        image_url: payload.image_url || null,
      },
    });

    if (error) return jsonMessage(error.message, 500);
    return jsonRows([mapUser(data.user)], 201);
  }

  if (resource === 'doctor' && action === 'addAppointment') {
    const table = await resolveTable(APPOINTMENT_TABLE_CANDIDATES);
    const payload = {
      doctor_id: body.doctor_id,
      available_day: body.available_day,
      start_time: body.start_time,
      end_time: body.end_time,
    };
    if (table) {
      const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
      if (!error) return jsonRows((data || []).map(mapAppointmentSlot), 201);
    }

    const currentAppointments = await getDoctorAppointmentsFromMeta(body.doctor_id);
    const nextAppointment = mapAppointmentSlot({ ...payload, availability_id: createAppointmentId() });
    const saved = await updateDoctorAppointmentsInMeta(body.doctor_id, [...currentAppointments, nextAppointment]);
    if (!saved) {
      return jsonMessage(
        `Appointments store unavailable. Tried: ${APPOINTMENT_TABLE_CANDIDATES.join(', ')}`,
        500
      );
    }
    return jsonRows([nextAppointment], 201);
  }

  if (resource === 'article' && action === 'create') {
    const table = await resolveTable(['article', 'articles']);
    const payload = {
      title: body.title,
      content: body.content,
      author: body.author,
      publicationDate: body.publicationDate || body.publication_date || null,
      tags: body.tags || [],
      category: body.category,
      status: body.status,
      views: toNumber(body.views),
      references: body.references || [],
      isFeatured: toBool(body.isFeatured),
      image: body.image || null,
    };
    if (!table) {
      const created = await createContentUser('article', payload);
      return jsonRows([created], 201);
    }
    const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
    if (error) return jsonMessage(error.message, 500);
    return jsonRows((data || []).map(mapArticle), 201);
  }

  if (resource === 'medicine' && action === 'create') {
    const table = await resolveTable(['medicine', 'medicines']);
    const payload = {
      name: body.name,
      description: body.description,
      dosage: body.dosage,
      manufacturer: body.manufacturer,
      price: toNumber(body.price),
      category: body.category,
      prescriptionRequired: toBool(body.prescriptionRequired),
      sideEffects: body.sideEffects || [],
      image: body.image || null,
    };
    if (!table) {
      const created = await createContentUser('medicine', payload);
      return jsonRows([created], 201);
    }
    const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
    if (error) return jsonMessage(error.message, 500);
    return jsonRows((data || []).map(mapMedicine), 201);
  }

  if (resource === 'vaccine' && action === 'create') {
    const table = await resolveTable(['vaccine', 'vaccines']);
    const payload = {
      vaccine_name: body.vaccine_name,
      description: body.description,
      min_age: toNumber(body.min_age),
      max_age: toNumber(body.max_age),
      doses_required: toNumber(body.doses_required),
      is_mandatory: toBool(body.is_mandatory),
      dose_id: body.dose_id || null,
      image: body.image || null,
    };
    if (!table) {
      const created = await createContentUser('vaccine', payload);
      return jsonRows([created], 201);
    }
    const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
    if (error) return jsonMessage(error.message, 500);
    return jsonRows((data || []).map(mapVaccine), 201);
  }

  if (resource === 'dose' && action === 'create') {
    const table = await resolveTable(['dose', 'doses']);
    const payload = {
      dose_name: body.dose_name,
      recommended_age: toNumber(body.recommended_age),
      description: body.description || null,
      image: body.image || null,
    };
    if (!table) {
      const created = await createContentUser('dose', payload);
      return jsonRows([created], 201);
    }
    const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
    if (error) return jsonMessage(error.message, 500);
    return jsonRows((data || []).map(mapDose), 201);
  }

  return jsonMessage('Endpoint not found', 404);
}

async function handlePut(path, url, body) {
  const [resource, action, id] = normalizePath(path);

  if (resource === 'user' && action === 'update' && id) {
    const { data: currentUser, error: currentUserError } = await supabaseServer.auth.admin.getUserById(id);
    if (currentUserError || !currentUser?.user) return jsonMessage('User not found', 404);
    const existingMeta = currentUser.user.user_metadata || {};
    const updatePayload = {};
    if (body.first_name !== undefined || body.last_name !== undefined || body.phone_number !== undefined || body.role !== undefined) {
      updatePayload.user_metadata = {
        ...existingMeta,
        first_name: body.first_name ?? existingMeta.first_name ?? '',
        last_name: body.last_name ?? existingMeta.last_name ?? '',
        phone_number: body.phone_number ?? existingMeta.phone_number ?? '',
        role: body.role ?? existingMeta.role ?? 'user',
      };
    }
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.password) updatePayload.password = body.password;
    if (body.phone_number !== undefined) updatePayload.phone = body.phone_number;
    const { data, error } = await supabaseServer.auth.admin.updateUserById(id, updatePayload);
    if (error) return jsonMessage(error.message, 500);
    return jsonRows([mapUser(data.user)]);
  }

  if (resource === 'doctor' && action === 'update' && id) {
    const { data, error } = await supabaseServer.auth.admin.getUserById(id);
    if (error || !data?.user) return jsonMessage('Doctor not found', 404);
    const existingMeta = data.user.user_metadata || {};
    const nextImageUrl =
      typeof body.image_url === 'string' && body.image_url.trim()
        ? body.image_url.trim()
        : existingMeta.image_url ?? null;
    const updatePayload = {
      user_metadata: {
        ...existingMeta,
        specialization: body.specialization ?? existingMeta.specialization ?? '',
        license_number: body.license_number ?? existingMeta.license_number ?? '',
        first_name: body.first_name ?? existingMeta.first_name ?? '',
        last_name: body.last_name ?? existingMeta.last_name ?? '',
        phone_number: body.phone_number ?? existingMeta.phone_number ?? '',
        whatsapp: body.whatsapp ?? existingMeta.whatsapp ?? '',
        bio: body.bio ?? existingMeta.bio ?? '',
        rating: body.rating ?? existingMeta.rating ?? existingMeta.rate ?? 0,
        verified: body.verified !== undefined ? toBool(body.verified) : existingMeta.verified ?? false,
        image_url: nextImageUrl,
      },
    };
    if (body.email !== undefined) updatePayload.email = body.email;
    const res = await supabaseServer.auth.admin.updateUserById(id, updatePayload);
    if (res.error) return jsonMessage(res.error.message, 500);
    return jsonRows([mapUser(res.data.user)]);
  }

  if (resource === 'doctor' && action === 'verify' && id) {
    const { data, error } = await supabaseServer.auth.admin.getUserById(id);
    if (error || !data?.user) return jsonMessage('Doctor not found', 404);
    const existingMeta = data.user.user_metadata || {};
    const res = await supabaseServer.auth.admin.updateUserById(id, {
      user_metadata: { ...existingMeta, verified: toBool(body.verified) },
    });
    if (res.error) return jsonMessage(res.error.message, 500);
    return jsonRows([mapUser(res.data.user)]);
  }

  if (resource === 'doctor' && action === 'Appointments' && id) {
    const updated = await updateById(
      APPOINTMENT_TABLE_CANDIDATES,
      ['availability_id', 'id', '_id'],
      id,
      {
        available_day: body.available_day,
        start_time: body.start_time,
        end_time: body.end_time,
      }
    );
    if (updated) return jsonRows([mapAppointmentSlot(updated)]);

    const found = await findDoctorWithAppointment(id);
    if (!found) return jsonMessage('Appointment not found', 404);
    const updatedAppointments = found.appointments.map((item, index) =>
      index === found.index
        ? mapAppointmentSlot({
            ...item,
            available_day: body.available_day,
            start_time: body.start_time,
            end_time: body.end_time,
          })
        : item
    );
    const saved = await updateDoctorAppointmentsInMeta(found.user.id, updatedAppointments);
    if (!saved) return jsonMessage('Appointment update failed', 500);
    return jsonRows([updatedAppointments[found.index]]);
  }

  if (resource === 'child' && action === 'childById' && id) {
    const updated = await updateById(
      ['child', 'children'],
      ['child_id', 'id', '_id'],
      id,
      {
        first_name: body.first_name,
        last_name: body.last_name,
        gender: body.gender,
        date_of_birth: body.date_of_birth,
        weight: toNumber(body.weight),
        height: toNumber(body.height),
      }
    );
    if (!updated) return jsonMessage('Child not found', 404);
    return jsonRows([mapChild(updated)]);
  }

  if (resource === 'article' && action === 'articleById' && id) {
    const updated = await updateById(
      ['article', 'articles'],
      ['_id', 'id', 'article_id'],
      id,
      {
        title: body.title,
        content: body.content,
        author: body.author,
        publicationDate: body.publicationDate || body.publication_date || null,
        tags: body.tags || [],
        category: body.category,
        status: body.status,
        views: toNumber(body.views),
        references: body.references || [],
        isFeatured: toBool(body.isFeatured),
        image: body.image || null,
      }
    );
    if (!updated) return jsonMessage('Article not found', 404);
    return jsonRows([mapArticle(updated)]);
  }

  if (resource === 'medicine' && action === 'medicineById' && id) {
    const updated = await updateById(
      ['medicine', 'medicines'],
      ['_id', 'id', 'medicine_id'],
      id,
      {
        name: body.name,
        description: body.description,
        dosage: body.dosage,
        manufacturer: body.manufacturer,
        price: toNumber(body.price),
        category: body.category,
        prescriptionRequired: toBool(body.prescriptionRequired),
        sideEffects: body.sideEffects || [],
        image: body.image || null,
      }
    );
    if (!updated) return jsonMessage('Medicine not found', 404);
    return jsonRows([mapMedicine(updated)]);
  }

  if (resource === 'vaccine' && action === 'vaccineById' && id) {
    const updated = await updateById(
      ['vaccine', 'vaccines'],
      ['vaccine_id', 'id', '_id'],
      id,
      {
        vaccine_name: body.vaccine_name,
        description: body.description,
        min_age: toNumber(body.min_age),
        max_age: toNumber(body.max_age),
        doses_required: toNumber(body.doses_required),
        is_mandatory: toBool(body.is_mandatory),
        dose_id: body.dose_id || null,
        image: body.image || null,
      }
    );
    if (!updated) return jsonMessage('Vaccine not found', 404);
    return jsonRows([mapVaccine(updated)]);
  }

  if (resource === 'dose' && action === 'doseById' && id) {
    const updated = await updateById(
      ['dose', 'doses'],
      ['dose_id', 'id', '_id'],
      id,
      {
        dose_name: body.dose_name,
        recommended_age: toNumber(body.recommended_age),
        description: body.description || null,
        image: body.image || null,
      }
    );
    if (!updated) return jsonMessage('Dose not found', 404);
    return jsonRows([mapDose(updated)]);
  }

  if (resource === 'child_dose' && action === 'childDoseById' && id) {
    const allowedStatuses = ['Pending', 'Completed', 'Cancelled'];
    const updatePayload = {};
    if (body.status !== undefined) {
      if (!allowedStatuses.includes(body.status)) return jsonMessage(`status must be one of: ${allowedStatuses.join(', ')}`, 400);
      updatePayload.status = body.status;
    }
    if (body.scheduled_date   !== undefined) updatePayload.scheduled_date   = body.scheduled_date;
    if (body.administered_date !== undefined) updatePayload.administered_date = body.administered_date;
    if (body.doctor_id         !== undefined) updatePayload.doctor_id         = body.doctor_id;
    if (body.notes             !== undefined) updatePayload.notes             = body.notes;

    // Try DB table first
    const table = await resolveTable(['child_doses', 'childdose', 'child_dose']);
    if (table) {
      const { data, error } = await supabaseServer
        .from(table)
        .update(updatePayload)
        .or(`child_dose_id.eq.${id},id.eq.${id}`)
        .select('*');
      if (!error && data?.length > 0) { cacheInvalidate(); return jsonRows([data[0]]); }
    }
    // Fallback: user_metadata
    const found = await findChildDoseLocation(id);
    if (!found) return jsonMessage('Child dose not found', 404);
    const updated = { ...found.childDose, ...updatePayload };
    const nextChildDoses = [...found.childDoses];
    nextChildDoses[found.index] = updated;
    const saved = await updateUserMetaArray(found.user.id, 'child_doses', nextChildDoses);
    if (!saved) return jsonMessage('Failed to update child dose', 500);
    cacheInvalidate();
    return jsonRows([updated]);
  }

  if (resource === 'notification') {
    const userId = url.searchParams.get('user_id') || body?.user_id;
    if (!userId) return jsonMessage('user_id is required', 400);

    if (action === 'markRead' && id) {
      const next = await updateNotificationsForUser(userId, (list) =>
        list.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
      if (next === null) return jsonMessage('User not found', 404);
      return jsonMessage('Marked as read');
    }

    if (action === 'markAllRead') {
      const next = await updateNotificationsForUser(userId, (list) =>
        list.map((n) => ({ ...n, is_read: true }))
      );
      if (next === null) return jsonMessage('User not found', 404);
      return jsonMessage('All marked as read');
    }
  }

  if (resource === 'reservation' && action === 'create') {
    return await handlePost(path, url, body);
  }

  if (resource === 'reservation' && action === 'reservationById' && id) {
    const allowedStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
    const newStatus = body.status;
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return jsonMessage(`status must be one of: ${allowedStatuses.join(', ')}`, 400);
    }
    const shouldNotify = !!body.notify;
    const STATUS_NOTIF = {
      Confirmed:  { title: 'Reservation Confirmed ✅',  message: 'Your reservation has been confirmed. We look forward to seeing you!' },
      Cancelled:  { title: 'Reservation Cancelled',     message: 'Your reservation has been cancelled. Contact us if you need help.' },
      Completed:  { title: 'Appointment Completed 🎉',  message: 'Your appointment is now marked as completed. Thank you!' },
    };

    // Try DB table first
    const table = await resolveTable(['reservation', 'reservations']);
    if (table) {
      const { data, error } = await supabaseServer
        .from(table)
        .update({ status: newStatus })
        .or(`reservation_id.eq.${id},id.eq.${id}`)
        .select('*');
      if (!error && data?.length > 0) {
        // Auto-notify user when admin triggers notify flag
        if (shouldNotify && STATUS_NOTIF[newStatus] && data[0].user_id) {
          await addNotificationForUser(
            data[0].user_id,
            makeNotification({ ...STATUS_NOTIF[newStatus], type: 'reservation', link: '/profile' })
          ).catch(() => {});
        }
        // Auto-complete linked child_dose when reservation is marked Completed
        if (newStatus === 'Completed' && data[0].child_dose_id) {
          const today = new Date().toISOString().slice(0, 10);
          const cdTable = await resolveTable(['child_doses', 'childdose', 'child_dose']);
          if (cdTable) {
            await supabaseServer
              .from(cdTable)
              .update({ status: 'Completed', administered_date: today })
              .or(`child_dose_id.eq.${data[0].child_dose_id},id.eq.${data[0].child_dose_id}`)
              .catch(() => {});
          } else {
            const cdFound = await findChildDoseLocation(data[0].child_dose_id);
            if (cdFound) {
              const next = [...cdFound.childDoses];
              next[cdFound.index] = { ...cdFound.childDose, status: 'Completed', administered_date: today };
              await updateUserMetaArray(cdFound.user.id, 'child_doses', next).catch(() => {});
            }
          }
        }
        cacheInvalidate();
        return jsonRows([mapReservation(data[0])]);
      }
    }
    // Fallback: user_metadata
    const found = await findReservationLocation(id);
    if (!found) return jsonMessage('Reservation not found', 404);
    const updated = { ...found.reservation, status: newStatus };
    const updatedReservations = [...found.reservations];
    updatedReservations[found.index] = updated;
    const saved = await updateUserMetaArray(found.user.id, 'reservations', updatedReservations);
    if (!saved) return jsonMessage('Failed to update reservation', 500);
    // Auto-notify user when admin triggers notify flag
    if (shouldNotify && STATUS_NOTIF[newStatus] && found.reservation.user_id) {
      await addNotificationForUser(
        found.reservation.user_id,
        makeNotification({ ...STATUS_NOTIF[newStatus], type: 'reservation', link: '/profile' })
      ).catch(() => {});
    }
    // Auto-complete linked child_dose when reservation is marked Completed
    if (newStatus === 'Completed' && found.reservation.child_dose_id) {
      const today = new Date().toISOString().slice(0, 10);
      const cdTable = await resolveTable(['child_doses', 'childdose', 'child_dose']);
      if (cdTable) {
        await supabaseServer
          .from(cdTable)
          .update({ status: 'Completed', administered_date: today })
          .or(`child_dose_id.eq.${found.reservation.child_dose_id},id.eq.${found.reservation.child_dose_id}`)
          .catch(() => {});
      } else {
        const cdFound = await findChildDoseLocation(found.reservation.child_dose_id);
        if (cdFound) {
          const next = [...cdFound.childDoses];
          next[cdFound.index] = { ...cdFound.childDose, status: 'Completed', administered_date: today };
          await updateUserMetaArray(cdFound.user.id, 'child_doses', next).catch(() => {});
        }
      }
    }
    cacheInvalidate();
    return jsonRows([mapReservation(updated)]);
  }

  return jsonMessage('Endpoint not found', 404);
}

async function handleDelete(path, url) {
  const [resource, action, id] = normalizePath(path);

  if (resource === 'user' && action === 'userById' && id) {
    const { error } = await supabaseServer.auth.admin.deleteUser(id);
    if (error) return jsonMessage(error.message, 500);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'doctor' && action === 'delete' && id) {
    const { error } = await supabaseServer.auth.admin.deleteUser(id);
    if (error) return jsonMessage(error.message, 500);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'doctor' && action === 'Appointments' && id) {
    const deleted = await deleteById(
      APPOINTMENT_TABLE_CANDIDATES,
      ['availability_id', 'id', '_id'],
      id
    );
    if (deleted) return jsonMessage('Deleted successfully');

    const found = await findDoctorWithAppointment(id);
    if (!found) return jsonMessage('Appointment not found', 404);
    const updatedAppointments = found.appointments.filter((_, index) => index !== found.index);
    const saved = await updateDoctorAppointmentsInMeta(found.user.id, updatedAppointments);
    if (!saved) return jsonMessage('Appointment delete failed', 500);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'article' && action === 'articleById' && id) {
    const deleted = await deleteById(['article', 'articles'], ['_id', 'id', 'article_id'], id);
    if (!deleted) return jsonMessage('Article not found', 404);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'medicine' && action === 'medicineById' && id) {
    const deleted = await deleteById(['medicine', 'medicines'], ['_id', 'id', 'medicine_id'], id);
    if (!deleted) return jsonMessage('Medicine not found', 404);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'vaccine' && action === 'vaccineById' && id) {
    const deleted = await deleteById(['vaccine', 'vaccines'], ['vaccine_id', 'id', '_id'], id);
    if (!deleted) return jsonMessage('Vaccine not found', 404);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'dose' && action === 'doseById' && id) {
    const deleted = await deleteById(['dose', 'doses'], ['dose_id', 'id', '_id'], id);
    if (!deleted) return jsonMessage('Dose not found', 404);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'child' && action === 'childById' && id) {
    const deleted = await deleteById(['child', 'children'], ['child_id', 'id', '_id'], id);
    if (!deleted) return jsonMessage('Child not found', 404);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'child_dose' && action === 'childDoseById' && id) {
    const deleted = await deleteById(['child_doses', 'childdose', 'child_dose'], ['child_dose_id', 'id', '_id'], id);
    if (!deleted) return jsonMessage('Child dose not found', 404);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'reservation' && action === 'reservationById' && id) {
    const deleted = await deleteById(['reservation', 'reservations'], ['reservation_id', 'id', '_id'], id);
    if (deleted) return jsonMessage('Deleted successfully');

    const found = await findReservationLocation(id);
    if (!found) return jsonMessage('Reservation not found', 404);
    const updatedReservations = found.reservations.filter((_, index) => index !== found.index);
    const saved = await updateUserMetaArray(found.user.id, 'reservations', updatedReservations);
    if (!saved) return jsonMessage('Reservation delete failed', 500);
    return jsonMessage('Deleted successfully');
  }

  if (resource === 'notification') {
    const userId = url.searchParams.get('user_id');
    if (!userId) return jsonMessage('user_id is required', 400);

    if (action === 'byId' && id) {
      const next = await updateNotificationsForUser(userId, (list) =>
        list.filter((n) => n.id !== id)
      );
      if (next === null) return jsonMessage('User not found', 404);
      return jsonMessage('Deleted successfully');
    }

    if (action === 'clearAll') {
      const next = await updateNotificationsForUser(userId, () => []);
      if (next === null) return jsonMessage('User not found', 404);
      return jsonMessage('Cleared');
    }
  }

  return jsonMessage('Endpoint not found', 404);
}

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const path = normalizePath(resolvedParams?.path);
    return await handleGet(path, new URL(request.url));
  } catch (error) {
    return jsonMessage(error?.message || 'Request failed', 500);
  }
}

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const path = normalizePath(resolvedParams?.path);
    const body = await request.json();
    const result = await handlePost(path, new URL(request.url), body);
    cacheInvalidate();
    return result;
  } catch (error) {
    return jsonMessage(error?.message || 'Request failed', 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const path = normalizePath(resolvedParams?.path);
    const body = await request.json();
    const result = await handlePut(path, new URL(request.url), body);
    cacheInvalidate();
    return result;
  } catch (error) {
    return jsonMessage(error?.message || 'Request failed', 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const path = normalizePath(resolvedParams?.path);
    const result = await handleDelete(path, new URL(request.url));
    cacheInvalidate();
    return result;
  } catch (error) {
    return jsonMessage(error?.message || 'Request failed', 500);
  }
}
