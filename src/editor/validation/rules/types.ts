import type { NodeDefinition, ValidationIssue } from '../../../nodes/types'

export interface NodeValidationContext {
  element: any
  definition: NodeDefinition
  config: Record<string, string>
  issues: ValidationIssue[]
}

export type NodeValidationRule = (context: NodeValidationContext) => void
