import React from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthScreenContainerProps {
  children: React.ReactNode;
}

export const AuthScreenContainer = ({ children }: AuthScreenContainerProps) => {
  return (
    <ImageBackground
      source={require('@assets/images/authBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authHeader}>
            <Image
              source={require('@assets/images/icon.png')}
              style={styles.logo}
            />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoSubtitle}>MANAGE YOUR LIFE WITH</Text>
              <Text style={styles.logoTitle}>LEORA</Text>
            </View>
          </View>

          <View style={styles.content}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#25252B',
  },
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 32,
  },
  authHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
    width: '100%',
    gap: 12,
  },
  logo: {
    width: 60,
    height: 80,
  },
  logoTitle: {
    color: '#A6A6B9',
    fontWeight: '200',
    fontSize: 48,
    letterSpacing: 3,
    textAlign: 'center',
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  logoSubtitle: {
    fontSize: 13,
    color: '#A6A6B9',
    textAlign: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
});
