'use server';

import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

interface StoryboardScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  memoirExcerpt: string;
  mangaPrompt: string;
  animePrompt: string;
  suggestedStyle: 'manga' | 'anime';
  estimatedDuration?: number;
  characters: string[];
  locations: string[];
}

interface StoryboardResult {
  success: boolean;
  title: string;
  summary: string;
  totalScenes: number;
  scenes: StoryboardScene[];
  characters: string[];
  locations: string[];
  themes: string[];
}

/**
 * Generate storyboard from PDF or text memoir
 * Uses Google Gemini Pro to analyze and extract scenes
 */
export async function generateStoryboardFromMemoir(
  memoirText: string,
  title?: string,
  numScenes: number = 8
): Promise<StoryboardResult> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: must be logged in');

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('Google Generative AI API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a creative storyboard director for manga and anime adaptations.

Analyze this memoir/story text and create a detailed storyboard with exactly ${numScenes} key scenes.

MEMOIR TEXT:
${memoirText.substring(0, 8000)} ${memoirText.length > 8000 ? '...[truncated]' : ''}

REQUIREMENTS:
1. Extract ${numScenes} pivotal scenes that work best for visual storytelling
2. Each scene should be 2-3 sentences that capture the emotional core
3. Create manga prompts (detailed illustration descriptions)
4. Create anime prompts (movement, pacing, camera directions)
5. Identify key characters, locations, and themes
6. Suggest whether each scene works better as manga panel or anime clip

RESPOND IN THIS EXACT JSON FORMAT:
{
  "title": "Story Title",
  "summary": "1-2 sentence summary of the story",
  "characters": ["Character 1", "Character 2", "..."],
  "locations": ["Location 1", "Location 2", "..."],
  "themes": ["Theme 1", "Theme 2", "..."],
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "description": "2-3 sentence scene description",
      "memoirExcerpt": "Relevant quote or excerpt from memoir",
      "mangaPrompt": "Detailed manga panel prompt (300 chars max) with visual style, composition, characters, emotions",
      "animePrompt": "Anime sequence prompt with movement, timing (5-15 sec), camera directions, audio notes",
      "suggestedStyle": "manga|anime",
      "estimatedDuration": 5,
      "characters": ["character names in this scene"],
      "locations": ["locations in this scene"]
    },
    ...
  ]
}

IMPORTANT:
- Be creative and cinematic
- Each manga prompt should be a vivid visual description
- Each anime prompt should include camera movement and pacing
- Prompts must be detailed enough for AI image/video generation
- Include emotions, lighting, atmosphere in descriptions`;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();

    // Extract JSON from response (sometimes Gemini wraps it in markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse storyboard response from Gemini');
    }

    const storyboardData = JSON.parse(jsonMatch[0]);

    // Add IDs and format scenes
    const scenes: StoryboardScene[] = storyboardData.scenes.map(
      (scene: any, idx: number) => ({
        id: `scene_${idx + 1}`,
        sceneNumber: idx + 1,
        title: scene.title,
        description: scene.description,
        memoirExcerpt: scene.memoirExcerpt,
        mangaPrompt: scene.mangaPrompt,
        animePrompt: scene.animePrompt,
        suggestedStyle: scene.suggestedStyle,
        estimatedDuration: scene.estimatedDuration || 5,
        characters: scene.characters || [],
        locations: scene.locations || [],
      })
    );

    return {
      success: true,
      title: title || storyboardData.title,
      summary: storyboardData.summary,
      totalScenes: scenes.length,
      scenes,
      characters: storyboardData.characters || [],
      locations: storyboardData.locations || [],
      themes: storyboardData.themes || [],
    };
  } catch (error) {
    console.error('Gemini storyboard generation error:', error);
    throw error;
  }
}

/**
 * Extract text content from PDFs using Gemini Vision
 * Falls back to pdf-parse for basic extraction
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: must be logged in');

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('Google Generative AI API key not configured');
  }

  try {
    // For now, return a placeholder
    // In production, you'd fetch the PDF, convert pages to images,
    // and use Gemini Vision API
    console.log('PDF extraction placeholder - implement vision API integration');

    // TODO: Implement PDF to image conversion and Gemini Vision processing
    return '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}

/**
 * Generate creative prompt variations using Gemini
 * Takes a base prompt and generates manga/anime versions
 */
export async function generatePromptVariations(
  basePrompt: string,
  style: 'manga' | 'anime' = 'manga'
): Promise<{ mangaPrompt: string; animePrompt: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized: must be logged in');

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('Google Generative AI API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a professional manga and anime prompt engineer.

Take this base story concept and create two highly detailed, vivid prompts:

BASE PROMPT: "${basePrompt}"

REQUIREMENTS:
1. MANGA PROMPT: Detailed visual description for a manga panel illustration
   - Include: characters, clothing, expressions, composition, lighting, background details
   - Style hints: ink work, line work, emotional tone
   - Max 300 characters

2. ANIME PROMPT: Detailed description for animated sequence (5-10 seconds)
   - Include: character movements, camera pans/zooms, timing, mood
   - Include: audio/music suggestions
   - Max 400 characters

RESPOND ONLY IN THIS JSON FORMAT:
{
  "mangaPrompt": "...",
  "animePrompt": "..."
}`;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse prompt variations');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Prompt variation generation error:', error);
    throw error;
  }
}
