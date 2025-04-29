import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Attendance.css';

const Attendance = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', employeeId: '' });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ present: 0, absent: 0, medical: 0, permission: 0 });
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projectsList = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch employees and attendance data when project is selected
  useEffect(() => {
    if (selectedProject) {
      const fetchEmployeesAndAttendance = async () => {
        try {
          // Fetch attendance data for selected project and date
          const attendanceRef = doc(db, 'Attendance', selectedProject.id);
          const attendanceDoc = await getDoc(attendanceRef);
          const attendanceData = attendanceDoc.exists() ? attendanceDoc.data() : {};
          
          // Get the date-specific attendance or initialize empty object
          const dateAttendance = attendanceData[selectedDate] || {};
          setAttendanceData(dateAttendance);

          // Calculate summary
          const summary = {
            present: Object.values(dateAttendance).filter(status => status === 'p').length,
            absent: Object.values(dateAttendance).filter(status => status === 'ab').length,
            medical: Object.values(dateAttendance).filter(status => status === 'ml').length,
            permission: Object.values(dateAttendance).filter(status => status === 'per').length
          };
          setSummary(summary);

          // Fetch employees for selected project
          const projectRef = doc(db, 'projects', selectedProject.id);
          const projectDoc = await getDoc(projectRef);
          const employeesList = projectDoc.data()?.employees || [];
          setEmployees(employeesList);
        } catch (error) {
          console.error('Error fetching employees and attendance:', error);
        }
      };
      fetchEmployeesAndAttendance();
    }
  }, [selectedProject, selectedDate]);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleAttendanceChange = async (employeeId, status) => {
    try {
      const attendanceRef = doc(db, 'Attendance', selectedProject.id);
      const attendanceDoc = await getDoc(attendanceRef);
      const currentData = attendanceDoc.exists() ? attendanceDoc.data() : {};
      
      // Update or create the employee's attendance record
      const employeeAttendance = currentData[employeeId] || {};
      employeeAttendance[selectedDate] = status;

      // Update Firestore
      await setDoc(attendanceRef, {
        ...currentData,
        [employeeId]: employeeAttendance
      }, { merge: true });

      // Update local state
      setAttendanceData(prev => ({
        ...prev,
        [employeeId]: {
          ...(prev[employeeId] || {}),
          [selectedDate]: status
        }
      }));

      // Update summary
      updateSummary();
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance. Please try again.');
    }
  };

  const updateSummary = () => {
    const newSummary = {
      present: 0,
      absent: 0,
      medical: 0,
      permission: 0
    };

    employees.forEach(employee => {
      const status = attendanceData[employee.employeeId]?.[selectedDate];
      if (status) {
        if (status === 'p') newSummary.present++;
        if (status === 'ab') newSummary.absent++;
        if (status === 'ml') newSummary.medical++;
        if (status === 'per') newSummary.permission++;
      }
    });

    setSummary(newSummary);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!selectedProject || !newEmployee.name || !newEmployee.role || !newEmployee.employeeId) return;

    try {
      const projectRef = doc(db, 'projects', selectedProject.id);
      const projectDoc = await getDoc(projectRef);
      const currentEmployees = projectDoc.data()?.employees || [];
      
      // Check if employee ID already exists
      if (currentEmployees.some(emp => emp.employeeId === newEmployee.employeeId)) {
        alert('Employee ID already exists!');
        return;
      }

      const newEmployeeData = {
        id: Date.now().toString(),
        employeeId: newEmployee.employeeId,
        name: newEmployee.name,
        role: newEmployee.role
      };

      await updateDoc(projectRef, {
        employees: [...currentEmployees, newEmployeeData]
      });

      setEmployees([...employees, newEmployeeData]);
      setNewEmployee({ name: '', role: '', employeeId: '' });
      setShowAddEmployee(false);
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const handleMarkAll = async (status) => {
    try {
      const attendanceRef = doc(db, 'Attendance', selectedProject.id);
      
      // Get current attendance data
      const attendanceDoc = await getDoc(attendanceRef);
      const currentData = attendanceDoc.exists() ? attendanceDoc.data() : {};
      
      // Create new attendance data for all employees
      const newDateAttendance = {};
      employees.forEach(employee => {
        newDateAttendance[employee.employeeId] = status;
      });

      // Update Firestore with the new attendance data
      await setDoc(attendanceRef, {
        ...currentData,
        [selectedDate]: newDateAttendance
      }, { merge: true });

      // Update local state
      setAttendanceData(newDateAttendance);

      // Update summary
      const newSummary = {
        present: status === 'p' ? employees.length : 0,
        absent: status === 'ab' ? employees.length : 0,
        medical: status === 'ml' ? employees.length : 0,
        permission: status === 'per' ? employees.length : 0
      };
      setSummary(newSummary);
    } catch (error) {
      console.error('Error marking all attendance:', error);
      alert('Failed to update attendance. Please try again.');
    }
  };

  const handleReset = async () => {
    try {
      const attendanceRef = doc(db, 'Attendance', selectedProject.id);
      
      // Get current attendance data
      const attendanceDoc = await getDoc(attendanceRef);
      const currentData = attendanceDoc.exists() ? attendanceDoc.data() : {};
      
      // Remove attendance data for the selected date
      delete currentData[selectedDate];

      // Update Firestore
      await setDoc(attendanceRef, currentData);

      // Update local state
      setAttendanceData({});
      setSummary({ present: 0, absent: 0, medical: 0, permission: 0 });
    } catch (error) {
      console.error('Error resetting attendance:', error);
      alert('Failed to reset attendance. Please try again.');
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'p': return 'Present';
      case 'ab': return 'Absent';
      case 'ml': return 'Medical Leave';
      case 'per': return 'Permission';
      default: return status;
    }
  };

  const downloadEmployeeAttendance = async () => {
    if (!selectedEmployee) {
      alert('Please select an employee first');
      return;
    }

    try {
      const attendanceRef = doc(db, 'Attendance', selectedProject.id);
      const attendanceDoc = await getDoc(attendanceRef);
      const employeeAttendance = attendanceDoc.data()?.[selectedEmployee.employeeId] || {};

      // Calculate statistics
      let totalDays = Object.keys(employeeAttendance).length;
      let presentDays = Object.values(employeeAttendance).filter(status => status === 'p').length;
      let absentDays = Object.values(employeeAttendance).filter(status => status === 'ab').length;
      let medicalDays = Object.values(employeeAttendance).filter(status => status === 'ml').length;
      let permissionDays = Object.values(employeeAttendance).filter(status => status === 'per').length;

      // Create PDF document
      const pdf = new jsPDF();

      // Add title
      pdf.setFontSize(20);
      pdf.text('Attendance Report', 105, 15, { align: 'center' });

      // Add employee details
      pdf.setFontSize(12);
      pdf.text(`Employee: ${selectedEmployee.name}`, 20, 30);
      pdf.text(`Employee ID: ${selectedEmployee.employeeId}`, 20, 37);
      pdf.text(`Role: ${selectedEmployee.role}`, 20, 44);

      // Add summary boxes
      const boxWidth = 35;
      const boxHeight = 25;
      const startX = 20;
      const startY = 55;
      const gap = 5;

      // Draw summary boxes
      const summaryData = [
        { label: 'Total Days', value: totalDays, color: '#4a90e2' },
        { label: 'Present', value: presentDays, color: '#2ed573' },
        { label: 'Absent', value: absentDays, color: '#ff4757' },
        { label: 'Medical Leave', value: medicalDays, color: '#ffa502' },
        { label: 'Permission', value: permissionDays, color: '#3097ff' }
      ];

      summaryData.forEach((item, index) => {
        const x = startX + (boxWidth + gap) * index;
        
        // Draw box
        pdf.setFillColor(item.color);
        pdf.setDrawColor(item.color);
        pdf.roundedRect(x, startY, boxWidth, boxHeight, 3, 3, 'FD');

        // Add text
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.text(item.value.toString(), x + boxWidth/2, startY + 10, { align: 'center' });
        pdf.setFontSize(8);
        pdf.text(item.label, x + boxWidth/2, startY + 18, { align: 'center' });
      });

      // Reset text color
      pdf.setTextColor(0, 0, 0);

      // Add attendance table
      const tableData = Object.entries(employeeAttendance)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, status]) => [
          new Date(date).toLocaleDateString('en-GB'),
          getStatusText(status)
        ]);

      pdf.autoTable({
        startY: startY + boxHeight + 15,
        head: [['Date', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [74, 144, 226],
          textColor: 255,
          fontSize: 12,
          halign: 'center'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      });

      // Add footer
      const pageCount = pdf.internal.getNumberOfPages();
      pdf.setFontSize(8);
      for(let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pdf.internal.pageSize.height - 10);
        pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width - 20, pdf.internal.pageSize.height - 10, { align: 'right' });
      }

      // Save the PDF
      pdf.save(`${selectedEmployee.name}_attendance.pdf`);

    } catch (error) {
      console.error('Error downloading attendance:', error);
      alert('Failed to download attendance data');
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1>Attendance Management</h1>
        <div className="date-selector">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="attendance-content">
        <div className="projects-list">
          <h2>Projects</h2>
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                  onClick={() => handleProjectClick(project)}
                >
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProject && (
          <div className="attendance-details">
            <div className="attendance-header-actions">
              <h2>{selectedProject.name} - Attendance</h2>
              <div className="header-buttons">
                <button className="add-employee-btn" onClick={() => setShowAddEmployee(true)}>
                  Add Employee
                </button>
                <select 
                  className="employee-select"
                  value={selectedEmployee?.employeeId || ''}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.employeeId === e.target.value);
                    setSelectedEmployee(employee);
                  }}
                >
                  <option value="">Select Employee for Download</option>
                  {employees.map(employee => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.name} ({employee.employeeId})
                    </option>
                  ))}
                </select>
                <button 
                  className="download-btn"
                  onClick={downloadEmployeeAttendance}
                  disabled={!selectedEmployee}
                >
                  Download Attendance
                </button>
              </div>
            </div>

            <div className="attendance-summary">
              <div className="summary-card present">
                <h3>Present</h3>
                <p>{summary.present}</p>
              </div>
              <div className="summary-card absent">
                <h3>Absent</h3>
                <p>{summary.absent}</p>
              </div>
              <div className="summary-card medical">
                <h3>Medical</h3>
                <p>{summary.medical}</p>
              </div>
              <div className="summary-card permission">
                <h3>Permission</h3>
                <p>{summary.permission}</p>
              </div>
            </div>

            <div className="attendance-actions-bar">
              <div className="mark-all-buttons">
                <button className="mark-all-btn present" onClick={() => handleMarkAll('p')}>
                  Mark All Present
                </button>
                <button className="mark-all-btn absent" onClick={() => handleMarkAll('ab')}>
                  Mark All Absent
                </button>
              </div>
              <button className="reset-btn" onClick={handleReset}>
                Reset All
              </button>
            </div>

            <div className="employees-list">
              {employees.map(employee => (
                <div key={employee.employeeId} className="employee-attendance-row">
                  <div className="employee-info">
                    <span className="employee-name">{employee.name}</span>
                    <span className="employee-id">ID: {employee.employeeId}</span>
                    <span className="employee-role">{employee.role}</span>
                  </div>
                  <div className="attendance-actions">
                    <button
                      className={`attendance-btn present ${attendanceData[employee.employeeId]?.[selectedDate] === 'p' ? 'active' : ''}`}
                      onClick={() => handleAttendanceChange(employee.employeeId, 'p')}
                    >
                      Present
                    </button>
                    <button
                      className={`attendance-btn absent ${attendanceData[employee.employeeId]?.[selectedDate] === 'ab' ? 'active' : ''}`}
                      onClick={() => handleAttendanceChange(employee.employeeId, 'ab')}
                    >
                      Absent
                    </button>
                    <button
                      className={`attendance-btn medical ${attendanceData[employee.employeeId]?.[selectedDate] === 'ml' ? 'active' : ''}`}
                      onClick={() => handleAttendanceChange(employee.employeeId, 'ml')}
                    >
                      Medical
                    </button>
                    <button
                      className={`attendance-btn permission ${attendanceData[employee.employeeId]?.[selectedDate] === 'per' ? 'active' : ''}`}
                      onClick={() => handleAttendanceChange(employee.employeeId, 'per')}
                    >
                      Permission
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddEmployee && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Employee</h2>
              <button className="close-button" onClick={() => setShowAddEmployee(false)}>×</button>
            </div>
            <form onSubmit={handleAddEmployee} className="add-employee-form">
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  value={newEmployee.employeeId}
                  onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowAddEmployee(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance; 