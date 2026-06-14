function isConnection(element: any) {
  return Array.isArray(element?.waypoints)
}

function isPointInViewbox(point: { x: number; y: number }, viewbox: any) {
  return (
    point.x >= viewbox.x &&
    point.x <= viewbox.x + viewbox.width &&
    point.y >= viewbox.y &&
    point.y <= viewbox.y + viewbox.height
  )
}

function isShapeInViewbox(element: any, viewbox: any) {
  return (
    element.x >= viewbox.x &&
    element.y >= viewbox.y &&
    element.x + element.width <= viewbox.x + viewbox.width &&
    element.y + element.height <= viewbox.y + viewbox.height
  )
}

function isTargetInViewbox(target: any, viewbox: any) {
  const elements = Array.isArray(target) ? target : [target]

  return elements.every((element) => {
    if (isConnection(element)) {
      const lastWaypoint = element.waypoints[element.waypoints.length - 1]
      return lastWaypoint ? isPointInViewbox(lastWaypoint, viewbox) : false
    }

    return isShapeInViewbox(element, viewbox)
  })
}

export function ContextPadViewportGuard(
  this: any,
  eventBus: any,
  canvas: any,
  contextPad: any
) {
  function updateContextPadVisibility() {
    window.requestAnimationFrame(() => {
      const current = contextPad._current

      if (!current) {
        return
      }

      if (isTargetInViewbox(current.target, canvas.viewbox())) {
        contextPad.show()
        return
      }

      contextPad.hide()
    })
  }

  eventBus.on('contextPad.open', 500, updateContextPadVisibility)
  eventBus.on('canvas.viewbox.changed', 500, updateContextPadVisibility)
}

ContextPadViewportGuard.$inject = ['eventBus', 'canvas', 'contextPad']
