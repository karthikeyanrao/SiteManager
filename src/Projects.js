import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import './Projects.css';
import Bill from './Bill';
import PaymentP from './PaymentP';
import Quotation from './Quotation';

export const updateProjectStatus = async (projectId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (projectDoc.exists()) {
      const projectData = projectDoc.data();
      let newStatus = 'Planning';
      // Calculate total quotation from bills
      let totalQuotation = 0;
      if (projectData.bills && Array.isArray(projectData.bills)) {
        totalQuotation = projectData.bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
      }
      // Calculate total payments given
      let totalGiven = 0;
      if (projectData.payments && Array.isArray(projectData.payments)) {
        totalGiven = projectData.payments.reduce((sum, p) => sum + (parseFloat(p.amountGiven) || 0), 0);
      }
      // If all payments cover the total quotation, mark as Completed
      if (totalQuotation > 0 && totalGiven >= totalQuotation) {
        newStatus = 'Completed';
      } else if (projectData.bills && projectData.bills.length > 0) {
        newStatus = 'Started';
      } else if (projectData.quotations && projectData.quotations.length > 0) {
        newStatus = 'Quotation';
      }
      if (newStatus !== projectData.status) {
        await updateDoc(projectRef, { status: newStatus });
        console.log(`Project status updated to: ${newStatus}`);
      }
    }
  } catch (error) {
    console.error('Error updating project status:', error);
  }
};

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
          dueDate: doc.data().dueDate?.toDate().toISOString().split('T')[0],
          status: doc.data().status || 'Planning' // Ensure status is included, default to Planning
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

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        // Only fetch if still loading after 2 seconds
        if (loading && auth.currentUser) {
          // Re-run your fetchProjects logic
          const fetchProjects = async () => {
            try {
              const projectsRef = collection(db, 'projects');
              const q = query(projectsRef, where('createdBy', '==', auth.currentUser?.uid));
              const querySnapshot = await getDocs(q);
              const projectsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueDate: doc.data().dueDate?.toDate().toISOString().split('T')[0],
                status: doc.data().status || 'Planning' // Ensure status is included, default to Planning
              }));
              setProjects(projectsData);
              setLoading(false);
            } catch (error) {
              console.error('Error fetching projects:', error);
              setLoading(false);
            }
          };
          fetchProjects();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

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
        status: 'Planning', // Set initial status
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
        dueDate: newProject.dueDate, // Keep the formatted date for display
        status: 'Planning' // Ensure status is included in local state
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
      case 'quotation':
        return '📝';
      case 'started':
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
        return <Bill project={selectedProject} />;
      case 'payments':
        return <PaymentP project={selectedProject} />;
      default:
        return <Quotation project={selectedProject} />;
    }
  };

  const activeProjects = projects.filter(p => p.status?.toLowerCase() !== 'completed');
  const completedProjects = projects.filter(p => p.status?.toLowerCase() === 'completed');

  const renderProjectContent = () => {
    if (loading) {
      return <div className="loading">Loading projects...</div>;
    }

    if (!selectedProject) {
      return (
        <>
          <div className="projects-grid">
            {activeProjects.map(project => (
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
          {completedProjects.length > 0 && (
            <div className="completed-projects-section">
              <h2 className="completed-title">Completed Projects</h2>
              <div className="projects-grid">
                {completedProjects.map(project => (
                  <div 
                    key={project.id} 
                    className="project-card completed"
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
            </div>
          )}
        </>
      );
    }

    // In detail view, restrict actions if completed
    const isCompleted = selectedProject.status?.toLowerCase() === 'completed';

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
              {selectedProject.status !== 'Completed' && (
                <button className="mark-completed-btn" onClick={() => handleMarkCompleted(selectedProject.id)}>
                  <span className="completed-icon">✅</span> Completed
                </button>
              )}
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
          {/* Pass a prop to child components to indicate view-only mode if completed */}
          {projectTab.toLowerCase() === 'quotations' && <Quotation project={selectedProject} viewOnly={isCompleted} />}
          {projectTab.toLowerCase() === 'bills' && <Bill project={selectedProject} viewOnly={isCompleted} />}
          {projectTab.toLowerCase() === 'payments' && <PaymentP project={selectedProject} viewOnly={isCompleted} />}
        </div>
      </div>
    );
  };

  // Add function to handle quotation addition
  const handleAddQuotation = async (projectId, quotationData) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const updatedQuotations = [...(projectData.quotations || []), quotationData];
        
        await updateDoc(projectRef, {
          quotations: updatedQuotations
        });

        // Update project status after adding quotation
        await updateProjectStatus(projectId);
      }
    } catch (error) {
      console.error('Error adding quotation:', error);
      throw error;
    }
  };

  // Add function to handle bill addition
  const handleAddBill = async (projectId, billData) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const updatedBills = [...(projectData.bills || []), billData];
        
        await updateDoc(projectRef, {
          bills: updatedBills
        });

        // Update project status after adding bill
        await updateProjectStatus(projectId);
      }
    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  };

  // Add function to handle payment addition
  const handleAddPayment = async (projectId, paymentData) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const updatedPayments = [...(projectData.payments || []), paymentData];
        
        await updateDoc(projectRef, {
          payments: updatedPayments
        });

        // Update project status after adding payment
        await updateProjectStatus(projectId);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  // Inside the Projects component, add a handler to mark a project as completed
  const handleMarkCompleted = async (projectId) => {
    if (!window.confirm('Are you sure you want to mark this project as Completed? This action cannot be undone.')) return;
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { status: 'Completed' });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'Completed' } : p));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, status: 'Completed' });
      }
    } catch (error) {
      console.error('Error marking project as completed:', error);
    }
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