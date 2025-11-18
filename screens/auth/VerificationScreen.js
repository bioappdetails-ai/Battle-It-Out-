import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CodeInput from '../../components/CodeInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';

const VerificationScreen = ({ navigation }) => {
  const [code, setCode] = useState('');

  const handleNext = () => {
    if (code === '0000') {
      // Navigate to next screen (Profile Creation)
      navigation.navigate('ProfileCreation');
    } else {
      alert('Please enter the correct verification code: 0000');
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
        <CustomHeader 
          title="Verification Code" 
          navigation={navigation}
          onBackPress={handleBack}
        />

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          We have sent the verification code to your email address
        </Text>

        {/* Verification Image */}
        <Image
          source={require('../../assets/verification.png')}
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
          text="Next"
          onPress={handleNext}
          style={styles.nextButton}
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
    paddingTop: 20,
    paddingBottom: 40,
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
  nextButton: {
    backgroundColor: colors.primary,
  },
});

export default VerificationScreen;

