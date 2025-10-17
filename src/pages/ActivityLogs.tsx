import React, { useState, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Link, Download, FileText } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';

function QRCodeGenerator() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [url, setUrl] = useState('');
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadPNG = () => {
    if (qrRef.current) {
      const canvas = qrRef.current;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'qrcode.png';
      link.click();
    }
  };

  const handleDownloadPDF = () => {
    if (qrRef.current && url) {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('QR Code', 20, 20);
      doc.setFontSize(12);
      doc.text(`URL: ${url}`, 20, 30);
      const qrImage = qrRef.current.toDataURL('image/png');
      doc.addImage(qrImage, 'PNG', 20, 40, 100, 100);
      doc.save('qrcode.pdf');
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <Header title="QR Code Generator" sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="pt-16 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">QR Code Generator</h2>
            <p className="text-gray-600">Create QR codes for URLs and download them</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* URL Input Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4 flex items-center">
                <Link className="h-5 w-5 text-[#00BCEB] mr-2" />
                Enter URL
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCEB]"
                    placeholder="https://example.com"
                  />
                  {!isValidUrl(url) && url && (
                    <p className="text-sm text-red-600 mt-1">Please enter a valid URL</p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#2D2D2D] mb-4 flex items-center">
                <FileText className="h-5 w-5 text-[#00BCEB] mr-2" />
                QR Code Preview
              </h3>

              <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center">
                {url && isValidUrl(url) ? (
                  <>
                    <QRCodeCanvas
                      value={url}
                      size={200}
                      level="H"
                      includeMargin={true}
                      ref={qrRef}
                    />
                    <div className="mt-4 flex space-x-4">
                      <button
                        onClick={handleDownloadPNG}
                        className="flex items-center bg-[#00BCEB] text-white px-4 py-2 rounded-lg hover:bg-[#0095c8] transition-colors"
                        disabled={!url || !isValidUrl(url)}
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download PNG
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center bg-[#FF6B00] text-white px-4 py-2 rounded-lg hover:bg-[#e55e00] transition-colors"
                        disabled={!url || !isValidUrl(url)}
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Download PDF
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No QR code generated</p>
                    <p className="text-gray-400 text-sm">Enter a valid URL to generate a QR code</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default QRCodeGenerator;