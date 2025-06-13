# Paradigm Metrics Reporter

A Node.js bot that tracks various metrics from Statsig and reports them to Slack, providing both daily and weekly reports.

## Features

- **Daily Reports** (8 AM daily)
  - Tracks multiple metrics:
    - Templates Opened
    - Sheets Created
    - Rows Added
    - Columns Added
    - Columns Renamed
    - Column Types Updated
  - Shows daily values and percentage changes
  - Formatted in an easy-to-read table

- **Weekly Reports** (Thursday 8 AM)
  - Aggregates data for the past week
  - Compares with previous week's totals
  - Shows percentage changes week-over-week

## Prerequisites

- Node.js
- A Slack workspace with bot permissions
- A Statsig Console API key

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configuration**
   The bot uses the following configuration in `slack_bot.js`:
   - Slack Bot Token
   - Slack User ID
   - Statsig Console API Key
   - Event tracking configuration

3. **Cron Job Setup**
   The bot is configured to run via cron:
   ```bash
   # View current cron schedule
   crontab -l

   # Edit cron schedule
   crontab -e
   ```
   
   Current schedule:
   - Daily reports: 8 AM every day
   - Weekly reports: 8 AM every Thursday

## Manual Testing

To run the bot manually:
```bash
./run_metrics_report.sh
```

## Logging

- All output is logged to `metrics_report.log`
- Includes timestamps and error information
- Logs are appended for each run

## Customization

- Add new metrics in the `CONFIG.events` object
- Adjust report formatting in the `formatMetricsTable` and `formatWeeklyMetricsTable` functions
- Modify the schedule in the crontab file

## Error Handling

The bot includes error handling for:
- Failed Slack message delivery
- Statsig API errors
- Date calculation issues
- Missing or invalid data

## File Structure

- `slack_bot.js`: Main bot code
- `run_metrics_report.sh`: Shell script to run the bot
- `metrics_crontab`: Cron job configuration
- `metrics_report.log`: Log file 