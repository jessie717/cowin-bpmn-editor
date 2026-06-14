import { isCustomElement } from '../util'

export function CustomEditingGuard(this: any, eventBus: any) {
  eventBus.on('directEditing.activate.allowed', 2000, (context: any) => {
    if (isCustomElement(context.element)) {
      return false
    }

    return undefined
  })
}

CustomEditingGuard.$inject = ['eventBus']
