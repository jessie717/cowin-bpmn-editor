import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const businessEventNode = createNodeModule({
  type: 'business-event',
  label: 'Business Event',
  icon: '⚙',
  group: 'startup',
  groupLabel: '启动触发节点',
  order: 40,
  color: NODE_COLORS.orange,
  maxIncoming: 0
})
