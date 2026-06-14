import { validateFunction } from './rules/functionRule'
import { validateIf } from './rules/ifRule'
import { validateLog } from './rules/logRule'
import { validateManualStart } from './rules/manualStartRule'
import { validateSwitch } from './rules/switchRule'
import type {
  NodeValidationContext,
  NodeValidationRule
} from './rules/types'

export { pushIssue } from './rules/helpers'

const nodeRules: Record<string, NodeValidationRule> = {
  'manual-start': validateManualStart,
  log: validateLog,
  function: validateFunction,
  if: validateIf,
  switch: validateSwitch
}

export function validateNodeByRule(context: NodeValidationContext) {
  nodeRules[context.definition.type]?.(context)
}

export function hasNodeValidationRule(type: string) {
  return Boolean(nodeRules[type])
}
