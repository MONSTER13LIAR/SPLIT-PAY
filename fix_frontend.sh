#!/bin/bash
cd /home/monster13liar/SPLIT-PAY
echo "--- Starting Frontend Fix ---" > /home/monster13liar/SPLIT-PAY/frontend_fix.log
rm -f package-lock.json
cd frontend
rm -rf .next
echo "Starting dev server..." >> /home/monster13liar/SPLIT-PAY/frontend_fix.log
nohup npm run dev -- -p 3000 > frontend_dev_v2.log 2>&1 &
echo "Frontend PID: $!" >> /home/monster13liar/SPLIT-PAY/frontend_fix.log
sleep 5
echo "--- Check Logs ---" >> /home/monster13liar/SPLIT-PAY/frontend_fix.log
tail -n 20 frontend_dev_v2.log >> /home/monster13liar/SPLIT-PAY/frontend_fix.log
