'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export interface StoryboardTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  sceneCount: number;
  sceneTemplate: {
    title: string;
    description: string;
    panelPrompt?: string;
    clipPrompt?: string;
    tags: string[];
  }[];
  createdAt: string;
}

export async function saveTemplate(
  projectId: string,
  templateName: string,
  templateDescription: string,
  scenes: any[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const template: StoryboardTemplate = {
    id: crypto.randomUUID(),
    userId,
    name: templateName,
    description: templateDescription,
    sceneCount: scenes.length,
    sceneTemplate: scenes.map((s) => ({
      title: s.title,
      description: s.description,
      panelPrompt: s.panelPrompt,
      clipPrompt: s.clipPrompt,
      tags: s.tags || [],
    })),
    createdAt: new Date().toISOString(),
  };

  // Store as JSON in projects metadata
  const { error } = await supabase
    .from('projects')
    .update({
      metadata: { template: template },
    })
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
  return template;
}

export async function loadTemplate(projectId: string, templateId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('projects')
    .select('metadata')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data?.metadata?.template;
}

export async function listUserTemplates() {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('projects')
    .select('metadata')
    .eq('user_id', userId);

  if (error) throw error;

  // Extract templates from all projects
  const templates: StoryboardTemplate[] = [];
  data?.forEach((project) => {
    if (project.metadata?.template) {
      templates.push(project.metadata.template);
    }
  });

  return templates;
}
