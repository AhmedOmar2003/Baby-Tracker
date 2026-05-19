import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import {
  demoArticles,
  demoChild,
  demoDoctors,
  demoDoses,
  demoMedicines,
  demoParent,
  demoVaccines,
} from '@/lib/demoContent';
import { deriveAppUserId } from '@/lib/userIdentity';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function toNumber(value) {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

async function resolveTable(candidates) {
  for (const candidate of candidates) {
    const { error } = await supabaseServer.from(candidate).select('*').limit(1);
    if (!error) return candidate;
  }
  return null;
}

function inferResourceType(candidates) {
  const joined = candidates.join('|').toLowerCase();
  if (joined.includes('article')) return 'article';
  if (joined.includes('medicine')) return 'medicine';
  if (joined.includes('vaccine')) return 'vaccine';
  if (joined.includes('dose')) return 'dose';
  if (joined.includes('child')) return 'child';
  if (joined.includes('reservation')) return 'reservation';
  return null;
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
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      category: meta.category || '',
      status: meta.status || 'published',
      views: toNumber(meta.views) || 0,
      references: Array.isArray(meta.references) ? meta.references : [],
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
      sideEffects: Array.isArray(meta.sideEffects || meta.side_effects) ? (meta.sideEffects || meta.side_effects) : [],
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

async function getUsers() {
  const { data, error } = await supabaseServer.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data?.users || [];
}

async function upsertAuthUserByEmail(seed) {
  const users = await getUsers();
  const existing = users.find((user) => `${user.email || ''}`.toLowerCase() === seed.email.toLowerCase());

  const metadata = {
    first_name: seed.first_name || '',
    last_name: seed.last_name || '',
    phone_number: seed.phone_number || '',
    whatsapp: seed.whatsapp || '',
    bio: seed.bio || '',
    rating: toNumber(seed.rating) || 0,
    role: seed.role || 'user',
    specialization: seed.specialization || '',
    license_number: seed.license_number || '',
    verified: seed.verified ?? true,
    image_url: seed.image_url || null,
    appointments: seed.appointments || [],
  };

  if (existing) {
    const updatePayload = {
      email: seed.email,
      password: seed.password,
      user_metadata: { ...(existing.user_metadata || {}), ...metadata },
    };
    const { data, error } = await supabaseServer.auth.admin.updateUserById(existing.id, updatePayload);
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabaseServer.auth.admin.createUser({
    email: seed.email,
    password: seed.password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return data.user;
}

async function upsertContentUser(resource, uniqueField, payload) {
  const users = await getUsers();
  const existing = users.find(
    (user) =>
      `${user?.user_metadata?.content_type || ''}` === resource &&
      `${user?.user_metadata?.[uniqueField] || ''}` === `${payload[uniqueField] || ''}`
  );

  const metadata = {
    role: 'Content',
    content_type: resource,
    ...payload,
  };

  if (existing) {
    const { data, error } = await supabaseServer.auth.admin.updateUserById(existing.id, {
      user_metadata: {
        ...(existing.user_metadata || {}),
        ...metadata,
      },
    });
    if (error) throw error;
    return mapContentUser(data.user, resource);
  }

  const { data, error } = await supabaseServer.auth.admin.createUser({
    email: `${resource}-${Date.now()}-${Math.random().toString(16).slice(2)}@babytracker.local`,
    password: `Content-${resource}-${Math.random().toString(16).slice(2, 10)}!`,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return mapContentUser(data.user, resource);
}

async function updateUserMetaArray(userId, key, nextItems) {
  const { data, error } = await supabaseServer.auth.admin.getUserById(userId);
  if (error || !data?.user) throw error || new Error('User not found');
  const res = await supabaseServer.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(data.user.user_metadata || {}),
      [key]: nextItems,
    },
  });
  if (res.error) throw res.error;
  return res.data.user;
}

async function findParentUserByAppId(appUserId) {
  const users = await getUsers();
  return users.find((user) => deriveAppUserId(user.id) === `${appUserId}`) || null;
}

async function upsertRow(tableCandidates, uniqueColumn, payload) {
  const table = await resolveTable(tableCandidates);
  if (!table) {
    const resource = inferResourceType(tableCandidates);
    if (resource === 'article' || resource === 'medicine' || resource === 'vaccine' || resource === 'dose') {
      const user = await upsertContentUser(resource, uniqueColumn, payload);
      return { resource, row: user };
    }
    return { skipped: true, reason: `Table not found: ${tableCandidates.join(', ')}` };
  }

  const { data: existingRows, error: readError } = await supabaseServer
    .from(table)
    .select('*')
    .eq(uniqueColumn, payload[uniqueColumn]);
  if (readError) throw readError;

  if (existingRows?.length) {
    const existing = existingRows[0];
    const key = existing.id ?? existing._id ?? existing[`${uniqueColumn}_id`] ?? existing[uniqueColumn];
    const updatePayload = { ...payload };
    delete updatePayload[uniqueColumn];
    const { data, error } = await supabaseServer
      .from(table)
      .update(updatePayload)
      .eq('id', existing.id ?? existing._id ?? key)
      .select('*');
    if (error) throw error;
    return { table, row: data?.[0] || existing };
  }

  const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
  if (error) throw error;
  return { table, row: data?.[0] || null };
}

async function upsertByMatch(tableCandidates, match, payload) {
  const table = await resolveTable(tableCandidates);
  if (!table) return { skipped: true, reason: `Table not found: ${tableCandidates.join(', ')}` };

  let query = supabaseServer.from(table).select('*');
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value);
  }
  const { data: existingRows, error: readError } = await query;
  if (readError) throw readError;

  if (existingRows?.length) {
    const existing = existingRows[0];
    const keyColumn = existing.id ? 'id' : existing._id ? '_id' : null;
    const selectorValue = existing.id ?? existing._id ?? existing[Object.keys(match)[0]];
    const { data, error } = await supabaseServer
      .from(table)
      .update(payload)
      .eq(keyColumn || Object.keys(match)[0], selectorValue)
      .select('*');
    if (error) throw error;
    return { table, row: data?.[0] || existing };
  }

  const { data, error } = await supabaseServer.from(table).insert(payload).select('*');
  if (error) throw error;
  return { table, row: data?.[0] || null };
}

async function seedDoctors() {
  const results = [];
  for (const doctor of demoDoctors) {
    const user = await upsertAuthUserByEmail(doctor);
    results.push({ id: user.id, email: user.email });
  }
  return results;
}

async function seedDoses() {
  const rows = [];
  for (const dose of demoDoses) {
    const result = await upsertRow(
      ['dose', 'doses'],
      'dose_name',
      {
        dose_name: dose.dose_name,
        recommended_age: dose.recommended_age,
        description: dose.description,
        image: dose.image || null,
      }
    );
    if (result.row) rows.push(result.row);
  }
  return rows;
}

async function seedVaccines(dosesByName) {
  const rows = [];
  for (const vaccine of demoVaccines) {
    const doseId = dosesByName.get(vaccine.dose_name) || null;
    const result = await upsertRow(
      ['vaccine', 'vaccines'],
      'vaccine_name',
      {
        vaccine_name: vaccine.vaccine_name,
        description: vaccine.description,
        min_age: vaccine.min_age,
        max_age: vaccine.max_age,
        doses_required: vaccine.doses_required,
        is_mandatory: vaccine.is_mandatory,
        dose_id: doseId,
        image: vaccine.image || null,
      }
    );
    if (result.row) rows.push(result.row);
  }
  return rows;
}

async function seedMedicines() {
  const rows = [];
  for (const medicine of demoMedicines) {
    const result = await upsertRow(
      ['medicine', 'medicines'],
      'name',
      {
        name: medicine.name,
        description: medicine.description,
        dosage: medicine.dosage,
        manufacturer: medicine.manufacturer,
        price: medicine.price,
        category: medicine.category,
        prescriptionRequired: medicine.prescriptionRequired,
        sideEffects: medicine.sideEffects,
        image: medicine.image,
      }
    );
    if (result.row) rows.push(result.row);
  }
  return rows;
}

async function seedArticles() {
  const rows = [];
  for (const article of demoArticles) {
    const result = await upsertRow(
      ['article', 'articles'],
      'title',
      {
        title: article.title,
        content: article.content,
        author: article.author,
        publicationDate: article.publicationDate,
        tags: article.tags,
        category: article.category,
        status: article.status,
        views: article.views,
        references: article.references,
        isFeatured: article.isFeatured,
        image: article.image,
      }
    );
    if (result.row) rows.push(result.row);
  }
  return rows;
}

async function seedDemoParentAndChild() {
  const parent = await upsertAuthUserByEmail(demoParent);
  const appUserId = deriveAppUserId(parent.id);
  const childTable = await resolveTable(['child', 'children']);
  if (!childTable) {
    const existingChildren = Array.isArray(parent.user_metadata?.children) ? parent.user_metadata.children : [];
    const child = {
      child_id: `child-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user_id: appUserId,
      first_name: demoChild.first_name,
      last_name: demoChild.last_name,
      gender: demoChild.gender,
      date_of_birth: demoChild.date_of_birth,
      weight: demoChild.weight,
      height: demoChild.height,
    };
    await updateUserMetaArray(parent.id, 'children', [...existingChildren, child]);
    return { parent, child };
  }

  const { data: childRows, error: childReadError } = await supabaseServer
    .from(childTable)
    .select('*')
    .eq('user_id', appUserId)
    .eq('first_name', demoChild.first_name)
    .eq('last_name', demoChild.last_name);
  if (childReadError) throw childReadError;

  let child = childRows?.[0] || null;
  if (child) {
    const { data, error } = await supabaseServer
      .from(childTable)
      .update({
        gender: demoChild.gender,
        date_of_birth: demoChild.date_of_birth,
        weight: demoChild.weight,
        height: demoChild.height,
      })
      .eq('child_id', child.child_id ?? child.id ?? child._id)
      .select('*');
    if (error) throw error;
    child = data?.[0] || child;
  } else {
    const { data, error } = await supabaseServer
      .from(childTable)
      .insert({
        user_id: appUserId,
        first_name: demoChild.first_name,
        last_name: demoChild.last_name,
        gender: demoChild.gender,
        date_of_birth: demoChild.date_of_birth,
        weight: demoChild.weight,
        height: demoChild.height,
      })
      .select('*');
    if (error) throw error;
    child = data?.[0] || null;
  }

  if (!child) {
    const existingChildren = Array.isArray(parent.user_metadata?.children) ? parent.user_metadata.children : [];
    child = {
      child_id: `child-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user_id: appUserId,
      first_name: demoChild.first_name,
      last_name: demoChild.last_name,
      gender: demoChild.gender,
      date_of_birth: demoChild.date_of_birth,
      weight: demoChild.weight,
      height: demoChild.height,
    };
    await updateUserMetaArray(parent.id, 'children', [...existingChildren, child]);
  }

  const existingChildren = Array.isArray(parent.user_metadata?.children) ? parent.user_metadata.children : [];
  const childRecord = {
    child_id: child.child_id ?? child.id ?? child._id ?? `child-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: appUserId,
    first_name: demoChild.first_name,
    last_name: demoChild.last_name,
    gender: demoChild.gender,
    date_of_birth: demoChild.date_of_birth,
    weight: demoChild.weight,
    height: demoChild.height,
  };
  const dedupChildren = existingChildren.filter(
    (item) => `${item?.child_id ?? item?.id ?? item?._id}` !== `${childRecord.child_id}`
  );
  await updateUserMetaArray(parent.id, 'children', [...dedupChildren, childRecord]);
  child = childRecord;

  return { parent, child };
}

async function seedChildDoses(child, doctorIds, dosesByName) {
  const childDoseTable = await resolveTable(['child_doses', 'childdose', 'child_dose']);
  if (!child) return [];
  if (!childDoseTable) {
    const parent = await findParentUserByAppId(child?.user_id);
    if (!parent) return [];
    const existingChildDoses = Array.isArray(parent.user_metadata?.child_doses) ? parent.user_metadata.child_doses : [];
    const fallbackRows = [];
    const doseSeeds = [
      {
        dose_name: 'Newborn Dose',
        doctor_id: doctorIds[0],
        scheduled_date: '2026-05-22',
        status: 'Completed',
        administered_date: '2026-05-22',
      },
      {
        dose_name: '2-Month Dose',
        doctor_id: doctorIds[1] || doctorIds[0],
        scheduled_date: '2026-06-22',
        status: 'Pending',
        administered_date: null,
      },
    ];

    const nextChildDoses = [...existingChildDoses];
    for (const seed of doseSeeds) {
      const doseId = dosesByName.get(seed.dose_name);
      if (!doseId) continue;
      const childDose = {
        child_dose_id: `childdose-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        child_id: child.child_id ?? child.id ?? child._id,
        doctor_id: seed.doctor_id,
        dose_id: doseId,
        scheduled_date: seed.scheduled_date,
        status: seed.status,
        administered_date: seed.administered_date,
      };
      nextChildDoses.push(childDose);
      fallbackRows.push(childDose);
    }
    await updateUserMetaArray(parent.id, 'child_doses', nextChildDoses);
    return fallbackRows;
  }

  const doseSeeds = [
    {
      dose_name: 'Newborn Dose',
      doctor_id: doctorIds[0],
      scheduled_date: '2026-05-22',
      status: 'Completed',
      administered_date: '2026-05-22',
    },
    {
      dose_name: '2-Month Dose',
      doctor_id: doctorIds[1] || doctorIds[0],
      scheduled_date: '2026-06-22',
      status: 'Pending',
      administered_date: null,
    },
  ];

  const rows = [];
  for (const seed of doseSeeds) {
    const doseId = dosesByName.get(seed.dose_name);
    if (!doseId) continue;
    const { data: existingRows, error: readError } = await supabaseServer
      .from(childDoseTable)
      .select('*')
      .eq('child_id', child.child_id ?? child.id ?? child._id)
      .eq('dose_id', doseId);
    if (readError) throw readError;

    const payload = {
      child_id: child.child_id ?? child.id ?? child._id,
      doctor_id: seed.doctor_id,
      dose_id: doseId,
      scheduled_date: seed.scheduled_date,
      status: seed.status,
      administered_date: seed.administered_date,
    };

    if (existingRows?.length) {
      const existing = existingRows[0];
      const key = existing.child_dose_id ?? existing.id ?? existing._id;
      const { data, error } = await supabaseServer
        .from(childDoseTable)
        .update(payload)
        .eq(existing.child_dose_id ? 'child_dose_id' : existing.id ? 'id' : '_id', key)
        .select('*');
      if (error) throw error;
      rows.push(data?.[0] || existing);
    } else {
      const { data, error } = await supabaseServer.from(childDoseTable).insert(payload).select('*');
      if (error) throw error;
      rows.push(data?.[0] || null);
    }
  }
  const parent = await findParentUserByAppId(child.user_id);
  if (parent) {
    const existingChildDoses = Array.isArray(parent.user_metadata?.child_doses) ? parent.user_metadata.child_doses : [];
    const mergedChildDoses = [...existingChildDoses];
    for (const row of rows) {
      if (!row) continue;
      const record = {
        child_dose_id: row.child_dose_id ?? row.id ?? row._id ?? `childdose-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        child_id: row.child_id ?? child.child_id ?? child.id ?? child._id,
        doctor_id: row.doctor_id || null,
        dose_id: row.dose_id || null,
        scheduled_date: row.scheduled_date || null,
        status: row.status || null,
        administered_date: row.administered_date || null,
      };
      const index = mergedChildDoses.findIndex(
        (item) => `${item?.child_dose_id ?? item?.id ?? item?._id}` === `${record.child_dose_id}`
      );
      if (index >= 0) mergedChildDoses[index] = record;
      else mergedChildDoses.push(record);
    }
    await updateUserMetaArray(parent.id, 'child_doses', mergedChildDoses);
  }
  return rows;
}

async function seedReservation(parentId, child, doctorId, childDoseId) {
  const reservationTable = await resolveTable(['reservation', 'reservations']);
  if (!child) return null;
  if (!reservationTable) {
    const parent = await findParentUserByAppId(deriveAppUserId(parentId));
    if (!parent) return null;
    const existingReservations = Array.isArray(parent.user_metadata?.reservations) ? parent.user_metadata.reservations : [];
    const reservation = {
      reservation_id: `reservation-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user_id: deriveAppUserId(parentId),
      doctor_id: doctorId,
      child_id: child.child_id ?? child.id ?? child._id,
      child_dose_id: childDoseId,
      reservation_date: '2026-06-22',
      reservation_time: '10:30',
      status: 'Pending',
      notes: 'Demo booking seeded by the admin content script.',
    };
    await updateUserMetaArray(parent.id, 'reservations', [...existingReservations, reservation]);
    return reservation;
  }
  const appUserId = deriveAppUserId(parentId);

  const payload = {
    user_id: appUserId,
    doctor_id: doctorId,
    child_id: child.child_id ?? child.id ?? child._id,
    child_dose_id: childDoseId,
    reservation_date: '2026-06-22',
    reservation_time: '10:30',
    status: 'Pending',
    notes: 'Demo booking seeded by the admin content script.',
  };

  const { data: existingRows, error: readError } = await supabaseServer
    .from(reservationTable)
    .select('*')
    .eq('user_id', appUserId)
    .eq('child_id', payload.child_id)
    .eq('doctor_id', doctorId)
    .eq('child_dose_id', childDoseId);
  if (readError) throw readError;

  if (existingRows?.length) {
    const existing = existingRows[0];
    const key = existing.reservation_id ?? existing.id ?? existing._id;
    const { data, error } = await supabaseServer
      .from(reservationTable)
      .update(payload)
      .eq(existing.reservation_id ? 'reservation_id' : existing.id ? 'id' : '_id', key)
      .select('*');
    if (error) throw error;
    return data?.[0] || existing;
  }

  const { data, error } = await supabaseServer.from(reservationTable).insert(payload).select('*');
  if (error) throw error;
  const reservation = data?.[0] || null;
  if (reservation) {
    const parent = await findParentUserByAppId(deriveAppUserId(parentId));
    if (parent) {
      const existingReservations = Array.isArray(parent.user_metadata?.reservations) ? parent.user_metadata.reservations : [];
      const record = {
        reservation_id: reservation.reservation_id ?? reservation.id ?? reservation._id ?? `reservation-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        user_id: deriveAppUserId(parentId),
        doctor_id: doctorId,
        child_id: child.child_id ?? child.id ?? child._id,
        child_dose_id: childDoseId,
        reservation_date: reservation.reservation_date || payload.reservation_date,
        reservation_time: reservation.reservation_time || payload.reservation_time,
        status: reservation.status || payload.status,
        notes: reservation.notes || payload.notes,
      };
      const index = existingReservations.findIndex(
        (item) => `${item?.reservation_id ?? item?.id ?? item?._id}` === `${record.reservation_id}`
      );
      if (index >= 0) existingReservations[index] = record;
      else existingReservations.push(record);
      await updateUserMetaArray(parent.id, 'reservations', existingReservations);
    }
  }
  return reservation;
}

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return json({ msg: 'Not available in production.' }, 404);
  }

  try {
    const doctorUsers = await seedDoctors();
    const doseRows = await seedDoses();
    const dosesByName = new Map(doseRows.map((row) => [row.dose_name, row.dose_id ?? row.id ?? row._id]));
    const vaccineRows = await seedVaccines(dosesByName);
    const medicineRows = await seedMedicines();
    const articleRows = await seedArticles();
    const demoFamily = await seedDemoParentAndChild();

    const doctorIds = doctorUsers.map((item) => item.id);
    let childDoseRows = await seedChildDoses(demoFamily.child, doctorIds, dosesByName);
    if (!childDoseRows.length && demoFamily.parent && demoFamily.child) {
      const fallbackChildDoses = [
        {
          child_dose_id: `childdose-${demoFamily.child.child_id}-newborn`,
          child_id: demoFamily.child.child_id,
          doctor_id: doctorIds[0],
          dose_id: dosesByName.get('Newborn Dose') || null,
          scheduled_date: '2026-05-22',
          status: 'Completed',
          administered_date: '2026-05-22',
        },
        {
          child_dose_id: `childdose-${demoFamily.child.child_id}-2m`,
          child_id: demoFamily.child.child_id,
          doctor_id: doctorIds[1] || doctorIds[0],
          dose_id: dosesByName.get('2-Month Dose') || null,
          scheduled_date: '2026-06-22',
          status: 'Pending',
          administered_date: null,
        },
      ].filter((row) => row.dose_id);
      if (fallbackChildDoses.length) {
        const parentUser = await findParentUserByAppId(deriveAppUserId(demoFamily.parent.id));
        if (parentUser) {
          const current = Array.isArray(parentUser.user_metadata?.child_doses) ? parentUser.user_metadata.child_doses : [];
          const merged = [...current];
          for (const row of fallbackChildDoses) {
            const index = merged.findIndex(
              (item) => `${item?.child_dose_id ?? item?.id ?? item?._id}` === `${row.child_dose_id}`
            );
            if (index >= 0) merged[index] = row;
            else merged.push(row);
          }
          await updateUserMetaArray(parentUser.id, 'child_doses', merged);
        }
        childDoseRows = fallbackChildDoses;
      }
    }

    let reservationRow =
      demoFamily.parent && demoFamily.child && childDoseRows.length
        ? await seedReservation(
            demoFamily.parent.id,
            demoFamily.child,
            doctorIds[0],
            childDoseRows[0]?.child_dose_id ?? childDoseRows[0]?.id ?? childDoseRows[0]?._id
          )
        : null;
    if (!reservationRow && demoFamily.parent && demoFamily.child && childDoseRows.length) {
      const fallbackReservation = {
        reservation_id: `reservation-${demoFamily.child.child_id}`,
        user_id: deriveAppUserId(demoFamily.parent.id),
        doctor_id: doctorIds[0],
        child_id: demoFamily.child.child_id,
        child_dose_id: childDoseRows[0]?.child_dose_id ?? childDoseRows[0]?.id ?? childDoseRows[0]?._id,
        reservation_date: '2026-06-22',
        reservation_time: '10:30',
        status: 'Pending',
        notes: 'Demo booking seeded by the admin content script.',
      };
      const parentUser = await findParentUserByAppId(deriveAppUserId(demoFamily.parent.id));
      if (parentUser) {
        const current = Array.isArray(parentUser.user_metadata?.reservations) ? parentUser.user_metadata.reservations : [];
        const next = [...current.filter((item) => `${item?.reservation_id ?? item?.id ?? item?._id}` !== fallbackReservation.reservation_id), fallbackReservation];
        await updateUserMetaArray(parentUser.id, 'reservations', next);
      }
      reservationRow = fallbackReservation;
    }

    return json({
      success: true,
      seeded: {
        doctors: doctorUsers.length,
        doses: doseRows.length,
        vaccines: vaccineRows.length,
        medicines: medicineRows.length,
        articles: articleRows.length,
        childDoses: childDoseRows.length,
        reservation: !!reservationRow,
      },
    });
  } catch (error) {
    return json({ success: false, msg: error?.message || 'Seeding failed' }, 500);
  }
}

export function GET() {
  return json({ msg: 'Use POST to seed demo content.' }, 405);
}
