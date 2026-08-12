'use client'

/**
 * Replaces the root layout when it is the layout itself that failed, so this cannot rely on
 * anything the app provides — no fonts, no tokens, no components. Inline styles only.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ margin: '0 auto', maxWidth: '32rem', padding: '4rem 1.5rem' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 500 }}>Something went wrong</h1>
          <p style={{ color: '#a1a1a1', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Verify failed to start. Your domains are unaffected.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 0.875rem',
              borderRadius: 6,
              border: 0,
              background: '#fff',
              color: '#000',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
