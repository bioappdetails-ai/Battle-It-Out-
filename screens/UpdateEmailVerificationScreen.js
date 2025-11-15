import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';
import fonts from '../config/fonts';
import CodeInput from '../components/CodeInput';
import CustomButton from '../components/CustomButton';

const UpdateEmailVerificationScreen = ({ navigation }) => {
  const [code, setCode] = useState('');

  const handleNext = () => {
    if (code === '0000') {
      Alert.alert('Success', 'Your email has been updated successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Security') }
      ]);
    } else {
      Alert.alert('Error', 'Please enter the correct verification code: 0000');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          We have sent the verification code to your new email address
        </Text>

        {/* Verification Image */}
        <Image
          source={require('../assets/verification.png')}
          style={styles.verificationImage}
          resizeMode="contain"
        />

        {/* Code Input Fields */}
        <View style={styles.codeContainer}>
          <CodeInput
            length={4}
            value={code}
            onCodeChange={setCode}
          />
        </View>

        {/* Next Button */}
        <CustomButton
          text="Verify"
          onPress={handleNext}
          style={styles.verifyButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: "left",
    marginLeft: 12,
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "left",
    marginBottom: 40,
  },
  verificationImage: {
    width: "100%",
    height: 250,
    marginBottom: 40,
  },
  codeContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  verifyButton: {
    backgroundColor: colors.primary,
  },
});

export default UpdateEmailVerificationScreen;

