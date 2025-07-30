import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Camera, Users, Calendar, DollarSign, FileText, Plus, Clock, TrendingUp } from 'lucide-react';

function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const statsCards = [
    {
      title: 'Leads Today',
      value: '12',
      icon: Users,
      color: 'text-[#00BCEB]',
      bgColor: 'bg-[#00BCEB]/10',
      change: '+3 from yesterday',
      link: '/leads'
    },
    {
      title: 'Upcoming Shoots',
      value: '8',
      icon: Camera,
      color: 'text-[#FF6B00]',
      bgColor: 'bg-[#FF6B00]/10',
      change: 'Next: Tomorrow 10 AM',
      link: '/calendar'
    },
    {
      title: 'Pending Payments',
      value: '₹45,000',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '3 invoices overdue',
      link: '/finance'
    },
    {
      title: 'Active Projects',
      value: '24',
      icon: FileText,
      color: 'text-[#00BCEB]',
      bgColor: 'bg-[#00BCEB]/10',
      change: '6 in editing phase',
      link: '/projects'
    },
    {
      title: 'Avg Delivery Days',
      value: '7.2',
      icon: Clock,
      color: 'text-[#FF6B00]',
      bgColor: 'bg-[#FF6B00]/10',
      change: '2 days faster than last month',
      link: '/analytics'
    }
  ];

  const quickActions = [
    { name: 'Add Lead', icon: Plus, path: '/leads/create', primary: true },
    { name: 'Create Proposal', icon: FileText, path: '/proposals/create', primary: false },
    { name: 'Upload Gallery', icon: Camera, path: '/gallery/upload', primary: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header title="Dashboard" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Dashboard Content */}
        <main className="pt-16 p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2">Welcome back! 👋</h2>
            <p className="text-gray-600 text-lg">Here's what's happening with your photography business today.</p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      action.primary
                        ? 'bg-[#FF6B00] text-white hover:bg-[#e55a00] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        : 'bg-white text-[#2D2D2D] border border-gray-200 hover:border-[#00BCEB] hover:text-[#00BCEB] shadow-sm hover:shadow-md'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {action.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
            {statsCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => window.location.href = card.link}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-[#2D2D2D] mb-2">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.change}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#2D2D2D]">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5 text-[#00BCEB]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2D2D]">Wedding shoot completed for Sarah & John</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#FF6B00]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2D2D]">New lead: Emma Wilson added</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2D2D]">Payment received: ₹25,000 from Raj Studios</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#00BCEB]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#2D2D2D]">Portrait session scheduled for tomorrow</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;