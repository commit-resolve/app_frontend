import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // TEMPORARILY BYPASS LOGIN - Go directly to app
    router.replace('/(tabs)/home');
    
    // ORIGINAL CODE (commented for testing):
    // if (!loading) {
    //   if (user) {
    //     router.replace('/(tabs)/home');
    //   } else {
    //     router.replace('/(auth)/login');
    //   }
    // }
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
