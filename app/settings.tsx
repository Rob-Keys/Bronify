import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTheme } from './context/ThemeContext';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { colors, theme, setTheme, themesList } = useTheme();
  
  // State for contact form modals
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactType, setContactType] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);

  const handleBackPress = () => {
    router.back();
  };
  
  const openContactForm = (type: string) => {
    setContactType(type);
    setMessage('');
    setEmail('');
    setContactModalVisible(true);
  };
  
  const closeContactForm = () => {
    setContactModalVisible(false);
  };
  
  const handleSubmitContact = async () => {
    // Validate email and message
    if (!email.trim() || !message.trim()) {
      Alert.alert('Error', 'Please provide both your email and a message');
      return;
    }
    
    try {
      // Format the email subject based on contact type
      const subject = encodeURIComponent(`Bronify ${contactType}`);
      const body = encodeURIComponent(`${message}\n\nFrom: ${email}`);
      
      // Create the mailto URL
      const mailtoUrl = `mailto:bronifyhelp@gmail.com?subject=${subject}&body=${body}`;
      
      // Check if the device can handle the mailto URL
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        // Open the default email app
        await Linking.openURL(mailtoUrl);
        Alert.alert('Success', 'Your message has been prepared to send');
        closeContactForm();
      } else {
        Alert.alert('Error', 'Could not open email client');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  };
  
  const handleDeleteAccount = () => {
    setDeleteAccountModalVisible(true);
  };
  
  const confirmDeleteAccount = () => {
    setDeleteAccountModalVisible(false);
    // Show a success message but don't actually delete anything
    setTimeout(() => {
      Alert.alert('Error Restoring Account', 'Account deletion failed due to server error. Please try again later or contact support.');
    }, 2000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === 'ios' ? 60 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerRight: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
    },
    menuText: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      marginLeft: 16,
    },
    logoutButton: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 8,
      alignItems: 'center',
    },
    logoutText: {
      color: colors.negative,
      fontSize: 16,
      fontWeight: '600',
    },
    deleteButton: {
      marginHorizontal: 16,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    deleteText: {
      fontSize: 16,
      fontWeight: '600',
    },
    themeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 8,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '48%',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 2,
    },
    themeColor: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: 8,
    },
    themeText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    textArea: {
      width: '100%',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      height: 120,
    },
    submitButton: {
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    submitText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cancelButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginRight: 8,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    confirmButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginLeft: 8,
    },
    confirmText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <View style={styles.themeContainer}>
            {themesList.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.themeOption,
                  { borderColor: theme === item.id ? colors.tint : colors.border }
                ]}
                onPress={() => setTheme(item.id)}
              >
                <View style={[styles.themeColor, { backgroundColor: item.id === 'light' 
                  ? '#ffffff' 
                  : item.id === 'dark' 
                  ? '#121212' 
                  : item.id === 'lakers' 
                  ? '#552583' 
                  : item.id === 'heat' 
                  ? '#98002E' 
                  : '#860038' }]} />
                <Text style={[styles.themeText, { color: colors.text }]}>{item.name}</Text>
                {theme === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => openContactForm('Bug Report')}
          >
            <Ionicons name="bug-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>Report a Bug</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => openContactForm('Song Request')}
          >
            <Ionicons name="musical-notes-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>Add a Song</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => openContactForm('General Inquiry')}
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>Other Inquiries</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.logoutText, { color: colors.button }]}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.deleteButton, { backgroundColor: colors.card }]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.deleteText, { color: colors.negative }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Modal
        visible={contactModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeContactForm}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{contactType}</Text>
              <TouchableOpacity onPress={closeContactForm}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Your Email"
              placeholderTextColor={colors.neutral}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
              placeholder={`Describe your ${contactType.toLowerCase()}...`}
              placeholderTextColor={colors.neutral}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.button }]}
              onPress={handleSubmitContact}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={deleteAccountModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteAccountModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text, textAlign: 'center', marginBottom: 20 }]}>
              Are you sure?
            </Text>
            <Text style={[styles.modalText, { color: colors.text, textAlign: 'center', marginBottom: 20 }]}>
              This action cannot be undone. All your data will be permanently deleted.
            </Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.card }]}
                onPress={() => setDeleteAccountModalVisible(false)}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: colors.negative }]}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.confirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 