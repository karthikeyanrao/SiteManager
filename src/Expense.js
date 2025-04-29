import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Expense.css';

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    type: 'income',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Calculate totals based on filtered expenses
  const calculateTotals = () => {
    const income = filteredExpenses
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expensesTotal = filteredExpenses
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const profit = income - expensesTotal;
    
    return { income, expenses: expensesTotal, profit };
  };

  // Filter expenses based on selected period
  useEffect(() => {
    if (!expenses.length) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let filtered = [...expenses];
    if (selectedPeriod === 'month') {
      filtered = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfMonth;
      });
    } else if (selectedPeriod === 'year') {
      filtered = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfYear;
      });
    }

    setFilteredExpenses(filtered);
  }, [selectedPeriod, expenses]);

  // Fetch expenses from Firebase
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const expensesRef = collection(db, 'expenses');
        const q = query(expensesRef, where('userId', '==', auth.currentUser?.uid));
        const querySnapshot = await getDocs(q);
        const expensesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate().toISOString().split('T')[0]
        }));
        setExpenses(expensesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchExpenses();
    }
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) {
        alert('You must be logged in to add expenses');
        return;
      }

      // Validate the data before submission
      if (!newExpense.description || !newExpense.amount || !newExpense.category || !newExpense.date) {
        alert('Please fill in all fields');
        return;
      }

      const expenseData = {
        description: newExpense.description.trim(),
        amount: parseFloat(newExpense.amount),
        type: newExpense.type,
        category: newExpense.category,
        date: Timestamp.fromDate(new Date(newExpense.date)),
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now()
      };

      console.log('Attempting to add expense:', expenseData);

      const expensesRef = collection(db, 'expenses');
      const docRef = await addDoc(expensesRef, expenseData);
      
      console.log('Successfully added expense with ID:', docRef.id);

      // Format the date back to string format for state update
      const formattedExpense = {
        id: docRef.id,
        ...expenseData,
        date: newExpense.date
      };

      setExpenses(prev => [...prev, formattedExpense]);
      setShowModal(false);
      setNewExpense({
        description: '',
        amount: '',
        type: 'income',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Detailed error adding expense:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        alert('Permission denied. You may not have the required access.');
      } else {
        alert(`Error adding expense: ${error.message}`);
      }
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Set title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Financial Report', pageWidth/2, 20, { align: 'center' });
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Summary', 20, 40);
    
    // Add summary boxes
    doc.setFontSize(12);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    
    // Total Income Box
    doc.rect(20, 50, 50, 25, 'FD');
    doc.text('Total Income:', 25, 60);
    doc.setTextColor(46, 213, 115);
    doc.text(`Rs. ${totals.income.toLocaleString()}`, 25, 70);
    
    // Total Expenses Box
    doc.setTextColor(0, 0, 0);
    doc.rect(80, 50, 50, 25, 'FD');
    doc.text('Expenses:', 85, 60);
    doc.setTextColor(255, 71, 87);
    doc.text(`Rs. ${totals.expenses.toLocaleString()}`, 85, 70);
    
    // Profit/Loss Box
    doc.setTextColor(0, 0, 0);
    doc.rect(140, 50, 50, 25, 'FD');
    doc.text('Profit/Loss:', 145, 60);
    doc.setTextColor(totals.profit >= 0 ? 46 : 255, totals.profit >= 0 ? 213 : 71, totals.profit >= 0 ? 115 : 87);
    doc.text(`Rs. ${totals.profit.toLocaleString()}`, 145, 70);
    
    // Add transactions table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Transactions', 20, 90);
    
    // Table headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const columnWidths = [40, 50, 35, 25, 30];
    let startY = 100;
    
    // Draw table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, startY - 5, pageWidth - 40, 10, 'F');
    doc.setFontSize(10);
    let currentX = 20;
    headers.forEach((header, index) => {
      doc.text(header, currentX, startY);
      currentX += columnWidths[index];
    });
    
    // Draw table content
    startY += 10;
    doc.setFontSize(9);
    
    filteredExpenses.forEach((expense, index) => {
      // Add new page if needed
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }
      
      currentX = 20;
      const date = new Date(expense.date).toLocaleDateString();
      
      // Date
      doc.text(date, currentX, startY);
      currentX += columnWidths[0];
      
      // Description (with text wrapping if needed)
      const descLines = doc.splitTextToSize(expense.description, columnWidths[1] - 5);
      doc.text(descLines, currentX, startY);
      currentX += columnWidths[1];
      
      // Category
      doc.text(expense.category, currentX, startY);
      currentX += columnWidths[2];
      
      // Type
      doc.text(expense.type, currentX, startY);
      currentX += columnWidths[3];
      
      // Amount (with color based on type)
      doc.setTextColor(expense.type === 'income' ? 46 : 255, expense.type === 'income' ? 213 : 71, expense.type === 'income' ? 115 : 87);
      doc.text(`Rs. ${parseFloat(expense.amount).toLocaleString()}`, currentX, startY);
      doc.setTextColor(0, 0, 0);
      
      // Draw light line under each row
      doc.setDrawColor(200, 200, 200);
      doc.line(20, startY + 2, pageWidth - 20, startY + 2);
      
      startY += 10;
    });
    
    doc.save('financial-report.pdf');
  };

  const totals = calculateTotals();

  return (
    <div className="expense-container" id="expense-report">
      <div className="expense-header">
        <h1>Financial Overview</h1>
        <div className="header-actions">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="all" className="all-time-option">All Time</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="add-transaction-btn" onClick={() => setShowModal(true)}>
            Add Expense
          </button>
          <button className="download-btn" onClick={downloadPDF}>
            Download Report
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card income">
          <h3>Total Income</h3>
          <p className="amount">₹{totals.income.toLocaleString()}</p>
        </div>
        <div className="summary-card expenses">
          <h3>Total Expenses</h3>
          <p className="amount">₹{totals.expenses.toLocaleString()}</p>
        </div>
        <div className={`summary-card ${totals.profit >= 0 ? 'profit' : 'loss'}`}>
          <h3>Profit/Loss</h3>
          <p className="amount">₹{totals.profit.toLocaleString()}</p>
        </div>
      </div>

      <div className="transactions-section">
        <h2>Transactions</h2>
        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">No transactions found</div>
        ) : (
          <div className="transactions-list">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className={`transaction-card ${expense.type}`}>
                <div className="transaction-header">
                  <div className="transaction-date">
                    <span className="date-label">Date</span>
                    <span className="date-value">{new Date(expense.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="transaction-amount">
                    <span className="amount">₹{parseFloat(expense.amount).toFixed(2)}</span>
                  </div>
                </div>
                <div className="transaction-details">
                  <div className="transaction-description">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{expense.description}</span>
                  </div>
                  <div className="transaction-category">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{expense.category}</span>
                  </div>
                </div>
                <div className="transaction-type-indicator"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Expense</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddExpense} className="transaction-form">
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  required
                  placeholder="Enter description"
                />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={newExpense.type}
                  onChange={(e) => setNewExpense({...newExpense, type: e.target.value})}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  required
                >
                  {newExpense.type === 'income' ? (
                    <>
                      <option value="">Select category</option>
                      <option value="salary">Salary</option>
                      <option value="freelance">Freelance</option>
                      <option value="investments">Investments</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="">Select category</option>
                      <option value="utilities">Utilities</option>
                      <option value="rent">Rent</option>
                      <option value="supplies">Supplies</option>
                      <option value="salary">Salary</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;