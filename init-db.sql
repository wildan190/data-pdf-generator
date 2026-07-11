-- Initial database setup
-- This file is used by Docker to initialize the PostgreSQL database

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The tables will be created by Prisma migrations
-- This file is mainly for initial setup and extensions