---
timestamp: 'Mon Oct 20 2025 18:52:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185245.d3367402.md]]'
content_id: e4619608e87e99a4faef2b0679a9cfa456b40ce179f954eeec60e933704b5b6e
---

# concept specifications:

**PasswordAuth**

* **Purpose:** Limit access to known users
* **Principle:** After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user.
* **State:** Set of Users with
  * `username` string
  * `passwordHash` string
* **Actions:**
  * `register(username: String, password: String): (user: User)`
    * **requires:** the username does not exist, password is not whitespace or empty
    * **effect** create a new user with this username and password and returns the user
  * `authenticate(user: username, password: String): (user: User)`
    * **requires:** the username and password (when hashed) combination exists in the set of users
    * **effect** returns the user
