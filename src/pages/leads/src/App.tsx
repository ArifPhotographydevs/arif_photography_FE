import React, { useState } from 'react';
import { Camera, Mail, Phone, MapPin, Calendar, Users, Instagram, Facebook, Twitter, Upload, Check, ArrowRight, ArrowLeft, Heart, Music, Palette, Star, Gift, Crown, Flower } from 'lucide-react';

interface FormData {
  selectedEvents: string[];
  eventDetails: {
    [key: string]: {
      date: string;
      location: string;
      time: string;
      duration: string;
      guests: string;
      notes: string;
    };
  };
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    contactMethod: string;
  };
}

const eventTypes = [
  { id: 'engagement', name: 'ENGAGEMENT', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { id: 'wedding', name: 'WEDDING', icon: Crown, color: 'bg-red-100 text-red-600' },
  { id: 'pre-wedding', name: 'PRE-WEDDING', icon: Camera, color: 'bg-purple-100 text-purple-600' },
  { id: 'sangeet', name: 'SANGEET', icon: Music, color: 'bg-blue-100 text-blue-600' },
  { id: 'mehendi', name: 'MEHENDI', icon: Palette, color: 'bg-green-100 text-green-600' },
  { id: 'haldi', name: 'HALDI', icon: Star, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'reception', name: 'RECEPTION', icon: Gift, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'ring-ceremony', name: 'RING CEREMONY', icon: Flower, color: 'bg-orange-100 text-orange-600' },
  { id: 'cocktail', name: 'COCKTAIL PARTY', icon: Users, color: 'bg-teal-100 text-teal-600' },
  { id: 'baby-shower', name: 'BABY SHOWER', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { id: 'birthday', name: 'BIRTHDAY', icon: Gift, color: 'bg-purple-100 text-purple-600' },
  { id: 'anniversary', name: 'ANNIVERSARY', icon: Crown, color: 'bg-red-100 text-red-600' }
];

function Leadform() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    selectedEvents: [],
    eventDetails: {},
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      contactMethod: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleBasicInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalSteps = 6; // bride name + groom name + email + phone + event selection + event details

  const handleEventSelection = (eventId: string) => {
    const newSelectedEvents = formData.selectedEvents.includes(eventId)
      ? formData.selectedEvents.filter(id => id !== eventId)
      : [...formData.selectedEvents, eventId];
    
    setFormData(prev => ({
      ...prev,
      selectedEvents: newSelectedEvents
    }));
  };

  const handleEventDetailChange = (eventId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      eventDetails: {
        ...prev.eventDetails,
        [eventId]: {
          ...prev.eventDetails[eventId],
          [field]: value
        }
      }
    }));
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromEventSelection = () => {
    return formData.selectedEvents.length > 0;
  };

  const canProceedFromEventDetails = () => {
    return formData.selectedEvents.every(eventId => {
      const details = formData.eventDetails[eventId];
      return details && details.date && details.location && details.time;
    });
  };

  const canProceedFromStep = () => {
    const { fullName, email, phone } = formData.personalInfo;
    
    switch (currentStep) {
      case 1: // Bride name
        return fullName.trim() !== '';
      case 2: // Groom name  
        return email.trim() !== ''; // Using email field for groom name temporarily
      case 3: // Email
        return phone.trim() !== '' && /\S+@\S+\.\S+/.test(phone); // Using phone field for email temporarily
      case 4: // Phone
        return formData.personalInfo.contactMethod.trim() !== ''; // Using contactMethod for phone temporarily
      case 5: // Event selection
        return canProceedFromEventSelection();
      case 6: // Event details
        return canProceedFromEventDetails();
      default:
        return false;
    }
  };

const handleSubmit = async () => {
  setIsSubmitting(true);

  // Transform eventDetails object into expected array
  const transformedEventDetails = formData.selectedEvents.map(eventId => {
    const detail = formData.eventDetails[eventId];
    return {
      eventType: eventId,
      date: detail?.date || '',
      location: detail?.location || '',
      time: detail?.time || '',
      duration: detail?.duration || '',
      guests: detail?.guests || '',
      notes: detail?.notes || '',
    };
  });

  // Prepare final payload
  const payload = {
    selectedEvents: formData.selectedEvents,
    eventDetails: transformedEventDetails,
    personalInfo: {
      brideName: formData.personalInfo.fullName,
      groomName: formData.personalInfo.email,
      email: formData.personalInfo.phone,       // stored as phone in step 3
      phoneNumber: formData.personalInfo.contactMethod,
      contactMethod: formData.personalInfo.contactMethod === 'Email' ? 'Email' : 'Phone',
    },
  };

  try {
    const response = await fetch('https://0htgd5xyr9.execute-api.eu-north-1.amazonaws.com/leadsFormData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to submit enquiry');

    setSubmitSuccess(true);
    console.log('Successfully submitted:', payload);
  } catch (error) {
    console.error('Submission error:', error);
  } finally {
    setIsSubmitting(false);
  }
};


  const renderBrideName = () => {
    return (
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Bride's Name
        </h2>
        <p className="text-gray-600 mb-8">
          Let's start with the bride's name
        </p>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Bride's Full Name *
          </label>
          <input
            type="text"
            value={formData.personalInfo.fullName}
            onChange={(e) => handleBasicInfoChange('fullName', e.target.value)}
            placeholder="Enter bride's full name"
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const renderGroomName = () => {
    return (
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Groom's Name
        </h2>
        <p className="text-gray-600 mb-8">
          Now, please enter the groom's name
        </p>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Groom's Full Name *
          </label>
          <input
            type="text"
            value={formData.personalInfo.email}
            onChange={(e) => handleBasicInfoChange('email', e.target.value)}
            placeholder="Enter groom's full name"
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const renderEmailStep = () => {
    return (
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Email Address
        </h2>
        <p className="text-gray-600 mb-8">
          Please provide your email address
        </p>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.personalInfo.phone}
            onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const renderPhoneStep = () => {
    return (
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Phone Number
        </h2>
        <p className="text-gray-600 mb-8">
          Please provide your phone number
        </p>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.personalInfo.contactMethod}
            onChange={(e) => handleBasicInfoChange('contactMethod', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const renderEventSelection = () => {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What events do you want us to cover?
        </h2>
        <p className="text-gray-600 mb-8">
          Select all the events you'd like us to photograph (multiple selection allowed)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {eventTypes.map((event) => {
            const Icon = event.icon;
            const isSelected = formData.selectedEvents.includes(event.id);
            
            return (
              <button
                key={event.id}
                onClick={() => handleEventSelection(event.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center ${event.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-medium text-gray-800 text-sm">{event.name}</p>
                {isSelected && (
                  <div className="mt-2">
                    <Check className="w-5 h-5 text-blue-600 mx-auto" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {formData.selectedEvents.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-2xl mx-auto">
            <p className="text-blue-800 font-medium">
              Selected Events: {formData.selectedEvents.length}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.selectedEvents.map(eventId => {
                const event = eventTypes.find(e => e.id === eventId);
                return (
                  <span key={eventId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {event?.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEventDetails = () => {
    return (
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Event Details
          </h2>
          <p className="text-gray-600">
            Please provide details for each selected event
          </p>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {formData.selectedEvents.map(eventId => {
            const event = eventTypes.find(e => e.id === eventId);
            const details = formData.eventDetails[eventId] || {};
            const Icon = event?.icon || Calendar;

            return (
              <div key={eventId} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${event?.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">{event?.name}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={details.date || ''}
                      onChange={(e) => handleEventDetailChange(eventId, 'date', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Time *
                    </label>
                    <input
                      type="time"
                      value={details.time || ''}
                      onChange={(e) => handleEventDetailChange(eventId, 'time', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={details.location || ''}
                      onChange={(e) => handleEventDetailChange(eventId, 'location', e.target.value)}
                      placeholder="Event venue or location"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <select
                      value={details.duration || ''}
                      onChange={(e) => handleEventDetailChange(eventId, 'duration', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select duration</option>
                      <option value="2-hours">2 Hours</option>
                      <option value="4-hours">4 Hours</option>
                      <option value="6-hours">6 Hours</option>
                      <option value="8-hours">8 Hours</option>
                      <option value="full-day">Full Day</option>
                      <option value="2-days">2 Days</option>
                      <option value="3-days">3 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Guests
                    </label>
                    <select
                      value={details.guests || ''}
                      onChange={(e) => handleEventDetailChange(eventId, 'guests', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select guest count</option>
                      <option value="0-50">0-50 guests</option>
                      <option value="50-100">50-100 guests</option>
                      <option value="100-200">100-200 guests</option>
                      <option value="200-500">200-500 guests</option>
                      <option value="500+">500+ guests</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Notes
                    </label>
                    <textarea
                      value={details.notes || ''}
                      onChange={(e) => handleEventDetailChange(eventId, 'notes', e.target.value)}
                      placeholder="Any special requirements or notes for this event..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPersonalInfo = () => {
    return (
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Personal Information
          </h2>
          <p className="text-gray-600">
            Finally, let us know how to reach you
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.personalInfo.fullName}
                onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.personalInfo.phone}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Contact Method *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="Email"
                    checked={formData.personalInfo.contactMethod === 'Email'}
                    onChange={(e) => handlePersonalInfoChange('contactMethod', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactMethod"
                    value="Phone"
                    checked={formData.personalInfo.contactMethod === 'Phone'}
                    onChange={(e) => handlePersonalInfoChange('contactMethod', e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Phone</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your photography enquiry has been submitted successfully. We'll get back to you within 24 hours.
          </p>
          <button
            onClick={() => {
              setSubmitSuccess(false);
              setCurrentStep(1);
              setFormData({
                selectedEvents: [],
                eventDetails: {},
                personalInfo: {
                  fullName: '',
                  email: '',
                  phone: '',
                  contactMethod: ''
                }
              });
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Photography Enquiry</h1>
                <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 ml-2">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px]">
          <div className="p-8 sm:p-12">
            {/* Step Content */}
            {currentStep === 1 && renderBrideName()}
            {currentStep === 2 && renderGroomName()}
            {currentStep === 3 && renderEmailStep()}
            {currentStep === 4 && renderPhoneStep()}
            {currentStep === 5 && renderEventSelection()}
            {currentStep === 6 && renderEventDetails()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceedFromStep()}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                    !canProceedFromStep()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:from-blue-700 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedFromEventDetails() || isSubmitting}
                  className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all ${
                    !canProceedFromEventDetails() || isSubmitting
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Enquiry'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-800">Arif Photography</span>
              </div>
              <p className="text-gray-600 text-sm">
                Capturing life's most precious moments with artistic vision and professional expertise.
              </p>
            </div> */}
            
            {/* <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  hello@photostudio.com
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  +1 (555) 123-4567
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  123 Photography Lane, Studio City
                </div>
              </div>
            </div> */}

            {/* <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors">
                  <Instagram className="w-4 h-4 text-gray-600 hover:text-blue-600" />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors">
                  <Facebook className="w-4 h-4 text-gray-600 hover:text-blue-600" />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors">
                  <Twitter className="w-4 h-4 text-gray-600 hover:text-blue-600" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-6 text-center">
            <p className="text-sm text-gray-600">
              © 2025 . All rights reserved.
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}

export default Leadform;