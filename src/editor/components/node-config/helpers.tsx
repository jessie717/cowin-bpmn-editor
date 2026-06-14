import { VARIABLE_TYPES } from '../../variables'
import type { DefaultConfigFieldProps } from './types'

export function getInputValue(event: Event) {
  return (
    event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ).value
}

export function renderDefaultConfigField({
  field,
  value,
  onUpdateConfig
}: DefaultConfigFieldProps) {
  const baseClass = 'cowin-node-dialog-control'

  return (
    <label key={field.key} class="cowin-node-dialog-field">
      <span>
        {field.label}
        {field.required ? <strong>*</strong> : null}
      </span>
      {field.control === 'textarea' ? (
        <textarea
          class={baseClass}
          placeholder={field.placeholder}
          value={value}
          onInput={(event) => onUpdateConfig(field.key, getInputValue(event))}
        />
      ) : field.control === 'select' ? (
        <select
          class={baseClass}
          value={value}
          onChange={(event) => onUpdateConfig(field.key, getInputValue(event))}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          class={baseClass}
          placeholder={field.placeholder}
          value={value}
          onInput={(event) => onUpdateConfig(field.key, getInputValue(event))}
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
    <select
      class="cowin-parameter-control"
      value={value || VARIABLE_TYPES[0]}
      onChange={(event) => onChange(getInputValue(event))}
    >
      {VARIABLE_TYPES.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  )
}
