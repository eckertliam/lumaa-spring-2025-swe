import { Request, Response } from 'express';
import { register, authenticate } from '../../src/controllers/auth.controller';
import { registerService, authService } from '../../src/services/auth.service';
import { registerSchema, authenticateSchema } from 'shared';

// Mock the auth service functions to control their behavior during tests
jest.mock('../../src/services/auth.service', () => ({
  registerService: jest.fn(),
  authService: jest.fn()
}));

describe('Auth Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  // Reset request and response mocks before each test
  beforeEach(() => {
    req = {};
    // Setup a mock for res.status that returns an object with a json method
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    res = {
      status: statusMock,
      json: jsonMock
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    // Test successful registration
    it('should register a new user and return 201 status', async () => {
      // Provide a valid request body
      req.body = { username: 'testuser', password: 'password123' };
      const expectedUser = { token: 'jwtToken', username: 'testuser' };

      // Setup registerService mock to simulate a successful registration
      (registerService as jest.Mock).mockResolvedValue(expectedUser);

      // Call the register controller
      await register(req as Request, res as Response);

      // Verify that the response returned a 201 status and the expected user object
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(expectedUser);
    });

    // Test registration failure when user already exists
    it('should return 409 if user already exists', async () => {
      req.body = { username: 'testuser', password: 'password123' };

      // Setup registerService mock to simulate an existing user
      (registerService as jest.Mock).mockResolvedValue(undefined);

      await register(req as Request, res as Response);

      // Verify that a 409 status is returned with the proper error message
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User already exists' });
    });

    // Test error handling when the request is invalid
    it('should return 400 if there is an error in request', async () => {
      req.body = {}; // Invalid body to trigger parse error

      // Spy on registerSchema.parse to force an error
      const parseSpy = jest.spyOn(registerSchema, 'parse').mockImplementation(() => {
        throw new Error('Invalid request');
      });

      await register(req as Request, res as Response);

      // Verify that the controller returns a 400 status and correct error message
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid request' });

      // Restore the original implementation of parse
      parseSpy.mockRestore();
    });
  });

  describe('authenticate', () => {
    // Test successful authentication
    it('should authenticate valid user and return 200 status', async () => {
      req.body = { username: 'testuser', password: 'password123' };
      const expectedUser = { token: 'jwtToken', username: 'testuser' };

      // Setup authService mock to simulate successful authentication
      (authService as jest.Mock).mockResolvedValue(expectedUser);

      await authenticate(req as Request, res as Response);

      // Verify that the response returned a 200 status and the expected user object
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(expectedUser);
    });

    // Test authentication failure when user credentials are incorrect
    it('should return 400 if authentication fails', async () => {
      req.body = { username: 'testuser', password: 'password123' };

      // Setup authService mock to simulate failed authentication (returning undefined)
      (authService as jest.Mock).mockResolvedValue(undefined);

      await authenticate(req as Request, res as Response);

      // Verify that the controller returns a 400 status with the proper error message
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to authenticate user' });
    });

    // Test error handling when the request is invalid
    it('should return 400 if there is an error in request', async () => {
      req.body = {}; // Invalid body to trigger parse error

      // Spy on authenticateSchema.parse to force an error
      const parseSpy = jest.spyOn(authenticateSchema, 'parse').mockImplementation(() => {
        throw new Error('Invalid request');
      });

      await authenticate(req as Request, res as Response);

      // Verify that the controller returns a 400 status and correct error message
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid request' });

      // Restore the original implementation
      parseSpy.mockRestore();
    });
  });
});
