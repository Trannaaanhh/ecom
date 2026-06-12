import { Search, ShoppingCart, Menu, Sparkles, Moon, Sun, LogOut, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getCartCount } from '../../lib/cart-store';
import {
  clearCustomerCheckoutProfile,
  clearCustomerSession,
  getCustomerSession,
  type CustomerSession,
} from '../../lib/customer-session';

export function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const syncCustomerState = () => {
      setCustomerSession(getCustomerSession());
    };

    syncCustomerState();
    window.addEventListener('storage', syncCustomerState);
    window.addEventListener('focus', syncCustomerState);
    return () => {
      window.removeEventListener('storage', syncCustomerState);
      window.removeEventListener('focus', syncCustomerState);
    };
  }, []);

  useEffect(() => {
    const syncCartCount = () => setCartCount(getCartCount());
    syncCartCount();
    window.addEventListener('ecommerge-cart-updated', syncCartCount);
    window.addEventListener('storage', syncCartCount);
    return () => {
      window.removeEventListener('ecommerge-cart-updated', syncCartCount);
      window.removeEventListener('storage', syncCartCount);
    };
  }, []);

  const submitSearch = () => {
    const query = search.trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
  };

  const onLogout = () => {
    clearCustomerSession();
    clearCustomerCheckoutProfile();
    setCustomerSession(null);
    navigate('/');
  };

  const customerDisplayName = customerSession?.user.name?.trim() || 'Dang nhap';
  const customerShortName = customerSession ? customerDisplayName.split(/\s+/).slice(-1)[0] : 'Guest';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/home" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-white">E</span>
              </div>
              <span className="text-xl font-bold text-foreground">Ecomerge</span>
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link to="/ai" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Gợi ý
              </Link>
              <Link to="/products" className="text-sm font-medium transition-colors hover:text-primary">
                Categories
              </Link>
              <Link to="/products" className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
                <Sparkles className="h-4 w-4" />
                Flash Sale
              </Link>
              <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary">
                B2B
              </Link>
            </nav>
          </div>

          <div className="mx-8 hidden max-w-xl flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products, categories..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitSearch();
                  }
                }}
              />
            </div>
            <Button type="button" onClick={submitSearch}>
              Tim
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="hidden h-10 items-center gap-3 rounded-full border-border/80 bg-muted/20 pl-4 pr-3 md:inline-flex"
              aria-label="Thong tin customer"
              onClick={() => navigate('/account')}
            >
              <span className="flex flex-col items-start leading-none">
                <span className="max-w-28 truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Customer
                </span>
                <span className="max-w-32 truncate text-sm font-semibold">{customerShortName}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden md:flex"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {customerSession && (
              <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={onLogout}>
                <LogOut className="mr-1 h-4 w-4" />
                Dang xuat
              </Button>
            )}

            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link to="/cart" aria-label="Gio hang">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tim kiem san pham..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitSearch();
                }
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/home">Trang chu</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/ai">Gợi ý</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
                <Link to="/products">Categories</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/account')}>
              Tai khoan
            </Button>
            {customerSession && (
              <Button variant="destructive" size="sm" onClick={onLogout}>
                <LogOut className="mr-1 h-4 w-4" />
                Dang xuat
              </Button>
            )}
          </div>

          {customerSession && (
            <div className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
              <p className="font-semibold">{customerSession.user.name}</p>
              <p className="text-muted-foreground">{customerSession.user.email}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
