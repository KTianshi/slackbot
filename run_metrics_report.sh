#!/bin/bash

# Change to the directory containing the script
cd "$(dirname "$0")"

# Add timestamp to log
echo "=== $(date) ===" >> metrics_report.log

# Run the Node.js script and log output
/usr/local/bin/node slack_bot.js >> metrics_report.log 2>&1

# Add separator to log
echo "----------------------------------------" >> metrics_report.log 