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
import { Card, Button, TextInput, Chip } from 'react-native-paper';
import { mandateAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function Goals() {
  const [mandates, setMandates] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMandates = async () => {
    try {
      const data = await mandateAPI.getAll();
      setMandates(data);
    } catch (error) {
      console.error('Failed to load mandates:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMandates();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMandates();
    setRefreshing(false);
  };

  const handleCreateMandate = async () => {
    if (!goalName || !percentage || !targetAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const percentageNum = parseFloat(percentage);
    const targetNum = parseFloat(targetAmount);

    if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      Alert.alert('Error', 'Please enter a valid percentage (1-100)');
      return;
    }

    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    setLoading(true);
    try {
      await mandateAPI.create({
        goal_name: goalName,
        percentage: percentageNum,
        target_amount: targetNum,
        description: description || undefined,
      });

      Alert.alert('Success', 'Goal created successfully!');
      setModalVisible(false);
      setGoalName('');
      setPercentage('');
      setTargetAmount('');
      setDescription('');
      loadMandates();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (mandate: any) => {
    const newStatus = mandate.status === 'active' ? 'paused' : 'active';
    try {
      await mandateAPI.update(mandate.id, newStatus);
      loadMandates();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update goal');
    }
  };

  const handleDeleteMandate = (mandate: any) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${mandate.goal_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mandateAPI.delete(mandate.id);
              loadMandates();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'paused':
        return '#ff9800';
      case 'completed':
        return '#2196f3';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savings Goals</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color="#6200ee" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {mandates.length === 0 ? (
          <Text style={styles.emptyText}>No goals yet. Create your first savings goal!</Text>
        ) : (
          mandates.map((mandate) => (
            <Card key={mandate.id} style={styles.goalCard}>
              <Card.Content>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleContainer}>
                    <Text style={styles.goalName}>{mandate.goal_name}</Text>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusColor(mandate.status) }]}
                      textStyle={styles.statusText}
                    >
                      {mandate.status}
                    </Chip>
                  </View>
                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      onPress={() => handleToggleStatus(mandate)}
                      style={styles.iconButton}
                    >
                      <Ionicons
                        name={mandate.status === 'active' ? 'pause' : 'play'}
                        size={24}
                        color="#6200ee"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteMandate(mandate)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="trash" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>

                {mandate.description && (
                  <Text style={styles.goalDescription}>{mandate.description}</Text>
                )}

                <View style={styles.goalStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Save Percentage</Text>
                    <Text style={styles.statValue}>{mandate.percentage}%</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Progress</Text>
                    <Text style={styles.statValue}>
                      {Math.min((mandate.current_savings / mandate.target_amount) * 100, 100).toFixed(0)}%
                    </Text>
                  </View>
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
              <Text style={styles.modalTitle}>Create Savings Goal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                label="Goal Name *"
                value={goalName}
                onChangeText={setGoalName}
                mode="outlined"
                style={styles.modalInput}
                placeholder="e.g., Vacation Fund"
              />

              <TextInput
                label="Save Percentage *"
                value={percentage}
                onChangeText={setPercentage}
                mode="outlined"
                keyboardType="numeric"
                style={styles.modalInput}
                placeholder="e.g., 10"
                right={<TextInput.Affix text="%" />}
              />

              <TextInput
                label="Target Amount *"
                value={targetAmount}
                onChangeText={setTargetAmount}
                mode="outlined"
                keyboardType="numeric"
                style={styles.modalInput}
                left={<TextInput.Affix text="₹" />}
              />

              <TextInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.modalInput}
              />

              <Button
                mode="contained"
                onPress={handleCreateMandate}
                loading={loading}
                disabled={loading}
                style={styles.modalButton}
              >
                Create Goal
              </Button>
            </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
  },
  goalCard: {
    marginBottom: 16,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
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
    maxHeight: '80%',
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
