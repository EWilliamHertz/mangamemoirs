import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return _openai;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { story, style, mood, referenceContext } = await req.json();
  if (!story) return NextResponse.json({ error: 'Story required' }, { status: 400 });

  const systemPrompt = `You are a manga storyboard director. Break the provided story into 4-12 scenes for a ${style || 'manga'} adaptation.

Return ONLY valid JSON: an array of scene objects with:
{
  "index": number (1-based),
  "title": string (3-5 words),
  "description": string (2-3 sentences, narrative description),
  "visualPrompt": string (detailed visual prompt for image generation, include character poses, camera angle, lighting, background),
  "mood": string (one of: dramatic, peaceful, action, romantic, melancholic, tense, comedic, mysterious, epic),
  "panelType": string (one of: full-page, splash, action-sequence, close-up, panoramic, grid-4, grid-6),
  "characters": string[] (character names/descriptions present),
  "settingNote": string (location and time of day)
}

${referenceContext ? `Reference context: ${referenceContext}` : ''}
Overall mood target: ${mood || 'dramatic'}`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Story:\n\n${story.slice(0, 8000)}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const content = response.choices[0].message.content ?? '{"scenes":[]}';
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const scenes = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.scenes) ? parsed.scenes : []);

  return NextResponse.json({ scenes });
}
