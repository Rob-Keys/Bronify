/**
 * Custom Themed components for Bronify
 * Supports multiple LeBron-themed color schemes: Light, Lakers, Cavaliers, Heat, Dark
 */

import { Text as DefaultText, View as DefaultView, TextInput as DefaultTextInput, ScrollView as DefaultScrollView, Pressable as DefaultPressable, PressableProps, TextInputProps, ScrollViewProps } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
  themeColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];
export type TextInputProps = ThemeProps & DefaultTextInput['props'];
export type ScrollViewProps = ThemeProps & DefaultScrollView['props'];
export type PressableProps = ThemeProps & DefaultPressable['props'];

export function useThemeColor(
  props: { themeColor?: string },
  colorName: string
) {
  const { colors } = useTheme();
  
  const colorFromProps = props.themeColor;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // @ts-ignore - we know the colorName is valid
    return colors[colorName] || '#ffffff';
  }
}

export function Text(props: TextProps) {
  const { style, themeColor, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ themeColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, themeColor, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ themeColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function Card(props: ViewProps) {
  const { style, themeColor, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ themeColor }, 'card');
  const borderColor = useThemeColor({ themeColor }, 'border');

  return <DefaultView style={[{ backgroundColor, borderColor, borderWidth: 1, borderRadius: 8 }, style]} {...otherProps} />;
}

export function TextInput(props: TextInputProps) {
  const { style, themeColor, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ themeColor }, 'text');
  const backgroundColor = useThemeColor({ themeColor }, 'card');
  const borderColor = useThemeColor({ themeColor }, 'border');

  return (
    <DefaultTextInput 
      style={[{ 
        color, 
        backgroundColor, 
        borderColor,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12
      }, style]} 
      placeholderTextColor={useThemeColor({ themeColor }, 'neutral')}
      {...otherProps} 
    />
  );
}

export function ScrollView(props: ScrollViewProps) {
  const { style, themeColor, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ themeColor }, 'background');

  return <DefaultScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function Button(props: PressableProps) {
  const { style, themeColor, lightColor, darkColor, children, ...otherProps } = props;
  const backgroundColor = useThemeColor({ themeColor }, 'button');

  return (
    <DefaultPressable 
      style={({ pressed }) => [
        { 
          backgroundColor,
          opacity: pressed ? 0.8 : 1,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center'
        }, 
        style
      ]} 
      {...otherProps}
    >
      {children}
    </DefaultPressable>
  );
}
