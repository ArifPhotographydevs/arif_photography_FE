import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  TrendingUp, 
  Target, 
  Camera, 
  Clock, 
  Users, 
  DollarSign, 
  FileText, 
  RefreshCw,
  Calendar,
  Award,
  Zap
} from 'lucide-react';

interface RevenueData {
  month: string;
  amount: number;
}

interface ShootTypeData {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface TeamMemberData {
  name: string;
  role: string;
  completedProjects: number;
  revenue: number;
}

function Analytics() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mock analytics data
  const revenueData: RevenueData[] = [
    { month: 'Aug', amount: 180000 },
    { month: 'Sep', amount: 220000 },
    { month: 'Oct', amount: 195000 },
    { month: 'Nov', amount: 285000 },
    { month: 'Dec', amount: 320000 },
    { month: 'Jan', amount: 275000 }
  ];

  const shootTypeData: ShootTypeData[] = [
    { type: 'Wedding', count: 15, percentage: 45, color: '#00BCEB' },
    { type: 'Pre-Wedding', count: 8, percentage: 24, color: '#FF6B00' },
    { type: 'Maternity', count: 5, percentage: 15, color: '#10B981' },
    { type: 'Corporate', count: 3, percentage: 9, color: '#8B5CF6' },
    { type: 'Portrait', count: 2, percentage: 6, color: '#F59E0B' }
  ];

  const teamMemberData: TeamMemberData[] = [
    { name: 'Arif Khan', role: 'Lead Photographer', completedProjects: 12, revenue: 450000 },
    { name: 'Priya Sharma', role: 'Photographer', completedProjects: 8, revenue: 280000 },
    { name: 'Rahul Verma', role: 'Editor', completedProjects: 15, revenue: 0 },
    { name: 'Sneha Patel', role: 'Assistant', completedProjects: 6, revenue: 150000 }
  ];

  const quickStats = [
    { label: 'Total Projects', value: '33', icon: Camera, color: 'text-[#00BCEB]', bgColor: 'bg-[#00BCEB]/10' },
    { label: 'Total Leads', value: '47', icon: Users, color: 'text-[#FF6B00]', bgColor: 'bg-[#FF6B00]/10' },
    { label: 'Acceptance Rate', value: '78%', icon: Target, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Repeat Clients', value: '24%', icon: RefreshCw, color: 'text-purple-600', bgColor: 'bg-purple-100' }
  ];

  const conversionRate = 70; // 70% conversion rate
  const avgApprovalDays = 3.2;
  const totalRevenue = revenueData.reduce((sum, data) => sum + data.amount, 0);
  const maxRevenue = Math.max(...revenueData.map(data => data.amount));

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  const formatFullCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header title="Analytics Overview" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Analytics Overview</h2>
            <p className="text-gray-600">Monitor your growth and conversion trends</p>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-[#2D2D2D]">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">Revenue (Last 6 Months)</h3>
                  <p className="text-sm text-gray-600">Total: {formatFullCurrency(totalRevenue)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-[#00BCEB]" />
              </div>
              
              <div className="relative h-64">
                <svg className="w-full h-full" viewBox="0 0 400 200">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1="40"
                      y1={40 + i * 32}
                      x2="380"
                      y2={40 + i * 32}
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Revenue line */}
                  <polyline
                    fill="none"
                    stroke="#00BCEB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={revenueData.map((data, index) => {
                      const x = 60 + (index * 55);
                      const y = 170 - ((data.amount / maxRevenue) * 120);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  
                  {/* Data points */}
                  {revenueData.map((data, index) => {
                    const x = 60 + (index * 55);
                    const y = 170 - ((data.amount / maxRevenue) * 120);
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#00BCEB"
                          className="hover:r-6 transition-all duration-200 cursor-pointer"
                        />
                        <text
                          x={x}
                          y="190"
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {data.month}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Y-axis labels */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <text
                      key={i}
                      x="30"
                      y={175 - i * 32}
                      textAnchor="end"
                      className="text-xs fill-gray-600"
                    >
                      {formatCurrency((maxRevenue / 4) * i)}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">Conversion Rate</h3>
                  <p className="text-sm text-gray-600">Leads → Projects</p>
                </div>
                <Target className="h-5 w-5 text-[#FF6B00]" />
              </div>
              
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#FF6B00"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${conversionRate * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#2D2D2D]">{conversionRate}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">33 projects from 47 leads</p>
              </div>
            </div>

            {/* Top Shoot Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">Top Shoot Types</h3>
                  <p className="text-sm text-gray-600">This month</p>
                </div>
                <Camera className="h-5 w-5 text-[#00BCEB]" />
              </div>
              
              <div className="space-y-4">
                {shootTypeData.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <span className="text-sm font-medium text-[#2D2D2D]">{type.type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{type.count}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${type.percentage}%`,
                            backgroundColor: type.color
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-[#2D2D2D] w-8">{type.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposal Approval Time */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">Proposal Approval</h3>
                  <p className="text-sm text-gray-600">Average response time</p>
                </div>
                <Clock className="h-5 w-5 text-[#FF6B00]" />
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-[#2D2D2D] mb-2">{avgApprovalDays}</div>
                <div className="text-sm text-gray-600 mb-4">days to approve</div>
                
                <div className="space-y-2">
                  {['Oct', 'Nov', 'Dec', 'Jan'].map((month, index) => {
                    const days = [4.1, 3.8, 2.9, 3.2][index];
                    const width = (days / 5) * 100;
                    return (
                      <div key={month} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 w-8">{month}</span>
                        <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 bg-[#FF6B00] rounded-full transition-all duration-500"
                            style={{ width: `${width}%` }}
                          ></div>
                        </div>
                        <span className="text-[#2D2D2D] w-8">{days}d</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Performing Team Members */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">Top Performing Team Members</h3>
                  <p className="text-sm text-gray-600">This quarter</p>
                </div>
                <Award className="h-5 w-5 text-[#00BCEB]" />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Projects</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMemberData.map((member, index) => {
                      const maxProjects = Math.max(...teamMemberData.map(m => m.completedProjects));
                      const performanceWidth = (member.completedProjects / maxProjects) * 100;
                      
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-[#00BCEB]/10 rounded-full flex items-center justify-center mr-3">
                                <span className="text-[#00BCEB] font-medium text-sm">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="font-medium text-[#2D2D2D]">{member.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{member.role}</td>
                          <td className="py-3 px-4 text-sm font-medium text-[#2D2D2D]">{member.completedProjects}</td>
                          <td className="py-3 px-4 text-sm font-medium text-green-600">
                            {member.revenue > 0 ? formatFullCurrency(member.revenue) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 bg-[#00BCEB] rounded-full transition-all duration-500"
                                style={{ width: `${performanceWidth}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Analytics;