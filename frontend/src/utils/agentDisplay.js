const PALETTE = ['#1E3A5F', '#2D6A9F', '#7c3aed', '#0f766e', '#b45309', '#be123c']

export function agentColor(agentId) {
  return PALETTE[agentId % PALETTE.length]
}

export function initialsFromName(name) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
}