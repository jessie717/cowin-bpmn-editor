import { getElementDefinition } from '../../../nodes/registry'

function removeEntry(modeling: any, element: any, title: string) {
  return {
    delete: {
      group: 'edit',
      className: 'bpmn-icon-trash',
      title,
      action: {
        click: () => modeling.removeElements([element])
      }
    }
  }
}

export function CustomContextPadProvider(
  this: any,
  injector: any,
  contextPad: any,
  modeling: any,
  elementFactory: any,
  connect: any,
  create: any
) {
  this._modeling = modeling
  this._elementFactory = elementFactory
  this._connect = connect
  this._create = create
  this._autoPlace = injector.get('autoPlace', false)

  contextPad.registerProvider(this)
}

CustomContextPadProvider.$inject = [
  'injector',
  'contextPad',
  'modeling',
  'elementFactory',
  'connect',
  'create'
]

CustomContextPadProvider.prototype.getContextPadEntries = function (
  element: any
) {
  const definition = getElementDefinition(element)

  if (element?.type === 'bpmn:TextAnnotation') {
    return removeEntry(this._modeling, element, '删除注释')
  }

  if (element?.waypoints) {
    return removeEntry(this._modeling, element, '删除连线')
  }

  if (!definition) {
    return {}
  }

  const appendAnnotation = (event: MouseEvent) => {
    const annotation = this._elementFactory.createShape({
      type: 'bpmn:TextAnnotation'
    })

    this._create.start(event, annotation, {
      source: element
    })
  }

  const entries: Record<string, unknown> = {
    'append.text-annotation': {
      group: 'model',
      className: 'bpmn-icon-text-annotation',
      title: '添加注释',
      action: {
        click: (_event: MouseEvent) => {
          const annotation = this._elementFactory.createShape({
            type: 'bpmn:TextAnnotation'
          })

          if (this._autoPlace) {
            this._autoPlace.append(element, annotation)
            return
          }

          this._create.start(_event, annotation, {
            source: element
          })
        },
        dragstart: appendAnnotation
      }
    },
    connect: {
      group: 'connect',
      className: 'bpmn-icon-connection-multi',
      title: '连接节点',
      action: {
        click: (event: MouseEvent) => this._connect.start(event, element),
        dragstart: (event: MouseEvent) => this._connect.start(event, element)
      }
    },
    delete: {
      group: 'edit',
      className: 'bpmn-icon-trash',
      title: '删除节点',
      action: {
        click: () => this._modeling.removeElements([element])
      }
    }
  }

  return entries
}
