export interface ChunkMetadata {
  chatbot_id: string;
  document_id: string;
  document_name: string;
  [key: string]: any;
}

export interface TextChunk extends ChunkMetadata {
  text: string;
  chunk_id: number;
}

export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

/**
 * Hard-slice a string into pieces of at most `size` characters.
 * Used as a fallback when no separator is found.
 */
function hardSlice(text: string, size: number): string[] {
  const pieces: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    const piece = text.slice(i, i + size).trim();
    if (piece) pieces.push(piece);
  }
  return pieces;
}

/**
 * Recursively split text using hierarchy of separators.
 */
export function splitText(
  text: string,
  chunkSize = 800,
  chunkOverlap = 150,
  separators = ['\n\n', '\n', '. ', ' ']
): string[] {
  if (text.length <= chunkSize) {
    const trimmed = text.trim();
    return trimmed ? [trimmed] : [];
  }

  // Find the first separator that appears in text
  let chosenSeparator: string | null = null;
  for (const sep of separators) {
    if (text.includes(sep)) {
      chosenSeparator = sep;
      break;
    }
  }

  // If no separator found, hard-slice by chunkSize
  if (chosenSeparator === null) {
    return hardSlice(text, chunkSize);
  }

  const splits = text.split(chosenSeparator);
  const finalChunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLen = 0;

  for (const part of splits) {
    // If a single part exceeds chunkSize, recursively split it with finer separators
    if (part.length > chunkSize) {
      if (currentChunk.length > 0) {
        const chunkStr = currentChunk.join(chosenSeparator).trim();
        if (chunkStr) finalChunks.push(chunkStr);
        currentChunk = [];
        currentLen = 0;
      }

      const remainingSeps = separators.slice(separators.indexOf(chosenSeparator) + 1);
      if (remainingSeps.length > 0) {
        const subChunks = splitText(part, chunkSize, chunkOverlap, remainingSeps);
        finalChunks.push(...subChunks);
      } else {
        finalChunks.push(...hardSlice(part, chunkSize));
      }
      continue;
    }

    const partLen = part.length + (currentChunk.length > 0 ? chosenSeparator.length : 0);

    if (currentLen + partLen > chunkSize && currentChunk.length > 0) {
      const chunkStr = currentChunk.join(chosenSeparator).trim();
      if (chunkStr) finalChunks.push(chunkStr);

      // Carry over overlap from the end of the flushed chunk
      const overlapParts: string[] = [];
      let overlapLen = 0;
      for (let i = currentChunk.length - 1; i >= 0; i--) {
        const item = currentChunk[i];
        const addLen = item.length + (overlapParts.length > 0 ? chosenSeparator.length : 0);
        if (overlapLen + addLen <= chunkOverlap) {
          overlapParts.unshift(item);
          overlapLen += addLen;
        } else {
          break;
        }
      }

      currentChunk = overlapParts;
      currentLen = overlapLen;
    }

    currentChunk.push(part);
    currentLen += (currentChunk.length > 1 ? chosenSeparator.length : 0) + part.length;
  }

  if (currentChunk.length > 0) {
    const remaining = currentChunk.join(chosenSeparator).trim();
    if (remaining) finalChunks.push(remaining);
  }

  return finalChunks;
}

export function chunkDocument(
  text: string,
  metadata: ChunkMetadata,
  options?: ChunkerOptions
): TextChunk[] {
  const chunkSize = options?.chunkSize ?? 800;
  const chunkOverlap = options?.chunkOverlap ?? 150;
  const separators = options?.separators ?? ['\n\n', '\n', '. ', ' '];

  const rawChunks = splitText(text, chunkSize, chunkOverlap, separators);

  return rawChunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk, index) => ({
      text: chunk,
      chunk_id: index,
      ...metadata,
    }));
}
