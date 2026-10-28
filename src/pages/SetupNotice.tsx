export default function SetupNotice({ fullPage = false }: { fullPage?: boolean }) {
  const notice = (
    <div className="setup-notice">
      <strong>Supabase isn't connected.</strong>
      <p>
        <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
        are missing or still placeholders. Set them in your hosting
        provider's environment variables (or <code>.env</code> locally) and
        rebuild.
      </p>
    </div>
  )

  if (!fullPage) return notice

  return (
    <div className="auth-card">
      <h1>Setup needed</h1>
      {notice}
    </div>
  )
}
