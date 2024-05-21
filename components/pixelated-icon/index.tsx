'use client'

import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'
import styles from './index.module.css'
import { vercel } from './icon'

export function PixelatedVercelLogo() {
  const hovering = useRef(false)

  return (
    <div
      aria-label="Vercel logomark"
      onMouseEnter={(): void => {
        hovering.current = true
      }}
      onMouseLeave={(): void => {
        hovering.current = false
      }}
    >
      <PixelatedIcon
        active={hovering}
        className="size-8"
        logo={vercel}
        renderScale={4}
        useCanvas
      />
    </div>
  )
}

export interface PixelatedIconProps {
  color?: string
  colorSecondary?: string
  logo: number[][]
  active?: React.MutableRefObject<boolean>
  renderScale?: number
  className?: string
  transitionSpeed?: number
  alphaSpeedMultiplier?: number
  useCanvas?: boolean
  higherContrast?: boolean
}

function PixelatedIcon({ ...props }: PixelatedIconProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [usingCanvas, setUsingCanvas] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !props.useCanvas) return
    setUsingCanvas(true)
    const { start, stop } = drawFramework({
      ...props,
      theme: 'dark',
      active: props.active || { current: false },
      canvas: canvasRef.current,
      higherContrast: props.higherContrast
    })
    start()

    return () => {
      stop()
    }
  }, [props])

  const { path1s, path2s } = generateSvgPathsForPixelatedIcon(props.logo)

  return (
    <div
      aria-hidden
      className={clsx(styles.container, props.className, {
        [styles.usingCanvas]: usingCanvas
      })}
    >
      <svg viewBox="0 0 1 1">
        <path d={path1s} fill="var(--ds-gray-1000)" />
        <path d={path2s} fill="var(--ds-gray-1000)" opacity={0.5} />
      </svg>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
    </div>
  )
}

function generateSvgPathsForPixelatedIcon(grid: number[][]): {
  path1s: string
  path2s: string
} {
  let path1s = ''
  let path2s = ''

  const width = 1 / grid[0].length
  const height = 1 / grid.length
  const radius = r(Math.min(width, height) / 2)

  function r(n: number): number {
    return Math.round(n * 10000) / 10000
  }

  function generateCircle(i: number, j: number): string {
    let d = ''
    const cx = r(j * width + width / 2)
    const cy = r(i * height + height / 2)
    d += `M${cx} ${cy} `
    d += `m${-radius},0 `
    d += `a${radius},${radius} 0 1,0 ${r(radius * 2)},0 `
    d += `a${radius},${radius} 0 1,0 ${r(-radius * 2)},0 `
    return d
  }

  grid.forEach((row, i) =>
    row.forEach((cell, j) => {
      switch (cell) {
        case 1:
          path1s += generateCircle(i, j)
          break
        case 2:
          path2s += generateCircle(i, j)
          break
        default:
          break
      }
    })
  )

  return { path1s, path2s }
}

function drawFramework({
  color,
  colorSecondary,
  logo,
  canvas,
  active,
  renderScale = 2,
  transitionSpeed = 1,
  theme,
  higherContrast
}: PixelatedIconProps & {
  canvas: HTMLCanvasElement
  theme?: string
  higherContrast?: boolean
}): {
  start: () => void
  stop: () => void
} {
  let lastFrame = performance.now()
  let frame = 0
  let initialRenderComplete = false
  let currentMaxProgress = 0

  // Create a bunch of constants
  const noise: number[][] = []
  const noise2: number[][] = []
  const activeProgress: number[][] = []
  for (let y = 0; y < logo.length; y++) {
    noise[y] = []
    noise2[y] = []
    activeProgress[y] = []
    for (let x = 0; x < logo[y].length; x++) {
      noise[y][x] = Math.random()
      noise2[y][x] = clamp(Math.random(), 0.1, 0.9)
      activeProgress[y][x] = 0
    }
  }

  const speed = 0.1 * transitionSpeed

  const baseColor = theme === 'dark' ? '#ffffff' : '#000000'
  const baseRgb = hexToRgb(baseColor)
  const rgb = hexToRgb(color || baseColor)
  const secondaryRgb = colorSecondary ? hexToRgb(colorSecondary) : rgb
  const secondaryMultiplier = colorSecondary ? 1 : 0.5

  function lerp(start: number, end: number, amt: number): number {
    return (1 - amt) * start + amt * end
  }

  function clamp(num: number, min: number, max: number): number {
    // eslint-disable-next-line no-nested-ternary
    return num <= min ? min : num >= max ? max : num
  }

  function render(): void {
    const now = performance.now()
    frame = requestAnimationFrame(render)

    // This is a clause to prevent drawing when the logo is not active and we've
    // already drawn it
    if (!active?.current && currentMaxProgress === 0 && initialRenderComplete)
      return

    // If we get to this point it will need to actually render a new frame

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Gives the stutter effect
    const t = Math.ceil(performance.now() / 100)

    // get bounding box of cvs
    const width = canvas.clientWidth * renderScale
    const height = canvas.clientHeight * renderScale

    canvas.width = width
    canvas.height = height

    // Calculate the size of each circle based on the canvas size and the size of the logo array
    const circleSize = Math.min(width / logo[0].length, height / logo.length)

    // Clear the canvas
    ctx.clearRect(0, 0, width, height)

    currentMaxProgress = 0

    // Loop over the logo array and draw each circle
    for (let y = 0; y < logo.length; y++) {
      for (let x = 0; x < logo[y].length; x++) {
        // Determine the color of the circle
        const n = noise[y][x]
        const n2 = noise2[y][x]

        const contrastOffset = higherContrast ? 0.8 : 1
        const alpha = clamp(Math.sin(t * n) * 0.5 + contrastOffset, 0, 1)
        const currentProgress = activeProgress[y][x]

        // Keep track of any progress we may have so we can omit render loops
        // in the future
        if (currentProgress > currentMaxProgress) {
          currentMaxProgress = currentProgress
        }

        // Change progress accordingly
        activeProgress[y][x] = active?.current
          ? Math.min(currentProgress + speed * n2, 1)
          : Math.max(currentProgress - speed * n2, 0)

        // Define the progress for the color and alpha
        const progress = {
          color: clamp(currentProgress * 2, 0, 1),
          alpha: currentProgress
        }

        //
        const lerpedRgb = rgb.map(c => lerp(baseRgb[0], c, progress.color))
        const lerpedSecondaryRgb = secondaryRgb.map(c =>
          lerp(baseRgb[0], c, progress.color)
        )
        const lerpedFill = lerp(0, 1, progress.color)
        const lerpedAlpha = lerp(1, alpha, progress.alpha)

        const rgbString = `${lerpedRgb[0]},${lerpedRgb[1]},${lerpedRgb[2]}`
        const secondaryRgbString = `${lerpedSecondaryRgb[0]},${lerpedSecondaryRgb[1]},${lerpedSecondaryRgb[2]}`
        const fillRgbString = `${255},${255},${255}`

        let cellColor
        switch (logo[y][x]) {
          case 1:
            cellColor = `rgba(${rgbString},${lerpedAlpha})`
            break
          case 2:
            cellColor = `rgba(${secondaryRgbString},${
              lerpedAlpha * secondaryMultiplier
            })`
            break
          case 3:
            cellColor = `rgba(${fillRgbString}, ${
              lerpedAlpha * 2 * lerpedFill
            })`
            break
          default:
            continue
        }

        // Draw the pixel
        ctx.beginPath()
        ctx.arc(
          x * circleSize + circleSize / 2,
          y * circleSize + circleSize / 2,
          circleSize / 2,
          0,
          2 * Math.PI
        )
        ctx.fillStyle = cellColor
        ctx.fill()
      }
    }
    lastFrame = now
    initialRenderComplete = true
  }

  return {
    start: () => requestAnimationFrame(render),
    stop: () => cancelAnimationFrame(frame)
  }
}

function hexToRgb(hex: string): number[] {
  // eslint-disable-next-line prefer-named-capture-group
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hex.replace('0x', '#')
  )
  if (!result) return [0, 0, 0]
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ]
}
