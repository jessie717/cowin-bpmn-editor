import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import { validateLog } from './validation'

export const logNode = createNodeModule(
  {
    type: 'log',
    label: 'Log',
    icon: '▤',
    group: 'interaction',
    groupLabel: 'Interaction节点',
    order: 300,
    color: NODE_COLORS.yellow
  },
  {
    validate: validateLog
  }
)
