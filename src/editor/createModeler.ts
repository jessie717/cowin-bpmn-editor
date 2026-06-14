import Modeler from 'bpmn-js/lib/Modeler'
import minimapModule from 'diagram-js-minimap'
import cowinModdle from './moddle/cowin.json'
import { customBpmnModules } from './modules'

export function createModeler(container: HTMLElement) {
  return new Modeler({
    container,
    additionalModules: [customBpmnModules, minimapModule],
    minimap: {
      open: true
    },
    moddleExtensions: {
      cowin: cowinModdle
    }
  })
}
