import { GET, POST } from '../app/api/chatbots/route';
import { auth } from '../lib/auth';
import { Chatbot } from '../models/Chatbot';

jest.mock('../lib/auth');
jest.mock('../lib/db');
jest.mock('../models/Chatbot');

describe('Chatbots API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/chatbots should return 401 if unauthenticated', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const req = new Request('http://localhost/api/chatbots');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('POST /api/chatbots should generate UUID and create chatbot', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'user123' } });
    (Chatbot.create as jest.Mock).mockImplementation((data) => Promise.resolve({ ...data, _id: 'newid' }));
    
    const req = new Request('http://localhost/api/chatbots', {
      method: 'POST',
      body: JSON.stringify({ name: 'My Bot' }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(201);
    
    const data = await res.json();
    expect(data.name).toBe('My Bot');
    expect(data.uuid).toBeDefined();
    expect(data.userId).toBe('user123');
  });
});
