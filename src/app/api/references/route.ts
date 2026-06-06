import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createServerClient();
  const { data } = await db.from('references').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return NextResponse.json({ references: data ?? [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServerClient();
  const formData = await req.formData();
  const type = formData.get('type') as string;
  const name = formData.get('name') as string;
  const textContent = formData.get('content') as string | null;
  const file = formData.get('file') as File | null;

  let content: string | null = textContent;
  let fileUrl: string | null = null;

  if (file) {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from('references')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = db.storage.from('references').getPublicUrl(path);
    fileUrl = urlData.publicUrl;

    if (type === 'pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        content = pdfData.text.slice(0, 10000);
      } catch {
        content = '(PDF text extraction failed — file stored for visual reference)';
      }
    }
  }

  const { data, error } = await db.from('references').insert({
    user_id: userId,
    name: name || file?.name || 'Reference',
    type,
    content,
    file_url: fileUrl,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reference: data });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const db = createServerClient();
  await db.from('references').delete().eq('id', id).eq('user_id', userId);
  return NextResponse.json({ ok: true });
}
