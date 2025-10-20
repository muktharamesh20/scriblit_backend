---
timestamp: 'Mon Oct 20 2025 18:52:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185201.ed8bbd79.md]]'
content_id: b99ac9a885de522cf4f5c677b9b1358ec320e1b0d486ec9130ca50bca8f32c70
---

# API Specification: Notes Concept

**Purpose:** records written information

***

## API Endpoints

### POST /api/Notes/createNote

**Description:** Creates a new note for a user, with an optional title.

**Requirements:**

* true

**Effects:**

* Creates a new note. If `t` is specified, the title is `t`. Otherwise, the title is "Untitled". `date_created` and `last_modified` is set to the current time. The owner is `u`.

**Request Body:**

```json
{
  "title": "string (optional)",
  "user": "string"
}
```

**Success Response Body (Action):**

```json
{
  "note": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Notes/deleteNote

**Description:** Deletes a specified note if the requesting user is its owner.

**Requirements:**

* note exists (and the requesting user must be its owner, inferred from code implementation for a valid deletion)

**Effects:**

* deletes the notes

**Request Body:**

```json
{
  "noteId": "string",
  "user": "string"
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

### POST /api/Notes/setTitle

**Description:** Renames the title of a specified note if the requesting user is its owner.

**Requirements:**

* true (and the note must exist, and the requesting user must be its owner, inferred from code implementation)

**Effects:**

* Renames the title of note `n` with as `t`

**Request Body:**

```json
{
  "newTitle": "string",
  "noteId": "string",
  "user": "string"
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

### POST /api/Notes/updateContent

**Description:** Replaces the content of a specified note and updates its last modified timestamp, if the requesting user is its owner.

**Requirements:**

* true (and the note must exist, and the requesting user must be its owner, inferred from code implementation)

**Effects:**

* Replaces the content associated with `n` with `t`. Also updates `last_modified` to the current time.

**Request Body:**

```json
{
  "newContent": "string",
  "noteId": "string",
  "user": "string"
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

### POST /api/Notes/getNoteDetails

**Description:** Retrieves all stored details for a given note ID, verifying user ownership.

**Requirements:**

* Note with the given ID (`noteId`) must exist.
* The `user` provided must be the owner of the note.

**Effects:**

* Returns the full details of the requested note if the requirements are met.

**Request Body:**

```json
{
  "noteId": "string",
  "user": "string"
}
```

**Success Response Body (Action):**

```json
{
  "_id": "string",
  "title": "string",
  "content": "string",
  "owner": "string",
  "date_created": "string (ISO 8601)",
  "last_modified": "string (ISO 8601)"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Notes/getNotesByUser

**Description:** Retrieves all notes owned by a specific user.

**Requirements:**

* true

**Effects:**

* Returns an array of `NoteStructure` objects owned by the specified `ownerId`.

**Request Body:**

```json
{
  "ownerId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "title": "string",
    "content": "string",
    "owner": "string",
    "date_created": "string (ISO 8601)",
    "last_modified": "string (ISO 8601)"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
