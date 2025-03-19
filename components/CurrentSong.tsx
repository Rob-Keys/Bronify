import React from 'react';
import { StyleSheet, Image } from 'react-native'; // Fixed imports

import { ExternalLink } from './ExternalLink';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';

import Colors from '@/constants/Colors';

export default function CurrentSong({ path }: { path: string }) {
  return (
    <View style={styles.getStartedContainer}>
      <Image
        source={require('../assets/images/sunshine.jpg')} // Fixed source
        style={styles.imageStyle} // Fixed prop name (style vs styles)
      />
      <Text>MY SUNSHINE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  imageStyle: { // Added image style
    width: 100,
    height: 100,
    borderRadius: 8, // Optional
  }
});