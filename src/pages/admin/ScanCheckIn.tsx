import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabase'

interface ScanResult {
  action: 'checked_in' | 'checked_out'
  full_name: string
}

const READER_ID = 'qr-reader'

export default function ScanCheckIn() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  // Stops the same code firing repeatedly while it stays in frame.
  const lastTokenRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  async function handleToken(token: string) {
    if (token === lastTokenRef.current) return
    lastTokenRef.current = token
    setError(null)

    const { data, error } = await supabase.rpc('scan_check_in', { token })
    if (error) {
      setError(error.message)
      setResult(null)
    } else {
      setResult(data as ScanResult)
    }

    setTimeout(() => {
      lastTokenRef.current = null
    }, 3000)
  }

  async function start() {
    setError(null)
    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        handleToken,
        () => {},
      )
      setScanning(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start camera')
    }
  }

  async function stop() {
    await scannerRef.current?.stop().catch(() => {})
    scannerRef.current = null
    setScanning(false)
  }

  return (
    <section>
      <h2>Scan check-in</h2>
      <p className="muted">
        Point the camera at a member's QR code. Scanning checks them in, or out
        if they are already in.
      </p>

      <div id={READER_ID} className="qr-reader" />

      <div className="row-gap">
        {!scanning ? (
          <button onClick={start}>Start camera</button>
        ) : (
          <button onClick={stop}>Stop</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {result && (
        <p className={`scan-result scan-${result.action}`}>
          {result.full_name}{' '}
          {result.action === 'checked_in' ? 'checked in' : 'checked out'}
        </p>
      )}
    </section>
  )
}
