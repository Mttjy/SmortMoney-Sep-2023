export const settleDebts = (payments) => {
  
  const balances = {};
    
  // calculate balance for calculation
  payments.forEach((payment) => {
    if (!(payment.friendUid in balances)) {
      balances[payment.friendUid] = 0;
    }
    balances[payment.friendUid] += payment.friendOwes;
  });
  console.log('Balances:', balances);
  
  // friends who are owed
  const creditors = [];
  // friends who owes
  const debtors = [];

  Object.keys(balances).forEach((friendUid) => {
    const friendPayment = payments.find((payment) => payment.friendUid === friendUid);
    if (balances[friendUid] <= 0) {
      const amount = friendPayment ? friendPayment.friendIsOwed : 0;
      creditors.push({ uid: friendPayment.friendUid, name: friendPayment.friendName, amount });
    } else if (balances[friendUid] > 0) {
      debtors.push({ uid: friendPayment.friendUid, name: friendPayment.friendName, amount: balances[friendUid] });
    }
  });

  console.log(creditors);
  console.log(debtors);

  // match transactions by finding out if there are outstanding payments to be made by debtor
  const transactions = [];

  creditors.forEach((creditor) => {
    while (creditor.amount > 0) {
      const debtor = debtors.find((d) => d.amount > 0);
      if (!debtor) break;

      const minAmount = Math.min(creditor.amount, debtor.amount);
      transactions.push({
        from: debtor.name,
        fromUid: debtor.uid,
        to: creditor.name,
        toUid: creditor.uid,
        transferAmount: minAmount,
      });

      creditor.amount -= minAmount;
      debtor.amount -= minAmount;
    }
  });

  return transactions;
};
  