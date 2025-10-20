---
timestamp: 'Mon Oct 20 2025 18:36:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_183606.6c3b14fa.md]]'
content_id: d9326451885958004fcf5dd7bf69092c86352d1fb9ef7b41e2c6071df94d76e6
---

# API Specification: Folder Concept

**Purpose:** Organize items hierarchically

***

## API Endpoints

### POST /api/Folder/initializeFolders

**Description:** Creates a root folder for a given user to organize items and subfolders.

**Requirements:**

* The user `u` has created no other folders

**Effects:**

* Creates a root folder to nest elements and folders inside of that the user owns

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

**Description:** Creates a new subfolder with a specified title, owned by a user, within an existing parent folder.

**Requirements:**

* `parent` exists and has owner `u`

**Effects:**

* Creates a folder with title `title` that is a child of the folder `parent`

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

* `f2` is not hierarchically a descendent of `f1`. In other words, `f2` cannot be inside of `f1` through any path of folders. Both folders must have the same owner.

**Effects:**

* If `f1` is already in a folder, remove it from that folder and move it into `f2`. If `f1` is a new folder, just add it to `f2`.

**Request Body:**

```json
{
  "f1": "string",
  "f2": "string"
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

### POST /api/Folder/deleteFolder

**Description:** Deletes a specified folder and all its contained elements and subfolders from the hierarchy.

**Requirements:**

* None

**Effects:**

* Deletes `f` and everything contained inside of `f` from the folder hierarchy

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

**Description:** Inserts an item into a specified folder, moving it if it's already located elsewhere.

**Requirements:**

* None

**Effects:**

* If `i` is already in a folder, remove it from that folder and insert it into `f`. Otherwise, simply insert it into `f`.

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

**Description:** Removes a specified item from whichever folder it is currently located in.

**Requirements:**

* The item exists

**Effects:**

* Removes the item from whichever folder it is currently located in.

**Request Body:**

```json
{
  "i": "string"
}
```

\*\*Success Response Body (Action):12

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```
