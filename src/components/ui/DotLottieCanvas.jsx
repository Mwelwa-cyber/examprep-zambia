import { useEffect, useRef, useState } from 'react'
import { DotLottie } from '@lottiefiles/dotlottie-web'

export const ZED_EXAMS_LOTTIE_SRC =
  'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie'

function matchesMinimumViewport(minViewportWidth) {
  if (!minViewportWidth || typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia(`(min-width: ${minViewportWidth}px)`).matches
}

export default function DotLottieCanvas({
  src = ZED_EXAMS_LOTTIE_SRC,
  autoplay = true,
  loop = true,
  minViewportWidth = 0,
  className = '',
  canvasClassName = '',
}) {
  const canvasRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [canLoad, setCanLoad] = useState(() => matchesMinimumViewport(minViewportWidth))

  useEffect(() => {
    if (!minViewportWidth || typeof window === 'undefined' || !window.matchMedia) return undefined

    const query = window.matchMedia(`(min-width: ${minViewportWidth}px)`)
    const handleChange = () => setCanLoad(query.matches)
    handleChange()
    query.addEventListener('change', handleChange)

    return () => {
      query.removeEventListener('change', handleChange)
    }
  }, [minViewportWidth])

  useEffect(() => {
    if (!canLoad) return undefined

    const canvas = canvasRef.current
    if (!canvas || failed) return undefined

    const dotLottie = new DotLottie({
      autoplay,
      loop,
      canvas,
      src,
      backgroundColor: 'transparent',
      layout: { fit: 'contain', align: [0.5, 0.5] },
      renderConfig: {
        autoResize: true,
        freezeOnOffscreen: true,
      },
    })

    function handleLoadError() {
      setFailed(true)
    }

    dotLottie.addEventListener('loadError', handleLoadError)

    return () => {
      dotLottie.removeEventListener('loadError', handleLoadError)
      dotLottie.destroy()
    }
  }, [autoplay, canLoad, failed, loop, src])

  if (failed || !canLoad) return null

  return (
    <div className={className} aria-hidden="true">
      <canvas
        ref={canvasRef}
        width="420"
        height="420"
        className={`block h-full w-full ${canvasClassName}`}
      />
    </div>
  )
}
