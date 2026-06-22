export function fmtRt(sec: number | undefined | null): string {
  if (sec === undefined || sec === null || Number.isNaN(sec)) return "—";
  if (sec < 10) return `${(sec * 1000).toFixed(0)} ms`;
  return `${sec.toFixed(2)} sec`;
}

export function fmtRtMs(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || Number.isNaN(ms)) return "—";
  return `${ms.toFixed(0)} ms`;
}

export function fmtPct(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

export function fmtBandwidth(kib: number | undefined | null): string {
  if (kib === undefined || kib === null || Number.isNaN(kib)) return "—";
  return `${kib.toFixed(2)} KiB/s`;
}

export function fmtThroughput(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)} / sec`;
}

export function fmtDurationSec(sec: number | undefined | null): string {
  if (!sec) return "—";
  const mins = Math.floor(sec / 60);
  const rem = Math.round(sec % 60);
  return mins > 0 ? `${mins} min${rem > 0 ? ` ${rem}s` : ""}` : `${Math.round(sec)}s`;
}

export function fmtCount(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}
