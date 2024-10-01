import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, ScrollView, TouchableOpacity, Button, Dimensions, Platform } from 'react-native';
import { useAuth } from '../../context/auth';
import { addDoc, updateDoc, collection, doc, query, limit, getDocs, getDoc, Timestamp} from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseConfig';
import * as Progress from 'react-native-progress';
import { VictoryPie } from 'victory-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from '@react-navigation/native';

const HomePage = () => {

  const navigation = useNavigation();

  const { user } = useAuth();

  const [showBudgetIfExist, setBudgetExist] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedOption, setSelectedOption] = useState('daily');
  
  const [progress, setProgress] = useState(null);
   
  const [budgetLimitData, setBudgetLimitData] = useState(null);

  const [BudgetValue, setBudget] = useState('');

  const [ExpenseValue, setExpense] = useState(0);

  const [isDataUpdated, setIsDataUpdated] = useState(false);

  const [chart, setChart] = useState(null);

  const [expensesData, setExpensesData] = useState([]);

  const [isCurrentBudgetTab, setIsCurrentBudgetTab] = useState(false);

  let colors = ["orange", "gold", "cyan", "lightgreen", "yellow", "pink"];

  const handleButtonPress = () => {
    setModalVisible(true);
  }

  const viewMorePress = () => {
    navigation.navigate('expense');
  };

  const closeModal = () => {
    setModalVisible(false);
  }

  const checkBudgetPeriod = (data) => {

    const today = new Date();

    const endingDate = data.endDate.toDate();
    
    if(today >= endingDate){
      console.log('today is over the end date');
      return true;
    }
    else{
      console.log('Today is not over the end date');
      return false;
    }
  }

  const checkExpense = async (data) => {
    try {
      const expenseCollection = collection(FIRESTORE_DB, 'Users', user.user.uid, 'Expenses');
      const querySnapshot = await getDocs(expenseCollection);
      const numberOfDocuments = querySnapshot.docs.length;
      let totalExpense = 0;
      let expensesData = [];
      if(data)
      {
        for (let i = 0; i < numberOfDocuments; i++)
        {
          const documentSnapshot = querySnapshot.docs[i];
          const documentData = documentSnapshot.data();
  
          const expenseDate = documentSnapshot.get('timeCreated');
          
          const StartDate = data.startDate;
          const EndDate = data.endDate;
  
          const expenseAmount = documentSnapshot.get('userAmountPaid');

          if(expenseDate >= StartDate && expenseDate <= EndDate)
          {
            expensesData.push(documentData);
            totalExpense += parseFloat(expenseAmount);
            console.log('!!!!!! Amount', expenseAmount, 'was added');
            console.log(totalExpense);
          }
  
          else{
            console.log('A amount of:', expenseAmount, 'was not added');
          }
        }
  
        const incomeCollection = collection(FIRESTORE_DB, 'Users', user.user.uid, 'income');
        const Snapshot = await getDocs(query(incomeCollection, limit(1)));
        const documentId = Snapshot.docs[0].id;
        const incomeDocRef = doc(FIRESTORE_DB, 'Users', user.user.uid, 'income', documentId);
  
        await updateDoc(incomeDocRef, {currentExpenses: totalExpense});

        setExpense(totalExpense);
        setProgress(totalExpense / data.BudgetValue);
        setExpensesData(expensesData);
        setIsDataUpdated(true);
      }
    } catch (error) {
      console.error('Error getting collection documents:', error);
    }
  };

  const fetchBudgetLimitInfo = async () => {

    const incomeCollection = collection(FIRESTORE_DB, 'Users', user.user.uid, 'income');
    
    const querySnapshot = await getDocs(query(incomeCollection, limit(1)));
    
    if(!querySnapshot.empty){
      const documentId = querySnapshot.docs[0].id;
      const incomeDocRef = doc(FIRESTORE_DB, 'Users', user.user.uid, 'income', documentId);
      const incomeDocSnapshot = await getDoc(incomeDocRef);
      const data = incomeDocSnapshot.data();
      
      setBudgetLimitData(data);//after getting the data, set variable to the data so we display on the page
      setBudgetExist(true);

      if(checkBudgetPeriod(data) == true){
        const endedDate = data.endDate.toDate();
        
        const newStartDate = new Date(endedDate.getTime() + 1000);
        const newEndDate = new Date(newStartDate);
        
        switch(data.BudgetTimeType) {
          case 'daily':
            newEndDate.setDate(newEndDate.getDate() + 1);
            break;
          case 'weekly':
            newEndDate.setDate(newEndDate.getDate() + 7);
            break;
          case 'monthly':
            newEndDate.setMonth(newEndDate.getMonth() + 1);
            break;
        }
        
        console.log('Its over the end day, replacing with new dates');
        await updateDoc(incomeDocRef, {startDate: newStartDate, endDate: newEndDate});
      }
      
      else{
        console.log('We are still in the correct budget period');
      }

    } else {
      setBudgetExist(false);
      console.log('Document does not exist');
    }
  }

  const addBudgetLimit = async () => {
    const Budget = parseFloat(BudgetValue);

    const incomeCollection = collection(FIRESTORE_DB, 'Users', user.user.uid, 'income');

    const queryRef = query(incomeCollection, limit(1));

    const today = selectedDateTime;
    const endDate = new Date(today);
    
    switch(selectedOption) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
    }

    if(Budget <= 0 || isNaN(Budget) || today === null){
      alert('Please enter a valid budget value');
      return;
    }
    else{
      try{
        
        const querySnapshot = await getDocs(queryRef);

        if(!querySnapshot.empty) { //if income collection is not empty
          const documentId = querySnapshot.docs[0].id;

          const docRef = doc(FIRESTORE_DB, 'Users', user.user.uid, 'income', documentId);
          
          await updateDoc(docRef, { BudgetTimeType: selectedOption, BudgetValue: Budget, startDate: today, endDate: endDate});
          console.log("data modified")
          fetchBudgetLimitInfo();
          closeModal();
        } else { // if there is no income collection, add it in
          try {
            await addDoc(incomeCollection, { BudgetTimeType: selectedOption, BudgetValue: Budget, startDate: today, endDate: endDate});  
            console.log("data added")
            fetchBudgetLimitInfo();
            closeModal();
          } catch (error) {
            console.error('Error adding data to Firebase:', error);
          }
        }

      } catch(error) {
        console.error('Error modifying data in Firebase:', error);
      }
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate();
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  const processExpensesCategory = (data) => {

      const chartCategories = {};

      data.forEach((expenseData) => {
        const expense = parseFloat(expenseData.userAmountPaid);
        if(expenseData.timeCreated > budgetLimitData.startDate && expenseData.timeCreated < budgetLimitData.endDate && expense > 0){
          
          if (chartCategories[expenseData.category]) {
            chartCategories[expenseData.category] += parseFloat(expense);
          } 
          else {
            chartCategories[expenseData.category] = parseFloat(expense);
          }
        }
        else {
          console.log('expense is not within the budget time period');
        }
      })

      const chartData = Object.keys(chartCategories).map(category => ({
        x: category,
        y: chartCategories[category],
        z: (chartCategories[category] / ExpenseValue * 100).toFixed(2)
      }));

      let othersTotal = 0;

      const filteredChartData = chartData.filter(item => {
        if (parseFloat(item.z) < 5) {
          othersTotal += item.y;
          return false; // Exclude this item from the filtered array
        }
        return true; // Include this item in the filtered array
      });
    
      // Add "others" category if there are expenses in it
      if (othersTotal > 0) {
        filteredChartData.push({
          x: 'Others',
          y: othersTotal,
          z: (othersTotal / ExpenseValue * 100).toFixed(2),
        });
      }
      
      setChart(filteredChartData);
  }
  
  const latestExpenses = (expensesData) => {

    if (expensesData.length === 0) {
      return []; // Return null if the expensesData array is empty
    }

    const sortedExpenses = expensesData.sort((a, b) => b.timeCreated - a.timeCreated);

    const latestThreeExpenses = sortedExpenses.slice(0, 3);

    return latestThreeExpenses;
  }
  
  function renderChart() {
    if(Platform.OS == 'ios')
    {
      return (
        <VictoryPie
          data={chart}
          labels={({ datum }) => `${datum.x}`}
          colorScale={colors}
          innerRadius={80}
          labelRadius={({innerRadius}) => innerRadius + (screenHeight * 0.023)}
          padding={50}
          style={{labels: {textAnchor:"middle", fontSize: 14, fontWeight: "bold"}}}
          events={[{
            target: "data",
            eventHandlers: {
              onPressIn: () => {
                return [
                  {
                    target: "labels",
                    mutation: ({ text }) => {
                      const clickedDatum = chart.find(item => item.x === text);
                      if(clickedDatum) {
                        return text === `${clickedDatum.z}%\n($${clickedDatum.y.toFixed(2)})` ? null : { text: `${clickedDatum.z}%\n($${clickedDatum.y.toFixed(2)})` };
                      }
                      return null
                      
                    }
                  }
                ];
              }
            }
          }]}
          />
      )
    }

    else {
      return(  
          <VictoryPie
            data={chart}
            labels={({ datum }) => `${datum.x}`}
            colorScale={colors}
            innerRadius={80}
            labelRadius={({innerRadius}) => innerRadius + (screenHeight * 0.023)}
            padding={50}
            style={{labels: {textAnchor:"middle", fontSize: 14, fontWeight: "bold"}}}
            events={[{
              target: "data",
              eventHandlers: {
                onPressIn: () => {
                  return [
                    {
                      target: "labels",
                      mutation: ({ text }) => {
                        const clickedDatum = chart.find(item => item.x === text);
                        if(clickedDatum) {
                          return text === `${clickedDatum.z}%\n($${clickedDatum.y.toFixed(2)})` ? null : { text: `${clickedDatum.z}%\n($${clickedDatum.y.toFixed(2)})` };
                        }
                        return null
                        
                      }
                    }
                  ];
                }
              }
            }]}
          />
      )
    }
  }

  const [showDatePicker, setShowDataPicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [mode, setMode] = useState('date');

  const showDateTimePicker = (currentMode) => {
    setShowDataPicker(true);
    setMode(currentMode);
  };

  const onChange = (event, selectedDate) => {
    setShowDataPicker(false);
    const currentDate = selectedDate || selectedDateTime;
    setSelectedDateTime(currentDate);
  }

  useEffect(() => {
    console.log('useEffect 1 is in motion');
    fetchBudgetLimitInfo(); 
  }, []);

  useEffect(() => {
    console.log('useEffect 2 is in motion');
    checkExpense(budgetLimitData);
  }, [budgetLimitData]);

  useEffect(() => {
    if (isDataUpdated) {
      console.log('Data has been updated, performing additional actions...');
      processExpensesCategory(expensesData);
      setIsDataUpdated(false); // Reset
      
      if(progress > 1) 
      {
        alert('You exceeded your budget, please review your budget and expenses');
      }
    }
  }, [isDataUpdated]);

  const screenHeight = Dimensions.get('window').height;
  const budgetTabHeight = screenHeight * 0.3;
  const totalExpenseHeight = screenHeight * 0.22;
  const budgetLimiterHeight = screenHeight * 0.55;

  return (
    <ScrollView style={{ flex: 1, width: '100%', height: '100%', marginTop: '12%', backgroundColor: 'F2F2F2'}}>
      {showBudgetIfExist ? (
      <View style={{ backgroundColor: '#0088cc', borderColor: '#0088cc', borderWidth: 0, borderRadius: 10, overflow: 'hidden', width: '98%', height: budgetTabHeight, alignSelf: 'center' }}>
        <TouchableOpacity style={{ padding: 10, width: '100%', height: '100%' }} onPress={handleButtonPress}>               
          <Text style={{fontSize: 16, color: 'white', padding: 2}}>Budget Time Type: {budgetLimitData?.BudgetTimeType}</Text>
          <Text style={{fontSize: 16, color: 'white', padding: 2}}>Budget Value: {budgetLimitData?.BudgetValue.toFixed(2)}</Text>   
          <Text style={{fontSize: 16, color: 'white', padding: 2}}>Budget Start Date: {formatTimestamp(budgetLimitData?.startDate)}</Text>   
          <Text style={{fontSize: 16, color: 'white', padding: 2}}>Budget End Date: {formatTimestamp(budgetLimitData?.endDate)}</Text>   
      
          <Text style={{fontSize: 16, color: 'white', marginBottom: '3%', padding: 2}}>Budget Used: ${(budgetLimitData?.BudgetValue * progress).toFixed(2)} ({(progress * 100).toFixed(2)}%)</Text>  
          <Progress.Bar progress={progress || 0} width={null} height={25} borderRadius={10} color='white'/>
        </TouchableOpacity>
      </View>
      ) : (
        <View style={{ backgroundColor: '#0088cc', borderColor: '#0088cc', borderWidth: 0, borderRadius: 10, overflow: 'hidden', width: '98%', height: budgetTabHeight, alignSelf: 'center' }}>
        <TouchableOpacity style={{ padding: 10, width: '100%', height: '100%',alignItems:'center' }} onPress={handleButtonPress}>               
          <Text style={{fontSize: 16, color: 'white', padding: 2}}>You have not set up your budget</Text>
          <Text style={{fontSize: 16, color: 'white', padding: 2}}> click here to set it up </Text>
          <Text style={styles.label}> Budget Used: Not set up</Text>
          
          <Progress.Bar style={styles.progressBG} progress={0} width={null} height={25} borderRadius={10}  color='white'/>

        </TouchableOpacity>
      
      </View>   
      )}
           
      <View>
        {chart && chart.length > 0 ? (
          renderChart()
        ) : ( 
          <VictoryPie
          data={[{ x: "", y: 1 }]}
          labels={({ datum }) => `${datum.x}`}
          colorScale={["lightgray"]}
          innerRadius={80}
          padding={50}
          style={{ labels: { textAnchor: "middle", fontSize: 14, fontWeight: "bold", fill: "gray" } }}
        />
        )}
        
        <View style={{ position: 'absolute', top: totalExpenseHeight, alignSelf: 'center' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Total Expenses:</Text>
          <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>${ExpenseValue.toFixed(2)}</Text>  
        </View>

        <View style={styles.recentExpensesContainer}>
          <View style={styles.recentExpensesHeader}>
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#0088cc'}}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => viewMorePress()}>
              <Text>View More</Text>
            </TouchableOpacity>
          </View>
          {latestExpenses(expensesData).map((expense, index) => (
          <View key={index}>
            <View style={styles.expenseItem}>
              <Text>{expense.category}</Text>
              <Text>${expense.userAmountPaid}</Text>
            </View>
            <View style={styles.expenseItemLowerHalf}>
              <Text>Description: {expense.description}</Text>
              <Text>{expense.timeCreated.toDate().toLocaleString()}</Text>
            </View>
          </View>))}
        </View>

      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={{flex: 1, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <View style={{backgroundColor:'white', padding: 20, marginTop: '25%', borderRadius: 20, width: '90%', height: budgetLimiterHeight, flexDirection:'column'}}>

            <Text style={{fontSize: 18}}>Set Your Monthly Budget</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10 }}>

            <TouchableOpacity 
            style={[{paddingVertical: 10, paddingHorizontal: 10}, selectedOption === 'daily' && {backgroundColor: 'lightblue', borderRadius: 10}]} 
            onPress={() => setSelectedOption('daily')}>
            <Text style={{fontSize: 18, marginBottom: 10}}>Daily</Text>
            </TouchableOpacity>

            <TouchableOpacity 
            style={[{paddingVertical: 10, paddingHorizontal: 10}, selectedOption === 'weekly' && {backgroundColor: 'lightblue', borderRadius: 10}]} 
            onPress={() => setSelectedOption('weekly')}>
            <Text style={{fontSize: 18, marginBottom: 10}}>Weekly</Text>
            </TouchableOpacity>

            <TouchableOpacity 
            style={[{paddingVertical: 10, paddingHorizontal: 10}, selectedOption === 'monthly' && {backgroundColor: 'lightblue', borderRadius: 10}]} 
            onPress={() => setSelectedOption('monthly')}>
            <Text style={{fontSize: 18, marginBottom: 10}}>Monthly</Text>
            </TouchableOpacity>

            </View>
            <Text>Starting Date: {selectedDateTime ? selectedDateTime.toDateString() : 'No date selected'}</Text>
            <Text>Starting Time: {selectedDateTime ? selectedDateTime.toTimeString() : 'No time selected'}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10, marginBottom: 10}}>
              <Button title='DatePicker' onPress={() => showDateTimePicker('date')}></Button>
              <Button title='TimePicker' onPress={() => showDateTimePicker('time')}></Button>
            </View>
                  
            {showDatePicker ? (
              <DateTimePicker
              testID='dateTimePicker'
              value={selectedDateTime}
              mode={mode}
              is24Hour={true}
              display='default'
              onChange={onChange}
              />
            ) : null}

            <TextInput
              style={{ borderWidth: 1, height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
              placeholder=" Enter Monthly Budget"
              keyboardType="numeric"
              value={BudgetValue}
              onChangeText={(text) => setBudget(text)}
            />

            <View style={{alignItems:'center'}}>

            <TouchableOpacity style={{ backgroundColor: '#0088cc', padding: 10, borderRadius: 10, marginBottom: 5}} onPress={addBudgetLimit}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Save</Text>
              </TouchableOpacity>

            <TouchableOpacity style={{backgroundColor:'#0088cc', padding: 10, borderRadius: 10}} onPress={closeModal}>
              <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center'}}>Close</Text>
            </TouchableOpacity>

            </View>

          </View>
        </View>
      </Modal>

    </ScrollView>
  )
};

export default HomePage

const styles= StyleSheet.create({
  progressBG: {
    width: '100%',
    height: 25,
    borderRadius: 10,
    marginBottom: 20
  },
 
  progress: {
    width: '50%',
    height: 25,
    backgroundColor: '#00AB55',
    borderRadius: 10,
  },

  label: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
    marginTop: 10,
  },

  recentExpensesContainer: {
    marginTop: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: '10%',
    backgroundColor: 'white',
    borderRadius: 15,
    width: '98%',
    alignSelf: 'center'
  },
  recentExpensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: '#ccc'
  },
  expenseItemLowerHalf: {
    paddingVertical: 5,
  },
  dateTimeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})