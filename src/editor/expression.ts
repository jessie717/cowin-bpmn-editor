import type { WorkflowVariable } from './variables'

export type ExpressionValueType =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Object'
  | 'Array'
  | 'Unknown'

export interface ExpressionParameterDefinition {
  name: string
  types: ExpressionValueType[]
  required: boolean
}

export interface ExpressionFunctionDefinition {
  name: string
  label: string
  category: string
  parameters: ExpressionParameterDefinition[]
  returnType: ExpressionValueType
  example: string
}

export interface ExpressionSymbol {
  id: string
  label: string
  type: ExpressionValueType
  detail?: string
}

export interface ExpressionDiagnostic {
  from: number
  to: number
  message: string
  severity: 'error' | 'warning'
}

export const EXPRESSION_FUNCTIONS: ExpressionFunctionDefinition[] = [
  {
    name: 'trim',
    label: 'Trim String',
    category: 'String',
    parameters: [{ name: 'value', types: ['String'], required: true }],
    returnType: 'String',
    example: 'trim(value)'
  },
  {
    name: 'upper',
    label: 'Uppercase String',
    category: 'String',
    parameters: [{ name: 'value', types: ['String'], required: true }],
    returnType: 'String',
    example: 'upper(value)'
  },
  {
    name: 'round',
    label: 'Round Number',
    category: 'Number',
    parameters: [
      { name: 'value', types: ['Number'], required: true },
      { name: 'digits', types: ['Number'], required: false }
    ],
    returnType: 'Number',
    example: 'round(value, 2)'
  },
  {
    name: 'formatDate',
    label: 'Format Date',
    category: 'Date',
    parameters: [
      { name: 'value', types: ['String'], required: true },
      { name: 'pattern', types: ['String'], required: true }
    ],
    returnType: 'String',
    example: 'formatDate(value, "yyyy-MM-dd")'
  }
]

export const GLOBAL_EXPRESSION_SYMBOLS: ExpressionSymbol[] = [
  {
    id: 'global.variable.customer.id',
    label: 'customerId',
    type: 'String',
    detail: 'Current customer identifier'
  },
  {
    id: 'global.variable.customer.level',
    label: 'customerLevel',
    type: 'String',
    detail: 'Current customer tier'
  },
  {
    id: 'global.variable.order.amount',
    label: 'orderAmount',
    type: 'Number',
    detail: 'Latest order amount'
  },
  {
    id: 'global.constant.system.tenant',
    label: 'tenantCode',
    type: 'String',
    detail: 'Tenant code'
  },
  {
    id: 'global.constant.system.locale',
    label: 'defaultLocale',
    type: 'String',
    detail: 'Default locale'
  },
  {
    id: 'global.constant.risk.max_score',
    label: 'maxRiskScore',
    type: 'Number',
    detail: 'Maximum risk score'
  }
]

export function createExpressionSymbols(upstream: WorkflowVariable[]) {
  return [
    ...GLOBAL_EXPRESSION_SYMBOLS,
    ...upstream.map<ExpressionSymbol>((variable) => ({
      id: variable.id,
      label: `${variable.nodeLabel ? `${variable.nodeLabel}.` : ''}${variable.name}`,
      type: normalizeType(variable.type),
      detail: variable.value || variable.expression || variable.type
    }))
  ]
}

function normalizeType(type: string): ExpressionValueType {
  return ['String', 'Number', 'Boolean', 'Object', 'Array'].includes(type)
    ? (type as ExpressionValueType)
    : 'Unknown'
}

interface ParsedExpression {
  type: ExpressionValueType
  from: number
  to: number
}

class ExpressionParser {
  private position = 0
  readonly diagnostics: ExpressionDiagnostic[] = []

  constructor(
    private readonly source: string,
    private readonly symbols: Map<string, ExpressionSymbol>,
    private readonly functions: Map<string, ExpressionFunctionDefinition>
  ) {}

  parse(): ParsedExpression | undefined {
    this.skipSpace()
    const expression = this.parseValue()
    this.skipSpace()
    if (expression && this.position < this.source.length) {
      this.error(this.position, this.source.length, '存在无法识别的表达式内容')
    }
    return expression
  }

  private parseValue(): ParsedExpression | undefined {
    this.skipSpace()
    const start = this.position
    const char = this.source[this.position]

    if (char === '"' || char === "'") return this.parseString(char)
    if (char === '$' && this.source[this.position + 1] === '{') {
      return this.parseWrappedSymbol()
    }
    if (char && /[0-9]/.test(char)) return this.parseNumber()
    if (char === '(') return this.parseParenthesized()

    const name = this.readIdentifier()
    if (!name) {
      this.error(start, Math.min(start + 1, this.source.length), '此处需要表达式')
      return undefined
    }

    this.skipSpace()
    if (this.source[this.position] === '(') return this.parseCall(name, start)
    if (name === 'true' || name === 'false') {
      return { type: 'Boolean', from: start, to: this.position }
    }
    return this.resolveSymbol(name, start, this.position)
  }

  private parseString(quote: string): ParsedExpression {
    const start = this.position++
    while (this.position < this.source.length) {
      if (this.source[this.position] === '\\') {
        this.position += 2
      } else if (this.source[this.position++] === quote) {
        return { type: 'String', from: start, to: this.position }
      }
    }
    this.error(start, this.source.length, '字符串缺少结束引号')
    return { type: 'String', from: start, to: this.source.length }
  }

  private parseNumber(): ParsedExpression {
    const start = this.position
    while (/[0-9.]/.test(this.source[this.position] || '')) this.position++
    const raw = this.source.slice(start, this.position)
    if (!/^\d+(\.\d+)?$/.test(raw)) this.error(start, this.position, '数字格式无效')
    return { type: 'Number', from: start, to: this.position }
  }

  private parseWrappedSymbol(): ParsedExpression {
    const start = this.position
    this.position += 2
    const nameStart = this.position
    while (this.position < this.source.length && this.source[this.position] !== '}') {
      this.position++
    }
    const name = this.source.slice(nameStart, this.position).trim()
    if (this.source[this.position] !== '}') {
      this.error(start, this.source.length, '变量引用缺少结束符 }')
    } else {
      this.position++
    }
    return this.resolveSymbol(name, start, this.position)
  }

  private parseParenthesized(): ParsedExpression | undefined {
    const start = this.position++
    const value = this.parseValue()
    this.skipSpace()
    if (this.source[this.position] !== ')') {
      this.error(start, this.position, '表达式缺少右括号')
    } else {
      this.position++
    }
    return value ? { ...value, from: start, to: this.position } : undefined
  }

  private parseCall(name: string, start: number): ParsedExpression {
    this.position++
    const args: ParsedExpression[] = []
    this.skipSpace()
    while (this.position < this.source.length && this.source[this.position] !== ')') {
      const before = this.position
      const argument = this.parseValue()
      if (argument) args.push(argument)
      if (this.position === before) this.position++
      this.skipSpace()
      if (this.source[this.position] === ',') {
        this.position++
        this.skipSpace()
      } else if (this.source[this.position] !== ')') {
        this.error(this.position, Math.min(this.position + 1, this.source.length), '参数之间缺少逗号')
        break
      }
    }
    if (this.source[this.position] === ')') {
      this.position++
    } else {
      this.error(start, this.position, `函数 ${name} 缺少右括号`)
    }

    const definition = this.functions.get(name)
    if (!definition) {
      this.error(start, start + name.length, `未知函数：${name}`)
      return { type: 'Unknown', from: start, to: this.position }
    }

    const required = definition.parameters.filter((parameter) => parameter.required).length
    if (args.length < required || args.length > definition.parameters.length) {
      this.error(
        start,
        this.position,
        `${name} 需要 ${required === definition.parameters.length ? required : `${required}-${definition.parameters.length}`} 个参数，实际得到 ${args.length} 个`
      )
    }
    args.forEach((argument, index) => {
      const parameter = definition.parameters[index]
      if (parameter && argument.type !== 'Unknown' && !parameter.types.includes(argument.type)) {
        this.error(
          argument.from,
          argument.to,
          `${name} 的参数 ${parameter.name} 需要 ${parameter.types.join(' 或 ')}，实际得到 ${argument.type}`
        )
      }
    })
    return { type: definition.returnType, from: start, to: this.position }
  }

  private resolveSymbol(name: string, from: number, to: number): ParsedExpression {
    const symbol = this.symbols.get(name)
    if (!symbol) {
      this.error(from, to, `未知变量或常量：${name}`)
      return { type: 'Unknown', from, to }
    }
    return { type: symbol.type, from, to }
  }

  private readIdentifier() {
    const start = this.position
    while (/[^\s(),]/.test(this.source[this.position] || '')) this.position++
    return this.source.slice(start, this.position)
  }

  private skipSpace() {
    while (/\s/.test(this.source[this.position] || '')) this.position++
  }

  private error(from: number, to: number, message: string) {
    this.diagnostics.push({
      from: Math.max(0, from),
      to: Math.max(from + 1, to),
      message,
      severity: 'error'
    })
  }
}

export function validateExpression(
  source: string,
  symbols: ExpressionSymbol[],
  expectedType?: string
) {
  if (!source.trim()) {
    return {
      valid: false,
      inferredType: 'Unknown' as ExpressionValueType,
      diagnostics: [
        { from: 0, to: 1, message: 'Expression is required', severity: 'error' as const }
      ]
    }
  }

  const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]))
  const functionMap = new Map(
    EXPRESSION_FUNCTIONS.map((definition) => [definition.name, definition])
  )
  const diagnostics: ExpressionDiagnostic[] = []
  let inferredType: ExpressionValueType = 'Unknown'
  let lastExpression: ParsedExpression | undefined
  let offset = 0

  source.split('\n').forEach((line) => {
    if (line.trim()) {
      const parser = new ExpressionParser(line, symbolMap, functionMap)
      const expression = parser.parse()
      diagnostics.push(
        ...parser.diagnostics.map((diagnostic) => ({
          ...diagnostic,
          from: diagnostic.from + offset,
          to: diagnostic.to + offset
        }))
      )
      if (expression) {
        inferredType = expression.type
        lastExpression = {
          ...expression,
          from: expression.from + offset,
          to: expression.to + offset
        }
      }
    }
    offset += line.length + 1
  })

  const normalizedExpected = expectedType ? normalizeType(expectedType) : undefined
  if (
    lastExpression &&
    normalizedExpected &&
    normalizedExpected !== 'Unknown' &&
    lastExpression.type !== 'Unknown' &&
    lastExpression.type !== normalizedExpected
  ) {
    diagnostics.push({
      from: lastExpression.from,
      to: lastExpression.to,
      message: `表达式结果类型为 ${lastExpression.type}，与参数类型 ${normalizedExpected} 不兼容`,
      severity: 'error'
    })
  }
  return {
    valid: diagnostics.length === 0,
    inferredType,
    diagnostics
  }
}
