"use client"
import { useEffect, useRef } from 'react'

export default function MatrixBg() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789₹€$£@#%&'
        const fontSize = 13
        const cols = Math.floor(canvas.width / fontSize)
        const drops = Array(cols).fill(1)

        const draw = () => {
            ctx.fillStyle = 'rgba(10,10,15,0.05)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = 'rgba(99,102,241,0.35)'
            ctx.font = `${fontSize}px monospace`

            drops.forEach((y, i) => {
                const char = chars[Math.floor(Math.random() * chars.length)]
                ctx.fillText(char, i * fontSize, y * fontSize)
                if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
                drops[i]++
            })
        }

        const interval = setInterval(draw, 40)

        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        window.addEventListener('resize', handleResize)

        return () => {
            clearInterval(interval)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                opacity: 0.4,
                pointerEvents: 'none',
            }}
        />
    )
}