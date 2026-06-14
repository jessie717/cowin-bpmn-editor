import type { SelectedNode } from './types'

export const VARIABLE_TYPES = ['String', 'Number', 'Boolean', 'Object', 'Array']

export interface WorkflowVariable {
  id: string
  name: string
  type: string
  value: string
  nodeId?: string
  nodeLabel?: string
  expression?: string
}

export interface FunctionInputParameter {
  id: string
  name: string
  type: string
  source: string
  expression: string
}

export interface FunctionOutputParameter {
  id: string
  name: string
  type: string
  expression: string
}

export const CONFIG_KEYS = {
  manualName: 'manualStartParameterName',
  manualType: 'manualStartParameterType',
  manualValue: 'manualStartParameterValue',
  functionInputs: 'functionInputParameters',
  functionOutputs: 'functionOutputParameters'
}

export function createParameterId(prefix = 'param') {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

export function parseParameterList<T>(rawValue?: string): T[] {
  if (!rawValue?.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function stringifyParameterList(parameters: unknown[]) {
  return JSON.stringify(parameters)
}

export function getNodeOutputVariables(node?: SelectedNode | null) {
  if (!node) {
    return []
  }

  if (node.definition.type === 'manual-start') {
    const name = node.config[CONFIG_KEYS.manualName]?.trim()

    if (!name) {
      return []
    }

    return [
      {
        id: `${node.id}:${name}`,
        name,
        type: node.config[CONFIG_KEYS.manualType] || VARIABLE_TYPES[0],
        value: node.config[CONFIG_KEYS.manualValue] || '',
        nodeId: node.id,
        nodeLabel: node.definition.label
      }
    ]
  }

  if (node.definition.type === 'function') {
    return parseParameterList<FunctionOutputParameter>(
      node.config[CONFIG_KEYS.functionOutputs]
    )
      .filter((parameter) => parameter.name.trim())
      .map((parameter) => ({
        id: parameter.id,
        name: parameter.name,
        type: parameter.type || VARIABLE_TYPES[0],
        value: parameter.expression,
        expression: parameter.expression,
        nodeId: node.id,
        nodeLabel: node.definition.label
      }))
  }

  return Object.entries(node.config)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => ({
      id: `${node.id}:${key}`,
      name: key,
      type: 'String',
      value,
      nodeId: node.id,
      nodeLabel: node.definition.label
    }))
}
