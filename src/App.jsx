import { lazy, Suspense, useEffect } from 'react';
import { attachFormPopovers } from './services/form-popovers';
import { attachTooltips } from './services/tooltips';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { State } from "./components/UI";
import ErrorBoundary from "./components/ErrorBoundary";
import PortalLayout from "./layouts/PortalLayout";
import AuthPage from "./pages/AuthPage";
import NotFoundPage from "./pages/NotFoundPage";
import "bootstrap-icons/font/bootstrap-icons.css";
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderFormPage = lazy(() => import('./pages/OrderFormPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const LabelsPage = lazy(() => import('./pages/LabelsPage'));
const LabelPage = lazy(() => import('./pages/LabelPage'));
const RatesPage = lazy(() => import('./pages/RatesPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const PendingPage = lazy(() => import('./pages/PendingPage'));
const PendingDetailPage = lazy(() => import('./pages/PendingDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const BetaTermsPage = lazy(() => import('./pages/BetaTermsPage'));
function Session() {
  const auth = useAuth();
  return <State resource={auth}>{() => <Outlet />}</State>;
}
function Protected() {
  const { user } = useAuth();
  return user ? <PortalLayout /> : <Navigate to="/login" replace />;
}
export default function App() {
  useEffect(() => attachFormPopovers(document), []);
  useEffect(() => attachTooltips(document), []);
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<State resource={{ loading: true }} />}>
          <Routes>
            <Route path="/cookies" element={<PrivacyPage />} />
            <Route path="/privacy" element={<PrivacyPage privacy />} />
            <Route path="/condizioni-beta" element={<BetaTermsPage />} />
            <Route element={<Session />}>
              <Route path="/login" element={<AuthPage key="login" />} />
              <Route path="/verify-access" element={<AuthPage key="verify" mode="verify" />} />
              <Route path="/forgot-password" element={<AuthPage key="forgot" mode="forgot" />} />
              <Route path="/reset-password" element={<AuthPage key="reset" mode="reset" />} />
              <Route
                path="/register"
                element={<AuthPage key="register" mode="register" />}
              />
              <Route element={<Protected />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="rates" element={<RatesPage/>}/><Route path="statistics" element={<StatisticsPage/>}/><Route path="dashboard" element={<DashboardPage />} />
                <Route path="shipments/labels" element={<LabelsPage />} />
                <Route path="shipments/:slug/label" element={<LabelPage />} />
                <Route path="shipments" element={<OrdersPage />} />
                <Route path="shipments/new" element={<OrderFormPage />} />
                <Route path="shipments/:slug" element={<OrderDetailPage />} />
                <Route path="shipments/:slug/edit" element={<OrderFormPage />} />
                <Route path="pickups" element={<OrdersPage pickups />} />
                <Route path="pickups/new" element={<OrderFormPage pickups />} />
                <Route
                  path="pickups/:slug"
                  element={<OrderDetailPage pickups />}
                />
                <Route
                  path="pickups/:slug/edit"
                  element={<OrderFormPage pickups />}
                />
                <Route path="messages" element={<OrdersPage messages />} />
                <Route
                  path="messages/:slug"
                  element={<OrderDetailPage messages />}
                />
                <Route path="pending" element={<PendingPage />} />
                <Route path="pending/:slug" element={<PendingDetailPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<ProfilePage settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
