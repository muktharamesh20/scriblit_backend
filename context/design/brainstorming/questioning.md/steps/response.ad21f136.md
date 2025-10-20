---
timestamp: 'Mon Oct 20 2025 18:50:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185020.9daadff8.md]]'
content_id: ad21f1363a8e8138beafb786979b8286f5d9fb8f9bda96f80dc6813fb58b6799
---

# response:

````markdown
# API Specification: Folder Concept

**Purpose:** Organize items hierarchically

---

## API Endpoints

### POST /api/Folder/initializeFolder

**Description:** Creates the initial root folder for a user.

**Requirements:**
- The user `u` has created no other folders.

**Effects:**
- Creates a root folder to nest elements and folders inside of that the user owns.

**Request Body:**
```json
{
  "user": "string"
}
````

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

### POST /api/Folder/createFolder

**Description:** Creates a new folder as a child of an existing parent folder.

**Requirements:**

* `parent` exists and has owner `u`.

**Effects:**

* Creates a folder with title `title` that is a child of the folder `parent`.

**Request Body:**

```json
{
  "user": "string",
  "title": "string",
  "parent": "string"
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

### POST /api/Folder/moveFolder

**Description:** Moves a folder into another folder.

**Requirements:**

* `f2` is not hierarchically a descendant of `f1`.
* Both folders must have the same owner.

**Effects:**

* If `f1` is already in a folder, remove it from that folder and move it into `f2`.
* If `f1` is a new folder, just add it to `f2`.

**Request Body:**

```json
{
  "folder": "string",
  "newParent": "string"
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

### POST /api/Folder/deleteFolder

**Description:** Deletes a folder and everything contained inside of it from the folder hierarchy.

**Requirements:**

* None explicitly stated, but the folder `f` must exist.

**Effects:**

* Deletes `f` and everything contained inside of `f` from the folder hierarchy.

**Request Body:**

```json
{
  "f": "string"
}
```

**Success Response Body (Action):**

```json
[
  "string"
]
```

*(Returns an array of IDs of the deleted entities (folders and items).)*

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Folder/insertItem

**Description:** Inserts an item into a specified folder.

**Requirements:**

* None explicitly stated, but the target folder `f` must exist.

**Effects:**

* If `i` is already in a folder, remove it from that folder and insert it into `f`.
* Otherwise, simply insert it into `f`.

**Request Body:**

```json
{
  "item": "string",
  "folder": "string"
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

### POST /api/Folder/deleteItem

**Description:** Removes an item from whichever folder it is currently located in.

**Requirements:**

* The item exists.

**Effects:**

* Removes the item from whichever folder it is currently located in.

**Request Body:**

```json
{
  "item": "string"
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

### POST /api/Folder/\_getFolderChildren

**Description:** Retrieves all child folder IDs of a given folder ID.

**Requirements:**

* The folder `folderId` must exist.

**Effects:**

* Returns an array of folder IDs that are direct children of the specified folder.

**Request Body:**

```json
{
  "folderId": "string"
}
```

**Success Response Body (Query):**

```json
[
  "string"
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Folder/\_getFolderItems

**Description:** Retrieves all item IDs contained directly within a given folder ID.

**Requirements:**

* The folder `folderId` must exist.

**Effects:**

* Returns an array of item IDs that are directly contained within the specified folder.

**Request Body:**

```json
{
  "folderId": "string"
}
```

**Success Response Body (Query):**

```json
[
  "string"
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Folder/\_getFolderDetails

**Description:** Retrieves all stored details for a given folder ID, including its title, owner, and direct child folders and items.

**Requirements:**

* The folder `folderId` must exist.

**Effects:**

* Returns a single object representing the `FolderStructure` if found.

**Request Body:**

```json
{
  "folderId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "title": "string",
    "owner": "string",
    "folders": [
      "string"
    ],
    "elements": [
      "string"
    ]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

```
```
