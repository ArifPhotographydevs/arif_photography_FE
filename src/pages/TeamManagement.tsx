import React, { useState, useEffect } from 'react';
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
  Check,
  Lock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Employee';
  lastLogin: string;
  avatar?: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

interface InviteData {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Employee';
  permissions: {
    leads: { view: boolean; edit: boolean; };
    projects: { view: boolean; edit: boolean; };
    gallery: { view: boolean; edit: boolean; };
    finance: { view: boolean; edit: boolean; };
    clients: { view: boolean; edit: boolean; };
  };
}

interface EditData {
  name: string;
  email: string;
  role: 'Admin' | 'Employee';
  status: 'Active' | 'Pending' | 'Inactive';
  password?: string; // Optional password field
}

function TeamManagement() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [inviteData, setInviteData] = useState<InviteData>({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    permissions: {
      leads: { view: true, edit: false },
      projects: { view: true, edit: false },
      gallery: { view: true, edit: false },
      finance: { view: false, edit: false },
      clients: { view: true, edit: false }
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Fetch team members from API on mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await axios.get('https://w8jbbb972a.execute-api.eu-north-1.amazonaws.com/default/get_team_members');
        if (response.data.members) {
          setTeamMembers(response.data.members.map(member => ({
            id: member.uid,
            name: member.name,
            email: member.email,
            role: member.role,
            lastLogin: member.last_login || 'Never',
            status: member.status || 'Pending'
          })));
        }
      } catch (error) {
        showToastMessage('Failed to fetch team members', 'error');
        console.error('Error fetching team members:', error);
      }
    };

    fetchTeamMembers();
  }, []);

  // Sync status and last login on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const currentDate = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        const uid = user.uid;

        const memberToUpdate = teamMembers.find(m => m.id === uid);
        if (memberToUpdate && memberToUpdate.status !== 'Active') {
          try {
            await axios.put('https://8467nw8mtk.execute-api.eu-north-1.amazonaws.com/default/update_team_member', {
              uid: uid,
              status: 'Active',
              last_login: currentDate
            }, {
              headers: { 'Content-Type': 'application/json' }
            });
            setTeamMembers(prev => prev.map(m =>
              m.id === uid ? { ...m, status: 'Active', lastLogin: currentDate } : m
            ));
            showToastMessage('Last login updated successfully!');
          } catch (error) {
            showToastMessage('Failed to update last login', 'error');
            console.error('Error updating last login:', error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [teamMembers]);

  const roles = ['Admin', 'Employee'];
  const statuses = ['Active', 'Pending', 'Inactive'];
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
      case 'Employee': return 'bg-[#FF6B00] text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return Shield;
      case 'Employee': return User;
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): { [key: string]: string } => {
    const errors: { [key: string]: string } = {};
    if (!inviteData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!inviteData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(inviteData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!inviteData.password) {
      errors.password = 'Password is required';
    } else if (inviteData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    return errors;
  };

  const handleSendInvite = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showToastMessage(Object.values(validationErrors)[0], 'error');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inviteData.email,
        inviteData.password
      );

      await updateProfile(userCredential.user, {
        displayName: inviteData.name
      });

      const uid = userCredential.user.uid;

      const response = await axios.post('https://jrrcvd61r1.execute-api.eu-north-1.amazonaws.com/default/post_team_member', {
        uid: uid,
        email: inviteData.email,
        name: inviteData.name,
        role: inviteData.role,
        status: 'Pending',
        last_login: 'Never'
      });

      if (response.data.message === 'Team member added successfully') {
        const newMember: TeamMember = {
          id: uid,
          name: inviteData.name,
          email: inviteData.email,
          role: inviteData.role,
          lastLogin: 'Never',
          status: 'Pending'
        };

        setTeamMembers(prev => [...prev, newMember]);
        setShowInviteModal(false);
        setInviteData({
          name: '',
          email: '',
          password: '',
          role: 'Employee',
          permissions: {
            leads: { view: true, edit: false },
            projects: { view: true, edit: false },
            gallery: { view: true, edit: false },
            finance: { view: false, edit: false },
            clients: { view: true, edit: false }
          }
        });
        showToastMessage('Invitation sent successfully!');
      } else {
        throw new Error('Failed to add team member to database');
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred while sending the invitation';
      if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      showToastMessage(errorMessage, 'error');
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    setShowRemoveModal(true);
  };

  const confirmRemoveMember = async () => {
    if (memberToRemove) {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Please sign in to perform this action');
        }

        const currentUserMember = teamMembers.find(m => m.id === currentUser.uid);
        if (!currentUserMember || currentUserMember.role !== 'Admin') {
          throw new Error('Only Admins can remove team members');
        }

        const response = await axios.delete('https://2469wnqdei.execute-api.eu-north-1.amazonaws.com/default/delete_team_member', {
          data: { 
            email: memberToRemove.email,
            uid: memberToRemove.id
          },
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.message === 'Team member deleted successfully') {
          setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
          setShowRemoveModal(false);
          setMemberToRemove(null);
          showToastMessage('Team member deleted successfully!');
        } else {
          throw new Error(response.data.message || 'Delete operation failed');
        }
      } catch (error) {
        let errorMessage = 'Failed to remove team member';
        if (error.response && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        showToastMessage(errorMessage, 'error');
        console.error('Error removing team member:', error);
      }
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setMemberToEdit(member);
    setEditData({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field: keyof EditData, value: string) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const saveEditChanges = async () => {
    if (memberToEdit && editData) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === memberToEdit.id) {
          console.log('Updating Firebase displayName to:', editData.name);
          await updateProfile(currentUser, {
            displayName: editData.name
          });
          await auth.currentUser?.reload(); // Force refresh auth state
          console.log('Firebase displayName updated successfully');
        }

        const payload = {
          uid: memberToEdit.id,
          name: editData.name,
          email: editData.email,
          role: editData.role,
          status: editData.status,
          password: editData.password || undefined
        };
        const response = await axios.put('https://8467nw8mtk.execute-api.eu-north-1.amazonaws.com/default/update_team_member', payload, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.message === 'Team member updated successfully') {
          setTeamMembers(prev => prev.map(m =>
            m.id === memberToEdit.id ? { ...m, ...editData } : m
          ));
          // Refresh Dashboard data
          window.location.reload(); // Temporary reload to sync state
          setShowEditModal(false);
          setMemberToEdit(null);
          setEditData(null);
          showToastMessage('Team member updated successfully!');
        } else {
          throw new Error(response.data.message || 'Update operation failed');
        }
      } catch (error) {
        showToastMessage('Failed to update team member', 'error');
        console.error('Error updating team member:', error);
      }
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isInviteValid = () => {
    return (
      inviteData.name.trim() !== '' &&
      inviteData.email.trim() !== '' &&
      validateEmail(inviteData.email) &&
      inviteData.password.length >= 6
    );
  };

  const isEditValid = () => {
    return editData && editData.name.trim() !== '' && validateEmail(editData.email);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <Header title="Team Management" sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-16 p-6">
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
                              {member.lastLogin}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditMember(member)}
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
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No team members found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or invite new members</p>
              </div>
            )}
          </div>
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
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-2 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                      >
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
                        Last login: {member.lastLogin}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Invite Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={inviteData.name}
                      onChange={(e) => handleInviteChange('name', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
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
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={inviteData.password}
                      onChange={(e) => handleInviteChange('password', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter password"
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
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
      {showEditModal && memberToEdit && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Edit Team Member</h3>
              <button
                onClick={() => { setShowEditModal(false); setMemberToEdit(null); setEditData(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
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
                      value={editData.email}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Password (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={editData.password || ''}
                      onChange={(e) => handleEditChange('password', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                      placeholder="Enter new password (optional)"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Role *
                  </label>
                  <select
                    value={editData.role}
                    onChange={(e) => handleEditChange('role', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                    Status *
                  </label>
                  <select
                    value={editData.status}
                    onChange={(e) => handleEditChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => { setShowEditModal(false); setMemberToEdit(null); setEditData(null); }}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditChanges}
                  disabled={!isEditValid()}
                  className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isEditValid()
                      ? 'bg-[#00BCEB] text-white hover:bg-[#00A5CF] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showToast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
          toastMessage.includes('successfully') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
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