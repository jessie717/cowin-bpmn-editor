import {
  getElementDefinition,
  readNodeConfig
} from '../../../nodes/registry'
import type { ValidationIssue } from '../../../nodes/types'
import type { SelectedNode } from '../../types'
import {
  VARIABLE_TYPES,
  getNodeOutputVariables,
  type WorkflowVariable
} from '../../variables'
import type { NodeValidationContext } from './types'

export function pushIssue(
  issues: ValidationIssue[],
  elementId: string,
  level: ValidationIssue['level'],
  message: string
) {
  issues.push({
    elementId,
    level,
    message
  })
}

export function getConnectionName(connection: any) {
  return String(
    connection?.businessObject?.name ??
      connection?.businessObject?.$attrs?.name ??
      ''
  ).trim()
}

export function getOutgoingNames(element: any) {
  return (element.outgoing ?? []).map(getConnectionName)
}

export function isValidVariableType(type?: string) {
  return VARIABLE_TYPES.includes(type || '')
}

export function assertIncomingCount(
  context: NodeValidationContext,
  expected: number
) {
  const incoming = context.element.incoming?.length ?? 0

  if (incoming !== expected) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      expected === 0
        ? `${context.definition.label}不能有入线`
        : `${context.definition.label}必须有且只有${expected}条入线`
    )
  }
}

export function assertOutgoingCount(
  context: NodeValidationContext,
  expected: number
) {
  const outgoing = context.element.outgoing?.length ?? 0

  if (outgoing !== expected) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      expected === 0
        ? `${context.definition.label}不能有出线`
        : `${context.definition.label}必须有且只有${expected}条出线`
    )
  }
}

export function assertMinOutgoingCount(
  context: NodeValidationContext,
  minOutgoing: number
) {
  const outgoing = context.element.outgoing?.length ?? 0

  if (outgoing < minOutgoing) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      `${context.definition.label}至少需要${minOutgoing}条出线`
    )
  }
}

export function validateUniqueOutgoingNames(context: NodeValidationContext) {
  const seen = new Set<string>()
  const duplicated = new Set<string>()

  for (const name of getOutgoingNames(context.element)) {
    if (!name) {
      continue
    }

    if (seen.has(name)) {
      duplicated.add(name)
    } else {
      seen.add(name)
    }
  }

  for (const name of duplicated) {
    pushIssue(
      context.issues,
      context.element.id,
      'error',
      `${context.definition.label}出线名称重复：${name}`
    )
  }
}

function readSelectedNode(element: any): SelectedNode | null {
  const definition = getElementDefinition(element)

  if (!element || !definition) {
    return null
  }

  return {
    id: element.id,
    definition,
    config: readNodeConfig(element)
  }
}

export function getUpstreamOutputVariables(element: any) {
  const variables = new Map<string, WorkflowVariable>()

  for (const connection of element.incoming ?? []) {
    const sourceNode = readSelectedNode(connection.source)

    for (const variable of getNodeOutputVariables(sourceNode)) {
      variables.set(variable.id, {
        ...variable,
        nodeId: connection.source.id,
        nodeLabel:
          connection.source.businessObject?.name ||
          sourceNode?.definition.label ||
          variable.nodeLabel
      })
    }
  }

  return Array.from(variables.values())
}
