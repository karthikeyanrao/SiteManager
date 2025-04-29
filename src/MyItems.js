import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import './MyItems.css';

const MyItems = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    workCategory: '',
    itemName: '',
    ratePerUnit: '',
    unit: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);

  // Fetch items from Firebase
  const fetchItems = async () => {
    try {
      const q = query(collection(db, 'MyItem'), orderBy('workCategory'));
      const querySnapshot = await getDocs(q);
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item
        const itemRef = doc(db, 'MyItem', editingItem.id);
        await updateDoc(itemRef, {
          ...formData,
          ratePerUnit: parseFloat(formData.ratePerUnit)
        });
      } else {
        // Add new item
        await addDoc(collection(db, 'MyItem'), {
          ...formData,
          createdAt: new Date(),
          ratePerUnit: parseFloat(formData.ratePerUnit)
        });
      }

      // Reset form and refresh items
      setFormData({
        workCategory: '',
        itemName: '',
        ratePerUnit: '',
        unit: '',
        description: ''
      });
      setShowForm(false);
      setEditingItem(null);
      await fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      workCategory: item.workCategory,
      itemName: item.itemName,
      ratePerUnit: item.ratePerUnit.toString(),
      unit: item.unit,
      description: item.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'MyItem', itemId));
        await fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  return (
    <div className="myitems-container">
      <div className="myitems-header">
        <h1>My Items</h1>
        <button 
          className="add-item-button"
          onClick={() => {
            setEditingItem(null);
            setFormData({
              workCategory: '',
              itemName: '',
              ratePerUnit: '',
              unit: '',
              description: ''
            });
            setShowForm(true);
          }}
        >
          Add Item
        </button>
      </div>

      {showForm && (
        <div className="add-item-modal">
          <div className="modal-content">
            <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Work Category:</label>
                <select
                  name="workCategory"
                  value={formData.workCategory}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Internal Plaster">Internal Plaster</option>
                  <option value="External plaster">External plaster</option>
                  <option value="Masonry">Masonry</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Painting">Painting</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Item Name:</label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter item name"
                />
              </div>

              <div className="form-group">
                <label>Rate per Unit:</label>
                <input
                  type="number"
                  name="ratePerUnit"
                  value={formData.ratePerUnit}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter rate per unit"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Unit:</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., sq.ft, kg, piece"
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter item description"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-button">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading items...</div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-actions">
                <button 
                  className="edit-button"
                  onClick={() => handleEdit(item)}
                >
                  ✏️
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(item.id)}
                >
                  🗑️
                </button>
              </div>
              <h3>{item.itemName}</h3>
              <p className="category">{item.workCategory}</p>
              <p className="rate">₹{item.ratePerUnit} per {item.unit}</p>
              {item.description && (
                <p className="description">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyItems; 