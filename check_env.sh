#!/bin/bash
echo "--- Environment Check ---" > /home/monster13liar/SPLIT-PAY/diag.log
echo "User: $(whoami)" >> /home/monster13liar/SPLIT-PAY/diag.log
echo "Current Dir: $(pwd)" >> /home/monster13liar/SPLIT-PAY/diag.log
echo "--- Permissions ---" >> /home/monster13liar/SPLIT-PAY/diag.log
ls -la . >> /home/monster13liar/SPLIT-PAY/diag.log
ls -la frontend/ >> /home/monster13liar/SPLIT-PAY/diag.log
echo "--- Process Status ---" >> /home/monster13liar/SPLIT-PAY/diag.log
ps aux | grep -E "python|node|npm" | grep -v grep >> /home/monster13liar/SPLIT-PAY/diag.log
echo "--- Network Status ---" >> /home/monster13liar/SPLIT-PAY/diag.log
ss -nlpt | grep -E "8000|3000" >> /home/monster13liar/SPLIT-PAY/diag.log
echo "--- End Check ---" >> /home/monster13liar/SPLIT-PAY/diag.log
