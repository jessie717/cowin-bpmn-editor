import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const scheduleNode = createNodeModule({
  type: 'schedule',
  label: 'Schedule',
  icon: '◉',
  group: 'startup',
  groupLabel: '启动触发节点',
  order: 30,
  color: NODE_COLORS.orange,
  maxIncoming: 0
})
