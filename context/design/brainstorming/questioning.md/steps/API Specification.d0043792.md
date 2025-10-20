---
timestamp: 'Mon Oct 20 2025 18:54:48 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185448.e5d0eb2b.md]]'
content_id: d0043792cedbb709e7562020cf3ae70151a6732575d855e1ff913194aea8267a
---

# API Specification: Tags Concept

**Purpose:** Flags items for later

***

## API Endpoints

### POST /api/Tags/addTag

**Description:** Creates a new tag and associates an item with it for a given user.

**Requirements:**

* There does not already exist a tag associated with that label and item.
* The label must not be empty or only whitespace.

**Effects:**

* Creates a tag with that label and item.

**Request Body:**

```json
{
  "user": "string",
  "label": "string",
  "item": "string"
}
```

**Success Response Body (Action):**

```json
{
  "t": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Tags/removeTagFromItem

**Description:** Removes a specific item's association from a tag.

**Requirements:**

* The tag `t` must be associated with item `i`.

**Effects:**

* Removes the tag from the item.

**Request Body:**

```json
{
  "t": "string",
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

### POST /api/Tags/\_getItemsByTag

**Description:** Retrieves all items associated with a given tag ID.

**Requirements:**

* The tag specified by `tagId` must exist.

**Effects:**

* Returns an array of `Item` IDs associated with the tag.

**Request Body:**

```json
{
  "tagId": "string"
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

### POST /api/Tags/\_getTagsForItem

**Description:** Retrieves all tags for a specific user that are associated with a given item ID.

**Requirements:**

* `user` and `item` must be valid IDs.

**Effects:**

* Returns an array of `TagStructure` objects containing the `item` for the `user`.

**Request Body:**

```json
{
  "user": "string",
  "item": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "owner": "string",
    "label": "string",
    "items": [
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

***

### POST /api/Tags/\_getTagDetails

**Description:** Retrieves all stored details for a given tag ID.

**Requirements:**

* The tag specified by `tagId` must exist.

**Effects:**

* Returns the `TagStructure` object for the specified tag.

**Request Body:**

```json
{
  "tagId": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "owner": "string",
    "label": "string",
    "items": [
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

***

### POST /api/Tags/\_getAllUserTags

**Description:** Retrieves all tags owned by a specific user.

**Requirements:**

* `user` must be a valid ID.

**Effects:**

* Returns an array of all `TagStructure` objects owned by the `user`.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "owner": "string",
    "label": "string",
    "items": [
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

***
