---
timestamp: 'Mon Oct 20 2025 18:52:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185253.de11e0e5.md]]'
content_id: 47e84d3c88cc73a7582f63dadcf3fcf0a6d800563189c334eeb0daec66b3e4dc
---

# API Specification: PasswordAuth Concept

**Purpose:** Limit access to known users

***

## API Endpoints

### POST /api/PasswordAuth/register

**Description:** Registers a new user, creating a user identifier with the provided username and password.

**Requirements:**

* The username does not exist.
* Password is not whitespace or empty.

**Effects:**

* Create a new user with this username and password and returns the user.

**Request Body:**

```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "user": "String"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuth/authenticate

**Description:** Authenticates a user by verifying the provided username and password against registered credentials.

**Requirements:**

* The username and password (when hashed) combination exists in the set of users.

**Effects:**

* Returns the user.

**Request Body:**

```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "user": "String"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
