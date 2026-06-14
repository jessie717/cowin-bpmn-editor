import {
  assertIncomingCount,
  assertMinOutgoingCount,
  getOutgoingNames,
  pushIssue,
  validateUniqueOutgoingNames
} from './helpers'
import type { NodeValidationRule } from './types'

export const validateIf: NodeValidationRule = (context) => {
  assertIncomingCount(context, 1)
  assertMinOutgoingCount(context, 2)
  validateUniqueOutgoingNames(context)

  const outgoingNames = new Set(getOutgoingNames(context.element))

  for (const requiredName of ['TRUE', 'FALSE']) {
    if (!outgoingNames.has(requiredName)) {
      pushIssue(
        context.issues,
        context.element.id,
        'error',
        `IF缺少${requiredName}出线`
      )
    }
  }
}
