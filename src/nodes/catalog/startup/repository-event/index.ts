import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const repositoryEventNode = createNodeModule({
  type: 'repository-event',
  label: 'Repository Event',
  icon: '◉',
  group: 'startup',
  groupLabel: '启动触发节点',
  order: 20,
  color: NODE_COLORS.orange,
  maxIncoming: 0
})
