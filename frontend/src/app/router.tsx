import { Routes, Route } from 'react-router-dom';
import { Homepage } from './components/pages/homepage';
import { ProductListing } from './components/pages/product-listing';
import { ProductDetail } from './components/pages/product-detail';
import { ShoppingCart } from './components/pages/shopping-cart';
import { AdminDashboard } from './components/pages/admin-dashboard';
import { AuthSelector } from './components/pages/auth-selector';
import { CustomerLogin } from './components/pages/customer-login';
import { StaffLogin } from './components/pages/staff-login';
import { StaffDashboard } from './components/pages/staff-dashboard';
import { AiExperience } from './components/pages/ai-experience';

export function Router() {
  const appRole = (import.meta.env.VITE_APP_ROLE || 'customer') as 'customer' | 'staff' | 'portal';

  const rootPage = appRole === 'staff' ? <StaffLogin /> : appRole === 'portal' ? <AuthSelector /> : <CustomerLogin />;

  return (
    <Routes>
      <Route path="/" element={rootPage} />
      <Route path="/select" element={<AuthSelector />} />
      <Route path="/login/customer" element={<CustomerLogin />} />
      <Route path="/login/staff" element={<StaffLogin />} />
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/home" element={<Homepage />} />
      <Route path="/products" element={<ProductListing />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/ai" element={<AiExperience />} />
      <Route path="/cart" element={<ShoppingCart />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
