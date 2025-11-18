import React from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../config/colors';
import fonts from '../config/fonts';

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
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          // alignItems: 'center',
          // justifyContent: 'center',
          paddingVertical: 8,
          // paddingTop: 8,
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
            <Image
              source={
                focused
                  ? require("../assets/navbar/1 (1).png")
                  : require("../assets/navbar/1 (2).png")
              }
              style={{ width: 24, height: 24, marginTop: 15 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: "Discover",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../assets/navbar/2 (2).png")
                  : require("../assets/navbar/2 (1).png")
              }
              style={{ width: 24, height: 24, marginTop: 15 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={BattleUploadScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../assets/navbar/3.png")}
              style={{
                width: 60,
                height: 60,
                marginTop: 20,
                // marginBottom: 10,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Battles"
        component={BattlesScreen}
        options={{
          tabBarLabel: "Battles",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../assets/navbar/4 (2).png")
                  : require("../assets/navbar/4 (1).png")
              }
              style={{ width: 24, height: 24, marginTop: 15 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require("../assets/navbar/5 (2).png")
                  : require("../assets/navbar/5 (1).png")
              }
              style={{ width: 24, height: 24, marginTop: 15 }}
              resizeMode="contain"
            />
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

