#!/bin/sh

echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h postgres -p 5432 -U inventory_user; do
  sleep 1
done

echo "PostgreSQL is ready!"

echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing Prisma schema to database..."
npx prisma db push

echo "Seeding database..."
npm run db:seed

echo "Starting backend server..."
npm run dev:api
