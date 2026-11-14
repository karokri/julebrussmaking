export const RATINGS = [
  { value: 1, emoji: '🤢', label: 'Æsj' },
  { value: 2, emoji: '😕', label: 'Nja' },
  { value: 3, emoji: '😐', label: 'Grei' },
  { value: 4, emoji: '😋', label: 'God' },
  { value: 5, emoji: '🤩', label: 'Nydelig' },
] as const

export const emojiFor = (v: number | undefined) => RATINGS.find((r) => r.value === v)?.emoji ?? '–'
