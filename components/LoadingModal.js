import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import colors from '../config/colors';
import fonts from '../config/fonts';

const LoadingModal = ({ visible }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={colors.secondary} 
            style={styles.indicator}
          />
          <Text style={styles.loadingText}>Loading</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 20,
    minWidth: 120,
  },
  indicator: {
    marginRight: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
});

export default LoadingModal;


