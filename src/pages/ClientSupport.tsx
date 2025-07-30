import React, { useState } from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  HelpCircle,
  Clock,
  CheckCircle
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

function ClientSupport() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Mock FAQ data
  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I download my gallery?',
      answer: 'To download your gallery, navigate to "My Galleries", select the album you want, and click the download button on individual photos or use the "Download All" option if available. High-resolution images will be downloaded to your device.',
      category: 'Gallery'
    },
    {
      id: '2',
      question: 'Can I request an album re-edit?',
      answer: 'Yes! You can request edits for specific photos by clicking on the image and selecting "Request Edit". Please provide detailed feedback about what changes you\'d like to see. Our team will review your request and get back to you within 2-3 business days.',
      category: 'Editing'
    },
    {
      id: '3',
      question: 'How do I pay my invoice?',
      answer: 'You can pay your invoice by going to "My Invoices" section and clicking "Pay Now" on any pending invoice. We accept payments via credit card, debit card, and bank transfer. You\'ll receive a confirmation email once payment is processed.',
      category: 'Billing'
    },
    {
      id: '4',
      question: 'When will my photos be ready?',
      answer: 'Typically, your edited photos will be ready within 2-4 weeks after your shoot, depending on the package and complexity. You\'ll receive an email notification when your gallery is ready for viewing.',
      category: 'Timeline'
    },
    {
      id: '5',
      question: 'Can I share my gallery with family and friends?',
      answer: 'Absolutely! Each gallery has a share option that generates a secure link you can send to family and friends. You can also set permissions for whether they can download photos or just view them.',
      category: 'Gallery'
    },
    {
      id: '6',
      question: 'What if I want to book another session?',
      answer: 'We\'d love to work with you again! You can contact us directly through WhatsApp or email to discuss your next photography session. As a returning client, you may be eligible for special discounts.',
      category: 'Booking'
    }
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleWhatsAppSupport = () => {
    const message = "Hi! I need help with my photography project. Can you assist me?";
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailSupport = () => {
    const subject = "Support Request - Client Portal";
    const body = "Hi Arif Photography team,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nThank you!";
    const emailUrl = `mailto:support@arifphotography.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
  };

  const handlePhoneSupport = () => {
    window.open('tel:+919876543210', '_self');
  };

  const categories = [...new Set(faqItems.map(item => item.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Need Help?</h1>
          <p className="text-gray-600">We're here to assist you with any questions or concerns</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Contact Options */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Get in Touch</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WhatsApp Support */}
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors duration-200">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">WhatsApp Support</h3>
              <p className="text-gray-600 text-sm mb-4">Get instant help via WhatsApp chat</p>
              <button
                onClick={handleWhatsAppSupport}
                className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors duration-200"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat on WhatsApp
                <ExternalLink className="h-4 w-4 ml-2" />
              </button>
            </div>

            {/* Email Support */}
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-cyan-300 transition-colors duration-200">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-4">Send us a detailed message</p>
              <button
                onClick={handleEmailSupport}
                className="w-full flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors duration-200"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
                <ExternalLink className="h-4 w-4 ml-2" />
              </button>
            </div>

            {/* Phone Support */}
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-green-300 transition-colors duration-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 text-sm mb-4">Call us directly for urgent matters</p>
              <button
                onClick={handlePhoneSupport}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </button>
            </div>
          </div>
        </div>

        {/* Support Hours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Support Hours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-cyan-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Monday - Friday</p>
                <p className="text-gray-600">9:00 AM - 6:00 PM IST</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Saturday - Sunday</p>
                <p className="text-gray-600">10:00 AM - 4:00 PM IST</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800 text-sm">
                <strong>WhatsApp support is available 24/7</strong> - We'll respond as soon as possible!
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <HelpCircle className="h-6 w-6 text-cyan-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFAQ(item.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-800 rounded-full mr-3">
                      {item.category}
                    </span>
                    <span className="font-medium text-gray-900">{item.question}</span>
                  </div>
                  {expandedFAQ === item.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {expandedFAQ === item.id && (
                  <div className="px-4 pb-4">
                    <div className="pl-16 pr-8">
                      <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-r from-cyan-50 to-orange-50 rounded-lg border border-gray-200 p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for? Our support team is ready to assist you.
          </p>
          <button
            onClick={handleWhatsAppSupport}
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors duration-200"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientSupport;