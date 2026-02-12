-- Clean database setup - Base Super App
-- Run this with: psql base_super_app < setup_clean.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    km_price DECIMAL(10,2),
    base_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    image_url TEXT,
    type VARCHAR(50) DEFAULT 'partner',
    availability VARCHAR(50) DEFAULT 'In Stock',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip VARCHAR(20),
    country VARCHAR(100),
    type VARCHAR(50) DEFAULT 'individual',
    status VARCHAR(50) DEFAULT 'active',
    tier VARCHAR(50) DEFAULT 'bronze',
    credit_limit DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    status VARCHAR(50) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    total_amount DECIMAL(12,2) DEFAULT 0,
    deposit_amount DECIMAL(12,2) DEFAULT 0,
    studio_date DATE,
    studio_duration INTEGER DEFAULT 12,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Booking items (equipment line items)
CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id),
    quantity INTEGER DEFAULT 1,
    daily_rate DECIMAL(10,2),
    days INTEGER DEFAULT 1,
    total_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    sender_type VARCHAR(50) NOT NULL, -- 'user' or 'client'
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: Admin123!)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'admin@basecreative.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash
    'Admin',
    'User',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Insert sample equipment (first 20 items from CSV)
INSERT INTO equipment (sku, name, category, description, km_price, base_price, selling_price, quantity, image_url, type, availability) VALUES
('125791292242', 'Aputure 1000C Storm Blair Monolight', 'Lighting', 'Full color RGBWW monolight', 350, 875, 350, 2, 'https://kmrentaleq.com/images/P/1732017718_IMG_2374054.jpg', 'partner', 'In Stock'),
('610630572577', 'A Clamp - Large', 'Grip & Support', 'Heavy duty A clamp for lighting and grip', 1.5, 3.75, 4, 15, 'https://kmrentaleq.com/images/P/VD1428-1-02.JPG', 'partner', 'In Stock'),
('920317392733', 'ALM Action Cart - Table Top Dolly', 'Grip & Support', 'Compact table top dolly for smooth camera moves', 15, 37.5, 15, 2, 'https://kmrentaleq.com/images/P/VD1000-1.jpg', 'partner', 'In Stock'),
('165622020710', 'A Clamp Medium', 'Grip & Support', 'Medium duty A clamp', 1, 2.5, 4, 15, 'https://kmrentaleq.com/images/P/VD1428-1-01.JPG', 'partner', 'In Stock'),
('499169272895', 'A Clamp Small', 'Grip & Support', 'Small A clamp', 1, 2.5, 4, 7, 'https://kmrentaleq.com/images/P/VD1428-1.JPG', 'partner', 'In Stock')
ON CONFLICT (sku) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_sku ON equipment(sku);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_chat_booking ON chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);
