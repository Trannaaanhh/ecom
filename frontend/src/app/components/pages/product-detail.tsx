import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { ProductArt } from './product-art';
import { getSimilarProducts } from '../../lib/ai-api';

type ProductDetailResponse = {
  id: number;
  name: string;
  price_text: string;
  old_price_text: string;
  rating: number;
  sold: number;
  badge?: string;
  image: string;
  category: string;
  description: string;
  specs: Record<string, string>;
};

type SimilarProduct = {
  product_id: string;
  name: string;
  price: number;
  category_name: string;
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

export function ProductDetail() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const response = await fetch(`/api/products/${id}/`);
      if (response.ok) {
        const data = await response.json();
        const viewed = JSON.parse(localStorage.getItem('viewed_product_ids') ?? '[]') as number[];
        const mergedViewed = [data.id, ...viewed.filter((value) => value !== data.id)].slice(0, 20);

        localStorage.setItem('viewed_product_ids', JSON.stringify(mergedViewed));
        localStorage.setItem('last_seen_category', data.category ?? '');
        localStorage.setItem('ai_event_count', String(Number(localStorage.getItem('ai_event_count') ?? '0') + 1));
        setProduct(data);

        setIsLoadingSimilar(true);
        try {
          const aiResponse = await getSimilarProducts(String(data.id), 6);
          setSimilarProducts(aiResponse.items ?? []);
        } catch {
          setSimilarProducts([]);
        } finally {
          setIsLoadingSimilar(false);
        }
      }
      setIsLoading(false);
    };

    if (id) {
      void load();
    }
  }, [id]);

  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Chi tiết sản phẩm</h1>
      {isLoading && <p className="text-muted-foreground">Đang tải chi tiết sản phẩm...</p>}

      {!isLoading && !product && <p className="text-destructive">Không tìm thấy sản phẩm.</p>}

      {!isLoading && product && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl overflow-hidden border border-border min-h-88">
            <ProductArt name={product.name} className="h-full min-h-88 w-full" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-2xl font-semibold">{product.name}</h2>
              {product.badge && <Badge>{product.badge}</Badge>}
            </div>
            <p className="text-muted-foreground mb-2">{product.rating} ★ • {product.sold} đã bán</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold text-primary">{product.price_text}</span>
              <span className="text-sm line-through text-muted-foreground">{product.old_price_text}</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">{product.description}</p>
            <div className="rounded-lg border border-border p-4 space-y-2">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Sản phẩm tương tự từ AI</h3>
                <span className="text-xs text-muted-foreground">Dựa trên mô hình tương đồng sản phẩm</span>
              </div>

              {isLoadingSimilar ? (
                <p className="mt-3 text-sm text-muted-foreground">Đang tải gợi ý tương tự...</p>
              ) : similarProducts.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {similarProducts.map((item) => (
                    <div key={item.product_id} className="rounded-lg border border-border p-3">
                      <p className="font-medium line-clamp-2">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.category_name}</p>
                      <p className="mt-2 text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Chưa có gợi ý tương tự cho sản phẩm này.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
