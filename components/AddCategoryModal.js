import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';
import fonts from '../config/fonts';
import CustomButton from './CustomButton';

const AddCategoryModal = ({ visible, onClose, onAdd, existingCategories = [] }) => {
  const [categoryName, setCategoryName] = useState('');

  const handleAdd = () => {
    const trimmedName = categoryName.trim();
    
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check if category already exists (case-insensitive)
    const categoryExists = existingCategories.some(
      (cat) => cat.toLowerCase() === trimmedName.toLowerCase()
    );

    if (categoryExists) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    onAdd(trimmedName);
    setCategoryName('');
    onClose();
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter category name"
              placeholderTextColor={colors.placeholder}
              value={categoryName}
              onChangeText={setCategoryName}
              autoCapitalize="words"
              autoFocus={true}
              maxLength={30}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={handleAdd}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.itemBackground,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
});

export default AddCategoryModal;

