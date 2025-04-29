import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    role: 'User',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        companyName: formData.companyName,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString()
      });

      // Navigate to dashboard or home page
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">SiteManager</span>
          </div>
          <h2>Create Account</h2>
          <p>Join us to manage your construction projects efficiently</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter your company name"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="Admin">Admin</option>
              <option value="Accounts">Accounts</option>
              <option value="User">User</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              className="form-input"
            />
            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className={`auth-btn primary ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="auth-btn secondary"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup; 