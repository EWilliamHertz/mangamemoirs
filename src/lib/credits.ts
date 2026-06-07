// Credit costs — mathematically derived:
// Panel: DALL-E 3 HD costs ~$0.08/image. At $4.99/20cr = $0.25/cr → 2cr covers cost + 6x margin.
// Clip:  Video gen costs ~$0.50/5s.   At $0.25/cr → 5cr = $1.25 → ~2.5x margin for compute.
// Margin funds hosting, Supabase storage, and OpenAI markup.

export const CREDIT_COSTS = {
  PANEL: 1,       // manga panel (Stable Diffusion 3 via HF)
  CLIP: 10,       // 5-second anime clip
  SCENE_BREAK: 0, // GPT-4o scene breakdown is free (keep conversion funnel smooth)
} as const;

export const SIGNUP_BONUS = 8; // 3 panels (6cr) + free clip start (2cr) = 8cr

export const PACKS = [
  { id: 'starter',  label: 'Starter',  price: '$4.99',  credits: 20,  polarProductEnv: 'NEXT_PUBLIC_POLAR_PRODUCT_STARTER' },
  { id: 'creator',  label: 'Creator',  price: '$14.99', credits: 75,  polarProductEnv: 'NEXT_PUBLIC_POLAR_PRODUCT_CREATOR' },
  { id: 'studio',   label: 'Studio',   price: '$39.99', credits: 250, polarProductEnv: 'NEXT_PUBLIC_POLAR_PRODUCT_STUDIO' },
] as const;

export type CreditAction = keyof typeof CREDIT_COSTS;
