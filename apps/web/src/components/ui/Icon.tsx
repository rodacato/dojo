import type { ReactNode } from 'react'

const SHAPES = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  katas: <path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16" />,
  scrolls: (
    <>
      <path d="M7 5h11a3 3 0 0 1 3 3v1h-6V8a3 3 0 0 0-6 0v9a3 3 0 0 1-6 0v-1h12v1a3 3 0 0 1-3 3H6" />
      <path d="M15 9v8M12 12h3" />
    </>
  ),
  engawa: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3m6 0h4" />
    </>
  ),
  kumite: (
    <>
      <rect x="3" y="5" width="7" height="14" rx="1" />
      <rect x="14" y="5" width="7" height="14" rx="1" />
      <path d="m7 10 2 2-2 2m10-4-2 2 2 2" />
    </>
  ),
  belts: <path d="M3 8h18v5H3zM9 13l-3 7h5l2-5m2-2 3 7h-5l-2-5M10 8l4 5m0-5-4 5" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" />
    </>
  ),
  signout: <path d="M10 4H5v16h5m-1-8h12m-4-4 4 4-4 4" />,
  theme: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof SHAPES

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 22, className = '' }: Readonly<IconProps>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {SHAPES[name]}
    </svg>
  )
}
