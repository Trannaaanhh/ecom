import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Star, TrendingUp, Shield, Truck, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';
import { ProductArt } from './product-art';
import { getAiBehaviorFromStorage, getAiRecommendations, getAiUserId } from '../../lib/ai-api';
import { addCartItem } from '../../lib/cart-store';

type Product = {
  id: number;
  name: string;
  price_text: string;
  old_price_text: string;
  rating: number;
  sold: number;
  badge?: string;
  image: string;
};

type AiFeaturedProduct = {
  id: string;
  name: string;
  price_text: string;
  old_price_text: string;
  badge?: string;
  score?: number;
  rating: number;
  sold: number;
};

type Category = {
  id: number;
  name: string;
  icon: string;
  count: number;
  slug: string;
};

export function Homepage() {
  const [isLoading, setIsLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<AiFeaturedProduct[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiMeta, setAiMeta] = useState<{ model: string; query: string; userId: string } | null>(null);

  const buyFeaturedProduct = (productId: string) => {
    const product = featuredProducts.find((item) => item.id === productId);
    if (!product) return;

    addCartItem({
      productId: Number(product.id),
      name: product.name,
      price: Number(String(product.price_text).replace(/[^0-9]/g, '')) || 0,
      image: '',
      category: '',
      badge: product.badge,
    });
  };

  const buyTrendingProduct = (product: Product) => {
    addCartItem({
      productId: product.id,
      name: product.name,
      price: Number(String(product.price_text).replace(/[^0-9]/g, '')) || 0,
      image: product.image,
      category: '',
      badge: product.badge,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const preferredCategory = localStorage.getItem('last_seen_category') ?? '';
        const userId = getAiUserId();
        const behavior = getAiBehaviorFromStorage();

        const [recommendRes, categoriesRes, trendingRes, fallbackFeaturedRes, catalogRes] = await Promise.all([
          getAiRecommendations({
            userId,
            query: preferredCategory || 'homepage',
            preferredCategory,
            behavior,
            limit: 8,
          }),
          fetch('/api/categories/'),
          fetch('/api/products/trending/'),
          fetch('/api/products/featured/'),
          fetch('/api/products/'),
        ]);

        const categoriesJson = await categoriesRes.json();
        const trendingJson = await trendingRes.json();
        const fallbackFeaturedJson = await fallbackFeaturedRes.json();
        const catalogJson = await catalogRes.json();
        const catalogIds = new Set(
          ((catalogJson.items ?? []) as Array<{ id: number | string }>).map((item) => String(item.id)),
        );

        const aiCandidates = recommendRes.items
          .filter((item) => catalogIds.has(String(item.product_id)))
          .map((item) => ({
              id: item.product_id,
              name: item.name,
              price_text: `${item.price.toLocaleString('vi-VN')}đ`,
              old_price_text: '',
              badge: item.score !== undefined ? `AI ${Math.round(item.score * 100)}%` : undefined,
              score: item.score,
              rating: item.score ? Number((4 + item.score).toFixed(1)) : 4.6,
              sold: item.score ? Math.max(20, Math.round(item.score * 1000)) : 120,
            }));

        const fallbackFeatured = (fallbackFeaturedJson.items ?? []).map((item: Product) => ({
              id: String(item.id),
              name: item.name,
              price_text: item.price_text,
              old_price_text: item.old_price_text,
              badge: item.badge,
              rating: item.rating,
              sold: item.sold,
            }));

        const aiFeatured = aiCandidates.length ? aiCandidates : fallbackFeatured;

        setFeaturedProducts(aiFeatured);
        setCategories(categoriesJson.items ?? []);
        setTrendingProducts(trendingJson.items ?? []);
        setAiMeta({
          model: recommendRes.model,
          query: recommendRes.query,
          userId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-br from-[#0A2540] via-[#0B3A57] to-[#00B4D8] text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_30%)]" />
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-white/15 text-white border-white/20 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Shopping
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              Mua sắm thông minh
              <span className="block text-white/85">by customer group</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 max-w-2xl mb-8">
              Giá B2B - Giá B2C - Giá hợp đồng. Trải nghiệm mua sắm cá nhân hóa với giao diện premium, sẵn sàng cho Vite.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="bg-white text-secondary hover:bg-white/90 shadow-lg" asChild>
                <Link to="/products">
                  Khám phá ngay
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link to="/admin">Dành cho doanh nghiệp</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center gap-2 text-white/90">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Bảo hành 12 tháng</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Truck className="w-5 h-5" />
                <span className="text-sm">Giao hàng nhanh</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm">Đổi trả miễn phí</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendations Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Gợi ý cho bạn hôm nay</h2>
            </div>
            <p className="text-muted-foreground">Được cá nhân hóa dựa trên hành vi mua sắm của bạn</p>
            {aiMeta && (
              <div className="mt-3 inline-flex flex-wrap gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                <span>Model: {aiMeta.model}</span>
                <span>Query: {aiMeta.query}</span>
                <span>User: {aiMeta.userId}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" asChild>
            <Link to="/products">
              Xem tất cả
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="overflow-hidden border">
                  <div className="aspect-square bg-muted">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-baseline gap-2">
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : featuredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden border hover:shadow-xl transition-all duration-300">
                    <div className="relative aspect-square overflow-hidden">
                      <Link to={`/product/${product.id}`}>
                        <ProductArt name={product.name} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
                      </Link>
                      {product.badge && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-white">
                          {product.badge}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <Link to={`/product/${product.id}`} className="block font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-sm text-muted-foreground">• {product.sold} đã bán</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-primary">{product.price_text}</span>
                        {product.old_price_text ? (
                          <span className="text-sm text-muted-foreground line-through">{product.old_price_text}</span>
                        ) : null}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button className="flex-1" onClick={() => buyFeaturedProduct(product.id)}>
                          Mua hàng
                        </Button>
                        <Button variant="outline" className="flex-1" asChild>
                          <Link to={`/product/${product.id}`}>Chi tiết</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Product Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-all hover:border-primary">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Skeleton className="h-7 w-7 rounded-full" />
                      </div>
                      <Skeleton className="h-5 w-20 mx-auto" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </CardContent>
                  </Card>
                ))
              : categories.map((category) => (
                  <Link key={category.id} to={`/products?category=${category.slug}`}>
                    <Card className="group hover:shadow-lg transition-all hover:border-primary">
                      <CardContent className="p-6 text-center space-y-2">
                        <div className="text-3xl">{category.icon}</div>
                        <h3 className="font-medium group-hover:text-primary transition-colors">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">{category.count} products</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold">Xu hướng mua sắm</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-xl transition-all">
                  <div className="flex gap-4 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Skeleton className="h-full w-full rounded-none" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-28" />
                    </div>
                  </div>
                </Card>
              ))
            : trendingProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all">
                    <div className="flex gap-4 p-4">
                      <Link to={`/product/${product.id}`}>
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                          <ProductArt name={product.name} className="h-full w-full" />
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link to={`/product/${product.id}`} className="font-medium mb-2 line-clamp-2 hover:text-primary transition-colors block">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-sm text-muted-foreground">• {product.sold} đã bán</span>
                        </div>
                        <span className="text-lg font-bold text-primary">{product.price_text}</span>
                        <div className="mt-4 flex gap-2">
                          <Button className="flex-1" onClick={() => buyTrendingProduct(product)}>
                            Mua hàng
                          </Button>
                          <Button variant="outline" className="flex-1" asChild>
                            <Link to={`/product/${product.id}`}>Chi tiết</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
              ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold">Ecomerge</span>
              </div>
              <p className="text-sm opacity-80">
                Nền tảng thương mại điện tử thông minh với AI
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Về chúng tôi</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/" className="hover:opacity-100">Giới thiệu</Link></li>
                <li><Link to="/" className="hover:opacity-100">Liên hệ</Link></li>
                <li><Link to="/admin" className="hover:opacity-100">Tuyển dụng</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/" className="hover:opacity-100">Chính sách đổi trả</Link></li>
                <li><Link to="/" className="hover:opacity-100">Bảo hành</Link></li>
                <li><Link to="/" className="hover:opacity-100">Hướng dẫn mua hàng</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Phương thức thanh toán</h4>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-2 bg-white rounded text-xs font-medium text-gray-700">Visa</div>
                <div className="px-3 py-2 bg-white rounded text-xs font-medium text-gray-700">Mastercard</div>
                <div className="px-3 py-2 bg-white rounded text-xs font-medium text-gray-700">Momo</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm opacity-80">
            © 2026 Ecomerge. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
