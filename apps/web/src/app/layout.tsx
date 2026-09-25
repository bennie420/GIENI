import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gieni OS — Evidence-First Probate Platform',
  description: 'Gieni OS modular probate intelligence and investigation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <header
            style={{
              borderBottom: '1px solid var(--border)',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  letterSpacing: '-0.5px',
                }}
              >
                GIENI OS
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--bg-hover)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                PROTOTYPE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <nav style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', fontWeight: 500 }}>
                <a href="/">Overview</a>
                <a href="/operator">Operator Console</a>
                <a href="/client">Client Portal</a>
              </nav>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--accent)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>
          <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}