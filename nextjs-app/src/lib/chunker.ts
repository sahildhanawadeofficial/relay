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

// multilingual-e5-large has a hard 96-token (~300 char) input limit.
// Keep chunks at ≤200 chars so even token-dense text stays within bounds.
export function splitText(
  text: string,
  chunkSize = 200,
  chunkOverlap = 30,
  separators = ['\n\n', '\n', '. ', ' ', '']
): string[] {
  if (text.length <= chunkSize) {
    const trimmed = text.trim();
    return trimmed ? [trimmed] : [];
  }

  // Find the first separator that appears in text
  let chosenSeparator = '';
  for (const sep of separators) {
    if (sep === '' || text.includes(sep)) {
      chosenSeparator = sep;
      break;
    }
  }

  const splits = chosenSeparator ? text.split(chosenSeparator) : text.split('');
  const finalChunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLen = 0;

  for (const part of splits) {
    const partLen = part.length + (currentChunk.length > 0 ? chosenSeparator.length : 0);

    if (currentLen + partLen > chunkSize && currentChunk.length > 0) {
      const chunkStr = currentChunk.join(chosenSeparator).trim();
      if (chunkStr) {
        finalChunks.push(chunkStr);
      }

      // Calculate overlap: keep recent parts from currentChunk
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

    // If a single part is larger than chunkSize, recursively split it with remaining separators
    if (part.length > chunkSize) {
      const remainingSeps = separators.slice(separators.indexOf(chosenSeparator) + 1);
      if (remainingSeps.length > 0) {
        const subChunks = splitText(part, chunkSize, chunkOverlap, remainingSeps);
        finalChunks.push(...subChunks);
        continue;
      }
    }

    currentChunk.push(part);
    currentLen += (currentChunk.length > 1 ? chosenSeparator.length : 0) + part.length;
  }

  if (currentChunk.length > 0) {
    const remaining = currentChunk.join(chosenSeparator).trim();
    if (remaining) {
      finalChunks.push(remaining);
    }
  }

  return finalChunks;
}

export function chunkDocument(
  text: string,
  metadata: ChunkMetadata,
  options?: ChunkerOptions
): TextChunk[] {
  const chunkSize = options?.chunkSize ?? 200;
  const chunkOverlap = options?.chunkOverlap ?? 30;
  const separators = options?.separators ?? ['\n\n', '\n', '. ', ' ', ''];

  const rawChunks = splitText(text, chunkSize, chunkOverlap, separators);

  return rawChunks.map((chunk, index) => ({
    text: chunk,
    chunk_id: index,
    ...metadata,
  }));
}
