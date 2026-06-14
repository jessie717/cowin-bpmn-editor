import { CONFIG_KEYS, VARIABLE_TYPES } from '../../variables'
import {
  assertIncomingCount,
  assertOutgoingCount,
  isValidVariableType,
  pushIssue
} from './helpers'
import type { NodeValidationRule } from './types'

export const validateManualStart: NodeValidationRule = (context) => {
  assertIncomingCount(context, 0)
  assertOutgoingCount(context, 1)

  const name = context.config[CONFIG_KEYS.manualName]?.trim()
  const type = context.config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0]

  if (!name) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      'Manual Start缺少输出参数名称'
    )
  }

  if (!isValidVariableType(type)) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      `Manual Start输出参数类型不合法：${type}`
    )
  }
}
