#!/bin/bash
# Quick script to add yourself as a super user

echo "🔐 Adding yourself as a super user..."
echo ""
echo "Enter your email address:"
read EMAIL

if [ -z "$EMAIL" ]; then
    echo "❌ Email cannot be empty"
    exit 1
fi

npm run super-user:add "$EMAIL" "Owner/Admin"
