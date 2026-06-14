export type CustomNodeType = string

export type BpmnBaseType =
  | 'bpmn:StartEvent'
  | 'bpmn:EndEvent'
  | 'bpmn:UserTask'
  | 'bpmn:ServiceTask'
  | 'bpmn:ExclusiveGateway'

export type PropertySchema =
  | {
      key: string
      label: string
      control: 'text' | 'textarea'
      placeholder?: string
      required?: boolean
    }
  | {
      key: string
      label: string
      control: 'select'
      options: Array<{ label: string; value: string }>
      required?: boolean
    }

export interface ValidationIssue {
  elementId: string
  level: 'error' | 'warning'
  message: string
}

export interface NodeDefinition {
  type: CustomNodeType
  label: string
  bpmnType: BpmnBaseType
  defaultSize: {
    width: number
    height: number
  }
  defaultProperties: Record<string, string>
  palette: {
    group: string
    groupLabel?: string
    order: number
    icon: string
    iconUrl?: string
    color?: string
    visible?: boolean
  }
  renderer: {
    shape: 'event' | 'task' | 'gateway'
    fill: string
    stroke: string
    icon: string
    iconUrl?: string
  }
  contextPad: {
    appendable: CustomNodeType[]
  }
  rules: {
    incoming: CustomNodeType[]
    outgoing: CustomNodeType[]
    maxIncoming?: number
    maxOutgoing?: number
  }
  propertiesSchema: PropertySchema[]
}
