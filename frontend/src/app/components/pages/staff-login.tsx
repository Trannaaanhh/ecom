import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type StaffLoginResponse = {
  token: string;
  user: {
    name: string;
    username: string;
  };
};

export function StaffLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('staff-admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/staff/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as StaffLoginResponse | { detail: string };
      if (!response.ok) {
        throw new Error('detail' in data ? data.detail : 'Đăng nhập thất bại');
      }

      if (!('user' in data)) {
        throw new Error('Dữ liệu đăng nhập không hợp lệ.');
      }

      setMessage(`Xin chào ${data.user.name}, đăng nhập staff thành công.`);
      setTimeout(() => navigate('/staff/dashboard'), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Có lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-12">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Staff Login</CardTitle>
            <CardDescription>Service nhân viên tại http://localhost:5174/</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mật khẩu</label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập Staff'}
              </Button>
            </form>

            {message && <p className="mt-4 text-sm">{message}</p>}

            <p className="mt-4 text-sm text-muted-foreground">
              Quay lại chọn role? <a className="text-primary underline" href="http://localhost:5173/select">Mở trang chọn</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
