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

/**
 * Reusable authentication where clause for authenticated requests
 * Verifies token and ensures authenticated user matches requested user
 */
const authenticateRequest = async (
  frames: Frames,
  authToken: symbol,
  user: symbol,
  authenticatedUser: symbol,
): Promise<Frames> => {
  // Verify the auth token and get the authenticated user
  // The query returns { user: ... }, so we map it to authenticatedUser
  frames = await frames.query(
    PasswordAuth._getUserFromToken,
    { authToken },
    { user: authenticatedUser },
  );

  // If query returned empty (invalid token), return empty frames
  // This prevents the sync from firing, allowing auth error sync to handle it
  if (frames.length === 0) {
    return new Frames();
  }

  // Filter to ensure the authenticated user matches the user specified in the request
  const matchingFrames = frames.filter(($) => {
    const authUser = $[authenticatedUser];
    const reqUser = $[user];
    return authUser === reqUser;
  });

  return matchingFrames;
};

/**
 * Reusable authentication error where clause
 * Returns error frame if auth fails, empty frames if auth succeeds
 */
const checkAuthError = async (
  frames: Frames,
  authToken: symbol,
  user: symbol,
  authenticatedUser: symbol,
): Promise<Frames> => {
  const originalFrame = frames[0];

  // Check if token is missing or invalid
  const token = originalFrame[authToken];
  if (!token || typeof token !== "string" || token.trim() === "") {
    console.log("❌ Auth error: Token missing or invalid");
    return new Frames(originalFrame);
  }

  // The query returns { user: ... }, so we map it to authenticatedUser
  frames = await frames.query(
    PasswordAuth._getUserFromToken,
    { authToken },
    { user: authenticatedUser },
  );

  // If token is invalid or user doesn't match, return error frame
  if (frames.length === 0) {
    return new Frames(originalFrame);
  }

  const matchingFrames = frames.filter(($) => {
    const authUser = $[authenticatedUser];
    const reqUser = $[user];
    return authUser === reqUser;
  });

  if (matchingFrames.length === 0) {
    return new Frames(originalFrame);
  }

  // If auth succeeds, return empty to prevent this error sync from firing
  return new Frames();
};

/**
 * Reusable token generation where clause for response syncs
 */
const generateTokenForResponse = async (
  frames: Frames,
  user: symbol,
  accessToken: symbol,
): Promise<Frames> => {
  // Generate a new access token for the user
  frames = await frames.query(
    PasswordAuth._generateNewAccessToken,
    { user },
    { accessToken },
  );
  return frames;
};

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
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
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
    return await generateTokenForResponse(frames, user, accessToken);
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
    const errorFrames = await checkAuthError(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
    // If we got frames back, auth failed - return them for error response
    // If we got empty frames, auth succeeded - return empty to prevent error sync
    return errorFrames;
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

export const CreateFolderRequest: Sync = ({
  request,
  user,
  title,
  parent,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Folder/createFolder",
      user,
      title,
      parent,
      authToken,
    },
    { request },
  ]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Folder.createFolder, { user, title, parent }]),
});

export const CreateFolderResponse: Sync = ({
  request,
  folder,
  user,
  accessToken,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/createFolder", user }, { request }],
    [Folder.createFolder, {}, { folder }],
  ),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, folder, accessToken }]),
});

export const CreateFolderResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/createFolder" }, { request }],
    [Folder.createFolder, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const CreateFolderAuthError: Sync = ({
  request,
  user,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Folder/createFolder",
      user,
      authToken,
    },
    { request },
  ]),
  where: async (frames) => {
    const errorFrames = await checkAuthError(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
    // If we got frames back, auth failed - return them for error response
    // If we got empty frames, auth succeeded - return empty to prevent error sync
    return errorFrames;
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
