import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View, StyleSheet } from 'react-native';
import SongPlayer from './components/SongPlayer';
import { AudioProvider } from './context/AudioContext';
import SocialProvider from './context/SocialContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import type { Theme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <AudioProvider>
          <SocialProvider>
            <MusicProvider>
              <Stack>
                <Stack.Screen 
                  name="(tabs)" 
                  options={{ 
                    headerShown: false,
                    animation: 'slide_from_right'
                  }} 
                />
                <Stack.Screen 
                  name="song" 
                  options={{ 
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                  }} 
                />
                <Stack.Screen 
                  name="playlist" 
                  options={{ 
                    presentation: 'card',
                    animation: 'slide_from_right',
                    headerShown: false
                  }} 
                />
                <Stack.Screen 
                  name="post" 
                  options={{ 
                    presentation: 'card',
                    animation: 'slide_from_right',
                    headerShown: false
                  }} 
                />
                <Stack.Screen 
                  name="reply" 
                  options={{ 
                    presentation: 'card',
                    animation: 'slide_from_right',
                    headerShown: false
                  }} 
                />
                <Stack.Screen 
                  name="settings" 
                  options={{ 
                    presentation: 'card',
                    animation: 'slide_from_right',
                    headerShown: false
                  }} 
                />
                <Stack.Screen 
                  name="theme-selector" 
                  options={{ 
                    presentation: 'card',
                    animation: 'slide_from_right',
                    headerShown: false
                  }} 
                />
              </Stack>
            </MusicProvider>
          </SocialProvider>
        </AudioProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { colors, theme } = useTheme();

  // Create navigation theme based on our custom themes
  const navigationTheme: Theme = {
    dark: theme !== 'light',
    colors: {
      primary: colors.tint,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.notification,
    },
    fonts: DefaultTheme.fonts, // Use default fonts from React Navigation
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <AudioProvider>
        <SocialProvider>
          <MusicProvider>
            <Stack screenOptions={{ 
                headerShown: false
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="song" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="post" />
              <Stack.Screen name="reply" />
              <Stack.Screen name="theme-selector" />
            </Stack>
          </MusicProvider>
        </SocialProvider>
      </AudioProvider>
    </NavigationThemeProvider>
  );
}

// Single default export
export default RootLayoutInner;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
