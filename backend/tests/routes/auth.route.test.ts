import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { register, authenticate } from '../../src/controllers/auth.controller';
import prisma from '../../src/db';

// Mock prisma
jest.mock('../../src/db', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn()
    }
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword123'),
    compare: jest.fn().mockResolvedValue(true)
}));

// Mock data with valid credentials
const testUser = {
    username: "validuser123",
    password: "ValidPass123!"
};

const mockCreatedUser = {
    id: 'mock-user-id',
    username: testUser.username,
    password: 'hashedPassword123'
};

// Helper to create mock request and response
const mockRequestResponse = () => {
    const req = {
        body: {}
    } as Request;
    
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    } as unknown as Response;
    
    return { req, res };
};

describe('Authentication Controllers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const { req, res } = mockRequestResponse();
            req.body = testUser;

            // Mock prisma responses
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
            (prisma.user.create as jest.Mock).mockResolvedValueOnce(mockCreatedUser);

            await register(req, res);

            // Verify response
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: mockCreatedUser.id,
                    username: testUser.username,
                    token: expect.any(String)
                })
            );
            
            // Verify prisma calls
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { username: testUser.username }
            });
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    username: testUser.username,
                    password: 'hashedPassword123'
                }
            });
            
            // Verify bcrypt was called
            expect(bcrypt.hash).toHaveBeenCalledWith(testUser.password, 10);
        });

        it('should return 409 when registering existing username', async () => {
            const { req, res } = mockRequestResponse();
            req.body = testUser;

            // Mock user already exists
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockCreatedUser);

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
            expect(prisma.user.create).not.toHaveBeenCalled();
        });

        describe('invalid registration data', () => {
            it('should return 400 for empty username/password', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: '',
                    password: ''
                };

                await register(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
                expect(prisma.user.findUnique).not.toHaveBeenCalled();
            });

            it('should return 400 for username too short', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: 'ab',
                    password: 'ValidPass123!'
                };

                await register(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
            });

            it('should return 400 for invalid username characters', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: 'user@name',
                    password: 'ValidPass123!'
                };

                await register(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
            });

            it('should return 400 for password without uppercase', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: 'validuser',
                    password: 'password123!'
                };

                await register(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
            });

            it('should return 400 for password without number', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: 'validuser',
                    password: 'Password!'
                };

                await register(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
            });

            it('should return 400 for password without special character', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: 'validuser',
                    password: 'Password123'
                };

                await register(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
            });
        });
    });

    describe('authenticate', () => {
        it('should successfully authenticate existing user', async () => {
            const { req, res } = mockRequestResponse();
            req.body = testUser;

            // Mock user exists
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockCreatedUser);
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

            await authenticate(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: mockCreatedUser.id,
                    username: testUser.username,
                    token: expect.any(String)
                })
            );
            
            // Verify prisma call
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { username: testUser.username }
            });
            
            // Verify password check
            expect(bcrypt.compare).toHaveBeenCalledWith(testUser.password, mockCreatedUser.password);
        });

        it('should return 400 for non-existent user', async () => {
            const { req, res } = mockRequestResponse();
            req.body = {
                username: 'doesnotexist',
                password: 'Test123!'
            };

            // Mock user doesn't exist
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

            await authenticate(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate user' });
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('should return 400 for wrong password', async () => {
            const { req, res } = mockRequestResponse();
            req.body = {
                username: testUser.username,
                password: 'WrongPassword123!'
            };

            // Mock user exists but password is wrong
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockCreatedUser);
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            await authenticate(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to authenticate user' });
        });

        describe('invalid login data', () => {
            it('should return 400 for empty credentials', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: '',
                    password: ''
                };

                await authenticate(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
                expect(prisma.user.findUnique).not.toHaveBeenCalled();
            });

            it('should return 400 for username too short', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: 'ab',
                    password: 'ValidPass123!'
                };

                await authenticate(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
                expect(prisma.user.findUnique).not.toHaveBeenCalled();
            });

            it('should return 400 for password too short', async () => {
                const { req, res } = mockRequestResponse();
                req.body = {
                    username: 'validuser',
                    password: 'short'
                };

                await authenticate(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid request' });
                expect(prisma.user.findUnique).not.toHaveBeenCalled();
            });
        });
    });
});
