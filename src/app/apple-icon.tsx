import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #E30076, #A80058)',
          borderRadius: '36px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 100, fontWeight: 800, color: 'white' }}>
          TL
        </div>
      </div>
    ),
    { ...size }
  )
}
