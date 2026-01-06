# Analytics Optimization

## Overview

The analytics system has been optimized for performance by:
- Reducing metrics from 28 KPIs to 7 essential KPIs
- Pre-aggregating all metrics daily (not on page load)
- Using a single query to fetch pre-computed summary data
- Eliminating heavy read-time calculations

## Daily Aggregation Job

The `aggregationJob.ts` service computes all 7 essential metrics once per day and stores them in the `analytics_summary` table.

### Running the Aggregation Job

**Option 1: Manual Trigger (Development)**
```typescript
import { runDailyAnalyticsAggregation } from "@/services/analytics/aggregationJob.ts";
await runDailyAnalyticsAggregation();
```

**Option 2: Scheduled Function (Production)**
Set up a Supabase Edge Function or cron job to call `runDailyAnalyticsAggregation()` daily.

**Option 3: Database Trigger**
Create a PostgreSQL function that runs daily via pg_cron extension.

### When to Run

- **Recommended**: Once per day at 2 AM (after daily data collection)
- **Minimum**: Before first admin login each day
- **Fallback**: Can run on-demand if needed

## Performance Improvements

- **Queries**: 1 query (down from 10+)
- **Load Time**: < 500ms (down from potentially seconds)
- **Payload Size**: < 5KB (down from potentially MBs)
- **Calculation Time**: 0ms on page load (all pre-computed)

## Essential Metrics

1. % Students On Track
2. % At-Risk Students
3. % Teachers with At-Risk Students
4. Teacher Session Reliability
5. Overall Memorization Velocity
6. Student Retention (30-day)
7. Active Students Count

