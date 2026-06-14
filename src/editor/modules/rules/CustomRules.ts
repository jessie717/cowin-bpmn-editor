import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider'
import { getElementDefinition } from '../../../nodes/registry'

export function CustomRules(this: any, eventBus: any) {
  RuleProvider.call(this, eventBus)
}

CustomRules.$inject = ['eventBus']
CustomRules.prototype = Object.create(RuleProvider.prototype)
CustomRules.prototype.constructor = CustomRules

CustomRules.prototype.init = function () {
  this.addRule('connection.create', 1800, (context: any) => {
    const sourceDefinition = getElementDefinition(context.source)
    const targetDefinition = getElementDefinition(context.target)

    if (!sourceDefinition || !targetDefinition) {
      return undefined
    }

    if (sourceDefinition.rules.maxOutgoing === 0) {
      return false
    }

    if (targetDefinition.rules.maxIncoming === 0) {
      return false
    }

    const outgoingAllowed =
      !sourceDefinition.rules.outgoing.length ||
      sourceDefinition.rules.outgoing.includes(targetDefinition.type)
    const incomingAllowed =
      !targetDefinition.rules.incoming.length ||
      targetDefinition.rules.incoming.includes(sourceDefinition.type)

    if (!outgoingAllowed || !incomingAllowed) {
      return false
    }

    return { type: 'bpmn:SequenceFlow' }
  })

  this.addRule('shape.create', 1800, (context: any) => {
    const definition = getElementDefinition(context.shape)

    if (!definition) {
      return undefined
    }

    return true
  })

  this.addRule('shape.resize', 1800, (context: any) => {
    const definition = getElementDefinition(context.shape)

    if (!definition) {
      return undefined
    }

    return false
  })
}
