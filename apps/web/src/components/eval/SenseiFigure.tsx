import { useState } from 'react'

type SenseiPose = 'review' | 'explain'

/** Decorative. The pose never depends on the verdict, so the art cannot give a result away. */
export function SenseiFigure({ pose, className = '' }: Readonly<{ pose: SenseiPose; className?: string }>) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={`/art/sensei/${pose}.webp`}
      alt=""
      aria-hidden
      data-testid={`sensei-${pose}`}
      width={128}
      height={112}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
