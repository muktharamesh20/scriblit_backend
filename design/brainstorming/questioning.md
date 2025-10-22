# prompt: 
[@concept-specifications](../background/concept-specifications.md)

# Concept API extraction

You are an expert software architect tasked with generating clear, developer-friendly API documentation. Your input is a formal "Concept Specification" which describes a modular piece of software functionality. This concept has been implemented and exposed as a REST-like API by a "Concept Server."

Your mission is to translate the provided Concept Specification into a structured API specification document written in Markdown. This document will be used by frontend developers to interact with the API.

Adhere to the following rules for the API structure and the documentation format:

**API Structure Rules:**

1.  **Base URL:** Assume a base URL of `/api`.
2.  **Endpoint Naming:** Each concept action or query maps to an endpoint. The URL structure is: `/{conceptName}/{actionOrQueryName}`.
    *   For a concept named `Labeling` and an action `createLabel`, the endpoint is `/api/Labeling/createLabel`.
3.  **HTTP Method:** All endpoints use the `POST` method.
4.  **Data Format:** All requests and responses use the `application/json` content type.
5.  **Request Body:** The request body is always a single JSON object. The keys of this object correspond to the input arguments defined in the action's signature.
6.  **Response Body:**
    *   **Actions:** A successful call to an action returns a single JSON object. The keys correspond to the results defined in the action's signature. If there are no results, an empty object `{}` is returned.
    *   **Queries:** A successful call to a query (a method name starting with `_`) returns a JSON **array** of objects.
    *   **Errors:** If an action fails to meet its `requires` condition or encounters another error, it returns a single JSON object with a single key: `{ "error": "A descriptive error message." }`.

**Documentation Format Rules:**

Generate the output in Markdown using the following template. For each action and query in the specification, create a dedicated endpoint section.

~~~markdown
# API Specification: {Concept Name} Concept

**Purpose:** {The concept's purpose.}

---

## API Endpoints

### POST /api/{conceptName}/{actionName}

**Description:** {A brief, one-sentence description of what this action does.}

**Requirements:**
- {List each point from the 'requires' section of the specification.}

**Effects:**
- {List each point from the 'effects' section of the specification.}

**Request Body:**
```json
{
  "argument1": "{type}",
  "argument2": "{type}"
}
```

**Success Response Body (Action):**
```json
{
  "result1": "{type}",
  "result2": "{type}"
}
```

**Success Response Body (Query):**
```json
[
  {
    "result1": "{type}",
    "result2": "{type}"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
*(Repeat for each action and query)*
~~~



# code specifications
[@tagsSpec](../../src/concepts/Scriblink/request.ts)

# prompt:

Now, analyze the above Concept Specification and generate the API documentation based on these instructions for the concepts. 

# response:
# response:

# API Specification: Request Concept

**Purpose:** To orchestrate complex operations across multiple concepts

**Principle:** Provides high-level operations that coordinate between authentication, folder management, note creation, tagging, and summarization concepts.

---

## API Endpoints

### POST /api/Request/registerUser

**Description:** Registers a new user and automatically creates their root folder.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates a new user account and initializes their folder structure

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

---

### POST /api/Request/loginUser

**Description:** Authenticates a user.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Authenticates a user and returns their ID.

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

---

### POST /api/Request/createNote

**Description:** Creates a new note with optional folder placement, tagging, and summarization.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates a note, places it in the specified folder, applies tags, and optionally generates a summary

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

---

### POST /api/Request/updateNote

**Description:** Updates an existing note with new content, folder placement, tags, and summary.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Updates note content, moves to new folder if specified, updates tags, and optionally regenerates summary

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

---

### POST /api/Request/createFolder

**Description:** Creates a new folder for a user.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates a new folder as a child of the specified parent folder

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

---

### POST /api/Request/tagItem

**Description:** Tags an item with a specific label.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Associates the item with the specified tag

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

---

### POST /api/Request/untagItem

**Description:** Removes a tag from an item.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Removes the association between the item and tag

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

---

### POST /api/Request/generateSummary

**Description:** Generates a summary for a note.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates or updates a summary for the note using AI

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

---

### POST /api/Request/getUserNotes

**Description:** Gets all notes for a user with optional filtering.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Returns an array of notes with their details, optionally filtered.

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

---

### POST /api/Request/getFolderStructure

**Description:** Gets the folder structure for a user.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Returns the folder structure and associated items for the user.

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