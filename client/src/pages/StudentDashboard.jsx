import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, AlertCircle, CheckCircle, Clock, Wifi } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [newDevice, setNewDevice] = useState({ macAddress: '', deviceName: '' });
  const [newTicket, setNewTicket] = useState({ issueType: 'Connectivity', location: 'Dorm', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('StudentDashboard: Mounted');
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('StudentDashboard: Fetching data');
    try {
      const token = localStorage.getItem('token');
      console.log('StudentDashboard: Token present?', !!token);
      const config = { headers: { 'x-auth-token': token } };
      
      const [devicesRes, ticketsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/devices', config),
        axios.get('http://localhost:5000/api/tickets', config)
      ]);

      console.log('StudentDashboard: Data fetched', devicesRes.data, ticketsRes.data);
      setDevices(devicesRes.data);
      setTickets(ticketsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('StudentDashboard: Error fetching data', err);
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      await axios.post('http://localhost:5000/api/devices', newDevice, config);
      setNewDevice({ macAddress: '', deviceName: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error adding device');
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/devices/${id}`, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      await axios.post('http://localhost:5000/api/tickets', newTicket, config);
      setNewTicket({ issueType: 'Connectivity', location: 'Dorm', description: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating ticket');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Devices Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Wifi className="w-5 h-5 mr-2 text-blue-600" />
            My Devices
          </h2>
          
          <form onSubmit={handleAddDevice} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Device Name (e.g. Laptop)"
                className="border rounded px-3 py-2 text-sm"
                value={newDevice.deviceName}
                onChange={(e) => setNewDevice({ ...newDevice, deviceName: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="MAC Address (XX:XX:XX:XX:XX:XX)"
                className="border rounded px-3 py-2 text-sm"
                value={newDevice.macAddress}
                onChange={(e) => setNewDevice({ ...newDevice, macAddress: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="mt-3 w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center">
              <Plus className="w-4 h-4 mr-1" /> Register Device
            </button>
          </form>

          <div className="space-y-3">
            {devices.map(device => (
              <div key={device._id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                <div>
                  <p className="font-medium text-gray-900">{device.deviceName}</p>
                  <p className="text-xs text-gray-500 font-mono">{device.macAddress}</p>
                </div>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium mr-3 ${device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {device.status}
                  </span>
                  <button onClick={() => handleDeleteDevice(device._id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {devices.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No devices registered.</p>}
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            Support Tickets
          </h2>

          <form onSubmit={handleCreateTicket} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={newTicket.issueType}
                  onChange={(e) => setNewTicket({ ...newTicket, issueType: e.target.value })}
                >
                  <option value="Connectivity">Connectivity Issue</option>
                  <option value="Speed">Slow Speed</option>
                  <option value="Login">Login Problem</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={newTicket.location}
                  onChange={(e) => setNewTicket({ ...newTicket, location: e.target.value })}
                >
                  <option value="Dorm">Dormitory</option>
                  <option value="Library">Library</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Classroom">Classroom</option>
                </select>
              </div>
              <textarea
                placeholder="Describe your issue..."
                className="border rounded px-3 py-2 text-sm w-full"
                rows="2"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                required
              ></textarea>
            </div>
            <button type="submit" className="mt-3 w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center">
              Report Issue
            </button>
          </form>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {tickets.map(ticket => (
              <div key={ticket._id} className="p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 text-sm">{ticket.issueType}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <span className="mr-2">{ticket.location}</span>
                  <span>• {new Date(ticket.createdAt).toLocaleDateString()}</span>
                </p>
                <p className="text-sm text-gray-700">{ticket.description}</p>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No tickets found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
