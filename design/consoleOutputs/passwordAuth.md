(base) muktharamesh@dhcp-10-29-145-85 scriblit_backend % deno test --allow-read --allow-net --allow-env --allow-sys src/concepts/Scriblink/passwordAuth.test.ts
running 9 tests from ./src/concepts/Scriblink/passwordAuth.test.ts
Principle: After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user. ...
------- output -------

🔐 OPERATIONAL PRINCIPLE: User Authentication Workflow
============================================================

📝 Step 1: Registering Alice
   ✅ Alice registered successfully

🔐 Step 2: Authenticating Alice with correct credentials
   ✅ Alice authenticated successfully with correct credentials

🔍 Step 3: Testing authentication with wrong password
   ✅ Authentication correctly rejected with wrong password

🔍 Step 4: Testing authentication with non-existent username
   ✅ Authentication correctly rejected with non-existent username
   📊 Final state: Alice can authenticate, others cannot

🎉 OPERATIONAL PRINCIPLE COMPLETE
============================================================
----- output end -----
Principle: After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user. ... ok (664ms)
Action: register - requires the provided username must not already exist in the system. ... ok (632ms)
Action: authenticate - ensures multiple users can be registered and authenticated independently ... ok (656ms)
Action: authenticate - requires the username and password combination to exactly match ... ok (615ms)
Interesting Scenario 1: User registration and authentication lifecycle ...
------- output -------

🔐 SCENARIO 1: User Registration and Authentication Lifecycle
==================================================
1. Registering Alice...
✓ Alice registered successfully
2. Alice authenticating...
✓ Alice authenticated successfully
3. Alice trying wrong password...
✓ Wrong password correctly rejected
4. Alice authenticating again with correct password...
✓ Second authentication successful
=== Scenario 1 Complete ===
----- output end -----
Interesting Scenario 1: User registration and authentication lifecycle ... ok (643ms)
Interesting Scenario 2: Multiple user registration and isolation ...
------- output -------

👥 SCENARIO 2: Multiple User Registration and Isolation
==================================================
1. Registering Alice...
✓ Alice registered
2. Registering Bob...
✓ Bob registered with different ID
3. Alice authenticating...
✓ Alice authenticated with correct ID
4. Bob authenticating...
✓ Bob authenticated with correct ID
5. Alice trying Bob's password...
✓ Alice with Bob's password correctly rejected
6. Bob trying Alice's password...
✓ Bob with Alice's password correctly rejected
=== Scenario 2 Complete ===
----- output end -----
Interesting Scenario 2: Multiple user registration and isolation ... ok (658ms)
Interesting Scenario 3: Duplicate username handling and error recovery ...
------- output -------

⚠️  SCENARIO 3: Duplicate Username Handling
==================================================
1. Registering Alice...
✓ Alice registered
2. Trying to register Alice again...
✓ Duplicate registration correctly rejected
3. Trying to register Alice with different password...
✓ Duplicate username with different password correctly rejected
4. Alice authenticating with original password...
✓ Alice still authenticates with original credentials
5. Registering Bob with different username...
✓ Bob registered successfully
=== Scenario 3 Complete ===
----- output end -----
Interesting Scenario 3: Duplicate username handling and error recovery ... ok (637ms)
Interesting Scenario 4: Password validation and edge cases ...
------- output -------

🔍 SCENARIO 4: Password Validation and Edge Cases
==================================================
1. Testing empty password...
✓ Empty password correctly rejected
2. Testing very long password...
✓ Long password accepted
3. Testing special characters in password...
✓ Special character password accepted
4. Testing unicode characters in password...
✓ Unicode password accepted
5. Testing authentication with special passwords...
✓ All special password authentications succeeded
=== Scenario 4 Complete ===
----- output end -----
Interesting Scenario 4: Password validation and edge cases ... ok (649ms)
Interesting Scenario 5: Rapid registration and authentication ...
------- output -------

⚡ SCENARIO 5: Rapid Registration and Authentication
==================================================
1. Registering multiple users rapidly...
✓ All rapid registrations succeeded
2. Verifying unique user IDs...
✓ All user IDs are unique
3. Authenticating all users rapidly...
✓ All rapid authentications succeeded
4. Testing rapid failed authentications...
✓ All rapid failed authentications correctly rejected
5. Testing mixed rapid operations...
✓ Mixed rapid operations completed correctly
=== Scenario 5 Complete ===
----- output end -----
Interesting Scenario 5: Rapid registration and authentication ... ok (1s)

ok | 9 passed | 0 failed (6s)