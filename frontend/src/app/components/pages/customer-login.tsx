import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { setCustomerSession } from '../../lib/customer-session';

type CustomerLoginResponse = {
  token: string;
  user: {
    name: string;
    email: string;
  };
};

export function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('customer@demo.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/customer/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as CustomerLoginResponse | { detail: string };
      if (!response.ok) {
        throw new Error('detail' in data ? data.detail : 'Đăng nhập thất bại');
      }

      if (!('user' in data)) {
        throw new Error('Dữ liệu đăng nhập không hợp lệ.');
      }

      setCustomerSession({
        token: data.token,
        user: {
          name: data.user.name,
          email: data.user.email,
        },
      });

      setMessage(`Xin chào ${data.user.name}, đăng nhập customer thành công.`);
      setTimeout(() => navigate('/home'), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Có lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-cyan-50 to-blue-100 px-4 py-12">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Customer Login</CardTitle>
            <CardDescription>Customer service at http://localhost:5173/</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mật khẩu</label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </div>
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập Customer'}
              </Button>
            </form>

            {message && <p className="mt-4 text-sm">{message}</p>}

            <p className="mt-4 text-sm text-muted-foreground">
              Muốn đăng nhập staff? <a className="text-primary underline" href="http://localhost:5174/">Sang trang Staff</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
