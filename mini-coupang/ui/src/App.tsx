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
import { SearchPage } from './features/search/pages/SearchPage';
import { SellerProductsPage } from './features/seller-products/pages/SellerProductsPage';
import { MePage } from './features/me/pages/MePage';
import { SellerMePage } from './features/me/pages/SellerMePage';

export function App() {
  return (
    <Routes>
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/signup"        element={<SignupPage />} />
      <Route path="/seller/login"  element={<SellerLoginPage />} />
      <Route path="/seller/signup" element={<SellerSignupPage />} />

      <Route element={<BuyerLayout />}>
        <Route index         element={<LandingPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route element={<RequireBuyer />}>
          <Route path="me" element={<MePage />} />
        </Route>
      </Route>

      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<Navigate to="/seller/products" replace />} />
        <Route element={<RequireSeller />}>
          <Route path="products" element={<SellerProductsPage />} />
          <Route path="me" element={<SellerMePage />} />
        </Route>
      </Route>

      <Route path="*" element={<PlaceholderPage title="404" />} />
    </Routes>
  );
}
