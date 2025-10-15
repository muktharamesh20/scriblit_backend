---
timestamp: 'Wed Oct 15 2025 17:22:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_172216.4c658d81.md]]'
content_id: 5088d5084a8272aa464cde4720cd794e923ecc9798ead1938ae96c90ccdbf9a5
---

# file: src/concepts/Scriblink/tags.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Tag" + "."; // Using "Tag" prefix for this concept

// Generic types for the concept's external dependencies (from the example)
type User = ID;
type Item = ID;

// Internal entity type for a Tag, consistent with Folder
type Tag = ID;

/**
 * Interface representing the structure of a Tag document in the database.
 * @state A set of Tags, each with an owner, a label (string), and a set of associated Items.
 */
interface TagStructure {
  _id: Tag; // Unique ID for the tag itself
  owner: User; // The user who owns this tag (assuming tags are user-specific)
  label: string; // The human-readable label for the tag (e.g., "urgent", "todo")
  items: Item[]; // An array of Item IDs that are flagged by this tag
}

/**
 * @concept Tags
 * @purpose To flag items for later, enabling a user to easily access items with a specific label.
 * @principle A user labels items to flag them. Later, the user can retrieve items by their tags.
 */
export default class TagConcept {
  tags: Collection<TagStructure>;

  constructor(private readonly db: Db) {
    // Initialize the MongoDB collection for tags
    this.tags = this.db.collection(PREFIX + "tags");
  }

  /**
   * Action: Associates an item with a given tag label for a specific user.
   * If a tag with the given label doesn't exist for the user, a new one is created.
   * The item is added to the tag's list of associated items.
   *
   * @param user The ID of the user attempting to add the tag.
   * @param label The string label of the tag (e.g., "important", "review").
   * @param item The ID of the item to be flagged with this tag.
   *
   * @requires There must not already exist an association between this `user`, `label`, and `item`.
   *           In other words, the `item` should not already be present in the `items` list of the
   *           tag identified by `user` and `label`.
   *
   * @effects If the tag (for the given `user` and `label`) doesn't exist, it's created and the `item` is added.
   *          If the tag exists but the `item` is not associated, the `item` is added to its `items` list.
   *
   * @returns On success, an object containing the ID of the tag (`tag`).
   *          On failure (e.g., item already tagged, database error), an object containing an `error` string.
   */
  async addTag(
    { user, label, item }: { user: User; label: string; item: Item },
  ): Promise<{ tag: Tag } | { error: string }> {
    // First, try to find an existing tag for this user with this label.
    const existingTag = await this.tags.findOne({ owner: user, label });

    if (existingTag) {
      // Check the 'requires' clause: "there does not already exist a tag associated with that label and item".
      // If the item is already in the existing tag's 'items' array, the requirement is violated.
      if (existingTag.items.includes(item)) {
        return {
          error:
            `Item ${item} is already associated with tag "${label}" (ID: ${existingTag._id}) for user ${user}.`,
        };
      }

      // If the item is not present, add it to the existing tag's 'items' array.
      // $addToSet ensures that 'item' is added only if it's not already there (which we've already checked).
      const updateResult = await this.tags.updateOne(
        { _id: existingTag._id },
        { $addToSet: { items: item } },
      );

      if (updateResult.modifiedCount === 1) {
        return { tag: existingTag._id };
      } else {
        // This scenario indicates an unexpected failure, as the item was checked as not present.
        return {
          error:
            `Failed to add item ${item} to existing tag "${label}" (ID: ${existingTag._id}) for user ${user}. No document was modified.`,
        };
      }
    } else {
      // No existing tag found for this user and label, so create a new one.
      // The 'requires' clause is naturally met as no such association exists.
      const tagId = freshID() as Tag;
      try {
        await this.tags.insertOne({
          _id: tagId,
          owner: user,
          label,
          items: [item], // Initialize with the first item
        });
        return { tag: tagId };
      } catch (e: any) {
        console.error(
          `Error creating new tag "${label}" for user ${user} with item ${item}:`,
          e,
        );
        return {
          error: `Error creating tag: ${e.message}`,
        };
      }
    }
  }

  /**
   * Action: Removes an item's association with a specific tag.
   * This action unflags an item from a given tag.
   *
   * @param tagId The ID of the tag from which the item should be removed.
   * @param item The ID of the item to be unflagged.
   *
   * @requires The tag specified by `tagId` must exist, AND the `item` must currently be associated with this tag.
   *
   * @effects Removes the `item` from the `items` list of the specified `tag`.
   *          If the `items` list becomes empty after removal, the tag itself is not deleted (as per prompt, not specified).
   *
   * @returns On success, an empty object (`{}`).
   *          On failure (e.g., tag not found, item not associated, database error), an object containing an `error` string.
   */
  async removeTagFromItem(
    { tag: tagId, item }: { tag: Tag; item: Item },
  ): Promise<Empty | { error: string }> {
    // Attempt to remove the item from the tag.
    // The query { _id: tagId, items: item } ensures both 'requires' are met:
    // 1. The tag with `tagId` exists.
    // 2. The `item` is present within that tag's `items` array.
    const updateResult = await this.tags.updateOne(
      { _id: tagId, items: item }, // Filter: Find the tag AND ensure the item is present
      { $pull: { items: item } }, // Update: Remove the item from the array
    );

    if (updateResult.modifiedCount === 1) {
      // Item was successfully removed.
      return {};
    } else if (updateResult.matchedCount === 0) {
      // No document was matched by the query. This means either:
      // a) The tag itself does not exist.
      // b) The tag exists, but the item was not found in its 'items' array.
      // We need to distinguish these two cases to provide a more specific error message.
      const tagCheck = await this.tags.findOne({ _id: tagId });
      if (!tagCheck) {
        return { error: `Tag with ID ${tagId} not found.` };
      } else {
        return {
          error:
            `Item ${item} is not currently associated with tag ${tagId}. No action taken.`,
        };
      }
    } else {
      // This case should ideally not happen if matchedCount is 1 but modifiedCount is 0 for $pull,
      // but it's a fallback for unexpected database behavior.
      return {
        error:
          `Failed to remove item ${item} from tag ${tagId}. Unknown issue (matched: ${updateResult.matchedCount}, modified: ${updateResult.modifiedCount}).`,
      };
    }
  }

  // --- Query Methods (Following the pattern of the provided FolderConcept) ---

  /**
   * Query: Retrieves all items associated with a given tag ID.
   *
   * @param tagId The ID of the tag.
   * @returns An array of `Item` IDs if the tag is found, otherwise an object with an `error` string.
   */
  async _getItemsByTag(
    { tagId }: { tagId: Tag },
  ): Promise<Item[] | { error: string }> {
    const tag = await this._getTagDetails({ tagId });
    if ("error" in tag) {
      return { error: tag.error }; // Return error if tag not found
    }
    return tag.items ?? []; // Return items (or empty array if null/undefined)
  }

  /**
   * Query: Retrieves all tags for a specific user that are associated with a given item ID.
   * This method searches across all tags owned by the user to find those that contain the specified item.
   *
   * @param user The ID of the user whose tags are being queried.
   * @param item The ID of the item to find associated tags for.
   *
   * @returns An array of `TagStructure` objects (full tag details) that match the criteria.
   *          Returns an object with an `error` string on database query failure.
   */
  async _getTagsForItem(
    { user, item }: { user: User; item: Item },
  ): Promise<TagStructure[] | { error: string }> {
    try {
      // Find tags belonging to the user that also contain the specified item in their 'items' array.
      const tags = await this.tags.find({ owner: user, items: item }).toArray();
      return tags;
    } catch (e: any) {
      console.error(`Error getting tags for item ${item} for user ${user}:`, e);
      return {
        error: `Error getting tags for item ${item}: ${e.message}`,
      };
    }
  }

  /**
   * Query: Retrieves all stored details for a given tag ID.
   *
   * @param tagId The ID of the tag to retrieve.
   * @returns The `TagStructure` object if found, otherwise an object with an `error` string.
   */
  async _getTagDetails(
    { tagId }: { tagId: Tag },
  ): Promise<TagStructure | { error: string }> {
    try {
      const tag = await this.tags.findOne({ _id: tagId });
      return tag ?? { error: `Tag with ID ${tagId} not found.` }; // Return tag or specific error
    } catch (e: any) {
      console.error(`Error getting tag details for ${tagId}:`, e);
      return {
        error: `Error getting tag details for ${tagId}: ${e.message}`,
      };
    }
  }

  /**
   * Query: Retrieves all tags owned by a specific user.
   *
   * @param user The ID of the user whose tags are to be retrieved.
   * @returns An array of `TagStructure` objects owned by the user.
   *          Returns an object with an `error` string on database query failure.
   */
  async _getAllUserTags(
    { user }: { user: User },
  ): Promise<TagStructure[] | { error: string }> {
    try {
      const tags = await this.tags.find({ owner: user }).toArray();
      return tags;
    } catch (e: any) {
      console.error(`Error getting all tags for user ${user}:`, e);
      return {
        error: `Error getting all tags for user ${user}: ${e.message}`,
      };
    }
  }
}

```

'// This import loads the `.env` file as environment variables
import "jsr:@std/dotenv/load";
import { Db, MongoClient } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { generate } from "jsr:@std/uuid/unstable-v7";

async function initMongoClient() {
const DB\_CONN = Deno.env.get("MONGODB\_URL");
if (DB\_CONN === undefined) {
throw new Error("Could not find environment variable: MONGODB\_URL");
}
const client = new MongoClient(DB\_CONN);
try {
await client.connect();
} catch (e) {
throw new Error("MongoDB connection failed: " + e);
}
return client;
}

async function init() {
const client = await initMongoClient();
const DB\_NAME = Deno.env.get("DB\_NAME");
if (DB\_NAME === undefined) {
throw new Error("Could not find environment variable: DB\_NAME");
}
return \[client, DB\_NAME] as \[MongoClient, string];
}

async function dropAllCollections(db: Db): Promise<void> {
try {
// Get all collection names
const collections = await db.listCollections().toArray();

```
// Drop each collection
for (const collection of collections) {
  await db.collection(collection.name).drop();
}
```

} catch (error) {
console.error("Error dropping collections:", error);
throw error;
}
}

/\*\*

* MongoDB database configured by .env
* @returns {\[Db, MongoClient]} initialized database and client
  \*/
  export async function getDb() {
  const \[client, DB\_NAME] = await init();
  return \[client.db(DB\_NAME), client];
  }

/\*\*

* Test database initialization
* @returns {\[Db, MongoClient]} initialized test database and client
  \*/
  export async function testDb() {
  const \[client, DB\_NAME] = await init();
  const test\_DB\_NAME = `test-${DB_NAME}`;
  const test\_Db = client.db(test\_DB\_NAME);
  await dropAllCollections(test\_Db);
  return \[test\_Db, client] as \[Db, MongoClient];
  }

/\*\*

* Creates a fresh ID.
* @returns {ID} UUID v7 generic ID.
  \*/
  export function freshID() {
  return generate() as ID;
  }
  '

```
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

const authorA = "author:Alice" as ID;
const respondentB = "respondent:Bob" as ID;
const respondentC = "respondent:Charlie" as ID;

Deno.test("Principle: Author creates survey, respondent answers, author views results", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // 1. Author creates a survey with a 1-5 scale
    const createSurveyResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Customer Satisfaction",
      scaleMin: 1,
      scaleMax: 5,
    });
    assertNotEquals(
      "error" in createSurveyResult,
      true,
      "Survey creation should not fail.",
    );
    const { survey } = createSurveyResult as { survey: ID };
    assertExists(survey);

    // 2. Author adds several questions
    const addQ1Result = await surveyConcept.addQuestion({
      survey,
      text: "How satisfied are you with our product?",
    });
    assertNotEquals(
      "error" in addQ1Result,
      true,
      "Adding question 1 should not fail.",
    );
    const { question: q1 } = addQ1Result as { question: ID };

    const addQ2Result = await surveyConcept.addQuestion({
      survey,
      text: "How likely are you to recommend us?",
    });
    assertNotEquals(
      "error" in addQ2Result,
      true,
      "Adding question 2 should not fail.",
    );
    const { question: q2 } = addQ2Result as { question: ID };

    const questions = await surveyConcept._getSurveyQuestions({ survey });
    assertEquals(
      questions.length,
      2,
      "There should be two questions in the survey.",
    );

    // 3. A respondent submits their answers to those questions
    const submitR1Result = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: q1,
      value: 5,
    });
    assertEquals(
      "error" in submitR1Result,
      false,
      "Submitting response 1 should succeed.",
    );

    const submitR2Result = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: q2,
      value: 4,
    });
    assertEquals(
      "error" in submitR2Result,
      false,
      "Submitting response 2 should succeed.",
    );

    // 4. The author can view the collected responses
    const surveyResponses = await surveyConcept._getSurveyResponses({ survey });
    assertEquals(
      surveyResponses.length,
      2,
      "There should be two responses for the survey.",
    );
    assertEquals(surveyResponses.find((r) => r.question === q1)?.value, 5);
    assertEquals(surveyResponses.find((r) => r.question === q2)?.value, 4);

    const respondentAnswers = await surveyConcept._getRespondentAnswers({
      respondent: respondentB,
    });
    assertEquals(
      respondentAnswers.length,
      2,
      "The respondent should have two answers recorded.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: createSurvey requires scaleMin < scaleMax", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    const invalidResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Invalid Survey",
      scaleMin: 5,
      scaleMax: 1,
    });
    assertEquals(
      "error" in invalidResult,
      true,
      "Should fail when scaleMin > scaleMax.",
    );

    const equalResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Invalid Survey",
      scaleMin: 3,
      scaleMax: 3,
    });
    assertEquals(
      "error" in equalResult,
      true,
      "Should fail when scaleMin == scaleMax.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: addQuestion requires an existing survey", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  const nonExistentSurveyId = "survey:fake" as ID;

  try {
    const result = await surveyConcept.addQuestion({
      survey: nonExistentSurveyId,
      text: "This will fail",
    });
    assertEquals(
      "error" in result,
      true,
      "Adding a question to a non-existent survey should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: submitResponse requirements are enforced", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // Setup a valid survey and question
    const { survey } =
      (await surveyConcept.createSurvey({
        author: authorA,
        title: "Test Survey",
        scaleMin: 1,
        scaleMax: 5,
      })) as { survey: ID };
    const { question } =
      (await surveyConcept.addQuestion({ survey, text: "A question" })) as {
        question: ID;
      };

    // Requires: question must exist
    const nonExistentQuestionId = "question:fake" as ID;
    const res1 = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: nonExistentQuestionId,
      value: 3,
    });
    assertEquals(
      "error" in res1,
      true,
      "Submitting a response to a non-existent question should fail.",
    );

    // Requires: respondent must not have already submitted a response
    await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 3,
    }); // First submission is OK
    const res2 = await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 4,
    }); // Second submission fails
    assertEquals(
      "error" in res2,
      true,
      "Submitting a response twice for the same question should fail.",
    );
    assertEquals(
      (res2 as { error: string }).error,
      "Respondent has already answered this question. Use updateResponse to change it.",
    );

    // Requires: value must be within survey's scale
    const res3 = await surveyConcept.submitResponse({
      respondent: respondentC,
      question,
      value: 0,
    }); // Below min
    assertEquals(
      "error" in res3,
      true,
      "Submitting a value below the minimum scale should fail.",
    );
    const res4 = await surveyConcept.submitResponse({
      respondent: respondentC,
      question,
      value: 6,
    }); // Above max
    assertEquals(
      "error" in res4,
      true,
      "Submitting a value above the maximum scale should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateResponse successfully updates a response and enforces requirements", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  try {
    // Setup
    const { survey } =
      (await surveyConcept.createSurvey({
        author: authorA,
        title: "Test Survey",
        scaleMin: 1,
        scaleMax: 5,
      })) as { survey: ID };
    const { question } =
      (await surveyConcept.addQuestion({ survey, text: "A question" })) as {
        question: ID;
      };
    await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 3,
    });

    // Requires: A response must already exist to be updated
    const res1 = await surveyConcept.updateResponse({
      respondent: respondentC,
      question,
      value: 4,
    });
    assertEquals(
      "error" in res1,
      true,
      "Updating a non-existent response should fail.",
    );

    // Requires: value must be within survey's scale
    const res2 = await surveyConcept.updateResponse({
      respondent: respondentB,
      question,
      value: 6,
    });
    assertEquals(
      "error" in res2,
      true,
      "Updating with a value outside the scale should fail.",
    );

    // Successful update
    const successResult = await surveyConcept.updateResponse({
      respondent: respondentB,
      question,
      value: 5,
    });
    assertEquals(
      "error" in successResult,
      false,
      "A valid update should succeed.",
    );

    // Verify the update
    const answers = await surveyConcept._getRespondentAnswers({
      respondent: respondentB,
    });
    assertEquals(answers.length, 1, "There should still be only one answer.");
    assertEquals(
      answers[0].value,
      5,
      "The answer's value should be updated to 5.",
    );
  } finally {
    await client.close();
  }
});
```
