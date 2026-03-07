#!/bin/bash
export USE_SQLITE=True
cd backend
./venv/bin/python manage.py migrate
./venv/bin/python manage.py runserver 0.0.0.0:8001 > backend.log 2>&1 &
echo "Backend started on port 8001"

cd ../frontend
rm -rf .next
npm run dev -- -p 3000 > frontend.log 2>&1 &
echo "Frontend started on port 3000"
