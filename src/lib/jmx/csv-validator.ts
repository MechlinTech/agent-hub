export interface CsvValidationResult {
  valid: boolean;
  warnings: string[];
  rowCount: number;
  columnCount: number;
}

export function validateCsvContent(content: string, fileName: string): CsvValidationResult {
  const warnings: string[] = [];
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { valid: false, warnings: ["CSV file is empty"], rowCount: 0, columnCount: 0 };
  }

  const header = lines[0].split(",").map((c) => c.trim());
  if (header.length < 2) {
    warnings.push("CSV should have at least 2 columns for user/data parameterization");
  }

  const hasUsername = header.some((h) => /user|login|email/i.test(h));
  if (!hasUsername) {
    warnings.push("No username/login column detected. Verify unique user data for load tests");
  }

  const dataRows = lines.length - 1;
  if (dataRows < 10) {
    warnings.push(`Only ${dataRows} data row(s). Consider more rows for realistic concurrency`);
  }

  const duplicateCheck = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const firstCol = lines[i].split(",")[0]?.trim();
    if (firstCol && duplicateCheck.has(firstCol)) {
      warnings.push("Duplicate values in first column detected");
      break;
    }
    if (firstCol) duplicateCheck.add(firstCol);
  }

  return {
    valid: warnings.length === 0,
    warnings,
    rowCount: dataRows,
    columnCount: header.length,
  };
}
