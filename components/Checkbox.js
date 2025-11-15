import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';

const Checkbox = ({ checked, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.checkbox, checked && styles.checkboxChecked, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {checked && (
        <Ionicons name="checkmark" size={16} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

export default Checkbox;


