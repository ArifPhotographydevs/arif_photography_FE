import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Send, 
  Trash2, 
  X, 
  Save, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  CreditCard,
  MessageCircle,
  Mail,
  Check,
  AlertCircle
} from 'lucide-react';

interface Invoice {
  id: string;
  projectTitle: string;
  clientName: string;
  amount: number;
  invoiceDate: string;
  status: 'Paid' | 'Unpaid';
  dueDate: string;
}

interface Payment {
  id: string;
  clientName: string;
  projectTitle: string;
  amount: number;
  method: 'Stripe' | 'Razorpay' | 'Cash' | 'Bank Transfer';
  dateReceived: string;
}

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  linkedProject: string;
  date: string;
  notes?: string;
}

interface ExpenseFormData {
  title: string;
  category: string;
  amount: number;
  linkedProject: string;
  notes: string;
}

function Finance() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('invoices');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>({
    title: '',
    category: '',
    amount: 0,
    linkedProject: '',
    notes: ''
  });

  // Mock data
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      projectTitle: 'Sarah & John Wedding',
      clientName: 'Sarah Johnson',
      amount: 125000,
      invoiceDate: '2024-03-10',
      status: 'Paid',
      dueDate: '2024-03-25'
    },
    {
      id: '2',
      projectTitle: 'Raj Pre-Wedding Shoot',
      clientName: 'Raj Patel',
      amount: 75000,
      invoiceDate: '2024-03-12',
      status: 'Unpaid',
      dueDate: '2024-03-27'
    },
    {
      id: '3',
      projectTitle: 'Emma Maternity Session',
      clientName: 'Emma Wilson',
      amount: 45000,
      invoiceDate: '2024-03-08',
      status: 'Paid',
      dueDate: '2024-03-23'
    },
    {
      id: '4',
      projectTitle: 'Corporate Event - TechCorp',
      clientName: 'TechCorp Solutions',
      amount: 85000,
      invoiceDate: '2024-03-15',
      status: 'Unpaid',
      dueDate: '2024-03-30'
    }
  ]);

  const [payments] = useState<Payment[]>([
    {
      id: '1',
      clientName: 'Sarah Johnson',
      projectTitle: 'Sarah & John Wedding',
      amount: 125000,
      method: 'Stripe',
      dateReceived: '2024-03-16'
    },
    {
      id: '2',
      clientName: 'Emma Wilson',
      projectTitle: 'Emma Maternity Session',
      amount: 45000,
      method: 'Razorpay',
      dateReceived: '2024-03-14'
    },
    {
      id: '3',
      clientName: 'Arjun Kumar',
      projectTitle: 'Portrait Session',
      amount: 35000,
      method: 'Cash',
      dateReceived: '2024-03-12'
    },
    {
      id: '4',
      clientName: 'Priya Sharma',
      projectTitle: 'Anniversary Shoot',
      amount: 55000,
      method: 'Bank Transfer',
      dateReceived: '2024-03-10'
    }
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      title: 'Travel to Goa',
      category: 'Travel',
      amount: 8000,
      linkedProject: 'Sarah & John Wedding',
      date: '2024-03-14'
    },
    {
      id: '2',
      title: 'Equipment Rental',
      category: 'Equipment',
      amount: 5000,
      linkedProject: 'Corporate Event - TechCorp',
      date: '2024-03-15'
    },
    {
      id: '3',
      title: 'Freelancer Payment',
      category: 'Freelancer',
      amount: 12000,
      linkedProject: 'Raj Pre-Wedding Shoot',
      date: '2024-03-13'
    },
    {
      id: '4',
      title: 'Studio Rent',
      category: 'Overhead',
      amount: 25000,
      linkedProject: 'General',
      date: '2024-03-01'
    }
  ]);

  const tabs = [
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: DollarSign }
  ];

  const expenseCategories = ['Travel', 'Equipment', 'Freelancer', 'Overhead', 'Marketing', 'Software'];
  const projects = ['Sarah & John Wedding', 'Raj Pre-Wedding Shoot', 'Emma Maternity Session', 'Corporate Event - TechCorp', 'General'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Unpaid': return 'bg-[#FF6B00]/10 text-[#FF6B00]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'Stripe': return 'bg-purple-100 text-purple-800';
      case 'Razorpay': return 'bg-blue-100 text-blue-800';
      case 'Cash': return 'bg-green-100 text-green-800';
      case 'Bank Transfer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const calculateTotals = () => {
    const totalReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPending = invoices
      .filter(invoice => invoice.status === 'Unpaid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    return { totalReceived, totalPending };
  };

  const handleExpenseFormChange = (field: string, value: any) => {
    setExpenseFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddExpense = () => {
    if (!expenseFormData.title || !expenseFormData.category || expenseFormData.amount <= 0) {
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      title: expenseFormData.title,
      category: expenseFormData.category,
      amount: expenseFormData.amount,
      linkedProject: expenseFormData.linkedProject || 'General',
      date: new Date().toISOString().split('T')[0],
      notes: expenseFormData.notes
    };

    setExpenses(prev => [newExpense, ...prev]);
    setShowExpenseModal(false);
    setExpenseFormData({
      title: '',
      category: '',
      amount: 0,
      linkedProject: '',
      notes: ''
    });
    showToastMessage('Expense added successfully!');
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    showToastMessage('Expense deleted successfully!');
  };

  const handleSendInvoice = (invoiceId: string, method: 'email' | 'whatsapp') => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      showToastMessage(`Invoice sent via ${method} to ${invoice.clientName}!`);
    }
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isExpenseFormValid = () => {
    return expenseFormData.title.trim() !== '' && 
           expenseFormData.category !== '' && 
           expenseFormData.amount > 0;
  };

  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      searchFields.some(field =>
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const filteredInvoices = filterData(invoices, ['projectTitle', 'clientName']);
  const filteredPayments = filterData(payments, ['clientName', 'projectTitle']);
  const filteredExpenses = filterData(expenses, ['title', 'category', 'linkedProject']);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'invoices':
        return (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoices..."
                  className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                />
              </div>
              <button
                onClick={() => alert('Create Invoice - Feature coming soon!')}
                className="flex items-center px-4 py-2 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-[#2D2D2D]">{invoice.projectTitle}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-[#2D2D2D]">{invoice.clientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-semibold text-[#2D2D2D]">{formatCurrency(invoice.amount)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-2 text-[#00BCEB] hover:text-[#00A5CF] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-[#FF6B00] hover:text-[#e55a00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200"
                              title="Edit Invoice"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleSendInvoice(invoice.id, 'email')}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="Send via Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleSendInvoice(invoice.id, 'whatsapp')}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="Send via WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[#2D2D2D]">{invoice.projectTitle}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client:</span>
                      <span className="text-[#2D2D2D]">{invoice.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-[#2D2D2D]">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-[#2D2D2D]">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <button className="p-2 text-[#00BCEB] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-[#FF6B00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleSendInvoice(invoice.id, 'email')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payments':
        const { totalReceived, totalPending } = calculateTotals();
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Received</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-[#FF6B00]" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-[#FF6B00]">{formatCurrency(totalPending)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search payments..."
                className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
              />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-[#2D2D2D]">{payment.clientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-[#2D2D2D]">{payment.projectTitle}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getMethodColor(payment.method)}`}>
                            {payment.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">{new Date(payment.dateReceived).toLocaleDateString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[#2D2D2D]">{payment.clientName}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(payment.method)}`}>
                      {payment.method}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project:</span>
                      <span className="text-[#2D2D2D]">{payment.projectTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-[#2D2D2D]">{new Date(payment.dateReceived).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search expenses..."
                  className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                />
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-[#e55a00] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-[#2D2D2D]">{expense.title}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-semibold text-red-600">{formatCurrency(expense.amount)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-[#2D2D2D]">{expense.linkedProject}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-2 text-[#FF6B00] hover:text-[#e55a00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200"
                              title="Edit Expense"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete Expense"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[#2D2D2D]">{expense.title}</h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {expense.category}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-red-600">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project:</span>
                      <span className="text-[#2D2D2D]">{expense.linkedProject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="text-[#2D2D2D]">{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <button className="p-2 text-[#FF6B00] hover:bg-[#FF6B00]/10 rounded-lg transition-colors duration-200">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
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
        <Header title="Finance Center" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#2D2D2D]">Finance Center</h2>
            <p className="text-gray-600 mt-1">Track your invoices, payments, and expenses</p>
          </div>

          {/* Tabbed Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSearchTerm(''); // Clear search when switching tabs
                      }}
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

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#2D2D2D]">Add Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Expense Title */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Expense Title *
                </label>
                <input
                  type="text"
                  value={expenseFormData.title}
                  onChange={(e) => handleExpenseFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                  placeholder="Enter expense title"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Category *
                </label>
                <select
                  value={expenseFormData.category}
                  onChange={(e) => handleExpenseFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">Select category</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={expenseFormData.amount || ''}
                    onChange={(e) => handleExpenseFormChange('amount', parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Linked Project */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Linked Project
                </label>
                <select
                  value={expenseFormData.linkedProject}
                  onChange={(e) => handleExpenseFormChange('linkedProject', e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200"
                >
                  <option value="">Select project</option>
                  {projects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={expenseFormData.notes}
                  onChange={(e) => handleExpenseFormChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg text-[#2D2D2D] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BCEB] focus:border-[#00BCEB] transition-all duration-200 resize-none"
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-[#2D2D2D] bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={!isExpenseFormValid()}
                  className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isExpenseFormValid()
                      ? 'bg-[#FF6B00] text-white hover:bg-[#e55a00] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Expense
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

export default Finance;