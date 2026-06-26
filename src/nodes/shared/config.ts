export const VARIABLE_TYPES = ['String', 'Number', 'Boolean', 'Object', 'Array']

export const CONFIG_KEYS = {
  manualName: 'manualStartParameterName',
  manualType: 'manualStartParameterType',
  manualValue: 'manualStartParameterValue',
  functionInputs: 'functionInputParameters',
  functionOutputs: 'functionOutputParameters'
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
