import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';
import fonts from '../config/fonts';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';

const BlockAccountScreen = ({ navigation }) => {
  const [reason, setReason] = useState('');

  const handleGoodBye = () => {
    Alert.alert(
      'Block Account',
      'Are you sure you want to block your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive', 
          onPress: () => {
            console.log('Account blocked. Reason:', reason);
            // Navigate back or to login screen
            navigation.replace('Login');
          }
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Block Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructional Text */}
          <Text style={styles.instructionText}>
            Once blocked, they won't be able to message or interact with you.
          </Text>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('../assets/block.png')}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Reason Section */}
          <View style={styles.reasonSection}>
            <Text style={styles.reasonHeading}>Explain The Reason Why Leaving Us?</Text>
            <View style={styles.inputWrapper}>
              <CustomTextInput
                label=""
                placeholder="Reason (Optional)"
                value={reason}
                onChangeText={setReason}
                style={styles.reasonInput}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Good Bye Button */}
          <CustomButton
            text="Good Bye!"
            onPress={handleGoodBye}
            style={styles.goodByeButton}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  },
  instructionText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "left",
    marginBottom: 30,
    lineHeight: 20,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    minHeight: 200,
  },
  illustration: {
    width: '100%',
    height: 250,
    maxWidth: 300,
  },
  reasonSection: {
    marginBottom: 30,
  },
  reasonHeading: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    // marginBottom: 8,
  },
  inputWrapper: {
    marginBottom: 0,
  },
  reasonInput: {
    marginBottom: 0,
    minHeight: 100,
  },
  goodByeButton: {
    marginTop: 20,
  },
});

export default BlockAccountScreen;

