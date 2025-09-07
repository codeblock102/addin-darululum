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
  const preferTab = input.includes("\t");
  const delimiter = preferTab ? "\t" : ",";
  const parsed = parseWithDelimiter(input, delimiter);
  const headers = parsed.headers;
  const rows = parsed.rows.map((cols) => {
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


