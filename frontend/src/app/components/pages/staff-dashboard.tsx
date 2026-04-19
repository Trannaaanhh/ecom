import { useEffect, useState } from 'react';
import { BarChart3, BellRing, Boxes, ClipboardList, LogOut, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

type AdminSummary = {
  kpis: {
    today_revenue: number;
    new_orders: number;
    conversion_rate: number;
    low_stock_count: number;
  };
  recent_orders: Array<{ id: string; customer: string; amount: number; status: string }>;
};

type AiForecast = {
  product_id: number;
  projected_units_next_7_days: number;
  confidence: number;
  model: string;
};

type AiFraud = {
  fraud_score: number;
  risk_level: 'low' | 'medium' | 'high';
  requires_manual_review: boolean;
  model: string;
};

type AiRecommend = {
  stage: string;
  model: string;
  recommended_product_ids: number[];
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

export function StaffDashboard() {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [aiForecast, setAiForecast] = useState<AiForecast | null>(null);
  const [aiFraud, setAiFraud] = useState<AiFraud | null>(null);
  const [aiRecommend, setAiRecommend] = useState<AiRecommend | null>(null);

  useEffect(() => {
    const load = async () => {
      const [summaryResponse, forecastResponse, fraudResponse, recommendResponse] = await Promise.all([
        fetch('/api/orders/admin-summary/'),
        fetch('/api/ai/forecast/1/'),
        fetch('/api/ai/fraud/score/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 46000000, risk_flags: ['new_device', 'ip_velocity'] }),
        }),
        fetch('/api/ai/recommend/101/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'staff-monitor-session',
            preferred_category: 'phone',
            viewed_product_ids: [1, 3],
            event_count: 2,
            has_first_purchase: false,
          }),
        }),
      ]);

      const payload: AdminSummary = await summaryResponse.json();
      const forecastPayload: AiForecast = await forecastResponse.json();
      const fraudPayload: AiFraud = await fraudResponse.json();
      const recommendPayload: AiRecommend = await recommendResponse.json();

      setData(payload);
      setAiForecast(forecastPayload);
      setAiFraud(fraudPayload);
      setAiRecommend(recommendPayload);
    };

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
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
              <ClipboardList className="h-4 w-4" /> Đơn hàng
            </a>
            <a className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-800" href="#inventory">
              <Boxes className="h-4 w-4" /> Kho hàng
            </a>
            <a className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-800" href="#customers">
              <Users className="h-4 w-4" /> Khách hàng
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
              <p className="text-sm text-slate-500">Theo dõi vận hành đơn hàng, kho và hiệu suất.</p>
            </div>
            <Button variant="outline">
              <BellRing className="mr-2 h-4 w-4" /> 3 thông báo mới
            </Button>
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
                  <p className="text-xs text-slate-500">Đơn hàng mới</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{data.kpis.new_orders}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Tỷ lệ chuyển đổi</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{data.kpis.conversion_rate}%</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Sản phẩm tồn thấp</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-600">{data.kpis.low_stock_count}</p>
                </div>
              </div>

              <div id="orders" className="rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3 font-medium text-slate-800">Đơn hàng gần đây</div>
                <div className="divide-y divide-slate-100">
                  {data.recent_orders.map((order) => (
                    <div key={order.id} className="grid grid-cols-1 gap-2 px-4 py-3 text-sm md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                      <div>
                        <p className="font-medium text-slate-900">{order.id}</p>
                        <p className="text-slate-500">{order.customer}</p>
                      </div>
                      <p className="text-slate-700">{formatCurrency(order.amount)}</p>
                      <p className="text-slate-700">{order.status}</p>
                      <Button variant="outline" size="sm">Chi tiết</Button>
                    </div>
                  ))}
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
                  <h2 className="font-semibold text-slate-900">Khách hàng</h2>
                  <p className="mt-2 text-sm text-slate-500">Thông tin customer hiển thị từ luồng đơn hàng gần đây.</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {data.recent_orders.slice(0, 3).map((order) => (
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
                    <p className="mt-1 text-base font-semibold text-slate-900">{aiRecommend?.stage ?? 'n/a'}</p>
                    <p className="mt-1 text-xs text-slate-500">Model: {aiRecommend?.model ?? 'n/a'}</p>
                    <p className="mt-1 text-xs text-slate-500">Top IDs: {(aiRecommend?.recommended_product_ids ?? []).join(', ') || 'n/a'}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Demand Forecast</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">
                      {aiForecast ? `${aiForecast.projected_units_next_7_days} units/7 ngày` : 'n/a'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Confidence: {aiForecast ? `${Math.round(aiForecast.confidence * 100)}%` : 'n/a'}</p>
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
