# Mara Backend API

A robust Node.js backend API built with Express.js and MongoDB for the Mara project.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user CRUD operations
- **File Upload**: Secure file upload with validation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Testing**: Jest test suite with MongoDB Memory Server
- **Error Handling**: Centralized error handling middleware
- **Logging**: Morgan HTTP request logger

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Security**: Helmet, bcryptjs, express-rate-limit

## Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management
│   │   └── uploadController.js  # File upload handling
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   ├── errorHandler.js     # Global error handler
│   │   └── notFound.js         # 404 handler
│   ├── models/
│   │   └── User.js             # User schema
│   ├── routes/
│   │   ├── auth.js             # Auth routes
│   │   ├── users.js            # User routes
│   │   └── upload.js           # Upload routes
│   └── utils/
│       ├── email.js            # Email utilities
│       └── validation.js       # Input validation schemas
├── tests/
│   ├── auth.test.js            # Authentication tests
│   └── setup.js                # Test configuration
├── .env                        # Environment variables
├── server.js                   # Main server file
├── package.json                # Dependencies
└── jest.config.js              # Test configuration
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Copy the `.env` file and configure your environment variables:
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/ReplyRushh
   DB_NAME=ReplyRushh

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d

   # CORS Configuration
   CORS_ORIGIN=  https://5ece8457d962.ngrok-free.appp

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PUT /api/users/profile` - Update own profile (Protected)

### File Upload
- `POST /api/upload/single` - Upload single file (Protected)
- `POST /api/upload/multiple` - Upload multiple files (Protected)
- `DELETE /api/upload/:filename` - Delete file (Protected)

### Health Check
- `GET /health` - Server health status

## Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with configurable limits
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Joi schemas for request validation
- **File Upload Security**: File type and size validation

## Error Handling

The API uses centralized error handling with:
- Custom error responses
- Mongoose error handling
- JWT error handling
- Validation error formatting
- Development vs production error details

## Development

### Adding New Routes

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Add route to `server.js`
4. Add validation schema in `src/utils/validation.js`
5. Write tests in `tests/`

### Environment Variables

All configuration is handled through environment variables. See `.env` file for all available options.

## Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure email settings
5. Set appropriate CORS origins
6. Deploy to your preferred platform

## Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request

## License

MIT License
