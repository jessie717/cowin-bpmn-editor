import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import { HttpCallConfigPanel } from './ConfigPanel'

export const httpCallNode = createNodeModule(
  {
    type: 'http-call',
    label: 'HTTP Call',
    icon: 'HTTP',
    group: 'interaction',
    groupLabel: 'Interaction节点',
    order: 220,
    color: NODE_COLORS.yellow
  },
  {
    ConfigPanel: HttpCallConfigPanel
  }
)
