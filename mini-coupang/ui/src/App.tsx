import { Routes, Route } from 'react-router';
import { PlaceholderPage } from './pages/PlaceholderPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderPage title="구매자 홈" />} />
      <Route path="/seller" element={<PlaceholderPage title="판매자 홈" />} />
      <Route path="*" element={<PlaceholderPage title="404" />} />
    </Routes>
  );
}
