export type AiRecommendationItem = {
  product_id: string;
  name: string;
  price: number;
  category_id: string;
  category_name: string;
  description?: string;
  score?: number;
  signals?: string[];
  lstm_score?: number;
};

export type AiRecommendationResponse = {
  user_id: string;
  query: string;
  model: string;
  lstm_model_loaded?: boolean;
  recommendations: string[];
  items: AiRecommendationItem[];
};

export type AiChatResponse = {
  model: string;
  lstm_model_loaded?: boolean;
  reply: string;
  suggestions: AiRecommendationItem[];
};

export type AiRerankResponse = {
  model: string;
  reranked_ids: string[];
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    category_id: string;
    category_name: string;
    score: number;
  }>;
};

export type AiSimilarResponse = {
  product_id: string;
  model: string;
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    category_id: string;
    category_name: string;
  }>;
};

export type AiForecastResponse = {
  model: string;
  product_id: string;
  horizon: number;
  forecast: Array<{ day: number; predicted_units: number }>;
};

export type AiFraudResponse = {
  model: string;
  fraud_score: number;
  risk_level: 'low' | 'medium' | 'high';
  requires_manual_review: boolean;
  signals: {
    amount: number;
    risk_flags: string[];
    user_history_size: number;
  };
};

const jsonHeaders = { 'Content-Type': 'application/json' };

export function getAiUserId() {
  const storageKey = 'ecommerge_ai_user_id';
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const generated = `user-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(storageKey, generated);
  return generated;
}

export function getAiBehaviorFromStorage() {
  const viewed = JSON.parse(localStorage.getItem('viewed_product_ids') ?? '[]') as number[];
  const cart = JSON.parse(localStorage.getItem('cart_product_ids') ?? '[]') as number[];
  const searched = localStorage.getItem('last_search_query') ?? '';

  const behavior: Array<{ product_id: string; action: string }> = [];
  viewed.slice(0, 10).forEach((productId) => {
    behavior.push({ product_id: String(productId), action: 'view' });
  });
  cart.slice(0, 10).forEach((productId) => {
    behavior.push({ product_id: String(productId), action: 'add_to_cart' });
  });
  if (searched.trim()) {
    behavior.push({ product_id: 'search-query', action: 'search' });
  }

  return behavior;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getAiRecommendations(params: {
  userId?: string;
  query?: string;
  behavior?: Array<{ product_id: string; action: string }>;
  preferredCategory?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.userId) searchParams.set('user_id', params.userId);
  if (params.query) searchParams.set('query', params.query);
  if (params.preferredCategory) searchParams.set('preferred_category', params.preferredCategory);
  if (params.limit) searchParams.set('limit', String(params.limit));

  return requestJson<AiRecommendationResponse>(`/api/ai/recommend/?${searchParams.toString()}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      user_id: params.userId,
      query: params.query ?? '',
      behavior: params.behavior ?? [],
      preferred_category: params.preferredCategory ?? '',
      limit: params.limit ?? 10,
    }),
  });
}

export async function getAiChatbotReply(params: {
  userId?: string;
  message: string;
  behavior?: Array<{ product_id: string; action: string }>;
}) {
  return requestJson<AiChatResponse>('/api/ai/chatbot/', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      user_id: params.userId,
      message: params.message,
      behavior: params.behavior ?? [],
    }),
  });
}

export async function rerankSearch(params: {
  userId?: string;
  query: string;
  preferredCategory?: string;
  resultIds: Array<string | number>;
  limit?: number;
}) {
  return requestJson<AiRerankResponse>('/api/ai/search/rerank/', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      user_id: params.userId,
      query: params.query,
      preferred_category: params.preferredCategory ?? '',
      result_ids: params.resultIds,
      limit: params.limit ?? 20,
    }),
  });
}

export async function getSimilarProducts(productId: string, limit = 6) {
  return requestJson<AiSimilarResponse>('/api/ai/recommend/similar/', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ product_id: productId, limit }),
  });
}

export async function getAiForecast(productId: string, horizon = 7) {
  return requestJson<AiForecastResponse>(`/api/ai/forecast/${productId}/?horizon=${horizon}`);
}

export async function getAiFraudScore(params: { amount: number; userId?: string; riskFlags?: string[] }) {
  return requestJson<AiFraudResponse>('/api/ai/fraud/score/', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      amount: params.amount,
      user_id: params.userId,
      risk_flags: params.riskFlags ?? [],
    }),
  });
}