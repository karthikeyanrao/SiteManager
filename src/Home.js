import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';


const Home = () => {
  const navigate = useNavigate();

  const [flippedCards, setFlippedCards] = useState({});

  const toggleCard = (index) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="logo" onClick={() => window.location.href = '/'}>
          <span className="logo-icon">🏗️</span>
          SiteManager 
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#testimonials" className="nav-link">Testimonials</a>
          <a href="#contact" className="nav-link">Contact</a>
          <button className="login-btn" onClick={() => navigate('/login')}>Login</button>
          <button className="signup-btn" onClick={() => navigate('/signup')}>Get Started</button>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <h1 className="title">
            <span className="title-line">Modern Construction Site</span>
            <span className="title-line highlight">Management</span>
            <span className="title-line">Made Simple</span>
          </h1>
          <p className="subtitle">
            Streamline your construction projects with our all-in-one management platform.
            Track progress, manage resources, and boost productivity.
          </p>
          <div className="cta-buttons">
            <button className="primary-btn">
              <span className="btn-text">Start Free Trial</span>
              <span className="btn-icon">→</span>
            </button>
            <button className="secondary-btn">
              <span className="btn-text">Watch Demo</span>
              <span className="btn-icon">▶</span>
            </button>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Active Projects</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
      </main>

      <section className="features" id="features">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p className="section-subtitle">Everything you need to manage your construction projects efficiently</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-card-front">
                <div className="feature-logo">
                  <span className="logo-icon">🏗️</span>
                  <span className="logo-text">Project Manager</span>
                </div>
                <p>Track progress, manage resources, and stay on schedule with our intuitive project management tools.</p>
              </div>
              <div className="feature-card-back">
                <div className="feature-logo">
                  <span className="logo-icon">🏗️</span>
                  <span className="logo-text">Project Manager</span>
                </div>
                <ul className="feature-details">
                  <li>Real-time project tracking</li>
                  <li>Resource allocation tools</li>
                  <li>Gantt chart visualization</li>
                  <li>Milestone tracking</li>
                  <li>Team collaboration tools</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-card-front">
                <div className="feature-logo">
                  <span className="logo-icon">👥</span>
                  <span className="logo-text">Attendance Pro</span>
                </div>
                <p>Monitor labor attendance and productivity with real-time tracking and automated reports.</p>
              </div>
              <div className="feature-card-back">
                <div className="feature-logo">
                  <span className="logo-icon">👥</span>
                  <span className="logo-text">Attendance Pro</span>
                </div>
                <ul className="feature-details">
                  <li>Biometric integration</li>
                  <li>GPS location tracking</li>
                  <li>Automated timesheets</li>
                  <li>Overtime calculation</li>
                  <li>Leave management</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-card-front">
                <div className="feature-logo">
                  <span className="logo-icon">💰</span>
                  <span className="logo-text">Payroll Plus</span>
                </div>
                <p>Automated salary calculations and payment tracking with detailed financial reports.</p>
              </div>
              <div className="feature-card-back">
                <div className="feature-logo">
                  <span className="logo-icon">💰</span>
                  <span className="logo-text">Payroll Plus</span>
                </div>
                <ul className="feature-details">
                  <li>Automated salary processing</li>
                  <li>Tax calculation</li>
                  <li>Payment integration</li>
                  <li>Salary slip generation</li>
                  <li>Financial reporting</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-card-front">
                <div className="feature-logo">
                  <span className="logo-icon">📦</span>
                  <span className="logo-text">Inventory Control</span>
                </div>
                <p>Manage materials and track usage efficiently with smart inventory management.</p>
              </div>
              <div className="feature-card-back">
                <div className="feature-logo">
                  <span className="logo-icon">📦</span>
                  <span className="logo-text">Inventory Control</span>
                </div>
                <ul className="feature-details">
                  <li>Real-time stock tracking</li>
                  <li>Automated reordering</li>
                  <li>Material usage analytics</li>
                  <li>Supplier management</li>
                  <li>Cost tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="section-header">
          <h2>What Our Clients Say</h2>
          <p className="section-subtitle">Success stories from construction companies worldwide</p>
        </div>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"SiteManager has transformed how we handle our construction projects. The efficiency gains are incredible!"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">👨‍💼</div>
              <div className="author-info">
                <h4>John Smith</h4>
                <p>CEO, BuildRight Inc.</p>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"The attendance tracking feature alone has saved us countless hours of manual work. Highly recommended!"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">👩‍💼</div>
              <div className="author-info">
                <h4>Sarah Johnson</h4>
                <p>Project Manager, ConstructPro</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">🏗️</span>
              <span className="logo-text">SiteManager</span>
            </div>
            <p className="footer-description">
              Transform your construction management with our comprehensive platform.
              Streamline operations, boost productivity, and achieve better results.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">LinkedIn</a>
              <a href="#" className="social-link">Twitter</a>
              <a href="#" className="social-link">Facebook</a>
              <a href="#" className="social-link">Instagram</a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Product</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Updates</a></li>
              <li><a href="#">Documentation</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              
              <li><a href="#">Blog</a></li>
              
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Tutorials</a></li>
              <li><a href="#">Support</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">© 2025 SiteManager. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 