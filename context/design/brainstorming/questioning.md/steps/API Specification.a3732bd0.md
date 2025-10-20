---
timestamp: 'Mon Oct 20 2025 18:54:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185405.6a6c26a7.md]]'
content_id: a3732bd0f94155e98131db3bb1f33fc816976f6e329a8d32e0939ccabe40872c
---

# API Specification: Summaries Concept

**Purpose:** highlights the most important part of Item

***

## API Endpoints

### POST /api/Summaries/setSummary

**Description:** Sets or updates a summary for a given item manually.

**Requirements:**

* (Implicit: always allowed as no explicit `requires` in specification)

**Effects:**

* If `item` already exists, change the summary associated with `item` to `summary`.
* If `item` does not exist in Summaries, create a new summary for `item` with a summary `summary`.

**Request Body:**

```json
{
  "summary": "string",
  "item": "string"
}
```

**Success Response Body (Action):**

```json
{
  "item": "string",
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

### POST /api/Summaries/setSummaryWithAI

**Description:** Generates a summary for an item using an LLM and associates it with the item.

**Requirements:**

* text is nonempty

**Effects:**

* creates a summary of `text` with an LLM and associates it with the item

**Request Body:**

```json
{
  "text": "string",
  "item": "string"
}
```

**Success Response Body (Action):**

```json
{
  "item": "string",
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

### POST /api/Summaries/deleteSummary

**Description:** Deletes the summary associated with a specific item.

**Requirements:**

* item has a summary associated with it

**Effects:**

* deletes the summary associated with the item

**Request Body:**

```json
{
  "item": "string"
}
```

**Success Response Body (Action):**

```json
{
  "item": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
