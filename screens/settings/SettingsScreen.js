import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileIcon from '../../assets/settings/profile.svg';
import SecuritySafeIcon from '../../assets/settings/security-safe.svg';
import ProfileDeleteIcon from '../../assets/settings/profile-delete.svg';
import LogoutIcon from '../../assets/settings/logout.svg';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomHeader from '../../components/CustomHeader';

const SettingsScreen = ({ navigation }) => {
  const handleEditProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  const handleSecurity = () => {
    navigation.navigate('Security');
  };

  const handleBlockAccount = () => {
    navigation.navigate('BlockAccount');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') },
      ]
    );
  };

  const SettingItem = ({ iconSource, SvgIcon, title, subtitle, onPress, showBorder = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingContent}>
        <View style={styles.iconContainer}>
          {SvgIcon ? (
            <SvgIcon width={24} height={24} fill={colors.primary} />
          ) : iconSource ? (
            <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
          ) : (
            <Ionicons name="settings" size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {showBorder && <View style={styles.separator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomHeader 
        title="Account Setting" 
        navigation={navigation}
        onBackPress={() => navigation.navigate('Main', { screen: 'Profile' })}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Settings Group */}
        <View style={styles.settingsGroup}>
          <SettingItem
            SvgIcon={ProfileIcon}
            title="Edit Profile"
            subtitle="Username • Profile Picture • Profession"
            onPress={handleEditProfile}
          />
          <SettingItem
            SvgIcon={SecuritySafeIcon}
            title="Security"
            subtitle="Update Password • Change Email"
            onPress={handleSecurity}
            showBorder={false}
          />
        </View>

        {/* Block Account Section */}
        <View style={styles.blockAccountSection}>
          <SettingItem
            SvgIcon={ProfileDeleteIcon}
            title="Block Account"
            subtitle="Suspend Account"
            onPress={handleBlockAccount}
            showBorder={false}
          />
        </View>

        {/* Spacer to push logout to bottom */}
        <View style={styles.spacer} />

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <SettingItem
            SvgIcon={LogoutIcon}
            title="Logout"
            subtitle="Sign Out Account"
            onPress={handleLogout}
            showBorder={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  settingsGroup: {
    backgroundColor: colors.itemBackground,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  blockAccountSection: {
    backgroundColor: colors.itemBackground,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 30,
  },
  spacer: {
    flex: 1,
    minHeight: 100,
  },
  logoutSection: {
    backgroundColor: colors.itemBackground,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    backgroundColor: colors.itemBackground,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconImage: {
    width: 24,
    height: 24,
    tintColor: colors.primary,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
    marginRight: 16,
  },
});

export default SettingsScreen;

