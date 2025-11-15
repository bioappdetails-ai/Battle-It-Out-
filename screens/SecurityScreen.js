import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SmsIcon from '../assets/settings/sms.svg';
import KeyIcon from '../assets/settings/key.svg';
import LogoutIcon from '../assets/settings/logout.svg';
import colors from '../config/colors';
import fonts from '../config/fonts';

const SecurityScreen = ({ navigation }) => {
  const handleChangeEmail = () => {
    navigation.navigate('UpdateEmail');
  };

  const handleUpdatePassword = () => {
    navigation.navigate('UpdatePassword');
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

  const SecurityItem = ({ iconSource, SvgIcon, title, onPress, showBorder = true }) => (
    <TouchableOpacity style={styles.securityItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.securityContent}>
        <View style={styles.iconContainer}>
          {SvgIcon ? (
            <SvgIcon width={24} height={24} fill={colors.primary} />
          ) : iconSource ? (
            <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
          ) : (
            <Ionicons name="settings" size={24} color={colors.primary} />
          )}
        </View>
        <Text style={styles.securityTitle}>{title}</Text>
      </View>
      {showBorder && <View style={styles.separator} />}
    </TouchableOpacity>
  );

  const LogoutItem = ({ iconSource, SvgIcon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.logoutItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.logoutContent}>
        <View style={styles.iconContainer}>
          {SvgIcon ? (
            <SvgIcon width={24} height={24} fill={colors.primary} />
          ) : iconSource ? (
            <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
          ) : (
            <Ionicons name="log-out" size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.logoutTitle}>{title}</Text>
          <Text style={styles.logoutSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Security Settings Group */}
        <View style={styles.securityGroup}>
          <SecurityItem
            SvgIcon={SmsIcon}
            title="Change Email"
            onPress={handleChangeEmail}
          />
          <SecurityItem
            SvgIcon={KeyIcon}
            title="Update Password"
            onPress={handleUpdatePassword}
            showBorder={false}
          />
        </View>

        {/* Spacer to push logout to bottom */}
        <View style={styles.spacer} />

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <LogoutItem
            SvgIcon={LogoutIcon}
            title="Logout"
            subtitle="Sign Out Account"
            onPress={handleLogout}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: "left",
    flex: 1,
    marginLeft: 12,
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  securityGroup: {
    backgroundColor: colors.itemBackground,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 30,
  },
  securityItem: {
    backgroundColor: colors.itemBackground,
  },
  securityContent: {
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
  securityTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
    marginRight: 16,
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
  logoutItem: {
    backgroundColor: colors.itemBackground,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  logoutSubtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});

export default SecurityScreen;

