export interface ParsedCsv<T = Record<string, string>> {
  headers: string[];
  rows: T[];
}

function parseWithDelimiter(input: string, delimiter: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField.trim());
    currentField = "";
  };
  const pushRow = () => {
    // Avoid pushing empty trailing rows
    if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === "")) {
      rows.push(currentRow);
    }
    currentRow = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (inQuotes && input[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      pushField();
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Handle CRLF and CR
      if (char === '\r' && input[i + 1] === '\n') i++;
      pushField();
      pushRow();
    } else {
      currentField += char;
    }
  }
  // Flush last field/row
  pushField();
  pushRow();

  const headers = (rows.shift() || []).map((h) => h.trim());
  return { headers, rows };
}

export function parseCsvOrTsv(input: string): ParsedCsv {
  // Strip UTF-8 BOM if present to avoid contaminating first header
  if (input && input.charCodeAt(0) === 0xfeff) {
    input = input.slice(1);
  }

  // Try multiple common delimiters and choose the one producing the most columns
  const candidateDelimiters = ["\t", ",", ";", "|"] as const;
  let best = { delimiter: ",", parsed: parseWithDelimiter(input, ",") } as {
    delimiter: string;
    parsed: { headers: string[]; rows: string[][] };
  };

  for (const d of candidateDelimiters) {
    const parsed = parseWithDelimiter(input, d);
    // Heuristic: prefer the delimiter yielding the most header columns
    // Break ties by choosing the one with the highest median row length
    const currentHeaderCount = parsed.headers.length;
    const bestHeaderCount = best.parsed.headers.length;
    if (currentHeaderCount > bestHeaderCount) {
      best = { delimiter: d, parsed };
      continue;
    }
    if (currentHeaderCount === bestHeaderCount && currentHeaderCount > 1) {
      const medianLen = (arr: number[]) => {
        const s = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(s.length / 2);
        return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
      };
      const candidateMedian = medianLen(parsed.rows.map((r) => r.length));
      const bestMedian = medianLen(best.parsed.rows.map((r) => r.length));
      if (candidateMedian > bestMedian) {
        best = { delimiter: d, parsed };
      }
    }
  }

  const headers = best.parsed.headers;
  const rows = best.parsed.rows.map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}


