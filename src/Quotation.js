import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import './Quotation.css';
import MyItems from './MyItems';
import { auth } from './firebase';
import { getDoc } from 'firebase/firestore';

const Quotation = ({ project }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFromAddressEdit, setShowFromAddressEdit] = useState(false);
  const [userData, setUserData] = useState(null);
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [viewQuotation, setViewQuotation] = useState(null);
  const [editQuotation, setEditQuotation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
        console.log('Starting to fetch MyItems...');
        const myItemsRef = collection(db, 'MyItem');
        console.log('Collection reference created');
        
        const querySnapshot = await getDocs(myItemsRef);
        console.log('Query snapshot received:', querySnapshot);
        
        if (querySnapshot.empty) {
          console.log('No documents found in MyItem collection');
          return;
        }

        // Ensure unique items based on ID
        const items = Array.from(new Set(querySnapshot.docs.map(doc => doc.id)))
          .map(id => {
            const doc = querySnapshot.docs.find(d => d.id === id);
            return {
              id: doc.id,
              ...doc.data()
            };
          });

        console.log('Processed unique items:', items);
        setMyItems(items);
        setItemSearchResults(items);
      } catch (error) {
        console.error('Error fetching MyItems:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
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

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          // Set fromAddress with user's company details
          setNewQuotation(prev => ({
            ...prev,
            fromAddress: {
              companyName: data.companyName || '',
              address: data.companyAddress || '',
              gstin: data.gstin || '',
              city: data.city || '',
              state: data.state || ''
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Function to generate quotation number
  const generateQuotationNumber = async () => {
    const today = new Date();
    const monthDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // Get all quotations for today to determine sequence number
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const q = query(
      collection(db, 'quotations'),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    
    const querySnapshot = await getDocs(q);
    const sequenceNum = (querySnapshot.size + 1).toString().padStart(3, '0');
    
    return `${monthDate}/${sequenceNum}`;
  };

  // Modify handleAddQuotationClick to include quotation number
  const handleAddQuotationClick = async () => {
    await fetchUserData();
    const quotationNumber = await generateQuotationNumber();
    setNewQuotation(prev => ({
      ...prev,
      quotationNumber,
      createdAt: new Date()
    }));
    setShowAddForm(true);
  };

  const handleAddItem = () => {
    setNewQuotation(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', name: '', price: 0, quantity: 1, total: 0, unit: '' }]
    }));
    setItemSearchResults([]);
  };

  const handleRemoveItem = (index) => {
    setNewQuotation(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemSearch = (index, searchTerm) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (!searchTerm || searchTerm.trim() === '') {
        // Show all items when search term is empty
        setItemSearchResults([]);
        return;
      }

      // Simple filter based on search term
      const results = myItems.filter(item => 
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.workCategory?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setItemSearchResults(results);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Update the input field to trigger search on mount and when empty
  useEffect(() => {
    if (newQuotation.items.length > 0 && myItems.length > 0) {
      handleItemSearch(0, '');
    }
  }, [newQuotation.items.length, myItems.length]);

  const handleItemSelect = (index, item) => {
    setNewQuotation(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        itemId: item.id,
        name: item.itemName,
        price: item.ratePerUnit || 0,
        quantity: 1,
        total: item.ratePerUnit || 0,
        unit: item.unit || ''
      };
      return {
        ...prev,
        items: updatedItems
      };
    });
    setItemSearchResults([]);
    setActiveInputIndex(null);
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

  const handleViewQuotation = (quotation) => {
    setViewQuotation(quotation);
  };

  const handleEditQuotation = (quotation) => {
    setEditQuotation(quotation);
    setIsEditing(true);
    setShowAddForm(true);
    setNewQuotation(quotation);
  };

  const handleCloseView = () => {
    setViewQuotation(null);
  };

  const handleMoveToBill = async (quotation) => {
    try {
      const isConfirmed = window.confirm('Are you sure you want to move this quotation to bill?');
      
      if (isConfirmed) {
        // Create a new bill document
        const billData = {
          ...quotation,
          quotationId: quotation.id,
          billNumber: await generateBillNumber(),
          createdAt: new Date(),
          status: 'pending',
          type: 'bill'
        };
        delete billData.id; // Remove the quotation id before creating bill

        // Add to bills collection
        await addDoc(collection(db, 'bills'), billData);

        // Update quotation status and remove edit ability
        await updateDoc(doc(db, 'quotations', quotation.id), {
          status: 'moved_to_bill',
          movedToBill: true
        });

        // Refresh quotations
        const q = query(collection(db, 'quotations'), where('projectId', '==', project.id));
        const querySnapshot = await getDocs(q);
        const quotationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuotations(quotationsList);

        // Close view modal
        setViewQuotation(null);
        alert('Quotation successfully moved to bill!');
      }
    } catch (error) {
      console.error('Error moving quotation to bill:', error);
      alert('Error moving quotation to bill. Please try again.');
    }
  };

  const generateBillNumber = async () => {
    const today = new Date();
    const monthDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // Get all bills for today to determine sequence number
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const q = query(
      collection(db, 'bills'),
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay)
    );
    
    const querySnapshot = await getDocs(q);
    const sequenceNum = (querySnapshot.size + 1).toString().padStart(3, '0');
    
    return `B${monthDate}/${sequenceNum}`;
  };

  // Modify handleSubmit to handle both create and edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project?.id) return;

    const isConfirmed = window.confirm(
      isEditing 
        ? 'Are you sure you want to update this quotation?' 
        : 'Are you sure you want to create this quotation?'
    );
    
    if (isConfirmed) {
      try {
        const quotationData = {
          ...newQuotation,
          projectId: project.id,
          status: isEditing ? newQuotation.status : 'pending',
          createdAt: isEditing ? newQuotation.createdAt : new Date(),
          total: calculateTotal(newQuotation.items)
        };

        if (isEditing) {
          // Update existing quotation
          await updateDoc(doc(db, 'quotations', editQuotation.id), quotationData);
        } else {
          // Create new quotation
          await addDoc(collection(db, 'quotations'), quotationData);
        }

        // Reset form and states
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
        setIsEditing(false);
        setEditQuotation(null);

        // Refresh quotations
        const q = query(collection(db, 'quotations'), where('projectId', '==', project.id));
        const querySnapshot = await getDocs(q);
        const quotationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuotations(quotationsList);
      } catch (error) {
        console.error('Error managing quotation:', error);
        alert('Error managing quotation. Please try again.');
      }
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
            onClick={handleAddQuotationClick}
          >
            Add Quotation
          </button>
        </div>

        {showAddForm && (
          <div className="modal">
            <div className="modal-content quotation-form">
              <h3>Create New Quotation</h3>
              <form onSubmit={handleSubmit}>
                <div className="quotation-number-section">
                  <div className="form-group">
                    <label>Quotation Number:</label>
                    <input
                      type="text"
                      value={newQuotation.quotationNumber || ''}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date:</label>
                    <input
                      type="text"
                      value={newQuotation.createdAt ? new Date(newQuotation.createdAt).toLocaleDateString() : ''}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                </div>

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
                        <input
                          type="text"
                          placeholder="Type to search items..."
                          value={newQuotation.items[index].name}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewQuotation(prev => {
                              const updatedItems = [...prev.items];
                              updatedItems[index] = {
                                ...updatedItems[index],
                                name: value,
                                itemId: '',
                                price: 0,
                                total: 0,
                                unit: ''
                              };
                              return {
                                ...prev,
                                items: updatedItems
                              };
                            });
                            handleItemSearch(index, value);
                          }}
                          onFocus={() => {
                            setActiveInputIndex(index);
                            if (newQuotation.items[index].name) {
                              handleItemSearch(index, newQuotation.items[index].name);
                            } else {
                              setItemSearchResults([]);
                            }
                          }}
                          onBlur={(e) => {
                            // Only blur if we're not clicking on a search result
                            const relatedTarget = e.relatedTarget;
                            if (!relatedTarget || !relatedTarget.classList.contains('search-result-item')) {
                              setTimeout(() => {
                                setActiveInputIndex(null);
                                setItemSearchResults([]);
                              }, 200);
                            }
                          }}
                          required
                        />
                        {itemSearchResults.length > 0 && activeInputIndex === index && (
                          <div className="search-results">
                            {itemSearchResults.map(result => (
                              <div
                                key={result.id}
                                className="search-result-item"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent input blur
                                  handleItemSelect(index, result);
                                }}
                                tabIndex="0"
                              >
                                {result.itemName}
                              </div>
                            ))}
                          </div>
                        )}
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
                    {isEditing ? 'Update Quotation' : 'Create Quotation'}
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
                <div className="quotation-card-header">
                  <div className="quotation-info">
                    <h3>Quotation #{quotation.quotationNumber}</h3>
                    <p className="date">{new Date(quotation.createdAt?.toDate()).toLocaleDateString()}</p>
                  </div>
                  <div className="quotation-actions">
                    <button 
                      className="view-button"
                      onClick={() => handleViewQuotation(quotation)}
                    >
                      View
                    </button>
                    {!quotation.movedToBill && (
                      <button 
                        className="edit-button"
                        onClick={() => handleEditQuotation(quotation)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="quotation-card-body">
                  <p className="company-name">To: {quotation.toAddress.companyName}</p>
                  <p className="total-amount">Total: ₹{quotation.total?.toLocaleString()}</p>
                  <span className={`status-badge ${quotation.status}`}>
                    {quotation.status === 'moved_to_bill' ? 'Moved to Bill' : quotation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add View Modal */}
      {viewQuotation && (
        <div className="modal">
          <div className="modal-content quotation-view">
            <div className="modal-header">
              <h3>Quotation #{viewQuotation.quotationNumber}</h3>
              <button className="modal-close-button" onClick={handleCloseView}>×</button>
            </div>
            <div className="quotation-details">
              <div className="quotation-date">
                Date: {new Date(viewQuotation.createdAt?.toDate()).toLocaleDateString()}
              </div>
              <div className="addresses">
                <div className="from-address">
                  <h4>From</h4>
                  <p><strong>{viewQuotation.fromAddress.companyName}</strong></p>
                  <p>{viewQuotation.fromAddress.address}</p>
                  <p>GSTIN: {viewQuotation.fromAddress.gstin}</p>
                  <p>{viewQuotation.fromAddress.city}, {viewQuotation.fromAddress.state}</p>
                </div>
                <div className="to-address">
                  <h4>To</h4>
                  <p><strong>{viewQuotation.toAddress.companyName}</strong></p>
                  <p>{viewQuotation.toAddress.address}</p>
                  <p>GSTIN: {viewQuotation.toAddress.gstin}</p>
                  <p>{viewQuotation.toAddress.city}, {viewQuotation.toAddress.state}</p>
                </div>
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
                    {viewQuotation.items.map((item, index) => (
                      <tr key={index}>
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
                      <td>₹{viewQuotation.total?.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="modal-footer">
                {!viewQuotation.movedToBill && (
                  <button 
                    className="move-to-bill-button"
                    onClick={() => handleMoveToBill(viewQuotation)}
                  >
                    Move to Bill
                  </button>
                )}
                <button className="close-view-button" onClick={handleCloseView}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotation; 