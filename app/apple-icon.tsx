import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#1d3fa0',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            color: '#ffffff',
            fontSize: 60,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          SHB
        </div>
        <div
          style={{
            color: '#93c5fd',
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 4,
            marginTop: 4,
          }}
        >
          HUB
        </div>
      </div>
    ),
    { ...size }
  )
}
