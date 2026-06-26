import { getElementDefinition, readNodeConfig } from '../../nodes/registry'
import type { ValidationIssue } from '../../nodes/types'
import {
  hasNodeValidationRule,
  pushIssue,
  validateNodeByRule
} from './nodeRules'
import { getUpstreamOutputVariables } from './rules/helpers'

export function validateProcess(modeler: any): ValidationIssue[] {
  const elementRegistry = modeler.get('elementRegistry')
  const elements = elementRegistry.getAll()
  const issues: ValidationIssue[] = []

  for (const element of elements) {
    const definition = getElementDefinition(element)

    if (!definition) {
      continue
    }

    const incoming = element.incoming?.length ?? 0
    const outgoing = element.outgoing?.length ?? 0
    const hasCustomRule = hasNodeValidationRule(definition.type)

    if (!hasCustomRule && definition.rules.maxIncoming === 0 && incoming > 0) {
      pushIssue(issues, element.id, 'error', `${definition.label}不能有入线`)
    }

    if (!hasCustomRule && definition.rules.maxOutgoing === 0 && outgoing > 0) {
      pushIssue(issues, element.id, 'error', `${definition.label}不能有出线`)
    }

    if (
      !hasCustomRule &&
      definition.rules.maxIncoming !== 0 &&
      incoming === 0
    ) {
      pushIssue(issues, element.id, 'warning', `${definition.label}缺少入线`)
    }

    if (
      !hasCustomRule &&
      definition.rules.maxOutgoing !== 0 &&
      outgoing === 0
    ) {
      pushIssue(issues, element.id, 'warning', `${definition.label}缺少出线`)
    }

    const config = readNodeConfig(element)

    for (const property of definition.propertiesSchema) {
      const value = config[property.key]

      if (property.required && (!value || !String(value).trim())) {
        pushIssue(
          issues,
          element.id,
          'error',
          `${definition.label}缺少${property.label}`
        )
      }
    }

    validateNodeByRule({
      element,
      definition,
      config,
      issues,
      getUpstreamOutputVariables
    })
  }

  return issues
}

export function applyValidationMarkers(
  modeler: any,
  issues: ValidationIssue[]
) {
  const canvas = modeler.get('canvas')
  const elementRegistry = modeler.get('elementRegistry')
  const issueElementIds = new Set(issues.map((issue) => issue.elementId))

  for (const element of elementRegistry.getAll()) {
    canvas.removeMarker(element, 'cowin-has-issue')
  }

  for (const elementId of issueElementIds) {
    const element = elementRegistry.get(elementId)

    if (element) {
      canvas.addMarker(element, 'cowin-has-issue')
    }
  }
}
