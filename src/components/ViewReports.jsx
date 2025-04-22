import React, { useState, useEffect } from 'react';
import { FiDownload, FiBarChart2, FiBox, FiTool, FiLoader, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { format } from 'date-fns';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, percentage, icon: Icon, trend, className }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${
        title === 'Total Requests' ? 'bg-blue-100 text-blue-600' :
        title === 'Approved' ? 'bg-green-100 text-green-600' :
        title === 'In Stock' ? 'bg-emerald-100 text-emerald-600' :
        title === 'Low Stock' ? 'bg-amber-100 text-amber-600' :
        title === 'Out of Stock' ? 'bg-red-100 text-red-600' :
        'bg-red-100 text-red-600'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {percentage !== undefined && (
      <p className="text-sm text-gray-600">{percentage}% {trend}</p>
    )}
  </div>
);

export const ViewReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('Request Statistics');
  const [timeframe, setTimeframe] = useState('Last Month');
  const [data, setData] = useState({
    requestStats: { total: 0, approved: 0, rejected: 0, pending: 0 },
    stockStats: { total: 0, lowStock: 0, outOfStock: 0 },
    repairStats: { total: 0, approved: 0, rejected: 0, pending: 0 },
    recentActivity: []
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/reports', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd')
        }
      });

      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/reports/download/${reportType.toLowerCase().split(' ')[0]}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType.toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report');
    }
  };

  const distributionData = {
    labels: ['Total', 'Approved', 'Rejected', 'Pending'],
    datasets: [
      {
        label: 'Requests Analysis',
        data: [
          data.requestStats.total,
          data.requestStats.approved,
          data.requestStats.rejected,
          data.requestStats.pending
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'],
      }
    ]
  };

  const stockDistributionData = {
    labels: ['Total Items', 'In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        label: 'Stock Analysis',
        data: [
          data.stockStats.total,
          data.stockStats.total - (data.stockStats.lowStock + data.stockStats.outOfStock),
          data.stockStats.lowStock,
          data.stockStats.outOfStock
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to fetch reports: {error}
      </div>
    );
  }

  const approvalRate = data.requestStats.total > 0
    ? ((data.requestStats.approved / data.requestStats.total) * 100).toFixed(1)
    : 0;

  const rejectionRate = data.requestStats.total > 0
    ? ((data.requestStats.rejected / data.requestStats.total) * 100).toFixed(1)
    : 0;

  const inStockRate = data.stockStats.total > 0
    ? (((data.stockStats.total - (data.stockStats.lowStock + data.stockStats.outOfStock)) / data.stockStats.total) * 100).toFixed(1)
    : 0;

  const lowStockRate = data.stockStats.total > 0
    ? ((data.stockStats.lowStock / data.stockStats.total) * 100).toFixed(1)
    : 0;

  const outOfStockRate = data.stockStats.total > 0
    ? ((data.stockStats.outOfStock / data.stockStats.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option>Request Statistics</option>
            <option>Stock Analysis</option>
            <option>Repair Reports</option>
          </select>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option>Last Month</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiDownload /> Download Report
          </button>
        </div>
      </div>

      {reportType === 'Request Statistics' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Requests"
              value={data.requestStats.total}
              icon={FiBarChart2}
              trend="this month"
            />
            <StatCard
              title="Approved"
              value={data.requestStats.approved}
              percentage={approvalRate}
              icon={FiCheckCircle}
              trend="approval rate"
            />
            <StatCard
              title="Rejected"
              value={data.requestStats.rejected}
              percentage={rejectionRate}
              icon={FiXCircle}
              trend="rejection rate"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Distribution</h2>
              <div className="h-80">
                <Bar data={distributionData} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {reportType === 'Stock Analysis' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="In Stock"
              value={data.stockStats.total - (data.stockStats.lowStock + data.stockStats.outOfStock)}
              percentage={inStockRate}
              icon={FiBox}
              trend="of total items"
              className="border-l-4 border-emerald-500"
            />
            <StatCard
              title="Low Stock"
              value={data.stockStats.lowStock}
              percentage={lowStockRate}
              icon={FiAlertCircle}
              trend="needs attention"
              className="border-l-4 border-amber-500"
            />
            <StatCard
              title="Out of Stock"
              value={data.stockStats.outOfStock}
              percentage={outOfStockRate}
              icon={FiXCircle}
              trend="requires action"
              className="border-l-4 border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Stock Distribution</h2>
              <div className="h-80">
                <Bar data={stockDistributionData} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ViewReports;