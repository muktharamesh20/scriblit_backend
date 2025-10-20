---
timestamp: 'Mon Oct 20 2025 18:49:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_184934.8953608f.md]]'
content_id: 9353993911100c75afaccb9a007e1effbedc007780afd1279b8238c6ce1f5db0
---

# API Specification: Folder Concept

**Purpose:** Organize items hierarchically

***

## API Endpoints

### POST /api/Folder/initializeFolders

**Description:** Creates the initial root folder for a user.

**Requirements:**

* The user `u` has created no other folders.

**Effects:**

* Creates a root folder to nest elements and folders inside of that the user owns.

**Request Body:**

```json
{
  "u": "string"
}
```

**Success Response Body (Action):**

```json
{
  "f": "string"
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

**Description:** Creates a folder with the given title that is a child of the specified parent folder.

**Requirements:**

* `parent` exists and has owner `u`.

**Effects:**

* Creates a folder with title `title` that is a child of the folder `parent`.

**Request Body:**

```json
{
  "u": "string",
  "title": "string",
  "parent": "string"
}
```

**Success Response Body (Action):**

```json
{
  "f": "string"
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

**Description:** Moves a folder (`f1`) into another folder (`f2`).

**Requirements:**

* `f2` is not hierarchcly a descendent of `f1`. In other words, `f2` cannot be inside of `f1` through any path of folders.
* Both folders must have the same owner.

**Effects:**

* If `f1` is already in a folder, remove it from that folder and move it into `f2`.
* If `f1` is a new folder, just add it to `f2`.

**Request Body:**

```json
{
  "f1": "string",
  "f2": "string"
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

* true

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
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Folder/insertItem

**Description:** Inserts an item into a folder.

**Requirements:**

* true

**Effects:**

* If `i` is already in a folder, remove it from that folder and insert it into `f`.
* Otherwise, simply insert it into `f`.

**Request Body:**

```json
{
  "i": "string",
  "f": "string"
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

**Description:** Removes the item from whichever folder it is currently located in.

**Requirements:**

* The item exists.

**Effects:**

* Removes the item from whichever folder it is currently located in.

**Request Body:**

```json
{
  "i": "string"
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

**Description:** Retrieves all child folders of a given folder.

**Requirements:**

* The folder `folderId` must exist.

**Effects:**

* Returns an array of Folder IDs directly contained within the specified folder.

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

**Description:** Retrieves all items contained directly within a given folder.

**Requirements:**

* The folder `folderId` must exist.

**Effects:**

* Returns an array of Item IDs directly contained within the specified folder.

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

**Description:** Retrieves all stored details for a given folder.

**Requirements:**

* The folder `folderId` must exist.

**Effects:**

* Returns a detailed FolderStructure object for the specified folder.

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
