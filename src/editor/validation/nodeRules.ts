import { getNodeModule } from '../../nodes/registry'
import type {
  NodeValidationContext,
  NodeValidationRule
} from './rules/types'

export { pushIssue } from './rules/helpers'

const nodeRules: Record<string, NodeValidationRule> = {}

export function validateNodeByRule(context: NodeValidationContext) {
  const moduleRule = getNodeModule(context.definition.type)?.validate

  if (moduleRule) {
    moduleRule(context)
    return
  }

  nodeRules[context.definition.type]?.(context)
}

export function hasNodeValidationRule(type: string) {
  return Boolean(getNodeModule(type)?.validate || nodeRules[type])
}
