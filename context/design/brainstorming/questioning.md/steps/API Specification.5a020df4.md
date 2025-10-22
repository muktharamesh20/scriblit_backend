---
timestamp: 'Mon Oct 20 2025 22:51:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_225122.2a509cfa.md]]'
content_id: 5a020df4a8170492adc9522fed6b93761df71685ef55fe3f7788e54685b823a7
---

# API Specification: Request Concept

**Purpose:** To orchestrate complex operations across multiple concepts

**Principle:** Provides high-level operations that coordinate between authentication, folder management, note creation, tagging, and summarization concepts.

***

## API Endpoints

### POST /api/Request/registerUser

**Description:** Registers a new user and automatically creates their root folder.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Creates a new user account and initializes their folder structure

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "string",
  "rootFolder": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/loginUser

**Description:** Authenticates a user.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Authenticates a user and returns their ID.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/createNote

**Description:** Creates a new note with optional folder placement, tagging, and summarization.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Creates a note, places it in the specified folder, applies tags, and optionally generates a summary

**Request Body:**

```json
{
  "user": "string",
  "title": "string (optional)",
  "content": "string",
  "folderId": "string",
  "tags": "string[] (optional)",
  "generateSummary": "boolean (optional)"
}
```

**Success Response Body (Action):**

```json
{
  "note": "string",
  "folder": "string",
  "tags": "string[] (optional)",
  "summary": "string (optional)"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/updateNote

**Description:** Updates an existing note with new content, folder placement, tags, and summary.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Updates note content, moves to new folder if specified, updates tags, and optionally regenerates summary

**Request Body:**

```json
{
  "user": "string",
  "noteId": "string",
  "title": "string (optional)",
  "content": "string (optional)",
  "folderId": "string (optional)",
  "tags": "string[] (optional)",
  "generateSummary": "boolean (optional)"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/createFolder

**Description:** Creates a new folder for a user.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Creates a new folder as a child of the specified parent folder

**Request Body:**

```json
{
  "user": "string",
  "title": "string",
  "parentFolderId": "string"
}
```

**Success Response Body (Action):**

```json
{
  "folder": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/tagItem

**Description:** Tags an item with a specific label.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Associates the item with the specified tag

**Request Body:**

```json
{
  "user": "string",
  "itemId": "string",
  "tagLabel": "string"
}
```

**Success Response Body (Action):**

```json
{
  "tag": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/untagItem

**Description:** Removes a tag from an item.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Removes the association between the item and tag

**Request Body:**

```json
{
  "_user": "string",
  "itemId": "string",
  "tagId": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/generateSummary

**Description:** Generates a summary for a note.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Creates or updates a summary for the note using AI

**Request Body:**

```json
{
  "user": "string",
  "noteId": "string"
}
```

**Success Response Body (Action):**

```json
{
  "summary": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/getUserNotes

**Description:** Gets all notes for a user with optional filtering.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Returns an array of notes with their details, optionally filtered.

**Request Body:**

```json
{
  "user": "string",
  "folderId": "string (optional)",
  "tagLabel": "string (optional)"
}
```

**Success Response Body (Action):**

```json
{
  "notes": [
    {
      "_id": "string",
      "owner": "string",
      "title": "string",
      "content": "string"
      /* Note: Additional aggregated fields like 'folderId', 'tags', 'summary'
         might be included depending on the internal aggregation logic. */
    }
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Request/getFolderStructure

**Description:** Gets the folder structure for a user.

**Requirements:**

* Not explicitly specified in the concept specification for this action.

**Effects:**

* Returns the folder structure and associated items for the user.

**Request Body:**

```json
{
  "user": "string",
  "folderId": "string (optional)"
}
```

**Success Response Body (Action):**

```json
{
  "folders": [
    {
      "_id": "string",
      "title": "string",
      "owner": "string",
      "parent": "string | null",
      "elements": "string[]" /* IDs of items (e.g., notes or sub-folders) directly within this folder */
    }
  ],
  "items": [
    "string" /* A simplified representation of items, usually their IDs */
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```
