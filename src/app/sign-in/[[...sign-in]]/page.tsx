'use client';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-plasma/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        <a href="/" className="text-2xl font-bold gradient-text mb-2">⛩ MangaMemoirs</a>
        <SignIn
          appearance={{
            variables: {
              colorBackground: '#0f0f1c',
              colorText: '#f0f0ff',
              colorInputBackground: '#161628',
              colorInputText: '#f0f0ff',
              colorPrimary: '#7c3aed',
              borderRadius: '12px',
            },
            elements: {
              card: 'shadow-2xl shadow-plasma/20 border border-plasma/20',
              headerTitle: 'text-white',
              headerSubtitle: 'text-white/60',
              formButtonPrimary: 'bg-plasma hover:bg-plasma-dark',
            },
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
