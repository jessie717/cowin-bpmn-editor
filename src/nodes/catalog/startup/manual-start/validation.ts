import { CONFIG_KEYS, VARIABLE_TYPES } from '../../../shared/config'
import {
  assertIncomingCount,
  assertOutgoingCount,
  pushIssue
} from '../../../shared/validation'
import type { NodeValidationRule } from '../../../types'

export const validateManualStart: NodeValidationRule = (context) => {
  const name = context.config[CONFIG_KEYS.manualName]?.trim()
  const type = context.config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0]

  assertIncomingCount(context, 0)
  assertOutgoingCount(context, 1)

  if (!name) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      'Manual Start缺少输出参数名称'
    )
  }

  if (!VARIABLE_TYPES.includes(type)) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      `Manual Start输出参数类型不合法：${type}`
    )
  }
}
