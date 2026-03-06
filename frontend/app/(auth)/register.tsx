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

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, phone, name, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start saving for your goals</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign Up
          </Button>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Login</Text>
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
    marginBottom: 32,
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
