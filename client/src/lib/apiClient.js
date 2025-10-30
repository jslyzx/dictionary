class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const defaultBaseUrl = '/api';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultBaseUrl;

const buildUrl = (path) => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const request = async (path, { method = 'GET', body, headers, ...rest } = {}) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    },
    ...rest
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), config);
  let payload;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.message || 'An unexpected error occurred.';
    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

export const apiClient = {
  async listDictionaries() {
    const response = await request('/dictionaries');
    return response.data || [];
  },
  async getDictionary(id) {
    const response = await request(`/dictionaries/${id}`);
    return response.data;
  },
  async createDictionary(dto) {
    const response = await request('/dictionaries', {
      method: 'POST',
      body: dto
    });
    return response.data;
  },
  async updateDictionary(id, dto) {
    const response = await request(`/dictionaries/${id}`, {
      method: 'PUT',
      body: dto
    });
    return response.data;
  },
  async deleteDictionary(id) {
    await request(`/dictionaries/${id}`, {
      method: 'DELETE'
    });
  }
};

export { ApiError };
