---
timestamp: 'Wed Oct 15 2025 17:20:17 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_172017.6361b134.md]]'
content_id: 95adc9ec354ad9142d1639ffa54b25a60a9e43efc22bf12757e3b00f3d657e62
---

# file: src/concepts/Scriblink/notes.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Note" + ".";

// Generic types for the concept's external dependencies
type User = ID;

// Internal entity types, represented as IDs
type Note = ID;

/**
 * State: A set of Notes with
 *   - _id: Note (unique identifier for the note)
 *   - title: String
 *   - content: String
 *   - owner: User
 *   - date_created: Date
 *   - last_modified: Date
 *
 * Invariants:
 * - each note has exactly one owner
 * - last_modified ≥ date_created
 * - only the owner can modify or delete the note
 */
interface NoteStructure {
  _id: Note;
  title: string;
  content: string;
  owner: User;
  date_created: Date;
  last_modified: Date;
}

/**
 * @concept Notes
 * @purpose records written information
 * @principle Each user can create and manage their own notes.
 *            A note belongs to exactly one user and contains a title and body text.
 *            Users can view, edit, rename, and delete their own notes.
 */
export default class NotesConcept {
  notes: Collection<NoteStructure>;

  constructor(private readonly db: Db) {
    this.notes = this.db.collection(PREFIX + "notes");
  }

  /**
   * Helper method to find a note and optionally check ownership.
   * This centralizes the "note exists" and "only the owner can modify or delete the note" invariants.
   * @param noteId The ID of the note to retrieve.
   * @param user The user attempting to access the note (optional, for ownership check).
   * @returns The NoteStructure if found and owned (if user provided), or an error object.
   */
  private async _getNoteDetails(
    noteId: Note,
    user?: User, // Optional user for ownership check, passed for modification/deletion actions
  ): Promise<NoteStructure | { error: string }> {
    try {
      const note = await this.notes.findOne({ _id: noteId });
      if (!note) {
        return { error: `Note with ID ${noteId} not found.` };
      }
      // Enforce "only the owner can modify or delete the note" invariant
      if (user && note.owner !== user) {
        return {
          error:
            `User ${user} is not authorized to access/modify note ${noteId}.`,
        };
      }
      return note;
    } catch (e: any) {
      console.error(`Error getting note details for ${noteId}:`, e);
      return {
        error: `Error getting note details for ${noteId}: ${e.message}`,
      };
    }
  }

  /**
   * Action: Creates a new note.
   * @param title An optional title for the new note. If not provided, defaults to "Untitled".
   * @param user The user who will own this note.
   * @effects Creates a new note with the specified (or default) title, an empty content string,
   *          the given owner, and current timestamps for creation and modification.
   * @returns The ID of the newly created note, or an error.
   */
  async createNote(
    { title, user }: { title?: string; user: User },
  ): Promise<{ note: Note } | { error: string }> {
    const noteId = freshID() as Note;
    const now = new Date(); // Set current time for both creation and modification

    const newNote: NoteStructure = {
      _id: noteId,
      title: title ?? "Untitled", // Default title if none is provided
      content: "", // New notes start with empty content
      owner: user,
      date_created: now,
      last_modified: now,
    };

    try {
      await this.notes.insertOne(newNote);
      return { note: noteId };
    } catch (e: any) {
      console.error(`Error creating note for user ${user}:`, e);
      return { error: `Failed to create note: ${e.message}` };
    }
  }

  /**
   * Action: Deletes a note.
   * @param noteId The ID of the note to delete.
   * @param user The user attempting to delete the note. Used for ownership verification.
   * @requires The note must exist and the provided user must be its owner.
   * @effects Deletes the note from the database.
   * @returns An empty object on successful deletion, or an error.
   */
  async deleteNote(
    { noteId, user }: { noteId: Note; user: User },
  ): Promise<Empty | { error: string }> {
    // First, verify the note exists and the user is the owner using the helper.
    const existingNote = await this._getNoteDetails(noteId, user);
    if ("error" in existingNote) {
      return existingNote; // Return error from _getNoteDetails (e.g., not found or not owner)
    }

    try {
      const deleteResult = await this.notes.deleteOne({ _id: noteId });
      if (deleteResult.deletedCount === 1) {
        return {}; // Success
      } else {
        // This case should ideally not be hit if _getNoteDetails succeeded,
        // but included for robustness against concurrent operations.
        return {
          error:
            `Failed to delete note ${noteId}. Note not found or already deleted.`,
        };
      }
    } catch (e: any) {
      console.error(`Error deleting note ${noteId}:`, e);
      return { error: `Failed to delete note: ${e.message}` };
    }
  }

  /**
   * Action: Renames the title of a note.
   * @param newTitle The new title for the note.
   * @param noteId The ID of the note to rename.
   * @param user The user attempting to rename the note. Used for ownership verification.
   * @requires The note must exist and the provided user must be its owner.
   * @effects Updates the title of the specified note. Note: `last_modified` is NOT updated as per prompt.
   * @returns An empty object on successful renaming, or an error.
   */
  async setTitle(
    { newTitle, noteId, user }: { newTitle: string; noteId: Note; user: User },
  ): Promise<Empty | { error: string }> {
    // First, verify the note exists and the user is the owner.
    const existingNote = await this._getNoteDetails(noteId, user);
    if ("error" in existingNote) {
      return existingNote; // Return error from _getNoteDetails
    }

    // Check if the title is actually changing to avoid unnecessary database writes
    if (existingNote.title === newTitle) {
      return {}; // No change needed, consider it a successful no-op.
    }

    try {
      // Update only the title. The prompt specifically excludes updating last_modified here.
      const updateResult = await this.notes.updateOne(
        { _id: noteId },
        { $set: { title: newTitle } },
      );

      if (updateResult.modifiedCount === 1) {
        return {}; // Success
      } else {
        return { error: `Failed to update title for note ${noteId}.` };
      }
    } catch (e: any) {
      console.error(`Error setting title for note ${noteId}:`, e);
      return { error: `Failed to set title: ${e.message}` };
    }
  }

  /**
   * Action: Replaces the content associated with a note.
   * @param newContent The new body text for the note.
   * @param noteId The ID of the note to update.
   * @param user The user attempting to update the content. Used for ownership verification.
   * @requires The note must exist and the provided user must be its owner.
   * @effects Replaces the `content` field and updates `last_modified` to the current time.
   * @returns An empty object on successful content update, or an error.
   */
  async updateContent(
    { newContent, noteId, user }: {
      newContent: string;
      noteId: Note;
      user: User;
    },
  ): Promise<Empty | { error: string }> {
    // First, verify the note exists and the user is the owner.
    const existingNote = await this._getNoteDetails(noteId, user);
    if ("error" in existingNote) {
      return existingNote; // Return error from _getNoteDetails
    }

    // Check if the content is actually changing to avoid unnecessary database writes
    if (existingNote.content === newContent) {
      return {}; // No change needed, consider it a successful no-op.
    }

    const now = new Date();
    try {
      const updateResult = await this.notes.updateOne(
        { _id: noteId },
        { $set: { content: newContent, last_modified: now } }, // Update content and last_modified date
      );

      if (updateResult.modifiedCount === 1) {
        return {}; // Success
      } else {
        return { error: `Failed to update content for note ${noteId}.` };
      }
    } catch (e: any) {
      console.error(`Error updating content for note ${noteId}:`, e);
      return { error: `Failed to update content: ${e.message}` };
    }
  }

  // --- Query methods (for viewing notes, adhering to "Users can view... their own notes") ---

  /**
   * Query: Retrieves all stored details for a given note ID, ensuring ownership.
   * This is the public interface for viewing a single note.
   * @param noteId The ID of the note to retrieve.
   * @param user The user attempting to view the note.
   * @returns `NoteStructure` object if found and owned by the user, otherwise an error.
   */
  async getNoteDetails(
    { noteId, user }: { noteId: Note; user: User },
  ): Promise<NoteStructure | { error: string }> {
    // Reuses the private helper which includes the crucial ownership check.
    return await this._getNoteDetails(noteId, user);
  }

  /**
   * Query: Retrieves all notes owned by a specific user.
   * @param ownerId The ID of the user whose notes are to be retrieved.
   * @returns An array of `NoteStructure` objects owned by the user, or an error.
   */
  async getNotesByUser(
    { ownerId }: { ownerId: User },
  ): Promise<NoteStructure[] | { error: string }> {
    try {
      const notes = await this.notes.find({ owner: ownerId }).toArray();
      return notes;
    } catch (e: any) {
      console.error(`Error getting notes for user ${ownerId}:`, e);
      return { error: `Failed to retrieve notes for user: ${e.message}` };
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
