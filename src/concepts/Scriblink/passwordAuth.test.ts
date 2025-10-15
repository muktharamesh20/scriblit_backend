import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts"; // Assuming this path is correct based on the example
import { ID } from "@utils/types.ts"; // Assuming this path is correct
import PasswordAuthConcept from "./passwordAuth.ts"; // Path to the concept file

// Define constants for test usernames and passwords
const usernameAlice = "alice_wonderland";
const passwordAlice = "MyStrongPassword123!";
const usernameBob = "bob_the_builder";
const passwordBob = "BuildingBlocks@2024";
const wrongPassword = "TotallyIncorrectPassword";
const nonExistentUsername = "unknown_user_123";

Deno.test("Principle: After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user.", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    // 1. Register Alice with a username and password
    const registerResult = await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in registerResult,
      true,
      "Registration should succeed.",
    );
    const { user: aliceId } = registerResult as { user: ID };
    assertExists(aliceId, "Registered user should have a unique ID.");

    // 2. Authenticate Alice with the correct username and password
    const authResult1 = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in authResult1,
      true,
      "Authentication with correct credentials should succeed.",
    );
    const { user: authenticatedAliceId } = authResult1 as { user: ID };
    assertEquals(
      authenticatedAliceId,
      aliceId,
      "Authenticated user ID should match the registered user's ID.",
    );

    // 3. Attempt to authenticate Alice with an incorrect password
    const authResult2 = await passwordAuth.authenticate({
      username: usernameAlice,
      password: wrongPassword,
    });
    assertEquals(
      "error" in authResult2,
      true,
      "Authentication with incorrect password should fail.",
    );
    assertEquals(
      (authResult2 as { error: string }).error,
      "Invalid username or password.",
      "Error message for wrong password should be correct.",
    );

    // 4. Attempt to authenticate with a non-existent username
    const authResult3 = await passwordAuth.authenticate({
      username: nonExistentUsername,
      password: "any_password",
    });
    assertEquals(
      "error" in authResult3,
      true,
      "Authentication with non-existent username should fail.",
    );
    assertEquals(
      (authResult3 as { error: string }).error,
      "Invalid username or password.",
      "Error message for non-existent user should be correct.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: register - requires the provided username must not already exist in the system.", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    // 1. Register Alice successfully the first time
    const registerResult1 = await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in registerResult1,
      true,
      "First registration should succeed.",
    );
    assertExists(
      (registerResult1 as { user: ID }).user,
      "User ID should be returned.",
    );

    // 2. Attempt to register Alice again with the same username
    const registerResult2 = await passwordAuth.register({
      username: usernameAlice,
      password: "aDifferentPassword", // Password doesn't matter, username is the unique key
    });
    assertEquals(
      "error" in registerResult2,
      true,
      "Second registration with the same username should fail.",
    );
    assertEquals(
      (registerResult2 as { error: string }).error,
      `Username '${usernameAlice}' already exists.`,
      "Error message for duplicate username should be correct.",
    );

    // Verify that the original user can still authenticate
    const authResult = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in authResult,
      true,
      "Original user should still be able to authenticate.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: authenticate - ensures multiple users can be registered and authenticated independently", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    // 1. Register Alice
    const registerAlice = await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });
    const { user: aliceId } = registerAlice as { user: ID };

    // 2. Register Bob
    const registerBob = await passwordAuth.register({
      username: usernameBob,
      password: passwordBob,
    });
    const { user: bobId } = registerBob as { user: ID };

    assertNotEquals(
      aliceId,
      bobId,
      "User IDs for different users should be distinct.",
    );

    // 3. Authenticate Alice successfully
    const authAlice = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in authAlice,
      true,
      "Alice's authentication should succeed.",
    );
    assertEquals(
      (authAlice as { user: ID }).user,
      aliceId,
      "Alice's authenticated ID should match.",
    );

    // 4. Authenticate Bob successfully
    const authBob = await passwordAuth.authenticate({
      username: usernameBob,
      password: passwordBob,
    });
    assertNotEquals(
      "error" in authBob,
      true,
      "Bob's authentication should succeed.",
    );
    assertEquals(
      (authBob as { user: ID }).user,
      bobId,
      "Bob's authenticated ID should match.",
    );

    // 5. Try to authenticate Alice with Bob's password
    const authAliceWithBobPass = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordBob,
    });
    assertEquals(
      "error" in authAliceWithBobPass,
      true,
      "Alice cannot authenticate with Bob's password.",
    );

    // 6. Try to authenticate Bob with Alice's password
    const authBobWithAlicePass = await passwordAuth.authenticate({
      username: usernameBob,
      password: passwordAlice,
    });
    assertEquals(
      "error" in authBobWithAlicePass,
      true,
      "Bob cannot authenticate with Alice's password.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: authenticate - requires the username and password combination to exactly match", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    // Register Alice
    await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });

    // Case 1: Incorrect password for an existing username
    const result1 = await passwordAuth.authenticate({
      username: usernameAlice,
      password: wrongPassword,
    });
    assertEquals(
      "error" in result1,
      true,
      "Authentication with wrong password should fail.",
    );
    assertEquals(
      (result1 as { error: string }).error,
      "Invalid username or password.",
    );

    // Case 2: Non-existent username
    const result2 = await passwordAuth.authenticate({
      username: nonExistentUsername,
      password: passwordAlice, // Password doesn't matter here
    });
    assertEquals(
      "error" in result2,
      true,
      "Authentication with non-existent username should fail.",
    );
    assertEquals(
      (result2 as { error: string }).error,
      "Invalid username or password.",
    );

    // Case 3: Correct credentials
    const result3 = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in result3,
      true,
      "Authentication with correct credentials should succeed.",
    );
  } finally {
    await client.close();
  }
});
