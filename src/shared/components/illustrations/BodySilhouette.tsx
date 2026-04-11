/**
 * Silhueta anatômica SVG — marca pontos de medida e destaca o ponto em foco.
 * Usada nos wizards de dobras cutâneas e perimetria.
 */
export type BodyPoint =
  // Dobras
  | 'subscapular'
  | 'triceps'
  | 'biceps'
  | 'chest'
  | 'midaxillary'
  | 'suprailiac'
  | 'abdominal'
  | 'thigh'
  | 'calf'
  // Perimetria
  | 'shoulder'
  | 'circ_chest'
  | 'waist'
  | 'abdomen'
  | 'hip'
  | 'arm'
  | 'forearm'
  | 'circ_thigh'
  | 'circ_calf'

interface Props {
  active?: BodyPoint | null
  className?: string
  view?: 'front' | 'back'
}

// Coordenadas (x,y) para cada ponto na silhueta 200x400
const POINTS: Record<BodyPoint, { x: number; y: number; side: 'front' | 'back' }> = {
  // Dobras
  subscapular: { x: 128, y: 128, side: 'back' },
  triceps: { x: 56, y: 148, side: 'back' },
  biceps: { x: 56, y: 148, side: 'front' },
  chest: { x: 78, y: 130, side: 'front' },
  midaxillary: { x: 66, y: 140, side: 'front' },
  suprailiac: { x: 75, y: 185, side: 'front' },
  abdominal: { x: 100, y: 180, side: 'front' },
  thigh: { x: 90, y: 235, side: 'front' },
  calf: { x: 90, y: 305, side: 'front' },
  // Perimetria
  shoulder: { x: 100, y: 112, side: 'front' },
  circ_chest: { x: 100, y: 140, side: 'front' },
  waist: { x: 100, y: 175, side: 'front' },
  abdomen: { x: 100, y: 192, side: 'front' },
  hip: { x: 100, y: 215, side: 'front' },
  arm: { x: 56, y: 155, side: 'front' },
  forearm: { x: 48, y: 195, side: 'front' },
  circ_thigh: { x: 85, y: 240, side: 'front' },
  circ_calf: { x: 85, y: 310, side: 'front' },
}

export function BodySilhouette({ active = null, className = '', view = 'front' }: Props) {
  const points = Object.entries(POINTS) as Array<[BodyPoint, (typeof POINTS)[BodyPoint]]>

  return (
    <svg
      viewBox="0 0 200 400"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#E91E63" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id="pointPulse">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
          <stop offset="60%" stopColor="#00E5FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Silhueta simplificada */}
      <g stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="url(#bodyGrad)">
        {/* Cabeça */}
        <circle cx="100" cy="40" r="22" />
        {/* Pescoço */}
        <path d="M 88 60 L 88 78 L 112 78 L 112 60" />
        {/* Tronco */}
        <path d="M 60 80 Q 50 90 50 110 L 55 200 Q 60 210 70 215 L 130 215 Q 140 210 145 200 L 150 110 Q 150 90 140 80 L 112 78 L 88 78 Z" />
        {/* Braço esquerdo */}
        <path d="M 50 95 Q 38 110 36 135 L 34 190 Q 34 205 40 215 L 50 218 Q 52 205 52 190 L 54 140 Q 55 115 60 98" />
        {/* Braço direito */}
        <path d="M 150 95 Q 162 110 164 135 L 166 190 Q 166 205 160 215 L 150 218 Q 148 205 148 190 L 146 140 Q 145 115 140 98" />
        {/* Perna esquerda */}
        <path d="M 70 215 Q 66 260 70 310 L 72 360 Q 75 375 85 378 L 95 378 Q 97 360 96 310 L 96 230 Z" />
        {/* Perna direita */}
        <path d="M 130 215 Q 134 260 130 310 L 128 360 Q 125 375 115 378 L 105 378 Q 103 360 104 310 L 104 230 Z" />
      </g>

      {/* Linhas de "blueprint" */}
      <g stroke="rgba(0,229,255,0.15)" strokeWidth="0.5" strokeDasharray="2,3">
        <line x1="0" y1="100" x2="200" y2="100" />
        <line x1="0" y1="175" x2="200" y2="175" />
        <line x1="0" y1="250" x2="200" y2="250" />
        <line x1="100" y1="0" x2="100" y2="400" />
      </g>

      {/* Pontos */}
      {points
        .filter(([, p]) => p.side === view || view === 'front')
        .map(([key, p]) => {
          const isActive = active === key
          return (
            <g key={key}>
              {isActive && (
                <circle cx={p.x} cy={p.y} r="12" fill="url(#pointPulse)">
                  <animate
                    attributeName="r"
                    values="8;14;8"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 4 : 2.5}
                fill={isActive ? '#00E5FF' : 'rgba(255,255,255,0.55)'}
                stroke={isActive ? '#fff' : 'none'}
                strokeWidth="1"
              />
            </g>
          )
        })}
    </svg>
  )
}
