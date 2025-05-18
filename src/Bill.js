import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import './Bill.css';

const Bill = ({ project }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    const fetchBills = async () => {
      if (!project?.id) {
        setLoading(false);
        return;
      }
      try {
        const projectRef = doc(db, 'projects', project.id);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          if (projectData.bills && Array.isArray(projectData.bills) && projectData.bills.length > 0) {
            // Convert all bills' timestamps to dates
            const formattedBills = projectData.bills.map(bill => ({
              ...bill,
              createdAt: bill.createdAt?.toDate?.() || bill.createdAt
            }));
            setBills(formattedBills);

            // Update project status to Started if it has bills
            if (projectData.status?.toLowerCase() !== 'started') {
              await updateDoc(projectRef, {
                status: 'Started'
              });
            }
          } else {
            setBills([]);
          }
        } else {
          setBills([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bills:', error);
        setBills([]);
        setLoading(false);
      }
    };
    fetchBills();
  }, [project?.id]);

  if (!project) {
    return <div>No project selected</div>;
  }

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
  };

  const handleCloseView = () => {
    setSelectedBill(null);
  };

  return (
    <div className="bills-page">
      <h2>Bills for {project.name}</h2>
      <div className="bills-container">
        {loading ? (
          <div className="loading">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="no-bills">
            <p>No bills found. Bills will appear here when quotations are converted to bills.</p>
          </div>
        ) : (
          <div className="bills-grid">
            {bills.map((bill, index) => (
              <div key={index} className="bill-card">
                <div className="bill-card-header">
                  <div className="bill-info">
                    <h3>Bill #{bill.billNumber}</h3>
                    <p className="date">
                      {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="bill-actions">
                    <button 
                      className="view-button"
                      onClick={() => handleViewBill(bill)}
                    >
                      View
                    </button>
                  </div>
                </div>
                <div className="bill-card-body">
                  <p className="company-name">To: {bill.toAddress?.companyName}</p>
                  <p className="total-amount">Total: ₹{bill.total?.toLocaleString()}</p>
                  <div className="quotation-reference">
                    <p>From Quotation #{bill.quotationNumber}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill View Modal */}
      {selectedBill && (
        <div className="modal">
          <div className="modal-content bill-view">
            <div className="modal-header">
              <h3>Bill #{selectedBill.billNumber}</h3>
              <button className="modal-close-button" onClick={handleCloseView}>×</button>
            </div>
            <div className="bill-details">
              <div className="bill-date">
                Date: {selectedBill.createdAt ? new Date(selectedBill.createdAt).toLocaleDateString() : ''}
              </div>
              
              <div className="addresses">
                <div className="from-address">
                  <h4>From</h4>
                  <p><strong>{selectedBill.fromAddress?.companyName}</strong></p>
                  <p>{selectedBill.fromAddress?.address}</p>
                  <p>GSTIN: {selectedBill.fromAddress?.gstin}</p>
                  <p>{selectedBill.fromAddress?.city}, {selectedBill.fromAddress?.state}</p>
                </div>
                <div className="to-address">
                  <h4>To</h4>
                  <p><strong>{selectedBill.toAddress?.companyName}</strong></p>
                  <p>{selectedBill.toAddress?.address}</p>
                  <p>GSTIN: {selectedBill.toAddress?.gstin}</p>
                  <p>{selectedBill.toAddress?.city}, {selectedBill.toAddress?.state}</p>
                </div>
              </div>

              <div className="quotation-reference">
                <p>Generated from Quotation #{selectedBill.quotationNumber}</p>
              </div>
              
              <div className="items-table">
                <h4>Items</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Unit</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items && selectedBill.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td>{item.unit}</td>
                        <td>₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{textAlign: 'right'}}><strong>Grand Total:</strong></td>
                      <td>₹{selectedBill.total?.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bill; 