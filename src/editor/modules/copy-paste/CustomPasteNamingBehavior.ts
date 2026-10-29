import {
  getBusinessNodeType,
  getNodeDefinition
} from '../../../nodes/registry'
import { getLabel } from '../util'

const PASTE_ELEMENT_AFTER_BPMN_PRIORITY = 500
const NUMBERED_NAME_PATTERN = /^(.*?)(?:\s+(\d+))?$/

function normalizeName(value?: string | null) {
  return value?.trim() ?? ''
}

function getNameBase(name: string) {
  const match = name.match(NUMBERED_NAME_PATTERN)
  const base = normalizeName(match?.[1])

  return base || name
}

function getNameIndex(name: string) {
  const match = name.match(NUMBERED_NAME_PATTERN)
  const index = Number(match?.[2] ?? 0)

  return Number.isFinite(index) ? index : 0
}

function getNextNameIndex(base: string, reservedNames: Set<string>) {
  let maxIndex = 0

  for (const reservedName of reservedNames) {
    if (getNameBase(reservedName) === base) {
      maxIndex = Math.max(maxIndex, getNameIndex(reservedName))
    }
  }

  return maxIndex + 1
}

function nextAvailableName(baseName: string, reservedNames: Set<string>) {
  const base = normalizeName(baseName)

  if (!base) {
    return ''
  }

  let index = getNextNameIndex(base, reservedNames)
  let candidate = `${base} ${index}`

  while (reservedNames.has(candidate)) {
    index += 1
    candidate = `${base} ${index}`
  }

  reservedNames.add(candidate)

  return candidate
}

export function CustomPasteNamingBehavior(
  this: any,
  eventBus: any,
  elementRegistry: any
) {
  let reservedNames = new Set<string>()

  eventBus.on('copyPaste.pasteElements', () => {
    reservedNames = new Set(
      elementRegistry
        .getAll()
        .map((element: any) => normalizeName(getLabel(element)))
        .filter(Boolean)
    )
  })

  eventBus.on(
    'copyPaste.pasteElement',
    PASTE_ELEMENT_AFTER_BPMN_PRIORITY,
    (event: any) => {
      const businessObject = event.descriptor?.businessObject
      const nodeType = getBusinessNodeType(businessObject)
      const definition = getNodeDefinition(nodeType)

      if (!definition) {
        return
      }

      const copiedName = normalizeName(businessObject.name)
      const displayName = copiedName || definition.label
      const nextName = nextAvailableName(getNameBase(displayName), reservedNames)

      if (nextName) {
        businessObject.name = nextName
      }
    }
  )
}

CustomPasteNamingBehavior.$inject = ['eventBus', 'elementRegistry']
