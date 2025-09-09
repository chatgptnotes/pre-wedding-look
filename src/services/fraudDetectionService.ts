import { supabase } from './supabase';

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  canvasFingerprint: string;
  webglFingerprint: string;
  audioFingerprint: string;
  plugins: string[];
  fonts: string[];
  hardwareConcurrency: number;
  deviceMemory: number;
  colorDepth: number;
}

export interface FraudDetectionEvent {
  id: string;
  user_id?: string;
  event_type: string;
  risk_score: number;
  description: string;
  evidence: any;
  detection_rules: string[];
  fingerprint_id?: string;
  ip_tracking_id?: string;
  action_taken?: string;
  auto_resolved: boolean;
  created_at: string;
}

export interface UserRiskProfile {
  id: string;
  user_id: string;
  overall_risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'critical';
  account_age_hours: number;
  login_frequency: number;
  content_creation_rate: number;
  is_shadow_banned: boolean;
  requires_human_review: boolean;
  max_daily_generations: number;
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;
  last_risk_assessment: string;
  last_fraud_check: string;
  created_at: string;
  updated_at: string;
}

export interface VelocityCheck {
  action: string;
  count: number;
  time_window_minutes: number;
  max_allowed: number;
  is_exceeded: boolean;
}

class FraudDetectionService {
  private readonly VELOCITY_LIMITS = {
    account_creation: { count: 3, window: 60 }, // 3 accounts per hour per IP
    login_attempts: { count: 10, window: 15 }, // 10 login attempts per 15 minutes
    content_generation: { count: 50, window: 60 }, // 50 generations per hour
    referral_creation: { count: 10, window: 24 * 60 }, // 10 referrals per day
    password_reset: { count: 5, window: 60 }, // 5 password resets per hour
  };

  /**
   * Generate device fingerprint from browser data
   */
  generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    return new Promise((resolve) => {
      const fingerprint: Partial<DeviceFingerprint> = {};

      // Basic browser info
      fingerprint.userAgent = navigator.userAgent;
      fingerprint.platform = navigator.platform;
      fingerprint.language = navigator.language;
      fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fingerprint.screenResolution = `${screen.width}x${screen.height}`;
      fingerprint.colorDepth = screen.colorDepth;
      fingerprint.hardwareConcurrency = navigator.hardwareConcurrency || 0;
      fingerprint.deviceMemory = (navigator as any).deviceMemory || 0;

      // Canvas fingerprinting
      fingerprint.canvasFingerprint = this.generateCanvasFingerprint();

      // WebGL fingerprinting
      fingerprint.webglFingerprint = this.generateWebGLFingerprint();

      // Audio fingerprinting
      this.generateAudioFingerprint().then((audioFp) => {
        fingerprint.audioFingerprint = audioFp;

        // Plugin detection
        fingerprint.plugins = Array.from(navigator.plugins).map(p => p.name);

        // Font detection
        this.detectFonts().then((fonts) => {
          fingerprint.fonts = fonts;
          resolve(fingerprint as DeviceFingerprint);
        });
      });
    });
  }

  private generateCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      canvas.width = 200;
      canvas.height = 50;

      // Draw text with various properties
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint test 🔐', 2, 2);

      // Draw some shapes
      ctx.fillStyle = 'rgba(102, 204, 0, 0.2)';
      ctx.fillRect(100, 5, 80, 20);

      return canvas.toDataURL().slice(-100); // Last 100 chars for uniqueness
    } catch {
      return '';
    }
  }

  private generateWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      const version = gl.getParameter(gl.VERSION);
      
      return `${vendor}|${renderer}|${version}`.slice(0, 100);
    } catch {
      return '';
    }
  }

  private async generateAudioFingerprint(): Promise<string> {
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        return '';
      }

      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      return new Promise((resolve) => {
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;

        gainNode.gain.value = 0;
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);

        scriptProcessor.onaudioprocess = function(bins) {
          const audioData = bins.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < audioData.length; i++) {
            sum += Math.abs(audioData[i]);
          }
          const audioFingerprint = sum.toString().slice(0, 50);
          oscillator.disconnect();
          resolve(audioFingerprint);
        };

        oscillator.start();
        
        // Fallback timeout
        setTimeout(() => resolve(''), 1000);
      });
    } catch {
      return '';
    }
  }

  private async detectFonts(): Promise<string[]> {
    try {
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testFonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
        'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
        'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Console'
      ];

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      const baseMeasurements: { [key: string]: { width: number; height: number } } = {};
      
      // Measure base fonts
      for (const baseFont of baseFonts) {
        ctx.font = `72px ${baseFont}`;
        const metrics = ctx.measureText('mmmmmmmmmmlli');
        baseMeasurements[baseFont] = {
          width: metrics.width,
          height: 72
        };
      }

      const availableFonts: string[] = [];

      // Test each font
      for (const testFont of testFonts) {
        let detected = false;
        
        for (const baseFont of baseFonts) {
          ctx.font = `72px ${testFont}, ${baseFont}`;
          const metrics = ctx.measureText('mmmmmmmmmmlli');
          
          if (metrics.width !== baseMeasurements[baseFont].width) {
            detected = true;
            break;
          }
        }
        
        if (detected) {
          availableFonts.push(testFont);
        }
      }

      return availableFonts;
    } catch {
      return [];
    }
  }

  /**
   * Record device fingerprint in database
   */
  async recordDeviceFingerprint(
    userId: string,
    fingerprint: DeviceFingerprint
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('record_device_fingerprint', {
        user_uuid: userId,
        fingerprint_data: fingerprint
      });

      if (error) throw error;

      return data; // Returns fingerprint ID
    } catch (error) {
      console.error('Error recording device fingerprint:', error);
      throw error;
    }
  }

  /**
   * Record IP address and perform geolocation lookup
   */
  async recordIPAddress(
    userId: string,
    ipAddress: string
  ): Promise<{
    ip_tracking_id: string;
    risk_score: number;
    is_suspicious: boolean;
  }> {
    try {
      // Hash IP for privacy
      const encoder = new TextEncoder();
      const data = encoder.encode(ipAddress);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Get geolocation data (using a free service for demo)
      let geoData = null;
      try {
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (response.ok) {
          geoData = await response.json();
        }
      } catch {
        // Geolocation lookup failed, continue without geo data
      }

      // Insert or update IP tracking record
      const { data: ipTracking, error } = await supabase
        .from('ip_address_tracking')
        .insert({
          ip_address: ipAddress,
          ip_hash: ipHash,
          country: geoData?.country_code || null,
          region: geoData?.region || null,
          city: geoData?.city || null,
          isp: geoData?.org || null,
          is_vpn: geoData?.type === 'VPN' || false,
          is_tor: geoData?.type === 'TOR' || false,
          is_datacenter: geoData?.type === 'Datacenter' || false,
          risk_score: this.calculateIPRiskScore(geoData),
          user_count: 1,
          request_count: 1
        })
        .select()
        .single();

      if (error && error.code === '23505') {
        // IP already exists, update it
        const { data: existingIP, error: updateError } = await supabase
          .from('ip_address_tracking')
          .update({
            last_seen: new Date().toISOString(),
            user_count: supabase.raw('user_count + 1'),
            request_count: supabase.raw('request_count + 1')
          })
          .eq('ip_hash', ipHash)
          .select()
          .single();

        if (updateError) throw updateError;
        
        // Record user-IP association
        await supabase
          .from('user_ip_associations')
          .insert({
            user_id: userId,
            ip_tracking_id: existingIP.id,
            last_used: new Date().toISOString(),
            usage_count: 1
          })
          .on('conflict', 'user_id,ip_tracking_id')
          .update({
            last_used: new Date().toISOString(),
            usage_count: supabase.raw('usage_count + 1')
          });

        return {
          ip_tracking_id: existingIP.id,
          risk_score: existingIP.risk_score,
          is_suspicious: existingIP.risk_score > 0.7
        };
      } else if (error) {
        throw error;
      }

      // Record user-IP association
      await supabase
        .from('user_ip_associations')
        .insert({
          user_id: userId,
          ip_tracking_id: ipTracking.id,
          last_used: new Date().toISOString(),
          usage_count: 1
        });

      return {
        ip_tracking_id: ipTracking.id,
        risk_score: ipTracking.risk_score,
        is_suspicious: ipTracking.risk_score > 0.7
      };
    } catch (error) {
      console.error('Error recording IP address:', error);
      throw error;
    }
  }

  private calculateIPRiskScore(geoData: any): number {
    let riskScore = 0;

    if (geoData?.type === 'VPN') riskScore += 0.3;
    if (geoData?.type === 'TOR') riskScore += 0.8;
    if (geoData?.type === 'Datacenter') riskScore += 0.5;
    
    // High-risk countries (example list)
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    if (highRiskCountries.includes(geoData?.country_code)) {
      riskScore += 0.2;
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * Check velocity limits for various actions
   */
  async checkVelocityLimits(
    action: keyof typeof this.VELOCITY_LIMITS,
    userId?: string,
    ipAddress?: string
  ): Promise<VelocityCheck> {
    try {
      const limit = this.VELOCITY_LIMITS[action];
      const timeWindow = new Date(Date.now() - limit.window * 60 * 1000);

      let count = 0;

      // Check based on action type and available identifiers
      if (action === 'account_creation' && ipAddress) {
        // Check account creation by IP
        const ipHash = await this.hashString(ipAddress);
        const { data } = await supabase
          .from('user_ip_associations')
          .select(`
            user_id,
            ip_address_tracking!inner(ip_hash)
          `)
          .eq('ip_address_tracking.ip_hash', ipHash)
          .gte('created_at', timeWindow.toISOString());
        
        count = data?.length || 0;
      } else if (userId) {
        // Check user-specific actions
        const auditEventTypes: { [key: string]: string } = {
          login_attempts: 'login_attempt',
          content_generation: 'content_generation',
          referral_creation: 'referral_created',
          password_reset: 'password_reset'
        };

        const eventType = auditEventTypes[action];
        if (eventType) {
          const { data } = await supabase
            .from('security_audit_log')
            .select('id')
            .eq('user_id', userId)
            .eq('event_type', eventType)
            .gte('created_at', timeWindow.toISOString());
          
          count = data?.length || 0;
        }
      }

      const isExceeded = count >= limit.count;

      return {
        action,
        count,
        time_window_minutes: limit.window,
        max_allowed: limit.count,
        is_exceeded: isExceeded
      };
    } catch (error) {
      console.error('Error checking velocity limits:', error);
      // Return non-blocking result on error
      return {
        action,
        count: 0,
        time_window_minutes: this.VELOCITY_LIMITS[action].window,
        max_allowed: this.VELOCITY_LIMITS[action].count,
        is_exceeded: false
      };
    }
  }

  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Detect potential fraud patterns
   */
  async detectFraudPatterns(userId: string): Promise<FraudDetectionEvent[]> {
    try {
      const events: FraudDetectionEvent[] = [];

      // Check for multiple accounts from same device
      const { data: deviceAssociations } = await supabase
        .from('user_device_associations')
        .select(`
          user_id,
          device_fingerprints!inner(fingerprint_hash, user_count)
        `)
        .eq('user_id', userId);

      if (deviceAssociations) {
        for (const assoc of deviceAssociations) {
          const userCount = assoc.device_fingerprints.user_count;
          if (userCount > 3) {
            events.push({
              id: '',
              user_id: userId,
              event_type: 'multiple_accounts_same_device',
              risk_score: Math.min(0.3 + (userCount * 0.1), 1.0),
              description: `Device shared by ${userCount} users`,
              evidence: { user_count: userCount, fingerprint_hash: assoc.device_fingerprints.fingerprint_hash },
              detection_rules: ['device_sharing_threshold'],
              action_taken: userCount > 5 ? 'flag_user' : undefined,
              auto_resolved: false,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      // Check for rapid content generation
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { data: recentContent } = await supabase
        .from('security_audit_log')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'content_generation')
        .gte('created_at', oneHourAgo.toISOString());

      if (recentContent && recentContent.length > 30) {
        events.push({
          id: '',
          user_id: userId,
          event_type: 'rapid_content_generation',
          risk_score: 0.6,
          description: `${recentContent.length} content generations in past hour`,
          evidence: { generation_count: recentContent.length, time_window: '1 hour' },
          detection_rules: ['content_velocity_threshold'],
          action_taken: 'rate_limit',
          auto_resolved: false,
          created_at: new Date().toISOString()
        });
      }

      // Check for suspicious IP patterns
      const { data: ipAssociations } = await supabase
        .from('user_ip_associations')
        .select(`
          ip_address_tracking!inner(is_vpn, is_tor, is_datacenter, risk_score, country)
        `)
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (ipAssociations) {
        const highRiskIPs = ipAssociations.filter(ip => 
          ip.ip_address_tracking.risk_score > 0.7 ||
          ip.ip_address_tracking.is_tor ||
          ip.ip_address_tracking.is_vpn
        );

        if (highRiskIPs.length > 0) {
          events.push({
            id: '',
            user_id: userId,
            event_type: 'suspicious_ip_usage',
            risk_score: 0.5,
            description: `Using ${highRiskIPs.length} high-risk IP addresses`,
            evidence: { 
              high_risk_ips: highRiskIPs.length,
              vpn_usage: highRiskIPs.some(ip => ip.ip_address_tracking.is_vpn),
              tor_usage: highRiskIPs.some(ip => ip.ip_address_tracking.is_tor)
            },
            detection_rules: ['suspicious_ip_threshold'],
            auto_resolved: false,
            created_at: new Date().toISOString()
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error detecting fraud patterns:', error);
      return [];
    }
  }

  /**
   * Record fraud detection event
   */
  async recordFraudEvent(event: Omit<FraudDetectionEvent, 'id' | 'created_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('fraud_detection_events')
        .insert(event)
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error recording fraud event:', error);
      throw error;
    }
  }

  /**
   * Assess overall user risk
   */
  async assessUserRisk(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('assess_user_risk', {
        user_uuid: userId
      });

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('Error assessing user risk:', error);
      return 0;
    }
  }

  /**
   * Get user risk profile
   */
  async getUserRiskProfile(userId: string): Promise<UserRiskProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_risk_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user risk profile:', error);
      throw error;
    }
  }

  /**
   * Update user risk profile
   */
  async updateUserRiskProfile(
    userId: string,
    updates: Partial<UserRiskProfile>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_risk_profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user risk profile:', error);
      throw error;
    }
  }

  /**
   * Check if action should be blocked based on risk assessment
   */
  shouldBlockAction(riskScore: number, actionType: string): {
    shouldBlock: boolean;
    reason?: string;
    actionTaken?: string;
  } {
    // Critical risk - block all actions
    if (riskScore >= 0.9) {
      return {
        shouldBlock: true,
        reason: 'Critical fraud risk detected',
        actionTaken: 'block_all_actions'
      };
    }

    // High risk - restrict certain actions
    if (riskScore >= 0.7) {
      const restrictedActions = ['content_generation', 'referral_creation', 'profile_update'];
      if (restrictedActions.includes(actionType)) {
        return {
          shouldBlock: true,
          reason: 'High fraud risk - action restricted',
          actionTaken: 'restrict_high_risk_actions'
        };
      }
    }

    // Medium risk - require additional verification
    if (riskScore >= 0.5) {
      const verificationActions = ['payment', 'sensitive_data_access'];
      if (verificationActions.includes(actionType)) {
        return {
          shouldBlock: true,
          reason: 'Medium fraud risk - verification required',
          actionTaken: 'require_verification'
        };
      }
    }

    return { shouldBlock: false };
  }
}

export const fraudDetectionService = new FraudDetectionService();