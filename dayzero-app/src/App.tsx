import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import BasicInfoPage from './pages/onboarding/BasicInfoPage';
import Qoo10ConnectPage from './pages/onboarding/Qoo10ConnectPage';
import BasicMarginPage from './pages/onboarding/BasicMarginPage';
import SourcingPage from './pages/SourcingPage';
import UrlSourcingPage from './pages/sourcing/UrlSourcingPage';
import AutoSourcingPage from './pages/sourcing/AutoSourcingPage';
import EditingListPage from './pages/editing/EditingListPage';
import EditingDetailPage from './pages/editing/EditingDetailPage';
import { RegistrationResultPage } from './pages/registration/RegistrationResultPage';
import { ProductDetailPage } from './pages/registration/ProductDetailPage';
import { OnboardingProvider } from './components/onboarding/OnboardingContext';

export default function App() {
  return (
    <OnboardingProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/basic-info" element={<BasicInfoPage />} />
          <Route path="/qoo10-connect" element={<Qoo10ConnectPage />} />
          <Route path="/basic-margin" element={<BasicMarginPage />} />

          {/* Sourcing Section */}
          <Route path="/sourcing" element={<SourcingPage />} />
          <Route path="/sourcing/url" element={<UrlSourcingPage />} />
          <Route path="/sourcing/auto" element={<AutoSourcingPage />} />

          {/* Editing Section */}
          <Route path="/editing" element={<EditingListPage />} />
          <Route path="/editing/:productId" element={<EditingDetailPage />} />

          {/* Registration Section (= 판매 중인 상품 + 변동 확인) */}
          <Route path="/registration" element={<RegistrationResultPage />} />
          <Route path="/registration/:resultId" element={<ProductDetailPage />} />

          {/* Default redirect to splash */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </OnboardingProvider>
  );
}
