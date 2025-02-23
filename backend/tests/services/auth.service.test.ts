import { User } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import prisma from '../../src/db';
import { 
    registerService, 
    authService, 
    verifyJwtService,
    signJwt,
    getPublicKey
} from '../../src/services/auth.service';

// Mock dependencies
jest.mock('../../src/db', () => ({
    __esModule: true,
    default: mockDeep()
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn()
}));

// Mock fs with all required functions
jest.mock('fs', () => ({
    readFileSync: jest.fn().mockImplementation((path: string) => {
        if (path.includes('private.pem')) return 'mock-private-key';
        if (path.includes('public.pem')) return 'mock-public-key';
        throw new Error('Unknown file');
    }),
    existsSync: jest.fn().mockReturnValue(true)
}));

// Import after mocks are set up
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Auth Service', () => {
    let prismaMock: DeepMockProxy<typeof prisma>;
    const mockUser: User = {
        id: 'test-user-id',
        username: 'testuser',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    beforeEach(() => {
        prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;
        mockReset(prismaMock);
        jest.clearAllMocks();
    });

    describe('registerService', () => {
        const username = 'newuser';
        const password = 'password123';
        const hashedPassword = 'hashed-password-123';

        beforeEach(() => {
            bcrypt.hash.mockResolvedValue(hashedPassword);
            jwt.sign.mockReturnValue('mock-token');
        });

        it('should register a new user successfully', async () => {
            // Arrange
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                ...mockUser,
                username,
                password: hashedPassword
            });

            // Act
            const result = await registerService(username, password);

            // Assert
            expect(result).toBeDefined();
            expect(result?.username).toBe(username);
            expect(result?.token).toBe('mock-token');
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { username, password: hashedPassword }
            });
        });

        it('should return undefined if username already exists', async () => {
            // Arrange
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            // Act
            const result = await registerService(username, password);

            // Assert
            expect(result).toBeUndefined();
            expect(prismaMock.user.create).not.toHaveBeenCalled();
        });
    });

    describe('authService', () => {
        const username = 'testuser';
        const password = 'password123';

        beforeEach(() => {
            jwt.sign.mockReturnValue('mock-token');
        });

        it('should authenticate user with valid credentials', async () => {
            // Arrange
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

            // Act
            const result = await authService(username, password);

            // Assert
            expect(result).toBeDefined();
            expect(result?.username).toBe(username);
            expect(result?.token).toBe('mock-token');
            expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
        });

        it('should return undefined if user not found', async () => {
            // Arrange
            prismaMock.user.findUnique.mockResolvedValue(null);

            // Act
            const result = await authService(username, password);

            // Assert
            expect(result).toBeUndefined();
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('should return undefined if password is invalid', async () => {
            // Arrange
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            // Act
            const result = await authService(username, password);

            // Assert
            expect(result).toBeUndefined();
            expect(bcrypt.compare).toHaveBeenCalled();
        });
    });

    describe('verifyJwtService', () => {
        const token = 'valid-token';
        const decodedToken = { sub: mockUser.id };

        beforeEach(() => {
            jwt.verify.mockReturnValue(decodedToken);
        });

        it('should verify valid token and return user', async () => {
            // Arrange
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            // Act
            const result = await verifyJwtService(token);

            // Assert
            expect(result).toBeDefined();
            expect(result?.id).toBe(mockUser.id);
            expect(result?.token).toBe(token);
            expect(jwt.verify).toHaveBeenCalledWith(token, 'mock-public-key', { algorithms: ['RS256'] });
        });

        it('should return undefined if user not found after token verification', async () => {
            // Arrange
            prismaMock.user.findUnique.mockResolvedValue(null);

            // Act
            const result = await verifyJwtService(token);

            // Assert
            expect(result).toBeUndefined();
        });

        it('should throw error for invalid token', async () => {
            // Arrange
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            // Act & Assert
            await expect(verifyJwtService(token)).rejects.toThrow('Invalid token');
        });
    });

    describe('signJwt', () => {
        it('should sign JWT with valid user object', () => {
            // Arrange
            const user = { id: 'test-id' };
            jwt.sign.mockReturnValue('signed-token');

            // Act
            const result = signJwt(user);

            // Assert
            expect(result).toBe('signed-token');
            expect(jwt.sign).toHaveBeenCalledWith(
                { sub: user.id },
                'mock-private-key',
                {
                    algorithm: 'RS256',
                    expiresIn: '1h'
                }
            );
        });

        it('should throw error for invalid user object', () => {
            // Arrange
            const invalidUser = { wrongField: 'test' };

            // Act & Assert
            expect(() => signJwt(invalidUser as any)).toThrow('Invalid user object for JWT generation');
        });
    });

    describe('getPublicKey', () => {
        it('should return public key', () => {
            // Act
            const result = getPublicKey();

            // Assert
            expect(result).toBe('mock-public-key');
        });
    });
});
