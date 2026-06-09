'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export interface JobState {
    jobId: string | null
    status: 'idle' | 'uploading' | 'processing' | 'complete' | 'failed'
    stage: string
    progress: number
    result: any | null
    error: string | null
}

const INITIAL_STATE: JobState = {
    jobId: null, status: 'idle', stage: '', progress: 0, result: null, error: null,
}

export function useAnalysisJob() {
    const [jobState, setJobState] = useState<JobState>(INITIAL_STATE)
    const supabase = createBrowserClient(
        'https://phtgfpdnirreomaeunfk.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBodGdmcGRuaXJyZW9tYWV1bmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMDA5ODMsImV4cCI6MjA5NDU3Njk4M30.sU38swcz68otjanP4zJ_C1i4pN92gD2saJw-lPlHX0c'
    )

    useEffect(() => {
        if (!jobState.jobId) return
        const channel = supabase
            .channel(`job-${jobState.jobId}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'jobs',
                filter: `id=eq.${jobState.jobId}`,
            }, (payload) => {
                const u = payload.new as any
                setJobState(prev => ({
                    ...prev, status: u.status, stage: u.stage || '',
                    progress: u.progress || 0, result: u.result || null, error: u.error || null,
                }))
            }).subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [jobState.jobId])

    const startAnalysis = useCallback(async (files: File[]) => {
        try {
            setJobState({ ...INITIAL_STATE, status: 'uploading', stage: 'Uploading documents...', progress: 5 })
            const uploadedUrls: string[] = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const fileName = `${Date.now()}_${i}_${file.name.replace(/\s/g, '_')}`
                setJobState(prev => ({ ...prev, stage: `Uploading ${i + 1}/${files.length}...`, progress: 5 + Math.floor((i / files.length) * 10) }))
                const { error: uploadError } = await supabase.storage
                    .from('TITLEMATRIX.AI-documents').upload(`docs/${fileName}`, file, { upsert: true })
                if (uploadError && !uploadError.message.includes('already exists')) {
                    console.log('Upload note:', uploadError.message)
                }
                const { data: { publicUrl } } = supabase.storage
                    .from('TITLEMATRIX.AI-documents').getPublicUrl(`docs/${fileName}`)
                uploadedUrls.push(publicUrl)
            }
            setJobState(prev => ({ ...prev, stage: 'Starting AI...', progress: 15, status: 'processing' }))
            const res = await fetch('/api/analyze', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileUrls: uploadedUrls }),
            })
            if (!res.ok) throw new Error('Job failed')
            const { jobId } = await res.json()
            setJobState(prev => ({ ...prev, jobId, status: 'processing', stage: 'AI analyzing...', progress: 20 }))
        } catch (error: any) {
            setJobState(prev => ({ ...prev, status: 'failed', stage: 'Failed: ' + error.message, error: error.message }))
        }
    }, [])

    const resetJob = useCallback(() => { setJobState(INITIAL_STATE) }, [])

    return {
        jobState, startAnalysis, resetJob,
        isUploading: jobState.status === 'uploading',
        isProcessing: jobState.status === 'processing',
        isComplete: jobState.status === 'complete',
        isFailed: jobState.status === 'failed',
    }
}