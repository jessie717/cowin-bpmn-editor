import type { NodeDefinition } from '../nodes/types'

export interface SelectedNode {
  id: string
  name?: string
  definition: NodeDefinition
  config: Record<string, string>
}
