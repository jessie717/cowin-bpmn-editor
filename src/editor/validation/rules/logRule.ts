import { assertIncomingCount } from './helpers'
import type { NodeValidationRule } from './types'

export const validateLog: NodeValidationRule = (context) => {
  assertIncomingCount(context, 1)
}
