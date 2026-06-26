import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import { validateIf } from './validation'

export const ifNode = createNodeModule(
  {
    type: 'if',
    label: 'IF',
    icon: '◇',
    group: 'functional',
    groupLabel: 'Functional节点',
    order: 430,
    color: NODE_COLORS.blue
  },
  {
    validate: validateIf
  }
)
