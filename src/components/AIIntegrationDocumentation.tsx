import React from 'react';
import { motion } from 'framer-motion';

const AIIntegrationDocumentation: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-6">
            <span className="text-3xl">🤖</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Integration Architecture</h1>
            <p className="text-cyan-100 text-lg">Advanced image generation system powering global wedding photography</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-white/90 leading-relaxed">
            Our platform leverages cutting-edge artificial intelligence to deliver personalized, culturally authentic wedding photography experiences across all major continents, seamlessly blending advanced machine learning with traditional cultural elements.
          </p>
        </div>
      </div>

      {/* Core Technologies Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">🧠</span>
            Core AI Technologies
          </h2>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Face Preservation Technology</h3>
              <p className="text-slate-600 text-sm">
                Advanced facial recognition and preservation algorithms ensure authentic representation of individuals across all generated scenarios while maintaining cultural accuracy.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Scene Composition Engine</h3>
              <p className="text-slate-600 text-sm">
                Intelligent composition algorithms that understand cultural context, traditional positioning, and authentic environmental integration for each regional style.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Style Transfer Systems</h3>
              <p className="text-slate-600 text-sm">
                Multi-modal style transfer technology that applies culturally appropriate artistic styles while preserving individual characteristics and cultural authenticity.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">🌍</span>
            Global Cultural Integration
          </h2>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Continental Style Recognition</h3>
              <p className="text-slate-600 text-sm">
                Automatic detection and application of region-specific wedding traditions, attire, and ceremonial elements across Asia, Europe, Americas, Africa, and Oceania.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Cultural Authenticity Validation</h3>
              <p className="text-slate-600 text-sm">
                Built-in cultural sensitivity algorithms ensure respectful and accurate representation of traditional elements, validated against comprehensive cultural databases.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Geolocation-Based Recommendations</h3>
              <p className="text-slate-600 text-sm">
                Intelligent location detection provides personalized cultural recommendations while allowing exploration of global wedding traditions and fusion styles.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Application Benefits Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
        <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center flex items-center justify-center">
          <span className="text-3xl mr-4">✨</span>
          Application Benefits & User Experience
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🎨</span>
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Creative Versatility</h3>
            <p className="text-slate-600 text-sm">
              Nine specialized creative modes including storyboard creation, fusion reality, and voice-powered slideshows with unlimited style customization.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🚀</span>
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Performance Optimization</h3>
            <p className="text-slate-600 text-sm">
              Optimized processing pipelines deliver high-quality results with efficient resource utilization and responsive user experience across all devices.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Privacy & Security</h3>
            <p className="text-slate-600 text-sm">
              Enterprise-grade security ensures user privacy with secure image processing, encrypted storage, and compliant data handling practices.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Implementation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">⚙️</span>
            Technical Implementation
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Generation Engine</span>
              <span className="text-slate-600 text-sm">Advanced Neural Networks</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Face Processing</span>
              <span className="text-slate-600 text-sm">Biometric Preservation</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Style Application</span>
              <span className="text-slate-600 text-sm">Multi-Modal Transfer</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Cultural Database</span>
              <span className="text-slate-600 text-sm">Global Authenticity Index</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Quality Assurance</span>
              <span className="text-slate-600 text-sm">Automated Validation</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            Future Enhancements
          </h2>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <h3 className="font-semibold text-purple-800 mb-2">Enhanced Personalization</h3>
              <p className="text-purple-600 text-sm">
                Machine learning algorithms that adapt to user preferences and cultural nuances for increasingly personalized experiences.
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Real-Time Processing</h3>
              <p className="text-blue-600 text-sm">
                Advanced optimization techniques enabling real-time preview and instant style application across all creative modes.
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <h3 className="font-semibent text-green-800 mb-2">Expanded Cultural Coverage</h3>
              <p className="text-green-600 text-sm">
                Continuous expansion of cultural database to include micro-regional traditions and emerging fusion styles worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Statistics */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl p-8 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Integration Performance Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">7</div>
            <div className="text-indigo-100 text-sm">Continents Covered</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">50+</div>
            <div className="text-indigo-100 text-sm">Countries Supported</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">200+</div>
            <div className="text-indigo-100 text-sm">Cultural Styles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">9</div>
            <div className="text-indigo-100 text-sm">Creative Modes</div>
          </div>
        </div>
      </div>

      {/* Contact and Support Information */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Technical Support & Integration</h2>
        <div className="text-center text-slate-600">
          <p className="mb-4">
            For technical documentation, API integration guides, and developer resources, please contact our technical team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-slate-100 rounded-xl px-4 py-2">
              <span className="text-slate-700 font-medium">📧 Technical Support</span>
            </div>
            <div className="bg-slate-100 rounded-xl px-4 py-2">
              <span className="text-slate-700 font-medium">📚 Developer Documentation</span>
            </div>
            <div className="bg-slate-100 rounded-xl px-4 py-2">
              <span className="text-slate-700 font-medium">🔧 API Integration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIIntegrationDocumentation;