export type CartItem = {
  productId: number;
  name: string;
  price: number;
  image: string;
  category: string;
  qty: number;
  badge?: string;
};

const CART_STORAGE_KEY = 'ecommerge_cart_items';
const CART_PRODUCT_IDS_KEY = 'cart_product_ids';

function readCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed)
      ? parsed
          .filter((item) => item && typeof item.productId === 'number')
          .map((item) => ({
            productId: item.productId,
            name: item.name ?? '',
            price: Number(item.price ?? 0),
            image: item.image ?? '',
            category: item.category ?? '',
            qty: Number(item.qty ?? 1),
            badge: item.badge,
          }))
      : [];
  } catch {
    return [];
  }
}

function syncCartProductIds(items: CartItem[]) {
  const productIds = items.flatMap((item) => Array.from({ length: item.qty }, () => item.productId));
  localStorage.setItem(CART_PRODUCT_IDS_KEY, JSON.stringify(productIds));
}

function persistCartItems(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  syncCartProductIds(items);
  window.dispatchEvent(new Event('ecommerge-cart-updated'));
}

export function getCartItems() {
  return readCartItems();
}

export function getCartCount() {
  return readCartItems().reduce((total, item) => total + item.qty, 0);
}

export function getCartItemCount() {
  return readCartItems().length;
}

export function addCartItem(item: Omit<CartItem, 'qty'>, qty = 1) {
  const items = readCartItems();
  const existing = items.find((current) => current.productId === item.productId);

  if (existing) {
    existing.qty += qty;
  } else {
    items.unshift({ ...item, qty });
  }

  persistCartItems(items);
  return items;
}

export function setCartItemQty(productId: number, qty: number) {
  const items = readCartItems()
    .map((item) => (item.productId === productId ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);

  persistCartItems(items);
  return items;
}

export function removeCartItem(productId: number) {
  const items = readCartItems().filter((item) => item.productId !== productId);
  persistCartItems(items);
  return items;
}

export function clearCart() {
  persistCartItems([]);
}

export function getCartSummary() {
  const items = readCartItems();
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
  return {
    subtotal,
    discount: 0,
    shipping: subtotal > 0 ? 25000 : 0,
    total: subtotal > 0 ? subtotal + 25000 : 0,
  };
}
