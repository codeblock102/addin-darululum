import { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { cn } from '@/lib/utils.ts'

interface LottiePlayerProps {
  src: string | object
  loop?: boolean
  autoplay?: boolean
  className?: string
  speed?: number
  ariaLabel?: string
}

export function LottiePlayer({ src, loop = true, autoplay = true, className, speed = 1, ariaLabel }: LottiePlayerProps) {
  const ref = useRef<LottieRefCurrentProps>(null)
  const [data, setData] = useState<object | null>(typeof src === 'string' ? null : src)

  useEffect(() => {
    if (typeof src === 'string') {
      fetch(src).then(r => r.json()).then(setData).catch(() => setData(null))
    } else {
      setData(src)
    }
  }, [src])

  useEffect(() => { ref.current?.setSpeed(speed) }, [speed])

  if (!data) return <div className={cn('animate-pulse bg-muted/30 rounded-md', className)} aria-hidden />
  return (
    <div className={className} role={ariaLabel ? 'img' : 'presentation'} aria-label={ariaLabel}>
      <Lottie lottieRef={ref} animationData={data} loop={loop} autoplay={autoplay} />
    </div>
  )
}
