import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { FileText, DollarSign, Calendar, Plus, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceData {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
}

function InvoiceGenerator() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  const updateInvoiceData = (field: keyof InvoiceData, value: string) => {
    setInvoiceData({ ...invoiceData, [field]: value });
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = (subtotal: number, taxRate: number = 0.18) => {
    return subtotal * taxRate;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Invoice', 20, 20);
    doc.setFontSize(12);
    doc.text('Arif Photography', 20, 30);
    doc.text(`Invoice Date: ${invoiceData.invoiceDate}`, 140, 30);
    doc.text(`Due Date: ${invoiceData.dueDate || 'N/A'}`, 140, 40);

    doc.setFontSize(14);
    doc.text('Billed To:', 20, 60);
    doc.setFontSize(12);
    doc.text(invoiceData.clientName || 'Client Name', 20, 70);
    doc.text(invoiceData.clientEmail || 'Client Email', 20, 80);
    doc.text(invoiceData.clientAddress || 'Client Address', 20, 90);

    doc.setFontSize(12);
    let y = 110;
    doc.text('Description', 20, y);
    doc.text('Qty', 100, y);
    doc.text('Unit Price', 130, y);
    doc.text('Total', 170, y);
    doc.line(20, y + 5, 190, y + 5);

    y += 15;
    invoiceData.items.forEach((item) => {
      doc.text(item.description || 'Item', 20, y);
      doc.text(item.quantity.toString(), 100, y);
      doc.text(formatCurrency(item.unitPrice), 130, y);
      doc.text(formatCurrency(item.quantity * item.unitPrice), 170, y);
      y += 10;
    });

    y += 10;
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 130, y);
    doc.text(`Tax (18%): ${formatCurrency(tax)}`, 130, y + 10);
    doc.setFontSize(14);
    doc.text(`Total: ${formatCurrency(total)}`, 130, y + 25);

    doc.save(`invoice_${invoiceData.invoiceDate}.pdf`);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <Header title="Invoice Generator" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Create Invoice</h2>
            <p className="text-gray-600">Generate professional invoices for your clients</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4 flex items-center">
                <FileText className="h-5 w-5 text-[#00BCEB] mr-2" />
                Invoice Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={invoiceData.clientName}
                    onChange={(e) => updateInvoiceData('clientName', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                    placeholder="Enter client name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Client Email</label>
                  <input
                    type="email"
                    value={invoiceData.clientEmail}
                    onChange={(e) => updateInvoiceData('clientEmail', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                    placeholder="Enter client email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Client Address</label>
                  <textarea
                    value={invoiceData.clientAddress}
                    onChange={(e) => updateInvoiceData('clientAddress', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                    placeholder="Enter client address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceData.invoiceDate}
                      onChange={(e) => updateInvoiceData('invoiceDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => updateInvoiceData('dueDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#2D2D2D] mb-2">Items</h4>
                  {invoiceData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                        className="w-20 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="Unit Price"
                        className="w-24 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                      />
                      {invoiceData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addItem}
                    className="mt-2 flex items-center text-[#00BCEB] hover:text-[#0095c8]"
                  >
                    <Plus className="h-5 w-5 mr-1" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#2D2D2D] flex items-center">
                  <DollarSign className="h-5 w-5 text-[#00BCEB] mr-2" />
                  Invoice Preview
                </h3>
                <button
                  onClick={downloadPDF}
                  className="flex items-center bg-[#00BCEB] text-white px-4 py-2 rounded-lg hover:bg-[#0095c8] transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-[#2D2D2D]">Invoice</h4>
                    <p className="text-sm text-gray-600">Your Company Name</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#2D2D2D]">Invoice Date: {invoiceData.invoiceDate}</p>
                    <p className="text-sm font-medium text-[#2D2D2D]">Due Date: {invoiceData.dueDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-[#2D2D2D] mb-2">Billed To:</h5>
                  <p className="text-sm text-gray-600">{invoiceData.clientName || 'Client Name'}</p>
                  <p className="text-sm text-gray-600">{invoiceData.clientEmail || 'Client Email'}</p>
                  <p className="text-sm text-gray-600">{invoiceData.clientAddress || 'Client Address'}</p>
                </div>

                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Unit Price</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 text-sm text-[#2D2D2D]">{item.description || 'Item'}</td>
                        <td className="py-2 text-sm text-right text-[#2D2D2D]">{item.quantity}</td>
                        <td className="py-2 text-sm text-right text-[#2D2D2D]">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-sm text-right text-[#2D2D2D]">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-[#2D2D2D] font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-600">Tax (18%):</span>
                      <span className="text-[#2D2D2D] font-medium">{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold text-[#2D2D2D] border-t border-gray-200">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
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

export default InvoiceGenerator;