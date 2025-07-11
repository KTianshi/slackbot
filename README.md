# Paradigm Metrics Reporter

A Node.js bot that tracks metrics from Statsig and reports them to Slack with daily and weekly reports.

## Features

- **Daily Reports** (every day except Friday)
  - User metrics: New Accounts, Completed Onboarding, New Paying Users, New Successful Users
  - Sheet metrics: Sheets Created, Templates Opened, Sheet Edits, Sheets Shared, Cells Enriched, Enrich Clicked
  - Shows daily values and percentage changes

- **Weekly Reports** (Fridays only)
  - Aggregates data for the past week (Monday-Sunday)
  - Compares with previous week's totals
  - Shows percentage changes week-over-week

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file with:
   ```
   SLACK_BOT_TOKEN=your_slack_bot_token
   SLACK_CHANNEL_ID=your_channel_id
   STATSIG_API_KEY=your_statsig_api_key
   ```

3. **Cron Job Setup**
   ```bash
   # Add to crontab
   crontab -e
   
   # Add this line for daily execution at 8 AM
   0 8 * * * /path/to/your/slackbot/run_metrics_report.sh
   ```

## Manual Testing

```bash
node slack_bot.js
```

## Metrics Tracked

- **User Metrics**: New accounts, onboarding completion, paying users, successful users
- **Sheet Metrics**: Creation, sharing, editing, template usage, cell enrichment

## Error Handling

- Graceful handling of API failures
- Automatic fallback to zero values for missing data
- Detailed error logging 