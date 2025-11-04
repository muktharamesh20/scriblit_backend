/**
 * Synchronizations for Scriblink concepts
 * Coordinates actions between authentication, folders, notes, tags, and summaries
 */

import { Folder, Notes, PasswordAuth, Requesting, Summaries } from "@concepts";
import { actions, Frames, Sync } from "@engine";

/********************************** System Syncs **********************************/

/**
 * When a user is registered, automatically create their root folder
 */
export const CreateRootFolderOnRegistration: Sync = (
  { user },
) => ({
  when: actions(
    [PasswordAuth.register, {}, { user }],
  ),
  then: actions([
    Folder.initializeFolder,
    { user },
  ]),
});

/**
 * When a note is deleted, remove it from any folder it's in
 */
export const RemoveNoteFromFolderOnDeletion: Sync = ({ note }) => ({
  when: actions([
    Notes.deleteNote,
    { note },
  ]),
  then: actions([
    Folder.deleteItem,
    { item: note },
  ]),
});

/**
 * When an item summary is deleted, also delete the summary
 */
export const DeleteSummaryOnItemDeletion: Sync = ({ item }) => ({
  when: actions([
    Folder.deleteItem,
    { item },
  ]),
  then: actions([
    Summaries.deleteSummary,
    { item },
  ]),
});

export const InitializeNewlyCreatedNote: Sync = (
  {
    user,
    content,
    folder,
    title,
    note,
  },
) => ({
  when: actions(
    [Notes.createNote, { user, title, folder, content }, { note }],
  ),
  then: actions(
    [Folder.insertItem, { item: note, folder }],
    [Notes.updateContent, { user, note, newContent: content }],
  ),
});

/********************************** User Requests **********************************/

export const CreateNoteRequest: Sync = ({
  request,
  user,
  content,
  folder,
  title,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Notes/createNote",
      user,
      content,
      folder,
      title,
      authToken,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const requestUser = originalFrame[user];
    const token = originalFrame[authToken];

    console.log("🔍 CreateNoteRequest where clause:", {
      requestUser,
      hasToken: !!token,
    });

    // Verify the auth token and get the authenticated user
    // The query returns { user: ... }, so we map it to authenticatedUser
    frames = await frames.query(
      PasswordAuth._getUserFromToken,
      { authToken },
      { user: authenticatedUser },
    );

    console.log("🔍 After token query:", {
      framesCount: frames.length,
      frames: frames.map(($) => ({
        authenticatedUser: $[authenticatedUser],
        requestUser: $[user],
      })),
    });

    // If query returned empty (invalid token), return empty frames
    // This prevents the sync from firing, allowing auth error sync to handle it
    if (frames.length === 0) {
      console.log("❌ Token query returned empty - auth failed");
      return new Frames();
    }

    // Filter to ensure the authenticated user matches the user specified in the request
    const matchingFrames = frames.filter(($) => {
      const authUser = $[authenticatedUser];
      const reqUser = $[user];
      const matches = authUser === reqUser;
      console.log("🔍 User comparison:", {
        authenticatedUser: authUser,
        requestUser: reqUser,
        matches,
        authUserType: typeof authUser,
        reqUserType: typeof reqUser,
      });
      return matches;
    });

    console.log("🔍 Filtered frames:", {
      originalCount: frames.length,
      matchingCount: matchingFrames.length,
    });

    return matchingFrames;
  },
  then: actions([Notes.createNote, { user, title, folder, content }]),
});

export const CreateNoteResponse: Sync = ({
  request,
  note,
  user,
  accessToken,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/createNote", user }, { request }],
    [Notes.createNote, {}, { note }],
  ),
  where: async (frames) => {
    // Generate a new access token for the user
    console.log(
      "🔍 CreateNoteResponse where - generating token, frames count:",
      frames.length,
    );
    frames = await frames.query(
      PasswordAuth._generateNewAccessToken,
      { user },
      { accessToken },
    );
    console.log("🔍 After token query, frames count:", frames.length);
    if (frames.length > 0) {
      console.log("✅ Token generated and bound to accessToken");
    } else {
      console.log("❌ Token generation failed - no frames returned");
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, note, accessToken }]),
});

export const CreateNoteResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/createNote" }, { request }],
    [Notes.createNote, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const CreateNoteAuthError: Sync = ({
  request,
  user,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Notes/createNote",
      user,
      authToken,
    },
    { request },
  ]),
  where: async (frames) => {
    // Save original frame
    const originalFrame = frames[0];

    console.log("🔍 CreateNoteAuthError where clause - checking auth");

    // Check if auth fails
    // The query returns { user: ... }, so we map it to authenticatedUser
    frames = await frames.query(
      PasswordAuth._getUserFromToken,
      { authToken },
      { user: authenticatedUser },
    );

    console.log("🔍 AuthError check - after query:", {
      framesCount: frames.length,
    });

    // If token is invalid or user doesn't match, return error frame
    if (frames.length === 0) {
      console.log("❌ AuthError: Token query failed - returning error frame");
      return new Frames(originalFrame);
    }

    const matchingFrames = frames.filter(($) => {
      const authUser = $[authenticatedUser];
      const reqUser = $[user];
      const matches = authUser === reqUser;
      console.log("🔍 AuthError - User comparison:", {
        authenticatedUser: authUser,
        requestUser: reqUser,
        matches,
      });
      return matches;
    });

    if (matchingFrames.length === 0) {
      console.log("❌ AuthError: User mismatch - returning error frame");
      return new Frames(originalFrame);
    }

    // If auth succeeds, return empty to prevent this error sync from firing
    console.log("✅ AuthError: Auth succeeded - returning empty frames");
    return new Frames();
  },
  then: actions([
    Requesting.respond,
    {
      request,
      error:
        "Invalid or expired access token, or authenticated user does not match requested user.",
    },
  ]),
});
