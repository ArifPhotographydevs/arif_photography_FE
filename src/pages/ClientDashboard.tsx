import React, { useState } from 'react';
import { 
  Camera, 
  FileText, 
  CreditCard, 
  MessageCircle, 
  Menu, 
  X, 
  LogOut,
  FolderOpen,
  Image,
  Receipt,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ClientDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Mock client data
  const clientData = {
    name: "Sarah Johnson",
    totalProjects: 3,
    pendingInvoices: 2,
    galleriesShared: 5,
    messagesSent: 12
  };

  const recentActivity = [
    { id: 1, action: "New gallery shared", time: "2 hours ago", icon: Image, type: "gallery" },
    { id: 2, action: "Invoice #INV-001 sent", time: "1 day ago", icon: Receipt, type: "invoice" },
    { id: 3, action: "Project 'Wedding Shoot' updated", time: "3 days ago", icon: Camera, type: "project" },
    { id: 4, action: "Message from studio", time: "5 days ago", icon: MessageCircle, type: "message" }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FolderOpen },
    { id: 'projects', label: 'My Projects', icon: Camera },
    { id: 'galleries', label: 'My Galleries', icon: Image, component: 'ClientGalleries' },
    { id: 'invoices', label: 'My Invoices', icon: Receipt },
    { id: 'support', label: 'Support / Chat', icon: MessageCircle, component: 'ClientSupport' }
  ];

  const handleLogout = () => {
    // Handle logout logic
    window.location.href = '/client/login';
  };

  const SummaryCard = ({ title, value, icon: Icon, bgColor = "bg-white" }) => (
    <div className={`${bgColor} rounded-lg shadow-md p-6 border border-gray-100`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="p-3 bg-cyan-50 rounded-full">
          <Icon className="w-6 h-6 text-cyan-600" />
        </div>
      </div>
    </div>
  );

  const QuickActionButton = ({ label, icon: Icon, onClick, variant = "primary" }) => {
    const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors";
    const variants = {
      primary: "bg-cyan-600 text-white hover:bg-cyan-700",
      secondary: "bg-orange-600 text-white hover:bg-orange-700"
    };

    return (
      <button 
        onClick={onClick}
        className={`${baseClasses} ${variants[variant]}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getTypeColor = (type) => {
      switch (type) {
        case 'gallery': return 'text-purple-600 bg-purple-50';
        case 'invoice': return 'text-green-600 bg-green-50';
        case 'project': return 'text-cyan-600 bg-cyan-50';
        case 'message': return 'text-orange-600 bg-orange-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    return (
      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-full ${getTypeColor(activity.type)}`}>
          <activity.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Camera className="w-8 h-8 text-cyan-600" />
              <span className="font-bold text-xl text-gray-900">Arif Photography</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-gray-900">
              Hi, {clientData.name} 👋
            </h1>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <span className="font-semibold text-gray-900">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                      if (item.component) {
                        window.location.href = `/${item.component.toLowerCase().replace('client', '/client/')}`;
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${activeSection === item.id 
                        ? 'bg-cyan-50 text-cyan-700 border-r-2 border-cyan-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSection === 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              {/* Mobile Welcome */}
              <div className="md:hidden mb-6">
                <h1 className="text-xl font-semibold text-gray-900">
                  Hi, {clientData.name} 👋
                </h1>
                <p className="text-gray-600">Welcome to your client portal</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard
                  title="Total Projects"
                  value={clientData.totalProjects}
                  icon={Camera}
                />
                <SummaryCard
                  title="Pending Invoices"
                  value={clientData.pendingInvoices}
                  icon={AlertCircle}
                />
                <SummaryCard
                  title="Galleries Shared"
                  value={clientData.galleriesShared}
                  icon={Image}
                />
                <SummaryCard
                  title="Messages Sent"
                  value={clientData.messagesSent}
                  icon={MessageCircle}
                />
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <QuickActionButton
                    label="View Latest Gallery"
                    icon={Image}
                    onClick={() => setActiveSection('galleries')}
                  />
                  <QuickActionButton
                    label="Pay Invoice"
                    icon={CreditCard}
                    onClick={() => setActiveSection('invoices')}
                    variant="secondary"
                  />
                  <QuickActionButton
                    label="Submit Feedback"
                    icon={MessageCircle}
                    onClick={() => setActiveSection('support')}
                  />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-1">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other sections placeholder */}
          {activeSection !== 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {menuItems.find(item => item.id === activeSection)?.label}
                </h2>
                <p className="text-gray-600">
                  This section is coming soon. You can navigate back to the dashboard to see your overview.
                </p>
                <button
                  onClick={() => setActiveSection('dashboard')}
                  className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;