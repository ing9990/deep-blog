import { Navigate, Route, Routes } from 'react-router';
import { BuyerLayout } from './layouts/BuyerLayout';
import { SellerLayout } from './layouts/SellerLayout';
import { RequireBuyer } from './guards/RequireBuyer';
import { RequireSeller } from './guards/RequireSeller';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { SignupPage } from './features/auth/pages/SignupPage';
import { SellerLoginPage } from './features/auth/pages/SellerLoginPage';
import { SellerSignupPage } from './features/auth/pages/SellerSignupPage';
import { LandingPage } from './features/search/pages/LandingPage';

export function App() {
  return (
    <Routes>
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/signup"        element={<SignupPage />} />
      <Route path="/seller/login"  element={<SellerLoginPage />} />
      <Route path="/seller/signup" element={<SellerSignupPage />} />

      <Route element={<BuyerLayout />}>
        <Route index         element={<LandingPage />} />
        <Route path="search" element={<PlaceholderPage title="검색" />} />
        <Route element={<RequireBuyer />}>
          <Route path="me"   element={<PlaceholderPage title="내 정보" />} />
        </Route>
      </Route>

      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<Navigate to="/seller/products" replace />} />
        <Route element={<RequireSeller />}>
          <Route path="products" element={<PlaceholderPage title="내 상품" />} />
          <Route path="me"       element={<PlaceholderPage title="판매자 내 정보" />} />
        </Route>
      </Route>

      <Route path="*" element={<PlaceholderPage title="404" />} />
    </Routes>
  );
}
