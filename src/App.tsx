import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './components/ui/theme-provider';
import DashboardHeader from './components/layout/DashboardHeader';
import DashboardSidebar from './components/layout/DashboardSidebar';
import LoginForm from './components/Auth/LoginForm';
import ConfigPage from './pages/ConfigPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import DataPage from './pages/DataPage';
import { useDashboardStore } from './stores/dashboardStore';

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();
  const { sidebarCollapsed } = useDashboardStore();

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-0'}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/dashboard" element={<AnalyticsDashboard />} />
            <Route path="/data" element={<DataPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;