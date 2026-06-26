import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const loopNode = createNodeModule({
  type: 'loop',
  label: 'Loop',
  icon: '↻',
  group: 'binary',
  groupLabel: 'Binary节点',
  order: 130,
  color: NODE_COLORS.green,
  bpmnType: 'bpmn:ExclusiveGateway'
})
