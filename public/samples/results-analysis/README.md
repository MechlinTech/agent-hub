# Sample CSV files for Results Analysis

Use these files to test **BlazeMeter Results Analysis Agent → New Analysis**.

## Files

| File | Required | Purpose |
|------|----------|---------|
| `request-stats.csv` | Yes | Main transaction metrics (SLA pass/warn/fail mix) |
| `error-stats.csv` | Optional | 502/504/500 errors for Error Analysis + Defects |
| `timeline.csv` | Optional | Error trend chart + script iteration summary |
| `baseline.csv` | Optional | Baseline comparison tab + regression RCA |

## Quick test

1. Open **Agents → BlazeMeter Results Analysis → New Analysis**
2. Run name: `Demo Load Test - Jun 2026`
3. Upload the four CSV files above (request stats is required)
4. Click **Start Analysis**

## Expected results

- **Login**: passes SLA
- **Search Claim**: SLA warning/fail (high P95 vs baseline regression)
- **Save Estimate**: fails SLA (high error rate + 500 errors)
- **Document Upload**: warning (latency + gateway timeouts)
- Dashboard tabs: Timeline chart, Root Cause hypotheses, generated Defects

Download from the app: `/samples/results-analysis/request-stats.csv` (same path for other files).
