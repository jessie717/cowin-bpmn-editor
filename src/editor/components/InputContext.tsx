import { computed, defineComponent, onMounted, ref } from 'vue'
import type { PropType } from 'vue'
import { ElTree } from '../../element-plus'
import type { WorkflowVariable } from '../variables'

interface ContextOption {
  label: string
  value: string
  type?: string
  description?: string
  disabled?: boolean
  children?: ContextOption[]
}

interface MockContextItem {
  id: string
  name: string
  type: string
  path: string[]
  description?: string
}

const GLOBAL_VARIABLE_ITEMS = [
  {
    id: 'global.variable.customer.id',
    name: 'customerId',
    type: 'String',
    path: ['Customer'],
    description: 'Current customer identifier'
  },
  {
    id: 'global.variable.customer.level',
    name: 'customerLevel',
    type: 'String',
    path: ['Customer'],
    description: 'Current customer tier'
  },
  {
    id: 'global.variable.order.amount',
    name: 'orderAmount',
    type: 'Number',
    path: ['Order'],
    description: 'Latest order amount'
  }
] satisfies MockContextItem[]

const GLOBAL_CONSTANT_ITEMS = [
  {
    id: 'global.constant.system.tenant',
    name: 'tenantCode',
    type: 'String',
    path: ['System'],
    description: 'Tenant code'
  },
  {
    id: 'global.constant.system.locale',
    name: 'defaultLocale',
    type: 'String',
    path: ['System'],
    description: 'Default locale'
  },
  {
    id: 'global.constant.risk.max_score',
    name: 'maxRiskScore',
    type: 'Number',
    path: ['Risk'],
    description: 'Maximum risk score'
  }
] satisfies MockContextItem[]

const treeProps = {
  label: 'label',
  children: 'children',
  disabled: 'disabled'
}
const ContextTree = ElTree as any

function createGroupTree(
  rootLabel: string,
  rootValue: string,
  items: MockContextItem[]
): ContextOption {
  const root: ContextOption = {
    label: rootLabel,
    value: rootValue,
    disabled: true,
    children: []
  }

  items.forEach((item) => {
    let cursor = root.children as ContextOption[]

    item.path.forEach((part, index) => {
      const value = `${rootValue}:${item.path.slice(0, index + 1).join('.')}`
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

      cursor = group.children as ContextOption[]
    })

    cursor.push({
      label: `${item.name} (${item.type})`,
      value: item.id,
      type: item.type,
      description: item.description
    })
  })

  return root
}

async function fetchGlobalVariables() {
  return GLOBAL_VARIABLE_ITEMS
}

async function fetchGlobalConstants() {
  return GLOBAL_CONSTANT_ITEMS
}

export function getInputContextVariables(
  upstreamVariables: WorkflowVariable[]
): WorkflowVariable[] {
  return [
    ...GLOBAL_VARIABLE_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      value: item.description ?? '',
      nodeLabel: 'Global Variables'
    })),
    ...GLOBAL_CONSTANT_ITEMS.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      value: item.description ?? '',
      nodeLabel: 'Global Constants'
    })),
    ...upstreamVariables
  ]
}

export const InputContext = defineComponent({
  name: 'InputContext',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    upstreamVariables: {
      type: Array as PropType<WorkflowVariable[]>,
      default: () => []
    },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      default: undefined
    }
  },
  setup(props) {
    const globalVariables = ref<ContextOption>({
      label: 'Global Variables',
      value: 'global.variable',
      disabled: true,
      children: []
    })
    const globalConstants = ref<ContextOption>({
      label: 'Global Constants',
      value: 'global.constant',
      disabled: true,
      children: []
    })

    onMounted(async () => {
      const [variables, constants] = await Promise.all([
        fetchGlobalVariables(),
        fetchGlobalConstants()
      ])

      globalVariables.value = createGroupTree(
        'Global Variables',
        'global.variable',
        variables
      )
      globalConstants.value = createGroupTree(
        'Global Constants',
        'global.constant',
        constants
      )
    })

    const contextTree = computed<ContextOption[]>(() => [
      globalVariables.value,
      globalConstants.value,
      {
        label: 'Upstream Variables',
        value: 'upstream.variable',
        disabled: true,
        children: props.upstreamVariables.length
          ? props.upstreamVariables.map((variable) => ({
              label: `${variable.nodeLabel ? `${variable.nodeLabel}.` : ''}${
                variable.name
              } (${variable.type})`,
              value: variable.id,
              type: variable.type,
              description:
                variable.value || variable.expression || variable.type
            }))
          : [
              {
                label: 'No upstream variables',
                value: 'upstream.variable.empty',
                disabled: true
              }
            ]
      }
    ])

    function handleNodeClick(node: ContextOption) {
      if (node.disabled || node.children?.length) {
        return
      }

      props.onChange?.(node.value)
    }

    function renderNodeLabel(_: unknown, { data }: { data: ContextOption }) {
      return (
        <span
          class={[
            'cowin-context-tree-node',
            data.disabled ? 'cowin-context-tree-node-disabled' : ''
          ]}
          title={data.description}
        >
          <span>{data.label}</span>
        </span>
      )
    }

    return () => (
      <section class="cowin-context-helper">
        <header class="cowin-context-helper-header">Input Context</header>
        <ContextTree
          class="cowin-context-tree"
          data={contextTree.value}
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
