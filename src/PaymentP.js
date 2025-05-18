import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, Timestamp, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { auth, db } from './firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './PaymentP.css';

const PaymentP = ({ project, viewOnly }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [totalQuotation, setTotalQuotation] = useState(0);
  const [newPayment, setNewPayment] = useState({
    description: '',
    quotationAmount: '',
    amountGiven: '',
    amountToGive: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editPaymentId, setEditPaymentId] = useState(null);

  // Fetch project's total quotation amount from bills
  useEffect(() => {
    const fetchTotalQuotation = async () => {
      if (!project?.id) return;
      
      try {
        const projectRef = doc(db, 'projects', project.id);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          if (projectData.bills && Array.isArray(projectData.bills)) {
            // Calculate total from all bills
            const total = projectData.bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
            setTotalQuotation(total);
          }
        }
      } catch (error) {
        console.error('Error fetching total quotation:', error);
      }
    };

    fetchTotalQuotation();
  }, [project?.id]);

  // Calculate totals based on filtered payments
  const calculateTotals = () => {
    const totalGiven = filteredPayments
      .reduce((sum, p) => sum + parseFloat(p.amountGiven), 0);
    
    const totalToGive = totalQuotation - totalGiven;
    
    return { totalQuotation, totalGiven, totalToGive };
  };

  // Filter payments based on selected period
  useEffect(() => {
    if (!payments.length) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let filtered = [...payments];
    if (selectedPeriod === 'month') {
      filtered = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startOfMonth;
      });
    } else if (selectedPeriod === 'year') {
      filtered = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startOfYear;
      });
    }

    setFilteredPayments(filtered);
  }, [selectedPeriod, payments]);

  // Fetch payments from the project's payments array
  useEffect(() => {
    const fetchPayments = async () => {
      if (!project?.id) {
        setLoading(false);
        return;
      }
      try {
        const projectRef = doc(db, 'projects', project.id);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          const paymentsList = (projectData.payments || []).map(payment => ({
            ...payment,
            date: payment.date?.toDate ? payment.date.toDate() : payment.date
          }));
          setPayments(paymentsList);
        } else {
          setPayments([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setLoading(false);
      }
    };
    fetchPayments();
  }, [project?.id]);

  // Edit handler
  const handleEditPayment = (payment) => {
    setNewPayment({
      description: payment.description,
      amountGiven: payment.amountGiven,
      date: payment.date instanceof Date ? payment.date.toISOString().split('T')[0] : payment.date,
      quotationAmount: payment.quotationAmount,
      amountToGive: payment.amountToGive,
      projectId: payment.projectId || project.id
    });
    setEditPaymentId(payment.id);
    setShowModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) {
        alert('You must be logged in to add payments');
        return;
      }
      if (!newPayment.description || !newPayment.amountGiven) {
        alert('Please fill in all required fields');
        return;
      }
      const paymentDate = newPayment.date || new Date().toISOString().split('T')[0];
      const paymentData = {
        description: newPayment.description.trim(),
        quotationAmount: totalQuotation,
        amountGiven: parseFloat(newPayment.amountGiven || 0),
        amountToGive: totalQuotation - parseFloat(newPayment.amountGiven || 0),
        projectId: project.id,
        date: Timestamp.fromDate(new Date(paymentDate)),
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now()
      };
      const projectRef = doc(db, 'projects', project.id);
      let updatedPayments = [];
      if (editPaymentId) {
        // Edit mode: update the payment in the array
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          updatedPayments = (projectData.payments || []).map(p =>
            p.id === editPaymentId ? { ...p, ...paymentData, id: editPaymentId } : p
          );
          await updateDoc(projectRef, { payments: updatedPayments });
          setPayments(updatedPayments.map(p => ({
            ...p,
            date: p.date?.toDate ? p.date.toDate() : p.date
          })));
        }
      } else {
        // Add mode: add new payment
        await updateDoc(projectRef, {
          payments: arrayUnion({
            ...paymentData,
            id: Date.now()
          })
        });
        setPayments(prev => [
          ...prev,
          {
            ...paymentData,
            id: Date.now(),
            date: paymentDate
          }
        ]);
      }
      setShowModal(false);
      setEditPaymentId(null);
      setNewPayment({
        description: '',
        quotationAmount: '',
        amountGiven: '',
        amountToGive: '',
        projectId: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding payment:', error);
      alert(`Error adding payment: ${error.message}`);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Set title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Report', pageWidth/2, 20, { align: 'center' });
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Summary', 20, 40);
    
    // Add summary boxes
    doc.setFontSize(12);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    
    const totals = calculateTotals();
    
    // Total Quotation Amount Box
    doc.rect(20, 50, 50, 25, 'FD');
    doc.text('Total Quotation:', 25, 60);
    doc.setTextColor(46, 213, 115);
    doc.text(`Rs. ${totals.totalQuotation.toLocaleString()}`, 25, 70);
    
    // Amount Given Box
    doc.setTextColor(0, 0, 0);
    doc.rect(80, 50, 50, 25, 'FD');
    doc.text('Amount Given:', 85, 60);
    doc.setTextColor(255, 71, 87);
    doc.text(`Rs. ${totals.totalGiven.toLocaleString()}`, 85, 70);
    
    // Amount To Give Box
    doc.setTextColor(0, 0, 0);
    doc.rect(140, 50, 50, 25, 'FD');
    doc.text('Amount To Give:', 145, 60);
    doc.setTextColor(46, 213, 115);
    if (totals.totalToGive < 0) {
      doc.setTextColor(0, 255, 0);
    }
    doc.text(`Rs. ${totals.totalToGive.toLocaleString()}`, 145, 70);
    
    // Add transactions table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Transactions', 20, 90);
    
    // Table headers
    const headers = ['Date', 'Description', 'Quotation', 'Given', 'To Give'];
    const columnWidths = [40, 50, 35, 35, 35];
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
    
    filteredPayments.forEach((payment, index) => {
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }
      
      currentX = 20;
      const date = new Date(payment.date).toLocaleDateString();
      
      // Date
      doc.text(date, currentX, startY);
      currentX += columnWidths[0];
      
      // Description
      const descLines = doc.splitTextToSize(payment.description, columnWidths[1] - 5);
      doc.text(descLines, currentX, startY);
      currentX += columnWidths[1];
      
      // Quotation Amount
      doc.text(`Rs. ${payment.quotationAmount.toLocaleString()}`, currentX, startY);
      currentX += columnWidths[2];
      
      // Amount Given
      doc.text(`Rs. ${payment.amountGiven.toLocaleString()}`, currentX, startY);
      currentX += columnWidths[3];
      
      // Amount To Give
      doc.text(`Rs. ${payment.amountToGive.toLocaleString()}`, currentX, startY);
      
      // Draw light line under each row
      doc.setDrawColor(200, 200, 200);
      doc.line(20, startY + 2, pageWidth - 20, startY + 2);
      
      startY += 10;
    });
    
    doc.save('payment-report.pdf');
  };

  const totals = calculateTotals();

  return (
    <div className="payments-page">
      <div className="payments-header">
        <h2>Payments for {project?.name}</h2>
        <div className="header-right">
          <div className="period-filter">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="payments-actions">
            {!viewOnly && (
              <button 
                className="add-payment-button"
                onClick={() => setShowModal(true)}
              >
                Add Payment
              </button>
            )}
            <button 
              className="download-pdf-button"
              onClick={downloadPDF}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Quotation</h3>
          <p>₹{totals.totalQuotation.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Amount Given</h3>
          <p>₹{totals.totalGiven.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Amount To Give</h3>
          {totals.totalToGive < 0 ? (
            <p style={{ color: '#2ecc71', fontSize: '2.2rem', fontWeight: 800 }}>
              ₹ {totals.totalToGive.toLocaleString()}
            </p>
          ) : (
            <p>₹ {totals.totalToGive.toLocaleString()}</p>
          )}
        </div>
      </div>

      
      {loading ? (
        <div className="loading">Loading payments...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="no-payments">
          <p>No payments found. Click "Add Payment" to create one.</p>
        </div>
      ) : (
        <div className="payments-card-grid">
          {filteredPayments.map(payment => (
            <div className="payment-card" key={payment.id}>
              <div className="payment-card-desc">{payment.description}</div>
              <div className="payment-card-amt">Rs. {payment.amountGiven.toLocaleString()}</div>
              <div className="payment-card-date">{new Date(payment.date).toLocaleDateString()}</div>
              {!viewOnly && (
                <button className="edit-payment-btn" onClick={() => handleEditPayment(payment)}>Edit</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Payment</h3>
            <form onSubmit={handleAddPayment}>
              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  value={newPayment.description}
                  onChange={(e) => setNewPayment(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount Given:</label>
                <input
                  type="number"
                  value={newPayment.amountGiven}
                  onChange={(e) => setNewPayment(prev => ({
                    ...prev,
                    amountGiven: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="submit-button">Add Payment</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentP; 