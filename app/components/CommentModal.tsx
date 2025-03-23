import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
  postId: string;
  isTransparent?: boolean;
  title?: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
  visible, 
  onClose, 
  onSubmit, 
  postId,
  isTransparent = false,
  title = "Add Comment"
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Clear comment input and log visibility immediately when props change
  useEffect(() => {
    if (visible) {
      setComment('');
      console.log('CommentModal visibility changed to:', visible);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(comment);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={[
        styles.overlay,
        isTransparent && styles.transparentOverlay
      ]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={isTransparent ? 80 : 0}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <View style={[
              styles.modalContent,
              isTransparent && styles.transparentModalContent
            ]}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#B3B3B3" />
                </TouchableOpacity>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity
                  style={[styles.submitButton, !comment.trim() && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={!comment.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Write your comment..."
                placeholderTextColor="#999"
                multiline
                value={comment}
                onChangeText={setComment}
                autoFocus
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  transparentOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker background when overlaying on another modal
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '100%',
  },
  safeArea: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Ensure it has a high elevation to appear above other elements
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    minHeight: 200,
  },
  transparentModalContent: {
    // Add specific styling for when displayed above comments view
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  disabledButton: {
    backgroundColor: '#1DB95480',
  },
  submitText: {
    color: 'white',
    fontWeight: '600',
  },
  input: {
    color: 'white',
    fontSize: 16,
    padding: 16,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
});

export default CommentModal; 