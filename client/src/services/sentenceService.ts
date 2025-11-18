import apiClient from './apiClient';
import type {
  Sentence,
  CreateSentenceRequest,
  TokenizeRequest,
  TokenizeResponse,
  SentenceListParams,
  PaginatedResponse,
  UpdateTokenRequest,
  UpdateTokenResponse,
  WordSentencesResponse
} from '../types/sentence';

/**
 * 句子与分词相关API服务
 */
export const sentenceService = {
  /**
   * 对文本进行分词（不保存到数据库）
   */
  async tokenize(request: TokenizeRequest): Promise<TokenizeResponse> {
    const response = await apiClient.post('/sentences/tokenize', request);
    return response.data;
  },

  /**
   * 创建句子及其分词
   */
  async createSentence(request: CreateSentenceRequest): Promise<Sentence> {
    const response = await apiClient.post('/sentences', request);
    return response.data;
  },

  /**
   * 分页获取句子列表
   */
  async listSentences(params?: SentenceListParams): Promise<PaginatedResponse<Sentence>> {
    const response = await apiClient.get('/sentences', { params });
    type ApiShape = {
      success?: boolean;
      data?: {
        items?: Array<{ id: number; text: string; created_at: string }>;
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      };
      items?: Array<{ id: number; text: string; created_at: string }>;
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
      pagination?: { page?: number; pageSize?: number; total?: number; totalPages?: number };
    };

    const payload = response.data as ApiShape;
    const root = payload.success ? (payload.data ?? {}) : payload;

    const ensureArray = <T>(v: unknown): T[] => {
      if (Array.isArray(v)) return v as T[];
      if (v && typeof v === 'object') return [v as T];
      return [];
    };

    const rawItems = ensureArray<{ id: number; text: string; created_at: string }>(
      Array.isArray(root.items)
        ? root.items!
        : Array.isArray(payload.items)
          ? payload.items!
          : Array.isArray(payload.data?.items)
            ? payload.data!.items!
            : (payload.data as unknown)
    );

    const data: Sentence[] = rawItems.map(it => ({ id: it.id, text: it.text, created_at: it.created_at, tokens: [] }));

    const page = typeof (root as { page?: number }).page === 'number'
      ? (root as { page?: number }).page!
      : (payload.pagination?.page ?? params?.page ?? 1);
    const pageSize = typeof (root as { limit?: number }).limit === 'number'
      ? (root as { limit?: number }).limit!
      : (payload.pagination?.pageSize ?? params?.pageSize ?? 20);
    const total = typeof (root as { total?: number }).total === 'number'
      ? (root as { total?: number }).total!
      : (payload.pagination?.total ?? data.length);
    const totalPages = typeof (root as { totalPages?: number }).totalPages === 'number'
      ? (root as { totalPages?: number }).totalPages!
      : (payload.pagination?.totalPages ?? Math.ceil(total / pageSize));

    return { data, pagination: { page, pageSize, total, totalPages } };
  },

  /**
   * 获取句子详情
   */
  async getSentence(id: number): Promise<Sentence> {
    const response = await apiClient.get(`/sentences/${id}`);
    return response.data;
  },

  /**
   * 删除句子
   */
  async deleteSentence(id: number): Promise<void> {
    await apiClient.delete(`/sentences/${id}`);
  },

  /**
   * 更新分词关联的单词
   */
  async updateTokenWord(sentenceId: number, position: number, request: UpdateTokenRequest): Promise<UpdateTokenResponse> {
    const response = await apiClient.patch(`/sentences/${sentenceId}/tokens/${position}`, request);
    return response.data;
  },

  /**
   * 获取单词出现的句子列表
   */
  async getWordSentences(wordId: number): Promise<WordSentencesResponse> {
    const response = await apiClient.get(`/words/${wordId}/sentences`);
    return response.data;
  }
};