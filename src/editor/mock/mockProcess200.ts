import { allNodeDefinitions } from '../../nodes/paletteNodes'

const NODE_COUNT = 200
const COLUMN_COUNT = 20
const NODE_SIZE = 40
const X_GAP = 150
const Y_GAP = 110
const START_X = 120
const START_Y = 80

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function toTagName(bpmnType: string) {
  const [prefix, name] = bpmnType.split(':')
  return `${prefix}:${name.charAt(0).toLowerCase()}${name.slice(1)}`
}

function getNodePosition(index: number) {
  const row = Math.floor(index / COLUMN_COUNT)
  const columnInRow = index % COLUMN_COUNT
  const column = row % 2 === 0 ? columnInRow : COLUMN_COUNT - 1 - columnInRow

  return {
    x: START_X + column * X_GAP,
    y: START_Y + row * Y_GAP
  }
}

const manualStartDefinition = allNodeDefinitions.find(
  (definition) => definition.type === 'manual-start'
)

const reusableDefinitions = allNodeDefinitions.filter(
  (definition) => definition.type !== 'manual-start' && definition.rules.maxIncoming !== 0
)

const mockNodes = Array.from({ length: NODE_COUNT }, (_, index) => {
  const definition =
    index === 0
      ? manualStartDefinition ?? reusableDefinitions[0]
      : reusableDefinitions[(index - 1) % reusableDefinitions.length]
  const position = getNodePosition(index)

  return {
    id: `MockNode_${String(index + 1).padStart(3, '0')}`,
    definition,
    position
  }
})

const mockFlows = Array.from({ length: NODE_COUNT - 1 }, (_, index) => {
  const source = mockNodes[index]
  const target = mockNodes[index + 1]

  return {
    id: `MockFlow_${String(index + 1).padStart(3, '0')}`,
    source,
    target
  }
})

function renderNode(node: (typeof mockNodes)[number], index: number) {
  const incoming = index > 0 ? `MockFlow_${String(index).padStart(3, '0')}` : null
  const outgoing =
    index < mockNodes.length - 1
      ? `MockFlow_${String(index + 1).padStart(3, '0')}`
      : null
  const tagName = toTagName(node.definition.bpmnType)
  const config = xmlEscape(JSON.stringify(node.definition.defaultProperties))

  return [
    `    <${tagName} id="${node.id}" cowin:nodeType="${node.definition.type}" cowin:config="${config}">`,
    incoming ? `      <bpmn:incoming>${incoming}</bpmn:incoming>` : null,
    outgoing ? `      <bpmn:outgoing>${outgoing}</bpmn:outgoing>` : null,
    `    </${tagName}>`
  ]
    .filter(Boolean)
    .join('\n')
}

function renderFlow(flow: (typeof mockFlows)[number]) {
  return `    <bpmn:sequenceFlow id="${flow.id}" sourceRef="${flow.source.id}" targetRef="${flow.target.id}" />`
}

function renderShape(node: (typeof mockNodes)[number]) {
  return [
    `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">`,
    `        <dc:Bounds x="${node.position.x}" y="${node.position.y}" width="${NODE_SIZE}" height="${NODE_SIZE}" />`,
    `      </bpmndi:BPMNShape>`
  ].join('\n')
}

function renderEdge(flow: (typeof mockFlows)[number]) {
  const source = flow.source.position
  const target = flow.target.position
  const isForward = target.x >= source.x
  const sourcePoint = {
    x: isForward ? source.x + NODE_SIZE : source.x,
    y: source.y + NODE_SIZE / 2
  }
  const targetPoint = {
    x: isForward ? target.x : target.x + NODE_SIZE,
    y: target.y + NODE_SIZE / 2
  }

  return [
    `      <bpmndi:BPMNEdge id="${flow.id}_di" bpmnElement="${flow.id}">`,
    `        <di:waypoint x="${sourcePoint.x}" y="${sourcePoint.y}" />`,
    `        <di:waypoint x="${targetPoint.x}" y="${targetPoint.y}" />`,
    `      </bpmndi:BPMNEdge>`
  ].join('\n')
}

export const MOCK_PROCESS_200_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:cowin="https://cowin.local/schema/bpmn" id="Definitions_Cowin_Mock_200" targetNamespace="https://cowin.local/schema/bpmn">
  <bpmn:process id="Process_Cowin_Mock_200" isExecutable="false">
${mockNodes.map(renderNode).join('\n')}
${mockFlows.map(renderFlow).join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_Cowin_Mock_200">
    <bpmndi:BPMNPlane id="BPMNPlane_Cowin_Mock_200" bpmnElement="Process_Cowin_Mock_200">
${mockNodes.map(renderShape).join('\n')}
${mockFlows.map(renderEdge).join('\n')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
