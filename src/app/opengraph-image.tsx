import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Trabajo Libre - Bolsa de Empleo en Latinoamérica'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #E30076 0%, #C40067 50%, #A80058 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 60px',
            maxWidth: '900px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: '24px',
            }}
          >
            Trabajo Libre
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              lineHeight: 1.4,
              marginBottom: '32px',
            }}
          >
            La plataforma #1 para encontrar empleo y contratar talento en Latinoamérica
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '12px 28px',
                background: 'white',
                color: '#E30076',
                fontSize: 22,
                fontWeight: 700,
                borderRadius: '12px',
              }}
            >
              Buscar Empleo
            </div>
            <div
              style={{
                padding: '12px 28px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: 22,
                fontWeight: 700,
                borderRadius: '12px',
                border: '2px solid rgba(255,255,255,0.5)',
              }}
            >
              Publicar Vacante
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            fontSize: 18,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          meserea.com
        </div>
      </div>
    ),
    { ...size }
  )
}
