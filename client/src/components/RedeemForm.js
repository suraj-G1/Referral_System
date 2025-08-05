import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const RedeemForm = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    code: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/referrals/redeem', {
        code: formData.code,
        userId: currentUser.id
      });
      toast.success('Referral code redeemed successfully!');
      setFormData({ code: '' });
    } catch (error) {
      console.error('Error redeeming code:', error);
      toast.error(error.response?.data?.error || 'Failed to redeem code');
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Redeem Referral Code</h1>
          <p className="text-gray-600">Enter a referral code to earn credits</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Referral Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="input"
              placeholder="Enter referral code"
              required
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Redeeming...' : 'Redeem Code'}
            </button>
            <Link to="/" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">What happens when you redeem:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• You become an L1 referral of the code owner</li>
            <li>• The referrer earns +1.0 credits</li>
            <li>• Their L2 referrers earn +0.25 credits</li>
            <li>• Their L3 referrers earn +0.10 credits</li>
            <li>• All credits are subject to monthly caps</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• You can only redeem one referral code</li>
            <li>• You cannot refer yourself</li>
            <li>• Credits convert after completing requirements</li>
            <li>• Monthly caps apply to all referral levels</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RedeemForm; 