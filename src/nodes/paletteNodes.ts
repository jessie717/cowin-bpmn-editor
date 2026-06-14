import type { BpmnBaseType, NodeDefinition } from './types'
import { CANVAS_NODE_ICON_SIZE } from './nodeLayout'

const nodeIconUrls = import.meta.glob<string>('../assets/node-svg/*.svg', {
  eager: true,
  import: 'default',
  query: '?url'
})

const orange = '#f57c00'
const green = '#159447'
const yellow = '#f5ad00'
const blue = '#0878be'

interface PaletteNodeInput {
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

function paletteNode(input: PaletteNodeInput): NodeDefinition {
  const bpmnType = input.bpmnType ?? 'bpmn:ServiceTask'
  const iconUrl = nodeIconUrls[`../assets/node-svg/${input.type}.svg`]

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

export const allNodeDefinitions: NodeDefinition[] = [
  paletteNode({
    type: 'manual-start',
    label: 'Manual Start',
    icon: '▶',
    group: 'startup',
    groupLabel: '启动触发节点',
    order: 10,
    color: orange,
    bpmnType: 'bpmn:StartEvent',
    maxIncoming: 0
  }),
  paletteNode({
    type: 'repository-event',
    label: 'Repository Event',
    icon: '◉',
    group: 'startup',
    groupLabel: '启动触发节点',
    order: 20,
    color: orange,
    maxIncoming: 0
  }),
  paletteNode({
    type: 'schedule',
    label: 'Schedule',
    icon: '◉',
    group: 'startup',
    groupLabel: '启动触发节点',
    order: 30,
    color: orange,
    maxIncoming: 0
  }),
  paletteNode({
    type: 'business-event',
    label: 'Business Event',
    icon: '⚙',
    group: 'startup',
    groupLabel: '启动触发节点',
    order: 40,
    color: orange,
    maxIncoming: 0
  }),
  paletteNode({
    type: 'and',
    label: 'And',
    icon: '&',
    group: 'binary',
    groupLabel: 'Binary节点',
    order: 110,
    color: green,
    bpmnType: 'bpmn:ExclusiveGateway'
  }),
  paletteNode({
    type: 'or',
    label: 'Or',
    icon: 'OR',
    group: 'binary',
    groupLabel: 'Binary节点',
    order: 120,
    color: green,
    bpmnType: 'bpmn:ExclusiveGateway'
  }),
  paletteNode({
    type: 'loop',
    label: 'Loop',
    icon: '↻',
    group: 'binary',
    groupLabel: 'Binary节点',
    order: 130,
    color: green,
    bpmnType: 'bpmn:ExclusiveGateway'
  }),
  ...[
    ['abort', 'Abort', '⊘'],
    ['http-call', 'HTTP Call', 'HTTP'],
    ['web-service', 'Web Service', '◎'],
    ['corba', 'Corba', 'ORB'],
    ['rv-message', 'RV Message', 'RV'],
    ['rabbit-message', 'Rabbit Message', '!'],
    ['raven-cast-message', 'Raven Cast Message', '✈'],
    ['save', 'Save', '▣'],
    ['email', 'Email', '✉'],
    ['log', 'Log', '▤'],
    ['publish-business-event', 'Publish Business Event', 'ϟ']
  ].map(([type, label, icon], index) =>
    paletteNode({
      type,
      label,
      icon,
      group: 'interaction',
      groupLabel: 'Interaction节点',
      order: 210 + index * 10,
      color: yellow
    })
  ),
  ...[
    ['wait-for-business-event', 'Wait For Business Event', '◔'],
    ['wait-for', 'Wait For', '◷'],
    ['if', 'IF', '◇'],
    ['switch', 'Switch', 'SW'],
    ['import', 'Import', '⇩'],
    ['claim', 'Claim', '▣'],
    ['release', 'Release', '▣'],
    ['function', 'Function', 'ƒx'],
    ['transform-xml', 'Transform XML', 'XML'],
    ['result', 'Result', '{x}'],
    ['run-job', 'Run Job', '⇄'],
    ['run-rule', 'Run Rule', '▧'],
    ['external-rule', 'External Rule', '☍'],
    ['sql', 'SQL', '◯'],
    ['export-sql', 'Export SQL', '◉'],
    ['file', 'File', '◻'],
    ['config-read', 'Config Read', '⚙'],
    ['script', 'Script', '⌞'],
    ['external-cmd', 'External CMD', '>']
  ].map(([type, label, icon], index) =>
    paletteNode({
      type,
      label,
      icon,
      group: 'functional',
      groupLabel: 'Functional节点',
      order: 410 + index * 10,
      color: blue
    })
  )
]
