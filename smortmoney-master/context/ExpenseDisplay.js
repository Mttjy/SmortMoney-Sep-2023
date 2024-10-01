import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpenseDetailScreen = ({ route }) => {
    const { expense } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Expense Details</Text>
            <Text>Description: {expense.description}</Text>
            <Text>Amount Paid: ${parseFloat(expense.userAmountPaid).toFixed(2)}</Text>
            {/* Display other expense details here */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
});

export default ExpenseDetailScreen;