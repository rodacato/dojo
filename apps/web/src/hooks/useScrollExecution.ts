import { useCallback } from 'react'
import type { ScrollExecuteRequest, ScrollExecuteResponse } from '@dojo/shared'
import { api } from '../lib/api'
import { useAsync } from './useAsync'

const DISABLED = { enabled: false }

function unavailable(reason: string): ScrollExecuteResponse {
  return { kind: 'unavailable', exitCode: null, stdout: '', stderr: reason, durationMs: 0 }
}

export function useScrollExecution(slug: string, authenticated: boolean) {
  const { data, loading } = useAsync(
    () => (authenticated ? api.getScrollExecutionStatus() : Promise.resolve(DISABLED)),
    [authenticated],
  )

  const run = useCallback(
    async ({ language, files, stdin }: ScrollExecuteRequest): Promise<ScrollExecuteResponse> => {
      try {
        return await api.executeScrollCode(slug, { language, files, ...(stdin === undefined ? {} : { stdin }) })
      } catch (error) {
        return unavailable(error instanceof Error ? error.message : 'Execution failed')
      }
    },
    [slug],
  )

  return { ready: !loading, allowRun: authenticated && data?.enabled === true, run }
}
