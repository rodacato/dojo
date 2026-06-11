import type { ComponentType } from 'react'
import type { StepDTO } from '@dojo/shared'
import type { StepComponentProps } from './types'
import { ReadStep } from './ReadStep'
import { ReadInlineStep } from './ReadInlineStep'
import { PredictStep } from './PredictStep'
import { StepEditor } from './StepEditor'

// To add a step type: build its component against StepComponentProps and map
// it here. The Record is exhaustive over StepDTO['type'], so a new type in
// the shared schema refuses to compile until it has a renderer.
export const STEP_RENDERERS: Record<StepDTO['type'], ComponentType<StepComponentProps>> = {
  read: ReadStep,
  'read+inline': ReadInlineStep,
  predict: PredictStep,
  code: StepEditor,
  exercise: StepEditor,
  challenge: StepEditor,
}

export function StepContent(props: StepComponentProps) {
  const Renderer = STEP_RENDERERS[props.step.type]
  return <Renderer {...props} />
}
