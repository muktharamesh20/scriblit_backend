import { Collection, Db } from "npm:mongodb";
import jwt from "npm:jsonwebtoken";
import "jsr:@std/dotenv/load";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

const PREFIX = "PasswordAuth" + ".";
type User = ID;

const JWT_SECRET = Deno.env.get("JWT_SECRET") ||
  "test";
const ACCESS_TOKEN_EXPIRES_IN = "1m";
const REFRESH_TOKEN_EXPIRES_IN = "1m";

interface AuthUserDocument {
  _id: User;
  username: string;
  passwordHash: string;
}

async function hashPassword(password: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function comparePassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

function generateAccessToken(userId: User, username: string): string {
  return jwt.sign({ userId, username, type: "access" }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function generateRefreshToken(userId: User, username: string): string {
  return jwt.sign({ userId, username, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function verifyToken(
  token: string,
): { userId: User; username: string; type: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: User;
      username: string;
      type: string;
    };
  } catch {
    return null;
  }
}

export default class PasswordAuthConcept {
  users: Collection<AuthUserDocument>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: `Username '${username}' already exists.` };
    }

    if (password.trim() === "") {
      return { error: "Password cannot be empty or whitespace." };
    }

    const userId = freshID() as User;
    const passwordHash = await hashPassword(password);

    await this.users.insertOne({
      _id: userId,
      username,
      passwordHash,
    });

    return { user: userId };
  }

  async authenticate(
    { username, password }: { username: string; password: string },
  ): Promise<
    | { accessToken: string; refreshToken: string; user: User }
    | { error: string }
  > {
    const authUser = await this.users.findOne({ username });

    if (!authUser) {
      return { error: "Invalid username or password." };
    }

    const passwordMatches = await comparePassword(
      password,
      authUser.passwordHash,
    );
    if (!passwordMatches) {
      return { error: "Invalid username or password." };
    }

    const accessToken = generateAccessToken(authUser._id, authUser.username);
    const refreshToken = generateRefreshToken(authUser._id, authUser.username);
    return { accessToken, refreshToken, user: authUser._id };
  }

  async refresh(
    { refreshToken }: { refreshToken: string },
  ): Promise<{ accessToken: string; user: User } | { error: string }> {
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== "refresh") {
      return { error: "Invalid or expired refresh token." };
    }

    const authUser = await this.users.findOne({ _id: decoded.userId });
    if (!authUser) {
      return { error: "User not found." };
    }

    const accessToken = generateAccessToken(authUser._id, authUser.username);
    return { accessToken, user: authUser._id };
  }

  /**
   * Query: Verifies an access token and returns the user ID from the token.
   * @param authToken The JWT access token to verify.
   * @returns An array with a single object containing the user ID if token is valid, otherwise an empty array.
   */
  async _getUserFromToken(
    { authToken }: { authToken: string },
  ): Promise<{ user: User }[]> {
    // Strip "Bearer " prefix if present
    const token = authToken.startsWith("Bearer ")
      ? authToken.substring(7)
      : authToken;

    const decoded = verifyToken(token);
    console.log("🔍 Token verification:", {
      hasToken: !!token,
      decoded: decoded ? { userId: decoded.userId, type: decoded.type } : null,
    });

    if (!decoded || decoded.type !== "access") {
      console.log("❌ Token invalid or not access type");
      return [];
    }

    const authUser = await this.users.findOne({ _id: decoded.userId });
    console.log("🔍 User lookup:", {
      userId: decoded.userId,
      found: !!authUser,
    });

    if (!authUser) {
      console.log("❌ User not found in database");
      return [];
    }

    console.log("✅ Token verified, user:", decoded.userId);
    return [{ user: decoded.userId }];
  }
}
