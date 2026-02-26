#!/bin/bash
#
# Setup E2E Test Environment
#
# This script:
# 1. Checks for required environment variables
# 2. Seeds test users in Supabase
# 3. Runs E2E tests
#

set -e

echo "========================================="
echo "ChoreChamp E2E Test Setup"
echo "========================================="

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "ERROR: NEXT_PUBLIC_SUPABASE_URL is not set"
    echo "Please set it in .env.local"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
    echo "Please set it in .env.local"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "WARNING: SUPABASE_SERVICE_ROLE_KEY is not set"
    echo ""
    echo "To seed test users, you need the service role key."
    echo "Find it in Supabase Dashboard > Settings > API > service_role"
    echo ""
    echo "Add it to .env.local:"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    echo "Tests will create users dynamically if seeding is not available."
fi

# Seed test users if service role key is available
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo ""
    echo "Seeding test users..."
    npm run test:seed-users || echo "Warning: User seeding failed, tests will create users dynamically"
fi

echo ""
echo "========================================="
echo "E2E Test Environment Ready"
echo "========================================="
echo ""
echo "Test Users:"
echo "  parent@test.com / Test1234!"
echo "  child@test.com / Test1234!"
echo "  partner@test.com / Test1234!"
echo "  solo@test.com / Test1234!"
echo ""
echo "Run tests with:"
echo "  npm run test           # All tests"
echo "  npm run test:e2e       # E2E tests"
echo "  npm run test:journeys  # User journey tests"
echo ""