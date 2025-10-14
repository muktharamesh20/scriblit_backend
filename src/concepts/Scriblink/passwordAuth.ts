import { BcryptHashingService } from "./infrastructure/hashing/BcryptHashingService";
import { InMemoryUserRepository } from "./infrastructure/persistence/InMemoryUserRepository";
import { PasswordAuthService } from "./services/PasswordAuthService";
import { AuthErrorType } from "./core/types";

async function bootstrap() {
  console.log("--- Initializing Password Authentication System ---");

  // 1. Instantiate concrete dependencies
  const hashingService = new BcryptHashingService();
  const userRepository = new InMemoryUserRepository(); // Starts with an empty database
  const MIN_PASSWORD_LENGTH = 8;

  // 2. Inject dependencies into the core service
  const passwordAuthService = new PasswordAuthService(
    userRepository,
    hashingService,
    MIN_PASSWORD_LENGTH,
  );

  console.log("\n--- Scenario 1: User Registration ---");
  let registrationResult = await passwordAuthService.register({
    username: "testuser",
    password: "SecurePassword123!",
  });

  if (registrationResult.success) {
    console.log(
      `Registration successful for: ${registrationResult.user.username}`,
    );
    console.log(`User ID: ${registrationResult.user.id}`);

    // Try to register with the same username again
    console.log("\nAttempting to register same user again...");
    const duplicateRegistrationResult = await passwordAuthService.register({
      username: "testuser",
      password: "AnotherSecurePassword!",
    });
    if (!duplicateRegistrationResult.success) {
      console.log(
        `Failed to register duplicate user: ${duplicateRegistrationResult.message}`,
      );
      console.assert(
        duplicateRegistrationResult.error ===
          AuthErrorType.UsernameAlreadyTaken,
        "Expected UsernameAlreadyTaken error",
      );
    }
  } else {
    console.error(`Registration failed: ${registrationResult.message}`);
  }

  console.log("\n--- Scenario 2: User Login ---");
  let loginResult = await passwordAuthService.login({
    username: "testuser",
    password: "SecurePassword123!",
  });

  if (loginResult.success) {
    console.log(`Login successful for: ${loginResult.user.username}`);
  } else {
    console.error(`Login failed: ${loginResult.message}`);
    console.assert(false, "Login should have been successful");
  }

  console.log("\n--- Scenario 3: Invalid Login ---");
  let invalidLoginResult = await passwordAuthService.login({
    username: "testuser",
    password: "WrongPassword!",
  });

  if (!invalidLoginResult.success) {
    console.log(
      `Invalid login attempt failed as expected: ${invalidLoginResult.message}`,
    );
    console.assert(
      invalidLoginResult.error === AuthErrorType.InvalidCredentials,
      "Expected InvalidCredentials error",
    );
  } else {
    console.assert(false, "Invalid login should have failed");
  }

  console.log("\n--- Scenario 4: Change Password ---");
  if (registrationResult.success) {
    const userId = registrationResult.user.id;
    console.log(`Attempting to change password for user ID: ${userId}`);

    // First, try with incorrect old password
    console.log("Attempting with incorrect old password...");
    let changePasswordResultWrongOld = await passwordAuthService.changePassword(
      {
        userId,
        oldPassword: "IncorrectOldPassword!",
        newPassword: "NewSecurePassword123!",
      },
    );

    if (!changePasswordResultWrongOld.success) {
      console.log(
        `Change password failed (wrong old password) as expected: ${changePasswordResultWrongOld.message}`,
      );
      console.assert(
        changePasswordResultWrongOld.error ===
          AuthErrorType.OldPasswordMismatch,
        "Expected OldPasswordMismatch error",
      );
    } else {
      console.assert(
        false,
        "Change password with wrong old password should have failed",
      );
    }

    // Now, try with correct old password
    console.log("Attempting with correct old password...");
    let changePasswordResult = await passwordAuthService.changePassword({
      userId,
      oldPassword: "SecurePassword123!",
      newPassword: "NewSecurePassword123!",
    });

    if (changePasswordResult.success) {
      console.log(
        `Password changed successfully for user: ${changePasswordResult.user.username}`,
      );

      // Try logging in with the old password (should fail)
      console.log("Attempting to login with OLD password...");
      let loginOldPasswordResult = await passwordAuthService.login({
        username: "testuser",
        password: "SecurePassword123!",
      });
      if (!loginOldPasswordResult.success) {
        console.log(
          `Login with old password failed as expected: ${loginOldPasswordResult.message}`,
        );
      } else {
        console.assert(false, "Login with old password should have failed");
      }

      // Try logging in with the new password (should succeed)
      console.log("Attempting to login with NEW password...");
      let loginNewPasswordResult = await passwordAuthService.login({
        username: "testuser",
        password: "NewSecurePassword123!",
      });
      if (loginNewPasswordResult.success) {
        console.log(
          `Login with new password successful for: ${loginNewPasswordResult.user.username}`,
        );
      } else {
        console.assert(false, "Login with new password should have succeeded");
      }
    } else {
      console.error(`Change password failed: ${changePasswordResult.message}`);
    }
  }

  console.log("\n--- Scenario 5: Register with weak password ---");
  const weakPasswordResult = await passwordAuthService.register({
    username: "weakuser",
    password: "weak",
  });
  if (!weakPasswordResult.success) {
    console.log(
      `Registration with weak password failed as expected: ${weakPasswordResult.message}`,
    );
    console.assert(
      weakPasswordResult.error === AuthErrorType.PasswordTooWeak,
      "Expected PasswordTooWeak error",
    );
  } else {
    console.assert(false, "Registration with weak password should have failed");
  }

  console.log("\n--- Password Authentication System Demo Complete ---");
}

bootstrap();
