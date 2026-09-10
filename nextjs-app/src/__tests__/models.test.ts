import mongoose from 'mongoose';
import { User } from '../models/User';
import { Chatbot } from '../models/Chatbot';

describe('Model Validations', () => {
  it('User model should require name, email, passwordHash', () => {
    const user = new User();
    const err = user.validateSync();
    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.email).toBeDefined();
    expect(err?.errors.passwordHash).toBeDefined();
  });

  it('Chatbot model should require uuid, name, userId', () => {
    const bot = new Chatbot();
    const err = bot.validateSync();
    expect(err?.errors.uuid).toBeDefined();
    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.userId).toBeDefined();
  });
});
