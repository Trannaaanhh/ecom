import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getCustomerCheckoutProfile, getCustomerSession, setCustomerCheckoutProfile } from '../../lib/customer-session';
import { addCartItem, getCartItems, getCartSummary, type CartItem as LocalCartItem } from '../../lib/cart-store';
import { useLocation } from 'react-router-dom';

type CheckoutResponse = {
  payment_id: string;
  message: string;
};

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  price: number;
  qty: number;
  image: string;
};

type CartResponse = {
  service: string;
  domain: string;
  warning: string;
  items: CartItem[];
  summary: {
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
  };
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

export function ShoppingCart() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CartResponse | null>(null);
  const [localItems, setLocalItems] = useState<LocalCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const currentSummary = localItems.length > 0 ? getCartSummary() : data?.summary ?? null;

  useEffect(() => {
    const syncLocalCart = () => {
      setLocalItems(getCartItems());
    };

    syncLocalCart();
    window.addEventListener('ecommerge-cart-updated', syncLocalCart);
    window.addEventListener('storage', syncLocalCart);

    return () => {
      window.removeEventListener('ecommerge-cart-updated', syncLocalCart);
      window.removeEventListener('storage', syncLocalCart);
    };
  }, []);

  useEffect(() => {
    const fetchCartStub = async () => {
      try {
        if (localItems.length > 0) {
          return;
        }

        const response = await fetch('/api/cart/');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload: CartResponse = await response.json();
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCartStub();
  }, [localItems.length]);

  useEffect(() => {
    const session = getCustomerSession();
    const profile = getCustomerCheckoutProfile();

    if (session) {
      setCustomerName((current) => current || session.user.name);
      setCustomerEmail((current) => current || session.user.email);
    }

    if (profile) {
      setCustomerName((current) => current || profile.name);
      setCustomerPhone((current) => current || profile.phone);
      setCustomerEmail((current) => current || profile.email);
      setCustomerAddress((current) => current || profile.address);
      setCustomerNote((current) => current || profile.note);
    }
  }, []);

  useEffect(() => {
    const buyId = new URLSearchParams(location.search).get('buy');
    if (!buyId || localItems.length > 0) return;

    const addBuyProductToCart = async () => {
      try {
        const response = await fetch(`/api/products/${buyId}/`);
        if (!response.ok) return;
        const product = (await response.json()) as {
          id: number;
          name: string;
          price_text: string;
          image: string;
          category: string;
          badge?: string;
        };
        addCartItem({
          productId: product.id,
          name: product.name,
          price: Number(String(product.price_text).replace(/[^0-9]/g, '')) || 0,
          image: product.image,
          category: product.category,
          badge: product.badge,
        });
      } catch {
        // Ignore and let the fallback backend cart render if needed.
      }
    };

    void addBuyProductToCart();
  }, [location.search, localItems.length]);

  const onCheckout = async () => {
    if (!currentSummary) return;

    setIsCheckingOut(true);
    setCheckoutStatus('');

    try {
      const response = await fetch('/api/payments/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentSummary.total,
          customer: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: customerAddress,
            note: customerNote,
          },
        }),
      });

      const payload = (await response.json()) as CheckoutResponse | { detail: string };
      if (!response.ok) {
        throw new Error('detail' in payload ? payload.detail : 'Thanh toán thất bại');
      }

      if (!('payment_id' in payload) || !('message' in payload)) {
        throw new Error('Phản hồi thanh toán không hợp lệ.');
      }

      setCustomerCheckoutProfile({
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        note: customerNote,
      });

      setCheckoutStatus(`${payload.message} - Mã thanh toán: ${payload.payment_id}`);
    } catch (err) {
      setCheckoutStatus(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Giỏ hàng</h1>
      <p className="text-muted-foreground mb-6">Dữ liệu đang lấy từ Cart Service qua API Gateway.</p>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold mb-3">Kết nối backend (Cart Service)</h2>

        {isLoading && <p className="text-sm text-muted-foreground">Đang gọi /api/cart/ ...</p>}

        {!isLoading && error && (
          <p className="text-sm text-destructive">
            Không kết nối được backend: {error}. Hãy chạy backend bằng docker compose.
          </p>
        )}

        {!isLoading && (localItems.length > 0 || data) && (
          <div className="space-y-4 text-sm">
            {localItems.length > 0 ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                Product just added has been saved to local cart.
              </p>
            ) : (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {data?.warning}
              </p>
            )}

            <div className="space-y-3">
              {(localItems.length > 0
                ? localItems.map((item) => ({
                    id: item.productId,
                    product_id: item.productId,
                    name: item.name,
                    price: item.price,
                    qty: item.qty,
                    image: item.image,
                  }))
                : data?.items ?? []
              ).map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">SL: {item.qty}</p>
                  </div>
                  <p className="font-semibold text-primary">{formatCurrency(item.price * item.qty)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <div className="flex justify-between"><span>Tạm tính</span><span>{formatCurrency(currentSummary?.subtotal ?? 0)}</span></div>
              <div className="flex justify-between"><span>Giảm giá</span><span>-{formatCurrency(currentSummary?.discount ?? 0)}</span></div>
              <div className="flex justify-between"><span>Phí ship</span><span>{formatCurrency(currentSummary?.shipping ?? 0)}</span></div>
              <div className="mt-2 border-t border-border pt-2 flex justify-between font-semibold text-base">
                <span>Tổng cộng</span><span className="text-primary">{formatCurrency(currentSummary?.total ?? 0)}</span>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <h3 className="text-base font-semibold">Thông tin customer thanh toán</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Họ tên</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Số điện thoại</label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0901234567" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Email</label>
                  <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@example.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Địa chỉ nhận hàng</label>
                  <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="123 Lý Thường Kiệt, Q10" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Ghi chú</label>
                <Input value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="Giao giờ hành chính" />
              </div>

              <Button onClick={onCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? 'Đang xử lý...' : 'Thanh toán ngay'}
              </Button>

              {checkoutStatus && <p className="text-sm text-primary">{checkoutStatus}</p>}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
