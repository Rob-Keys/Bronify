import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from './context/ThemeContext';
import Colors, { ThemeType } from '@/constants/Colors';

type ThemePreviewProps = {
  name: string;
  id: string;
  themeColors: Record<string, string>;
  isActive: boolean;
  onSelect: () => void;
};

const ThemePreview = ({ name, id, themeColors, isActive, onSelect }: ThemePreviewProps) => {
  // Separate styles for ThemePreview component
  const previewStyles = StyleSheet.create({
    themeOption: {
      flexDirection: 'column',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 3,
      backgroundColor: themeColors.card,
      borderColor: isActive ? themeColors.tint : 'transparent',
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    themeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    themeName: {
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.text,
    },
    colorsContainer: {
      marginTop: 8,
    },
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    colorBlock: {
      height: 28,
      borderRadius: 4,
      marginRight: 10,
    },
    colorLabel: {
      fontSize: 14,
      color: themeColors.text,
      opacity: 0.8,
    },
    selectedIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      paddingTop: 8,
    },
    selectedText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.tint,
      marginLeft: 8,
    }
  });

  // Define which colors to show with their labels and relative sizes
  const colorBlocks = [
    { color: themeColors.background, width: 100, label: 'Background' },
    { color: themeColors.tint, width: 100, label: 'Primary/Accent' },
    { color: themeColors.text, width: 100, label: 'Text' },
    { color: themeColors.card, width: 80, label: 'Card/Surface' },
    { color: themeColors.positive, width: 60, label: 'Positive' },
    { color: themeColors.negative, width: 60, label: 'Negative' },
    { color: themeColors.border, width: 60, label: 'Border' },
  ];

  return (
    <TouchableOpacity
      style={previewStyles.themeOption}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={previewStyles.themeHeader}>
        <Text style={previewStyles.themeName}>{name}</Text>
      </View>
      
      <View style={previewStyles.colorsContainer}>
        {colorBlocks.map((block, index) => (
          <View key={index} style={previewStyles.colorRow}>
            <View 
              style={[
                previewStyles.colorBlock, 
                { 
                  backgroundColor: block.color,
                  width: block.width,
                }
              ]} 
            />
            <Text style={previewStyles.colorLabel}>{block.label}</Text>
          </View>
        ))}
      </View>

      {isActive && (
        <View style={previewStyles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={18} color={themeColors.tint} />
          <Text style={previewStyles.selectedText}>Currently Selected</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ThemeSelectorScreen() {
  const router = useRouter();
  const { colors, theme, setTheme, themesList } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 0,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 24,
      opacity: 0.8,
    },
    themesList: {
      marginTop: 8,
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Theme</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Choose a LeBron-inspired theme for your Bronify experience.
        </Text>

        <View style={styles.themesList}>
          {themesList.map((item) => {
            const themeColors = Colors[item.id as keyof typeof Colors];
            return (
              <ThemePreview
                key={item.id}
                id={item.id}
                name={item.name}
                themeColors={themeColors}
                isActive={theme === item.id}
                onSelect={() => setTheme(item.id as ThemeType)}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 