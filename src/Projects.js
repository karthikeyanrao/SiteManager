import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import './Projects.css';

import Quotation from './Quotation';


const Projects = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectTab, setProjectTab] = useState('quotations');
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: '',
    dueDate: '',
    budget: ''
  });

  // Reset form when modal is closed
  const handleCloseModal = () => {
    setShowModal(false);
    setNewProject({
      name: '',
      dueDate: '',
      budget: ''
    });
  };

  // Handle input change without losing focus
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch projects from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Only fetch projects created by the current user
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('createdBy', '==', auth.currentUser?.uid));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate().toISOString().split('T')[0]
        }));
        setProjects(projectsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchProjects();
    }
  }, []);

  const handleNewProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) {
        alert('You must be logged in to create a project');
        return;
      }

      const projectData = {
        name: newProject.name,
        dueDate: Timestamp.fromDate(new Date(newProject.dueDate)),
        budget: parseFloat(newProject.budget),
        status: 'Planning',
        createdAt: Timestamp.now(),
        createdBy: auth.currentUser.uid,
        quotations: [],
        bills: [],
        payments: [],
        summary: {
          totalQuoted: 0,
          totalBilled: 0,
          totalPaid: 0
        }
      };

      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      // Add the new project to the local state
      setProjects(prev => [...prev, {
        id: docRef.id,
        ...projectData,
        dueDate: newProject.dueDate // Keep the formatted date for display
      }]);

      // Reset form and close modal
      handleCloseModal();
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Error creating project. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'planning':
        return '🎯';
      case 'in-progress':
        return '🚀';
      case 'completed':
        return '✅';
      default:
        return '🎯';
    }
  };

  const renderTabContent = () => {
    switch (projectTab.toLowerCase()) {
      case 'quotations':
        return <Quotation project={selectedProject} />;
      case 'bills':
        return <div>Bills Content</div>;
      case 'payments':
        return <div>Payments Content</div>;
      default:
        return <Quotation project={selectedProject} />;
    }
  };

  const renderProjectContent = () => {
    if (loading) {
      return <div className="loading">Loading projects...</div>;
    }

    if (!selectedProject) {
      return (
        <div className="projects-grid">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => setSelectedProject(project)}
            >
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <span className={`status-badge ${project.status?.toLowerCase().replace(' ', '-')}`}>
                  {getStatusIcon(project.status)} {project.status}
                </span>
              </div>
              <div className="project-card-content">
                <div className="project-info">
                  <div className="info-row">
                    <span className="info-label">Due Date:</span>
                    <span className="info-value">{new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Budget:</span>
                    <span className="info-value">₹{project.budget?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="project-detail">
        <div className="project-detail-header">
          <button 
            className="back-button"
            onClick={() => {
              setSelectedProject(null);
              setProjectTab('quotations');
            }}
          >
            Back to Projects
          </button>
          <div className="project-detail-info">
            <h2 className="project-title">{selectedProject.name}</h2>
            <div className="project-meta">
              <span className="meta-item due">
                Due: {new Date(selectedProject.dueDate).toLocaleDateString()}
              </span>
              <span className="meta-item budget">
                Budget: ₹{selectedProject.budget?.toLocaleString()}
              </span>
              <span className={`status-badge ${selectedProject.status?.toLowerCase().replace(' ', '-')}`}>
                {getStatusIcon(selectedProject.status)} {selectedProject.status}
              </span>
            </div>
          </div>
        </div>

        <div className="project-tabs">
          <button 
            className={`tab-button ${projectTab === 'quotations' ? 'active' : ''}`}
            onClick={() => setProjectTab('quotations')}
          >
            Quotations
          </button>
          <button 
            className={`tab-button ${projectTab === 'bills' ? 'active' : ''}`}
            onClick={() => setProjectTab('bills')}
          >
            Bills
          </button>
          <button 
            className={`tab-button ${projectTab === 'payments' ? 'active' : ''}`}
            onClick={() => setProjectTab('payments')}
          >
            Payments
          </button>
        </div>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    );
  };

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Projects</h1>
        <button 
          className="add-project-button"
          onClick={() => setShowModal(true)}
        >
          Add Project
        </button>
      </div>

      {renderProjectContent()}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Project</h2>
            <form onSubmit={handleNewProjectSubmit}>
              <div className="form-group">
                <label>Project Name:</label>
                <input
                  type="text"
                  name="name"
                  value={newProject.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter project name"
                />
              </div>

              <div className="form-group">
                <label>Due Date:</label>
                <input
                  type="date"
                  name="dueDate"
                  value={newProject.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Budget:</label>
                <input
                  type="number"
                  name="budget"
                  value={newProject.budget}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter project budget"
                  step="1000"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-button">Create Project</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={handleCloseModal}
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

export default Projects; 