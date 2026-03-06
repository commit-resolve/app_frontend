import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { transactionAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = async () => {
    try {
      const data = await transactionAPI.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={item.type === 'debit' ? 'arrow-up' : 'arrow-down'}
          size={24}
          color={item.type === 'debit' ? '#f44336' : '#4caf50'}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionTime}>
          {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.type === 'debit' ? '#f44336' : '#4caf50' },
        ]}
      >
        {item.type === 'debit' ? '-' : '+'}₹{item.amount.toFixed(2)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions yet. Simulate your first transaction!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
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
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
  },
});
