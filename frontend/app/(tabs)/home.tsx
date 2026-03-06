import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Card, Button, TextInput } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, transactionAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

export default function Home() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      const data = await dashboardAPI.get();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleSimulateTransaction = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const result = await transactionAPI.simulate({
        amount: amountNum,
        description,
        category: 'UPI Payment',
      });

      Alert.alert(
        'Transaction Successful!',
        `Amount: ₹${result.transaction_amount}\nTotal Saved: ₹${result.total_saved.toFixed(2)}\n\n${result.savings_breakdown.map((s: any) => `${s.goal_name}: ₹${s.amount.toFixed(2)} (${s.percentage}%)`).join('\n')}`,
        [{ text: 'OK', onPress: () => {
          setModalVisible(false);
          setAmount('');
          setDescription('');
          loadDashboard();
        }}]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to simulate transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.subtitle}>Welcome to SaveSmart</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={40} color="#6200ee" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.statsLabel}>Total Savings</Text>
            <Text style={styles.statsAmount}>₹{dashboardData?.total_savings?.toFixed(2) || '0.00'}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dashboardData?.active_mandates || 0}</Text>
                <Text style={styles.statLabel}>Active Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dashboardData?.total_transactions || 0}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          {dashboardData?.mandates?.filter((m: any) => m.status === 'active').length === 0 ? (
            <Text style={styles.emptyText}>No active goals. Create one in the Goals tab!</Text>
          ) : (
            dashboardData?.mandates?.filter((m: any) => m.status === 'active').map((mandate: any) => (
              <Card key={mandate.id} style={styles.goalCard}>
                <Card.Content>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{mandate.goal_name}</Text>
                    <Text style={styles.goalPercentage}>{mandate.percentage}%</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min((mandate.current_savings / mandate.target_amount) * 100, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      ₹{mandate.current_savings.toFixed(2)} / ₹{mandate.target_amount.toFixed(2)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {dashboardData?.recent_transactions?.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            dashboardData?.recent_transactions?.map((transaction: any) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={transaction.type === 'debit' ? 'arrow-up' : 'arrow-down'}
                    size={24}
                    color={transaction.type === 'debit' ? '#f44336' : '#4caf50'}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionTime}>
                    {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'debit' ? '#f44336' : '#4caf50' },
                  ]}
                >
                  {transaction.type === 'debit' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Simulate UPI Transaction</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.modalInput}
              left={<TextInput.Affix text="₹" />}
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.modalInput}
              placeholder="e.g., Grocery shopping"
            />

            <Button
              mode="contained"
              onPress={handleSimulateTransaction}
              loading={loading}
              disabled={loading}
              style={styles.modalButton}
            >
              Simulate Transaction
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    elevation: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 16,
  },
  goalCard: {
    marginBottom: 12,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  goalPercentage: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
});
