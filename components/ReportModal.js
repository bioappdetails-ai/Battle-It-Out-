import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';
import fonts from '../config/fonts';
import CustomButton from './CustomButton';

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or misleading',
  'Violence or dangerous acts',
  'Harassment or bullying',
  'Copyright infringement',
  'Other',
];

const ReportModal = ({ visible, onClose, onReport, videoTitle = 'this video' }) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setSelectedReason(null);
      setCustomReason('');
    }
  }, [visible]);

  const handleReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting.');
      return;
    }

    let reason = selectedReason;
    if (selectedReason === 'Other') {
      if (!customReason.trim()) {
        Alert.alert('Error', 'Please provide a reason for reporting.');
        return;
      }
      reason = customReason.trim();
    }

    try {
      setSubmitting(true);
      await onReport(reason);
      Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackground}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Report Video</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Why are you reporting {videoTitle}?
            </Text>

            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonButton,
                    selectedReason === reason && styles.reasonButtonSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason && styles.reasonTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                  {selectedReason === reason && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedReason === 'Other' && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.customReasonLabel}>Please provide details:</Text>
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Enter your reason..."
                  placeholderTextColor={colors.placeholder}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <CustomButton
              text="Cancel"
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
              textStyle={styles.cancelButtonText}
            />
            <CustomButton
              text={submitting ? 'Submitting...' : 'Submit Report'}
              onPress={handleReport}
              style={[styles.button, styles.submitButton]}
              disabled={submitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.itemBackground,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.light,
  },
  reasonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  reasonTextSelected: {
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  customReasonContainer: {
    marginTop: 10,
  },
  customReasonLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  customReasonInput: {
    backgroundColor: colors.itemBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  button: {
    flex: 1,
    marginTop: 0,
  },
  cancelButton: {
    backgroundColor: colors.itemBackground,
  },
  cancelButtonText: {
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
});

export default ReportModal;



