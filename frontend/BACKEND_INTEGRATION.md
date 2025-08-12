# Backend Integration Guide

## Overview
This document outlines the integration between the frontend React/Next.js application and the Django REST Framework backend API.

## API Base Configuration
- **Base URL**: `http://localhost:8000/api/v1`
- **Authentication**: Basic Auth
- **Content Type**: `application/json`
- **Response Format**: All endpoints return paginated responses with `count`, `next`, `previous`, and `results`

## Key Schema Alignments Made

### 1. **Payment Schema Updates**
- ✅ Added `bill_amount` field (total bill amount for payment)
- ✅ Added `entry_by` field (UserLite object for payment entry user)
- ✅ Added `customer_id` as required field for PaymentList
- ✅ Maintained all existing fields: `amount`, `billing_month`, `payment_method`, etc.

### 2. **User Schema Enhancements**
- ✅ Added `UserLite` interface for simplified user objects
- ✅ Added `UserList` interface with `kind` and `gender` fields
- ✅ Added `UserDetail` interface with `status` and `is_staff` fields
- ✅ Added `UserRegistration` interface for user registration
- ✅ Updated `Me` interface to match backend schema

### 3. **Customer Schema Improvements**
- ✅ Updated `CustomerDetail` to use `UserList` instead of inline user object
- ✅ Maintained all existing fields: `package`, `connection_type`, `credentials`, etc.

### 4. **API Service Enhancements**
- ✅ Added complete `userService` with all CRUD operations
- ✅ Added `generateBills` endpoint for customer bill generation
- ✅ Maintained all existing service methods
- ✅ Added proper TypeScript types for all API responses

## API Endpoints Mapping

### Authentication
- `POST /users/login` - User login
- `POST /users/login/refresh` - Token refresh
- `GET /users/me` - Get current user
- `PUT /users/me` - Update current user

### Users
- `GET /users` - List users (paginated)
- `POST /users` - Create user
- `GET /users/{uid}` - Get user details
- `PUT /users/{uid}` - Update user
- `DELETE /users/{uid}` - Delete user
- `POST /users/register` - User registration

### Customers
- `GET /customers` - List customers (paginated)
- `POST /customers` - Create customer
- `GET /customers/{uid}` - Get customer details
- `PUT /customers/{uid}` - Update customer
- `DELETE /customers/{uid}` - Delete customer
- `GET /customers/{uid}/payments` - Get customer payments
- `POST /customers/{uid}/payments` - Create customer payment
- `POST /customers/bills/generate` - Generate bills

### Packages
- `GET /packages` - List packages (paginated)
- `POST /packages` - Create package
- `GET /packages/{uid}` - Get package details
- `PUT /packages/{uid}` - Update package
- `DELETE /packages/{uid}` - Delete package
- `GET /packages/{uid}/customers` - Get package customers

### Payments
- `GET /payments` - List payments (paginated)
- `POST /payments` - Create payment
- `GET /payments/{uid}` - Get payment details
- `PUT /payments/{uid}` - Update payment
- `DELETE /payments/{uid}` - Delete payment

## Type Safety Improvements

### 1. **Strict Typing**
- All API responses are properly typed
- Union types for enums (billing months, payment methods, user roles)
- Optional fields properly marked with `?`

### 2. **Interface Hierarchy**
- `CustomerBase` → `CustomerList` → `CustomerDetail`
- `PackageBase` → `PackageList` → `PackageDetail`
- `PaymentBase` → `PaymentList` → `PaymentDetail`
- `UserLite` → `UserList` → `UserDetail`

### 3. **Enum Types**
```typescript
// Billing Months
'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 
'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER'

// Payment Methods
'BANK_TRANSFER' | 'BKASH' | 'CASH' | 'NAGAD' | 'MOBILE_BANKING' | 
'ONLINE_PAYMENT' | 'ROCKET' | 'OTHER'

// User Roles
'ADMIN' | 'CUSTOMER' | 'MANAGER' | 'STAFF' | 'SUPER_ADMIN' | 'OTHER'

// Connection Types
'DHCP' | 'STATIC' | 'PPPoE'

// Gender
'FEMALE' | 'MALE' | 'UNKNOWN'

// User Status
'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'REMOVED'
```

## Frontend-Backend Compatibility

### ✅ **Fully Compatible Fields**
- All basic CRUD operations
- Pagination support
- Authentication flows
- User management
- Customer management
- Package management
- Payment management

### 🔄 **Enhanced Features**
- Bill generation endpoint
- User registration
- Profile management
- Role-based permissions
- Payment entry tracking

### 📝 **Notes for Development**
1. All API calls use the correct base URL and authentication
2. Pagination is handled consistently across all endpoints
3. Error handling follows REST conventions
4. Type safety ensures compile-time error detection
5. All enum values match backend exactly

## Usage Examples

### Creating a Payment
```typescript
const paymentData = {
  customer_id: 123,
  amount: "50.00",
  billing_month: "JANUARY",
  payment_method: "BKASH",
  paid: true,
  transaction_id: "TXN123456",
  note: "Monthly payment"
};

const payment = await paymentService.createPayment(paymentData);
```

### Getting Customer with Payments
```typescript
const customer = await customerService.getCustomer("customer-uid");
const payments = await customerService.getCustomerPayments("customer-uid", 1, 10);
```

### User Registration
```typescript
const userData = {
  first_name: "John",
  last_name: "Doe",
  phone: "+1234567890",
  email: "john@example.com",
  password: "securepassword",
  confirm_password: "securepassword"
};

const user = await userService.register(userData);
```

This integration ensures full compatibility between your frontend and backend while maintaining type safety and following REST API best practices. 