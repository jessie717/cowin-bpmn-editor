import { VARIABLE_TYPES } from '../../variables'
import { ElInput, ElOption, ElSelect } from '../../../element-plus'
import type { DefaultConfigFieldProps } from './types'

export function renderDefaultConfigField({
  field,
  value,
  onUpdateConfig
}: DefaultConfigFieldProps) {
  const baseClass = 'cowin-node-dialog-control'
  const updateField = (nextValue: string | number) =>
    onUpdateConfig(field.key, String(nextValue ?? ''))

  return (
    <label key={field.key} class="cowin-node-dialog-field">
      <span>
        {field.label}
        {field.required ? <strong>*</strong> : null}
      </span>
      {field.control === 'textarea' ? (
        <ElInput
          class={baseClass}
          type="textarea"
          autosize={{ minRows: 3 }}
          placeholder={field.placeholder}
          modelValue={value}
          onInput={updateField}
        />
      ) : field.control === 'select' ? (
        <ElSelect
          class={baseClass}
          modelValue={value}
          onChange={updateField}
        >
          {field.options.map((option) => (
            <ElOption
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </ElSelect>
      ) : (
        <ElInput
          class={baseClass}
          placeholder={field.placeholder}
          modelValue={value}
          onInput={updateField}
        />
      )}
    </label>
  )
}

export function renderVariableTypeSelect(
  value: string,
  onChange: (value: string) => void
) {
  return (
    <ElSelect
      class="cowin-parameter-control"
      modelValue={value || VARIABLE_TYPES[0]}
      onChange={(nextValue: string | number) => onChange(String(nextValue))}
    >
      {VARIABLE_TYPES.map((type) => (
        <ElOption key={type} label={type} value={type} />
      ))}
    </ElSelect>
  )
}
