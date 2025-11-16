/**
 * 句子与分词相关类型定义
 */

/**
 * 分词类型
 */
export interface SentenceToken {
  /** 分词在句子中的位置，从0开始 */
  position: number;
  /** 分词文本 */
  text: string;
  /** 分词类型：word(单词) 或 punctuation(标点) */
  type: 'word' | 'punctuation';
  /** 关联的单词ID，null表示未关联 */
  word_id?: number | null;
  /** 关联的单词信息（查询时返回） */
  word?: {
    word_id: number;
    word: string;
    meaning: string;
    phonetic?: string;
  } | null;
}

/**
 * 句子实体
 */
export interface Sentence {
  /** 句子ID */
  id: number;
  /** 句子文本 */
  text: string;
  /** 创建时间 */
  created_at: string;
  /** 分词列表 */
  tokens: SentenceToken[];
}

/**
 * 创建句子请求
 */
export interface CreateSentenceRequest {
  /** 句子文本 */
  text: string;
  /** 可选的分词列表，若不提供则自动分词 */
  tokens?: SentenceToken[];
}

/**
 * 分词请求
 */
export interface TokenizeRequest {
  /** 要分词的文本 */
  text: string;
}

/**
 * 分词响应
 */
export interface TokenizeResponse {
  /** 原文 */
  text: string;
  /** 分词结果 */
  tokens: SentenceToken[];
}

/**
 * 句子列表查询参数
 */
export interface SentenceListParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页条数，默认20 */
  pageSize?: number;
  /** 搜索关键词，支持模糊匹配句子文本 */
  search?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  data: T[];
  /** 分页信息 */
  pagination: {
    /** 当前页码 */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 总记录数 */
    total: number;
    /** 总页数 */
    totalPages: number;
  };
}

/**
 * 更新分词关联请求
 */
export interface UpdateTokenRequest {
  /** 要关联的单词ID，传null表示取消关联 */
  word_id: number | null;
}

/**
 * 更新分词关联响应（后端直接返回联表字段）
 */
export interface UpdateTokenResponse {
  /** 分词位置 */
  position: number;
  /** 原始分词文本 */
  token_text: string;
  /** 分词类型 */
  token_type: 'word' | 'punctuation';
  /** 关联的单词ID */
  word_id: number | null;
  /** 关联单词的基础字段（顶层返回） */
  word?: string;
  meaning?: string;
  phonetic?: string;
}

/**
 * 单词句子查询响应
 */
export interface WordSentencesResponse {
  /** 句子列表 */
  data: Array<{
    /** 句子ID */
    id: number;
    /** 句子文本 */
    text: string;
    /** 创建时间 */
    created_at: string;
    /** 分词列表 */
    tokens: SentenceToken[];
  }>;
}