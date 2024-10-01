/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
// const {onDocumentCreated} = require("firebase-functions/v2/firestore");

// const {initializeApp} = require("firebase-admin/app");
// const {getFirestore} = require("firebase-admin/firestore");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started


const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { getDocs, getDoc, collection, query, limit, doc} = require('@firebase/firestore');

admin.initializeApp();


exports.checkIfBudgetExceed = functions.pubsub.schedule('every 12 hours').timeZone('Asia/Singapore').onRun(async (context) => {
    
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'team85agile@gmail.com',
            pass: 'mwkitznmymgmmuvz'
        }
    });
    

    const auth = admin.auth();
    const maxResults = 1000; // optional arg, set as needed

    try {
        const userRecords = await auth.listUsers(maxResults);
        const db = admin.firestore();
        console.log('Total Users:', userRecords.users.length);

        for (let i = 0; i < userRecords.users.length; i++) {
            const uid = userRecords.users[i].uid;
            const userEmail = userRecords.users[i].email;
            console.log(uid);
            console.log(userEmail);

            const incomeCollection = db.collection('Users').doc(uid).collection('income'); // it is able to read the collection
            const incomeCollectionQuerySnapshot = await incomeCollection.get();

            if (!incomeCollectionQuerySnapshot.empty) {
                console.log(`incomeCollection for UID ${uid} exists.`);

                let accountBudget = 0;

                // Get the very first document in the collection
                const firstDocumentSnapshot = incomeCollectionQuerySnapshot.docs[0];

                if (firstDocumentSnapshot.exists) {
                    // Document exists, you can access its data
                    const data = firstDocumentSnapshot.data();
                    accountBudget = parseFloat(data.BudgetValue);
                } else {
                    console.log('The first document does not exist in the collection.');
                }

                const expensesCollection = db.collection('Users').doc(uid).collection('Expenses');
                const expensesCollectionQuerySnapshot = await expensesCollection.get();
                let accountTotalExpense = 0;

                if (!expensesCollectionQuerySnapshot.empty) {
                    NumberOfDocument = expensesCollectionQuerySnapshot.docs.length;
                    console.log('Number of document in expenses collection is', NumberOfDocument);
                    for (let j = 0; j < NumberOfDocument; j++) {
                        const documentSnapshot = expensesCollectionQuerySnapshot.docs[j];
                        const expenseAmount = documentSnapshot.get('userAmountPaid');
                        accountTotalExpense += parseFloat(expenseAmount);
                    }

                    console.log(`total expense for account ${uid} is`, accountTotalExpense);

                    if(accountTotalExpense > accountBudget)
                    {
                        const mailOptions = {
                            from: 'team85agile@gmail.com',
                            to: userEmail,
                            subject: 'Budget Exceeded Alert',
                            text: `Dear User,      

                            SmortMoney detected that you have exceeded your budget. Please review your expenses and budget.
                            
                            Best regards,
                            SmortMoney`
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.error('Error sending email:', error);
                            } else {
                                console.log('Email sent:', info.response);
                            }
                        });
                    }

                } else {
                    console.log(`expensesCollection for UID ${uid} does not exist.`);
                }
            
            } else {
                console.log(`incomeCollection for UID ${uid} does not exist.`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        // Handle the error here, you might want to notify yourself or retry the operation.
    }
});

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
