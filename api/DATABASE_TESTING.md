# Database Migration Testing Guide

This guide shows how to test the database migration setup with a local PostgreSQL instance.

## Prerequisites

1. PostgreSQL installed locally
2. Database created for the BFR application

## Setup Steps

### 1. Install PostgreSQL (if not already installed)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE bfr_db;
CREATE USER bfr_user WITH PASSWORD 'bfr_password';
GRANT ALL PRIVILEGES ON DATABASE bfr_db TO bfr_user;
\q
```

### 3. Configure Environment

```bash
# Copy the environment template
cp .env.example .env

# Edit .env file and set DATABASE_URL:
DATABASE_URL="postgresql://bfr_user:bfr_password@localhost:5432/bfr_db"
```

### 4. Run Migration

```bash
# Generate Prisma client
npm run db:generate

# Run the migration
npm run db:migrate
```

### 5. Verify Tables Created

```bash
# Connect to the database
psql -U bfr_user -d bfr_db -h localhost

# List all tables
\dt

# Should show:
#  Schema |         Name          | Type  |  Owner
# --------+-----------------------+-------+----------
#  public | audit_log             | table | bfr_user
#  public | password_reset_tokens | table | bfr_user
#  public | user_progress         | table | bfr_user
#  public | users                 | table | bfr_user

# Check schema of users table
\d users

# Exit
\q
```

## Expected Migration Output

When you run `npm run db:migrate`, you should see:
- Creation of `users` table with authentication fields
- Creation of `user_progress` table with JSONB progress data
- Creation of `password_reset_tokens` table for password resets
- Creation of `audit_log` table for security logging
- Proper indexes and foreign key constraints

## Troubleshooting

**Connection Error:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL format in .env file
- Ensure database and user exist with proper permissions

**Migration Error:**
- Check if UUID extension is available: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Verify user has CREATE privileges on the database

## Using Prisma Studio

To explore the database with a GUI:
```bash
npm run db:studio
```

This opens a web interface at http://localhost:5555 to view and edit data.