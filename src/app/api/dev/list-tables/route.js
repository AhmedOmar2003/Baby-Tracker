import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ msg: 'Not available in production.' }, { status: 404 });
  }

  try {
    const attempts = [
      () => supabaseServer.from('pg_tables').select('schemaname, tablename').eq('schemaname', 'public'),
      () => supabaseServer.schema('pg_catalog').from('pg_tables').select('schemaname, tablename').eq('schemaname', 'public'),
    ];

    let data = null;
    let error = null;
    for (const attempt of attempts) {
      try {
        const result = await attempt();
        data = result.data;
        error = result.error;
        if (!error) break;
      } catch (err) {
        error = err;
      }
    }

    if (error) {
      return NextResponse.json({ success: false, msg: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tables: data || [] });
  } catch (error) {
    return NextResponse.json({ success: false, msg: error?.message || 'Failed to list tables' }, { status: 500 });
  }
}
