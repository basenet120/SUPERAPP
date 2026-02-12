# Base Super App - API Documentation

## Overview

The Base Super App API is a RESTful API that allows you to integrate with the platform programmatically. All API requests should be made to the base URL with the appropriate endpoint.

**Base URL:** `https://api.baseapp.com/v1`

**Authentication:** Bearer token (JWT)

## Authentication

### Obtaining an API Key

1. Log in to your Base account
2. Go to Settings → API
3. Generate a new API key
4. Store the key securely

### Using the API Key

Include your API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

### Token Expiration

API keys expire after 90 days. You'll receive email notifications before expiration.

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:

| Plan | Requests per Minute | Requests per Hour |
|------|--------------------:|------------------:|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Enterprise | 1,000 | 50,000 |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1645000000
```

---

## Common Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2026-02-12T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Email is required"
    }
  },
  "meta": {
    "timestamp": "2026-02-12T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `RATE_LIMITED` | Too many requests |
| `CONFLICT` | Resource conflict |
| `INTERNAL_ERROR` | Server error |

---

## Endpoints

### Authentication

#### POST /auth/login

Authenticate and receive access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/refresh

Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

---

### Equipment

#### GET /equipment

List all equipment with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `status` (string): Filter by status
- `search` (string): Search by name
- `available` (boolean): Show only available items
- `locationId` (string): Filter by location

**Response:**
```json
{
  "success": true,
  "data": {
    "equipment": [
      {
        "id": "eq_123",
        "name": "Sony A7IV",
        "category": "Camera",
        "dailyRate": 150.00,
        "status": "available",
        "location": {
          "id": "loc_1",
          "name": "Main Warehouse"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### GET /equipment/{id}

Get detailed information about a specific equipment item.

#### POST /equipment

Create new equipment.

**Request:**
```json
{
  "name": "Canon C70",
  "category": "Camera",
  "dailyRate": 200.00,
  "weeklyRate": 1200.00,
  "monthlyRate": 4000.00,
  "serialNumber": "ABC123456",
  "description": "Cinema camera with RF mount"
}
```

#### PUT /equipment/{id}

Update equipment information.

#### DELETE /equipment/{id}

Delete or deactivate equipment.

#### GET /equipment/{id}/availability

Check equipment availability for date range.

**Query Parameters:**
- `startDate` (ISO 8601): Start date
- `endDate` (ISO 8601): End date

---

### Bookings

#### GET /bookings

List all bookings.

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `status` (string): pending, confirmed, out, returned, completed, cancelled
- `clientId` (string)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

#### POST /bookings

Create a new booking.

**Request:**
```json
{
  "clientId": "cli_123",
  "equipmentIds": ["eq_123", "eq_456"],
  "startDate": "2026-03-01T09:00:00Z",
  "endDate": "2026-03-05T18:00:00Z",
  "notes": "Production shoot in downtown",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001"
  }
}
```

#### GET /bookings/{id}

Get booking details.

#### PUT /bookings/{id}

Update booking information.

#### PUT /bookings/{id}/confirm

Confirm a pending booking.

#### PUT /bookings/{id}/cancel

Cancel a booking.

**Request:**
```json
{
  "reason": "Client requested cancellation",
  "refundPolicy": "full"
}
```

#### GET /bookings/calendar

Get bookings formatted for calendar display.

---

### Clients

#### GET /clients

List all clients.

**Query Parameters:**
- `search` (string): Search by name or email
- `type` (string): Filter by client type
- `status` (string): active, inactive

#### POST /clients

Create new client.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@productions.com",
  "phone": "+1 555-123-4567",
  "company": "Smith Productions",
  "type": "production_company",
  "address": {
    "street": "456 Film Ave",
    "city": "Hollywood",
    "state": "CA",
    "zip": "90028"
  }
}
```

#### GET /clients/{id}

Get client details including booking history.

#### PUT /clients/{id}

Update client information.

#### GET /clients/{id}/bookings

Get all bookings for a client.

---

### Inventory

#### GET /inventory/alerts

Get inventory alerts and low stock warnings.

#### POST /inventory/alerts

Create inventory alert rule.

#### GET /inventory/availability

Check availability for multiple items.

**Request:**
```json
{
  "equipmentIds": ["eq_123", "eq_456"],
  "startDate": "2026-03-01T09:00:00Z",
  "endDate": "2026-03-05T18:00:00Z"
}
```

---

### Team

#### GET /team/members

List all team members.

#### POST /team/members

Invite new team member.

**Request:**
```json
{
  "email": "newmember@company.com",
  "firstName": "Alex",
  "lastName": "Johnson",
  "role": "technician",
  "permissions": ["view_bookings", "manage_equipment"]
}
```

#### PUT /team/members/{id}

Update team member.

#### DELETE /team/members/{id}

Remove team member.

---

### Search

#### GET /search

Global search across all entities.

**Query Parameters:**
- `q` (string): Search query
- `type` (string): Filter by type (equipment, client, booking, document)
- `limit` (number): Max results

#### GET /search/equipment

Search equipment specifically.

---

### Documents

#### GET /documents

List documents.

#### POST /documents

Upload document.

#### GET /documents/{id}/download

Download document.

---

### Notifications

#### GET /notifications

Get user notifications.

#### PUT /notifications/{id}/read

Mark notification as read.

#### PUT /notifications/mark-all-read

Mark all notifications as read.

---

## Webhooks

Subscribe to real-time events via webhooks.

### Configuring Webhooks

1. Go to Settings → API → Webhooks
2. Add endpoint URL
3. Select events to subscribe to
4. Save and verify

### Events

| Event | Description |
|-------|-------------|
| `booking.created` | New booking created |
| `booking.confirmed` | Booking confirmed |
| `booking.cancelled` | Booking cancelled |
| `booking.checked_out` | Equipment checked out |
| `booking.checked_in` | Equipment checked in |
| `client.created` | New client added |
| `payment.received` | Payment received |
| `equipment.maintenance_due` | Maintenance reminder |

### Webhook Payload

```json
{
  "event": "booking.confirmed",
  "timestamp": "2026-02-12T10:00:00Z",
  "data": {
    "bookingId": "bk_123",
    "clientId": "cli_456",
    "equipmentIds": ["eq_789"],
    "startDate": "2026-03-01T09:00:00Z",
    "endDate": "2026-03-05T18:00:00Z",
    "total": 750.00
  }
}
```

---

## SDKs & Libraries

### Official SDKs

- **JavaScript/Node.js:** `npm install @baseapp/sdk`
- **Python:** `pip install baseapp`
- **PHP:** `composer require baseapp/sdk`

### Example: JavaScript

```javascript
import { BaseApp } from '@baseapp/sdk';

const client = new BaseApp({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Get equipment
const equipment = await client.equipment.list({
  category: 'Camera',
  status: 'available'
});

// Create booking
const booking = await client.bookings.create({
  clientId: 'cli_123',
  equipmentIds: ['eq_456'],
  startDate: '2026-03-01',
  endDate: '2026-03-05'
});
```

---

## Changelog

### v1.0.0 (2026-02-12)

- Initial API release
- Equipment management
- Booking system
- Client management
- Team management
- Webhook support

---

## Support

- **API Documentation:** https://docs.baseapp.com/api
- **Support Email:** api-support@baseapp.com
- **Status Page:** https://status.baseapp.com

---

*Documentation version: 1.0.0*
*Last updated: February 12, 2026*
