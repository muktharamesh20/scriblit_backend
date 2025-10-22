import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts"; // Assuming @utils/types.ts exists and defines ID and Empty
import { freshID } from "@utils/database.ts"; // Assuming @utils/database.ts exists and defines freshID

// Collection prefix to ensure namespace separation for PasswordAuth
const PREFIX = "PasswordAuth" + ".";

// Generic type for the concept's external representation of a User.
// When PasswordAuth returns a user, it refers to their unique identifier.
type User = ID;

/**
 * Internal entity type for a user document stored in the database.
 * This includes the username and the securely hashed password.
 */
interface AuthUserDocument {
  _id: User; // The unique identifier for the user
  username: string; // The user's chosen username
  passwordHash: string; // The securely hashed password (NEVER store plaintext passwords)
}

/**
 * Helper function to securely hash a plaintext password.
 * IMPORTANT: In a production application, use a strong, asynchronous,
 * salting and adaptive hashing library like bcrypt (e.g., `deno.land/x/bcrypt`).
 * This SHA-256 implementation is for demonstration purposes ONLY and is NOT
 * secure enough for real-world password storage due to lack of salting and
 * computational expense.
 */
async function hashPassword(password: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(password);
  // Using Web Cryptography API for basic hashing demonstration in Deno
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert bytes to hex string
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Helper function to compare a plaintext password with a stored hash.
 * IMPORTANT: Similar to hashPassword, use a proper library for this comparison
 * in production environments.
 */
async function comparePassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

/**
 * @concept PasswordAuth
 * @purpose To limit access to known users by authenticating with username and password.
 * @principle After setting a username and password for a user, the user can
 *   authenticate with that username and password and be treated each time as the same user.
 */
export default class PasswordAuthConcept {
  // The MongoDB collection where user documents (with username and password hash) are stored.
  users: Collection<AuthUserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * Action: Registers a new user in the system.
   * @param username The desired unique username for the new user.
   * @param password The plaintext password for the new user. This will be hashed before storage.  The password must not be empty or whitespace.
   * @requires The provided username must not already exist in the system.
   * @effects A new user document is created in the database with a unique ID,
   *          the given username, and a securely hashed version of the password.
   *          Returns the ID of the newly created user.
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Requirement: the username does not exist
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: `Username '${username}' already exists.` };
    }

    if (password.trim() === "") {
      return { error: "Password cannot be empty or whitespace." };
    }

    const userId = freshID() as User; // Generate a new unique ID for the user
    const passwordHash = await hashPassword(password); // Hash the password for secure storage

    // Effect: create a new user with this username and password hash
    await this.users.insertOne({
      _id: userId,
      username,
      passwordHash,
    });

    return { user: userId }; // Return the ID of the newly registered user
  }

  /**
   * Action: Authenticates a user against the stored credentials.
   * @param username The username provided by the user attempting to authenticate.
   * @param password The plaintext password provided by the user.
   * @requires The username and password combination must exactly match an existing
   *           user's credentials in the system.
   * @effects If successful, the ID of the authenticated user is returned.
   *          If authentication fails (username not found or password incorrect),
   *          an error is returned.
   */
  async authenticate(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    console.log(
      "🔐 [PasswordAuth.authenticate] Attempting authentication for username:",
      username,
    );
    console.log(
      "🔍 [PasswordAuth.authenticate] Password length:",
      password?.length,
      "Password provided:",
      !!password,
    );

    // Find the user document by the provided username
    const authUser = await this.users.findOne({ username });

    console.log("🔍 [PasswordAuth.authenticate] User found:", !!authUser);

    if (!authUser) {
      console.error(
        "❌ [PasswordAuth.authenticate] User not found in database",
      );
      return { error: "Invalid username or password." };
    }

    // If no user is found with that username, or if the provided password
    // does not match the stored hash, authentication fails.
    const passwordMatches = await comparePassword(
      password,
      authUser.passwordHash,
    );
    console.log(
      "🔍 [PasswordAuth.authenticate] Password matches:",
      passwordMatches,
    );

    if (!passwordMatches) {
      console.error("❌ [PasswordAuth.authenticate] Password does not match");
      return { error: "Invalid username or password." };
    }

    // Requirement: the username and password combination exists and matches.
    // Effect: returns the user's ID
    console.log(
      "✅ [PasswordAuth.authenticate] Authentication successful for user:",
      authUser._id,
    );
    return { user: authUser._id };
  }
}
