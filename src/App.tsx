import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/proposals/create/:leadId" element={<ProposalCreate />} />
        <Route path="/proposals/view/:id" element={<ProposalView />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/proposals/create" element={<ProposalCreate />} />
        <Route path="/proposals/edit/:id" element={<ProposalCreate />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectWorkspace />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/upload/:projectId" element={<GalleryUpload />} />
        <Route path="/client-gallery/:galleryId" element={<ClientGallery />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<div>Client Profile - Coming Soon</div>} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/galleries" element={<ClientGalleries />} />
        <Route path="/client/support" element={<ClientSupport />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/leadform" element={<Leadform />} />
      </Routes>
    </Router>
  );
}

export default App;