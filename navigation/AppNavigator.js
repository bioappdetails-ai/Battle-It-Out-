import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../config/colors';
import fonts from '../config/fonts';
import HomeIcon from '../assets/navbar/home.svg';
import HomeIconActive from '../assets/navbar/home-colored.svg';
import DiscoverIcon from '../assets/navbar/discover.svg';
import DiscoverIconActive from '../assets/navbar/discover-colored.svg';
import BattlesIcon from '../assets/navbar/battles.svg';
import BattlesIconActive from '../assets/navbar/battles-colored.svg';
import ProfileIcon from '../assets/navbar/profile.svg';
import ProfileIconActive from '../assets/navbar/profile-colored.svg';
import UploadIcon from '../assets/navbar/upload.svg';
import UploadIconActive from '../assets/navbar/upload-colored.svg';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import VerificationScreen from '../screens/auth/VerificationScreen';
import ProfileCreationScreen from '../screens/auth/ProfileCreationScreen';

// Main App Screens
import HomeScreen from '../screens/main/HomeScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import BattlesScreen from '../screens/main/BattlesScreen';
import BattleUploadScreen from '../screens/main/BattleUploadScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import InboxScreen from '../screens/main/InboxScreen';
import MessageDetailsScreen from '../screens/main/MessageDetailsScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import ChallengeScreen from '../screens/main/ChallengeScreen';
import BattleViewScreen from '../screens/main/BattleViewScreen';

// Settings Screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import BlockAccountScreen from '../screens/settings/BlockAccountScreen';
import UpdateProfileScreen from '../screens/settings/UpdateProfileScreen';

// Security Screens
import UpdatePasswordScreen from '../screens/security/UpdatePasswordScreen';
import UpdateEmailScreen from '../screens/security/UpdateEmailScreen';
import UpdatePasswordVerificationScreen from '../screens/security/UpdatePasswordVerificationScreen';
import UpdateEmailVerificationScreen from '../screens/security/UpdateEmailVerificationScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          height: 80,
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fonts.medium,
          marginTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            focused ? (
              <HomeIconActive width={24} height={24} style={{ marginTop: 15 }} />
            ) : (
              <HomeIcon width={24} height={24} style={{ marginTop: 15 }} />
            )
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: "Discover",
          tabBarIcon: ({ focused }) => (
            focused ? (
              <DiscoverIconActive width={24} height={24} style={{ marginTop: 15 }} />
            ) : (
              <DiscoverIcon width={24} height={24} style={{ marginTop: 15 }} />
            )
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={BattleUploadScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            focused ? (
              <UploadIconActive width={60} height={60} style={{ marginTop: 22.5 }} />
            ) : (
              <UploadIcon width={60} height={60} style={{ marginTop: 22.5 }} />
            )
          ),
        }}
      />
      <Tab.Screen
        name="Battles"
        component={BattlesScreen}
        options={{
          tabBarLabel: "Battles",
          tabBarIcon: ({ focused }) => (
            focused ? (
              <BattlesIconActive width={24} height={24} style={{ marginTop: 15 }} />
            ) : (
              <BattlesIcon width={24} height={24} style={{ marginTop: 15 }} />
            )
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            focused ? (
              <ProfileIconActive width={24} height={24} style={{ marginTop: 15 }} />
            ) : (
              <ProfileIcon width={24} height={24} style={{ marginTop: 15 }} />
            )
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="ProfileCreation" component={ProfileCreationScreen} />
        
        {/* Main App */}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="MessageDetails" component={MessageDetailsScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="Challenge" component={ChallengeScreen} />
        <Stack.Screen name="BattleView" component={BattleViewScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
        <Stack.Screen name="UpdatePasswordVerification" component={UpdatePasswordVerificationScreen} />
        <Stack.Screen name="UpdateEmail" component={UpdateEmailScreen} />
        <Stack.Screen name="UpdateEmailVerification" component={UpdateEmailVerificationScreen} />
        <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} />
        <Stack.Screen name="BlockAccount" component={BlockAccountScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

