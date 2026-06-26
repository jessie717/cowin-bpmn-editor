const nodeIconUrls = import.meta.glob<string>('../../assets/node-svg/*.svg', {
  eager: true,
  import: 'default',
  query: '?url'
})

export function getNodeIconUrl(type: string) {
  return nodeIconUrls[`../../assets/node-svg/${type}.svg`]
}
