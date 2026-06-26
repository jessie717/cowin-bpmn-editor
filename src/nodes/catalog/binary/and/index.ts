import { createNodeModule } from '../../../shared/createNodeDefinition'
import { NODE_COLORS } from '../../../shared/colors'

export const andNode = createNodeModule({
  type: 'and',
  label: 'And',
  icon: '&',
  group: 'binary',
  groupLabel: 'Binary节点',
  order: 110,
  color: NODE_COLORS.green,
  bpmnType: 'bpmn:ExclusiveGateway'
})
