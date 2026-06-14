import { CustomContextPadProvider } from './context-pad/CustomContextPadProvider'
import { ContextPadViewportGuard } from './context-pad/ContextPadViewportGuard'
import { CustomEditingGuard } from './editing/CustomEditingGuard'
import { CustomOutlineProvider } from './outline/CustomOutlineProvider'
import { CustomPaletteProvider } from './palette/CustomPaletteProvider'
import { CustomRenderer } from './renderer/CustomRenderer'
import { CustomRules } from './rules/CustomRules'

export const customBpmnModules = {
  __init__: [
    'paletteProvider',
    'contextPadProvider',
    'contextPadViewportGuard',
    'customRenderer',
    'customRules',
    'customOutlineProvider',
    'customEditingGuard'
  ],
  paletteProvider: ['type', CustomPaletteProvider],
  contextPadProvider: ['type', CustomContextPadProvider],
  contextPadViewportGuard: ['type', ContextPadViewportGuard],
  customRenderer: ['type', CustomRenderer],
  customRules: ['type', CustomRules],
  customOutlineProvider: ['type', CustomOutlineProvider],
  customEditingGuard: ['type', CustomEditingGuard]
}
