import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

// Configure axios base URL
const api = axios.create({
  baseURL: 'http://localhost:5000'
});

export const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('All Modules');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        module: selectedModule !== 'All Modules' ? selectedModule : '',
        action: selectedAction !== 'All Actions' ? selectedAction : '',
        startDate,
        endDate,
      };

      const response = await api.get('/api/logs', { 
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLogs(response.data.logs);
      setTotalPages(Math.ceil(response.data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchQuery, selectedModule, selectedAction, startDate, endDate]);

  const handleExport = async () => {
    try {
      const response = await api.get('/api/logs/export', {
        params: {
          search: searchQuery,
          module: selectedModule !== 'All Modules' ? selectedModule : '',
          action: selectedAction !== 'All Actions' ? selectedAction : '',
          startDate,
          endDate,
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded p-2"
        />
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="border rounded p-2"
        >
          <option>All Modules</option>
          <option>users</option>
          <option>stock</option>
          <option>repairs</option>
        </select>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="border rounded p-2"
        >
          <option>All Actions</option>
          <option value="view">View</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="other">Other</option>
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-2 w-1/2"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded p-2 w-1/2"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border rounded-lg table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[180px] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="w-[100px] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="w-[120px] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="w-[120px] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="w-[120px] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => {
                  const timestamp = log.timestamp ? new Date(log.timestamp) : null;
                  const isValidDate = timestamp && !isNaN(timestamp.getTime());
                  
                  return (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {isValidDate ? format(timestamp, 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${log.action === 'delete' ? 'bg-red-100 text-red-800' : 
                            log.action === 'create' ? 'bg-green-100 text-green-800' : 
                            log.action === 'update' ? 'bg-yellow-100 text-yellow-800' :
                            log.action === 'view' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {log.action ? log.action.charAt(0).toUpperCase() + log.action.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {log.module || 'system'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        <div className="break-words">
                          {log.details || 'No details'}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {log.performedBy?.name || 'System'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${log.userRole === 'Admin' ? 'bg-purple-100 text-purple-800' :
                            log.userRole === 'SystemAdmin' ? 'bg-blue-100 text-blue-800' :
                            log.userRole === 'LogisticsOfficer' ? 'bg-green-100 text-green-800' :
                            log.userRole === 'UnitLeader' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {log.userRole || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 