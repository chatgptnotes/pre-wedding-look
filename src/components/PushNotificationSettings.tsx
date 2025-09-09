import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePushNotifications } from '../hooks/usePWA';
import { pushNotificationService } from '../services/pushNotificationService';
import { useAnalytics } from '../hooks/useAnalytics';

interface NotificationPreferences {
  gameUpdates: boolean;
  tournaments: boolean;
  dailyReminders: boolean;
  streakReminders: boolean;
  marketing: boolean;
}

export const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  
  const { track } = useAnalytics();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    gameUpdates: true,
    tournaments: true,
    dailyReminders: false,
    streakReminders: true,
    marketing: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userPrefs = await pushNotificationService.getPreferences();
        if (userPrefs) {
          setPreferences(userPrefs);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  const handleEnableNotifications = async () => {
    track('notification_enable_clicked');
    
    if (permission === 'default') {
      const granted = await requestPermission();
      if (!granted) {
        track('notification_permission_denied');
        return;
      }
    }

    if (!isSubscribed) {
      await subscribe();
    }
  };

  const handleDisableNotifications = async () => {
    track('notification_disable_clicked');
    await unsubscribe();
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    setIsSaving(true);
    try {
      await pushNotificationService.updatePreferences(newPreferences);
      track('notification_preferences_updated', { [key]: value });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revert on error
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    track('test_notification_sent');
    const success = await sendTestNotification();
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
          📱
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Notifications Not Supported
        </h3>
        <p className="text-gray-600 text-sm">
          Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl">
              🔔
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
              <p className="text-gray-600 text-sm mt-1">
                Get notified about game matches, tournaments, and app updates
              </p>
              
              {permission === 'denied' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">
                    Notifications are blocked. You can enable them in your browser settings.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            {!isSubscribed && permission !== 'denied' && (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Enable'}
              </button>
            )}

            {isSubscribed && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Enabled</span>
                </div>
                <button
                  onClick={handleDisableNotifications}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Disable
                </button>
              </>
            )}
          </div>
        </div>

        {/* Test notification */}
        {isSubscribed && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleTestNotification}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              {testSent ? '✓ Test sent!' : 'Send test notification'}
            </button>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      {isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Preferences
          </h4>
          
          <div className="space-y-4">
            <PreferenceToggle
              id="gameUpdates"
              title="Game Updates"
              description="When someone joins your game or matches with you"
              icon="🎮"
              checked={preferences.gameUpdates}
              onChange={(checked) => handlePreferenceChange('gameUpdates', checked)}
              disabled={isSaving}
            />

            <PreferenceToggle
              id="tournaments"
              title="Tournament Notifications"
              description="Daily tournaments and competition updates"
              icon="🏆"
              checked={preferences.tournaments}
              onChange={(checked) => handlePreferenceChange('tournaments', checked)}
              disabled={isSaving}
            />

            <PreferenceToggle
              id="dailyReminders"
              title="Daily Reminders"
              description="Gentle reminders to play and earn credits"
              icon="📅"
              checked={preferences.dailyReminders}
              onChange={(checked) => handlePreferenceChange('dailyReminders', checked)}
              disabled={isSaving}
            />

            <PreferenceToggle
              id="streakReminders"
              title="Streak Reminders"
              description="Don't lose your winning streak!"
              icon="🔥"
              checked={preferences.streakReminders}
              onChange={(checked) => handlePreferenceChange('streakReminders', checked)}
              disabled={isSaving}
            />

            <PreferenceToggle
              id="marketing"
              title="Marketing & Updates"
              description="New features, events, and special offers"
              icon="📢"
              checked={preferences.marketing}
              onChange={(checked) => handlePreferenceChange('marketing', checked)}
              disabled={isSaving}
            />
          </div>

          {isSaving && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Saving preferences...
            </div>
          )}
        </motion.div>
      )}

      {/* Information about notifications */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          About Push Notifications
        </h4>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• Notifications work even when the app is closed</p>
          <p>• You can change these settings anytime</p>
          <p>• We'll never spam you or send unnecessary notifications</p>
          <p>• Your privacy is protected - notifications are processed securely</p>
        </div>
      </div>
    </div>
  );
};

interface PreferenceToggleProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const PreferenceToggle: React.FC<PreferenceToggleProps> = ({
  id,
  title,
  description,
  icon,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <label htmlFor={id} className="font-medium text-gray-900 cursor-pointer">
            {title}
          </label>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600 disabled:opacity-50"></div>
      </label>
    </div>
  );
};

export default PushNotificationSettings;