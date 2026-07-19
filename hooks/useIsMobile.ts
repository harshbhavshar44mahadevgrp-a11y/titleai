"use client"
import { useState, useEffect } from 'react'

// 820px se chhoti screen = mobile/tablet layout
export function useIsMobile(breakpoint = 820) {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
        const update = () => setIsMobile(mq.matches)
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
    }, [breakpoint])
    return isMobile
}
