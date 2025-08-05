# Referral System M7

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) referral system with multi-level rewards and credit management.

## Features

- **Multi-level Referral System**: L1, L2, and L3 referral tracking
- **Credit Management**: Pending and converted credits with eligibility requirements
- **Monthly Caps**: L2+L3 ≤ 50 credits, total referrals ≤ 100 per month
- **Modern UI**: Beautiful dashboard with progress tracking and statistics
- **Real-time Updates**: Live referral status and progress monitoring

## Credit System

- **L1 Referrals**: +1.0 credits (direct referrals)
- **L2 Referrals**: +0.25 credits (second level)
- **L3 Referrals**: +0.10 credits (third level)
- **Fractional Credits**: All credits accrue as fractions in pending balance
- **Auto-Conversion**: Credits automatically convert to full credits when pending balance reaches 1.0
- **Manual Conversion**: Users can manually convert pending credits after meeting requirements
- **Requirements**: 6 completed rounds + 2 accepted reflections for manual conversion
- **Monthly Caps**: L2+L3 combined ≤ 50 credits, total referrals ≤ 100

## API Endpoints

### Backend Routes

- `POST /api/referrals/invite` - Invite new users
- `POST /api/referrals/redeem` - Redeem referral codes
- `GET /api/referrals/status` - Get user referral status
- `POST /api/referrals/convert-credits` - Manually convert pending credits
- `GET /api/health` - Health check endpoint

## Project Structure

```
referral-system-m7/
├── server.js                 # Main server file
├── package.json              # Backend dependencies
├── env.example              # Environment variables template
├── models/
│   ├── User.js              # User schema and methods
│   └── Referral.js          # Referral tracking schema
├── controllers/
│   └── referralController.js # API logic and business rules
├── routes/
│   └── referrals.js         # API route definitions
└── client/                  # React frontend
    ├── package.json         # Frontend dependencies
    ├── public/
    │   └── index.html       # Main HTML file
    └── src/
        ├── App.js           # Main React component
        ├── index.js         # React entry point
        ├── index.css        # Global styles
        └── components/
            ├── Dashboard.js  # Main dashboard
            ├── InviteForm.js # User invitation form
            └── RedeemForm.js # Code redemption form
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd referral-system-m7
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/referral-system
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run server
   ```

2. **Start the frontend (in a new terminal)**
   ```bash
   npm run client
   ```

3. **Or run both simultaneously**
   ```bash
   npm run dev
   ```

### Production Mode

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Usage

### Dashboard Features

- **Referral Statistics**: View L1, L2, and L3 referral counts and credits
- **Pending Credits**: Monitor credits waiting for conversion
- **Monthly Caps Progress**: Track L2+L3 and total referral limits
- **Referral Link**: Copy and share your unique referral link
- **Credit System Info**: Learn about the reward structure

### Inviting Users

1. Navigate to the "Invite Users" page
2. Enter email and username for the new user
3. Submit the form to create a new user account
4. The new user will receive a unique referral code

### Redeeming Codes

1. Navigate to the "Redeem Code" page
2. Enter a valid referral code
3. Submit to establish the referral relationship
4. Credits will be distributed according to the multi-level system

## Database Schema

### User Model
- `email`: Unique email address
- `username`: Unique username
- `referralCode`: Unique 8-character referral code
- `referredBy`: Reference to the user who referred them
- `referralLevel`: Current level in the referral chain (0-3)
- `credits`: Available credits
- `pendingCredits`: Credits waiting for conversion
- `completedRounds`: Number of completed rounds
- `acceptedReflections`: Number of accepted reflections
- `monthlyStats`: Monthly tracking for caps

### Referral Model
- `referrer`: User who made the referral
- `referred`: User who was referred
- `level`: Referral level (1, 2, or 3)
- `creditAmount`: Credits earned from this referral
- `status`: Referral status (pending, credited, cancelled)
- `month`: Month for tracking caps

## Business Logic

### Credit Distribution
1. When a user redeems a code, they become an L1 referral
2. The referrer earns +1.0 fractional credits (added to pending balance)
3. The referrer's L1 referrers become L2 and earn +0.25 fractional credits
4. The referrer's L2 referrers become L3 and earn +0.10 fractional credits

### Fractional Credit System
- All credits accrue as fractions in the pending balance
- Auto-conversion occurs when pending balance reaches 1.0
- Full credits are automatically moved to available credits
- Remaining fractions stay in pending balance

### Manual Credit Conversion
- Users can manually convert pending credits after meeting requirements
- Requirements: 6 completed rounds + 2 accepted reflections
- Manual conversion converts all pending fractions to available credits

### Monthly Caps
- L2 + L3 credits combined cannot exceed 50 per month
- Total referrals cannot exceed 100 per month
- Caps reset monthly

## Technologies Used

### Backend
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **UUID**: Unique ID generation
- **Express Rate Limit**: API rate limiting
- **CORS**: Cross-origin resource sharing

### Frontend
- **React.js**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **React Toastify**: Notifications
- **CSS3**: Styling with custom utility classes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository. 