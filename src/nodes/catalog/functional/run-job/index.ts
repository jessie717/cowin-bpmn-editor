import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const runJobNode = createNodeModule({
  type: 'run-job',
  label: 'Run Job',
  icon: '⇄',
  group: 'functional',
  groupLabel: 'Functional节点',
  order: 510,
  color: NODE_COLORS.blue
})
