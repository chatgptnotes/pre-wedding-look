import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, DocumentTextIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/solid';

const VideoDemoScript: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<string>('main');

  const demoScripts = {
    main: {
      title: "Main Demo Script (2 minutes)",
      duration: "2:00",
      scenes: [
        {
          time: "0:00-0:15",
          scene: "Opening Hook",
          script: "Meet Sarah and David - they wanted the perfect pre-wedding shoot but traditional photography felt limiting. That's where our AI-powered platform transformed their vision into reality.",
          visuals: "Show couple uploading photos",
          notes: "Upbeat, energetic tone"
        },
        {
          time: "0:15-0:30",
          scene: "Classic Mode Demo",
          script: "Starting with Classic Mode - upload your photos, select from our curated collection of romantic locations, and watch as AI seamlessly places you in breathtaking scenes with perfect lighting and composition.",
          visuals: "Screen recording of Classic Mode in action",
          notes: "Focus on ease of use"
        },
        {
          time: "0:30-0:45",
          scene: "Storyboard Feature",
          script: "Want something cinematic? Storyboard Mode creates a romantic journey - Taj Mahal at sunrise, Paris at twilight, Goa beach at sunset - all maintaining your faces and expressions perfectly.",
          visuals: "Show scene transitions",
          notes: "Emphasize 'cinematic' quality"
        },
        {
          time: "0:45-1:00",
          scene: "Fusion Reality",
          script: "Fusion Reality brings magic to existing photos. Brush over any clothing and watch it transform instantly - jeans become a flowing lehenga, t-shirts become sherwanis - all with realistic lighting.",
          visuals: "Live transformation demo",
          notes: "Show the 'wow' factor"
        },
        {
          time: "1:00-1:15",
          scene: "Advanced Features",
          script: "Explore Future Vision to see yourselves decades from now, or go wild with Banana Challenge Mode for creative themes. Voice Slideshow even narrates your story in your own cloned voice.",
          visuals: "Quick montage of other modes",
          notes: "Build excitement"
        },
        {
          time: "1:15-1:30",
          scene: "Regional Authenticity",
          script: "Honor your heritage with Regional Styles - authentic Bengali ceremonies, Punjabi celebrations, Tamil traditions - each culturally accurate and beautifully rendered.",
          visuals: "Show regional examples",
          notes: "Emphasize cultural respect"
        },
        {
          time: "1:30-1:45",
          scene: "One-Click Magic",
          script: "Too many choices? Magic Button analyzes your photos and creates multiple themed shoots automatically - vintage romance, fairytale dreams, Hollywood glamour - all in seconds.",
          visuals: "Magic button generating multiple styles",
          notes: "Highlight convenience"
        },
        {
          time: "1:45-2:00",
          scene: "Call to Action",
          script: "From engagement to anniversary, Beyond Pre-Wedding captures every milestone. Start creating your magical moments today - because your love story deserves to be extraordinary.",
          visuals: "Final montage + website URL",
          notes: "Inspiring, emotional close"
        }
      ]
    },
    technical: {
      title: "Technical Demo Script (90 seconds)",
      duration: "1:30",
      scenes: [
        {
          time: "0:00-0:20",
          scene: "AI Technology Overview",
          script: "Our platform leverages advanced AI image generation with sophisticated face preservation algorithms. Each generated image maintains facial features, expressions, and skin tone with remarkable accuracy.",
          visuals: "Technical diagrams, before/after comparisons",
          notes: "Professional, informative tone"
        },
        {
          time: "0:20-0:40",
          scene: "Feature Integration",
          script: "The system combines multiple AI capabilities: scene composition, style transfer, clothing transformation, and voice cloning - all integrated into a seamless user experience.",
          visuals: "Architecture diagram, feature showcase",
          notes: "Emphasize integration complexity"
        },
        {
          time: "0:40-1:00",
          scene: "Real-time Processing",
          script: "Watch as the AI processes uploaded images in real-time, analyzing facial features, determining optimal lighting, and generating photorealistic scenes that look professionally shot.",
          visuals: "Processing visualization, progress indicators",
          notes: "Show technical sophistication"
        },
        {
          time: "1:00-1:30",
          scene: "Quality & Scale",
          script: "With support for multiple cultural styles, professional-grade output quality, and the ability to generate unlimited variations, this represents the future of personalized photography.",
          visuals: "Quality comparisons, various cultural examples",
          notes: "End on future vision"
        }
      ]
    },
    marketing: {
      title: "Marketing Highlight Script (60 seconds)",
      duration: "1:00",
      scenes: [
        {
          time: "0:00-0:15",
          scene: "Problem Statement",
          script: "Traditional pre-wedding shoots cost thousands, require scheduling photographers, and limit your creativity to available locations and weather conditions.",
          visuals: "Frustrated couples, expensive quotes, weather issues",
          notes: "Address pain points"
        },
        {
          time: "0:15-0:30",
          scene: "Solution Reveal",
          script: "Introducing AI Pre-Wedding Studio - unlimited locations, perfect weather every time, and the creative freedom to explore any style or theme you can imagine.",
          visuals: "Platform interface, stunning generated images",
          notes: "Position as revolutionary solution"
        },
        {
          time: "0:30-0:45",
          scene: "Benefits Showcase",
          script: "Create hundreds of professional shots in minutes, not days. From traditional ceremonies to fantasy themes, all at a fraction of the cost of traditional photography.",
          visuals: "Cost comparison, speed demonstration",
          notes: "Emphasize value proposition"
        },
        {
          time: "0:45-1:00",
          scene: "Social Proof & CTA",
          script: "Join thousands of couples who've already created their dream photos. Start your magical pre-wedding journey today - your perfect shoot is just one click away.",
          visuals: "User testimonials, final CTA",
          notes: "Build trust and urgency"
        }
      ]
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
            <span className="text-white text-xl">🎬</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Video Demo Scripts</h2>
            <p className="text-slate-600">Professional scripts for engaging video demonstrations</p>
          </div>
        </div>

        {/* Script Selection */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(demoScripts).map(([key, script]) => (
            <button
              key={key}
              onClick={() => setSelectedScript(key)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                selectedScript === key
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {script.title}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Script Content */}
      <motion.div
        key={selectedScript}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="bg-slate-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800">
              {demoScripts[selectedScript as keyof typeof demoScripts].title}
            </h3>
            <div className="flex items-center text-slate-600">
              <ClockIcon className="w-5 h-5 mr-2" />
              {demoScripts[selectedScript as keyof typeof demoScripts].duration}
            </div>
          </div>

          <div className="space-y-4">
            {demoScripts[selectedScript as keyof typeof demoScripts].scenes.map((scene, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                      {scene.time}
                    </span>
                    <h4 className="font-semibold text-slate-800">{scene.scene}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="font-medium text-slate-700 mb-2 flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2" />
                      Script
                    </h5>
                    <p className="text-slate-600 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">
                      "{scene.script}"
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-700 mb-2 flex items-center">
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Visuals
                    </h5>
                    <p className="text-slate-600 text-sm leading-relaxed bg-blue-50 rounded-lg p-3">
                      {scene.visuals}
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <h5 className="font-medium text-amber-800 mb-1 flex items-center">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    Director's Notes
                  </h5>
                  <p className="text-amber-700 text-sm italic">{scene.notes}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Production Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-indigo-800 mb-4">🎯 Production Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Visual Guidelines</h4>
              <ul className="text-indigo-600 text-sm space-y-1">
                <li>• Use screen recordings for live demonstrations</li>
                <li>• Include before/after comparison shots</li>
                <li>• Show loading animations for processing</li>
                <li>• Highlight key UI elements with arrows/circles</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-700 mb-2">Audio Guidelines</h4>
              <ul className="text-indigo-600 text-sm space-y-1">
                <li>• Use upbeat background music (60-80 BPM)</li>
                <li>• Maintain consistent narration pace</li>
                <li>• Add sound effects for transitions</li>
                <li>• Include subtle AI processing sounds</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoDemoScript;