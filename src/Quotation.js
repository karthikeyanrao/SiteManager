import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import './Quotation.css';
import MyItems from './MyItems';

const Quotation = ({ project }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFromAddressEdit, setShowFromAddressEdit] = useState(false);
  
  const [newQuotation, setNewQuotation] = useState({
    fromAddress: {
      companyName: '',
      address: '',
      gstin: '',
      city: '',
      state: ''
    },
    toAddress: {
      companyName: '',
      address: '',
      gstin: '',
      city: '',
      state: ''
    },
    items: [{ itemId: '', name: '', price: 0, quantity: 1, total: 0, unit: '' }]
  });

  // Fetch MyItems
  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'MyItems'));
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMyItems(items);
        setFilteredItems(items);
      } catch (error) {
        console.error('Error fetching MyItems:', error);
      }
    };

    fetchMyItems();
  }, []);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = myItems.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.workCategory.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(myItems);
    }
  }, [searchTerm, myItems]);

  // Fetch quotations for the current project
  useEffect(() => {
    const fetchQuotations = async () => {
      if (!project?.id) return;
      
      try {
        const q = query(
          collection(db, 'quotations'), 
          where('projectId', '==', project.id)
        );
        const querySnapshot = await getDocs(q);
        const quotationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuotations(quotationsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching quotations:', error);
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [project?.id]);

  const handleAddItem = () => {
    setNewQuotation(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', name: '', price: 0, quantity: 1, total: 0, unit: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setNewQuotation(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemSelect = (index, itemId) => {
    const selectedItem = myItems.find(item => item.id === itemId);
    if (selectedItem) {
      setNewQuotation(prev => ({
        ...prev,
        items: prev.items.map((item, i) => {
          if (i === index) {
            const quantity = item.quantity || 1;
            return {
              itemId: selectedItem.id,
              name: selectedItem.itemName,
              price: selectedItem.ratePerUnit,
              quantity: quantity,
              total: quantity * selectedItem.ratePerUnit,
              unit: selectedItem.unit
            };
          }
          return item;
        })
      }));
    }
  };

  const handleQuantityChange = (index, quantity) => {
    setNewQuotation(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            quantity: Number(quantity),
            total: Number(quantity) * item.price
          };
        }
        return item;
      })
    }));
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project?.id) return;

    try {
      const quotationData = {
        ...newQuotation,
        projectId: project.id,
        status: 'pending',
        createdAt: new Date(),
        total: calculateTotal(newQuotation.items)
      };

      await addDoc(collection(db, 'quotations'), quotationData);

      // Reset form
      setNewQuotation({
        fromAddress: {
          companyName: '',
          address: '',
          gstin: '',
          city: '',
          state: ''
        },
        toAddress: {
          companyName: '',
          address: '',
          gstin: '',
          city: '',
          state: ''
        },
        items: [{ itemId: '', name: '', price: 0, quantity: 1, total: 0, unit: '' }]
      });
      setShowAddForm(false);

      // Refresh quotations
      const q = query(collection(db, 'quotations'), where('projectId', '==', project.id));
      const querySnapshot = await getDocs(q);
      const quotationsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuotations(quotationsList);
    } catch (error) {
      console.error('Error adding quotation:', error);
      alert('Error adding quotation. Please try again.');
    }
  };

  if (!project) {
    return <div>No project selected</div>;
  }

  return (
    <div className="quotations-page">
      <div className="quotations-container">
        <div className="quotations-header">
          <h2>Quotations for {project.name}</h2>
          <button 
            className="add-quotation-button"
            onClick={() => setShowAddForm(true)}
          >
            Add Quotation
          </button>
        </div>

        {showAddForm && (
          <div className="modal">
            <div className="modal-content quotation-form">
              <h3>Create New Quotation</h3>
              <form onSubmit={handleSubmit}>
                {/* From Address Section */}
                <div className="address-section">
                  <div className="section-header">
                    <h4>From</h4>
                    <button 
                      type="button" 
                      className="edit-button"
                      onClick={() => setShowFromAddressEdit(!showFromAddressEdit)}
                    >
                      {showFromAddressEdit ? 'Done' : 'Edit'}
          </button>
                  </div>
                  {showFromAddressEdit ? (
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Company Name:</label>
                        <input
                          type="text"
                          value={newQuotation.fromAddress.companyName}
                          onChange={(e) => setNewQuotation(prev => ({
                            ...prev,
                            fromAddress: {
                              ...prev.fromAddress,
                              companyName: e.target.value
                            }
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Address:</label>
                        <input
                          type="text"
                          value={newQuotation.fromAddress.address}
                          onChange={(e) => setNewQuotation(prev => ({
                            ...prev,
                            fromAddress: {
                              ...prev.fromAddress,
                              address: e.target.value
                            }
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>GSTIN:</label>
                        <input
                          type="text"
                          value={newQuotation.fromAddress.gstin}
                          onChange={(e) => setNewQuotation(prev => ({
                            ...prev,
                            fromAddress: {
                              ...prev.fromAddress,
                              gstin: e.target.value
                            }
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>City:</label>
                        <input
                          type="text"
                          value={newQuotation.fromAddress.city}
                          onChange={(e) => setNewQuotation(prev => ({
                            ...prev,
                            fromAddress: {
                              ...prev.fromAddress,
                              city: e.target.value
                            }
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>State:</label>
                        <input
                          type="text"
                          value={newQuotation.fromAddress.state}
                          onChange={(e) => setNewQuotation(prev => ({
                            ...prev,
                            fromAddress: {
                              ...prev.fromAddress,
                              state: e.target.value
                            }
                          }))}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="address-details">
                      <p><strong>{newQuotation.fromAddress.companyName}</strong></p>
                      <p>{newQuotation.fromAddress.address}</p>
                      <p>GSTIN: {newQuotation.fromAddress.gstin}</p>
                      <p>{newQuotation.fromAddress.city}, {newQuotation.fromAddress.state}</p>
              </div>
            )}
                </div>

                {/* To Address Section */}
                <div className="address-section">
                  <h4>To</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Company Name:</label>
                      <input
                        type="text"
                        value={newQuotation.toAddress.companyName}
                        onChange={(e) => setNewQuotation(prev => ({
                          ...prev,
                          toAddress: {
                            ...prev.toAddress,
                            companyName: e.target.value
                          }
                        }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Address:</label>
                      <input
                        type="text"
                        value={newQuotation.toAddress.address}
                        onChange={(e) => setNewQuotation(prev => ({
                          ...prev,
                          toAddress: {
                            ...prev.toAddress,
                            address: e.target.value
                          }
                        }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>GSTIN:</label>
                      <input
                        type="text"
                        value={newQuotation.toAddress.gstin}
                        onChange={(e) => setNewQuotation(prev => ({
                          ...prev,
                          toAddress: {
                            ...prev.toAddress,
                            gstin: e.target.value
                          }
                        }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>City:</label>
                      <input
                        type="text"
                        value={newQuotation.toAddress.city}
                        onChange={(e) => setNewQuotation(prev => ({
                          ...prev,
                          toAddress: {
                            ...prev.toAddress,
                            city: e.target.value
                          }
                        }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State:</label>
                      <input
                        type="text"
                        value={newQuotation.toAddress.state}
                        onChange={(e) => setNewQuotation(prev => ({
                          ...prev,
                          toAddress: {
                            ...prev.toAddress,
                            state: e.target.value
                          }
                        }))}
                        required
                      />
          </div>
        </div>
      </div>

                {/* Items Section */}
                <div className="items-section">
                  <h4>Items</h4>
                  <div className="search-bar">
                    <input
                      type="text"
                      placeholder="Search items by name or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="items-header">
                    <span>Item</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span>Unit</span>
                    <span>Total</span>
                    <span></span>
                  </div>
                  {newQuotation.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-select-container">
                        <select
                          value={item.itemId}
                          onChange={(e) => handleItemSelect(index, e.target.value)}
                          required
                        >
                          <option value="">Select an item</option>
                          {filteredItems.map(myItem => (
                            <option key={myItem.id} value={myItem.id}>
                              {myItem.itemName} - {myItem.workCategory}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        min="1"
                        required
                      />
                      <span className="item-price">₹{item.price}</span>
                      <span className="item-unit">{item.unit}</span>
                      <span className="item-total">₹{item.total}</span>
                      {index > 0 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(index)}
                          className="remove-item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="add-item"
                  >
                    + Add Item
                  </button>
        </div>

                <div className="quotation-total">
                  Total: ₹{calculateTotal(newQuotation.items).toLocaleString()}
        </div>

                <div className="form-buttons">
                  <button type="submit" className="submit-button">
                    Create Quotation
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
        </div>
              </form>
        </div>
      </div>
        )}

        {loading ? (
          <div className="loading">Loading quotations...</div>
        ) : quotations.length === 0 ? (
          <div className="no-quotations">
            <p>No quotations yet. Click "Add Quotation" to create one.</p>
          </div>
        ) : (
          <div className="quotations-grid">
            {quotations.map(quotation => (
              <div key={quotation.id} className="quotation-card">
                <div className="quotation-header">
                  <h3>{quotation.title}</h3>
                  <span className={`status-badge ${quotation.status}`}>
                    {quotation.status}
                  </span>
                </div>
                <div className="quotation-body">
                  <p>{quotation.description}</p>
                  <div className="items-list">
            {quotation.items.map((item, index) => (
                      <div key={index} className="item-summary">
                        <span>{item.name}</span>
                        <span>{item.quantity} × ₹{item.price}</span>
                        <span>₹{item.total}</span>
                      </div>
                    ))}
                  </div>
                  <div className="quotation-total">
                    Total: ₹{quotation.total.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotation; 