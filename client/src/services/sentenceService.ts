import apiClient from './apiClient';
import type {
  Sentence,
  SentenceToken,
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
    return response.data;
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