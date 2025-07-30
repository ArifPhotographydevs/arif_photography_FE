import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Send, 
  User, 
  Mail, 
  Calendar, 
  Shield,
  Camera,
  Eye,
  Settings,
  AlertCircle,
  Check
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Photographer' | 'Editor' | 'Viewer';
  lastLogin: string;
  avatar?: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

interface InviteData {
  email: string;
  role: 'Admin' | 'Photographer' | 'Editor' | 'Viewer';
  permissions: {
    leads: { view: boolean; edit: boolean; };
    projects: { view: boolean; edit: boolean; };
    gallery: { view: boolean; edit: boolean; };
    finance: { view: boolean; edit: boolean; };
    clients: { view: boolean; edit: boolean; };
  };
}

function TeamManagement() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [inviteData, setInviteData] = useState<InviteData>({
    email: '',
    role: 'Viewer',
    permissions: {
      leads: { view: true, edit: false },
      projects: { view: true, edit: false },
      gallery: { view: true, edit: false },
      finance: { view: false, edit: false },
      clients: { view: true, edit: false }
    }
  });

  // Mock team data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Arif Khan',
      email: 'arif@photography.com',
      role: 'Admin',
      lastLogin: '2024-03-20',
      status: 'Active'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya@photography.com',
      role: 'Photographer',
      lastLogin: '2024-03-19',
      status: 'Active'
    },
    {
      id: '3',
      name: 'Rahul Verma',
      email: 'rahul@photography.com',
      role: 'Editor',
      lastLogin: '2024-03-18',
      status: 'Active'
    },
    {
      id: '4',
      name: 'Sneha Patel',
      email: 'sneha@photography.com',
      role: 'Photographer',
      lastLogin: '2024-03-17',
      status: 'Active'
    },
    {
      id: '5',
      name: 'Amit Singh',
      email: 'amit@photography.com',
      role: 'Viewer',
      lastLogin: '2024-03-15',
      status: 'Pending'
    }
  ]);

  const roles = ['Admin', 'Photographer', 'Editor', 'Viewer'];
  const modules = [
    { key: 'leads', label: 'Leads', icon: User },
    { key: 'projects', label: 'Projects', icon: Camera },
    { key: 'gallery', label: 'Gallery', icon: Eye },
    { key: 'finance', label: 'Finance', icon: Settings },
    { key: 'clients', label: 'Clients', icon: User }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-[#00BCEB] text-white';
      case 'Photographer': return 'bg-[#FF6B00] text-white';
      case 'Editor': return 'bg-purple-500 text-white';
      case 'Viewer': return 'bg-gray-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return Shield;
      case 'Photographer': return Camera;
      case 'Editor': return Edit3;
      case 'Viewer': return Eye;
      default: return User;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600';
      case 'Pending': return 'text-yellow-600';
      case 'Inactive': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteChange = (field: string, value: any) => {
    setInviteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setInviteData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module as keyof typeof prev.permissions],
          [permission]: value
        }
      }
    }));
  };

  const handleSendInvite = () => {
    if (!inviteData.email) return;

    // Simulate sending invite
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteData.email.split('@')[0],
      email: inviteData.email,
      role: inviteData.role,
      lastLogin: 'Never',
      status: 'Pending'
    };

    setTeamMembers(prev => [...prev, newMember]);
    setShowInviteModal(false);
    setInviteData({
      email: '',
      role: 'Viewer',
      permissions: {
        leads: { view: true, edit: false },
        projects: { view: true, edit: false },
        gallery: { view: true, edit: false },
        finance: { view: false, edit: false },
        clients: { view: true, edit: false }
      }
    });
    showToastMessage('Invitation sent successfully!');
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  const confirmRemoveMember = () => {
    if (memberToRemove) {
      setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
      setShowRemoveModal(false);
      setMemberToRemove(null);
      showToastMessage('Team member removed successfully!');
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isInviteValid = () => {
    return inviteData.email.trim() !== '' && inviteData.email.includes('@');
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
        <Header title="Team Management" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Team Directory</h2>
              <p className="text-gray-600 mt-1">Manage your team members, roles, and permissions</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or role"
                className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => {
                    const RoleIcon = getRoleIcon(member.role);
                    return (
                      <tr 
                        key={member.id} 
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                              <span className="text-[#00BCEB] font-medium text-sm">
                                {getInitials(member.name)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-[#2D2D2D]">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-[#2D2D2D]">{member.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getStatusColor(member.status)}`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              {member.lastLogin === 'Never' ? 'Never' : new Date(member.lastLogin).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-2 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                              title="Edit Member"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {member.role !== 'Admin' && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Remove Member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No team members found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or invite new members</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredMembers.map((member) => {
              const RoleIcon = getRoleIcon(member.role);
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                        <span className="text-[#00BCEB] font-medium text-sm">
                          {getInitials(member.name)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-[#2D2D2D]">{member.name}</h3>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {member.role !== 'Admin' && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {member.role}
                    </span>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last login: {member.lastLogin === 'Never' ? 'Never' : new Date(member.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile Empty State */}
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No team members found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or invite new members</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => handleInviteChange('email', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => handleInviteChange('role', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <h4 className="text-lg font-semibold text-[#2D2D2D] mb-4">Permissions</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {modules.map((module) => {
                      const ModuleIcon = module.icon;
                      return (
                        <div key={module.key} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ModuleIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="font-medium text-[#2D2D2D]">{module.label}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={inviteData.permissions[module.key as keyof typeof inviteData.permissions].view}
                                onChange={(e) => handlePermissionChange(module.key, 'view', e.target.checked)}
                                className="w-4 h-4 text-[#00BCEB] bg-gray-100 border-gray-300 rounded focus:ring-[#00BCEB] focus:ring-2"
                              />
                              <span className="ml-2 text-sm text-gray-600">View</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={inviteData.permissions[module.key as keyof typeof inviteData.permissions].edit}
                                onChange={(e) => handlePermissionChange(module.key, 'edit', e.target.checked)}
                                className="w-4 h-4 text-[#00BCEB] bg-gray-100 border-gray-300 rounded focus:ring-[#00BCEB] focus:ring-2"
                              />
                              <span className="ml-2 text-sm text-gray-600">Edit</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={!isInviteValid()}
                  className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isInviteValid()
                      ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">Remove Team Member</h3>
                  <p className="text-gray-600">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-[#2D2D2D] mb-6">
                Are you sure you want to remove <strong>{memberToRemove.name}</strong> from the team?
              </p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowRemoveModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveMember}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors duration-200"
                >
                  Remove Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-2" />
            <p className="font-medium">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;