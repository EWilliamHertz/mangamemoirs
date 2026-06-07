'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

interface StoryboardScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  memoirExcerpt: string;
  mangaPrompt: string;
  animePrompt: string;
  referenceIds: string[]; // Tagged references (people, animals, places)
  suggestedStyle?: string;
  estimatedDuration?: number; // in seconds for anime
}

interface StoryboardRequest {
  projectId: string;
  referenceIds: string[]; // IDs of uploaded PDF/DOCX/images
  memoirContent?: string; // Extracted or pasted text
  numScenes?: number;
  style?: string; // e.g., "manga", "anime", "webtoon"
}

export async function generateStoryboard(request: StoryboardRequest) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: must be logged in');
  }

  // For now, return a mock storyboard structure
  // In production, you'd:
  // 1. Fetch the referenced files
  // 2. Extract text from PDFs
  // 3. Use OpenAI to parse scenes and generate prompts
  // 4. Tag references with entities (people, animals, places)

  const mockScenes: StoryboardScene[] = [
    {
      id: 'scene_1',
      sceneNumber: 1,
      title: 'The Beginning',
      description: 'Introduction to the memoir protagonist',
      memoirExcerpt: 'This is where my story begins...',
      mangaPrompt: 'A young person sitting alone in a hospital room, looking out the window. Soft, melancholic lighting. Watercolor manga style.',
      animePrompt: '5-second scene: Young person sits on hospital bed, slow pan to window showing gray sky, subtle ambient sound of rain',
      referenceIds: [], // Would be tagged as: [{ type: 'person', name: 'protagonist' }]
      suggestedStyle: 'manga',
      estimatedDuration: 5,
    },
    {
      id: 'scene_2',
      sceneNumber: 2,
      title: 'Meeting a Friend',
      description: 'A meaningful encounter',
      memoirExcerpt: 'Then I met someone who would change everything...',
      mangaPrompt: 'Two friends meeting in a coffee shop. Warm, hopeful mood. Dynamic composition with speech bubbles.',
      animePrompt: '5-second scene: Two friends wave to each other across coffee shop, embrace, soft background music',
      referenceIds: [],
      suggestedStyle: 'manga',
      estimatedDuration: 5,
    },
    {
      id: 'scene_3',
      sceneNumber: 3,
      title: 'A Turning Point',
      description: 'A moment of realization',
      memoirExcerpt: 'In that moment, I realized...',
      mangaPrompt: 'Close-up of protagonist\'s face, eyes widening. Dramatic lighting with rays breaking through clouds. High emotional intensity.',
      animePrompt: '5-second scene: Character looks up in realization, camera zooms in on face, dramatic music swell',
      referenceIds: [],
      suggestedStyle: 'anime',
      estimatedDuration: 5,
    },
  ];

  return {
    success: true,
    projectId: request.projectId,
    storyboard: {
      title: 'Generated Storyboard',
      totalScenes: mockScenes.length,
      estimatedCreditsNeeded: {
        mangaPanels: mockScenes.length * 3, // 3 credits per panel
        animeClips: mockScenes.length * 2, // 2 credits per 5-second clip
      },
      scenes: mockScenes,
    },
  };
}

export interface SceneReferenceTag {
  type: 'person' | 'animal' | 'place' | 'object';
  name: string;
  description?: string;
  referenceImageId?: string; // Link to uploaded reference image
}

export async function tagSceneReferences(
  projectId: string,
  sceneId: string,
  tags: SceneReferenceTag[]
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: must be logged in');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Save tags to database (you'll need to create a scene_tags table)
  console.log(`Tagged scene ${sceneId} with:`, tags);

  return {
    success: true,
    sceneId,
    tagsSaved: tags.length,
  };
}
