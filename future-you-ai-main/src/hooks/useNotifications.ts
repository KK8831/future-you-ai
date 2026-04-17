import { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermissions();
    // Register listeners
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        toast({
          title: notification.title,
          description: notification.body,
        });
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('Notification action performed', action);
        // Handle routing or actions based on action.notification.extra
      });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.removeAllListeners();
      }
    };
  }, []);

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const { display } = await LocalNotifications.checkPermissions();
      setHasPermission(display === 'granted');
    } catch (e) {
      console.error("Could not check notification permissions", e);
    }
  };

  const requestPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "Browser Mode",
        description: "Notifications are optimized for native Android/iOS devices.",
      });
      return false;
    }
    
    try {
      const { display } = await LocalNotifications.requestPermissions();
      const granted = display === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (e) {
      console.error("Could not request notification permissions", e);
      return false;
    }
  };

  const scheduleDailyStreakReminder = async (enabled: boolean) => {
    if (!Capacitor.isNativePlatform()) return;

    // First cancel any existing streak reminders
    try {
      const pending = await LocalNotifications.getPending();
      const streakReminders = pending.notifications.filter(n => n.id === 101);
      if (streakReminders.length > 0) {
        await LocalNotifications.cancel({ notifications: streakReminders });
      }

      if (enabled) {
        // If enabling, we need permission
        const permission = hasPermission || await requestPermissions();
        if (!permission) return;

        // Schedule for 8:00 PM every day
        await LocalNotifications.schedule({
          notifications: [
            {
              title: "🔥 Don't lose your streak!",
              body: "Take 30 seconds to log your daily health metrics and protect your FutureMe score.",
              id: 101, // dedicated ID for daily reminder
              schedule: { 
                allowWhileIdle: true,
                on: { hour: 20, minute: 0 } // 8:00 PM daily
              },
              sound: 'beep.caf',
              smallIcon: 'ic_stat_name', // Needs to be generated in Android Studio later
            }
          ]
        });

        console.log("Daily streak reminder scheduled for 8:00 PM");
      }
    } catch (e) {
      console.error("Failed to schedule daily reminder", e);
    }
  };

  return {
    hasPermission,
    requestPermissions,
    scheduleDailyStreakReminder
  };
};
