import { useEffect, useRef } from 'react'

// Пул символов: катакана, кандзи «ауры», код-знаки
const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン'.split('')
const KANJI = '気力魂道無神風光闇天龍虎剣心夢幻星月炎氷王戦忍'.split('')
const CODE = ['{', '}', '()=>', ';', '::', '&&', '||', '[]', '<>', '++', '--', '==', '??']
const CHARS = [...KATAKANA, ...KANJI, ...CODE]

const rand = (a, b) => a + Math.random() * (b - a)
const pick = () => CHARS[(Math.random() * CHARS.length) | 0]

const CELL = 26
const BASE_FONT = 12
const BASE_ALPHA = 0.11
const TARGET_FPS = 30
const MOUSE_RADIUS = 170
const CONNECT_DIST = 74
const PURPLE = { r: 191, g: 90, b: 242 } // geass-акцент

// Базовые цвета: лайм + циан по двум дрейфующим центрам
const LIME = { r: 187, g: 243, b: 81 }
const CYAN = { r: 0, g: 229, b: 255 }

export default function AsciiAuraBg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    const isTouch = window.matchMedia('(hover: none)').matches

    let W = window.innerWidth
    let H = window.innerHeight
    let cells = []
    let ripples = []
    let scanners = []
    let raf = null
    const start = performance.now()
    let lastDraw = start
    let lastAutoRipple = 0
    let resizeTimer = null

    const mouse = { x: -9999, y: -9999, ex: -9999, ey: -9999, lastMove: 0, amp: 0 }

    function buildGrid() {
      cells = []
      const cols = Math.ceil(W / CELL) + 1
      const rows = Math.ceil(H / CELL) + 1
      const now = performance.now()
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // разреженная сетка ~56% — воздух между символами
          if (Math.random() > 0.56) {
            const x = c * CELL + CELL / 2
            const y = r * CELL + CELL / 2
            cells.push({
              x,
              y,
              dx: x,
              dy: y,
              boostVal: 0,
              char: pick(),
              nextShuffle: now + rand(2500, 10000),
              glow: 0,
              purple: Math.random() < 0.035, // редкие «глаза Гасса»
            })
          }
        }
      }
    }

    function spawnScanner() {
      return { x: rand(0, W), y: -rand(0, H * 0.6), speed: rand(90, 200) }
    }

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildGrid()
      const n = isTouch ? 2 : Math.min(4, Math.max(3, Math.round(W / 480)))
      scanners = Array.from({ length: n }, spawnScanner)
    }

    function spawnRipple(x, y, strong = false) {
      ripples.push({ x, y, r: 0, v: strong ? 300 : rand(200, 260), maxR: strong ? 380 : rand(260, 420), strong })
      if (ripples.length > 6) ripples.shift()
    }

    function update(dt, now) {
      // мышь: плавное приближение + затухание после простоя
      const k = Math.min(1, dt * 6)
      mouse.ex += (mouse.x - mouse.ex) * k
      mouse.ey += (mouse.y - mouse.ey) * k
      const mouseActive = now - mouse.lastMove < 2500 && mouse.x > -9000
      mouse.amp += ((mouseActive ? 1 : 0) - mouse.amp) * Math.min(1, dt * 2.5)

      // автопульсации из случайных точек
      if (now - lastAutoRipple > rand(4000, 8000)) {
        lastAutoRipple = now
        spawnRipple(rand(W * 0.15, W * 0.85), rand(H * 0.15, H * 0.85))
      }

      // затухание свечения ячеек + перетасовка символов
      for (const cell of cells) {
        cell.glow = Math.max(0, cell.glow - dt * 1.4)
        if (now > cell.nextShuffle) {
          cell.char = pick()
          cell.nextShuffle = now + rand(2500, 9000)
        }
      }

      // случайные «вспышки» — фиолетовые вспыхивают чаще
      const flareChance = dt * 0.9
      let flares = Math.floor(flareChance) + (Math.random() < flareChance % 1 ? 1 : 0)
      while (flares-- > 0 && cells.length) {
        const cell = cells[(Math.random() * cells.length) | 0]
        cell.glow = Math.min(1, cell.glow + rand(0.5, 1))
      }

      // волны: расширяющиеся фронты, подсвечивающие ячейки
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        rp.r += rp.v * dt
        const a = 1 - rp.r / rp.maxR
        if (a <= 0) { ripples.splice(i, 1); continue }
        rp.alpha = a
        const band = 28
        for (const cell of cells) {
          const dx = cell.dx - rp.x
          const dy = cell.dy - rp.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (Math.abs(d - rp.r) < band) {
            cell.glow = Math.max(cell.glow, a * (rp.strong ? 0.95 : 0.7))
          }
        }
      }

      // матричные сканеры: падающая голова подсвечивает колонку
      for (const s of scanners) {
        s.y += s.speed * dt
        if (s.y > H + 120) Object.assign(s, spawnScanner())
        for (const cell of cells) {
          if (Math.abs(cell.x - s.x) < CELL) {
            const dy = cell.y - s.y
            if (dy < 0 && dy > -70) {
              cell.glow = Math.max(cell.glow, 1 + dy / 70)
              if (Math.random() < dt * 4) cell.char = pick()
            }
          }
        }
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H)
      const t = (now - start) / 1000

      // дыхание: мягкая пульсация общей яркости
      const breath = 0.9 + 0.1 * Math.sin(t * 0.4)

      // дрейфующие центры градиентов (лайм и циан)
      const cx1 = W * (0.3 + 0.4 * Math.sin(t * 0.07))
      const cy1 = H * (0.25 + 0.35 * Math.cos(t * 0.05))
      const cx2 = W * (0.7 + 0.25 * Math.cos(t * 0.06))
      const cy2 = H * (0.6 + 0.3 * Math.sin(t * 0.08))
      const maxDist = Math.sqrt(W * W + H * H) * 0.5

      // параллакс: скролл + лёгкий сдвиг от мыши
      const offY = window.scrollY * 0.08
      const mx = ((mouse.ex / W) - 0.5) * -12 * mouse.amp
      const my = ((mouse.ey / H) - 0.5) * -8 * mouse.amp

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let curFont = 0
      const near = [] // ячейки со свечением — кандидаты на связи-созвездия

      for (const cell of cells) {
        // позиция с заворотом по вертикали — фон «медленнее» контента
        let yy = (cell.y + offY) % H
        if (yy < 0) yy += H
        const xx = cell.x + mx
        const yDraw = yy + my
        cell.dx = xx
        cell.dy = yDraw

        // базовый градиент
        const d1 = Math.hypot(xx - cx1, yDraw - cy1)
        const d2 = Math.hypot(xx - cx2, yDraw - cy2)
        const f1 = Math.max(0, 1 - d1 / maxDist)
        const f2 = Math.max(0, 1 - d2 / maxDist)

        let r, g, b
        if (cell.purple) {
          r = PURPLE.r; g = PURPLE.g; b = PURPLE.b
        } else {
          r = LIME.r * f1
          g = LIME.g * f1 + CYAN.g * f2
          b = LIME.b * f1 + CYAN.b * f2
        }

        // мышь подсвечивает и укрупняет символы рядом
        let boost = cell.glow
        if (mouse.amp > 0.01) {
          const dm = Math.hypot(xx - mouse.ex, yDraw - mouse.ey)
          if (dm < MOUSE_RADIUS) boost = Math.min(1.2, boost + (1 - dm / MOUSE_RADIUS) * 0.9 * mouse.amp)
        }

        const baseA = BASE_ALPHA * breath
        if (baseA + boost < 0.015) continue

        // сдвиг цвета к яркому лайму при свечении
        if (boost > 0.02) {
          r = Math.min(255, r + boost * 130)
          g = Math.min(255, g + boost * 70)
          b = Math.min(255, b + boost * 130)
          cell.boostVal = boost
          if (boost > 0.3) near.push(cell)
        }

        const alpha = Math.min(0.6, baseA + boost * 0.45)
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha.toFixed(3)})`

        const font = BASE_FONT + Math.round(boost * 3)
        if (font !== curFont) {
          curFont = font
          ctx.font = `${font}px "Source Code Pro","Yu Gothic","MS Gothic",system-ui,monospace`
        }
        ctx.fillText(cell.char, xx, yDraw)
      }

      // созвездия: связи между подсвеченными ячейками у курсора
      if (near.length > 1 && near.length < 90) {
        ctx.lineWidth = 1
        let lines = 0
        for (let i = 0; i < near.length && lines < 140; i++) {
          for (let j = i + 1; j < near.length && lines < 140; j++) {
            const a = near[i], b2 = near[j]
            const dx = a.dx - b2.dx
            const dy = a.dy - b2.dy
            const d2 = dx * dx + dy * dy
            if (d2 < CONNECT_DIST * CONNECT_DIST) {
              const a2 = 0.14 * Math.min(a.boostVal, 1) * Math.min(b2.boostVal, 1)
              if (a2 > 0.02) {
                ctx.strokeStyle = `rgba(187,243,81,${a2.toFixed(3)})`
                ctx.beginPath()
                ctx.moveTo(a.dx, a.dy)
                ctx.lineTo(b2.dx, b2.dy)
                ctx.stroke()
                lines++
              }
            }
          }
        }
      }

      // головы матричных сканеров: яркий символ + шлейф
      for (const s of scanners) {
        const hx = s.x + mx
        const hy = s.y + my
        for (let i = 0; i < 7; i++) {
          const ty = hy - i * CELL
          if (ty < -CELL || ty > H + CELL) continue
          const fade = (1 - i / 7) * 0.5
          ctx.fillStyle = i === 0
            ? `rgba(212,247,133,${(0.85 * fade).toFixed(3)})`
            : `rgba(187,243,81,${fade.toFixed(3)})`
          const f = BASE_FONT + (i === 0 ? 2 : 0)
          if (f !== curFont) {
            curFont = f
            ctx.font = `${f}px "Source Code Pro","Yu Gothic","MS Gothic",system-ui,monospace`
          }
          ctx.fillText(pick(), hx, ty)
        }
      }

      // кольца волн
      ctx.lineWidth = 1
      for (const rp of ripples) {
        const a = (rp.strong ? 0.09 : 0.05) * rp.alpha
        ctx.strokeStyle = `rgba(187,243,81,${a.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // мягкая аура под курсором
      if (mouse.amp > 0.02 && mouse.ex > -9000) {
        const grad = ctx.createRadialGradient(mouse.ex, mouse.ey, 0, mouse.ex, mouse.ey, 90)
        grad.addColorStop(0, `rgba(187,243,81,${(0.05 * mouse.amp).toFixed(3)})`)
        grad.addColorStop(1, 'rgba(187,243,81,0)')
        ctx.fillStyle = grad
        ctx.fillRect(mouse.ex - 90, mouse.ey - 90, 180, 180)
      }
    }

    function loop(now) {
      raf = requestAnimationFrame(loop)
      if (document.hidden) return
      const elapsed = now - lastDraw
      if (elapsed < 1000 / TARGET_FPS) return
      const dt = Math.min(elapsed / 1000, 0.1)
      lastDraw = now
      update(dt, now)
      draw(now)
    }

    const onMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (mouse.ex < -9000) { mouse.ex = e.clientX; mouse.ey = e.clientY }
      mouse.lastMove = performance.now()
    }
    const onMouseOut = (e) => {
      if (!e.relatedTarget) mouse.lastMove = 0
    }
    const onClick = (e) => {
      if (!isTouch) spawnRipple(e.clientX, e.clientY, true)
    }
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(resize, 150)
    }

    resize()
    raf = requestAnimationFrame(loop)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseout', onMouseOut)
    window.addEventListener('click', onClick, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="ascii-aura-canvas fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
