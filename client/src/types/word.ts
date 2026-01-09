export type WordDifficulty = 0 | 1 | 2 | null

export interface Word {
  id: number
  word: string
  phonetic: string
  meaning: string
  pronunciation1: string | null
  pronunciation2: string | null
  pronunciation3: string | null
  sentence?: string | null
  notes: string | null
  createdAt: string
  difficulty: WordDifficulty
  isMastered: boolean | null
  pronunciationRules?: Array<{ id: number; letterCombination: string; pronunciation: string }>
  hasImage: boolean
  imageType: 'url' | 'iconfont' | 'emoji' | null
  imageValue: string | null
}

export const difficultyMetadata: Record<
  0 | 1 | 2,
  { label: string; className: string }
> = {
  0: { label: "简单", className: "bg-emerald-50 text-emerald-700" },
  1: { label: "中等", className: "bg-amber-50 text-amber-700" },
  2: { label: "困难", className: "bg-rose-50 text-rose-700" },
};
