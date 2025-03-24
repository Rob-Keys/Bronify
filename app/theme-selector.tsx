import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from './context/ThemeContext';
import Colors, { ThemeType } from '@/constants/Colors';

type ThemePreviewProps = {
  name: string;
  id: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  onSelect: () => void;
};

const ThemePreview = ({ name, id, accentColor, backgroundColor, textColor, isActive, onSelect }: ThemePreviewProps) => {
  // Separate styles for ThemePreview component
  const previewStyles = StyleSheet.create({
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 2,
    },
    themeContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    themeColor: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 12,
    },
    themeName: {
      fontSize: 18,
      fontWeight: '500',
    },
  });

  return (
    <TouchableOpacity
      style={[
        previewStyles.themeOption,
        { backgroundColor: backgroundColor, borderColor: isActive ? accentColor : backgroundColor }
      ]}
      onPress={onSelect}
    >
      <View style={previewStyles.themeContent}>
        <View style={[previewStyles.themeColor, { backgroundColor: accentColor }]} />
        <Text style={[previewStyles.themeName, { color: textColor }]}>{name}</Text>
      </View>
      {isActive && (
        <Ionicons name="checkmark-circle" size={24} color={accentColor} />
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
                accentColor={themeColors.tint}
                backgroundColor={themeColors.card}
                textColor={themeColors.text}
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