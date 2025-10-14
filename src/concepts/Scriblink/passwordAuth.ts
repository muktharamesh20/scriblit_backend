import {
  IPasswordHasher,
  IPasswordPolicy,
  IUserCredentialStore,
  UserCredentials,
} from "./interfaces";
import {
  AuthenticationError,
  InvalidCredentialsError,
  InvalidPasswordError,
  UsernameTakenError,
  UserNotFoundError,
} from "./errors";
import { v4 as uuidv4 } from "uuid"; // Used for generating user IDs if store doesn't handle it

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
    passwordPolicy: IPasswordPolicy,
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
      throw new InvalidPasswordError(policyErrors.join(" "));
    }

    // 2. Check if username already exists
    const existingUser = await this.userCredentialStore.findByUsername(
      username,
    );
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
      throw new AuthenticationError(
        `Failed to register user: ${(error as Error).message}`,
      );
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
      const isPasswordValid = await this.passwordHasher.compare(
        password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new InvalidCredentialsError(); // Password mismatch
      }

      return user.id; // Authentication successful
    } catch (error) {
      // Wrap any unexpected errors from the hasher (e.g., malformed hash)
      throw new AuthenticationError(
        `Failed to log in user: ${(error as Error).message}`,
      );
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
  public async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    // 1. Retrieve user credentials by ID
    const user = await this.userCredentialStore.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    try {
      // 2. Verify the old password
      const isOldPasswordValid = await this.passwordHasher.compare(
        oldPassword,
        user.passwordHash,
      );
      if (!isOldPasswordValid) {
        throw new InvalidCredentialsError("Old password does not match.");
      }
    } catch (error) {
      throw new AuthenticationError(
        `Error verifying old password: ${(error as Error).message}`,
      );
    }

    // 3. Validate the new password against policy
    const policyErrors = this.passwordPolicy.validate(newPassword);
    if (policyErrors.length > 0) {
      throw new InvalidPasswordError(policyErrors.join(" "));
    }

    try {
      // 4. Hash the new password
      const newHashedPassword = await this.passwordHasher.hash(newPassword);

      // 5. Update the user's password hash in the store
      await this.userCredentialStore.updatePasswordHash(
        userId,
        newHashedPassword,
      );
      return true; // Password changed successfully
    } catch (error) {
      throw new AuthenticationError(
        `Failed to change password: ${(error as Error).message}`,
      );
    }
  }
}
