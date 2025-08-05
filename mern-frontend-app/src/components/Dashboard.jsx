import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './dashboard.css';


export default function Dashboard({ token }) {
  const [agents, setAgents] = useState([]);
  const [tasksByAgent, setTasksByAgent] = useState({});
  const [addAgentData, setAddAgentData] = useState({ name: '', email: '', mobileNumber: '', password: '' });
  const [addAgentError, setAddAgentError] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get('http://localhost:9000/api/agents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(data);
      // Fetch tasks for agents
      data.forEach(agent => fetchTasks(agent._id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async (agentId) => {
    try {
      const { data } = await axios.get(`http://localhost:9000/api/tasks/byAgent/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasksByAgent(prev => ({ ...prev, [agentId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleAddAgentChange = (e) => {
    const { name, value } = e.target;
    setAddAgentData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAgentSubmit = async (e) => {
    e.preventDefault();
    setAddAgentError('');
    try {
      await axios.post('http://localhost:9000/api/agents/add', addAgentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddAgentData({ name: '', email: '', mobileNumber: '', password: '' });
      fetchAgents();
    } catch (err) {
      setAddAgentError(err.response?.data?.message || 'Failed to add agent');
    }
  };

  const allowedExtensions = ['csv', 'xlsx', 'axls'];

  const handleFileChange = (e) => {
    setUploadMessage('');
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setUploadMessage('File type not supported');
        setCsvFile(null);
      } else {
        setCsvFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadMessage('Please select a valid file');
      return;
    }
    setUploadMessage('');
    const formData = new FormData();
    formData.append('list', csvFile);

    try {
      await axios.post('http://localhost:9000/api/tasks/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadMessage('Upload and distribution successful');
      fetchAgents(); // Reload agents and tasks
    } catch (err) {
      setUploadMessage(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h2>Dashboard</h2>

      <section style={{ marginBottom: 40 }}>
        <h3>Add Agent</h3>
        {addAgentError && <p style={{ color: 'red' }}>{addAgentError}</p>}
        <form onSubmit={handleAddAgentSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: 400 }}>
          <input
            placeholder="Name"
            name="name"
            value={addAgentData.name}
            onChange={handleAddAgentChange}
            required
            style={{ marginBottom: 10, padding: 8 }}
          />
          <input
            placeholder="Email"
            type="email"
            name="email"
            value={addAgentData.email}
            onChange={handleAddAgentChange}
            required
            style={{ marginBottom: 10, padding: 8 }}
          />
          <input
            placeholder="Mobile Number with country code"
            name="mobileNumber"
            value={addAgentData.mobileNumber}
            onChange={handleAddAgentChange}
            required
            style={{ marginBottom: 10, padding: 8 }}
          />
          <input
            placeholder="Password"
            type="password"
            name="password"
            value={addAgentData.password}
            onChange={handleAddAgentChange}
            required
            style={{ marginBottom: 10, padding: 8 }}
          />
          <button type="submit" style={{ padding: 10 }}>Add Agent</button>
        </form>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h3>Upload CSV for Task Distribution</h3>
        <input type="file" onChange={handleFileChange} accept=".csv,.xlsx,.axls" />
        <button onClick={handleUpload} style={{ marginLeft: 10, padding: 10 }}>Upload & Distribute</button>
        {uploadMessage && <p>{uploadMessage}</p>}
      </section>

      <section>
        <h3>Agents & Tasks</h3>
        {agents.length === 0 ? (
          <p>No agents found. Please add agents (minimum 5).</p>
        ) : (
          agents.map(agent => (
            <div key={agent._id} className='agent-card' style={{ marginBottom: 30, border: '1px solid #ccc', padding: 10 }}>
              <h4>{agent.name} ({agent.email})</h4>
              <p>Mobile: {agent.mobileNumber}</p>
              <h5>Tasks:</h5>
              {tasksByAgent[agent._id]?.length > 0 ? (
                <ul>
                  {tasksByAgent[agent._id].map(task => (
                    <li key={task._id}>
                      {task.firstName} - {task.phone} {task.notes ? `(${task.notes})` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No tasks assigned.</p>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
