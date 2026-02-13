import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { SupportProvider } from './context/SupportContext';
import { SettingsProvider } from './context/SettingsContext';
import { ServicesProvider } from './context/ServicesContext';
import { BillingProvider } from './context/BillingContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientDashboard from './pages/client/ClientDashboard';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ProjectProvider>
          <PortfolioProvider>
            <SupportProvider>
              <SettingsProvider>
                <ServicesProvider>
                  <BillingProvider>
                    <Router>
                      <Routes>
                        <Route path="/" element={<Layout />}>
                          <Route index element={<Home />} />
                          <Route path="services" element={<Services />} />
                          <Route path="portfolio" element={<Portfolio />} />
                          <Route path="contact" element={<Contact />} />
                          <Route path="login" element={<Login />} />
                          
                          {/* Protected Routes */}
                          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="admin" element={<AdminDashboard />} />
                          </Route>
                          
                          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                            <Route path="dashboard" element={<ClientDashboard />} />
                          </Route>
                        </Route>
                      </Routes>
                    </Router>
                  </BillingProvider>
                </ServicesProvider>
              </SettingsProvider>
            </SupportProvider>
          </PortfolioProvider>
        </ProjectProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
