import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../auth/AuthProvider'

export default function MyQrCode() {
  const { profile } = useAuth()
  if (!profile) return null

  return (
    <section className="qr-page">
      <h2>Your check-in code</h2>
      <p className="muted">Show this at the front desk to check in or out.</p>
      <div className="qr-frame">
        <QRCodeSVG value={profile.qr_token} size={240} />
      </div>
      <p className="muted">{profile.full_name}</p>
    </section>
  )
}
