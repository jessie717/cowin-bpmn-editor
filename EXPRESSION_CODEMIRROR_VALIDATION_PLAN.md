# CodeMirror 6 表达式校验方案

## 1. 目标

在节点配置的 Expression 编辑场景中，引入 CodeMirror 6，并实现以下能力：

- 输入全局变量、全局常量、上游变量时提供自动补全。
- 输入内置函数时提供自动补全和参数签名提示。
- 严格校验函数是否存在、参数数量及参数类型。
- 严格校验变量和常量是否存在、是否在当前作用域内及类型是否匹配。
- 校验表达式最终返回类型是否与节点参数类型兼容。
- 在编辑器中准确标记错误位置，并在提交时阻止非法表达式保存。

## 2. 核心原则

CodeMirror 6 只负责编辑体验和错误展示，表达式语言服务负责解析和校验。

```text
CodeMirror 6
  ├─ CompletionSource：自动补全
  ├─ ViewPlugin：参数签名提示
  ├─ Linter：实时错误标记
  └─ Editor Command：光标位置插入
              ↓
ExpressionLanguageService
  ├─ tokenize
  ├─ parse → AST
  ├─ resolveSymbols
  ├─ validateFunctions
  ├─ inferTypes
  └─ validateExpectedType
              ↓
ExpressionRegistry
  ├─ 内置函数
  ├─ 全局变量
  ├─ 全局常量
  └─ 上游变量
```

核心校验不能写在 CodeMirror 插件内部，以便参数弹窗 `OK`、配置页 `Apply`、单元测试以及未来服务端校验复用。

## 3. 统一数据模型

### 3.1 表达式类型

建议先统一表达式类型：

```ts
type ExpressionType =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Date'
  | 'Object'
  | 'Array'
  | 'Null'
  | 'Unknown'
```

`Unknown` 表示当前元数据不足以完成静态推导，不等同于任意类型。

### 3.2 函数定义

`ExpressionHelper` 当前的表达式模板应升级为结构化函数定义：

```ts
interface ExpressionFunction {
  name: string
  label: string
  category: string
  parameters: ExpressionParameter[]
  returnType: ExpressionType
  description?: string
  examples?: string[]
}

interface ExpressionParameter {
  name: string
  types: ExpressionType[]
  required: boolean
  variadic?: boolean
  defaultValue?: unknown
}
```

示例：

```ts
{
  name: 'round',
  label: 'Round Number',
  category: 'Number',
  parameters: [
    { name: 'value', types: ['Number'], required: true },
    {
      name: 'digits',
      types: ['Number'],
      required: false,
      defaultValue: 0
    }
  ],
  returnType: 'Number'
}
```

函数注册表是以下功能的唯一数据源：

- `ExpressionHelper` 函数树。
- CodeMirror 函数自动补全。
- 参数签名提示。
- 参数数量及类型校验。
- 函数返回类型推导。

### 3.3 上下文符号

`InputContext` 中的 `ContextOption` 只作为 UI 树节点，不应作为校验数据源。全局变量、常量和上游变量应统一转换为领域模型：

```ts
interface ExpressionSymbol {
  id: string
  expressionName: string
  label: string
  kind: 'global-variable' | 'global-constant' | 'upstream-variable'
  type: ExpressionType
  description?: string
  readonly?: boolean
  sourceNodeId?: string
  properties?: ExpressionSymbolProperty[]
}
```

统一的数据流为：

```text
ExpressionSymbol[]
  ├─ 生成 InputContext 树
  ├─ 生成 CodeMirror 补全项
  └─ 提供给表达式校验器
```

## 4. 表达式语法

在开发编辑器能力之前，需要先固定表达式语法和变量引用格式。

建议变量引用使用稳定标识，不直接使用可能变化的节点显示名称：

```text
${global.variable.customer.id}
${global.constant.risk.max_score}
${upstream["node-id"].result}
```

函数表达式示例：

```text
trim(${global.variable.customer.id})
round(${global.variable.order.amount}, 2)
formatDate(${upstream["node-id"].createdAt}, "yyyy-MM-dd")
```

第一期建议支持：

- String、Number、Boolean 和 `null` 字面量。
- 变量和常量引用。
- 函数调用及嵌套函数。
- 括号。
- `+`、`-`、`*`、`/`。
- `==`、`!=`、`>`、`>=`、`<`、`<=`。
- `&&`、`||`、`!`。

表达式不能依赖正则进行整体解析，应通过 tokenizer 和 parser 生成 AST。例如：

```text
round(${global.variable.order.amount}, 2)
```

对应的 AST 概念结构：

```text
CallExpression
├─ callee: round
└─ arguments
   ├─ VariableReference: global.variable.order.amount
   └─ NumberLiteral: 2
```

## 5. CodeMirror 6 集成

### 5.1 实时校验

使用 `@codemirror/lint` 注册 Linter。Linter 获取编辑器文本，调用独立的语言服务，再将语言服务诊断转换为 CodeMirror `Diagnostic`。

```ts
const expressionLinter = linter(
  async (view): Promise<Diagnostic[]> => {
    const source = view.state.doc.toString()
    const result = validateExpression(source, {
      functions,
      symbols,
      expectedType,
      mode: 'editing'
    })

    return result.errors.map((error) => ({
      from: error.from,
      to: error.to,
      severity: error.severity,
      message: error.message
    }))
  },
  { delay: 300 }
)
```

CodeMirror 负责：

- 错误区间下划线。
- 鼠标悬浮错误信息。
- diagnostics 面板。
- 错误位置跳转。
- warning 和 error 样式。

语言服务返回统一结果：

```ts
interface ExpressionValidationResult {
  valid: boolean
  inferredType?: ExpressionType
  errors: ExpressionDiagnostic[]
}

interface ExpressionDiagnostic {
  code: string
  message: string
  from: number
  to: number
  severity: 'error' | 'warning' | 'info'
}
```

### 5.2 自动补全

使用 `@codemirror/autocomplete` 注册 `CompletionSource`。

输入函数名前缀时，例如：

```text
rou
```

提示：

```text
round(value: Number, digits?: Number): Number
```

确认后插入：

```text
round()
```

并将光标定位到括号内。

输入变量引用起始符时：

```text
${
```

提示当前节点可用的：

- 全局变量。
- 全局常量。
- 上游变量。

候选项同时展示来源、类型和描述。

在函数参数位置触发补全时，结合当前参数签名对候选项排序。例如 `round(` 的第一个参数要求 `Number`，应优先展示：

- Number 类型变量和常量。
- 返回 Number 的函数。
- Number 字面量建议。

### 5.3 参数签名提示

使用 CodeMirror `ViewPlugin` 和 tooltip 实现参数提示：

1. 监听文档和光标位置变化。
2. 从 AST 找到光标所在的 `CallExpression`。
3. 根据参数 AST 区间判断当前参数下标。
4. 从函数注册表读取签名。
5. 在光标附近展示并高亮当前参数。

示例：

```text
round(value: Number, digits?: Number): Number
      ^^^^^^^^^^^^^
```

输入逗号后：

```text
round(value: Number, digits?: Number): Number
                     ^^^^^^^^^^^^^^^
```

### 5.4 光标位置插入

`InputContext` 和 `ExpressionHelper` 点击节点时，不再覆盖整个 `modelValue`，而是调用 `ExpressionEditor` 暴露的插入命令：

```ts
insertExpression(text: string, selection?: SelectionSpec): void
```

点击变量时，在当前光标处插入完整引用：

```text
${global.variable.customer.id}
```

点击函数时插入函数调用，并选择第一个待输入参数：

```text
round(, 2)
```

## 6. 校验流程

### 6.1 词法校验

Tokenizer 检查：

- 字符串是否闭合。
- `${...}` 是否闭合。
- 是否存在非法字符。
- 数字格式是否合法。

例如：

```text
trim(${global.variable.customer.id)
```

诊断：

```text
变量引用缺少结束符 }
```

### 6.2 语法校验

Parser 检查：

- 函数括号是否匹配。
- 参数之间是否有逗号。
- 操作符左右是否存在表达式。
- 函数调用结构是否合法。

例如：

```text
round(amount 2)
```

诊断：

```text
参数之间缺少逗号
```

### 6.3 符号校验

遇到变量引用时，必须从当前 `ExpressionSymbol[]` 中精确查找，不能只检查字符串前缀。

检查内容包括：

- 变量或常量是否存在。
- 是否属于当前节点可访问范围。
- 上游节点是否仍然存在。
- 上游输出参数是否已删除。
- 对象字段是否存在。
- 常量是否被用于不允许的写入位置。

例如：

```text
${global.variable.customer.unknown}
```

诊断：

```text
未知变量：global.variable.customer.unknown
```

### 6.4 函数存在性校验

对于每个 `CallExpression`，从函数注册表精确查找定义。不存在时返回错误，并可提供相似名称建议：

```text
未知函数：formateDate，是否想输入 formatDate？
```

建议只提示，不自动修改表达式。

### 6.5 参数数量校验

根据函数签名计算：

```text
最少参数数 = required 参数数量
最多参数数 = parameters.length
```

只有声明了 `variadic` 的函数才允许超过固定参数数量。

示例诊断：

```text
trim 需要 1 个参数，实际得到 2 个
round 至少需要 1 个参数
```

### 6.6 参数类型校验

校验器递归推导每个参数表达式的类型。

```text
round(trim(${global.variable.customer.id}), 2)
```

推导过程：

```text
customer.id  → String
trim(String) → String
round.value  → 要求 Number
```

最终诊断定位到 `trim(...)`：

```text
round 的参数 value 需要 Number，实际得到 String
```

建议采用严格类型规则：

- Number 不自动接受数值字符串。
- String 不自动接受 Number。
- Boolean 不自动接受字符串 `"true"`。
- 类型转换必须显式调用 `toNumber`、`toString` 等函数。
- Object 和 Array 在元数据完整时继续检查字段或元素类型。
- 元数据不足时推导为 Unknown，并根据业务规则给出 warning 或 error。

### 6.7 最终结果类型校验

Function Argument 中的 `parameterForm.type` 作为 `expectedType` 传给校验器。

如果 Argument 类型为 Number，而表达式返回 String，则诊断：

```text
表达式结果类型为 String，与 Argument 类型 Number 不兼容
```

## 7. 编辑模式和提交模式

语言服务建议支持两种模式：

```ts
type ValidationMode = 'editing' | 'submit'
```

### 7.1 editing 模式

- 未闭合括号可以暂时显示为 warning。
- 正在输入的函数名前缀不立即报未知函数错误。
- 空表达式暂不报错。
- 已经明确的未知变量、参数类型错误继续显示。
- 使用约 300ms debounce，避免每次输入都同步执行完整校验。

### 7.2 submit 模式

点击参数弹窗 `OK` 或配置页 `Apply` 时执行严格校验：

- 未闭合表达式为 error。
- 必填表达式为空时为 error。
- 函数及变量必须存在。
- 参数数量必须正确。
- 参数类型必须匹配。
- 最终返回类型必须兼容。
- 存在任意 error 时禁止提交。

提交时必须直接调用语言服务重新校验，不能依赖 CodeMirror 当前 lint 状态，因为 lint 可能仍处于 debounce 延迟中。

## 8. ConfigPanel 交互策略

Function Argument 弹窗建议采用以下流程：

1. Expression 改变时，CodeMirror 以 `editing` 模式实时校验。
2. 点击 `OK` 时，以 `submit` 模式重新严格校验。
3. 校验失败时保留弹窗，并聚焦第一个错误。
4. 校验成功后写入 `draftOutputParameters`。
5. 点击配置页 `Apply` 时重新校验所有 Argument。
6. 任意 Argument 校验失败时，不调用 `onUpdateConfig`。
7. Arguments 表格可显示每条表达式的校验状态。

## 9. 组件职责调整

### ExpressionEditor

- 创建和销毁 CodeMirror 实例。
- 同步 `modelValue`。
- 注册补全、Linter、tooltip 和编辑器命令。
- 暴露在光标位置插入表达式的能力。
- 展示编辑期诊断。

### ExpressionHelper

- 从 Function Registry 生成函数树。
- 展示函数名称、签名、返回类型和说明。
- 点击函数后发出结构化插入请求。
- 不负责函数校验。

### InputContext

- 从 ExpressionSymbol Registry 生成上下文树。
- 展示变量来源、名称、类型和描述。
- 点击变量后发出结构化插入请求。
- 不负责变量校验。

### ExpressionLanguageService

- 不依赖 Vue。
- 不依赖 CodeMirror。
- 提供解析、符号解析、类型推导和严格校验。
- 作为编辑期和提交期校验的唯一实现。

## 10. 建议目录结构

```text
src/editor/expression/
├─ types.ts
├─ functionRegistry.ts
├─ contextRegistry.ts
├─ tokenizer.ts
├─ parser.ts
├─ validator.ts
├─ typeInference.ts
└─ codemirror/
   ├─ expressionLanguage.ts
   ├─ completion.ts
   ├─ linter.ts
   └─ signatureHelp.ts

src/editor/components/
├─ ExpressionEditor.tsx
├─ ExpressionHelper.tsx
└─ InputContext.tsx
```

## 11. 测试范围

### 语言服务单元测试

- 正常函数调用。
- 缺少参数和多余参数。
- 参数类型错误。
- 嵌套函数返回类型错误。
- 未知函数。
- 未知变量和常量。
- 已删除或超出作用域的上游变量。
- 对象字段不存在。
- editing 和 submit 模式的差异。
- 表达式最终类型与 Argument 类型不一致。
- 每个诊断的 `from` 和 `to` 是否准确。

### CodeMirror 集成测试

- 补全是否在正确位置出现。
- 函数插入后光标是否进入参数位置。
- 变量是否在光标位置插入而不是覆盖全文。
- 当前参数签名是否正确高亮。
- lint 区间是否正确显示。
- 点击 `OK` 是否阻止错误表达式提交。
- 点击 `Apply` 是否重新校验全部表达式。

## 12. 推荐实施顺序

1. 确定表达式语法、变量引用格式和严格类型兼容规则。
2. 建立 Function Registry 和 ExpressionSymbol Registry。
3. 实现 tokenizer、parser 和 AST 类型。
4. 实现纯函数式 `validateExpression()` 及单元测试。
5. 引入 CodeMirror 6 并封装 `ExpressionEditor`。
6. 接入自动补全、实时 Linter 和参数签名提示。
7. 调整 `InputContext` 和 `ExpressionHelper`，改为在光标位置插入。
8. 在 Function Argument 弹窗接入 `OK` 严格校验。
9. 在 Function 配置页接入 `Apply` 全量校验。
10. 验证稳定后复用到 If、Business Event、HTTP Call 和 Log 等表达式场景。

## 13. 最终约束

需要始终保证：

```text
ExpressionHelper 展示的函数
= CodeMirror 可补全的函数
= 校验器认可的函数

InputContext 展示的符号
= CodeMirror 可补全的符号
= 校验器允许引用的符号
```

通过统一 Registry 和独立语言服务，避免出现帮助面板、自动补全与最终校验规则不一致的问题。
