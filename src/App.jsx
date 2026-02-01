import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Products from './pages/Products';
import EntitiesManagement from './pages/EntitiesManagement';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Maintenance from './pages/Maintenance';
import Promotions from './pages/Promotions';
import Coupons from './pages/Coupons';
import AdminDashboard from './pages/AdminDashboard';
import Design from './pages/Design';
import EmployeeManagement from './pages/EmployeeManagement';
import CashRegister from './pages/CashRegister';
import CashRegisterLog from './pages/CashRegisterLog';
import CustomerOrders from './pages/CustomerOrders';
import Branches from './pages/Branches';
import Dashboard from './pages/Dashboard';
import MaintenanceOperator from './pages/MaintenanceOperator';
import MiVetShopSync from './pages/MiVetShopSync';
import Shortages from './pages/Shortages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Operator']} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/cash-register" element={<CashRegister />} />
              <Route path="/customer-orders" element={<CustomerOrders />} />
              <Route path="/customer-orders" element={<CustomerOrders />} />
              <Route path="/maintenance-operator" element={<MaintenanceOperator />} />
              <Route path="/shortages" element={<Shortages />} />
              <Route path="/mi-vet-shop" element={<MiVetShopSync />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route element={<Layout />}>
              <Route path="/entities" element={<EntitiesManagement />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/cash-register-log" element={<CashRegisterLog />} />
              <Route path="/design" element={<Design />} />
              <Route path="/branches" element={<Branches />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
