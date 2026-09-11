import { splitText, chunkDocument } from '../lib/chunker';

describe('Text Chunker', () => {
  it('should not split text shorter than chunkSize', () => {
    const text = 'Hello world, this is a short test document.';
    const chunks = splitText(text, 1000, 200);
    expect(chunks).toEqual([text]);
  });

  it('should split text exceeding chunkSize with overlap', () => {
    const paragraph1 = 'A'.repeat(600);
    const paragraph2 = 'B'.repeat(600);
    const text = `${paragraph1}\n\n${paragraph2}`;

    const chunks = splitText(text, 800, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(800);
  });

  it('chunkDocument should attach metadata and chunk_id', () => {
    const text = 'First line of content.\n\nSecond line of content.\n\nThird line of content.';
    const metadata = {
      chatbot_id: 'test-bot',
      document_id: 'doc-123',
      document_name: 'test.txt',
    };

    const chunks = chunkDocument(text, metadata, { chunkSize: 50, chunkOverlap: 10 });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].chunk_id).toBe(0);
    expect(chunks[0].chatbot_id).toBe('test-bot');
    expect(chunks[0].document_name).toBe('test.txt');
    expect(chunks[0].text).toBeDefined();
  });
});
