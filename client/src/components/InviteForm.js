import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const InviteForm = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/referrals/invite', formData);
      toast.success('User invited successfully!');
      setFormData({ email: '', username: '' });
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error.response?.data?.error || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Invite New User</h1>
          <p className="text-gray-600">Invite friends to join the referral system</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Inviting...' : 'Invite User'}
            </button>
            <Link to="/" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• L1 referrals earn +1.0 credits</li>
            <li>• L2 referrals earn +0.25 credits</li>
            <li>• L3 referrals earn +0.10 credits</li>
            <li>• Credits convert after 6 rounds + 2 reflections</li>
            <li>• Monthly caps: L2+L3 ≤ 50, total ≤ 100</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InviteForm; 