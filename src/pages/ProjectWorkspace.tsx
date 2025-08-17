import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  DollarSign, 
  FileText, 
  Upload, 
  Plus, 
  Edit3, 
  Save, 
  X, 
  Check, 
  Clock, 
  User, 
  Mail, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';

interface Project {
  id: string;
  projectId: string;
  proposalId: string;
  clientName: string;
  shootType: string;
  eventDate: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  venue: string;
  budget: number;
  notes: string;
  source: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface Deliverable {
  id: string;
  name: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
  uploadedFiles: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const GET_PROJECTS_URL = 'https://vxxl9b57z2.execute-api.eu-north-1.amazonaws.com/default/Get_Project_Details';
const GET_TEAM_MEMBERS_URL = 'https://w8jbbb972a.execute-api.eu-north-1.amazonaws.com/default/get_team_members';
const POST_PROJECT_DETAILS_URL = 'https://o264udykii.execute-api.eu-north-1.amazonaws.com/default/Post_Project_Deatils';

function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const isCreating = !id;
  const [isEditing, setIsEditing] = useState(isCreating);
  const [project, setProject] = useState<Project>({
    id: '',
    projectId: '',
    proposalId: '',
    clientName: '',
    shootType: '',
    eventDate: '',
    status: 'Upcoming',
    venue: '',
    budget: 0,
    notes: '',
    source: ''
  });
  const [loading, setLoading] = useState(!isCreating);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<TeamMember[]>([]);

  // State for new schedule item
  const [newSchedule, setNewSchedule] = useState<ScheduleItem>({
    id: '',
    title: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  // State for new deliverable
  const [newDeliverable, setNewDeliverable] = useState<Deliverable>({
    id: '',
    name: '',
    status: 'Pending',
    dueDate: '',
    uploadedFiles: 0
  });

  // State for new expense
  const [newExpense, setNewExpense] = useState<Expense>({
    id: '',
    description: '',
    amount: 0,
    category: '',
    date: ''
  });

  // Fetch project and related data
  useEffect(() => {
    if (isCreating) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(GET_PROJECTS_URL, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.status}`);
        }

        const data = await response.json();
        console.log('Project data response:', JSON.stringify(data, null, 2));
        const apiProjects = Array.isArray(data.projects) ? data.projects : [];
        const matchedProject = apiProjects.find((item: any) => item.projectId === id);

        if (!matchedProject) {
          throw new Error(`Project with ID ${id} not found`);
        }

        const mappedProject: Project = {
          id: matchedProject.projectId,
          projectId: matchedProject.projectId,
          proposalId: matchedProject.proposalId || '',
          clientName: matchedProject.clientName || '',
          shootType: matchedProject.shootType?.split(',')[0]?.trim() || '',
          eventDate: matchedProject.eventDate || '',
          status: mapStatus(matchedProject.eventDate, matchedProject.validUntil),
          venue: matchedProject.venue || 'Not specified',
          budget: matchedProject.totalAmount || 0,
          notes: matchedProject.notes || '',
          source: matchedProject.source || 'Not specified'
        };

        setProject(mappedProject);

        // Handle teamMembers (DynamoDB list format)
        const teamMembersData = matchedProject.teamMembers?.L
          ? matchedProject.teamMembers.L.map((item: any) => ({
              id: item.M.id?.S || '',
              name: item.M.name?.S || '',
              role: item.M.role?.S || '',
              email: item.M.email?.S || ''
            }))
          : [];
        console.log('Raw teamMembers from API:', matchedProject.teamMembers);
        console.log('Mapped teamMembers:', teamMembersData);
        setTeamMembers(teamMembersData);

        // Handle expenses (support both plain array and DynamoDB format)
        const expensesData = matchedProject.expenses?.L
          ? matchedProject.expenses.L.map((item: any) => ({
              id: item.M.id?.S || '',
              description: item.M.description?.S || '',
              amount: parseFloat(item.M.amount?.N || '0'),
              category: item.M.category?.S || '',
              date: item.M.date?.S || ''
            }))
          : Array.isArray(matchedProject.expenses)
          ? matchedProject.expenses.map((item: any) => ({
              id: item.id || '',
              description: item.description || '',
              amount: parseFloat(item.amount || '0'),
              category: item.category || '',
              date: item.date || ''
            }))
          : [];
        setExpenses(expensesData);

        // Handle schedule (DynamoDB list format)
        const scheduleData = matchedProject.schedule?.L
          ? matchedProject.schedule.L.map((item: any) => ({
              id: item.M.id?.S || '',
              title: item.M.title?.S || '',
              startTime: item.M.startTime?.S || '',
              endTime: item.M.endTime?.S || '',
              description: item.M.description?.S || ''
            }))
          : [];
        setSchedule(scheduleData);

        // Handle deliverables (support both plain array and DynamoDB format)
        const deliverablesData = matchedProject.deliverables?.L
          ? matchedProject.deliverables.L.map((item: any) => ({
              id: item.M.id?.S || '',
              name: item.M.name?.S || '',
              status: item.M.status?.S || 'Pending',
              dueDate: item.M.dueDate?.S || '',
              uploadedFiles: parseInt(item.M.uploadedFiles?.N || '0')
            }))
          : Array.isArray(matchedProject.deliverables)
          ? matchedProject.deliverables.map((item: any) => ({
              id: item.id || '',
              name: item.name || '',
              status: item.status || 'Pending',
              dueDate: item.dueDate || '',
              uploadedFiles: parseInt(item.uploadedFiles || '0')
            }))
          : [];
        setDeliverables(deliverablesData);
      } catch (err: any) {
        console.error('Error fetching project:', err);
        setError(`Failed to load project details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeamMembers = async () => {
      try {
        const response = await axios.get(GET_TEAM_MEMBERS_URL, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Team members response:', JSON.stringify(response.data, null, 2));
        const teamMembersData = Array.isArray(response.data.members) ? response.data.members : [];
        const mappedTeamMembers = teamMembersData.map((member: any) => ({
          id: member.uid,
          name: member.name,
          role: member.role,
          email: member.email
        }));
        setAvailableTeamMembers(mappedTeamMembers);
      } catch (err: any) {
        console.error('Error fetching team members:', err);
        setError(`Failed to load team members: ${err.message}`);
      }
    };

    fetchProject();
    fetchTeamMembers();
  }, [id, isCreating]);

  const mapStatus = (eventDate: string, validUntil: string): 'Upcoming' | 'In Progress' | 'Completed' => {
    const today = new Date();
    const event = new Date(eventDate);
    const valid = new Date(validUntil);

    if (today > event) {
      return 'Completed';
    } else if (today <= valid && today <= event) {
      return 'Upcoming';
    } else {
      return 'In Progress';
    }
  };

  // Function to update project details via POST API
  const updateProjectDetails = async (field: string, data: any[]) => {
    setLoading(true);
    setError(null);
    setUpdateStatus(null);

    try {
      const payload: any = {
        projectId: project.projectId,
        proposalId: project.proposalId
      };
      payload[field] = data;
      console.log('Sending POST payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(POST_PROJECT_DETAILS_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('POST response:', JSON.stringify(response.data, null, 2));
      if (response.data.success) {
        setUpdateStatus(`Successfully updated ${field}!`);
        if (field === 'expenses') setExpenses(data);
        if (field === 'schedule') setSchedule(data);
        if (field === 'deliverables') setDeliverables(data);
        if (field === 'teamMembers') setTeamMembers(data);
      } else {
        throw new Error(response.data.message || `Failed to update ${field}`);
      }
    } catch (err: any) {
      console.error(`Error updating ${field}:`, err);
      const errorMessage = err.response?.data?.message || err.message || `Failed to update ${field}`;
      setError(errorMessage);
      console.error('Full error response:', JSON.stringify(err.response?.data, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting an item from a list
  const handleDeleteItem = async (field: string, itemId: string) => {
    const updatedData = {
      expenses: expenses.filter((item) => item.id !== itemId),
      schedule: schedule.filter((item) => item.id !== itemId),
      deliverables: deliverables.filter((item) => item.id !== itemId),
      teamMembers: teamMembers.filter((item) => item.id !== itemId),
    }[field];

    if (updatedData) {
      await updateProjectDetails(field, updatedData);
    }
  };

  // Handle adding new schedule item
  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.startTime || !newSchedule.endTime) {
      setError('Please fill in all required schedule fields (title, start time, end time)');
      return;
    }
    const newId = `schedule-${Date.now()}`;
    const updatedSchedule = [...schedule, { ...newSchedule, id: newId }];
    await updateProjectDetails('schedule', updatedSchedule);
    setNewSchedule({ id: '', title: '', startTime: '', endTime: '', description: '' });
    setShowScheduleModal(false);
  };

  // Handle adding new deliverable
  const handleAddDeliverable = async () => {
    if (!newDeliverable.name || !newDeliverable.dueDate) {
      setError('Please fill in all required deliverable fields (name, due date)');
      return;
    }
    const newId = `deliverable-${Date.now()}`;
    const updatedDeliverables = [...deliverables, { ...newDeliverable, id: newId, uploadedFiles: newDeliverable.uploadedFiles || 0 }];
    await updateProjectDetails('deliverables', updatedDeliverables);
    setNewDeliverable({ id: '', name: '', status: 'Pending', dueDate: '', uploadedFiles: 0 });
    setShowDeliverableModal(false);
  };

  // Handle adding new expense
  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category || !newExpense.date) {
      setError('Please fill in all required expense fields (description, amount, category, date)');
      return;
    }
    const newId = `expense-${Date.now()}`;
    const updatedExpenses = [...expenses, { ...newExpense, id: newId }];
    await updateProjectDetails('expenses', updatedExpenses);
    setNewExpense({ id: '', description: '', amount: 0, category: '', date: '' });
    setShowExpenseModal(false);
  };

  // Handle assigning team member
  const handleAssignTeamMember = async (memberId: string) => {
    const member = availableTeamMembers.find(m => m.id === memberId);
    if (member && !teamMembers.find(m => m.id === memberId)) {
      const updatedTeamMembers = [...teamMembers, member];
      await updateProjectDetails('teamMembers', updatedTeamMembers);
      setShowAssignModal(false);
    }
  };

  const handleSaveProject = () => {
    setIsEditing(false);
    // In real app, save to backend
  };

  const handleMarkCompleted = () => {
    setProject(prev => ({ ...prev, status: 'Completed' }));
    // In real app, update status in backend
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-[#00BCEB] text-white';
      case 'In Progress': return 'bg-[#FF6B00] text-white';
      case 'Completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliverableStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600';
      case 'In Progress': return 'text-[#FF6B00]';
      case 'Pending': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'deliverables', label: 'Deliverables', icon: CheckCircle },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'finance', label: 'Finance', icon: DollarSign }
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00BCEB] mx-auto"></div>
          <p className="text-gray-500 text-lg mt-4">Loading project details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Project Overview</h3>
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-3 py-2 text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProject}
                      className="flex items-center px-3 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center px-3 py-2 bg-gray-100 text-[#2D2D2D] rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            {updateStatus && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
                {updateStatus}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Client Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={project.clientName}
                      onChange={(e) => setProject(prev => ({ ...prev, clientName: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB]"
                    />
                  ) : (
                    <p className="text-[#2D2D2D] font-medium">{project.clientName || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Budget</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={project.budget}
                      onChange={(e) => setProject(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB]"
                    />
                  ) : (
                    <p className="text-[#2D2D2D] font-medium">₹{project.budget.toLocaleString()}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Source</label>
                  {isEditing ? (
                    <select
                      value={project.source}
                      onChange={(e) => setProject(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB]"
                    >
                      <option value="">Select Source</option>
                      <option value="Website Lead">Website Lead</option>
                      <option value="Referral">Referral</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Walk-in">Walk-in</option>
                    </select>
                  ) : (
                    <p className="text-[#2D2D2D] font-medium">{project.source || '-'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Event Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={project.venue}
                      onChange={(e) => setProject(prev => ({ ...prev, venue: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB]"
                    />
                  ) : (
                    <p className="text-[#2D2D2D] font-medium">{project.venue || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Event Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={project.eventDate}
                      onChange={(e) => setProject(prev => ({ ...prev, eventDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB]"
                    />
                  ) : (
                    <p className="text-[#2D2D2D] font-medium">
                      {project.eventDate
                        ? new Date(project.eventDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Project ID</label>
                  <p className="text-[#2D2D2D] font-medium">{project.projectId || '-'}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Notes</label>
              {isEditing ? (
                <textarea
                  value={project.notes}
                  onChange={(e) => setProject(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] resize-none"
                />
              ) : (
                <p className="text-[#2D2D2D] leading-relaxed">{project.notes || '-'}</p>
              )}
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Event Schedule</h3>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Block
              </button>
            </div>
            {updateStatus && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
                {updateStatus}
              </div>
            )}
            <div className="space-y-4">
              {!Array.isArray(schedule) || schedule.length === 0 ? (
                <p className="text-gray-600">No schedule items added yet.</p>
              ) : (
                schedule.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[#2D2D2D]">{item.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{item.startTime} - {item.endTime}</span>
                        <button
                          onClick={() => handleDeleteItem('schedule', item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Assigned Team</h3>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Crew
              </button>
            </div>
            {updateStatus && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
                {updateStatus}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!Array.isArray(teamMembers) || teamMembers.length === 0 ? (
                <p className="text-gray-600">No team members assigned yet.</p>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#00BCEB]/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-[#00BCEB]" />
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-[#2D2D2D]">{member.name}</h4>
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-[#FF6B00]/10 text-[#FF6B00] rounded-full">
                            {member.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem('teamMembers', member.id)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'deliverables':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Project Deliverables</h3>
              <button
                onClick={() => setShowDeliverableModal(true)}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </button>
            </div>
            {updateStatus && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
                {updateStatus}
              </div>
            )}
            <div className="space-y-4">
              {!Array.isArray(deliverables) || deliverables.length === 0 ? (
                <p className="text-gray-600">No deliverables added yet.</p>
              ) : (
                deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          deliverable.status === 'Completed' ? 'bg-green-500' :
                          deliverable.status === 'In Progress' ? 'bg-[#FF6B00]' : 'bg-gray-300'
                        }`}></div>
                        <h4 className="font-semibold text-[#2D2D2D]">{deliverable.name}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getDeliverableStatusColor(deliverable.status)}`}>
                          {deliverable.status}
                        </span>
                        <button
                          onClick={() => handleDeleteItem('deliverables', deliverable.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Due: {new Date(deliverable.dueDate).toLocaleDateString()}
                        {deliverable.uploadedFiles > 0 && (
                          <span className="ml-4">Files: {deliverable.uploadedFiles}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center px-3 py-1 text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200">
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </button>
                        {deliverable.status !== 'Completed' && (
                          <button className="flex items-center px-3 py-1 text-green-600 hover:text-green-700 transition-colors duration-200">
                            <Check className="h-4 w-4 mr-1" />
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Project Gallery</h3>
              <button
                onClick={() => navigate(`/gallery/upload/${project.id}`)}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Gallery
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-[#2D2D2D] mb-2">Gallery Preview</h4>
              <p className="text-gray-600 mb-4">Upload and manage project photos and videos</p>
              <div className="flex items-center justify-center space-x-4">
                <button className="flex items-center px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Full Gallery
                </button>
              </div>
            </div>
          </div>
        );

      case 'finance':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Project Finance</h3>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </button>
            </div>
            {updateStatus && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
                {updateStatus}
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-[#2D2D2D] mb-4">Invoice Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#00BCEB]/5 rounded-lg">
                  <p className="text-2xl font-bold text-[#00BCEB]">₹{project.budget.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">₹{(project.budget / 2).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Paid</p>
                </div>
                <div className="text-center p-4 bg-[#FF6B00]/5 rounded-lg">
                  <p className="text-2xl font-bold text-[#FF6B00]">₹{(project.budget / 2).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-[#2D2D2D] mb-4">Project Expenses</h4>
              <div className="space-y-3">
                {!Array.isArray(expenses) || expenses.length === 0 ? (
                  <p className="text-gray-600">No expenses added yet.</p>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-[#2D2D2D]">{expense.description}</p>
                        <p className="text-sm text-gray-600">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#2D2D2D]">₹{expense.amount.toLocaleString()}</span>
                        <button
                          onClick={() => handleDeleteItem('expenses', expense.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#2D2D2D]">Total Expenses:</span>
                  <span className="font-bold text-[#FF6B00]">₹{expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header title="Project Workspace" sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-16 p-6">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#2D2D2D]">{project.clientName} – {project.shootType}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {project.eventDate
                      ? new Date(project.eventDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '-'}
                  </div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center px-4 py-2 border border-[#00BCEB] text-[#00BCEB] rounded-lg hover:bg-[#00BCEB] hover:text-white transition-colors duration-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign Crew
                </button>
                <button
                  onClick={() => navigate(`/gallery/upload/${project.id}`)}
                  className="flex items-center px-4 py-2 border border-[#FF6B00] text-[#FF6B00] rounded-lg hover:bg-[#FF6B00] hover:text-white transition-colors duration-200"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Gallery
                </button>
                {project.status !== 'Completed' && (
                  <button
                    onClick={handleMarkCompleted}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-[#00BCEB] text-[#00BCEB]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Assign Team Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Assign Team Member</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-3">
                {availableTeamMembers.length === 0 ? (
                  <p className="text-gray-600">No team members available.</p>
                ) : (
                  availableTeamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleAssignTeamMember(member.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-[#00BCEB] hover:bg-[#00BCEB]/5 transition-colors duration-200"
                    >
                      <div className="font-medium text-[#2D2D2D]">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.role}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Add Schedule Item</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Title</label>
                  <input
                    type="text"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">End Time</label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Description</label>
                  <textarea
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 bg-gray-100 text-[#2D2D2D] rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSchedule}
                    className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliverable Modal */}
      {showDeliverableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Add Deliverable</h3>
                <button
                  onClick={() => setShowDeliverableModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Name</label>
                  <input
                    type="text"
                    value={newDeliverable.name}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Status</label>
                  <select
                    value={newDeliverable.status}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, status: e.target.value as 'Pending' | 'In Progress' | 'Completed' }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newDeliverable.dueDate}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Uploaded Files</label>
                  <input
                    type="number"
                    value={newDeliverable.uploadedFiles}
                    onChange={(e) => setNewDeliverable(prev => ({ ...prev, uploadedFiles: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowDeliverableModal(false)}
                    className="px-4 py-2 bg-gray-100 text-[#2D2D2D] rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddDeliverable}
                    className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Add Expense</h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Amount</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  >
                    <option value="">Select Category</option>
                    <option value="Travel">Travel</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Date</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowExpenseModal(false)}
                    className="px-4 py-2 bg-gray-100 text-[#2D2D2D] rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExpense}
                    className="px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectWorkspace;