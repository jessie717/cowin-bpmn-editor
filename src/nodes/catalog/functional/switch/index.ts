import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'
import { validateSwitch } from './validation'

export const switchNode = createNodeModule(
  {
    type: 'switch',
    label: 'Switch',
    icon: 'SW',
    group: 'functional',
    groupLabel: 'Functional节点',
    order: 440,
    color: NODE_COLORS.blue
  },
  {
    validate: validateSwitch
  }
)
