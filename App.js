import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, AppState } from 'react-native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import { fontAssets } from './config/fonts';
import colors from './config/colors';
import { onAuthStateChange, getCurrentUser } from './services/authService';
import { registerPushToken } from './services/notificationService';

function App() {
  const [fontsLoaded] = useFonts(fontAssets);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const appState = useRef(AppState.currentState);
  const inactivityTimer = useRef(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Register push notifications
  useEffect(() => {
    // Register notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.notificationId) {
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Register push token and start online status tracking when user logs in
  useEffect(() => {
    if (user && user.uid) {
      registerPushToken(user.uid).catch((error) => {
      });

      // Start online status tracking
      const { startOnlineStatusTracking } = require('./services/onlineStatusService');
      startOnlineStatusTracking();
    } else {
      // Stop online status tracking when user logs out
      const { stopOnlineStatusTracking } = require('./services/onlineStatusService');
      stopOnlineStatusTracking();
    }

    return () => {
      // Cleanup on unmount
      if (!user) {
        const { stopOnlineStatusTracking } = require('./services/onlineStatusService');
        stopOnlineStatusTracking();
      }
    };
  }, [user]);

  // Auto-logout after inactivity
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - reset inactivity timer
        resetInactivityTimer();
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background - start inactivity timer
        startInactivityTimer();
      }

      appState.current = nextAppState;
    });

    // Reset timer on any user interaction
    resetInactivityTimer();

    return () => {
      subscription?.remove();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user]);

  const startInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    if (!user) return;

    inactivityTimer.current = setTimeout(() => {
      // Auto-logout after inactivity
      const { signOutUser } = require('./services/authService');
      signOutUser().catch((error) => {
      });
    }, INACTIVITY_TIMEOUT);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (user) {
      startInactivityTimer();
    }
  };

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (initializing) {
        setInitializing(false);
      }
      // Reset inactivity timer on auth state change
      resetInactivityTimer();
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, [initializing]);

  if (!fontsLoaded || initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AppNavigator />
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}

export default App;
