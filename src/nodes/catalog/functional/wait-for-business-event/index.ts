import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const waitForBusinessEventNode = createNodeModule({
  type: 'wait-for-business-event',
  label: 'Wait For Business Event',
  icon: '◔',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 410,
  color: NODE_COLORS.blue
})
