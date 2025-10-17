import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts"; // Assuming this path is correct based on the example
import { ID } from "@utils/types.ts"; // Assuming this path is correct
import PasswordAuthConcept from "../Scriblink/passwordAuth.ts"; // Path to the concept file

// Define constants for test usernames and passwords
const usernameAlice = "alice_wonderland";
const passwordAlice = "MyStrongPassword123!";
const usernameBob = "bob_the_builder";
const passwordBob = "BuildingBlocks@2024";
const wrongPassword = "TotallyIncorrectPassword";
const nonExistentUsername = "unknown_user_123";

// ============================================================================
// --- OPERATIONAL PRINCIPLE ---
// ============================================================================

Deno.test("Principle: After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user.", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    console.log("\n🔐 OPERATIONAL PRINCIPLE: User Authentication Workflow");
    console.log("=".repeat(60));

    // 1. Register Alice with a username and password
    console.log("\n📝 Step 1: Registering Alice");
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
    console.log("   ✅ Alice registered successfully");

    // 2. Authenticate Alice with the correct username and password
    console.log("\n🔐 Step 2: Authenticating Alice with correct credentials");
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
    console.log(
      "   ✅ Alice authenticated successfully with correct credentials",
    );

    // 3. Attempt to authenticate Alice with an incorrect password
    console.log("\n🔍 Step 3: Testing authentication with wrong password");
    const authResult2 = await passwordAuth.authenticate({
      username: usernameAlice,
      password: wrongPassword,
    });
    assertEquals(
      "error" in authResult2,
      true,
      "Authentication with incorrect password should fail.",
    );
    // Just check that an error occurred, don't check the specific message
    console.log("   ✅ Authentication correctly rejected with wrong password");

    // 4. Attempt to authenticate with a non-existent username
    console.log(
      "\n🔍 Step 4: Testing authentication with non-existent username",
    );
    const authResult3 = await passwordAuth.authenticate({
      username: nonExistentUsername,
      password: "any_password",
    });
    assertEquals(
      "error" in authResult3,
      true,
      "Authentication with non-existent username should fail.",
    );
    // Just check that an error occurred, don't check the specific message
    console.log(
      "   ✅ Authentication correctly rejected with non-existent username",
    );
    console.log("   📊 Final state: Alice can authenticate, others cannot");

    console.log("\n🎉 OPERATIONAL PRINCIPLE COMPLETE");
    console.log("=".repeat(60));
  } finally {
    await client.close();
  }
});

// ============================================================================
// --- GENERAL CONCEPT METHOD TESTING ---
// ============================================================================

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
    // Just check that an error occurred, don't check the specific message

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
    // Just check that an error occurred, don't check the specific message

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
    // Just check that an error occurred, don't check the specific message

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

// ============================================================================
// --- INTERESTING SCENARIOS ---
// ============================================================================
Deno.test("Interesting Scenario 1: User registration and authentication lifecycle", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    console.log(
      "\n🔐 SCENARIO 1: User Registration and Authentication Lifecycle",
    );
    console.log("=".repeat(50));

    let aliceId: ID;

    // 1. Register Alice
    console.log("1. Registering Alice...");
    const registerResult = await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in registerResult,
      true,
      "Alice registration should succeed",
    );
    ({ user: aliceId } = registerResult as { user: ID });
    assertExists(aliceId, "Alice should have a unique ID");
    console.log("✓ Alice registered successfully");

    // 2. Alice authenticates successfully
    console.log("2. Alice authenticating...");
    const authResult1 = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in authResult1,
      true,
      "Alice authentication should succeed",
    );
    const { user: authenticatedAliceId } = authResult1 as { user: ID };
    assertEquals(
      authenticatedAliceId,
      aliceId,
      "Authenticated Alice ID should match registered ID",
    );
    console.log("✓ Alice authenticated successfully");

    // 3. Alice tries wrong password
    console.log("3. Alice trying wrong password...");
    const wrongPasswordResult = await passwordAuth.authenticate({
      username: usernameAlice,
      password: wrongPassword,
    });
    assertEquals(
      "error" in wrongPasswordResult,
      true,
      "Wrong password should fail",
    );
    // Just check that an error occurred, don't check the specific message
    console.log("✓ Wrong password correctly rejected");

    // 4. Alice authenticates again with correct password
    console.log("4. Alice authenticating again with correct password...");
    const authResult2 = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in authResult2,
      true,
      "Second authentication should succeed",
    );
    const { user: authenticatedAliceId2 } = authResult2 as { user: ID };
    assertEquals(
      authenticatedAliceId2,
      aliceId,
      "Second authentication should return same ID",
    );
    console.log("✓ Second authentication successful");

    console.log("=== Scenario 1 Complete ===");
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 2: Multiple user registration and isolation", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    console.log("\n👥 SCENARIO 2: Multiple User Registration and Isolation");
    console.log("=".repeat(50));

    let aliceId: ID;
    let bobId: ID;

    // 1. Register Alice
    console.log("1. Registering Alice...");
    const aliceRegisterResult = await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in aliceRegisterResult,
      true,
      "Alice registration should succeed",
    );
    ({ user: aliceId } = aliceRegisterResult as { user: ID });
    console.log("✓ Alice registered");

    // 2. Register Bob
    console.log("2. Registering Bob...");
    const bobRegisterResult = await passwordAuth.register({
      username: usernameBob,
      password: passwordBob,
    });
    assertNotEquals(
      "error" in bobRegisterResult,
      true,
      "Bob registration should succeed",
    );
    ({ user: bobId } = bobRegisterResult as { user: ID });
    assertNotEquals(bobId, aliceId, "Bob and Alice should have different IDs");
    console.log("✓ Bob registered with different ID");

    // 3. Alice authenticates
    console.log("3. Alice authenticating...");
    const aliceAuthResult = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in aliceAuthResult,
      true,
      "Alice authentication should succeed",
    );
    const { user: authenticatedAliceId } = aliceAuthResult as { user: ID };
    assertEquals(authenticatedAliceId, aliceId, "Alice should get her own ID");
    console.log("✓ Alice authenticated with correct ID");

    // 4. Bob authenticates
    console.log("4. Bob authenticating...");
    const bobAuthResult = await passwordAuth.authenticate({
      username: usernameBob,
      password: passwordBob,
    });
    assertNotEquals(
      "error" in bobAuthResult,
      true,
      "Bob authentication should succeed",
    );
    const { user: authenticatedBobId } = bobAuthResult as { user: ID };
    assertEquals(authenticatedBobId, bobId, "Bob should get his own ID");
    console.log("✓ Bob authenticated with correct ID");

    // 5. Alice tries Bob's password (should fail)
    console.log("5. Alice trying Bob's password...");
    const aliceWithBobPasswordResult = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordBob,
    });
    assertEquals(
      "error" in aliceWithBobPasswordResult,
      true,
      "Alice with Bob's password should fail",
    );
    console.log("✓ Alice with Bob's password correctly rejected");

    // 6. Bob tries Alice's password (should fail)
    console.log("6. Bob trying Alice's password...");
    const bobWithAlicePasswordResult = await passwordAuth.authenticate({
      username: usernameBob,
      password: passwordAlice,
    });
    assertEquals(
      "error" in bobWithAlicePasswordResult,
      true,
      "Bob with Alice's password should fail",
    );
    console.log("✓ Bob with Alice's password correctly rejected");

    console.log("=== Scenario 2 Complete ===");
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 3: Duplicate username handling and error recovery", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    console.log("\n⚠️  SCENARIO 3: Duplicate Username Handling");
    console.log("=".repeat(50));

    let aliceId: ID;

    // 1. Register Alice
    console.log("1. Registering Alice...");
    const aliceRegisterResult = await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in aliceRegisterResult,
      true,
      "Alice registration should succeed",
    );
    ({ user: aliceId } = aliceRegisterResult as { user: ID });
    console.log("✓ Alice registered");

    // 2. Try to register Alice again (should fail)
    console.log("2. Trying to register Alice again...");
    const duplicateRegisterResult = await passwordAuth.register({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertEquals(
      "error" in duplicateRegisterResult,
      true,
      "Duplicate registration should fail",
    );
    // Just check that an error occurred, don't check the specific message
    console.log("✓ Duplicate registration correctly rejected");

    // 3. Try to register Alice with different password (should fail)
    console.log("3. Trying to register Alice with different password...");
    const differentPasswordResult = await passwordAuth.register({
      username: usernameAlice,
      password: "DifferentPassword123!",
    });
    assertEquals(
      "error" in differentPasswordResult,
      true,
      "Duplicate username with different password should fail",
    );
    console.log(
      "✓ Duplicate username with different password correctly rejected",
    );

    // 4. Alice can still authenticate with original password
    console.log("4. Alice authenticating with original password...");
    const aliceAuthResult = await passwordAuth.authenticate({
      username: usernameAlice,
      password: passwordAlice,
    });
    assertNotEquals(
      "error" in aliceAuthResult,
      true,
      "Alice should still authenticate with original password",
    );
    const { user: authenticatedAliceId } = aliceAuthResult as { user: ID };
    assertEquals(
      authenticatedAliceId,
      aliceId,
      "Alice should get same ID as before",
    );
    console.log("✓ Alice still authenticates with original credentials");

    // 5. Register Bob with different username
    console.log("5. Registering Bob with different username...");
    const bobRegisterResult = await passwordAuth.register({
      username: usernameBob,
      password: passwordBob,
    });
    assertNotEquals(
      "error" in bobRegisterResult,
      true,
      "Bob registration should succeed",
    );
    console.log("✓ Bob registered successfully");

    console.log("=== Scenario 3 Complete ===");
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 4: Password validation and edge cases", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    console.log("\n🔍 SCENARIO 4: Password Validation and Edge Cases");
    console.log("=".repeat(50));

    // 1. Test empty password (should fail)
    console.log("1. Testing empty password...");
    const emptyPasswordResult = await passwordAuth.register({
      username: "testuser1",
      password: "",
    });
    assertEquals(
      "error" in emptyPasswordResult,
      true,
      "Empty password should be rejected",
    );
    console.log("✓ Empty password correctly rejected");

    // 2. Test very long password
    console.log("2. Testing very long password...");
    const longPassword = "a".repeat(1000);
    const longPasswordResult = await passwordAuth.register({
      username: "testuser2",
      password: longPassword,
    });
    assertNotEquals(
      "error" in longPasswordResult,
      true,
      "Long password should be accepted",
    );
    console.log("✓ Long password accepted");

    // 3. Test special characters in password
    console.log("3. Testing special characters in password...");
    const specialPassword = "P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
    const specialPasswordResult = await passwordAuth.register({
      username: "testuser3",
      password: specialPassword,
    });
    assertNotEquals(
      "error" in specialPasswordResult,
      true,
      "Special character password should be accepted",
    );
    console.log("✓ Special character password accepted");

    // 4. Test unicode characters in password
    console.log("4. Testing unicode characters in password...");
    const unicodePassword = "Password你好世界🌍123!";
    const unicodePasswordResult = await passwordAuth.register({
      username: "testuser4",
      password: unicodePassword,
    });
    assertNotEquals(
      "error" in unicodePasswordResult,
      true,
      "Unicode password should be accepted",
    );
    console.log("✓ Unicode password accepted");

    // 5. Test authentication with special passwords
    console.log("5. Testing authentication with special passwords...");
    const longPasswordAuthResult = await passwordAuth.authenticate({
      username: "testuser2",
      password: longPassword,
    });
    assertNotEquals(
      "error" in longPasswordAuthResult,
      true,
      "Long password authentication should succeed",
    );

    const specialPasswordAuthResult = await passwordAuth.authenticate({
      username: "testuser3",
      password: specialPassword,
    });
    assertNotEquals(
      "error" in specialPasswordAuthResult,
      true,
      "Special password authentication should succeed",
    );

    const unicodePasswordAuthResult = await passwordAuth.authenticate({
      username: "testuser4",
      password: unicodePassword,
    });
    assertNotEquals(
      "error" in unicodePasswordAuthResult,
      true,
      "Unicode password authentication should succeed",
    );
    console.log("✓ All special password authentications succeeded");

    console.log("=== Scenario 4 Complete ===");
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 5: Rapid registration and authentication", async () => {
  const [db, client] = await testDb();
  const passwordAuth = new PasswordAuthConcept(db);

  try {
    console.log("\n⚡ SCENARIO 5: Rapid Registration and Authentication");
    console.log("=".repeat(50));

    const userIds: ID[] = [];

    // 1. Rapid user registration
    console.log("1. Registering multiple users rapidly...");
    const registerPromises = [];
    for (let i = 0; i < 5; i++) {
      registerPromises.push(
        passwordAuth.register({
          username: `rapiduser${i}`,
          password: `RapidPass${i}!`,
        }),
      );
    }

    const registerResults = await Promise.all(registerPromises);
    for (let i = 0; i < registerResults.length; i++) {
      const result = registerResults[i];
      assertNotEquals(
        "error" in result,
        true,
        `Rapid user ${i} registration should succeed`,
      );
      userIds.push((result as { user: ID }).user);
    }
    console.log("✓ All rapid registrations succeeded");

    // 2. Verify all users have unique IDs
    console.log("2. Verifying unique user IDs...");
    const uniqueIds = new Set(userIds);
    assertEquals(
      uniqueIds.size,
      userIds.length,
      "All user IDs should be unique",
    );
    console.log("✓ All user IDs are unique");

    // 3. Rapid authentication
    console.log("3. Authenticating all users rapidly...");
    const authPromises = [];
    for (let i = 0; i < 5; i++) {
      authPromises.push(
        passwordAuth.authenticate({
          username: `rapiduser${i}`,
          password: `RapidPass${i}!`,
        }),
      );
    }

    const authResults = await Promise.all(authPromises);
    for (let i = 0; i < authResults.length; i++) {
      const result = authResults[i];
      assertNotEquals(
        "error" in result,
        true,
        `Rapid user ${i} authentication should succeed`,
      );
      const { user: authenticatedId } = result as { user: ID };
      assertEquals(
        authenticatedId,
        userIds[i],
        `User ${i} should get their registered ID`,
      );
    }
    console.log("✓ All rapid authentications succeeded");

    // 4. Rapid failed authentications
    console.log("4. Testing rapid failed authentications...");
    const failedAuthPromises = [];
    for (let i = 0; i < 5; i++) {
      failedAuthPromises.push(
        passwordAuth.authenticate({
          username: `rapiduser${i}`,
          password: `WrongPass${i}!`,
        }),
      );
    }

    const failedAuthResults = await Promise.all(failedAuthPromises);
    for (let i = 0; i < failedAuthResults.length; i++) {
      const result = failedAuthResults[i];
      assertEquals(
        "error" in result,
        true,
        `Rapid user ${i} wrong password should fail`,
      );
    }
    console.log("✓ All rapid failed authentications correctly rejected");

    // 5. Mixed rapid operations
    console.log("5. Testing mixed rapid operations...");
    const mixedPromises = [];
    for (let i = 0; i < 3; i++) {
      // Some successful authentications
      mixedPromises.push(
        passwordAuth.authenticate({
          username: `rapiduser${i}`,
          password: `RapidPass${i}!`,
        }),
      );
      // Some failed authentications
      mixedPromises.push(
        passwordAuth.authenticate({
          username: `rapiduser${i}`,
          password: `WrongPass${i}!`,
        }),
      );
    }

    const mixedResults = await Promise.all(mixedPromises);
    let successCount = 0;
    let failureCount = 0;
    for (const result of mixedResults) {
      if ("error" in result) {
        failureCount++;
      } else {
        successCount++;
      }
    }
    assertEquals(successCount, 3, "Should have 3 successful authentications");
    assertEquals(failureCount, 3, "Should have 3 failed authentications");
    console.log("✓ Mixed rapid operations completed correctly");

    console.log("=== Scenario 5 Complete ===");
  } finally {
    await client.close();
  }
});
