import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';
import { supabase } from '../lib/supabase';

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const { user } = useAuthStore();
  const { addToast, setGlobalLoading } = useUIStore();
  
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [blockUser, setBlockUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const reportTypes = [
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment or Bullying' },
    { value: 'spam', label: 'Spam or Fake Profile' },
    { value: 'offensive', label: 'Offensive Language' },
    { value: 'other', label: 'Other' },
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType) {
      addToast({
        type: 'warning',
        message: 'Please select a report type',
      });
      return;
    }
    
    if (!description || description.length < 10) {
      addToast({
        type: 'warning',
        message: 'Please provide more details (at least 10 characters)',
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Insert report into database
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user?.id,
          session_id: sessionId,
          report_type: reportType,
          description,
          block_user: blockUser,
          status: 'pending',
        });
      
      if (error) throw error;
      
      addToast({
        type: 'success',
        message: 'Report submitted successfully. Our team will review it soon.',
      });
      
      // Navigate back
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (error: any) {
      addToast({
        type: 'error',
        message: error.message || 'Failed to submit report',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Report Content
              </h1>
              <button
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-600 mb-8">
              Help us maintain a safe and respectful community by reporting inappropriate content or behavior.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What are you reporting? *
                </label>
                <div className="space-y-2">
                  {reportTypes.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={type.value}
                        checked={reportType === type.value}
                        onChange={(e) => setReportType(e.target.value)}
                        className="mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please provide details *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/500 characters
                </p>
              </div>
              
              {/* Block User Option */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer p-4 bg-red-50 border border-red-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={blockUser}
                    onChange={(e) => setBlockUser(e.target.checked)}
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Block this user
                    </span>
                    <p className="text-xs text-gray-500">
                      Prevent future interactions with this user
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reportType || !description}
                  className="flex-1 bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
            
            {/* Privacy Notice */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Privacy Notice:</strong> Your report will be reviewed by our moderation team. 
                We take all reports seriously and will take appropriate action. Your identity will be 
                kept confidential from the reported user.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReportPage;