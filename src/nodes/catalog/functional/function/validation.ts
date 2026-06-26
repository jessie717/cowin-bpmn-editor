import {
  CONFIG_KEYS,
  VARIABLE_TYPES,
  parseParameterList,
  type FunctionInputParameter,
  type FunctionOutputParameter
} from '../../../shared/config'
import {
  assertIncomingCount,
  assertOutgoingCount,
  pushIssue
} from '../../../shared/validation'
import type { NodeValidationRule } from '../../../types'

function isValidVariableType(type?: string) {
  return VARIABLE_TYPES.includes(type || '')
}

export const validateFunction: NodeValidationRule = (context) => {
  assertIncomingCount(context, 1)
  assertOutgoingCount(context, 1)

  const upstreamVariables = new Set(
    (context.getUpstreamOutputVariables?.(context.element) ?? []).map(
      (variable) => variable.id
    )
  )
  const inputParameters = parseParameterList<FunctionInputParameter>(
    context.config[CONFIG_KEYS.functionInputs]
  )
  const outputParameters = parseParameterList<FunctionOutputParameter>(
    context.config[CONFIG_KEYS.functionOutputs]
  )
  const outputNames = new Set<string>()
  const duplicatedOutputNames = new Set<string>()

  for (const [index, parameter] of inputParameters.entries()) {
    const label = `Function输入参数${index + 1}`

    if (!parameter.name?.trim()) {
      pushIssue(context.issues, context.element.id, 'error', `${label}缺少名称`)
    }

    if (!isValidVariableType(parameter.type)) {
      pushIssue(
        context.issues,
        context.element.id,
        'error',
        `${label}类型不合法：${parameter.type || '-'}`
      )
    }

    if (parameter.source && !upstreamVariables.has(parameter.source)) {
      pushIssue(
        context.issues,
        context.element.id,
        'error',
        `${label}来源参数不存在`
      )
    }
  }

  for (const [index, parameter] of outputParameters.entries()) {
    const label = `Function输出参数${index + 1}`
    const name = parameter.name?.trim()

    if (!name) {
      pushIssue(context.issues, context.element.id, 'error', `${label}缺少名称`)
    } else if (outputNames.has(name)) {
      duplicatedOutputNames.add(name)
    } else {
      outputNames.add(name)
    }

    if (!isValidVariableType(parameter.type)) {
      pushIssue(
        context.issues,
        context.element.id,
        'error',
        `${label}类型不合法：${parameter.type || '-'}`
      )
    }
  }

  for (const name of duplicatedOutputNames) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      `Function输出参数名称重复：${name}`
    )
  }
}
