import { useEffect, useState } from 'react';
import { BarChart3, BellRing, Boxes, ClipboardList, LogOut, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { getAiForecast, getAiFraudScore, getAiRecommendations, getAiUserId } from '../../lib/ai-api';

type OrderRecord = {
  id: string;
  order_number: string;
  customer: string;
  amount: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type AdminSummary = {
  kpis: {
    today_revenue: number;
    new_orders: number;
    total_orders: number;
    low_stock_count: number;
  };
  recent_orders: OrderRecord[];
};

type AiForecast = {
  model: string;
  product_id: string;
  horizon: number;
  forecast: Array<{ day: number; predicted_units: number }>;
};

type AiFraud = {
  model: string;
  fraud_score: number;
  risk_level: 'low' | 'medium' | 'high';
  requires_manual_review: boolean;
};

type AiRecommend = {
  model: string;
  query: string;
  recommendations: string[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  CONFIRMED: 'text-blue-600 bg-blue-50 border-blue-200',
  SHIPPED: 'text-purple-600 bg-purple-50 border-purple-200',
  DELIVERED: 'text-green-600 bg-green-50 border-green-200',
  CANCELLED: 'text-red-600 bg-red-50 border-red-200',
};

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? Number(value) : value;
  return `${num.toLocaleString('vi-VN')}đ`;
};

const orderApi = {
  async list(): Promise<OrderRecord[]> {
    const res = await fetch('/api/orders/');
    const data = await res.json();
    return data;
  },
  async create(data: { customer: string; amount: string; status: string; notes?: string }): Promise<OrderRecord> {
    const res = await fetch('/api/orders/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },
  async update(id: string, data: Partial<{ customer: string; amount: string; status: string; notes: string }>): Promise<OrderRecord> {
    const res = await fetch(`/api/orders/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },
  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/orders/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete order');
  },
};

function OrderFormModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { customer: string; amount: string; status: string; notes: string }) => void;
  initial?: OrderRecord | null;
}) {
  const [customer, setCustomer] = useState(initial?.customer ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'PENDING');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomer(initial?.customer ?? '');
      setAmount(initial?.amount ?? '');
      setStatus(initial?.status ?? 'PENDING');
      setNotes(initial?.notes ?? '');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !amount.trim()) return;
    setSaving(true);
    try {
      await onSave({ customer: customer.trim(), amount: amount.trim(), status, notes: notes.trim() });
      onClose();
    } catch { /* error handled by caller */ }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">{initial ? 'Sửa đơn hàng' : 'Thêm đơn hàng'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Khách hàng</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" value={customer} onChange={e => setCustomer(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Số tiền</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
            <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" value={status} onChange={e => setStatus(e.target.value)}>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú</label>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  orderLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderLabel: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Xóa đơn hàng</h2>
        <p className="text-sm text-slate-600">Bạn có chắc muốn xóa đơn hàng <strong>{orderLabel}</strong>?</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" onClick={onConfirm}>Xóa</Button>
        </div>
      </div>
    </div>
  );
}

export function StaffDashboard() {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [aiForecast, setAiForecast] = useState<AiForecast | null>(null);
  const [aiFraud, setAiFraud] = useState<AiFraud | null>(null);
  const [aiRecommend, setAiRecommend] = useState<AiRecommend | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<OrderRecord | null>(null);

  const loadData = async () => {
    const [summaryResponse, orderList] = await Promise.all([
      fetch('/api/orders/admin-summary/'),
      orderApi.list(),
    ]);
    const summary: AdminSummary = await summaryResponse.json();
    setData(summary);
    setOrders(orderList);
  };

  const loadAi = async () => {
    const [forecastPayload, fraudPayload, recommendPayload] = await Promise.all([
      getAiForecast('1', 7),
      getAiFraudScore({ amount: 46000000, riskFlags: ['new_device', 'ip_velocity'], userId: getAiUserId() }),
      getAiRecommendations({
        userId: getAiUserId(),
        query: 'staff-monitor-session',
        preferredCategory: 'phone',
        behavior: [
          { product_id: '1', action: 'view' },
          { product_id: '3', action: 'view' },
        ],
        limit: 5,
      }),
    ]);
    setAiForecast(forecastPayload);
    setAiFraud(fraudPayload);
    setAiRecommend(recommendPayload);
  };

  useEffect(() => {
    void loadData();
    void loadAi();
  }, []);

  const handleCreate = async (formData: { customer: string; amount: string; status: string; notes: string }) => {
    try {
      const created = await orderApi.create(formData);
      setOrders(prev => [created, ...prev]);
      setNotifCount(c => c + 1);
      toast.success(`Đã thêm đơn hàng ${created.order_number}`);
      void loadData();
    } catch {
      toast.error('Thêm đơn hàng thất bại');
    }
  };

  const handleUpdate = async (formData: { customer: string; amount: string; status: string; notes: string }) => {
    if (!editingOrder) return;
    try {
      const updated = await orderApi.update(editingOrder.id, formData);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      setNotifCount(c => c + 1);
      toast.success(`Đã cập nhật ${updated.order_number}`);
      setEditingOrder(null);
      void loadData();
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    try {
      await orderApi.delete(deletingOrder.id);
      setOrders(prev => prev.filter(o => o.id !== deletingOrder.id));
      setNotifCount(c => c + 1);
      toast.success(`Đã xóa ${deletingOrder.order_number}`);
      setDeletingOrder(null);
      void loadData();
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <OrderFormModal open={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleCreate} />
      <OrderFormModal open={!!editingOrder} onClose={() => setEditingOrder(null)} onSave={handleUpdate} initial={editingOrder} />
      <ConfirmDeleteModal
        open={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleDelete}
        orderLabel={deletingOrder?.order_number ?? ''}
      />

      <div className="mx-auto grid min-h-screen max-w-350 grid-cols-1 lg:grid-cols-[250px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-900 text-slate-100 p-5">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
            <div>
              <p className="font-semibold">Staff Service</p>
              <p className="text-xs text-slate-300">Control Panel</p>
            </div>
          </div>

          <nav className="mt-5 space-y-2 text-sm">
            <a className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2" href="#overview">
              <BarChart3 className="h-4 w-4" /> Tổng quan
            </a>
            <a className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-800" href="#orders">
              <ClipboardList className="h-4 w-4" /> Orders
            </a>
            <a className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-800" href="#inventory">
              <Boxes className="h-4 w-4" /> Kho hàng
            </a>
            <a className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-800" href="#customers">
              <Users className="h-4 w-4" /> Customers
            </a>
            <a className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-800" href="#ai-control">
              <ShieldCheck className="h-4 w-4" /> AI Control
            </a>
          </nav>

          <div className="mt-6 rounded-lg bg-slate-800 p-3 text-xs text-slate-300">
            Login service: <strong className="text-slate-100">localhost:5174</strong>
          </div>

          <Button className="mt-4 w-full" variant="secondary" asChild>
            <Link to="/login/staff">
              <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
            </Link>
          </Button>
        </aside>

        <section className="p-5 lg:p-8">
          <header className="mb-6 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển Staff</h1>
              <p className="text-sm text-slate-500">Track order operations, inventory, and performance.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="relative" onClick={() => setNotifCount(0)}>
                <BellRing className="mr-2 h-4 w-4" />
                {notifCount > 0 ? `${notifCount} thông báo mới` : 'Thông báo'}
                {notifCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{notifCount}</span>}
              </Button>
            </div>
          </header>

          {!data ? (
            <p className="text-sm text-slate-500">Đang tải dữ liệu staff dashboard...</p>
          ) : (
            <div className="space-y-6">
              <div id="overview" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Doanh thu hôm nay</p>
                  <p className="mt-1 text-2xl font-semibold text-cyan-700">{formatCurrency(data.kpis.today_revenue)}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">New Orders</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{data.kpis.new_orders}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Tổng số đơn</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{data.kpis.total_orders}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Low Stock Products</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-600">{data.kpis.low_stock_count}</p>
                </div>
              </div>

              <div id="orders" className="rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="font-medium text-slate-800">Danh sách đơn hàng</span>
                  <Button size="sm" onClick={() => setShowAddModal(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Thêm đơn
                  </Button>
                </div>
                <div className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <div key={order.id} className="grid grid-cols-1 items-center gap-2 px-4 py-3 text-sm md:grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr_auto]">
                      <div>
                        <p className="font-medium text-slate-900">{order.order_number}</p>
                        <p className="text-slate-500">{order.customer}</p>
                      </div>
                      <p className="text-slate-700">{formatCurrency(order.amount)}</p>
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                        {order.status}
                      </span>
                      <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setEditingOrder(order)}>Sửa</Button>
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setDeletingOrder(order)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">Chưa có đơn hàng nào.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div id="inventory" className="rounded-xl bg-white p-4 shadow-sm">
                  <h2 className="font-semibold text-slate-900">Kho hàng</h2>
                  <p className="mt-2 text-sm text-slate-500">Đã đồng bộ dữ liệu tồn kho thấp từ Inventory Service.</p>
                  <div className="mt-3 text-sm">
                    <p>- SKU cần bổ sung gấp: {data.kpis.low_stock_count}</p>
                    <p>- Trạng thái đồng bộ: OK</p>
                  </div>
                </div>

                <div id="customers" className="rounded-xl bg-white p-4 shadow-sm">
                  <h2 className="font-semibold text-slate-900">Customers</h2>
                  <p className="mt-2 text-sm text-slate-500">Customer info displayed from recent orders stream.</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {orders.slice(0, 3).map((order) => (
                      <li key={order.id}>- {order.customer}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div id="ai-control" className="rounded-xl bg-white p-4 shadow-sm">
                <h2 className="font-semibold text-slate-900">AI Control (Demo cho Staff)</h2>
                <p className="mt-2 text-sm text-slate-500">Theo dõi nhanh model recommendation, forecast và fraud để quản lý vận hành AI.</p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Recommendation Stage</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{aiRecommend ? `${aiRecommend.recommendations.length} gợi ý` : 'n/a'}</p>
                    <p className="mt-1 text-xs text-slate-500">Model: {aiRecommend?.model ?? 'n/a'}</p>
                    <p className="mt-1 text-xs text-slate-500">Query: {aiRecommend?.query ?? 'n/a'}</p>
                    <p className="mt-1 text-xs text-slate-500">Top IDs: {aiRecommend?.recommendations.join(', ') || 'n/a'}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Demand Forecast</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {aiForecast?.forecast?.length ? `${aiForecast.forecast[0].predicted_units} units/ngày` : 'n/a'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Horizon: {aiForecast?.horizon ? `${aiForecast.horizon} ngày` : 'n/a'}</p>
                    <p className="mt-1 text-xs text-slate-500">Model: {aiForecast?.model ?? 'n/a'}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Fraud Monitor</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {aiFraud ? `${aiFraud.fraud_score.toFixed(2)} (${aiFraud.risk_level})` : 'n/a'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Manual review: {aiFraud?.requires_manual_review ? 'Yes' : 'No'}</p>
                    <p className="mt-1 text-xs text-slate-500">Model: {aiFraud?.model ?? 'n/a'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
