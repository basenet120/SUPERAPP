# Base Super App

A comprehensive production equipment rental platform with QuickBooks integration, booking management, inventory tracking, and real-time chat.

## Features

### Core Infrastructure
- ✅ PostgreSQL database with comprehensive schema
- ✅ Role-based access control (RBAC)
- ✅ JWT authentication with refresh tokens
- ✅ Multi-tier user system (Admin, Manager, Employee, Member, Client)
- ✅ Audit logging for all sensitive operations
- ✅ AES-256 encryption for sensitive data

### Equipment Management
- ✅ Equipment catalog with categories
- ✅ Vendor management (in-house vs partner)
- ✅ Automatic pricing with partner markup (2.5x)
- ✅ Availability tracking and conflict detection
- ✅ Bulk CSV import for equipment
- ✅ Image management

### Booking System
- ✅ Multi-stage booking workflow
- ✅ Quote generation and approval
- ✅ COI (Certificate of Insurance) tracking
- ✅ Payment tracking and balance management
- ✅ Equipment reservation and conflict detection

### QuickBooks Integration
- ✅ OAuth 2.0 authentication
- ✅ Customer sync (bidirectional)
- ✅ Invoice creation
- ✅ Payment sync
- ✅ Webhook support for real-time updates

### Communication
- ✅ Automated email reminders
  - COI reminders (24hrs after quote)
  - Payment reminders (48hrs before due)
  - Pre-shoot reminders (24hrs before)
  - Post-shoot follow-ups (24hrs after)
- ✅ Real-time chat system (WebSockets)
  - Channels and direct messages
  - File sharing
  - Reactions and mentions
  - Message threading

### Additional Features
- ✅ Time tracking
- ✅ Expense management
- ✅ Document management
- ✅ Project management
- ✅ Calendar integration ready

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL (with Knex.js ORM)
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT, bcrypt
- **Email**: SendGrid (primary), AWS SES (fallback)
- **SMS**: Twilio
- **File Storage**: Cloudinary
- **Containerization**: Docker, Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)
- Redis 7+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd base-super-app
```

2. Copy environment variables:
```bash
cp backend/.env.example backend/.env
```

3. Update the `.env` file with your configuration

4. Start the services:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
docker-compose exec api npm run migrate
```

6. Seed the database:
```bash
docker-compose exec api npm run seed
```

7. Access the application:
- API: http://localhost:5000
- Frontend: http://localhost:3000

### Local Development

1. Install dependencies:
```bash
cd backend
npm install

cd ../frontend
npm install
```

2. Set up PostgreSQL and Redis locally

3. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. Run migrations:
```bash
cd backend
npm run migrate
npm run seed
```

5. Start the backend:
```bash
npm run dev
```

6. Start the frontend (in a new terminal):
```bash
cd frontend
npm start
```

## API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Equipment

#### List Equipment
```http
GET /api/equipment?page=1&limit=20&search=camera&categoryId=xxx
Authorization: Bearer <token>
```

#### Create Equipment
```http
POST /api/equipment
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sony FX6",
  "sku": "CAM-SONY-FX6",
  "categoryId": "xxx",
  "dailyRate": 350,
  "weeklyRate": 1050,
  "monthlyRate": 3150
}
```

#### Check Availability
```http
GET /api/equipment/:id/availability?startDate=2024-01-01&endDate=2024-01-05
Authorization: Bearer <token>
```

### Bookings

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "xxx",
  "pickupDatetime": "2024-01-15T09:00:00Z",
  "returnDatetime": "2024-01-18T18:00:00Z",
  "items": [
    {
      "equipmentId": "xxx",
      "quantity": 1,
      "unitPrice": 350,
      "totalPrice": 1050,
      "rentalDays": 3
    }
  ]
}
```

#### Update Status
```http
PATCH /api/bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "reason": "Deposit received"
}
```

## Environment Variables

### Required
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `REDIS_URL` - Redis connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - JWT signing keys
- `ENCRYPTION_KEY` - AES-256 encryption key

### Optional (Features)
- `QB_CLIENT_ID`, `QB_CLIENT_SECRET` - QuickBooks OAuth
- `SENDGRID_API_KEY` - SendGrid email
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - Twilio SMS
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` - Image storage

## Default Users

After seeding, the following users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@basecreative.com | Admin123! | Administrator |
| employee@basecreative.com | Employee123! | Employee |
| client@example.com | Client123! | Client |

## Database Migrations

Create a new migration:
```bash
npx knex migrate:make migration_name
```

Run migrations:
```bash
npm run migrate
```

Rollback:
```bash
npm run migrate:rollback
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Deployment

### Production Checklist

1. Update environment variables for production
2. Enable TLS 1.3
3. Configure proper CORS origins
4. Set up monitoring and logging
5. Configure backup schedules
6. Enable rate limiting
7. Set up health checks

### Docker Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@basecreative.com or open an issue on GitHub.
