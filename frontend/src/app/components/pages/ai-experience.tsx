import { FormEvent, useState, useEffect } from 'react';
import { Sparkles, Bot, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import {
  AiChatResponse,
  AiRecommendationResponse,
  getAiBehaviorFromStorage,
  getAiChatbotReply,
  getAiRecommendations,
  getAiUserId,
} from '../../lib/ai-api';

export function AiExperience() {
  const [query, setQuery] = useState('san pham hot');
  const [recommendations, setRecommendations] = useState<AiRecommendationResponse | null>(null);
  const [loadingRecommend, setLoadingRecommend] = useState(false);

  const [message, setMessage] = useState('Goi y giup toi mot vai san pham cho gia dinh');
  const [chatResult, setChatResult] = useState<AiChatResponse | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);

  const runRecommendation = async (event?: FormEvent) => {
    event?.preventDefault();
    setLoadingRecommend(true);
    try {
      const userId = getAiUserId();
      let result = await getAiRecommendations({
        userId,
        query,
        behavior: getAiBehaviorFromStorage(),
        limit: 8,
      });

      // Try to fetch catalog to filter out missing items. If the catalog call fails,
      // fall back to returning AI results without filtering so frontend still shows suggestions.
      let filteredItems = result.items;
      try {
        const catalogResponse = await fetch('/api/products/');
        if (catalogResponse.ok) {
          const catalogPayload = await catalogResponse.json();
          const catalogIds = new Set(
            ((catalogPayload.items ?? []) as Array<{ id: number | string }>).map((item) => String(item.id)),
          );
          filteredItems = result.items.filter((item) => catalogIds.has(String(item.product_id)));
        } else {
          console.warn('Catalog fetch failed, using AI results without filtering', catalogResponse.status);
        }
      } catch (err) {
        console.warn('Catalog fetch error, using AI results without filtering', err);
      }

      setRecommendations({
        ...result,
        items: filteredItems,
      });
    } finally {
      setLoadingRecommend(false);
    }
  };

  // Auto-run recommendations while typing (debounced)
  useEffect(() => {
    const q = (query || '').trim();
    if (q.length < 3) return; // require minimal length
    const timer = setTimeout(() => {
      // fire without a FormEvent
      void runRecommendation();
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  const runChat = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!message.trim()) {
      return;
    }

    setLoadingChat(true);
    try {
      const userId = getAiUserId();
      const result = await getAiChatbotReply({
        userId,
        message,
        behavior: getAiBehaviorFromStorage(),
      });
      setChatResult(result);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-10 space-y-6">
      <section className="rounded-2xl border border-border bg-linear-to-br from-[#0A2540] via-[#123B58] to-[#1A7EA0] text-white p-6 md:p-8">
        <Badge className="mb-4 bg-white/15 text-white border-white/20">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Frontend Zone
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold">Khu trai nghiem AI rieng</h1>
        <p className="mt-3 text-white/85 max-w-3xl">
          Day la khu frontend rieng cho AI, ban co the thu goi y san pham va chatbot ngay tren mot man hinh.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={runRecommendation}>
              <Input
                value={query}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuery(v);
                  try {
                    localStorage.setItem('last_search_query', v);
                  } catch (err) {
                    // ignore
                  }
                }}
                placeholder="Nhap nhu cau, vi du: laptop gaming, do gia dung..."
              />
              <Button type="submit" disabled={loadingRecommend}>
                {loadingRecommend ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Lay goi y
              </Button>
            </form>

            <div className="mt-4 space-y-2">
              {recommendations?.items?.length ? (
                recommendations.items.map((item) => (
                  <div key={item.product_id} className="rounded-lg border border-border p-3">
                    <div className="font-semibold text-foreground">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.category_name} - {item.price.toLocaleString('vi-VN')}d
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Chua co goi y. Hay nhap truy van va bam Lay goi y.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI Chatbot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={runChat}>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dat cau hoi cho AI..."
              />
              <Button type="submit" disabled={loadingChat}>
                {loadingChat ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Gui cau hoi
              </Button>
            </form>

            <div className="mt-4 rounded-lg border border-border p-3 min-h-32">
              {chatResult?.reply ? (
                <p className="text-sm leading-relaxed text-foreground">{chatResult.reply}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Chua co phan hoi. Hay gui cau hoi de AI tra loi.</p>
              )}
            </div>

            {!!chatResult?.suggestions?.length && (
              <div className="mt-3 space-y-2">
                {chatResult.suggestions.map((item) => (
                  <div key={item.product_id} className="rounded-lg bg-muted/50 p-2 text-sm">
                    {item.name} - {item.price.toLocaleString('vi-VN')}d
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}