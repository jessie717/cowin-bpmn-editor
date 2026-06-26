import {
  assertIncomingCount,
  assertMinOutgoingCount,
  getOutgoingNames,
  pushIssue,
  validateUniqueOutgoingNames
} from '../../../shared/validation'
import type { NodeValidationRule } from '../../../types'

export const validateSwitch: NodeValidationRule = (context) => {
  assertIncomingCount(context, 1)
  assertMinOutgoingCount(context, 1)
  validateUniqueOutgoingNames(context)

  const outgoingNames = new Set(getOutgoingNames(context.element))

  if (!outgoingNames.has('default')) {
    pushIssue(context.issues, context.element.id, 'error', 'Switch缺少default出线')
  }
}
