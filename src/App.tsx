import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import ProposalCreate from './pages/ProposalCreate';
import ProposalView from './pages/ProposalView';
import Proposals from './pages/Proposals';
import Projects from './pages/Projects';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Calendar from './pages/Calendar';
import Gallery from './pages/Gallery';
import GalleryUpload from './pages/GalleryUpload';
import SharedImages from './pages/SharedImages';
import ClientGallery from './pages/ClientGallery';
import Clients from './pages/Clients';
import TeamManagement from './pages/TeamManagement';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import ActivityLogs from './pages/ActivityLogs';
import ClientLogin from './pages/ClientLogin';
import ClientDashboard from './pages/ClientDashboard';
import ClientGalleries from './pages/ClientGalleries';
import ClientSupport from './pages/ClientSupport';
import Leadform from './pages/leads/src/App';

// Initialize Firebase Auth
const auth = getAuth();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Render a loading state while checking authentication
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/leadform" element={<Leadform />} />
        <Route path="/shared-images/:folderPath" element={<SharedImages />} />

        {/* Protected Routes (require authentication) */}
        <Route
          path="/onboarding"
          element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/leads"
          element={isAuthenticated ? <Leads /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/leads/:id"
          element={isAuthenticated ? <LeadDetail /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/proposals/create/:leadId"
          element={isAuthenticated ? <ProposalCreate /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/proposals/view/:id"
          element={isAuthenticated ? <ProposalView /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/proposals"
          element={isAuthenticated ? <Proposals /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/proposals/create"
          element={isAuthenticated ? <ProposalCreate /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/proposals/edit/:id"
          element={isAuthenticated ? <ProposalCreate /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/projects"
          element={isAuthenticated ? <Projects /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/projects/:id"
          element={isAuthenticated ? <ProjectWorkspace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/calendar"
          element={isAuthenticated ? <Calendar /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/gallery"
          element={isAuthenticated ? <Gallery /> : <Navigate to="/login" replace />}
        />
        
      <Route
  path="/gallery/upload/:projectId"
  element={isAuthenticated ? <GalleryUpload /> : <Navigate to="/login" replace />}
/>
       <Route
  path="/client-gallery/:galleryId/*"
  element={isAuthenticated ? <ClientGallery /> : <Navigate to="/login" replace />}
/>
 <Route path="/gallery/*" element={isAuthenticated ? <Gallery /> : <Navigate to="/login" replace />} />
        <Route
          path="/clients"
          element={isAuthenticated ? <Clients /> : <Navigate to="/login" replace />}
        />
        
        <Route
          path="/clients/:id"
          element={isAuthenticated ? <div>Client Profile - Coming Soon</div> : <Navigate to="/login" replace />}
        />
        <Route
          path="/team"
          element={isAuthenticated ? <TeamManagement /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/finance"
          element={isAuthenticated ? <Finance /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/analytics"
          element={isAuthenticated ? <Analytics /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/activity-logs"
          element={isAuthenticated ? <ActivityLogs /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/client/dashboard"
          element={isAuthenticated ? <ClientDashboard /> : <Navigate to="/client/login" replace />}
        />
        <Route
          path="/client/galleries"
          element={isAuthenticated ? <ClientGalleries /> : <Navigate to="/client/login" replace />}
        />
        <Route
          path="/client/support"
          element={isAuthenticated ? <ClientSupport /> : <Navigate to="/client/login" replace />}
        />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;