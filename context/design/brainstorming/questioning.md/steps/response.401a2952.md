---
timestamp: 'Tue Oct 14 2025 01:15:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_011505.8afc0cc7.md]]'
content_id: 401a2952f062f30c8fa5555baf135df2a79429ddf3ee363bc7a16f01d944780b
---

# response:

To implement the `passwordAuth` concept in TypeScript, I'll follow the principles outlined in `implementing-concepts.md`, focusing on modularity, clear interfaces, testability, and robust error handling. The `passwordAuth.md` (as inferred from common authentication requirements) will guide the core functionalities: user registration, login, and password changes, with strong emphasis on security (password hashing). Finally, `testing-concepts.md` will inform the structure and approach for the accompanying tests.

Here's the detailed implementation:

***

### Implementation Design

1. **Core Service**: `PasswordAuthService` will orchestrate the authentication logic.
2. **Dependencies (Injected via Interfaces)**:
   * `IPasswordHasher`: Responsible for hashing and comparing passwords securely (e.g., using bcrypt). This abstracts the hashing algorithm.
   * `IUserCredentialStore`: Handles persistent storage and retrieval of user credentials (ID, username, password hash). This abstracts the data layer (e.g., database, in-memory).
   * `IPasswordPolicy`: Defines and validates password complexity rules. This abstracts the policy enforcement.
3. **Data Model**: `UserCredentials` interface to represent stored user data.
4. **Error Handling**: Custom error classes derived from `AuthenticationError` for specific failure scenarios.

***

### Code Structure

```
src/
└── passwordAuth/
    ├── interfaces.ts          // Defines shared interfaces (IPasswordHasher, IUserCredentialStore, IPasswordPolicy, UserCredentials)
    ├── errors.ts              // Custom error classes
    ├── implementations/
    │   ├── BcryptPasswordHasher.ts    // Concrete implementation of IPasswordHasher using bcrypt
    │   ├── InMemoryUserCredentialStore.ts // Concrete implementation of IUserCredentialStore for in-memory storage
    │   └── DefaultPasswordPolicy.ts   // Concrete implementation of IPasswordPolicy with default rules
    └── PasswordAuthService.ts // The core service orchestrating the concept
```

***

### 1. `src/passwordAuth/interfaces.ts`

```typescript
import { UUID } from 'crypto'; // For UUID typing, though `string` is used in implementation.

/**
 * Represents the essential user credentials stored for authentication.
 */
export interface UserCredentials {
    id: string; // A unique identifier for the user (e.g., UUID)
    username: string; // The unique username used for login
    passwordHash: string; // The hashed password (including salt if part of the hash, like with bcrypt)
}

/**
 * Interface for a password hashing mechanism.
 */
export interface IPasswordHasher {
    /**
     * Hashes a plain-text password using a secure algorithm.
     * @param password The plain-text password.
     * @returns A promise that resolves with the hashed password string.
     */
    hash(password: string): Promise<string>;

    /**
     * Compares a plain-text password with a stored hashed password.
     * @param password The plain-text password to compare.
     * @param hashedPassword The stored hashed password.
     * @returns A promise that resolves to true if passwords match, false otherwise.
     */
    compare(password: string, hashedPassword: string): Promise<boolean>;
}

/**
 * Interface for storing and retrieving user credentials.
 * This abstracts away the database or any other storage mechanism.
 */
export interface IUserCredentialStore {
    /**
     * Finds user credentials by their username.
     * @param username The username to search for.
     * @returns A promise that resolves with UserCredentials if found, null otherwise.
     */
    findByUsername(username: string): Promise<UserCredentials | null>;

    /**
     * Finds user credentials by their unique ID.
     * @param userId The ID to search for.
     * @returns A promise that resolves with UserCredentials if found, null otherwise.
     */
    findById(userId: string): Promise<UserCredentials | null>;

    /**
     * Saves new user credentials to the store.
     * @param userCredentials The credentials to save. An ID will be generated if not provided.
     * @returns A promise that resolves when credentials are saved.
     * @throws UsernameTakenError if the username already exists.
     */
    save(userCredentials: UserCredentials): Promise<void>;

    /**
     * Updates the password hash for a given user ID.
     * @param userId The ID of the user whose password hash needs to be updated.
     * @param newPasswordHash The new hashed password.
     * @returns A promise that resolves when the update is complete.
     * @throws UserNotFoundError if the user with the given ID is not found.
     */
    updatePasswordHash(userId: string, newPasswordHash: string): Promise<void>;
}

/**
 * Interface for defining and validating password complexity rules.
 */
export interface IPasswordPolicy {
    /**
     * Validates a password against defined complexity rules.
     * @param password The password to validate.
     * @returns An array of error messages if the password is invalid, or an empty array if valid.
     */
    validate(password: string): string[];
}
```

### 2. `src/passwordAuth/errors.ts`

```typescript
/**
 * Base class for all authentication-related errors.
 */
export class AuthenticationError extends Error {
    constructor(message: string = "An authentication error occurred.") {
        super(message);
        this.name = 'AuthenticationError';
        // Set the prototype explicitly for custom error types
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

/**
 * Error thrown when a provided password does not meet complexity requirements.
 */
export class InvalidPasswordError extends AuthenticationError {
    constructor(message: string = "Password does not meet complexity requirements.") {
        super(message);
        this.name = 'InvalidPasswordError';
        Object.setPrototypeOf(this, InvalidPasswordError.prototype);
    }
}

/**
 * Error thrown when an attempt is made to register with a username that is already in use.
 */
export class UsernameTakenError extends AuthenticationError {
    constructor(username: string) {
        super(`Username '${username}' is already taken.`);
        this.name = 'UsernameTakenError';
        Object.setPrototypeOf(this, UsernameTakenError.prototype);
    }
}

/**
 * Error thrown when a user cannot be found by their identifier (username or ID).
 */
export class UserNotFoundError extends AuthenticationError {
    constructor(identifier: string) {
        super(`User with identifier '${identifier}' not found.`);
        this.name = 'UserNotFoundError';
        Object.setPrototypeOf(this, UserNotFoundError.prototype);
    }
}

/**
 * Error thrown when login credentials (username/password) are incorrect.
 */
export class InvalidCredentialsError extends AuthenticationError {
    constructor(message: string = "Invalid username or password.") {
        super(message);
        this.name = 'InvalidCredentialsError';
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}
```

### 3. `src/passwordAuth/implementations/BcryptPasswordHasher.ts`

Requires `bcrypt` package: `npm install bcrypt @types/bcrypt`

```typescript
import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '../interfaces';

const DEFAULT_SALT_ROUNDS = 10; // A good balance between security and performance

/**
 * Concrete implementation of IPasswordHasher using the bcrypt algorithm.
 */
export class BcryptPasswordHasher implements IPasswordHasher {
    private readonly saltRounds: number;

    constructor(saltRounds: number = DEFAULT_SALT_ROUNDS) {
        if (saltRounds < 4 || saltRounds > 31) {
            console.warn(`Bcrypt salt rounds of ${saltRounds} are outside the recommended range (4-31).`);
        }
        this.saltRounds = saltRounds;
    }

    /**
     * Hashes a plain-text password using bcrypt.
     * @param password The plain-text password.
     * @returns A promise that resolves with the bcrypt hashed password.
     */
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Compares a plain-text password with a bcrypt hashed password.
     * @param password The plain-text password to compare.
     * @param hashedPassword The bcrypt hashed password.
     * @returns A promise that resolves to true if passwords match, false otherwise.
     */
    async compare(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            // Handle cases where hashedPassword might be invalid (e.g., malformed, not bcrypt hash)
            // bcrypt.compare throws an error for invalid hashes rather than returning false.
            console.error("Error during bcrypt comparison, likely due to invalid hash:", error);
            return false;
        }
    }
}
```

### 4. `src/passwordAuth/implementations/InMemoryUserCredentialStore.ts`

Requires `uuid` package: `npm install uuid @types/uuid`

```typescript
import { IUserCredentialStore, UserCredentials } from '../interfaces';
import { UsernameTakenError, UserNotFoundError } from '../errors';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

/**
 * Concrete implementation of IUserCredentialStore using in-memory Maps.
 * Useful for testing or simple applications without a persistent database.
 */
export class InMemoryUserCredentialStore implements IUserCredentialStore {
    private users: Map<string, UserCredentials> = new Map(); // Stores users by their ID
    private usernameIndex: Map<string, string> = new Map(); // Maps username to user ID for quick lookup

    /**
     * Finds user credentials by username.
     * @param username The username to search for.
     * @returns UserCredentials if found, null otherwise.
     */
    async findByUsername(username: string): Promise<UserCredentials | null> {
        const userId = this.usernameIndex.get(username);
        return userId ? (this.users.get(userId) || null) : null;
    }

    /**
     * Finds user credentials by ID.
     * @param userId The ID to search for.
     * @returns UserCredentials if found, null otherwise.
     */
    async findById(userId: string): Promise<UserCredentials | null> {
        return this.users.get(userId) || null;
    }

    /**
     * Saves new user credentials. Generates a new ID if not provided.
     * @param userCredentials The credentials to save.
     * @throws UsernameTakenError if the username already exists.
     */
    async save(userCredentials: UserCredentials): Promise<void> {
        if (this.usernameIndex.has(userCredentials.username)) {
            throw new UsernameTakenError(userCredentials.username);
        }

        const id = userCredentials.id || uuidv4(); // Generate UUID if ID is not provided
        const credentialsToSave: UserCredentials = { ...userCredentials, id }; // Ensure ID is set

        this.users.set(credentialsToSave.id, credentialsToSave);
        this.usernameIndex.set(credentialsToSave.username, credentialsToSave.id);
    }

    /**
     * Updates the password hash for a given user ID.
     * @param userId The ID of the user whose password hash needs to be updated.
     * @param newPasswordHash The new hashed password.
     * @throws UserNotFoundError if the user is not found.
     */
    async updatePasswordHash(userId: string, newPasswordHash: string): Promise<void> {
        const user = this.users.get(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }
        // Create a new object to ensure reactivity if consumer is observing state directly
        // (though in-memory map directly updates by reference if user is an object).
        const updatedUser: UserCredentials = { ...user, passwordHash: newPasswordHash };
        this.users.set(userId, updatedUser);
    }

    /**
     * Clears all users from the in-memory store.
     * Primarily useful for resetting state in tests.
     */
    clear(): void {
        this.users.clear();
        this.usernameIndex.clear();
    }
}
```

### 5. `src/passwordAuth/implementations/DefaultPasswordPolicy.ts`

```typescript
import { IPasswordPolicy } from '../interfaces';

/**
 * Concrete implementation of IPasswordPolicy with common password complexity rules.
 */
export class DefaultPasswordPolicy implements IPasswordPolicy {
    private minLength: number;
    private requireUppercase: boolean;
    private requireLowercase: boolean;
    private requireDigit: boolean;
    private requireSpecialChar: boolean;

    constructor(
        minLength: number = 8,
        requireUppercase: boolean = true,
        requireLowercase: boolean = true,
        requireDigit: boolean = true,
        requireSpecialChar: boolean = true
    ) {
        this.minLength = minLength;
        this.requireUppercase = requireUppercase;
        this.requireLowercase = requireLowercase;
        this.requireDigit = requireDigit;
        this.requireSpecialChar = requireSpecialChar;
    }

    /**
     * Validates a password against the configured policy rules.
     * @param password The password string to validate.
     * @returns An array of string error messages. If the array is empty, the password is valid.
     */
    validate(password: string): string[] {
        const errors: string[] = [];

        if (password.length < this.minLength) {
            errors.push(`Password must be at least ${this.minLength} characters long.`);
        }
        if (this.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter.');
        }
        if (this.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter.');
        }
        if (this.requireDigit && !/\d/.test(password)) {
            errors.push('Password must contain at least one digit.');
        }
        // Regex for common special characters: !@#$%^&*()_+-=[]{};':"|,.<>/?`~
        if (this.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?`~]/.test(password)) {
            errors.push('Password must contain at least one special character (e.g., !@#$%^&*).');
        }

        return errors;
    }
}
```

### 6. `src/passwordAuth/PasswordAuthService.ts`

```typescript
import { IPasswordHasher, IUserCredentialStore, IPasswordPolicy, UserCredentials } from './interfaces';
import {
    InvalidPasswordError,
    UsernameTakenError,
    UserNotFoundError,
    InvalidCredentialsError,
    AuthenticationError
} from './errors';
import { v4 as uuidv4 } from 'uuid'; // Used for generating user IDs if store doesn't handle it

/**
 * The core Password Authentication Service.
 * This service orchestrates user registration, login, and password changes
 * by leveraging injected dependencies for hashing, storage, and policy enforcement.
 */
export class PasswordAuthService {
    private passwordHasher: IPasswordHasher;
    private userCredentialStore: IUserCredentialStore;
    private passwordPolicy: IPasswordPolicy;

    constructor(
        passwordHasher: IPasswordHasher,
        userCredentialStore: IUserCredentialStore,
        passwordPolicy: IPasswordPolicy
    ) {
        this.passwordHasher = passwordHasher;
        this.userCredentialStore = userCredentialStore;
        this.passwordPolicy = passwordPolicy;
    }

    /**
     * Registers a new user with a unique username and a password that meets policy requirements.
     * @param username The desired username for the new user.
     * @param password The desired password for the new user.
     * @returns A promise that resolves with the ID of the newly registered user.
     * @throws InvalidPasswordError if the password does not meet the configured policy.
     * @throws UsernameTakenError if the provided username is already in use.
     * @throws AuthenticationError for any other unexpected errors during registration.
     */
    public async register(username: string, password: string): Promise<string> {
        // 1. Validate password against policy
        const policyErrors = this.passwordPolicy.validate(password);
        if (policyErrors.length > 0) {
            throw new InvalidPasswordError(policyErrors.join(' '));
        }

        // 2. Check if username already exists
        const existingUser = await this.userCredentialStore.findByUsername(username);
        if (existingUser) {
            throw new UsernameTakenError(username);
        }

        try {
            // 3. Hash the password
            const hashedPassword = await this.passwordHasher.hash(password);

            // 4. Create new user credentials
            const newUser: UserCredentials = {
                id: uuidv4(), // Generate a unique ID for the new user
                username,
                passwordHash: hashedPassword,
            };

            // 5. Store the new user credentials
            await this.userCredentialStore.save(newUser);
            return newUser.id;
        } catch (error) {
            // Re-throw specific errors that the store might throw (e.g., if a race condition leads to UsernameTakenError)
            if (error instanceof UsernameTakenError) {
                throw error;
            }
            // Catch and wrap other unexpected errors during the process
            throw new AuthenticationError(`Failed to register user: ${(error as Error).message}`);
        }
    }

    /**
     * Authenticates a user by verifying their username and password.
     * @param username The user's username.
     * @param password The user's plain-text password.
     * @returns A promise that resolves with the ID of the authenticated user.
     * @throws InvalidCredentialsError if the username or password do not match.
     * @throws AuthenticationError for any other unexpected errors during login.
     */
    public async login(username: string, password: string): Promise<string> {
        // 1. Retrieve user credentials by username
        const user = await this.userCredentialStore.findByUsername(username);
        if (!user) {
            throw new InvalidCredentialsError(); // User not found, hide specific details for security
        }

        try {
            // 2. Compare the provided password with the stored hash
            const isPasswordValid = await this.passwordHasher.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new InvalidCredentialsError(); // Password mismatch
            }

            return user.id; // Authentication successful
        } catch (error) {
            // Wrap any unexpected errors from the hasher (e.g., malformed hash)
            throw new AuthenticationError(`Failed to log in user: ${(error as Error).message}`);
        }
    }

    /**
     * Allows a user to change their password, after verifying the old password.
     * The new password must also meet the configured policy requirements.
     * @param userId The ID of the user whose password is to be changed.
     * @param oldPassword The user's current plain-text password.
     * @param newPassword The desired new plain-text password.
     * @returns A promise that resolves to true if the password was successfully changed.
     * @throws UserNotFoundError if the user with the given ID does not exist.
     * @throws InvalidCredentialsError if the old password provided does not match the stored password.
     * @throws InvalidPasswordError if the new password does not meet the configured policy.
     * @throws AuthenticationError for any other unexpected errors during password change.
     */
    public async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
        // 1. Retrieve user credentials by ID
        const user = await this.userCredentialStore.findById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        try {
            // 2. Verify the old password
            const isOldPasswordValid = await this.passwordHasher.compare(oldPassword, user.passwordHash);
            if (!isOldPasswordValid) {
                throw new InvalidCredentialsError("Old password does not match.");
            }
        } catch (error) {
            throw new AuthenticationError(`Error verifying old password: ${(error as Error).message}`);
        }

        // 3. Validate the new password against policy
        const policyErrors = this.passwordPolicy.validate(newPassword);
        if (policyErrors.length > 0) {
            throw new InvalidPasswordError(policyErrors.join(' '));
        }

        try {
            // 4. Hash the new password
            const newHashedPassword = await this.passwordHasher.hash(newPassword);

            // 5. Update the user's password hash in the store
            await this.userCredentialStore.updatePasswordHash(userId, newHashedPassword);
            return true; // Password changed successfully
        } catch (error) {
            throw new AuthenticationError(`Failed to change password: ${(error as Error).message}`);
        }
    }
}
```

***

### Setup for Running the Code:

1. **Project Initialization**:
   ```bash
   mkdir scriblit_backend
   cd scriblit_backend
   npm init -y
   ```

2. **Install Dependencies**:
   ```bash
   npm install typescript ts-node bcrypt uuid @types/bcrypt @types/uuid
   npm install --save-dev jest @types/jest ts-jest
   ```

3. **Configure TypeScript (`tsconfig.json`)**:
   ```json
   {
     "compilerOptions": {
       "target": "es2018",
       "module": "commonjs",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true
     },
     "include": ["src/**/*.ts"],
     "exclude": ["node_modules", "dist"]
   }
   ```

4. **Configure Jest (`jest.config.js`)**:
   ```javascript
   /** @type {import('ts-jest').JestConfigWithTsJest} */
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.test.ts'],
     coverageDirectory: './coverage',
     coveragePathIgnorePatterns: [
       '/node_modules/',
       '/__tests__/'
     ]
   };
   ```

5. **Add scripts to `package.json`**:
   ```json
   {
     "name": "scriblit_backend",
     "version": "1.0.0",
     "description": "",
     "main": "index.js",
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "build": "tsc"
     },
     "keywords": [],
     "author": "",
     "license": "ISC",
     "dependencies": {
       "bcrypt": "^5.1.1",
       "uuid": "^9.0.1"
     },
     "devDependencies": {
       "@types/bcrypt": "^5.0.2",
       "@types/jest": "^29.5.12",
       "@types/uuid": "^9.0.8",
       "jest": "^29.7.0",
       "ts-jest": "^29.1.2",
       "ts-node": "^10.9.2",
       "typescript": "^5.3.3"
     }
   }
   ```

***

### Tests

Tests are structured to cover each component individually (unit tests) and then the `PasswordAuthService` with mocked dependencies to ensure its logic is sound (integration-style for the service, but still technically unit tests for the service itself because dependencies are mocked).

Create a `src/passwordAuth/__tests__/` directory.

### 1. `src/passwordAuth/__tests__/BcryptPasswordHasher.test.ts`

```typescript
import { BcryptPasswordHasher } from '../implementations/BcryptPasswordHasher';

describe('BcryptPasswordHasher', () => {
    let hasher: BcryptPasswordHasher;
    const testPassword = 'MySecurePassword123!';

    // Use a low salt round for faster tests, typically 10-12 in production
    beforeAll(() => {
        hasher = new BcryptPasswordHasher(4);
    });

    it('should hash a password successfully and return a string different from the input', async () => {
        const hashedPassword = await hasher.hash(testPassword);
        expect(typeof hashedPassword).toBe('string');
        expect(hashedPassword.length).toBeGreaterThan(0);
        expect(hashedPassword).not.toBe(testPassword); // Hashed password should not be plain text
        expect(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2y$')).toBe(true); // Standard bcrypt prefix
    });

    it('should compare a correct password successfully', async () => {
        const hashedPassword = await hasher.hash(testPassword);
        const result = await hasher.compare(testPassword, hashedPassword);
        expect(result).toBe(true);
    });

    it('should fail comparison for an incorrect password', async () => {
        const hashedPassword = await hasher.hash(testPassword);
        const result = await hasher.compare('WrongPassword', hashedPassword);
        expect(result).toBe(false);
    });

    it('should fail comparison for an invalid (non-bcrypt) hash', async () => {
        const result = await hasher.compare(testPassword, 'thisisnotavalidhash');
        expect(result).toBe(false); // bcrypt.compare typically throws, but our wrapper handles it
    });

    it('should generate different hashes for the same password due to salting', async () => {
        const hash1 = await hasher.hash(testPassword);
        const hash2 = await hasher.hash(testPassword);
        expect(hash1).not.toBe(hash2);
    });
});
```

### 2. `src/passwordAuth/__tests__/InMemoryUserCredentialStore.test.ts`

```typescript
import { InMemoryUserCredentialStore } from '../implementations/InMemoryUserCredentialStore';
import { UserCredentials } from '../interfaces';
import { UsernameTakenError, UserNotFoundError } from '../errors';

describe('InMemoryUserCredentialStore', () => {
    let store: InMemoryUserCredentialStore;

    beforeEach(() => {
        store = new InMemoryUserCredentialStore();
        store.clear(); // Ensure a clean state for each test
    });

    it('should save and find user credentials by username', async () => {
        const user: UserCredentials = {
            id: 'user1',
            username: 'testuser',
            passwordHash: 'hashedpassword123'
        };
        await store.save(user);

        const foundUser = await store.findByUsername('testuser');
        expect(foundUser).toEqual(user);
    });

    it('should save and find user credentials by id', async () => {
        const user: UserCredentials = {
            id: 'user1',
            username: 'testuser',
            passwordHash: 'hashedpassword123'
        };
        await store.save(user);

        const foundUser = await store.findById('user1');
        expect(foundUser).toEqual(user);
    });

    it('should return null if user not found by username', async () => {
        const foundUser = await store.findByUsername('nonexistent');
        expect(foundUser).toBeNull();
    });

    it('should return null if user not found by id', async () => {
        const foundUser = await store.findById('nonexistent');
        expect(foundUser).toBeNull();
    });

    it('should throw UsernameTakenError if username already exists during save', async () => {
        const user1: UserCredentials = { id: 'user1', username: 'testuser', passwordHash: 'hash1' };
        const user2: UserCredentials = { id: 'user2', username: 'testuser', passwordHash: 'hash2' }; // Same username

        await store.save(user1);
        await expect(store.save(user2)).rejects.toThrow(UsernameTakenError);
    });

    it('should update password hash for an existing user', async () => {
        const user: UserCredentials = { id: 'user1', username: 'testuser', passwordHash: 'oldhash' };
        await store.save(user);

        const newHash = 'newhashedpassword';
        await store.updatePasswordHash('user1', newHash);

        const updatedUser = await store.findById('user1');
        expect(updatedUser?.passwordHash).toBe(newHash);
        expect(updatedUser?.username).toBe(user.username); // Other fields should remain unchanged
    });

    it('should throw UserNotFoundError if updating password for non-existent user', async () => {
        await expect(store.updatePasswordHash('nonexistent', 'newhash')).rejects.toThrow(UserNotFoundError);
    });

    it('should generate an ID if not provided during save', async () => {
        const user: UserCredentials = { id: '', username: 'testuserNoId', passwordHash: 'hash' };
        await store.save(user);
        expect(user.id).toBe(''); // Original object won't be modified by store, copy used
        const foundUser = await store.findByUsername('testuserNoId');
        expect(foundUser?.id).toBeDefined();
        expect(foundUser?.id).not.toBe('');
    });
});
```

### 3. `src/passwordAuth/__tests__/DefaultPasswordPolicy.test.ts`

```typescript
import { DefaultPasswordPolicy } from '../implementations/DefaultPasswordPolicy';

describe('DefaultPasswordPolicy', () => {
    let policy: DefaultPasswordPolicy;

    // Default policy: min 8 chars, uppercase, lowercase, digit, special char
    beforeEach(() => {
        policy = new DefaultPasswordPolicy();
    });

    it('should return an empty array for a valid password meeting all default requirements', () => {
        const validPassword = 'PassworD123!';
        const errors = policy.validate(validPassword);
        expect(errors).toEqual([]);
    });

    it('should report error for password too short', () => {
        const password = 'Short1!'; // 7 chars, minLength is 8
        const errors = policy.validate(password);
        expect(errors).toContain('Password must be at least 8 characters long.');
        expect(errors.length).toBe(1); // Only length error for this specific case
    });

    it('should report error for missing uppercase letter', () => {
        const password = 'password123!';
        const errors = policy.validate(password);
        expect(errors).toContain('Password must contain at least one uppercase letter.');
    });

    it('should report error for missing lowercase letter', () => {
        const password = 'PASSWORD123!';
        const errors = policy.validate(password);
        expect(errors).toContain('Password must contain at least one lowercase letter.');
    });

    it('should report error for missing digit', () => {
        const password = 'PasswordXYZ!';
        const errors = policy.validate(password);
        expect(errors).toContain('Password must contain at least one digit.');
    });

    it('should report error for missing special character', () => {
        const password = 'Password123';
        const errors = policy.validate(password);
        expect(errors).toContain('Password must contain at least one special character (e.g., !@#$%^&*).');
    });

    it('should report multiple errors for a very weak password', () => {
        const password = 'short';
        const errors = policy.validate(password);
        expect(errors.length).toBeGreaterThan(1);
        expect(errors).toContain('Password must be at least 8 characters long.');
        expect(errors).toContain('Password must contain at least one uppercase letter.');
        expect(errors).toContain('Password must contain at least one digit.');
        expect(errors).toContain('Password must contain at least one special character (e.g., !@#$%^&*).');
    });

    it('should allow less strict policies when configured', () => {
        const lenientPolicy = new DefaultPasswordPolicy(5, false, false, false, false);
        const password = 'abcde'; // 5 chars, no other requirements
        const errors = lenientPolicy.validate(password);
        expect(errors).toEqual([]);
    });

    it('should allow a password that meets a custom, less strict policy', () => {
        const customPolicy = new DefaultPasswordPolicy(6, true, false, true, false); // Min 6, require uppercase, digit
        const password = 'abcD12'; // 6 chars, uppercase, digit, no lowercase or special char requirement
        const errors = customPolicy.validate(password);
        expect(errors).toEqual([]);
    });
});
```

### 4. `src/passwordAuth/__tests__/PasswordAuthService.test.ts`

```typescript
import { PasswordAuthService } from '../PasswordAuthService';
import { IPasswordHasher, IUserCredentialStore, IPasswordPolicy, UserCredentials } from '../interfaces';
import {
    InvalidPasswordError,
    UsernameTakenError,
    UserNotFoundError,
    InvalidCredentialsError,
    AuthenticationError
} from '../errors';

// Mock implementations for dependencies to isolate PasswordAuthService logic
class MockPasswordHasher implements IPasswordHasher {
    async hash(password: string): Promise<string> {
        return `hashed_${password}`; // Simple prefix for predictable mock hashes
    }
    async compare(password: string, hashedPassword: string): Promise<boolean> {
        return `hashed_${password}` === hashedPassword;
    }
}

class MockUserCredentialStore implements IUserCredentialStore {
    private users: Map<string, UserCredentials> = new Map(); // id -> UserCredentials
    private usernameIndex: Map<string, string> = new Map(); // username -> id

    async findByUsername(username: string): Promise<UserCredentials | null> {
        const userId = this.usernameIndex.get(username);
        return userId ? (this.users.get(userId) || null) : null;
    }
    async findById(userId: string): Promise<UserCredentials | null> {
        return this.users.get(userId) || null;
    }
    async save(userCredentials: UserCredentials): Promise<void> {
        if (this.usernameIndex.has(userCredentials.username)) {
            throw new UsernameTakenError(userCredentials.username);
        }
        // In actual implementation, ID might be generated by DB or UUID library.
        // For mock, ensure it has an ID, or generate a predictable one.
        const id = userCredentials.id || `mock-id-${userCredentials.username}`;
        const credentialsToSave = { ...userCredentials, id };
        this.users.set(credentialsToSave.id, credentialsToSave);
        this.usernameIndex.set(credentialsToSave.username, credentialsToSave.id);
    }
    async updatePasswordHash(userId: string, newPasswordHash: string): Promise<void> {
        const user = this.users.get(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }
        this.users.set(userId, { ...user, passwordHash: newPasswordHash });
    }
    clear(): void {
        this.users.clear();
        this.usernameIndex.clear();
    }
}

class MockPasswordPolicy implements IPasswordPolicy {
    // Simple mock policy: password cannot be 'weak'
    validate(password: string): string[] {
        return password === 'weak' ? ['Password is too weak.'] : [];
    }
}

describe('PasswordAuthService', () => {
    let service: PasswordAuthService;
    let mockHasher: MockPasswordHasher;
    let mockStore: MockUserCredentialStore;
    let mockPolicy: MockPasswordPolicy;

    beforeEach(() => {
        mockHasher = new MockPasswordHasher();
        mockStore = new MockUserCredentialStore();
        mockPolicy = new MockPasswordPolicy();
        service = new PasswordAuthService(mockHasher, mockStore, mockPolicy);
        mockStore.clear(); // Ensure store is clean for each test
    });

    describe('register', () => {
        it('should successfully register a new user and return their ID', async () => {
            const userId = await service.register('newuser', 'StrongPassword123!');
            expect(userId).toBeDefined();
            const user = await mockStore.findByUsername('newuser');
            expect(user).toBeDefined();
            expect(user?.username).toBe('newuser');
            expect(user?.passwordHash).toBe('hashed_StrongPassword123!');
        });

        it('should throw InvalidPasswordError if password policy is not met', async () => {
            await expect(service.register('weakuser', 'weak')).rejects.toThrow(InvalidPasswordError);
            await expect(service.register('weakuser', 'weak')).rejects.toThrow('Password is too weak.');
        });

        it('should throw UsernameTakenError if username already exists', async () => {
            await service.register('existinguser', 'SecurePass123!');
            await expect(service.register('existinguser', 'AnotherSecurePass123!')).rejects.toThrow(UsernameTakenError);
            await expect(service.register('existinguser', 'AnotherSecurePass123!')).rejects.toThrow("Username 'existinguser' is already taken.");
        });

        it('should throw AuthenticationError for other internal failures during registration (e.g., store save error)', async () => {
            jest.spyOn(mockStore, 'save').mockRejectedValueOnce(new Error('Database connection failed'));
            await expect(service.register('userWithSaveError', 'SecurePass123!')).rejects.toThrow(AuthenticationError);
            expect(mockStore.save).toHaveBeenCalled();
        });
    });

    describe('login', () => {
        const username = 'testuser';
        const password = 'TestPassword123!';
        let registeredUserId: string;

        beforeEach(async () => {
            registeredUserId = await service.register(username, password);
        });

        it('should successfully log in a registered user and return their ID', async () => {
            const userId = await service.login(username, password);
            expect(userId).toBe(registeredUserId);
        });

        it('should throw InvalidCredentialsError for non-existent username', async () => {
            await expect(service.login('nonexistent', 'AnyPassword')).rejects.toThrow(InvalidCredentialsError);
            await expect(service.login('nonexistent', 'AnyPassword')).rejects.toThrow('Invalid username or password.');
        });

        it('should throw InvalidCredentialsError for incorrect password', async () => {
            await expect(service.login(username, 'WrongPassword')).rejects.toThrow(InvalidCredentialsError);
            await expect(service.login(username, 'WrongPassword')).rejects.toThrow('Invalid username or password.');
        });

        it('should throw AuthenticationError for internal hasher failures during login', async () => {
            jest.spyOn(mockHasher, 'compare').mockRejectedValueOnce(new Error('Hasher internal error'));
            await expect(service.login(username, password)).rejects.toThrow(AuthenticationError);
            expect(mockHasher.compare).toHaveBeenCalled();
        });
    });

    describe('changePassword', () => {
        let userId: string;
        const initialPassword = 'InitialPassword123!';
        const newValidPassword = 'NewStrongPassword456!';

        beforeEach(async () => {
            userId = await service.register('changeuser', initialPassword);
        });

        it('should successfully change a user\'s password', async () => {
            const result = await service.changePassword(userId, initialPassword, newValidPassword);
            expect(result).toBe(true);

            // Verify old password no longer works
            await expect(service.login('changeuser', initialPassword)).rejects.toThrow(InvalidCredentialsError);

            // Verify new password works
            const loggedInUserId = await service.login('changeuser', newValidPassword);
            expect(loggedInUserId).toBe(userId);
        });

        it('should throw UserNotFoundError if user ID does not exist', async () => {
            await expect(service.changePassword('nonexistent-id', initialPassword, newValidPassword)).rejects.toThrow(UserNotFoundError);
            await expect(service.changePassword('nonexistent-id', initialPassword, newValidPassword)).rejects.toThrow("User with identifier 'nonexistent-id' not found.");
        });

        it('should throw InvalidCredentialsError if old password is incorrect', async () => {
            await expect(service.changePassword(userId, 'WrongOldPassword', newValidPassword)).rejects.toThrow(InvalidCredentialsError);
            await expect(service.changePassword(userId, 'WrongOldPassword', newValidPassword)).rejects.toThrow("Old password does not match.");
        });

        it('should throw InvalidPasswordError if new password does not meet policy', async () => {
            await expect(service.changePassword(userId, initialPassword, 'weak')).rejects.toThrow(InvalidPasswordError);
            await expect(service.changePassword(userId, initialPassword, 'weak')).rejects.toThrow('Password is too weak.');
        });

        it('should throw AuthenticationError for internal store update failures', async () => {
            jest.spyOn(mockStore, 'updatePasswordHash').mockRejectedValueOnce(new Error('Store update failed'));
            await expect(service.changePassword(userId, initialPassword, newValidPassword)).rejects.toThrow(AuthenticationError);
            expect(mockStore.updatePasswordHash).toHaveBeenCalled();
        });
    });
});
```
