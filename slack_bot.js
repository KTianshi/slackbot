require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const axios = require('axios');

// Validate required environment variables
const requiredEnvVars = ['SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID', 'STATSIG_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

// Configuration
const CONFIG = {
    events: {
        // User metrics
        new_accounts: { id: 'new_accounts::event_count', name: 'New Accounts Created', val: 'No Data' },
        completed_onboarding: { id: 'onboarding_completed::event_count', name: 'Completed Onboarding' },
        new_paying_users: { id: 'new_paying_users::event_count', name: 'New Paying Users', val: 'No Data' },
        new_successful_users: { id: 'new_successful_users::event_count', name: 'New Successful Users', val: 'No Data' },
        // Sheet metrics
        sheet_created: { id: 'sheet_created::event_count', name: 'Sheets Created' },
        template_opened: { id: 'template_opened::event_count', name: 'Templates Opened' },
        sheet_edit: { id: 'sheet_edit::event_count', name: 'Sheet Edits' },
        sheet_shared: { id: 'sheet_shared::event_count', name: 'Sheets Shared' },
        cell_enriched: { id: 'cell_completed::event_count', name: 'Cells Enriched' },
        enrich_clicked: { id: 'cells_requested::event_count', name: 'Enrich Clicked' },
    }
};

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Fetch metrics for a specific date
async function fetchMetrics(date) {
    const metrics = {};
    for (const [eventName, config] of Object.entries(CONFIG.events)) {
        try {
            const response = await axios.get('https://statsigapi.net/console/v1/metrics', {
                headers: { 'STATSIG-API-KEY': process.env.STATSIG_API_KEY },
                params: {
                    id: config.id,
                    date: date.toISOString().split('T')[0]
                }
            });
            

            
            // For all events, use the overall data point
            const dataPoint = response.data?.data?.find(d => d.unit_type === 'overall');
            
            metrics[eventName] = {
                value: dataPoint?.value || 0,
                displayName: config.name
            };
        } catch (error) {
            metrics[eventName] = { value: 0, displayName: config.name };
        }
    }
    return metrics;
}

// Calculate percentage change
function calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? '+∞' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
}

// Format metrics into a table
function formatMetricsTable(yesterdayMetrics, dayBeforeMetrics) {
    // User Metrics Section
    const userMetricsRows = Object.entries(CONFIG.events)
        .filter(([key]) => ['new_accounts', 'completed_onboarding', 'new_paying_users', 'new_successful_users'].includes(key))
        .map(([eventName, config]) => {
            const metric = yesterdayMetrics[eventName];
            const value = metric ? metric.value : 0;
            const previousValue = dayBeforeMetrics[eventName]?.value || 0;
            const percentageChange = calculatePercentageChange(value, previousValue);
            return `${config.name.padEnd(25)} | ${value.toString().padEnd(12)} | ${percentageChange.padStart(9)}`;
        });

    // Sheet Metrics Section
    const sheetMetricsRows = Object.entries(yesterdayMetrics)
        .filter(([key]) => ['sheet_created', 'sheet_shared', 'template_opened', 'sheet_edit', 'cell_enriched', 'enrich_clicked'].includes(key))
        .map(([eventName, metric]) => {
            const previousValue = dayBeforeMetrics[eventName]?.value || 0;
            const percentageChange = calculatePercentageChange(metric.value, previousValue);
            return `${metric.displayName.padEnd(25)} | ${metric.value.toString().padEnd(12)} | ${percentageChange.padStart(9)}`;
        });

    return [
        "Metric                    | Daily Value  | % Change",
        "--------------------------|--------------|----------",
        ...userMetricsRows,
        "--------------------------|--------------|----------",
        ...sheetMetricsRows
    ].join('\n');
}

// Get start and end dates for a week
function getWeekDates() {
    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(0, 0, 0, 0);
    
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    
    return { start, end };
}

// Format weekly metrics table
function formatWeeklyMetricsTable(weeklyMetrics, previousWeekMetrics) {
    // User Metrics Section
    const userMetricsRows = Object.entries(CONFIG.events)
        .filter(([key]) => ['new_accounts', 'completed_onboarding', 'new_paying_users', 'new_successful_users'].includes(key))
        .map(([eventName, config]) => {
            const metric = weeklyMetrics[eventName];
            const value = metric ? metric.value : 0;
            const previousValue = previousWeekMetrics[eventName]?.value || 0;
            const percentageChange = calculatePercentageChange(value, previousValue);
            return `${config.name.padEnd(25)} | ${value.toString().padEnd(12)} | ${percentageChange.padStart(9)}`;
        });

    // Sheet Metrics Section
    const sheetMetricsRows = Object.entries(weeklyMetrics)
        .filter(([key]) => ['sheet_created', 'sheet_shared', 'template_opened', 'sheet_edit', 'cell_enriched', 'enrich_clicked'].includes(key))
        .map(([eventName, metric]) => {
            const previousValue = previousWeekMetrics[eventName]?.value || 0;
            const percentageChange = calculatePercentageChange(metric.value, previousValue);
            return `${metric.displayName.padEnd(25)} | ${metric.value.toString().padEnd(12)} | ${percentageChange.padStart(9)}`;
        });

    return [
        "Metric                    | Weekly Total | % Change",
        "--------------------------|--------------|----------",
        ...userMetricsRows,
        "--------------------------|--------------|----------",
        ...sheetMetricsRows
    ].join('\n');
}



// Send message to Slack
async function sendSlackMessage(message) {
    try {
        await slack.chat.postMessage({
            channel: process.env.SLACK_CHANNEL_ID,
            text: message
        });
    } catch (error) {
        console.error('Error sending Slack message:', error);
    }
}

// Generate daily report
async function generateReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

    const yesterdayMetrics = await fetchMetrics(yesterday);
    const dayBeforeMetrics = await fetchMetrics(dayBeforeYesterday);

    const dateStr = yesterday.toISOString().split('T')[0];
    const message = [
        `*Paradigm Daily Metrics Report (${dateStr})*\n`,
        "```",
        formatMetricsTable(yesterdayMetrics, dayBeforeMetrics),
        "```"
    ].join('\n');

    await sendSlackMessage(message);
}

// Generate weekly report
async function generateWeeklyReport() {
    const { start, end } = getWeekDates();
    const previousWeekStart = new Date(start);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(end);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

    const weeklyMetrics = {};
    for (const [eventName, config] of Object.entries(CONFIG.events)) {
        let weeklyTotal = 0;
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
            try {
                const response = await axios.get(config.statsig.baseUrl, {
                    headers: { 'STATSIG-API-KEY': config.statsig.apiKey },
                    params: {
                        id: config.id,
                        date: currentDate.toISOString().split('T')[0]
                    }
                });
                const dataPoint = response.data?.data?.find(d => d.unit_type === 'overall');
                weeklyTotal += dataPoint?.value || 0;
            } catch (error) {
                weeklyTotal += 0;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        weeklyMetrics[eventName] = {
            value: weeklyTotal,
            displayName: config.name
        };
    }

    const previousWeekMetrics = {};
    for (const [eventName, config] of Object.entries(CONFIG.events)) {
        let previousWeeklyTotal = 0;
        const currentDate = new Date(previousWeekStart);
        
        while (currentDate <= previousWeekEnd) {
            try {
                const response = await axios.get(config.statsig.baseUrl, {
                    headers: { 'STATSIG-API-KEY': config.statsig.apiKey },
                    params: {
                        id: config.id,
                        date: currentDate.toISOString().split('T')[0]
                    }
                });
                const dataPoint = response.data?.data?.find(d => d.unit_type === 'overall');
                previousWeeklyTotal += dataPoint?.value || 0;
            } catch (error) {
                previousWeeklyTotal += 0;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        previousWeekMetrics[eventName] = {
            value: previousWeeklyTotal,
            displayName: config.name
        };
    }

    const message = [
        `*Paradigm Weekly Metrics Report (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})*\n`,
        "```",
        formatWeeklyMetricsTable(weeklyMetrics, previousWeekMetrics),
        "```"
    ].join('\n');

    await sendSlackMessage(message);
}

// Run the reports
async function generateReports() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 5 is Friday

    if (dayOfWeek === 5) { // Friday
        await generateWeeklyReport();
        await generateReport(); // Also send daily and all-time reports on Friday
    } else {
        await generateReport();
    }
}

generateReports().catch(console.error); 