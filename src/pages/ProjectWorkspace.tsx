import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Camera, 
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
  Phone, 
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
  phone: string;
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

function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const isCreating = !id;
  const [isEditing, setIsEditing] = useState(isCreating);
  const [project, setProject] = useState<Project>({
    id: '',
    projectId: '',
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

  const GET_PROJECTS_URL = 'https://vxxl9b57z2.execute-api.eu-north-1.amazonaws.com/default/Get_Project_Details';

  useEffect(() => {
    if (isCreating) return; // Skip fetch for new project creation

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
        const apiProjects = Array.isArray(data.projects) ? data.projects : [];
        const matchedProject = apiProjects.find((item: any) => item.projectId === id);

        if (!matchedProject) {
          throw new Error(`Project with ID ${id} not found`);
        }

        // Map API data to Project interface
        const mappedProject: Project = {
          id: matchedProject.projectId,
          projectId: matchedProject.projectId,
          clientName: matchedProject.clientName,
          shootType: matchedProject.shootType.split(',')[0].trim(), // Use first shoot type
          eventDate: matchedProject.eventDate,
          status: mapStatus(matchedProject.eventDate, matchedProject.validUntil),
          venue: matchedProject.venue || 'Not specified', // Fallback if venue is missing
          budget: matchedProject.totalAmount,
          notes: matchedProject.notes,
          source: matchedProject.source || 'Not specified' // Fallback if source is missing
        };

        setProject(mappedProject);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, isCreating]);

  // Map API status to UI status based on eventDate and validUntil
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

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Arif Khan',
      role: 'Lead Photographer',
      phone: '+91 98765 43210',
      email: 'arif@photography.com'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      role: 'Assistant Photographer',
      phone: '+91 87654 32109',
      email: 'priya@photography.com'
    }
  ]);

  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    {
      id: '1',
      title: 'Pre-Wedding Consultation',
      startTime: '10:00',
      endTime: '11:00',
      description: 'Meet with couple to discuss timeline and preferences'
    },
    {
      id: '2',
      title: 'Ceremony Coverage',
      startTime: '16:00',
      endTime: '18:00',
      description: 'Main wedding ceremony photography'
    },
    {
      id: '3',
      title: 'Reception Coverage',
      startTime: '19:00',
      endTime: '23:00',
      description: 'Reception party and celebration photography'
    }
  ]);

  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    {
      id: '1',
      name: 'Raw Photos',
      status: 'Completed',
      dueDate: '2024-03-16',
      uploadedFiles: 450
    },
    {
      id: '2',
      name: 'Edited Photos',
      status: 'In Progress',
      dueDate: '2024-04-01',
      uploadedFiles: 120
    },
    {
      id: '3',
      name: 'Wedding Album',
      status: 'Pending',
      dueDate: '2024-04-15',
      uploadedFiles: 0
    },
    {
      id: '4',
      name: 'Highlight Reel',
      status: 'Pending',
      dueDate: '2024-04-10',
      uploadedFiles: 0
    }
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      description: 'Travel to Goa',
      amount: 8000,
      category: 'Travel',
      date: '2024-03-14'
    },
    {
      id: '2',
      description: 'Equipment Rental',
      amount: 5000,
      category: 'Equipment',
      date: '2024-03-15'
    }
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'deliverables', label: 'Deliverables', icon: CheckCircle },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'finance', label: 'Finance', icon: DollarSign }
  ];

  const availableTeamMembers = [
    { id: '3', name: 'Rahul Verma', role: 'Videographer' },
    { id: '4', name: 'Sneha Patel', role: 'Assistant' },
    { id: '5', name: 'Amit Singh', role: 'Drone Operator' }
  ];

  const handleSaveProject = () => {
    setIsEditing(false);
    // In real app, save to backend (e.g., call Post_Project_Creation API)
  };

  const handleAssignTeamMember = (memberId: string) => {
    const member = availableTeamMembers.find(m => m.id === memberId);
    if (member) {
      const newMember: TeamMember = {
        ...member,
        phone: '+91 98765 43210',
        email: `${member.name.toLowerCase().replace(' ', '.')}@photography.com`
      };
      setTeamMembers([...teamMembers, newMember]);
      setShowAssignModal(false);
    }
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
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-3 py-2 text-[#00BCEB] hover:text-[#00A5CF] transition-colors duration-200"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center space-x-2">
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
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Client Name */}
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

                {/* Budget */}
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

                {/* Source */}
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
                {/* Venue */}
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

                {/* Event Date */}
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

                {/* Project ID */}
                <div>
                  <label className="block text-sm font-medium text-[#2D2D2D] mb-2">Project ID</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={project.projectId}
                      onChange={(e) => setProject(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB]"
                    />
                  ) : (
                    <p className="text-[#2D2D2D] font-medium">{project.projectId || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
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
              <button className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Add Time Block
              </button>
            </div>

            <div className="space-y-4">
              {schedule.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[#2D2D2D]">{item.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{item.startTime} - {item.endTime}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member) => (
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
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {member.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {member.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'deliverables':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Project Deliverables</h3>
              <button className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#e55a00] transition-colors duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Add Deliverable
              </button>
            </div>

            <div className="space-y-4">
              {deliverables.map((deliverable) => (
                <div key={deliverable.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        deliverable.status === 'Completed' ? 'bg-green-500' :
                        deliverable.status === 'In Progress' ? 'bg-[#FF6B00]' : 'bg-gray-300'
                      }`}></div>
                      <h4 className="font-semibold text-[#2D2D2D]">{deliverable.name}</h4>
                    </div>
                    <span className={`text-sm font-medium ${getDeliverableStatusColor(deliverable.status)}`}>
                      {deliverable.status}
                    </span>
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
              ))}
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

            {/* Invoice Summary */}
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

            {/* Expenses */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-[#2D2D2D] mb-4">Project Expenses</h4>
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-[#2D2D2D]">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-[#2D2D2D]">₹{expense.amount.toLocaleString()}</span>
                      <button className="text-red-500 hover:text-red-700 transition-colors duration-200">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header title="Project Workspace" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center text-[#00BCEB] hover:text-[#00A5CF] mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </button>

          {/* Project Header */}
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

          {/* Tab Navigation */}
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

            {/* Tab Content */}
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
                {availableTeamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleAssignTeamMember(member.id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-[#00BCEB] hover:bg-[#00BCEB]/5 transition-colors duration-200"
                  >
                    <div className="font-medium text-[#2D2D2D]">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.role}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectWorkspace;