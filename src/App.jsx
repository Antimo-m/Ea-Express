import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
} from "react-router";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { State, Empty } from "./components/UI";
import ErrorBoundary from "./components/ErrorBoundary";
import PortalLayout from "./layouts/PortalLayout";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import OrderFormPage from "./pages/OrderFormPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CouriersPage from "./pages/CouriersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import "bootstrap-icons/font/bootstrap-icons.css";
function Session() {
  const auth = useAuth();
  return <State resource={auth}>{() => <Outlet />}</State>;
}
function Protected() {
  const { user } = useAuth();
  return user ? <PortalLayout /> : <Navigate to="/login" replace />;
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Session />}>
              <Route path="/login" element={<AuthPage key="login" />} />
              <Route
                path="/register"
                element={<AuthPage key="register" mode="register" />}
              />
              <Route
                path="/forgot-password"
                element={<AuthPage key="forgot" mode="forgot" />}
              />
              <Route
                path="/reset-password"
                element={<AuthPage key="reset" mode="reset" />}
              />
              <Route element={<Protected />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="shipments" element={<OrdersPage />} />
                <Route path="shipments/new" element={<OrderFormPage />} />
                <Route path="shipments/:id" element={<OrderDetailPage />} />
                <Route path="shipments/:id/edit" element={<OrderFormPage />} />
                <Route path="pickups" element={<OrdersPage pickups />} />
                <Route path="pickups/new" element={<OrderFormPage pickups />} />
                <Route
                  path="pickups/:id"
                  element={<OrderDetailPage pickups />}
                />
                <Route
                  path="pickups/:id/edit"
                  element={<OrderFormPage pickups />}
                />
                <Route path="messages" element={<OrdersPage messages />} />
                <Route
                  path="messages/:id"
                  element={<OrderDetailPage messages />}
                />
                <Route path="couriers" element={<CouriersPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<ProfilePage settings />} />
                <Route
                  path="*"
                  element={
                    <Empty
                      title="Questa pagina non esiste"
                      text="Riparti dalla panoramica del tuo negozio."
                    >
                      <Link className="button" to="/dashboard">
                        Vai alla panoramica
                      </Link>
                    </Empty>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
