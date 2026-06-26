import { CANVAS_NODE_ICON_SIZE } from '../nodeLayout'
import type { BpmnBaseType, NodeDefinition, NodeModule } from '../types'
import { getNodeIconUrl } from './icons'

export interface NodeDefinitionInput {
  type: string
  label: string
  icon: string
  group: string
  groupLabel: string
  order: number
  color: string
  bpmnType?: BpmnBaseType
  maxIncoming?: number
  maxOutgoing?: number
}

export function createNodeDefinition(input: NodeDefinitionInput): NodeDefinition {
  const bpmnType = input.bpmnType ?? 'bpmn:ServiceTask'
  const iconUrl = getNodeIconUrl(input.type)

  return {
    type: input.type,
    label: input.label,
    bpmnType,
    defaultSize: {
      width: CANVAS_NODE_ICON_SIZE,
      height: CANVAS_NODE_ICON_SIZE
    },
    defaultProperties: {},
    palette: {
      group: input.group,
      groupLabel: input.groupLabel,
      order: input.order,
      icon: input.icon,
      iconUrl,
      color: input.color,
      visible: true
    },
    renderer: {
      shape: 'task',
      fill: '#ffffff',
      stroke: input.color,
      icon: input.icon,
      iconUrl
    },
    contextPad: {
      appendable: []
    },
    rules: {
      incoming: [],
      outgoing: [],
      maxIncoming: input.maxIncoming,
      maxOutgoing: input.maxOutgoing
    },
    propertiesSchema: []
  }
}

export function createNodeModule(
  input: NodeDefinitionInput,
  capabilities: Omit<NodeModule, 'definition'> = {}
): NodeModule {
  return {
    definition: createNodeDefinition(input),
    ...capabilities
  }
}
