import { assertIncomingCount } from '../../../shared/validation'
import type { NodeValidationRule } from '../../../types'

export const validateLog: NodeValidationRule = (context) => {
  assertIncomingCount(context, 1)
}
