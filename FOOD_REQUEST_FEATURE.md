# Food Request Feature Documentation

## Overview

This feature enables receivers to request food items and allows admins to assign available donations to fulfill those requests.

## Features Implemented

### 1. Database Schema (`sql/schema.sql`)

Added new table `food_requests`:

- **id**: Primary key
- **receiver_id**: Foreign key to receivers table
- **food_item**: Name of requested food item
- **quantity**: Amount requested (in kg/units)
- **urgency**: Priority level (Low, Medium, High)
- **status**: Request status (Pending, Approved, Rejected, Fulfilled)
- **request_date**: Date of request
- **notes**: Optional additional information
- **assigned_donation_id**: Links to donation when fulfilled
- **created_at**: Timestamp of creation

### 2. Receiver Dashboard Updates (`src/views/receiver/dashboard.ejs`)

#### New Request Form

Receivers can now submit food requests with:

- Food item name
- Quantity needed
- Urgency level (Low/Medium/High)
- Optional notes

#### Request History Table

Shows all past requests with:

- Request date
- Food item and quantity
- Urgency badge (color-coded)
- Status badge (color-coded)
- Notes

#### Available Food at Centers

Display of food currently available for reference

### 3. Receiver Routes (`src/routes/role-receiver.js`)

#### GET `/receiver`

- Fetches available food at centers
- Retrieves receiver's food request history
- Renders dashboard with both datasets

#### POST `/receiver/request`

- Creates new food request
- Validates required fields
- Sets default urgency to "Medium"
- Redirects with success message

### 4. Admin Dashboard Updates (`src/views/admin/dashboard.ejs`)

#### Pending Food Requests Section

- Displays all pending requests from receivers
- Shows receiver name, food item, quantity, urgency
- Sorted by urgency (High → Medium → Low) then by date
- Each request has an "Assign" button

### 5. Admin Routes (`src/routes/role-admin.js`)

#### GET `/admin`

- Added query to fetch pending food requests
- Joins with receivers table to get receiver names
- Orders by urgency and date
- Passes data to dashboard

#### POST `/admin/assign-request/:requestId`

Assigns available donations to receiver requests:

1. Validates request exists and is pending
2. Searches for matching available donation
3. Creates distribution record
4. Updates donation quantity (or marks as Allocated)
5. Marks request as "Fulfilled"
6. Provides feedback to admin

## Workflow

### Receiver Flow:

1. Login to receiver dashboard
2. Fill out food request form
3. Submit request
4. View request status in history table
5. Wait for admin to fulfill request

### Admin Flow:

1. Login to admin dashboard
2. View pending food requests section
3. Click "Assign" button for a request
4. System automatically:
   - Finds matching donation
   - Creates distribution
   - Updates inventory
   - Notifies receiver via status update

## Matching Logic

When admin assigns a request, the system:

- Searches for donations with status "Delivered"
- Matches food item (partial match using LIKE)
- Ensures quantity is sufficient
- Checks expiry date is valid
- Prioritizes items expiring soonest

## Status Colors

### Urgency Badges:

- **High**: Red (danger)
- **Medium**: Yellow (warning)
- **Low**: Blue (info)

### Request Status Badges:

- **Pending**: Yellow (warning)
- **Approved**: Green (success)
- **Fulfilled**: Blue (info)
- **Rejected**: Red (danger)

## Database Migration

Run `npm run db:init` to create the `food_requests` table in existing database.

## Future Enhancements

- Email notifications when request is fulfilled
- SMS alerts for high-urgency requests
- Bulk assignment of multiple requests
- Request approval workflow before fulfillment
- Analytics dashboard for request patterns
- Receiver rating system
- Request expiration/cancellation
- Manual donation selection by admin
