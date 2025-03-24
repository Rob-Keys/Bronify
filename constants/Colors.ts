// Color themes based on LeBron James' teams
// Light, Lakers, Cavaliers, Heat, Dark

// Standard Accent Colors
const accentLight = '#2f95dc';  // Light blue accent for light mode
const accentDark = '#ffffff';   // White accent for dark mode

// Lakers Colors
const lakersGold = '#FDB927';   // Lakers Gold
const lakersPurple = '#552583'; // Lakers Purple

// Cavaliers Colors
const cavsWine = '#6F263D';     // Cavaliers Wine
const cavsGold = '#FFB81C';     // Cavaliers Gold
const cavsNavy = '#041E42';     // Cavaliers Navy

// Heat Colors
const heatRed = '#98002E';      // Heat Red
const heatBlack = '#000000';    // Heat Black
const heatYellow = '#F9A01B';   // Heat Yellow accent

export type ThemeType = 'light' | 'lakers' | 'cavaliers' | 'heat' | 'dark';

export default {
  light: {
    name: 'Light',
    text: '#000000',
    background: '#ffffff',
    tint: accentLight,
    tabIconDefault: '#ccc',
    tabIconSelected: accentLight,
    card: '#f5f5f5',
    border: '#e0e0e0',
    accent: accentLight,
    button: accentLight,
    positive: '#4CAF50',
    negative: '#F44336',
    neutral: '#9E9E9E',
    header: '#f8f8f8',
    notification: '#FF3B30',
  },
  lakers: {
    name: 'Lakers',
    text: '#ffffff',
    background: lakersPurple,
    tint: lakersGold,
    tabIconDefault: '#aaa',
    tabIconSelected: lakersGold,
    card: '#673AB7',
    border: '#4A148C',
    accent: lakersGold,
    button: lakersGold,
    positive: '#64DD17',
    negative: '#FF3D00',
    neutral: '#E0E0E0',
    header: '#4A148C',
    notification: '#FF9100',
  },
  cavaliers: {
    name: 'Cavaliers',
    text: '#ffffff',
    background: cavsWine,
    tint: cavsGold,
    tabIconDefault: '#999',
    tabIconSelected: cavsGold,
    card: '#8E3A59',
    border: '#5D1A32',
    accent: cavsGold,
    button: cavsGold,
    positive: '#76FF03',
    negative: '#FF1744',
    neutral: '#BDBDBD',
    header: '#5D1A32',
    notification: '#FFAB00',
  },
  heat: {
    name: 'Heat',
    text: '#ffffff',
    background: heatRed,
    tint: heatYellow,
    tabIconDefault: '#aaa',
    tabIconSelected: heatYellow,
    card: '#B71C1C',
    border: '#7F0000',
    accent: heatYellow,
    button: heatYellow,
    positive: '#00E676',
    negative: '#D50000',
    neutral: '#E0E0E0',
    header: '#7F0000',
    notification: '#FFAB00',
  },
  dark: {
    name: 'Dark',
    text: '#ffffff',
    background: '#121212',
    tint: accentDark,
    tabIconDefault: '#666',
    tabIconSelected: accentDark,
    card: '#1E1E1E',
    border: '#333333',
    accent: accentDark,
    button: '#1DB954',
    positive: '#1DB954',
    negative: '#FF4444',
    neutral: '#9E9E9E',
    header: '#1A1A1A',
    notification: '#FF453A',
  },
};
