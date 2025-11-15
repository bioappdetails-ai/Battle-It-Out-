import React from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import colors from '../config/colors';
import fonts from '../config/fonts';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerificationScreen from '../screens/VerificationScreen';
import ProfileCreationScreen from '../screens/ProfileCreationScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import BattlesScreen from '../screens/BattlesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SecurityScreen from '../screens/SecurityScreen';
import BlockAccountScreen from '../screens/BlockAccountScreen';
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen';
import UpdateEmailScreen from '../screens/UpdateEmailScreen';
import UpdatePasswordVerificationScreen from '../screens/UpdatePasswordVerificationScreen';
import UpdateEmailVerificationScreen from '../screens/UpdateEmailVerificationScreen';
import UpdateProfileScreen from '../screens/UpdateProfileScreen';

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
        component={BattlesScreen}
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
        <Stack.Screen name="Messages" component={MessagesScreen} />
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

