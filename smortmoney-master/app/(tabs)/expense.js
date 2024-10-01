import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';

const ExpensePage = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [existingCategories, setExistingCategories] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isBarChartVisible, setIsBarChartVisible] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expenseCollection = collection(FIRESTORE_DB, 'Users', user.user.uid, 'Expenses');
        let q;

        if (selectedCategory === 'All') {
          // When "All Expenses" category is selected, fetch all expenses and order by date
          q = query(expenseCollection, orderBy('timeCreated', 'desc'));
        } else {
          // Fetch expenses based on the selected category
          q = query(expenseCollection, where('category', '==', selectedCategory));
        }

        const querySnapshot = await getDocs(q);
        const expensesData = [];

        querySnapshot.forEach((documentSnapshot) => {
          const documentData = documentSnapshot.data();
          if (documentData.description.toLowerCase().includes(searchText.toLowerCase()) && documentData.userAmountPaid >= 0) {
            expensesData.push({expenseDocData: documentData, expenseId: documentSnapshot.id});
          }
          console.log(documentData.userAmountPaid);
        });

        // Calculate monthly total expenses
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const monthlyTotal = expensesData.reduce((total, expense) => {
          const expenseDate = expense.expenseDocData.timeCreated.toDate();
          if (expenseDate.getMonth() + 1 === currentMonth) {
            return total + parseFloat(expense.expenseDocData.userAmountPaid);
          }
          return total;
        }, 0);
        setMonthlyTotal(monthlyTotal);

        // Prepare data for the bar chart (past 3 months)
        const monthlyChartData = [];
        for (let i = 2; i >= 0; i--) {
          const month = currentMonth - i;
          const monthlyExpenses = expensesData.reduce((total, expense) => {
            const expenseDate = expense.expenseDocData.timeCreated.toDate();
            if (expenseDate.getMonth() + 1 === month) {
              return total + parseFloat(expense.expenseDocData.userAmountPaid);
            }
            return total;
          }, 0);
          monthlyChartData.push(monthlyExpenses.toFixed(2));
        }
        setMonthlyData(monthlyChartData);

        // Sort expenses by date in descending order (most recent first)
        expensesData.sort((a, b) => b.timeCreated - a.timeCreated);

        setExpenses(expensesData);
      } catch (error) {
        console.error('Error fetching expenses from Firestore:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const user = FIREBASE_AUTH.currentUser;

        if (user) {
          const userId = user.uid;
          const categoryReference = collection(FIRESTORE_DB, 'Users', userId, 'Expenses');

          const query = await getDocs(categoryReference);
          const categorySet = new Set();

          query.docs.forEach((doc) => {
            categorySet.add(doc.data().category);
          });

          const uniqueCategory = Array.from(categorySet);
          setExistingCategories(uniqueCategory);
        } else {
          console.log('No user authenticated');
        }
      } catch (error) {
        console.log('Error fetching categories', error);
      }
    };

    fetchExpenses();
    fetchCategories();
  }, [selectedCategory, searchText]);

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toDate().toLocaleDateString(undefined, options);
  };

  const formatTransactionTime = (date) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toDate().toLocaleTimeString(undefined, options);
  };

  const toggleChartView = () => {
    setIsBarChartVisible(!isBarChartVisible);
  };

  return (
    <ScrollView style={{ flex: 1, width: '100%', height: '100%', marginTop: '15%' }}>
      <View style={styles.container}>
        <Text style={styles.header}>Expenses List</Text>

        {/* Toggle Button */}
        <TouchableOpacity style={styles.toggleButton} onPress={toggleChartView}>
          <Text style={styles.toggleButtonText}>
            {isBarChartVisible ? 'Show Line Chart' : 'Show Bar Chart'}
          </Text>
        </TouchableOpacity>

        {/* Conditional Chart Rendering */}
        {isBarChartVisible ? ( 
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: ['2 months ago', 'Last Month', 'This Month'],
                datasets: [
                  {
                    data: monthlyData,
                  },
                ],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
            />
          </View>
        ) : (
          <View style={styles.chartContainer}>
            {/* Render Line Chart */}
            {/* You need to provide the appropriate data for the LineChart */}
            {/* Modify this part based on your data */}
            <LineChart
              data={{
                labels: ['2 months ago', 'Last Month', 'This Month'],
                datasets: [
                  {
                    data: monthlyData, // Modify with your line chart data
                  },
                ],
              }}
              width={Dimensions.get('window').width - 32}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
            />
          </View>
        )}

        {/* Monthly Total */}
        <Text style={styles.monthlyTotal}>Monthly Total: ${monthlyTotal.toFixed(2)}</Text>

        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses"
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
        />

        {/* Category Dropdown */}
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          style={styles.categoryPicker}
        >
          <Picker.Item label="All Categories" value="All" />
          {existingCategories.map((category) => (
            <Picker.Item key={category} label={category} value={category} />
          ))}
        </Picker>

        {/* Expenses List */}
        <View style={styles.expensesContainer}>
          {expenses.map((item, index) => {
            const formattedDate = formatDate(item.expenseDocData.timeCreated);
            const formattedTime = formatTransactionTime(item.expenseDocData.timeCreated);

            // Handle expense item click
            const handleExpenseClick = () => {
              navigation.navigate('readExpense', { expenseId:  item.expenseId});
            };

            // Check if it's a new date, and if so, display a header
            if (index === 0 || formattedDate !== formatDate(expenses[index - 1].expenseDocData.timeCreated)) {
              return (
                <View key={formattedDate}>
                  <Text style={styles.dateHeader}>{formattedDate}</Text>
                  <TouchableOpacity onPress={handleExpenseClick}>
                    <View style={styles.expenseItem}>
                      <View style={styles.expenseDetail}>
                        <Text style={styles.expenseDescription}>{item.expenseDocData.description}</Text>
                        <View style={styles.expenseDateContainer}>
                          <Text style={styles.transactionTime}>{formattedTime}</Text>
                        </View>
                      </View>
                      <Text>${parseFloat(item.expenseDocData.userAmountPaid).toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }

            // Otherwise, just display the expense
            return (
              <TouchableOpacity key={index} onPress={handleExpenseClick}>
                <View style={styles.expenseItem}>
                  <View style={styles.expenseDetail}>
                    <Text style={styles.expenseDescription}>{item.expenseDocData.description}</Text>
                    <View style={styles.expenseDateContainer}>
                      <Text style={styles.transactionTime}>{formattedTime}</Text>
                    </View>
                  </View>
                  <Text>${parseFloat(item.expenseDocData.userAmountPaid).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
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
  monthlyTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  categoryPicker: {
    alignSelf: 'stretch', // Add this line
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  expensesContainer: {
    marginTop: 10,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
  expenseDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 16,
    marginRight: 4,
  },
  transactionTime: {
    fontSize: 16,
    color: 'gray',
  },
  dateHeader: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: 'blue',
  },
});

export default ExpensePage;
