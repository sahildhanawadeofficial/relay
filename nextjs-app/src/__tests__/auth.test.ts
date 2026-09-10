import { POST } from '../app/api/auth/register/route';
import { dbConnect } from '../lib/db';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

jest.mock('../lib/db');
jest.mock('../models/User');
jest.mock('bcryptjs');

describe('Auth Registration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid data', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid' }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 409 if email exists', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
    
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'password123' }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('should return 201 and hash password on success', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    (User.create as jest.Mock).mockResolvedValue({});
    
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'password123' }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
  });
});
