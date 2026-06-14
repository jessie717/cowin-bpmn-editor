import type { PropertySchema } from '../../../nodes/types'
import type { SelectedNode } from '../../types'
import type { WorkflowVariable } from '../../variables'

export interface NodeConfigPanelProps {
  node: SelectedNode
  availableVariables: WorkflowVariable[]
  onUpdateConfig: (key: string, value: string) => void
}

export interface DefaultConfigFieldProps {
  field: PropertySchema
  value: string
  onUpdateConfig: (key: string, value: string) => void
}
