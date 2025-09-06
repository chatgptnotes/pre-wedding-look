import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      onGetStarted();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
        {/* Header with Auth - Enhanced Responsive */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-2xl">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
                  <span className="text-2xl">💖</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                  Pre-wedding Look AI
                </h1>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {loading ? (
                  <div className="w-8 h-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                ) : user ? (
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span className="text-white/90 text-sm sm:text-base text-center sm:text-left">
                      Welcome, <span className="font-semibold">{user.user_metadata?.full_name || 'User'}</span>!
                    </span>
                    <button
                      onClick={signOut}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20 text-sm sm:text-base"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-white hover:text-pink-200 font-semibold transition-colors text-sm sm:text-base"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="bg-white text-rose-600 hover:bg-pink-50 px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base transform hover:scale-105"
                    >
                      Sign Up Free
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section - Enhanced */}
        <div className="relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-rose-300/20 to-pink-300/20 blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-300/20 to-rose-300/20 blur-3xl animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
            <div className="text-center max-w-5xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                  <span className="block bg-gradient-to-r from-gray-900 via-rose-700 to-purple-800 bg-clip-text text-transparent">
                    Pre-wedding Look
                  </span>
                  <span className="block text-3xl sm:text-4xl lg:text-6xl xl:text-7xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent font-black">
                    AI Magic ✨
                  </span>
                </h1>
              </div>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
                Skip expensive photoshoots and travel costs! Create stunning, professional pre-wedding photos 
                in <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">minutes, not months</span> - from the comfort of your home.
              </p>
              
              {/* Benefits Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="font-bold text-gray-900 text-lg">Save ₹50,000+</div>
                    <div className="text-gray-600 text-sm">on photoshoots</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="font-bold text-gray-900 text-lg">5 Minutes</div>
                    <div className="text-gray-600 text-sm">instant results</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="font-bold text-gray-900 text-lg">Unlimited</div>
                    <div className="text-gray-600 text-sm">photo variations</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-700 hover:via-pink-700 hover:to-purple-700 text-white text-lg sm:text-xl font-bold py-4 sm:py-6 px-8 sm:px-12 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-3xl border-4 border-white/20 backdrop-blur-sm"
              >
                <span className="flex items-center justify-center">
                  {user ? (
                    <>
                      <span className="text-2xl mr-2">✨</span>
                      Start Creating Magic
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mr-2">🔑</span>
                      Sign In to Get Started
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
              
              <p className="text-gray-500 text-sm sm:text-base mt-4 sm:mt-6">
                🔒 100% Secure • 🚀 Instant Setup • 💝 Free to Try
              </p>
            </div>
          </div>
        </div>

      {/* Social Proof Section - Enhanced */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-white via-pink-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
              Join <span className="font-bold text-rose-600 text-2xl sm:text-3xl">5,000+</span> couples who saved money and time
            </p>
            
            {/* Stats Grid - Fully Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-rose-100">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">₹50K+</div>
                <div className="text-gray-600 text-sm sm:text-base font-medium">Avg. Savings</div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-100">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">5 Min</div>
                <div className="text-gray-600 text-sm sm:text-base font-medium">Setup Time</div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-100">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">100+</div>
                <div className="text-gray-600 text-sm sm:text-base font-medium">Style Options</div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-rose-100">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">50+</div>
                <div className="text-gray-600 text-sm sm:text-base font-medium">Locations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">
            Why Couples Love Pre-wedding Look AI
          </h2>
          <p className="text-center text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
            Traditional pre-wedding shoots cost ₹30,000-₹1,00,000+ and require months of planning. 
            We make it instant and affordable.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-rose-100">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-rose-600">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Style the Bride</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload the bride's photo and choose her perfect look - from traditional lehengas to 
                modern gowns, hairstyles, and jewelry.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-rose-100">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-rose-600">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Style the Groom</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload the groom's photo and select his attire - from classic sherwanis to 
                modern suits, with matching hairstyles.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-6 rounded-2xl bg-white shadow-lg border border-rose-100">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-rose-600">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create the Scene</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose from stunning Indian locations like Taj Mahal, Udaipur palaces, or Kerala 
                backwaters and generate your dream photo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gradient-to-r from-rose-50 to-pink-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            What Couples Are Saying
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold text-lg">P</div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Priya & Arjun</h4>
                  <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "We saved ₹80,000 on our pre-wedding shoot! The AI photos look so professional, 
                our families were amazed. Best decision ever!"
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">R</div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Rahul & Sneha</h4>
                  <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "COVID cancelled our Udaipur trip, but we got our dream palace photos anyway! 
                The Taj Mahal shots are going straight to our wedding cards."
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">A</div>
                <div className="ml-4">
                  <h4 className="font-bold text-gray-900">Ankit & Kavya</h4>
                  <div className="flex text-yellow-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "5 minutes to create what would take weeks to plan and thousands to execute. 
                We created 50+ different looks and locations!"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Traditional vs AI Pre-wedding Shoot
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid grid-cols-3">
                <div className="p-6 text-center font-bold text-gray-700 bg-gray-50">Features</div>
                <div className="p-6 text-center font-bold text-red-600 bg-red-50">Traditional Shoot</div>
                <div className="p-6 text-center font-bold text-green-600 bg-green-50">Pre-wedding AI</div>
              </div>
              
              {[
                ['Cost', '₹30K - ₹1L+', '₹0 (Free to try)'],
                ['Time Required', '2-6 months planning', '5 minutes'],
                ['Travel', 'Expensive flights & hotels', 'None required'],
                ['Weather Dependency', 'High (postponements)', 'Zero'],
                ['Outfit Changes', '2-3 max', 'Unlimited'],
                ['Location Options', '1-2 places', '50+ iconic spots'],
                ['Photos Delivered', '50-100 photos', 'Unlimited generations'],
                ['Retakes', 'Costly & time-consuming', 'Instant & free']
              ].map(([feature, traditional, ai], index) => (
                <div key={index} className="grid grid-cols-3 border-t border-gray-200">
                  <div className="p-4 font-semibold text-gray-700">{feature}</div>
                  <div className="p-4 text-red-700 bg-red-25">{traditional}</div>
                  <div className="p-4 text-green-700 bg-green-25 font-semibold">{ai}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sample Locations */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-8">
            50+ Stunning Locations Available
          </h2>
          <p className="text-center text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
            From iconic monuments to serene beaches - all the dream destinations you've always wanted for your pre-wedding photos
          </p>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Taj Mahal, Agra', desc: 'Iconic monument of eternal love', emoji: '🕌' },
              { name: 'Udaipur Palaces', desc: 'Royal Rajasthani elegance', emoji: '🏰' },
              { name: 'Kerala Backwaters', desc: 'Serene houseboat romance', emoji: '🛶' },
              { name: 'Goa Beach Sunset', desc: 'Golden hour magic', emoji: '🏖️' },
              { name: 'Rajasthan Desert', desc: 'Camel safari adventure', emoji: '🐪' },
              { name: 'Mumbai Gateway', desc: 'Urban coastal charm', emoji: '🌊' },
              { name: 'Munnar Tea Gardens', desc: 'Lush green hills', emoji: '🫖' },
              { name: 'Jaipur Hawa Mahal', desc: 'Pink city royalty', emoji: '🏮' }
            ].map((location, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-rose-200 via-pink-200 to-orange-200 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <div className="absolute top-4 right-4 text-3xl">{location.emoji}</div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="font-bold text-white text-lg mb-1">{location.name}</h4>
                    <p className="text-white/90 text-sm">{location.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgency Section */}
      <div className="py-16 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🔥 Wedding Season Special Offer
            </h2>
            <p className="text-xl text-orange-100 mb-6">
              Skip the ₹50,000+ photoshoot expense! Create unlimited photos for FREE during wedding season.
              Perfect for wedding cards, social media, and family sharing.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-white/90 text-sm mb-6">
              <div>✅ No hidden costs</div>
              <div>✅ No signup required</div>
              <div>✅ Instant results</div>
              <div>✅ HD quality downloads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-24 bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Your Dream Photos
            <span className="block text-yellow-300">In 5 Minutes! ⚡</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-pink-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Don't let budget or time constraints stop you from getting the perfect pre-wedding photos. 
            Start creating your magical moments right now - completely FREE!
          </p>

          <div className="space-y-4 mb-12">
            <button
              onClick={handleGetStarted}
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-2xl font-bold py-6 px-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 border-4 border-white"
            >
              {user ? '🚀 Create My Dream Photos Now' : '🔑 Sign In to Start Creating'}
            </button>
            <p className="text-pink-200 text-sm">
              No registration • No payment • Instant results
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto text-pink-100">
            <div>
              <div className="text-3xl font-bold text-yellow-300">30 Sec</div>
              <div className="text-sm">Upload time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300">5 Min</div>
              <div className="text-sm">Total process</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300">∞</div>
              <div className="text-sm">Photo variations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-300">₹0</div>
              <div className="text-sm">Cost to you</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Powered by Google Gemini AI • Designed with ❤️ for couples
          </p>
        </div>
      </footer>
    </div>

    <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)} 
    />
  </>
);
};

export default LandingPage;