import { GET, POST } from '../app/api/chatbots/route';
import { GET as GETById, DELETE } from '../app/api/chatbots/[chatbotId]/route';
import { auth } from '../lib/auth';
import { Chatbot } from '../models/Chatbot';

jest.mock('../lib/auth');
jest.mock('../lib/db');
jest.mock('../models/Chatbot');

const mockParams = (chatbotId: string) => ({ params: Promise.resolve({ chatbotId }) });

describe('Chatbots API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET /api/chatbots ───────────────────────────────────────────────
  it('GET /api/chatbots returns 401 for unauthenticated user', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET /api/chatbots returns chatbot list for authenticated user', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user123' } });
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ uuid: 'abc', name: 'Bot 1' }]),
    };
    (Chatbot.find as jest.Mock).mockReturnValue(mockFind);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(Chatbot.find).toHaveBeenCalledWith({ userId: 'user123' });
  });

  // ── POST /api/chatbots ──────────────────────────────────────────────
  it('POST /api/chatbots generates UUID and creates chatbot', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user123' } });
    (Chatbot.create as jest.Mock).mockImplementation((data) =>
      Promise.resolve({ ...data, _id: 'newid' })
    );

    const req = new Request('http://localhost/api/chatbots', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Bot' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.name).toBe('My Bot');
    expect(data.uuid).toBeDefined();
    // UUID should be a valid UUID format (contains 4 hyphens)
    expect(data.uuid.split('-').length).toBe(5);
    expect(data.userId).toBe('user123');
  });

  it('POST /api/chatbots returns 400 for empty name', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user123' } });

    const req = new Request('http://localhost/api/chatbots', {
      method: 'POST',
      body: JSON.stringify({ name: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST /api/chatbots returns 401 for unauthenticated user', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/chatbots', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Bot' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // ── GET /api/chatbots/[chatbotId] ───────────────────────────────────
  it('GET /api/chatbots/[id] returns 403 when chatbot belongs to another user', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } });
    (Chatbot.findOne as jest.Mock).mockResolvedValue({
      uuid: 'some-uuid',
      userId: { toString: () => 'user-b' }, // different user
    });

    const req = new Request('http://localhost/api/chatbots/some-uuid');
    const res = await GETById(req, mockParams('some-uuid'));
    expect(res.status).toBe(403);
  });

  it('GET /api/chatbots/[id] returns chatbot for correct owner', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } });
    (Chatbot.findOne as jest.Mock).mockResolvedValue({
      uuid: 'some-uuid',
      name: 'My Bot',
      userId: { toString: () => 'user-a' },
    });

    const req = new Request('http://localhost/api/chatbots/some-uuid');
    const res = await GETById(req, mockParams('some-uuid'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe('My Bot');
  });

  it('GET /api/chatbots/[id] returns 404 for non-existent chatbot', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } });
    (Chatbot.findOne as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost/api/chatbots/nonexistent');
    const res = await GETById(req, mockParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  // ── DELETE /api/chatbots/[chatbotId] ────────────────────────────────
  it('DELETE /api/chatbots/[id] returns 403 for wrong user', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } });
    (Chatbot.findOne as jest.Mock).mockResolvedValue({
      _id: 'someid',
      uuid: 'some-uuid',
      userId: { toString: () => 'user-b' },
    });

    const req = new Request('http://localhost/api/chatbots/some-uuid', { method: 'DELETE' });
    const res = await DELETE(req, mockParams('some-uuid'));
    expect(res.status).toBe(403);
  });

  it('DELETE /api/chatbots/[id] deletes chatbot for correct owner', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user-a' } });
    (Chatbot.findOne as jest.Mock).mockResolvedValue({
      _id: 'someid',
      uuid: 'some-uuid',
      userId: { toString: () => 'user-a' },
    });
    (Chatbot.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

    const req = new Request('http://localhost/api/chatbots/some-uuid', { method: 'DELETE' });
    const res = await DELETE(req, mockParams('some-uuid'));
    expect(res.status).toBe(200);
    expect(Chatbot.deleteOne).toHaveBeenCalled();
  });
});
