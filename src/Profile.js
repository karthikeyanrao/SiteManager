import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: '',
    companyName: '',
    companyAddress: '',
    pincode: '',
    city: '',
    state: '',
    gstin: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData({
              fullName: userData.fullName || '',
              email: userData.email || '',
              phoneNumber: userData.phoneNumber || '',
              role: userData.role || '',
              companyName: userData.companyName || '',
              companyAddress: userData.companyAddress || '',
              pincode: userData.pincode || '',
              city: userData.city || '',
              state: userData.state || '',
              gstin: userData.gstin || ''
            });
          }
          setUser(currentUser);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
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
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, formData);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Information</h1>
        <button 
          className={`edit-button ${editMode ? 'cancel' : 'edit'}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit '}
        </button>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled={true}
                className="disabled-input"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                disabled={true}
                className="disabled-input"
              />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Company Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>Company Address</label>
              <input
                type="text"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
            <div className="form-group">
              <label>GSTIN</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                disabled={!editMode}
                required
              />
            </div>
          </div>
        </div>

        {editMode && (
          <div className="form-actions">
            <button type="submit" className="save-button">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Profile; 