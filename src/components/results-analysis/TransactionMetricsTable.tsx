import type { ParsedTransaction } from "@/lib/results-analysis/types";
import {
  fmtBandwidth,
  fmtCount,
  fmtDurationSec,
  fmtPct,
  fmtRt,
  fmtThroughput,
} from "@/lib/results-analysis/display-metrics";
import { pillBadge } from "@/lib/utils";

export function TransactionMetricsTable({
  rows,
  showStatus,
  statusFor,
}: {
  rows: ParsedTransaction[];
  showStatus?: boolean;
  statusFor?: (name: string) => "pass" | "warning" | "fail" | null;
}) {
  if (rows.length === 0) {
    return <p className="p-5 text-sm text-slate-500">No transaction data.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Label</th>
            <th className="px-4 py-3">Samples</th>
            <th className="px-4 py-3">Avg RT</th>
            <th className="px-4 py-3">P90</th>
            <th className="px-4 py-3">P95</th>
            <th className="px-4 py-3">P99</th>
            <th className="px-4 py-3">Min</th>
            <th className="px-4 py-3">Max</th>
            <th className="px-4 py-3">Median</th>
            <th className="px-4 py-3">Std dev</th>
            <th className="px-4 py-3">Latency</th>
            <th className="px-4 py-3">Errors</th>
            <th className="px-4 py-3">Error %</th>
            <th className="px-4 py-3">Throughput</th>
            <th className="px-4 py-3">Bandwidth</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">VU</th>
            <th className="px-4 py-3">Thresholds</th>
            {showStatus && <th className="px-4 py-3">SLA</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => {
            const status = statusFor?.(tx.name);
            return (
              <tr key={tx.labelId ?? tx.name} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{tx.name}</td>
                <td className="px-4 py-3">{fmtCount(tx.samples)}</td>
                <td className="px-4 py-3">{fmtRt(tx.avgRtSec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.p90Sec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.p95Sec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.p99Sec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.minRtSec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.maxRtSec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.medianRtSec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.stDevSec)}</td>
                <td className="px-4 py-3">{fmtRt(tx.avgLatencySec)}</td>
                <td className="px-4 py-3">{tx.errorsCount != null ? fmtCount(tx.errorsCount) : "—"}</td>
                <td className="px-4 py-3">{fmtPct(tx.errorRatePct)}</td>
                <td className="px-4 py-3">{fmtThroughput(tx.throughput)}</td>
                <td className="px-4 py-3">{fmtBandwidth(tx.avgBytes)}</td>
                <td className="px-4 py-3">{tx.durationSec ? fmtDurationSec(tx.durationSec) : "—"}</td>
                <td className="px-4 py-3">{tx.concurrency ?? "—"}</td>
                <td className="px-4 py-3">
                  {tx.passedThresholds === true ? (
                    <span className={pillBadge("bg-green-100 text-green-800 border-green-200")}>Pass</span>
                  ) : tx.passedThresholds === false ? (
                    <span className={pillBadge("bg-red-100 text-red-800 border-red-200")}>Fail</span>
                  ) : (
                    "—"
                  )}
                </td>
                {showStatus && (
                  <td className="px-4 py-3">
                    {status ? (
                      <span
                        className={pillBadge(
                          status === "pass"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : status === "warning"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-800 border-red-200"
                        )}
                      >
                        {status}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
