export default function PageLoader() {
  return (
    <>
      {/* Top progress bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 10000,
          background: 'linear-gradient(90deg, #10B981 0%, #34D399 40%, #6EE7B7 60%, #10B981 100%)',
          backgroundSize: '200% 100%',
          animation: 'zed-page-load 1.4s ease-in-out infinite',
        }}
      />
      {/* Full-screen backdrop with spinner — ensures the user sees activity
          rather than a blank white screen while auth / profile is loading. */}
      <div
        role="status"
        aria-label="Loading…"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          gap: 16,
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          style={{ animation: 'zed-spin 0.9s linear infinite' }}
          aria-hidden="true"
        >
          <circle cx="24" cy="24" r="20" stroke="#E5E7EB" strokeWidth="4" />
          <path
            d="M44 24a20 20 0 0 0-20-20"
            stroke="#10B981"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ color: '#6B7280', fontSize: 14, fontFamily: 'sans-serif' }}>
          Loading…
        </span>
      </div>
      <style>{`
        @keyframes zed-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
