import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Camera, Users, Calendar, DollarSign, FileText, Plus, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import axios from 'axios';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVfur9ihXl8pRZwojTY-KPbyKvhAj2br4",
  authDomain: "arif-d49f9.firebaseapp.com",
  projectId: "arif-d49f9",
  storageBucket: "arif-d49f9.firebasestorage.app",
  messagingSenderId: "83214662234",
  appId: "1:83214662234:web:1ad3986dfcbc7a20447663",
  measurementId: "G-EPTJ3RLEV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface Lead {
  leadId: string;
  timestamp: string;
  // Other fields omitted for brevity
}

interface Project {
  projectId: string;
  status?: string; // Optional, assuming API may include status
  timestamp?: string; // Optional, for potential date filtering
  // Other fields omitted
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Employee';
  lastLogin: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

function Dashboard() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leadsToday, setLeadsToday] = useState<number | null>(null);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [activeProjects, setActiveProjects] = useState<number | null>(null);
  const [totalProjects, setTotalProjects] = useState<number | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [errorLeads, setErrorLeads] = useState<string | null>(null);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoadingLeads(true);
      setErrorLeads(null);
      try {
        console.log('Fetching leads from API');
        const response = await fetch('https://sk8wa56suc.execute-api.eu-north-1.amazonaws.com/GetAllLeads', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`Leads API request failed with status ${response.status}`);
        }
        const data = await response.json();
        console.log('Leads data received:', data);

        if (!data.success || !Array.isArray(data.leads)) {
          throw new Error('Invalid leads API response format');
        }

        const leads: Lead[] = data.leads;
        setTotalLeads(leads.length);

        // Filter leads for today (August 03, 2025)
        const today = new Date('2025-08-03').toISOString().split('T')[0];
        const leadsTodayCount = leads.filter(lead => 
          lead.timestamp && lead.timestamp.split('T')[0] === today
        ).length;
        setLeadsToday(leadsTodayCount);
      } catch (err: any) {
        console.error('Error fetching leads:', err.message);
        setErrorLeads('Failed to load leads. Please try again later.');
        setLeadsToday(0);
        setTotalLeads(0);
      } finally {
        setIsLoadingLeads(false);
      }
    };

    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      setErrorProjects(null);
      try {
        console.log('Fetching projects from API');
        const response = await fetch('https://tyw8vzo0cg.execute-api.eu-north-1.amazonaws.com/default/getproject', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`Projects API request failed with status ${response.status}`);
        }
        const data = await response.json();
        console.log('Projects data received:', data);

        if (!data.success || !Array.isArray(data.projects)) {
          throw new Error('Invalid projects API response format');
        }

        const projects: Project[] = data.projects;
        setTotalProjects(projects.length);
        // Filter for active projects if status field exists, else use total count
        const activeProjectsCount = projects.filter(project => 
          project.status ? project.status.toLowerCase() === 'active' : true
        ).length;
        setActiveProjects(activeProjectsCount);
      } catch (err: any) {
        console.error('Error fetching projects:', err.message);
        setErrorProjects('Failed to load projects. Please try again later.');
        setActiveProjects(0);
        setTotalProjects(0);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    const fetchTeamMembers = async () => {
      try {
        const response = await axios.get('https://w8jbbb972a.execute-api.eu-north-1.amazonaws.com/default/get_team_members');
        if (response.data.members) {
          const members: TeamMember[] = response.data.members.map(member => ({
            id: member.uid,
            name: member.name,
            email: member.email,
            role: member.role,
            lastLogin: member.last_login || 'Never',
            status: member.status || 'Pending'
          }));
          setTeamMembers(members);

          // Set userName based on the current user's ID
          const currentUser = auth.currentUser;
          if (currentUser) {
            const currentMember = members.find(m => m.id === currentUser.uid);
            if (currentMember) {
              setUserName(currentMember.name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };

    fetchLeads();
    fetchProjects();
    fetchTeamMembers();

    // Keep auth listener for initial setup or fallback
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.displayName);
      if (user && !userName) { // Only set if not already set by API
        setUserName(user.displayName);
      }
    });

    return () => unsubscribe();
  }, []);

  const statsCards = [
    {
      title: 'Leads Today',
      value: isLoadingLeads ? <Loader2 className="h-6 w-6 animate-spin" /> : leadsToday !== null ? leadsToday.toString() : 'N/A',
      icon: Users,
      color: 'text-[#00BCEB]',
      bgColor: 'bg-[#00BCEB]/10',
      change: leadsToday !== null ? `+${Math.min(leadsToday, 3)} from yesterday` : 'Loading...',
      link: '/leads'
    },
    {
      title: 'Total Leads',
      value: isLoadingLeads ? <Loader2 className="h-6 w-6 animate-spin" /> : totalLeads !== null ? totalLeads.toString() : 'N/A',
      icon: Users,
      color: 'text-[#00BCEB]',
      bgColor: 'bg-[#00BCEB]/10',
      change: totalLeads !== null ? `${totalLeads} leads in system` : 'Loading...',
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
      title: 'Active Projects',
      value: isLoadingProjects ? <Loader2 className="h-6 w-6 animate-spin" /> : activeProjects !== null ? activeProjects.toString() : 'N/A',
      icon: FileText,
      color: 'text-[#00BCEB]',
      bgColor: 'bg-[#00BCEB]/10',
      change: activeProjects !== null ? `${Math.min(activeProjects, 6)} in editing phase` : 'Loading...',
      link: '/projects'
    },
    {
      title: 'Total Projects',
      value: isLoadingProjects ? <Loader2 className="h-6 w-6 animate-spin" /> : totalProjects !== null ? totalProjects.toString() : 'N/A',
      icon: FileText,
      color: 'text-[#00BCEB]',
      bgColor: 'bg-[#00BCEB]/10',
      change: totalProjects !== null ? `${totalProjects} projects in system` : 'Loading...',
      link: '/projects'
    }
  ];

  const quickActions = [
    { name: 'Add Lead', icon: Plus, path: '/leads', primary: true },
    { name: 'Create Proposal', icon: FileText, path: '/proposals', primary: false },
    { name: 'Upload Gallery', icon: Camera, path: '/gallery', primary: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        Header
        <Header title="Dashboard" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Dashboard Content */}
        <main className="pt-16 p-6">
          {/* Error Messages */}
          {(errorLeads || errorProjects) && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {errorLeads && <p>{errorLeads}</p>}
              {errorProjects && <p>{errorProjects}</p>}
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2">Welcome back{userName ? `, ${userName}!` : '!'} 👋</h2>
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
                    onClick={() => navigate(action.path)}
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
                  onClick={() => navigate(card.link)}
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

          
          
        </main>
      </div>
    </div>
  );
}

export default Dashboard;