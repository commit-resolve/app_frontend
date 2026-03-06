import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#6200ee" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.contact}>{user?.email}</Text>
        <Text style={styles.contact}>{user?.phone}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>About SaveSmart</Text>
            <Text style={styles.cardText}>
              SaveSmart helps you automatically save a percentage of every UPI transaction towards your financial goals.
            </Text>
            <Text style={styles.cardText}>
              Create custom savings mandates, simulate transactions, and watch your savings grow!
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>How It Works</Text>
            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Create a savings goal with a target amount</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Set a percentage to save from each transaction</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Simulate UPI transactions</Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>Automatically save based on your mandates</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Features</Text>
            <View style={styles.featureContainer}>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                <Text style={styles.featureText}>Goal-based savings</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                <Text style={styles.featureText}>Automatic percentage deduction</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                <Text style={styles.featureText}>Multiple savings goals</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                <Text style={styles.featureText}>Transaction history tracking</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                <Text style={styles.featureText}>Real-time savings dashboard</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#f44336"
          icon="logout"
        >
          Logout
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 48,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  stepContainer: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  featureContainer: {
    marginTop: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 6,
  },
});
