export type CixPart = {
  fileName: string;
  partName: string;
  width: number;
  depth: number;
  thickness: number;
  raw: {
    lpx: number;
    lpy: number;
    lpz: number;
  };
};

function extractNumber(content: string, key: string): number {
  const regex = new RegExp(`${key}\\s*=\\s*([0-9]+(?:[.,][0-9]+)?)`, "i");
  const match = content.match(regex);

  if (!match) return 0;

  return Number(match[1].replace(",", "."));
}

function extractPartName(fileName: string): string {
  return fileName
    .replace(/\.cix$/i, "")
    .replace(/^[0-9]+-/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCixFile(fileName: string, content: string): CixPart {
  const lpx = extractNumber(content, "LPX");
  const lpy = extractNumber(content, "LPY");
  const lpz = extractNumber(content, "LPZ");

  return {
    fileName,
    partName: extractPartName(fileName),
    width: lpx,
    depth: lpy,
    thickness: lpz,
    raw: {
      lpx,
      lpy,
      lpz,
    },
  };
}

export function parseCixFiles(
  files: Array<{ fileName: string; content: string }>
): CixPart[] {
  return files.map((file) => parseCixFile(file.fileName, file.content));
}
