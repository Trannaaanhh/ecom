import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { BookOpen, Boxes, Factory, Home, Laptop, Package, Shirt, Smartphone, Coffee, ShieldCheck } from 'lucide-react';

type ThumbnailIcon = typeof Package;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getThumbnailIcon(name: string, category?: string): ThumbnailIcon {
  const normalizedCategory = normalize(category ?? '');
  const normalizedName = normalize(name);

  if (normalizedCategory === 'phone' || /iphone|samsung|pixel|xiaomi|oppo|đien thoai|dien thoai/.test(normalizedName)) {
    return Smartphone;
  }

  if (normalizedCategory === 'laptop' || /macbook|dell|laptop|xps|thinkpad|surface/.test(normalizedName)) {
    return Laptop;
  }

  if (normalizedCategory === 'men-fashion' || normalizedCategory === 'women-fashion' || /ao|quan|váy|vay|blazer|polo|jean/.test(normalizedName)) {
    return Shirt;
  }

  if (normalizedCategory === 'home' || /noi|máy giat|may giat|tu lanh|tủ lạnh|gia dụng/.test(normalizedName)) {
    return Home;
  }

  if (normalizedCategory === 'building-materials' || /vat lieu|vật liệu|son|sơn|gach|gạch|building/.test(normalizedName)) {
    return Boxes;
  }

  if (normalizedCategory === 'industrial' || /công nghiệp|cong nghiep|may bom|máy bơm|dong co|động cơ|khoan/.test(normalizedName)) {
    return Factory;
  }

  if (/sach|sách|book|bút|but/.test(normalizedName)) {
    return BookOpen;
  }

  if (/ca phe|cà phê|coffee|tra|trà|vitamin|khau trang|khẩu trang/.test(normalizedName)) {
    return Coffee;
  }

  if (/duoc|dược|suc khoe|sức khỏe|pharma/.test(normalizedName)) {
    return ShieldCheck;
  }

  return Package;
}

function ProductThumbnail({ name, category, className = '' }: { name: string; category?: string; className?: string }) {
  const Icon = getThumbnailIcon(name, category);

  return (
    <div className={`relative overflow-hidden bg-linear-to-br from-slate-700 via-slate-800 to-slate-950 ${className}`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_30%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-14 w-14 text-white/95" />
      </div>
    </div>
  );
}

type Product = {
  id: number;
  name: string;
  price_text: string;
  old_price_text: string;
  rating: number;
  sold: number;
  badge?: string;
  image: string;
  category: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

export function ProductListing() {
  const location = useLocation();
  const navigate = useNavigate();
  const category = new URLSearchParams(location.search).get('category');
  const q = new URLSearchParams(location.search).get('q') ?? '';
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState(q);

  useEffect(() => {
    setKeyword(q);
  }, [q]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (q) params.set('q', q);

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/products/${params.toString() ? `?${params.toString()}` : ''}`),
        fetch('/api/categories/'),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setItems(productsData.items ?? []);
      setCategories(categoriesData.items ?? []);
      setIsLoading(false);
    };

    void load();
  }, [category, q]);

  const applySearch = () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (keyword.trim()) params.set('q', keyword.trim());
    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const pickCategory = (slug: string | null) => {
    const params = new URLSearchParams();
    if (slug) params.set('category', slug);
    if (keyword.trim()) params.set('q', keyword.trim());
    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Danh sách sản phẩm</h1>
      <p className="text-muted-foreground mb-8">
        {category ? `Đang lọc theo danh mục: ${category}` : 'Tất cả sản phẩm'}
      </p>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant={!category ? 'default' : 'outline'} size="sm" onClick={() => pickCategory(null)}>
            Tất cả
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={category === cat.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() => pickCategory(cat.slug)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Tìm theo tên sản phẩm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applySearch();
              }
            }}
          />
          <Button onClick={applySearch}>Tìm kiếm</Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải dữ liệu từ Catalog Service...</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">Tìm thấy {items.length} sản phẩm.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-square">
                    <ProductThumbnail name={item.name} category={item.category} className="h-full w-full" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h3 className="font-medium line-clamp-1">{item.name}</h3>
                      {item.badge && <Badge>{item.badge}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Danh mục: {item.category}</div>
                    <div className="text-sm text-muted-foreground mb-2">{item.rating} ★ • {item.sold} đã bán</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-primary">{item.price_text}</span>
                      <span className="text-xs line-through text-muted-foreground">{item.old_price_text}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
