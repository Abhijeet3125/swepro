import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Server, AlertTriangle, Settings, Shield, Wifi, RefreshCw, Plus, Trash2, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminDashboard = () => {
  const [accessPoints, setAccessPoints] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [qosPolicies, setQosPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPolicy, setNewPolicy] = useState({ name: '', priority: 'Normal', description: '' });
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [selectedAP, setSelectedAP] = useState(null);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      fetchMetrics();
    }, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      
      const [networkRes, ticketsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/network/status', config),
        axios.get('http://localhost:5000/api/tickets', config)
      ]);

      if (networkRes.data.accessPoints) {
        setAccessPoints(networkRes.data.accessPoints);
        setLogs(networkRes.data.recentLogs || []);
        setQosPolicies(networkRes.data.qosPolicies || []);
      } else {
        setAccessPoints(networkRes.data);
      }
      
      setTickets(ticketsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data', err);
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/network/metrics', { headers: { 'x-auth-token': token } });
      
      setMetricsHistory(prev => {
        const newHistory = [...prev, { ...res.data, time: new Date(res.data.timestamp).toLocaleTimeString() }];
        return newHistory.slice(-20); // Keep last 20 points
      });
    } catch (err) {
      console.error('Error fetching metrics', err);
    }
  };

  const handleTicketStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/tickets/${id}`, { status: newStatus }, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/network/qos', newPolicy, { headers: { 'x-auth-token': token } });
      setNewPolicy({ name: '', priority: 'Normal', description: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error adding policy');
    }
  };

  const handleTogglePolicy = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/network/qos/${id}/toggle`, {}, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePolicy = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/network/qos/${id}`, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartAP = async (apId) => {
    setRestarting(true);
    
    // Simulate 2-second delay
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:5000/api/network/ap/${apId}/restart`, {}, { headers: { 'x-auth-token': token } });
        
        // Close modal and refresh
        setSelectedAP(null);
        setRestarting(false);
        fetchData();
      } catch (err) {
        console.error(err);
        setRestarting(false);
        alert('Failed to restart Access Point');
      }
    }, 2000);
  };

  if (loading) return <div>Loading...</div>;

  const currentPriorityLatency = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].priorityLatency : 0;
  const currentGeneralLatency = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].generalLatency : 0;
  const isOptimized = currentPriorityLatency < 60 && currentGeneralLatency > 100;

  return (
    <div className="space-y-8">
      {/* Network Heatmap Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Network Status (Live Heatmap)
          </h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Online</div>
            <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Offline</div>
            <div className="flex items-center text-gray-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Live</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {accessPoints.map(ap => (
            <div 
              key={ap._id} 
              onClick={() => setSelectedAP(ap)}
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-lg transition-all duration-300 ${ap.status === 'Online' ? 'border-green-100 bg-green-50 hover:bg-green-100' : 'border-red-100 bg-red-50 hover:bg-red-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <Server className={`w-5 h-5 ${ap.status === 'Online' ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-xs font-bold px-2 py-1 rounded ${ap.load > 80 ? 'bg-red-200 text-red-800' : 'bg-white text-gray-600'}`}>
                  {ap.load}% Load
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{ap.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{ap.location}</p>
              <div className="flex justify-between items-center text-xs text-gray-600">
                 <span>{ap.activeClients || 0} Clients</span>
                 <span>{ap.trafficRate || '0 Mbps'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AP Details Modal */}
      {selectedAP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedAP(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedAP.name}</h3>
              <button onClick={() => setSelectedAP(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <span className={`text-sm font-bold ${selectedAP.status === 'Online' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAP.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">IP Address</span>
                <span className="text-sm font-mono text-gray-800">{selectedAP.ipAddress || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Location</span>
                <span className="text-sm text-gray-800">{selectedAP.location}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Uptime</span>
                <span className="text-sm text-gray-800">{selectedAP.uptime || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Client Load</span>
                <span className="text-sm text-gray-800">{selectedAP.activeClients || 0} clients ({selectedAP.load}%)</span>
              </div>
            </div>

            {selectedAP.status === 'Offline' && (
              <button
                onClick={() => handleRestartAP(selectedAP._id)}
                disabled={restarting}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  restarting 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {restarting ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Rebooting...
                  </span>
                ) : (
                  'Remote Restart'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Real-Time Comparative QoS Monitor */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Comparative QoS Monitor
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Priority Traffic
            </div>
            <div className="flex items-center text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span> General Traffic
            </div>
            <span className={`ml-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isOptimized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOptimized ? 'Traffic Prioritized' : 'Network Congested'}
            </span>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="time" hide />
              <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12 } }} />
              <Tooltip />
              <Line type="monotone" dataKey="priorityLatency" stroke="#10B981" strokeWidth={3} dot={false} name="Priority (ms)" />
              <Line type="monotone" dataKey="generalLatency" stroke="#9CA3AF" strokeWidth={2} dot={false} name="General (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 text-center">
          <div className="p-3 bg-green-50 rounded border border-green-100">
            <p className="text-xs text-green-600 font-medium">Priority Latency</p>
            <p className="text-lg font-bold text-green-700">
              {currentPriorityLatency} ms
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-500 font-medium">General Latency</p>
            <p className="text-lg font-bold text-gray-700">
              {currentGeneralLatency} ms
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Jitter</p>
            <p className="text-lg font-bold text-gray-800">
              {metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].jitter : 0} ms
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Packet Loss</p>
            <p className="text-lg font-bold text-gray-800">
              {metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1].packetLoss : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Management */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
            Ticket Management
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Issue</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map(ticket => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <p className="font-medium text-gray-900 text-sm">{ticket.issueType}</p>
                      <p className="text-xs text-gray-500">{ticket.location} - {ticket.description}</p>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <button onClick={() => handleTicketStatus(ticket._id, 'In Progress')} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100">WIP</button>
                        <button onClick={() => handleTicketStatus(ticket._id, 'Resolved')} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100">Done</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QoS & Logs Column */}
        <div className="space-y-8">
          {/* QoS Control */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              QoS Policy Control
            </h2>
            
            <form onSubmit={handleAddPolicy} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Create New Policy</h3>
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Application / Service</label>
                  <select 
                    className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({...newPolicy, name: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select Application...</option>
                    <option value="Moodle (Assessment)">Moodle (Assessment)</option>
                    <option value="Zoom (Video Conf)">Zoom (Video Conf)</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Netflix (Streaming)">Netflix (Streaming)</option>
                    <option value="YouTube">YouTube</option>
                    <option value="General Browsing">General Browsing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Priority Level</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="priority" 
                        value="High" 
                        checked={newPolicy.priority === 'High'} 
                        onChange={(e) => setNewPolicy({...newPolicy, priority: e.target.value})}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">High</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="radio" 
                        name="priority" 
                        value="Normal" 
                        checked={newPolicy.priority === 'Normal'} 
                        onChange={(e) => setNewPolicy({...newPolicy, priority: e.target.value})}
                        className="mr-2 text-gray-600 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Normal</span>
                    </label>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded hover:bg-blue-700 transition-colors flex justify-center items-center shadow-sm">
                <Plus className="w-4 h-4 mr-1" /> Apply Policy
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Active Policies</h3>
              {qosPolicies.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No active policies configured.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {qosPolicies.map(policy => (
                    <div key={policy._id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{policy.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          policy.priority === 'High' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {policy.priority} Priority
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Status</span>
                          <button 
                            onClick={() => handleTogglePolicy(policy._id)}
                            className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${policy.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                            title={policy.isActive ? "Deactivate" : "Activate"}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${policy.isActive ? 'translate-x-4' : ''}`} />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleDeletePolicy(policy._id)} 
                          className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete Policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Event Logs */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              System Logs
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 text-sm border-b border-gray-50 pb-2 last:border-0">
                  {log.type === 'Critical' ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" /> : 
                   log.type === 'Warning' ? <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" /> :
                   <Wifi className="w-4 h-4 text-blue-400 mt-0.5" />}
                  <div>
                    <p className="text-gray-900">{log.message}</p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p className="text-gray-400 text-xs">No recent logs.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
