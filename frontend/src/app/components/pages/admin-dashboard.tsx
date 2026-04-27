import { useEffect, useState } from 'react';

type AdminSummary = {
  kpis: {
    today_revenue: number;
    new_orders: number;
    conversion_rate: number;
    low_stock_count: number;
  };
  recent_orders: Array<{ id: string; customer: string; amount: number; status: string }>;
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

export function AdminDashboard() {
  const [data, setData] = useState<AdminSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/orders/admin-summary/');
      const payload: AdminSummary = await response.json();
      setData(payload);
    };

    void load();
  }, []);

  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-4">Bảng điều khiển admin</h1>
      <p className="text-muted-foreground mb-8">Dữ liệu đang lấy từ Order Service.</p>

      {!data ? (
        <p className="text-sm text-muted-foreground">Đang tải báo cáo...</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">Doanh thu hôm nay</p><p className="text-xl font-semibold mt-1">{formatCurrency(data.kpis.today_revenue)}</p></div>
            <div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">New Orders</p><p className="text-xl font-semibold mt-1">{data.kpis.new_orders}</p></div>
            <div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">Tỷ lệ chuyển đổi</p><p className="text-xl font-semibold mt-1">{data.kpis.conversion_rate}%</p></div>
            <div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">Tồn kho thấp</p><p className="text-xl font-semibold mt-1">{data.kpis.low_stock_count}</p></div>
          </div>

          <section className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-medium">Recent Orders</div>
            <div className="divide-y divide-border">
              {data.recent_orders.map((order) => (
                <div key={order.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-muted-foreground">{order.customer}</p>
                  </div>
                  <p>{formatCurrency(order.amount)}</p>
                  <p className="font-medium">{order.status}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
