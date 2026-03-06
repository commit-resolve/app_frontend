import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="wallet" size={64} color="#6200ee" />
          <Text style={styles.title}>SaveSmart</Text>
          <Text style={styles.subtitle}>Your Goal-Based Savings Partner</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email or Phone"
            value={identifier}
            onChangeText={setIdentifier}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Login
          </Button>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
});
