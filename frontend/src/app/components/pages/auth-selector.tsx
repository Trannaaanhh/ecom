import { ShieldCheck, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function AuthSelector() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-sky-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-slate-900">Chọn loại tài khoản</h1>
        <p className="mt-2 text-slate-600">Chọn khung phù hợp để vào trang đăng nhập riêng của từng service.</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="border-cyan-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <UserRound className="h-5 w-5" />
                Đăng nhập Customer
              </CardTitle>
              <CardDescription>Dành cho khách hàng mua sắm trên hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Link local: http://localhost:5173/</p>
              <Button className="w-full" asChild>
                <a href="http://localhost:5173/">Đi tới Customer Login</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-sky-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sky-700">
                <ShieldCheck className="h-5 w-5" />
                Đăng nhập Staff
              </CardTitle>
              <CardDescription>Dành cho nhân viên vận hành và quản trị.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">Link local: http://localhost:5174/</p>
              <Button className="w-full" variant="secondary" asChild>
                <a href="http://localhost:5174/">Đi tới Staff Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
