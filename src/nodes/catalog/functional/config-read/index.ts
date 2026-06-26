import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const configReadNode = createNodeModule({
  type: 'config-read',
  label: 'Config Read',
  icon: '⚙',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 570,
  color: NODE_COLORS.blue
})
