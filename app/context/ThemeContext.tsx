import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors, { ThemeType } from '@/constants/Colors';

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: typeof Colors.light;
  themesList: { id: ThemeType; name: string }[];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'bronify_theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme() as ThemeType;
  const [theme, setThemeState] = useState<ThemeType>(systemColorScheme || 'light');
  
  // List of available themes for the UI
  const themesList = [
    { id: 'light' as ThemeType, name: 'Light' },
    { id: 'lakers' as ThemeType, name: 'Lakers' },
    { id: 'cavaliers' as ThemeType, name: 'Cavaliers' },
    { id: 'heat' as ThemeType, name: 'Heat' },
    { id: 'dark' as ThemeType, name: 'Dark' }
  ];

  // Load saved theme on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        } else if (systemColorScheme) {
          // If no saved theme, use the system theme (light or dark)
          setThemeState(systemColorScheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  // Save theme when it changes
  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Get current theme colors
  const colors = Colors[theme];

  const value = {
    theme,
    setTheme,
    colors,
    themesList,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Add default export
export default ThemeProvider; 