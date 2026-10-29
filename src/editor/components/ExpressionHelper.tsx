import { defineComponent, onMounted, ref } from 'vue'
import type { PropType } from 'vue'
import { ElTree } from '../../element-plus'
import { EXPRESSION_FUNCTIONS } from '../expression'

interface ExpressionOption {
  label: string
  value: string
  disabled?: boolean
  children?: ExpressionOption[]
}

interface MockExpressionItem {
  id: string
  name: string
  expression: string
  path: string[]
}

const treeProps = {
  label: 'label',
  children: 'children',
  disabled: 'disabled'
}
const ContextTree = ElTree as any

function createExpressionTree(items: MockExpressionItem[]) {
  const root: ExpressionOption = {
    label: 'Global Expressions',
    value: 'global.expression',
    disabled: true,
    children: []
  }

  items.forEach((item) => {
    let cursor = root.children as ExpressionOption[]

    item.path.forEach((part, index) => {
      const value = `global.expression:${item.path.slice(0, index + 1).join('.')}`
      let group = cursor.find((option) => option.value === value)

      if (!group) {
        group = {
          label: part,
          value,
          disabled: true,
          children: []
        }
        cursor.push(group)
      }

      cursor = group.children as ExpressionOption[]
    })

    cursor.push({
      label: item.name,
      value: item.expression
    })
  })

  return [root]
}

async function fetchGlobalExpressions() {
  return EXPRESSION_FUNCTIONS.map((definition) => ({
    id: `global.expression.${definition.category.toLowerCase()}.${definition.name}`,
    name: definition.label,
    expression:
      definition.name === 'round'
        ? 'round(, 2)'
        : definition.name === 'formatDate'
          ? 'formatDate(, "yyyy-MM-dd")'
          : `${definition.name}()`,
    path: [definition.category]
  })) satisfies MockExpressionItem[]
}

export const ExpressionHelper = defineComponent({
  name: 'ExpressionHelper',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      default: undefined
    }
  },
  setup(props) {
    const expressions = ref<ExpressionOption[]>([])

    onMounted(async () => {
      expressions.value = createExpressionTree(await fetchGlobalExpressions())
    })

    function handleNodeClick(node: ExpressionOption) {
      if (node.disabled || node.children?.length) {
        return
      }

      props.onChange?.(node.value)
    }

    function renderNodeLabel(_: unknown, { data }: { data: ExpressionOption }) {
      return (
        <span
          class={[
            'cowin-context-tree-node',
            data.disabled ? 'cowin-context-tree-node-disabled' : ''
          ]}
          title={data.value}
        >
          <span>{data.label}</span>
        </span>
      )
    }

    return () => (
      <section class="cowin-context-helper">
        <header class="cowin-context-helper-header">Expression Helper</header>
        <ContextTree
          class="cowin-context-tree"
          data={expressions.value}
          props={treeProps}
          nodeKey="value"
          currentNodeKey={props.modelValue}
          defaultExpandAll
          highlightCurrent
          expandOnClickNode
          renderContent={renderNodeLabel}
          onNodeClick={handleNodeClick}
        />
      </section>
    )
  }
})
