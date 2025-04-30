import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import Projects from './Projects';
import Expense from './Expense';
import ThreeBackground from './ThreeBackground';
import MyItems from './MyItems';
import './Dashboard.css';
import Attendance from './Attendance';
import Profile from './Profile';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <Projects />;
      case 'expense':
        return <Expense />;
      case 'attendance':
        return <Attendance />;
      case 'items':
        return <MyItems />;
      case 'profile':
        return <Profile />;
      default:
        return <Projects />;
    }
  };

  return (
    <div className="dashboard">
      <ThreeBackground />
      
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          
          <div className="logo">
            <span className="logo-icon">🏗️</span>
            <span className="logo-text">SiteManager</span>
          </div>
        </div>
        
        <div className="navbar-right">
          <div className="profile-section">
            <button 
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="profile-icon">👤</span>
              <span className="profile-name">{user?.displayName || 'Profile'}</span>
            </button>
            
            {showProfileMenu && (
              <div className="profile-menu">
                <div className="profile-info">
                  <span className="profile-email">{user?.email}</span>
                </div>
                <div className="profile-actions">
                  <button 
                    className="profile-menu-button"
                    onClick={() => {
                      setActiveTab('profile');
                      setShowProfileMenu(false);
                    }}
                  >
                    Profile
                  </button>
                  <button 
                    className="logout-button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isExpanded ? 'expanded' : ''}`}>
        <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle Sidebar">
          <span className="menu-toggle-icon">
            {isExpanded ? '×' : '☰'}
          </span>
        </button>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Projects</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'expense' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense')}
          >
            <span className="nav-icon">💰</span>
            <span className="nav-label">Expense</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-label">Attendance</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-label">My Items</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard; 