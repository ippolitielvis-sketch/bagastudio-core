export type CsvPart = {
  rowIndex: number;
  name: string;
  width: number;
  depth: number;
  thickness: number;
  quantity: number;
  material: string;
  raw: Record<string, string>;
};

export type CixPartForMatching = {
  fileName: string;
  partName: string;
  width: number;
  depth: number;
  thickness: number;
};

export type CsvCixMatch = {
  csvPart: CsvPart;
  cixPart: CixPartForMatching | null;
  confidence: number;
  reasons: string[];
};

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^[0-9]+[-_\s]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/[^\w\sàèéìòù]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const clean = String(value || "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitCsvLine(line: string, delimiter = ";") {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

export function parseSpazio3DCsv(csvText: string): CsvPart[] {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0], ";").map((header) => header.trim());

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line, ";");
    const raw: Record<string, string> = {};

    headers.forEach((header, headerIndex) => {
      raw[header] = values[headerIndex] || "";
    });

    return {
      rowIndex: index + 1,
      name: raw.Name || raw.name || raw.Description || `CSV Part ${index + 1}`,
      width: parseNumber(raw["Final Length"] || raw.Length),
      depth: parseNumber(raw["Final Width"] || raw.Width),
      thickness: parseNumber(raw.Thickness),
      quantity: parseNumber(raw.Qty) || 1,
      material: raw.Material || "",
      raw,
    };
  });
}

function dimensionScore(csvPart: CsvPart, cixPart: CixPartForMatching) {
  const csvDims = [csvPart.width, csvPart.depth, csvPart.thickness]
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  const cixDims = [cixPart.width, cixPart.depth, cixPart.thickness]
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  if (csvDims.length !== 3 || cixDims.length !== 3) return 0;

  const totalDifference = csvDims.reduce(
    (sum, value, index) => sum + Math.abs(value - cixDims[index]),
    0
  );

  if (totalDifference <= 1) return 50;
  if (totalDifference <= 3) return 40;
  if (totalDifference <= 8) return 25;
  if (totalDifference <= 20) return 10;

  return 0;
}

function nameScore(csvName: string, cixName: string) {
  const csvNormalized = normalizeText(csvName);
  const cixNormalized = normalizeText(cixName);

  if (!csvNormalized || !cixNormalized) return 0;
  if (csvNormalized === cixNormalized) return 50;
  if (csvNormalized.includes(cixNormalized) || cixNormalized.includes(csvNormalized)) return 35;

  const csvTokens = new Set(csvNormalized.split(" ").filter(Boolean));
  const cixTokens = cixNormalized.split(" ").filter(Boolean);

  const overlap = cixTokens.filter((token) => csvTokens.has(token)).length;

  if (overlap >= 2) return 25;
  if (overlap === 1) return 12;

  return 0;
}

export function matchCsvPartsToCixParts(
  csvParts: CsvPart[],
  cixParts: CixPartForMatching[]
): CsvCixMatch[] {
  const usedCixFiles = new Set<string>();

  return csvParts.map((csvPart) => {
    let best: CsvCixMatch = {
      csvPart,
      cixPart: null,
      confidence: 0,
      reasons: ["Nessun CIX compatibile trovato."],
    };

    cixParts.forEach((cixPart) => {
      if (usedCixFiles.has(cixPart.fileName)) return;

      const nScore = nameScore(csvPart.name, cixPart.partName);
      const dScore = dimensionScore(csvPart, cixPart);
      const confidence = Math.min(100, nScore + dScore);
      const reasons: string[] = [];

      if (nScore > 0) reasons.push(`nome:${nScore}`);
      if (dScore > 0) reasons.push(`dimensioni:${dScore}`);

      if (confidence > best.confidence) {
        best = {
          csvPart,
          cixPart,
          confidence,
          reasons,
        };
      }
    });

    if (best.cixPart && best.confidence >= 50) {
      usedCixFiles.add(best.cixPart.fileName);
      return best;
    }

    return {
      csvPart,
      cixPart: null,
      confidence: best.confidence,
      reasons: best.reasons,
    };
  });
}

export function buildCsvCixMatcherReport(matches: CsvCixMatch[]) {
  const matched = matches.filter((match) => Boolean(match.cixPart));

  return {
    totalCsvParts: matches.length,
    matchedParts: matched.length,
    unmatchedParts: matches.length - matched.length,
    averageConfidence:
      matched.length > 0
        ? Math.round(
            matched.reduce((sum, match) => sum + match.confidence, 0) / matched.length
          )
        : 0,
    matches,
  };
}
