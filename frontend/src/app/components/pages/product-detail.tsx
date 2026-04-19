import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { ProductArt } from './product-art';

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

export function ProductDetail() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetailResponse | null>(null);

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
          </div>
        </section>
      )}
    </main>
  );
}
