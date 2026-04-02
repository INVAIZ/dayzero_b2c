import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
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
import RegistrationEditPage from './pages/registration/RegistrationEditPage';
import SettingsPage from './pages/settings/SettingsPage';
import { OnboardingProvider } from './components/onboarding/OnboardingContext';

const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/basic-info', element: <BasicInfoPage /> },
  { path: '/qoo10-connect', element: <Qoo10ConnectPage /> },
  { path: '/basic-margin', element: <BasicMarginPage /> },

  // Sourcing
  { path: '/sourcing', element: <SourcingPage /> },
  { path: '/sourcing/url', element: <UrlSourcingPage /> },
  { path: '/sourcing/auto', element: <AutoSourcingPage /> },

  // Editing
  { path: '/editing', element: <EditingListPage /> },
  { path: '/editing/:productId', element: <EditingDetailPage /> },

  // Registration
  { path: '/registration', element: <RegistrationResultPage /> },
  { path: '/registration/:resultId', element: <ProductDetailPage /> },
  { path: '/registration/:resultId/edit', element: <RegistrationEditPage /> },

  // Settings
  { path: '/settings', element: <Navigate to="/settings/sales" replace /> },
  { path: '/settings/:tab', element: <SettingsPage /> },

  // Default redirect
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <OnboardingProvider>
      <RouterProvider router={router} />
    </OnboardingProvider>
  );
}
