import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useExperimentManagement } from '../hooks/useExperiment';
import { Experiment, ExperimentResults } from '../services/experimentService';
import { useAnalytics } from '../hooks/useAnalytics';

export const ExperimentDashboard: React.FC = () => {
  const { experiments, isLoading, createExperiment, updateExperiment, getResults } = useExperimentManagement();
  const { track } = useAnalytics();
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [results, setResults] = useState<ExperimentResults[] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    track('experiment_dashboard_viewed');
  }, [track]);

  const handleExperimentClick = async (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    track('experiment_selected', { experiment_name: experiment.name });
    
    // Load results
    const experimentResults = await getResults(experiment.name);
    setResults(experimentResults);
  };

  const handleStatusChange = async (experiment: Experiment, newStatus: string) => {
    track('experiment_status_changed', { 
      experiment_name: experiment.name, 
      old_status: experiment.status,
      new_status: newStatus,
    });
    
    await updateExperiment(experiment.name, { status: newStatus as any });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B Testing Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage experiments and analyze results</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-shadow"
        >
          Create Experiment
        </button>
      </div>

      {/* Experiments List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Experiments sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Experiments</h2>
          
          {experiments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No experiments running
            </div>
          ) : (
            experiments.map((experiment) => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                isSelected={selectedExperiment?.id === experiment.id}
                onClick={() => handleExperimentClick(experiment)}
                onStatusChange={(status) => handleStatusChange(experiment, status)}
              />
            ))
          )}
        </div>

        {/* Experiment details and results */}
        <div className="lg:col-span-2">
          {selectedExperiment ? (
            <ExperimentDetails
              experiment={selectedExperiment}
              results={results}
            />
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                📊
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select an Experiment
              </h3>
              <p className="text-gray-600">
                Choose an experiment from the sidebar to view detailed results and analytics
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Experiment Modal */}
      {showCreateForm && (
        <CreateExperimentModal
          onClose={() => setShowCreateForm(false)}
          onCreate={createExperiment}
        />
      )}
    </div>
  );
};

interface ExperimentCardProps {
  experiment: Experiment;
  isSelected: boolean;
  onClick: () => void;
  onStatusChange: (status: string) => void;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  isSelected,
  onClick,
  onStatusChange,
}) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    running: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 truncate flex-1">
          {experiment.name}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[experiment.status]}`}>
          {experiment.status}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {experiment.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{experiment.variants.length} variants</span>
        <span>{Math.round(experiment.traffic_allocation * 100)}% traffic</span>
      </div>
      
      {experiment.status === 'running' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange('paused');
              }}
              className="text-xs text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Pause
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange('completed');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Complete
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface ExperimentDetailsProps {
  experiment: Experiment;
  results: ExperimentResults[] | null;
}

const ExperimentDetails: React.FC<ExperimentDetailsProps> = ({
  experiment,
  results,
}) => {
  return (
    <div className="space-y-6">
      {/* Experiment info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{experiment.name}</h2>
            <p className="text-gray-600 mt-1">{experiment.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Primary Metric</div>
            <div className="font-semibold text-gray-900">{experiment.primary_metric}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Traffic Allocation:</span>
            <div className="font-semibold">{Math.round(experiment.traffic_allocation * 100)}%</div>
          </div>
          <div>
            <span className="text-gray-500">Confidence Level:</span>
            <div className="font-semibold">{Math.round(experiment.confidence_level * 100)}%</div>
          </div>
          <div>
            <span className="text-gray-500">Min Sample Size:</span>
            <div className="font-semibold">{experiment.minimum_sample_size.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variants</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiment.variants.map((variant, index) => (
            <div
              key={variant.id}
              className={`border rounded-lg p-4 ${
                variant.id === experiment.control_variant_id ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{variant.name}</h4>
                {variant.id === experiment.control_variant_id && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Control
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                Traffic: {Math.round(variant.allocation * 100)}%
              </div>
              
              <div className="text-xs text-gray-500">
                ID: {variant.id}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No data collected yet
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.variant_id}
                  className={`border rounded-lg p-4 ${
                    result.is_winning ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {experiment.variants.find(v => v.id === result.variant_id)?.name || result.variant_id}
                    </h4>
                    {result.is_winning && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Winner
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Users:</span>
                      <div className="font-semibold">{result.total_users.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Conversions:</span>
                      <div className="font-semibold">{result.conversions.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Rate:</span>
                      <div className="font-semibold">{(result.conversion_rate * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Confidence: {(result.statistical_significance * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CreateExperimentModalProps {
  onClose: () => void;
  onCreate: (experiment: Partial<Experiment>) => Promise<Experiment | null>;
}

const CreateExperimentModal: React.FC<CreateExperimentModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primary_metric: 'conversion_rate',
    traffic_allocation: 1.0,
    variants: [
      { id: 'control', name: 'Control', allocation: 0.5, config: {} },
      { id: 'variant_a', name: 'Variant A', allocation: 0.5, config: {} },
    ],
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const experiment = await onCreate({
        ...formData,
        control_variant_id: 'control',
        status: 'draft',
        confidence_level: 0.95,
        minimum_sample_size: 1000,
      });
      
      if (experiment) {
        onClose();
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Create Experiment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g. landing_page_hero_test"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Describe what this experiment tests..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Metric
            </label>
            <select
              value={formData.primary_metric}
              onChange={(e) => setFormData({ ...formData, primary_metric: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="conversion_rate">Conversion Rate</option>
              <option value="click_through_rate">Click Through Rate</option>
              <option value="retention_rate">Retention Rate</option>
              <option value="revenue_per_user">Revenue Per User</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Traffic Allocation
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={formData.traffic_allocation}
              onChange={(e) => setFormData({ ...formData, traffic_allocation: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-sm text-gray-500 text-center">
              {Math.round(formData.traffic_allocation * 100)}% of users
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ExperimentDashboard;