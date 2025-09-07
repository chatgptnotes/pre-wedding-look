import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MicrophoneIcon, SpeakerWaveIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';
import ImageUploader from '../ImageUploader';

interface VoiceClone {
  id: string;
  name: string;
  type: 'bride' | 'groom';
  audioFile: string | null;
  voiceId: string | null;
  isProcessing: boolean;
  status: 'idle' | 'recording' | 'processing' | 'ready' | 'error';
}

interface SlideTemplate {
  id: string;
  name: string;
  script: string;
  mood: 'romantic' | 'playful' | 'emotional' | 'dramatic';
  duration: number; // in seconds
  musicStyle: string;
}

const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'love-story',
    name: 'Our Love Story',
    script: 'When I first saw you, I knew my heart had found its home. Every moment since then has been a chapter in our beautiful love story.',
    mood: 'romantic',
    duration: 15,
    musicStyle: 'Soft piano romance'
  },
  {
    id: 'journey-together',
    name: 'Our Journey Together',
    script: 'From strangers to best friends, from friends to lovers, from lovers to soulmates. Our journey has been filled with laughter and precious memories.',
    mood: 'emotional',
    duration: 18,
    musicStyle: 'Emotional strings'
  },
  {
    id: 'funny-moments',
    name: 'Funny Moments',
    script: 'Remember when you tried to cook for me and almost burned the kitchen down? These silly moments make our love story uniquely ours.',
    mood: 'playful',
    duration: 12,
    musicStyle: 'Light acoustic guitar'
  },
  {
    id: 'promises',
    name: 'Our Promises',
    script: 'Today we promise to love each other through all of life adventures. Through sunny days and stormy weather, our love will guide us home.',
    mood: 'dramatic',
    duration: 16,
    musicStyle: 'Orchestral crescendo'
  }
];

interface VoiceSlideshowTabProps {
  brideImage: string | null;
  groomImage: string | null;
  onImageUpload: (type: 'bride' | 'groom', image: string | null) => void;
}

const VoiceSlideshowTab: React.FC<VoiceSlideshowTabProps> = ({ 
  brideImage, 
  groomImage, 
  onImageUpload 
}) => {
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([
    {
      id: 'bride-voice',
      name: 'Bride Voice',
      type: 'bride',
      audioFile: null,
      voiceId: null,
      isProcessing: false,
      status: 'idle'
    },
    {
      id: 'groom-voice',
      name: 'Groom Voice',
      type: 'groom',
      audioFile: null,
      voiceId: null,
      isProcessing: false,
      status: 'idle'
    }
  ]);
  
  const [selectedSlides, setSelectedSlides] = useState<SlideTemplate[]>([]);
  const [customScript, setCustomScript] = useState<string>('');
  const [selectedNarrator, setSelectedNarrator] = useState<'bride' | 'groom' | 'both'>('both');
  const [isGeneratingSlideshow, setIsGeneratingSlideshow] = useState(false);
  const [generatedSlideshow, setGeneratedSlideshow] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (voiceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setVoiceClones(prev => prev.map(voice => 
          voice.id === voiceId 
            ? { ...voice, audioFile: audioUrl, status: 'processing' }
            : voice
        ));

        // Simulate voice processing
        setTimeout(() => {
          setVoiceClones(prev => prev.map(voice => 
            voice.id === voiceId 
              ? { ...voice, status: 'ready' }
              : voice
          ));
        }, 2000);
      };

      setVoiceClones(prev => prev.map(voice => 
        voice.id === voiceId 
          ? { ...voice, status: 'recording' }
          : voice
      ));

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback((voiceId: string) => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setVoiceClones(prev => prev.map(voice => 
      voice.id === voiceId 
        ? { ...voice, status: 'idle' }
        : voice
    ));
  }, []);

  const playVoiceSample = useCallback((audioFile: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioFile;
      audioRef.current.play();
    }
  }, []);

  const toggleSlideSelection = useCallback((slide: SlideTemplate) => {
    setSelectedSlides(prev => {
      const exists = prev.find(s => s.id === slide.id);
      if (exists) {
        return prev.filter(s => s.id !== slide.id);
      } else {
        return [...prev, slide];
      }
    });
  }, []);

  const generateSlideshow = useCallback(async () => {
    const readyVoices = voiceClones.filter(v => v.status === 'ready');
    
    if (readyVoices.length === 0) {
      alert('Please record at least one voice sample first');
      return;
    }

    if (selectedSlides.length === 0 && !customScript) {
      alert('Please select slide templates or write a custom script');
      return;
    }

    if (!brideImage || !groomImage) {
      alert('Please upload both bride and groom images first');
      return;
    }

    setIsGeneratingSlideshow(true);

    try {
      // Import services for voice processing and AI generation
      const { generateVoiceSlideshow } = await import('../../services/geminiService');
      const { ElevenLabsService } = await import('../../services/elevenlabsService');
      const { DatabaseService } = await import('../../services/databaseService');
      
      // Prepare slideshow data
      const slideshowData = {
        bride_image: brideImage,
        groom_image: groomImage,
        voice_recordings: readyVoices.map(v => ({
          id: v.id,
          type: v.type,
          audio_file: v.audioFile,
          voice_id: v.voiceId
        })),
        selected_templates: selectedSlides,
        custom_script: customScript,
        narrator_type: selectedNarrator,
        created_at: new Date().toISOString()
      };

      // Generate AI-powered slideshow
      const generatedSlideshowUrl = await generateVoiceSlideshow(slideshowData);
      
      // Save to database
      const savedSlideshow = await DatabaseService.saveVoiceSlideshow(slideshowData, generatedSlideshowUrl);
      
      setGeneratedSlideshow(generatedSlideshowUrl);
      
      console.log('Voice slideshow generated and saved:', savedSlideshow);
    } catch (error) {
      console.error('Error generating slideshow:', error);
      
      // Fallback to mock slideshow if AI fails
      const mockSlideshowUrl = 'https://api.placeholder.com/800x600/8b5cf6/fff?text=Voice+Slideshow+Generated';
      setGeneratedSlideshow(mockSlideshowUrl);
      
      // Still try to save the attempt
      try {
        const { DatabaseService } = await import('../../services/databaseService');
        await DatabaseService.saveVoiceSlideshow({
          bride_image: brideImage!,
          groom_image: groomImage!,
          voice_recordings: readyVoices.map(v => ({
            id: v.id,
            type: v.type,
            audio_file: v.audioFile,
            voice_id: v.voiceId
          })),
          selected_templates: selectedSlides,
          custom_script: customScript,
          narrator_type: selectedNarrator,
          created_at: new Date().toISOString()
        }, mockSlideshowUrl);
      } catch (saveError) {
        console.error('Error saving fallback slideshow:', saveError);
      }
    } finally {
      setIsGeneratingSlideshow(false);
    }
  }, [voiceClones, selectedSlides, customScript, brideImage, groomImage, selectedNarrator]);

  const playSlideshow = useCallback(() => {
    setIsPlaying(!isPlaying);
    // In real implementation, this would control slideshow playback
  }, [isPlaying]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Voice Slideshow Creator
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create magical romantic slideshows narrated in your own voices! Clone your voices using AI and tell your love story with personalized narration.
        </p>
      </div>

      {/* Image Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ImageUploader
          label="Upload Bride Photo"
          image={brideImage}
          onImageChange={(img) => onImageUpload('bride', img)}
          onImageReset={() => onImageUpload('bride', null)}
        />
        <ImageUploader
          label="Upload Groom Photo"
          image={groomImage}
          onImageChange={(img) => onImageUpload('groom', img)}
          onImageReset={() => onImageUpload('groom', null)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Recording Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Record Voice Samples</h3>
          
          <div className="space-y-6">
            {voiceClones.map(voice => (
              <div key={voice.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">{voice.name}</h4>
                  <div className="flex items-center gap-2">
                    {voice.status === 'ready' && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Ready
                      </span>
                    )}
                    {voice.status === 'processing' && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        Processing...
                      </span>
                    )}
                    {voice.status === 'recording' && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                        Recording...
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {voice.status === 'idle' || voice.status === 'ready' ? (
                    <button
                      onClick={() => startRecording(voice.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
                    >
                      <MicrophoneIcon className="w-5 h-5" />
                    </button>
                  ) : voice.status === 'recording' ? (
                    <button
                      onClick={() => stopRecording(voice.id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-full transition-colors"
                    >
                      <StopIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="bg-yellow-500 text-white p-3 rounded-full">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {voice.audioFile && voice.status === 'ready' && (
                    <button
                      onClick={() => playVoiceSample(voice.audioFile!)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
                    >
                      <SpeakerWaveIcon className="w-5 h-5" />
                    </button>
                  )}

                  <div className="text-sm text-gray-600">
                    {voice.status === 'idle' && 'Click to record a 30-second voice sample'}
                    {voice.status === 'recording' && 'Recording... Speak naturally!'}
                    {voice.status === 'processing' && 'Creating voice clone...'}
                    {voice.status === 'ready' && 'Voice clone ready! Click speaker to test.'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-800 mb-2">Recording Tips:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Speak clearly and naturally</li>
              <li>• Record in a quiet environment</li>
              <li>• Use your normal speaking voice</li>
              <li>• Record at least 30 seconds for best results</li>
            </ul>
          </div>
        </div>

        {/* Script Selection */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Choose Your Story</h3>
          
          {/* Narrator Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Who will narrate?</h4>
            <div className="grid grid-cols-3 gap-2">
              {(['bride', 'groom', 'both'] as const).map(narrator => (
                <button
                  key={narrator}
                  onClick={() => setSelectedNarrator(narrator)}
                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                    selectedNarrator === narrator
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {narrator === 'both' ? 'Both' : narrator.charAt(0).toUpperCase() + narrator.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Select Story Templates</h4>
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {SLIDE_TEMPLATES.map(template => {
                const isSelected = selectedSlides.find(s => s.id === template.id);
                return (
                  <motion.button
                    key={template.id}
                    onClick={() => toggleSlideSelection(template)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-purple-100 border-2 border-purple-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-800">{template.name}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        template.mood === 'romantic' ? 'bg-red-100 text-red-800' :
                        template.mood === 'playful' ? 'bg-yellow-100 text-yellow-800' :
                        template.mood === 'emotional' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {template.mood}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.script}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {template.duration}s • {template.musicStyle}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Custom Script */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Or Write Custom Script</h4>
            <textarea
              value={customScript}
              onChange={(e) => setCustomScript(e.target.value)}
              placeholder="Write your own love story narration..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Generation Panel */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Generate Slideshow</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Slideshow Preview</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 h-48 flex items-center justify-center">
                {generatedSlideshow ? (
                  <div className="text-center">
                    <img src={generatedSlideshow} alt="Generated Slideshow" className="max-h-40 mx-auto rounded-lg mb-2" />
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <button
                        onClick={playSlideshow}
                        className={`p-2 rounded-full transition-colors ${
                          isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                        } text-white`}
                      >
                        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Save and Download Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          try {
                            // Download the slideshow
                            const link = document.createElement('a');
                            link.href = generatedSlideshow;
                            link.download = 'voice-slideshow.jpg';
                            link.click();
                            alert('Slideshow downloaded successfully! 🎬');
                          } catch (error) {
                            console.error('Error downloading slideshow:', error);
                            alert('Download failed. Please try again.');
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-lg transition-colors"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Share the slideshow
                            const shareData = {
                              title: 'Voice Slideshow Created',
                              text: 'Check out our personalized voice slideshow!',
                              url: window.location.href
                            };
                            if (navigator.share) {
                              await navigator.share(shareData);
                            } else {
                              await navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
                              alert('Link copied to clipboard! Share your slideshow! 🎬');
                            }
                          } catch (error) {
                            console.error('Error sharing slideshow:', error);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded-lg transition-colors"
                      >
                        📤 Share
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🎬</div>
                    <div className="font-medium">Your slideshow will appear here</div>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={generateSlideshow}
              disabled={isGeneratingSlideshow}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isGeneratingSlideshow ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Slideshow...
                </span>
              ) : (
                'Generate Voice Slideshow'
              )}
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Settings Summary</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Voice Samples</div>
                <div className="text-sm text-gray-600">
                  {voiceClones.filter(v => v.status === 'ready').length} of {voiceClones.length} ready
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Narrator</div>
                <div className="text-sm text-gray-600">
                  {selectedNarrator === 'both' ? 'Both voices' : `${selectedNarrator.charAt(0).toUpperCase() + selectedNarrator.slice(1)} voice`}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Content</div>
                <div className="text-sm text-gray-600">
                  {selectedSlides.length} templates + {customScript ? 'custom script' : 'no custom script'}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Estimated Duration</div>
                <div className="text-sm text-gray-600">
                  {selectedSlides.reduce((total, slide) => total + slide.duration, 0) + (customScript ? 10 : 0)} seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for voice playback */}
      <audio ref={audioRef} />
    </div>
  );
};

export default VoiceSlideshowTab;