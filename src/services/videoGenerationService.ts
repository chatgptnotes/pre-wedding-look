import html2canvas from 'html2canvas';

interface VideoFrame {
  imageData: string;
  duration: number;
  text?: string;
  effects?: {
    fade?: boolean;
    zoom?: boolean;
    slide?: 'left' | 'right' | 'up' | 'down';
  };
}

interface VideoTemplate {
  name: string;
  frames: VideoFrame[];
  music?: string;
  totalDuration: number;
}

export class VideoGenerationService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1080;
    this.canvas.height = 1920; // 9:16 aspect ratio for social media
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Generate a video reel from game results
   */
  async generateGameReel(gameResults: {
    sessionId: string;
    participants: Array<{
      avatar: string;
      designs: string[];
      reveals: string[];
    }>;
    rounds: Array<{
      theme: string;
      designs: Array<{
        image: string;
        participant: string;
      }>;
    }>;
  }): Promise<Blob> {
    const frames: VideoFrame[] = [];

    // Title frame
    frames.push(this.createTitleFrame('Blind Date Style-Off Results'));

    // Participant introduction frames
    for (const participant of gameResults.participants) {
      frames.push(this.createParticipantFrame(participant));
    }

    // Round results frames
    for (const round of gameResults.rounds) {
      frames.push(this.createRoundFrame(round));
    }

    // Final reveal frames
    frames.push(this.createRevealFrame(gameResults.participants));

    // Call-to-action frame
    frames.push(this.createCTAFrame());

    return this.renderVideoFromFrames(frames);
  }

  /**
   * Generate a highlight reel from multiple photos
   */
  async generatePhotoReel(photos: Array<{
    url: string;
    title?: string;
    description?: string;
  }>): Promise<Blob> {
    const frames: VideoFrame[] = [];

    frames.push(this.createTitleFrame('PreWedding AI Studio'));

    for (const photo of photos) {
      frames.push({
        imageData: photo.url,
        duration: 2000,
        text: photo.title || photo.description,
        effects: {
          fade: true,
          zoom: true
        }
      });
    }

    frames.push(this.createCTAFrame());

    return this.renderVideoFromFrames(frames);
  }

  /**
   * Create title frame
   */
  private createTitleFrame(title: string): VideoFrame {
    // Create a gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#EC4899');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Add title text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 72px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2);

    // Add subtitle
    this.ctx.font = '36px Arial';
    this.ctx.fillText('AI-Powered Pre-Wedding Magic ✨', this.canvas.width / 2, this.canvas.height / 2 + 120);

    return {
      imageData: this.canvas.toDataURL(),
      duration: 3000,
      effects: { fade: true }
    };
  }

  /**
   * Create participant introduction frame
   */
  private createParticipantFrame(participant: any): VideoFrame {
    // Clear canvas
    this.ctx.fillStyle = '#1F2937';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Add participant avatar/design
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Meet ${participant.avatar}`, this.canvas.width / 2, 200);

    return {
      imageData: this.canvas.toDataURL(),
      duration: 2500,
      effects: { slide: 'left' }
    };
  }

  /**
   * Create round results frame
   */
  private createRoundFrame(round: any): VideoFrame {
    // Clear canvas
    this.ctx.fillStyle = '#0F172A';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Add round title
    this.ctx.fillStyle = '#F59E0B';
    this.ctx.font = 'bold 54px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Round: ${round.theme}`, this.canvas.width / 2, 150);

    return {
      imageData: this.canvas.toDataURL(),
      duration: 3000,
      effects: { zoom: true }
    };
  }

  /**
   * Create reveal frame
   */
  private createRevealFrame(participants: any[]): VideoFrame {
    // Create reveal effect
    this.ctx.fillStyle = '#DC2626';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 64px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('The Big Reveal! 🎉', this.canvas.width / 2, this.canvas.height / 2);

    return {
      imageData: this.canvas.toDataURL(),
      duration: 3000,
      effects: { fade: true, zoom: true }
    };
  }

  /**
   * Create call-to-action frame
   */
  private createCTAFrame(): VideoFrame {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#DB2777');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Main CTA text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 56px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Create Your Own', this.canvas.width / 2, this.canvas.height / 2 - 100);
    this.ctx.fillText('AI Wedding Photos!', this.canvas.width / 2, this.canvas.height / 2);

    // Website URL
    this.ctx.font = '32px Arial';
    this.ctx.fillText('PreWeddingAI.com', this.canvas.width / 2, this.canvas.height / 2 + 150);

    // Decorative elements
    this.ctx.font = '48px Arial';
    this.ctx.fillText('💍 ✨ 💕', this.canvas.width / 2, this.canvas.height / 2 + 250);

    return {
      imageData: this.canvas.toDataURL(),
      duration: 4000,
      effects: { fade: true }
    };
  }

  /**
   * Capture element as image for video frame
   */
  async captureElementAsFrame(element: HTMLElement): Promise<string> {
    try {
      const canvas = await html2canvas(element, {
        width: 1080,
        height: 1920,
        scale: 2,
        backgroundColor: null,
        useCORS: true
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing element:', error);
      throw error;
    }
  }

  /**
   * Render video from frames (simplified - in real implementation would use WebAssembly or server-side processing)
   */
  private async renderVideoFromFrames(frames: VideoFrame[]): Promise<Blob> {
    // This is a simplified version - in production, you'd use:
    // 1. FFmpeg WASM for client-side video generation
    // 2. Server-side video processing with real FFmpeg
    // 3. Third-party APIs like Shotstack or Bannerbear

    // For now, create a slideshow-like experience
    return this.createSlideshowBlob(frames);
  }

  /**
   * Create a slideshow blob (fallback implementation)
   */
  private async createSlideshowBlob(frames: VideoFrame[]): Promise<Blob> {
    // Create a simple HTML-based slideshow for demo purposes
    const slideshowHTML = this.generateSlideshowHTML(frames);
    
    return new Blob([slideshowHTML], { type: 'text/html' });
  }

  /**
   * Generate HTML slideshow
   */
  private generateSlideshowHTML(frames: VideoFrame[]): string {
    const frameElements = frames.map((frame, index) => `
      <div class="slide" style="
        background-image: url('${frame.imageData}');
        background-size: cover;
        background-position: center;
        width: 100%;
        height: 100vh;
        display: ${index === 0 ? 'block' : 'none'};
        animation-duration: ${frame.duration}ms;
      ">
        ${frame.text ? `<div class="slide-text">${frame.text}</div>` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PreWedding AI Video</title>
          <style>
            body { margin: 0; padding: 0; background: black; }
            .slideshow { position: relative; width: 100%; height: 100vh; }
            .slide { 
              position: absolute; 
              top: 0; 
              left: 0;
              transition: opacity 0.5s ease-in-out;
            }
            .slide-text {
              position: absolute;
              bottom: 100px;
              left: 50%;
              transform: translateX(-50%);
              color: white;
              font-size: 48px;
              font-weight: bold;
              text-align: center;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .fade-in { animation: fadeIn 0.5s ease-in; }
          </style>
        </head>
        <body>
          <div class="slideshow">
            ${frameElements}
          </div>
          <script>
            let currentSlide = 0;
            const slides = document.querySelectorAll('.slide');
            const durations = ${JSON.stringify(frames.map(f => f.duration))};
            
            function showNextSlide() {
              if (currentSlide < slides.length - 1) {
                slides[currentSlide].style.display = 'none';
                currentSlide++;
                slides[currentSlide].style.display = 'block';
                slides[currentSlide].classList.add('fade-in');
                setTimeout(showNextSlide, durations[currentSlide]);
              } else {
                // Loop back to beginning
                slides[currentSlide].style.display = 'none';
                currentSlide = 0;
                slides[currentSlide].style.display = 'block';
                setTimeout(showNextSlide, durations[currentSlide]);
              }
            }
            
            setTimeout(showNextSlide, durations[0]);
          </script>
        </body>
      </html>
    `;
  }

  /**
   * Share video to social media platforms
   */
  async shareToSocialMedia(videoBlob: Blob, platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook') {
    const shareData = {
      title: 'Check out my AI-generated wedding photos!',
      text: 'Created with PreWedding AI Studio - amazing results! 💍✨',
      files: [new File([videoBlob], 'wedding-video.mp4', { type: 'video/mp4' })]
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return { success: true };
      } catch (error) {
        console.error('Error sharing:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Fallback - download the video
      const url = URL.createObjectURL(videoBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prewedding-ai-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true, message: 'Video downloaded for manual sharing' };
    }
  }
}

export const videoService = new VideoGenerationService();