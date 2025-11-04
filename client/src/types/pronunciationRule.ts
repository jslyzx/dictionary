export interface PronunciationRule {
  id: number
  letterCombination: string
  pronunciation: string
  ruleDescription?: string | null
  createdAt: string
  updatedAt: string
  wordCount?: number
}

export interface WordPronunciationRule {
  id: number
  letterCombination: string
  pronunciation: string
  ruleDescription?: string | null
  positionInWord?: number | null
  ruleAssociatedAt: string
}

export interface CreatePronunciationRulePayload {
  letterCombination: string
  pronunciation: string
  ruleDescription?: string | null
}

export interface UpdatePronunciationRulePayload {
  letterCombination?: string
  pronunciation?: string
  ruleDescription?: string | null
}

export interface AddWordPronunciationRulesPayload {
  pronunciationRuleIds: number[]
  positionInWord?: number | null
}

export interface ListPronunciationRulesParams {
  page?: number
  limit?: number
  search?: string
}

export interface PronunciationRuleListResult {
  items: PronunciationRule[]
  total: number
  page: number
  limit: number
}