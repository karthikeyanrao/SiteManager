import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetFormData, setResetFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'An error occurred during login.';
      
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          console.error('Login error:', err);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, resetFormData.email);
      
      setResetSuccess(true);
      setError('');
      // Clear form data
      setResetFormData({
        email: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Show success message
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSuccess(false);
      }, 5000);

    } catch (err) {
      let errorMessage = 'Failed to send reset email.';
      
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          console.error('Password reset error:', err);
      }
      
      setError(errorMessage);
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
          <h2>{showForgotPassword ? 'Reset Password' : 'Welcome Back'}</h2>
          <p>{showForgotPassword ? 'Enter your email to receive a password reset link' : 'Sign in to continue to your dashboard'}</p>
        </div>

        {!showForgotPassword ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className={`auth-btn primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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
              onClick={() => navigate('/signup')}
            >
              Create New Account
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label htmlFor="reset-email">Email</label>
              <input
                type="email"
                id="reset-email"
                name="email"
                value={resetFormData.email}
                onChange={handleResetChange}
                className="form-input"
                required
                autoComplete="email"
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              className={`auth-btn primary ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {resetSuccess && (
              <div className="success-message">
                Password reset email sent! Please check your inbox.
              </div>
            )}

            <button
              type="button"
              className="auth-btn secondary"
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setResetSuccess(false);
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login; 