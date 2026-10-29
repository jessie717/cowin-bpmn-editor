export const OR_CONFIG_KEYS = {
  outputVariables: 'orOutputVariables'
}

export interface OrOutputVariable {
  id: string
  name: string
  type: string
  value: string
  sourceId?: string
  sourceBlock: string
  custom: boolean
}
