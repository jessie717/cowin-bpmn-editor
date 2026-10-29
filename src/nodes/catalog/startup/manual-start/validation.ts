import {
  CONFIG_KEYS,
  VARIABLE_TYPES,
  parseParameterList,
  type ManualStartParameter
} from '../../../shared/config'
import {
  assertIncomingCount,
  assertOutgoingCount,
  pushIssue
} from '../../../shared/validation'
import type { NodeValidationRule } from '../../../types'

function readManualStartParameters(context: Parameters<NodeValidationRule>[0]) {
  const parameters = parseParameterList<ManualStartParameter>(
    context.config[CONFIG_KEYS.manualParameters]
  )

  if (parameters.length) {
    return parameters
  }

  const legacyName = context.config[CONFIG_KEYS.manualName]?.trim()

  return legacyName
    ? [
        {
          id: `${context.element.id}:${legacyName}`,
          name: legacyName,
          type: context.config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0]
        }
      ]
    : []
}

export const validateManualStart: NodeValidationRule = (context) => {
  assertIncomingCount(context, 0)
  assertOutgoingCount(context, 1)

  const parameters = readManualStartParameters(context)
  const names = new Set<string>()
  const duplicatedNames = new Set<string>()

  if (!parameters.length) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      'Manual Start缺少启动参数'
    )
  }

  for (const [index, parameter] of parameters.entries()) {
    const label = `Manual Start启动参数${index + 1}`
    const name = parameter.name?.trim()

    if (!name) {
      pushIssue(context.issues, context.element.id, 'error', `${label}缺少名称`)
    } else if (names.has(name)) {
      duplicatedNames.add(name)
    } else {
      names.add(name)
    }

    if (!parameter.type?.trim()) {
      pushIssue(
        context.issues,
        context.element.id,
        'error',
        `${label}缺少类型`
      )
    }
  }

  for (const name of duplicatedNames) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      `Manual Start启动参数名称重复：${name}`
    )
  }
}
