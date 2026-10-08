export default function SetupNotice() {
  return (
    <div className="setup-notice">
      <strong>Supabase isn't connected yet.</strong>
      <p>
        <code>.env</code> still holds placeholder values, so there is no
        database to create accounts in. Add your project URL and anon key from
        the Supabase dashboard (Settings &rarr; API), then restart the dev
        server.
      </p>
    </div>
  )
}
