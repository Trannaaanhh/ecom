import { LogOut, Mail, MapPin, Phone, ShieldCheck, StickyNote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  clearCustomerCheckoutProfile,
  clearCustomerSession,
  getCustomerCheckoutProfile,
  getCustomerSession,
  type CustomerCheckoutProfile,
  type CustomerSession,
} from '../../lib/customer-session';

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-2 break-words text-base font-medium leading-7 text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function CustomerAccount() {
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerCheckoutProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const syncCustomerState = () => {
      setCustomerSession(getCustomerSession());
      setCustomerProfile(getCustomerCheckoutProfile());
    };

    syncCustomerState();
    window.addEventListener('storage', syncCustomerState);
    window.addEventListener('focus', syncCustomerState);
    return () => {
      window.removeEventListener('storage', syncCustomerState);
      window.removeEventListener('focus', syncCustomerState);
    };
  }, []);

  const onLogout = () => {
    clearCustomerSession();
    clearCustomerCheckoutProfile();
    setCustomerSession(null);
    setCustomerProfile(null);
    navigate('/');
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <section className="border-b border-border bg-linear-to-r from-[#0A2540] to-[#0B4C73] text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Customer Account</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Thong tin customer</h1>
            <p className="mt-3 text-base leading-7 text-white/78">
              Xem toan bo thong tin dang nhap va ho so giao hang tren mot trang rieng, de doc va de cap nhat quy trinh mua hang.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trang thai tai khoan</p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">
                    {customerSession?.user.name || 'Chua dang nhap'}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {customerSession?.user.email || 'Khong co session customer trong trinh duyet hien tai.'}
                  </p>
                </div>
                <span
                  className={
                    customerSession
                      ? 'inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/12 px-4 py-2 text-sm font-semibold text-emerald-600'
                      : 'inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/12 px-4 py-2 text-sm font-semibold text-amber-600'
                  }
                >
                  {customerSession ? 'Da dang nhap' : 'Guest'}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {customerSession ? (
                  <Button variant="destructive" className="h-11 rounded-xl px-5" onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                    Dang xuat
                  </Button>
                ) : (
                  <Button className="h-11 rounded-xl px-5" onClick={() => navigate('/login/customer')}>
                    Dang nhap customer
                  </Button>
                )}
                <Button variant="outline" className="h-11 rounded-xl px-5" onClick={() => navigate('/cart')}>
                  Xem gio hang
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground">Thong tin dang nhap</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Du lieu lay tu customer session sau khi dang nhap.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Ho ten" value={customerSession?.user.name || 'Chua dang nhap'} icon={<ShieldCheck className="h-4 w-4" />} />
                <InfoCard label="Email" value={customerSession?.user.email || 'Chua co email customer'} icon={<Mail className="h-4 w-4" />} />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-foreground">Ho so giao hang</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Du lieu lay tu thong tin customer da nhap trong buoc checkout.
              </p>
            </div>

            <div className="space-y-4">
              <InfoCard label="So dien thoai" value={customerProfile?.phone || 'Chua cap nhat'} icon={<Phone className="h-4 w-4" />} />
              <InfoCard label="Dia chi" value={customerProfile?.address || 'Chua cap nhat'} icon={<MapPin className="h-4 w-4" />} />
              <InfoCard label="Ghi chu" value={customerProfile?.note || 'Khong co ghi chu'} icon={<StickyNote className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
