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

// multilingual-e5-large limit: 96 TOKENS (not characters).
// The XLM-RoBERTa tokenizer can produce 1 token per 1-2 chars for
// dense/technical/non-English text. To guarantee < 96 tokens even
// in the worst case, we cap chunks at 100 characters.
// MAX_CHARS is a hard absolute cap applied as a final safety net.
const MAX_CHARS = 100;

/**
 * Hard-slice a string into pieces of at most `size` characters.
 * Used as a last-resort fallback when no separator can break a segment.
 */
function hardSlice(text: string, size: number): string[] {
  const pieces: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    const piece = text.slice(i, i + size).trim();
    if (piece) pieces.push(piece);
  }
  return pieces;
}

export function splitText(
  text: string,
  chunkSize = 80,
  chunkOverlap = 15,
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

  // No separator found at all — hard-slice the whole text
  if (chosenSeparator === null) {
    return hardSlice(text, chunkSize);
  }

  const splits = text.split(chosenSeparator);
  const finalChunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLen = 0;

  for (const part of splits) {
    // If this single part is already too large, recursively split it
    if (part.length > chunkSize) {
      // Flush any accumulated current chunk first
      if (currentChunk.length > 0) {
        const chunkStr = currentChunk.join(chosenSeparator).trim();
        if (chunkStr) finalChunks.push(chunkStr);
        currentChunk = [];
        currentLen = 0;
      }

      const remainingSeps = separators.slice(separators.indexOf(chosenSeparator) + 1);
      if (remainingSeps.length > 0) {
        // Try with next-finer separators
        const subChunks = splitText(part, chunkSize, chunkOverlap, remainingSeps);
        finalChunks.push(...subChunks);
      } else {
        // Last resort: hard character slice
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
  const chunkSize = options?.chunkSize ?? 80;
  const chunkOverlap = options?.chunkOverlap ?? 15;
  const separators = options?.separators ?? ['\n\n', '\n', '. ', ' '];

  const rawChunks = splitText(text, chunkSize, chunkOverlap, separators);

  // Final safety pass: hard-truncate any chunk that somehow exceeds MAX_CHARS.
  // This is an absolute guarantee regardless of input structure.
  const safeChunks: string[] = [];
  for (const chunk of rawChunks) {
    if (chunk.length > MAX_CHARS) {
      safeChunks.push(...hardSlice(chunk, MAX_CHARS));
    } else {
      safeChunks.push(chunk);
    }
  }

  return safeChunks
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk, index) => ({
      text: chunk,
      chunk_id: index,
      ...metadata,
    }));
}
