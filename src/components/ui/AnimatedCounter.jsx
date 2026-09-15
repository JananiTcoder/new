import { useEffect, useRef, useState } from 'react'

export default function AnimatedCounter({ value, duration = 900, format = (n) => n.toLocaleString() }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const fromRef = useRef(0)

  useEffect(() => {
    fromRef.current = display
    startRef.current = null
    let raf
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts
      const progress = Math.min(1, (ts - startRef.current) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = fromRef.current + (value - fromRef.current) * eased
      setDisplay(current)
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{format(Math.round(display))}</>
}
