# Base Super App - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Equipment Management](#equipment-management)
4. [Bookings & Scheduling](#bookings--scheduling)
5. [Client Management](#client-management)
6. [Team Management](#team-management)
7. [Billing & Invoicing](#billing--invoicing)
8. [Reports & Analytics](#reports--analytics)
9. [Settings & Configuration](#settings--configuration)
10. [Integrations](#integrations)
11. [Mobile App](#mobile-app)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Creating Your Account

1. Visit [app.baseapp.com](https://app.baseapp.com)
2. Click "Sign Up" and enter your email
3. Verify your email address
4. Complete the onboarding wizard

### System Requirements

- **Web:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS 14+ or Android 10+
- **Internet:** Stable connection (1 Mbps minimum)

---

## Dashboard Overview

The dashboard provides a quick overview of your business:

### Key Metrics
- **Today's Bookings:** Active pickups and returns
- **Pending Confirmations:** Bookings awaiting approval
- **Revenue:** Today's and this month's earnings
- **Equipment Status:** Availability at a glance

### Quick Actions
- Create new booking
- Add equipment
- View calendar
- Check notifications

### Calendar View
Switch between day, week, and month views to see your schedule. Color-coded events show:
- 🟦 Pickups
- 🟥 Returns
- 🟨 Pending confirmations

---

## Equipment Management

### Adding Equipment

1. Navigate to **Equipment** → **Add New**
2. Enter required information:
   - Name and description
   - Category and subcategory
   - Pricing (daily, weekly, monthly)
3. Add optional details:
   - Serial number
   - Barcode
   - Purchase information
   - Replacement value
4. Upload photos
5. Set initial status

### Equipment Categories

Organize equipment with categories:
- Cameras
- Lenses
- Lighting
- Audio
- Grip
- Drones
- Accessories

Create custom categories in **Settings** → **Equipment**.

### Bulk Import

Import multiple items via CSV:

1. Download the [CSV template](/templates/equipment-import.csv)
2. Fill in your equipment data
3. Go to **Equipment** → **Import**
4. Upload your CSV file
5. Map columns and validate
6. Complete import

### Barcode Scanning

Enable barcode scanning for faster checkouts:

1. Install the Base mobile app
2. Connect a Bluetooth scanner or use camera
3. Scan equipment barcodes during checkout/checkin

---

## Bookings & Scheduling

### Creating a Booking

1. Click **New Booking** or use the calendar
2. Select or create a client
3. Add equipment items
4. Set dates and times
5. Review pricing
6. Add notes and special instructions
7. Confirm or save as quote

### Booking Status Flow

```
Quote → Pending → Confirmed → Out → Returned → Completed
         ↓           ↓          ↓          ↓
       Cancelled  Cancelled  Cancelled  Cancelled
```

### Conflict Detection

The system automatically checks for:
- Equipment availability
- Client double-booking
- Team member conflicts

### Recurring Bookings

Create repeating bookings for regular clients:

1. Create a new booking
2. Enable "Recurring"
3. Set frequency (daily, weekly, monthly)
4. Set end date or number of occurrences

---

## Client Management

### Adding Clients

1. Go to **Clients** → **Add New**
2. Enter contact information
3. Set client type:
   - Production Company
   - Individual
   - Corporate
   - Student
4. Add billing preferences
5. Upload COI if required

### Certificate of Insurance (COI)

Track client insurance:

1. Upload COI document
2. Set expiration date
3. Get automatic reminders
4. View COI status on bookings

### Client Portal

Enable self-service for clients:

1. Send portal invitation
2. Client can view:
   - Booking history
   - Upcoming reservations
   - Invoices
   - Account balance

---

## Team Management

### Inviting Team Members

1. Go to **Settings** → **Team**
2. Click **Invite Member**
3. Enter email address
4. Select role:
   - **Admin:** Full access
   - **Manager:** Can manage bookings and equipment
   - **Technician:** Can view and update status
   - **Viewer:** Read-only access

### Permissions

Fine-grained access control:
- View equipment
- Manage equipment
- Create bookings
- Manage bookings
- View clients
- Manage clients
- View reports
- Manage settings

### Activity Tracking

Monitor team actions:
- Login history
- Booking modifications
- Equipment status changes
- Data exports

---

## Billing & Invoicing

### QuickBooks Integration

Sync with QuickBooks Online:

1. Go to **Settings** → **Integrations**
2. Click **Connect QuickBooks**
3. Authorize the connection
4. Map your accounts
5. Enable auto-sync

### Creating Invoices

1. Open a completed booking
2. Click **Generate Invoice**
3. Review line items
4. Add discounts or adjustments
5. Send to client

### Payment Processing

Accept payments via:
- Credit card (Stripe)
- ACH transfer
- Check (manual entry)
- Cash (manual entry)

### Taxes

Configure tax rates:

1. **Settings** → **Billing** → **Taxes**
2. Add tax jurisdictions
3. Set default tax rate
4. Apply per-item or per-invoice

---

## Reports & Analytics

### Available Reports

- **Revenue Report:** Income by period
- **Utilization:** Equipment usage rates
- **Client Activity:** Booking frequency
- **Popular Items:** Most rented equipment
- **Maintenance:** Upcoming and overdue

### Custom Reports

Build your own reports:

1. Go to **Reports** → **Custom**
2. Select data sources
3. Add filters
4. Choose visualizations
5. Save and schedule

### Exporting Data

Export reports to:
- PDF
- Excel (XLSX)
- CSV
- Google Sheets

---

## Settings & Configuration

### Company Settings

Configure your business profile:
- Company name and logo
- Contact information
- Business hours
- Default locations

### Notification Preferences

Control what you receive:
- Email notifications
- Push notifications
- In-app alerts
- Daily digests

### Booking Settings

Customize booking behavior:
- Default rental duration
- Buffer times between bookings
- Cancellation policy
- Deposit requirements

---

## Integrations

### Available Integrations

- **QuickBooks:** Accounting sync
- **Stripe:** Payment processing
- **Google Calendar:** Schedule sync
- **Slack:** Team notifications
- **Zapier:** Workflow automation

### API Access

Build custom integrations:

1. Go to **Settings** → **API**
2. Generate API key
3. Read [API Documentation](/api-docs)
4. Start building

---

## Mobile App

### Download

- [iOS App Store](https://apps.apple.com/base)
- [Google Play](https://play.google.com/store/apps/base)

### Features

- View schedule and bookings
- Check equipment availability
- Scan barcodes
- Receive push notifications
- Update booking status
- Take equipment photos

---

## Troubleshooting

### Common Issues

**Can't log in:**
- Check email/password
- Clear browser cache
- Try password reset

**Booking conflicts not detected:**
- Check equipment status
- Verify date/time settings
- Contact support

**QuickBooks sync failing:**
- Reauthorize connection
- Check account mapping
- Review error logs

### Getting Help

- **Help Center:** [help.baseapp.com](https://help.baseapp.com)
- **Email:** support@baseapp.com
- **Phone:** 1-800-BASE-APP
- **Chat:** In-app chat (business hours)

### System Status

Check service status at [status.baseapp.com](https://status.baseapp.com)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New booking |
| `Ctrl/Cmd + E` | New equipment |
| `Ctrl/Cmd + F` | Search |
| `Ctrl/Cmd + K` | Quick actions |
| `Esc` | Close modal |
| `?` | Show shortcuts |

---

*Last updated: February 2026*
*Version: 1.0.0*
