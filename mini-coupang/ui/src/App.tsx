import { Navigate, Route, Routes } from 'react-router';
import { BuyerLayout } from './layouts/BuyerLayout';
import { SellerLayout } from './layouts/SellerLayout';
import { RequireBuyer } from './guards/RequireBuyer';
import { RequireSeller } from './guards/RequireSeller';
import { PlaceholderPage } from './pages/PlaceholderPage';

export function App() {
  return (
    <Routes>
      <Route path="/login"         element={<PlaceholderPage title="구매자 로그인" />} />
      <Route path="/signup"        element={<PlaceholderPage title="구매자 가입" />} />
      <Route path="/seller/login"  element={<PlaceholderPage title="판매자 로그인" />} />
      <Route path="/seller/signup" element={<PlaceholderPage title="판매자 가입" />} />

      <Route element={<BuyerLayout />}>
        <Route index         element={<PlaceholderPage title="랜딩" />} />
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
