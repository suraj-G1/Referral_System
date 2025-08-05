import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Dashboard = ({ currentUser }) => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralStatus();
  }, []);

  const fetchReferralStatus = async () => {
    try {
      const response = await axios.get(`/api/referrals/status?userId=${currentUser.id}`);
      setReferralData(response.data);
    } catch (error) {
      console.error('Error fetching referral status:', error);
      // Mock data for demo with enhanced features
      const mockStats = {
        l1: { count: 5, credits: 5.0 },
        l2: { count: 12, credits: 3.0 },
        l3: { count: 8, credits: 0.8 }
      };
      
      setReferralData({
        user: currentUser,
        stats: mockStats,
        pendingCredits: 8.8,
        isEligibleForConversion: false,
        autoConversion: {
          canAutoConvert: true,
          creditsToNextConversion: 0.2,
          threshold: 1.0
        },
        requirements: {
          completedRounds: 4,
          requiredRounds: 6,
          acceptedReflections: 1,
          requiredReflections: 2
        },
        monthlyCapsProgress: {
          l2L3Combined: { current: 3.8, limit: 50, percentage: 8 },
          totalReferrals: { current: 25, limit: 100, percentage: 25 }
        },
        referralLink: `http://localhost:3000/invite?code=${currentUser.referralCode}`,
        currentCredits: 15.5,
        totalMonthlyCredits: calculateTotalMonthlyCredits(mockStats)
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Referral link copied!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Calculate total monthly credits
  const calculateTotalMonthlyCredits = (stats) => {
    return stats.l1.credits + stats.l2.credits + stats.l3.credits;
  };

  // Handle manual credit conversion
  const handleConvertCredits = async () => {
    try {
      const response = await axios.post('/api/referrals/convert-credits', {
        userId: currentUser.id
      });
      
      if (response.data.convertedAmount > 0) {
        toast.success(`Successfully converted ${response.data.convertedAmount} credits!`);
        // Refresh the dashboard data
        fetchReferralStatus();
      } else {
        toast.info('No pending credits to convert');
      }
    } catch (error) {
      console.error('Error converting credits:', error);
      toast.error(error.response?.data?.error || 'Failed to convert credits');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center">
          <h2>Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="card mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Referral Dashboard</h1>
            <p className="text-gray-600">Welcome back, {referralData.user.username}!</p>
          </div>
          <div className="flex gap-2">
            <Link to="/invite" className="btn btn-primary">Invite Users</Link>
            <Link to="/redeem" className="btn btn-secondary">Redeem Code</Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stats-card">
          <h3>{referralData.stats.l1.count}</h3>
          <p>L1 Referrals</p>
          <p className="text-sm opacity-75">{referralData.stats.l1.credits} credits</p>
        </div>
        <div className="stats-card">
          <h3>{referralData.stats.l2.count}</h3>
          <p>L2 Referrals</p>
          <p className="text-sm opacity-75">{referralData.stats.l2.credits} credits</p>
        </div>
        <div className="stats-card">
          <h3>{referralData.stats.l3.count}</h3>
          <p>L3 Referrals</p>
          <p className="text-sm opacity-75">{referralData.stats.l3.credits} credits</p>
        </div>
        <div className="stats-card">
          <h3>{referralData.currentCredits}</h3>
          <p>Total Credits</p>
          <p className="text-sm opacity-75">Available now</p>
        </div>
      </div>

      {/* Level-wise Breakdown */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6">Referral Progress Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* L1 Breakdown */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-800">Level 1</h3>
              <span className="text-2xl font-bold text-blue-600">{referralData.stats.l1.count}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-semibold">{referralData.stats.l1.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credit Rate:</span>
                <span className="font-semibold text-green-600">+1.0</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((referralData.stats.l1.count / 20) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {referralData.stats.l1.count} direct referrals
              </p>
            </div>
          </div>

          {/* L2 Breakdown */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-800">Level 2</h3>
              <span className="text-2xl font-bold text-purple-600">{referralData.stats.l2.count}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-semibold">{referralData.stats.l2.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credit Rate:</span>
                <span className="font-semibold text-green-600">+0.25</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((referralData.stats.l2.count / 50) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {referralData.stats.l2.count} second-level referrals
              </p>
            </div>
          </div>

          {/* L3 Breakdown */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-pink-800">Level 3</h3>
              <span className="text-2xl font-bold text-pink-600">{referralData.stats.l3.count}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Credits:</span>
                <span className="font-semibold">{referralData.stats.l3.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credit Rate:</span>
                <span className="font-semibold text-green-600">+0.10</span>
              </div>
              <div className="w-full bg-pink-200 rounded-full h-2">
                <div 
                  className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((referralData.stats.l3.count / 100) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {referralData.stats.l3.count} third-level referrals
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Referral Link */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Your Referral Link</h2>
          <div className="copy-link">
            <input
              type="text"
              value={referralData.referralLink}
              readOnly
              className="input"
            />
            <button onClick={() => copyToClipboard(referralData.referralLink)}>
              Copy
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share this link with friends to earn credits!
          </p>
        </div>

        {/* Pending Credits & Fractions */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Pending Fractions & Credits</h2>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-purple-600 mb-2">
              {referralData.pendingCredits}
            </h3>
            <p className="text-gray-600 mb-4">Fractional credits waiting to be converted</p>
            
            {/* Auto-conversion Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Auto-Conversion Status</h4>
              <div className="text-sm text-blue-700">
                {referralData.autoConversion.canAutoConvert ? (
                  <div className="text-green-600 font-semibold">
                    ✓ Ready for auto-conversion at {referralData.autoConversion.threshold} credits
                  </div>
                ) : (
                  <div>
                    <p>• {referralData.autoConversion.creditsToNextConversion} credits needed for next auto-conversion</p>
                    <p>• Auto-conversion threshold: {referralData.autoConversion.threshold} credits</p>
                  </div>
                )}
              </div>
            </div>
            
            {!referralData.isEligibleForConversion && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Manual Conversion Requirements:</h4>
                <div className="text-sm text-yellow-700">
                  <p>• Complete {referralData.requirements.requiredRounds - referralData.requirements.completedRounds} more rounds</p>
                  <p>• Accept {referralData.requirements.requiredReflections - referralData.requirements.acceptedReflections} more reflections</p>
                </div>
              </div>
            )}
            
            {referralData.isEligibleForConversion && referralData.pendingCredits > 0 && (
              <button 
                onClick={handleConvertCredits}
                className="btn btn-primary mt-4 w-full"
              >
                Convert Pending Credits
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Total Monthly Referral Credits */}
      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-6">This Month's Referral Credits</h2>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <div className="text-center mb-4">
            <h3 className="text-4xl font-bold text-green-600 mb-2">
              {referralData.totalMonthlyCredits || 0}
            </h3>
            <p className="text-gray-600">Total referral credits earned this month</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-2xl font-bold text-blue-600">{referralData.stats.l1.credits}</span>
              <p className="text-sm text-gray-600">L1 Credits</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-purple-600">{referralData.stats.l2.credits}</span>
              <p className="text-sm text-gray-600">L2 Credits</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-pink-600">{referralData.stats.l3.credits}</span>
              <p className="text-sm text-gray-600">L3 Credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Caps Progress */}
      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-6">Monthly Caps Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">L2 + L3 Credits Cap</span>
              <span className="text-sm text-gray-600">
                {referralData.monthlyCapsProgress.l2L3Combined.current} / {referralData.monthlyCapsProgress.l2L3Combined.limit}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(referralData.monthlyCapsProgress.l2L3Combined.percentage, 100)}%`,
                  backgroundColor: referralData.monthlyCapsProgress.l2L3Combined.percentage > 80 ? '#ef4444' : 
                                  referralData.monthlyCapsProgress.l2L3Combined.percentage > 60 ? '#f59e0b' : '#667eea'
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {referralData.monthlyCapsProgress.l2L3Combined.percentage}% used
              {referralData.monthlyCapsProgress.l2L3Combined.percentage > 80 && (
                <span className="text-red-600 font-semibold ml-2">⚠️ Near limit</span>
              )}
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Total Referrals Cap</span>
              <span className="text-sm text-gray-600">
                {referralData.monthlyCapsProgress.totalReferrals.current} / {referralData.monthlyCapsProgress.totalReferrals.limit}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(referralData.monthlyCapsProgress.totalReferrals.percentage, 100)}%`,
                  backgroundColor: referralData.monthlyCapsProgress.totalReferrals.percentage > 80 ? '#ef4444' : 
                                  referralData.monthlyCapsProgress.totalReferrals.percentage > 60 ? '#f59e0b' : '#667eea'
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {referralData.monthlyCapsProgress.totalReferrals.percentage}% used
              {referralData.monthlyCapsProgress.totalReferrals.percentage > 80 && (
                <span className="text-red-600 font-semibold ml-2">⚠️ Near limit</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Cap Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Monthly Cap Rules:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• L2 + L3 credits combined cannot exceed 50 per month</p>
            <p>• Total referrals cannot exceed 100 per month</p>
            <p>• Caps reset automatically at the beginning of each month</p>
          </div>
        </div>
      </div>

      {/* Credit System Info */}
      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-4">Credit System</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-600">L1 Referrals</h3>
            <p className="text-2xl font-bold">+1.0</p>
            <p className="text-sm text-gray-600">Direct referrals</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h3 className="font-bold text-purple-600">L2 Referrals</h3>
            <p className="text-2xl font-bold">+0.25</p>
            <p className="text-sm text-gray-600">Second level</p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <h3 className="font-bold text-pink-600">L3 Referrals</h3>
            <p className="text-2xl font-bold">+0.10</p>
            <p className="text-sm text-gray-600">Third level</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 