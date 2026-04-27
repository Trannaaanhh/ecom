import {
  BookOpen,
  Boxes,
  Factory,
  Home,
  Laptop,
  Package,
  Shirt,
  Smartphone,
  Coffee,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

type ProductArtProps = {
  name: string;
  category?: string;
  className?: string;
};

type ArtConfig = {
  icon: LucideIcon;
  label: string;
  gradient: string;
};

const ART_MAP: Record<string, ArtConfig> = {
  phone: { icon: Smartphone, label: 'Thiết bị di động', gradient: 'from-cyan-500 via-sky-500 to-blue-600' },
  laptop: { icon: Laptop, label: 'Máy tính xách tay', gradient: 'from-slate-700 via-slate-900 to-zinc-950' },
  'men-fashion': { icon: Shirt, label: 'Thời trang nam', gradient: 'from-amber-500 via-orange-500 to-rose-500' },
  'women-fashion': { icon: Shirt, label: 'Thời trang nữ', gradient: 'from-fuchsia-500 via-pink-500 to-rose-500' },
  home: { icon: Home, label: 'Gia dụng', gradient: 'from-emerald-500 via-teal-500 to-cyan-600' },
  'building-materials': { icon: Boxes, label: 'Vật liệu xây dựng', gradient: 'from-stone-600 via-neutral-700 to-zinc-900' },
  industrial: { icon: Factory, label: 'Công nghiệp', gradient: 'from-zinc-700 via-neutral-800 to-stone-950' },
  books: { icon: BookOpen, label: 'Sách & văn phòng phẩm', gradient: 'from-violet-500 via-purple-500 to-indigo-600' },
  food: { icon: Coffee, label: 'Thực phẩm & đồ uống', gradient: 'from-amber-600 via-orange-600 to-rose-600' },
  pharma: { icon: ShieldCheck, label: 'Sức khỏe', gradient: 'from-emerald-600 via-cyan-600 to-blue-700' },
};

const KEYWORD_MAP: Array<{ keywords: string[]; config: ArtConfig }> = [
  { keywords: ['iphone', 'samsung', 'pixel', 'xiaomi', 'oppo', 'phone', 'điện thoại'], config: ART_MAP.phone },
  { keywords: ['macbook', 'dell', 'laptop', 'xps', 'thinkpad', 'surface'], config: ART_MAP.laptop },
  { keywords: ['áo', 'ao ', 'quần', 'quan ', 'váy', 'vay ', 'blazer', 'polo', 'jean', 'fashion'], config: ART_MAP['men-fashion'] },
  { keywords: ['nồi', 'may giat', 'máy giặt', 'tu lanh', 'tủ lạnh', 'gia dụng', 'home'], config: ART_MAP.home },
  { keywords: ['vat lieu', 'vật liệu', 'son', 'sơn', 'gach', 'gạch', 'building'], config: ART_MAP['building-materials'] },
  { keywords: ['công nghiệp', 'industrial', 'máy bơm', 'may bom', 'động cơ', 'dong co', 'khoan'], config: ART_MAP.industrial },
  { keywords: ['sách', 'sach', 'book', 'bút', 'but'], config: ART_MAP.books },
  { keywords: ['cà phê', 'ca phe', 'coffee', 'trà', 'tra', 'thực phẩm', 'thuc pham', 'vitamin', 'khẩu trang', 'khau trang'], config: ART_MAP.food },
  { keywords: ['dược', 'duoc', 'sức khỏe', 'suc khoe', 'pharma'], config: ART_MAP.pharma },
];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function pickArt(name: string, category?: string): ArtConfig {
  const normalizedCategory = normalize(category ?? '');
  if (normalizedCategory && ART_MAP[normalizedCategory]) {
    return ART_MAP[normalizedCategory];
  }

  const normalizedName = normalize(name);
  const matched = KEYWORD_MAP.find(({ keywords }) => keywords.some((keyword) => normalizedName.includes(normalize(keyword))));
  return matched?.config ?? { icon: Package, label: 'Demo Product', gradient: 'from-slate-700 via-slate-800 to-slate-950' };
}

export function ProductArt({ name, category, className = '' }: ProductArtProps) {
  const art = pickArt(name, category);
  const Icon = art.icon;

  return (
    <div className={`relative overflow-hidden bg-linear-to-br ${art.gradient} ${className}`}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_30%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-16 w-16 text-white/95 md:h-20 md:w-20" />
      </div>
    </div>
  );
}