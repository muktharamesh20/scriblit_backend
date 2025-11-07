/**
 * Synchronizations for Scriblink concepts
 * Coordinates actions between authentication, folders, notes, tags, and summaries
 */

import {
  Folder,
  Notes,
  PasswordAuth,
  Requesting,
  Summaries,
  Tags,
} from "@concepts";
import { actions, Frames, Sync } from "@engine";
import { ID } from "@utils/types.ts";

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
export const RemoveNoteFromFolderOnDeletion: Sync = ({ noteId, user }) => ({
  when: actions([
    Notes.deleteNote,
    { noteId, user },
    {},
  ]),
  then: actions([
    Folder.deleteItem,
    { item: noteId },
  ]),
});

/**
 * When a note is deleted, remove any tags it's attached to
 */
export const RemoveTagsFromNoteOnDeletion: Sync = (
  { noteId, user, tagId },
) => ({
  when: actions(
    [Notes.deleteNote, { noteId, user }, {}],
  ),
  where: async (frames) => {
    const result = new Frames();
    for (const frame of frames) {
      const u = frame[user] as ID;
      const itemId = frame[noteId] as ID;
      const response = await Tags.getTagsForItem({ user: u, item: itemId });
      if ("tags" in response && Array.isArray(response.tags)) {
        for (const rec of response.tags) {
          result.push({ ...frame, [tagId]: rec.tagId });
        }
      }
    }
    return result;
  },
  then: actions(
    [Tags.removeTagFromItem, { tag: tagId, item: noteId }],
  ),
});

/**
 * When a note is deleted, also delete its summary
 */
export const DeleteSummaryOnNoteDeletion: Sync = ({ noteId, user }) => ({
  when: actions([
    Notes.deleteNote,
    { noteId, user },
    {},
  ]),
  then: actions([
    Summaries.deleteSummary,
    { item: noteId },
  ]),
});

/**
 * When a note is created, initialize it in the folder it's in and update its content
 */
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

/*
 * When a folder is deleted, delete all the notes it contains
 */
export const deleteChildNotes: Sync = ({
  user,
  folder,
  note,
  deletedItems,
  owner,
}) => ({
  when: actions([
    Folder.deleteFolder,
    { f: folder },
    { deletedItems, owner },
  ]),
  where: (frames) => {
    const result = new Frames();
    for (const frame of frames) {
      const items = frame[deletedItems] as ID[];
      const folderOwner = frame[owner] as ID;

      // Filter out error cases (handled by error sync)
      if (!Array.isArray(items)) {
        continue;
      }

      // Expand each item/note into a separate frame with the owner
      for (const itemId of items) {
        result.push({
          ...frame,
          [note]: itemId,
          [user]: folderOwner,
        });
      }
    }
    return result;
  },
  then: actions([
    Notes.deleteNote,
    { noteId: note, user },
  ]),
});

/********************************** User Requests **********************************/
/************************** Usually for Authenticated Requests **********************/
export const DeleteFolderRequest: Sync = ({
  request,
  user,
  folderId,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Folder/deleteFolder",
      user,
      folderId,
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
  then: actions([Folder.deleteFolder, { f: folderId }]),
});

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

export const MoveFolderRequest: Sync = ({
  request,
  user,
  folderId,
  newParentId,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/Folder/moveFolder",
      user,
      folderId,
      newParentId,
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
  then: actions([Folder.moveFolder, { folderId, newParentId, userId: user }]),
});

export const DeleteNoteRequest: Sync = ({
  request,
  user,
  noteId,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Notes/deleteNote",
    user,
    noteId,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Notes.deleteNote, { noteId, user }]),
});

export const SetTitleRequest: Sync = ({
  request,
  user,
  noteId,
  newTitle,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Notes/setTitle",
    user,
    noteId,
    newTitle,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Notes.setTitle, { noteId, newTitle, user }]),
});

export const UpdateContentRequest: Sync = ({
  request,
  user,
  noteId,
  newContent,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Notes/updateContent",
    user,
    noteId,
    newContent,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Notes.updateContent, { noteId, newContent, user }]),
});

export const MoveNoteRequest: Sync = ({
  request,
  user,
  item,
  folder,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Folder/insertItem",
    user,
    item,
    folder,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Folder.insertItem, { item, folder }]),
});

export const RemoveTagFromItemRequest: Sync = ({
  request,
  user,
  tag,
  item,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Tags/removeTagFromItem",
    user,
    tag,
    item,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Tags.removeTagFromItem, { tag, item }]),
});

export const AddTagToItemRequest: Sync = ({
  request,
  user,
  label,
  item,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Tags/addTagToItem",
    user,
    label,
    item,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Tags.addTag, { user, label, item }]),
});

export const SetSummaryRequest: Sync = ({
  request,
  user,
  summary,
  item,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Summaries/setSummary",
    user,
    summary,
    item,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Summaries.setSummary, { user, summary, item }]),
});

export const SetSummaryWithAIRequest: Sync = ({
  request,
  user,
  text,
  item,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Summaries/setSummaryWithAI",
    user,
    text,
    item,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Summaries.setSummaryWithAI, { user, text, item }]),
});

/********************************* Queries *********************************/
/************************** Usually for Authenticated Requests **********************/
export const GetSummaryRequest: Sync = ({
  request,
  user,
  item,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Summaries/getSummary",
    user,
    item,
    authToken,
  }, {
    request,
  }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Summaries.getSummary, { user, item }]),
});

export const GetNoteDetailsRequest: Sync = ({
  request,
  user,
  noteId,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Notes/getNoteDetails",
    user,
    noteId,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Notes.getNoteDetails, { user, noteId }]),
});

export const GetNotesByUserRequest: Sync = ({
  request,
  user,
  ownerId,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Notes/getNotesByUser",
    user,
    ownerId,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Notes.getNotesByUser, { ownerId }]),
});

export const GetTagsForItemRequest: Sync = ({
  request,
  user,
  item,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Tags/getTagsForItem",
    user,
    item,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Tags.getTagsForItem, { user, item }]),
});

export const GetAllUserTagsRequest: Sync = ({
  request,
  user,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Tags/getAllUserTags",
    user,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Tags.getAllUserTags, { user }]),
});

export const GetAllFoldersRequest: Sync = ({
  request,
  user,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Folder/getAllFolders",
    user,
    authToken,
  }, {
    request,
  }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Folder.getAllFolders, { user }]),
});

export const GetRootFolderIdRequest: Sync = ({
  request,
  user,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Folder/getRootFolderId",
    user,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Folder.getRootFolderId, { user }]),
});
/********************************* User Responses *********************************/

export const DeleteFolderResponse: Sync = ({
  request,
  folderId,
  user,
  accessToken,
  deletedFolders,
  deletedItems,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/deleteFolder", user, folderId }, {
      request,
    }],
    [Folder.deleteFolder, { f: folderId }, { deletedFolders, deletedItems }],
  ),
  where: async (frames) => {
    // Folder.deleteFolder now returns { deletedFolders, deletedItems, owner } on success
    // or { error: string } on failure
    // Error cases are handled by DeleteFolderResponseError which matches on { error }
    // Success cases will have deletedFolders and deletedItems arrays
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
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

export const MoveFolderResponse: Sync = ({
  request,
  success,
  user,
  accessToken,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/moveFolder", user }, { request }],
    [Folder.moveFolder, {}, { success }],
  ),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success, accessToken }]),
});

export const DeleteNoteResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/deleteNote", user }, { request }],
    [Notes.deleteNote, {}, {}],
  ),
  where: async (frames) => {
    // Notes.deleteNote returns {} on success or { error: string } on failure
    // Empty output pattern {} means we don't try to match any output fields
    // Error cases are handled by DeleteNoteResponseError which matches on { error }
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const SetTitleResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions([Requesting.request, { path: "/Notes/setTitle", user }, {
    request,
  }], [Notes.setTitle, {}, {}]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const UpdateContentResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions([Requesting.request, { path: "/Notes/updateContent", user }, {
    request,
  }], [Notes.updateContent, {}, {}]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const MoveNoteResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions([Requesting.request, { path: "/Folder/insertItem", user }, {
    request,
  }], [Folder.insertItem, {}, {}]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const RemoveTagFromItemResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/Tags/removeTagFromItem", user },
    { request },
  ], [Tags.removeTagFromItem, {}, {}]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const AddTagToItemResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions([Requesting.request, { path: "/Tags/addTagToItem", user }, {
    request,
  }], [Tags.addTag, {}, {}]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const SetSummaryResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions([Requesting.request, { path: "/Summaries/setSummary", user }, {
    request,
  }], [Summaries.setSummary, {}, {}]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const SetSummaryWithAIResponse: Sync = ({
  request,
  user,
  accessToken,
}) => ({
  when: actions([Requesting.request, {
    path: "/Summaries/setSummaryWithAI",
    user,
  }, { request }]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, success: true, accessToken }]),
});

export const GetSummaryResponse: Sync = ({
  request,
  user,
  accessToken,
  summary,
}) => ({
  when: actions([Requesting.request, { path: "/Summaries/getSummary", user }, {
    request,
  }], [Summaries.getSummary, {}, { summary }]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, summary, accessToken }]),
});

export const GetNoteDetailsResponse: Sync = ({
  request,
  user,
  noteId,
  accessToken,
  content,
}) => ({
  when: actions([Requesting.request, {
    path: "/Notes/getNoteDetails",
    user,
    noteId,
  }, {
    request,
  }], [Notes.getNoteDetails, {}, { content }]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, content, accessToken }]),
});

export const GetNotesByUserResponse: Sync = ({
  request,
  user,
  ownerId,
  accessToken,
  notes,
}) => ({
  when: actions([Requesting.request, {
    path: "/Notes/getNotesByUser",
    user,
    ownerId,
  }, {
    request,
  }], [Notes.getNotesByUser, {}, { notes }]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, notes, accessToken }]),
});

export const GetTagsForItemResponse: Sync = ({
  request,
  user,
  item,
  accessToken,
  tags,
}) => ({
  when: actions([Requesting.request, {
    path: "/Tags/getTagsForItem",
    user,
    item,
  }, {
    request,
  }], [Tags.getTagsForItem, {}, { tags }]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, tags, accessToken }]),
});

export const GetAllUserTagsResponse: Sync = ({
  request,
  user,
  accessToken,
  tags,
}) => ({
  when: actions([Requesting.request, {
    path: "/Tags/getAllUserTags",
    user,
  }, {
    request,
  }], [Tags.getAllUserTags, {}, { tags }]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, tags, accessToken }]),
});

export const GetAllFoldersResponse: Sync = ({
  request,
  user,
  accessToken,
  folders,
}) => ({
  when: actions([Requesting.request, { path: "/Folder/getAllFolders", user }, {
    request,
  }], [Folder.getAllFolders, {}, { folders }]),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, folders, accessToken }]),
});

export const GetRootFolderIdResponse: Sync = (
  { request, user, rootFolder, accessToken },
) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/getRootFolderId", user }, {
      request,
    }],
    [Folder.getRootFolderId, {}, { rootFolder }],
  ),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, rootFolder, accessToken }]),
});
/********************************* User Errors **********************************/

export const CreateNoteResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/createNote" }, { request }],
    [Notes.createNote, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const CreateFolderResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/createFolder" }, { request }],
    [Folder.createFolder, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const MoveFolderResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/moveFolder" }, { request }],
    [Folder.moveFolder, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeleteFolderResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/deleteFolder" }, { request }],
    [Folder.deleteFolder, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeleteNoteResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/deleteNote" }, { request }],
    [Notes.deleteNote, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const SetTitleResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/setTitle" }, { request }],
    [Notes.setTitle, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const UpdateContentResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/updateContent" }, { request }],
    [Notes.updateContent, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const MoveNoteResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/insertItem" }, { request }],
    [Folder.insertItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const RemoveTagFromItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Tags/removeTagFromItem" }, { request }],
    [Tags.removeTagFromItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AddTagToItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Tags/addTagToItem" }, { request }],
    [Tags.addTag, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetSummaryResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/getSummary" }, { request }],
    [Summaries.getSummary, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetNoteDetailsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/getNoteDetails" }, { request }],
    [Notes.getNoteDetails, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetNotesByUserResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Notes/getNotesByUser" }, { request }],
    [Notes.getNotesByUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetTagsForItemResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Tags/getTagsForItem" }, { request }],
    [Tags.getTagsForItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetAllUserTagsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Tags/getAllUserTags" }, { request }],
    [Tags.getAllUserTags, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const SetSummaryWithAIResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/setSummaryWithAI" }, { request }],
    [Summaries.setSummaryWithAI, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetAllFoldersResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/getAllFolders" }, { request }],
    [Folder.getAllFolders, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetRootFolderIdResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Folder/getRootFolderId" }, { request }],
    [Folder.getRootFolderId, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/********************************* Generate Summary System Sync **********************************/
/**
 * System sync that chains: getNoteDetails -> setSummaryWithAI -> getSummary
 * This simplifies the frontend by handling the entire flow on the backend
 */

export const GenerateSummaryRequest: Sync = ({
  request,
  user,
  noteId,
  authToken,
  authenticatedUser,
}) => ({
  when: actions([Requesting.request, {
    path: "/Summaries/generateSummary",
    user,
    noteId,
    authToken,
  }, { request }]),
  where: async (frames) => {
    return await authenticateRequest(
      frames,
      authToken,
      user,
      authenticatedUser,
    );
  },
  then: actions([Notes.getNoteDetails, { user, noteId }, {}]),
});

export const GenerateSummaryChainToAI: Sync = ({
  request,
  user,
  noteId,
  content,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/generateSummary", user, noteId }, {
      request,
    }],
    [Notes.getNoteDetails, {}, { content }],
  ),
  then: actions([Summaries.setSummaryWithAI, {
    user,
    text: content,
    item: noteId,
  }, {}]),
});

export const GenerateSummaryChainToGet: Sync = ({
  request,
  user,
  noteId,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/generateSummary", user, noteId }, {
      request,
    }],
    [Summaries.setSummaryWithAI, {}, {}],
  ),
  then: actions([Summaries.getSummary, { user, item: noteId }, {}]),
});

export const GenerateSummaryResponse: Sync = ({
  request,
  user,
  accessToken,
  summary,
}) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/generateSummary", user }, {
      request,
    }],
    [Summaries.getSummary, {}, { summary }],
  ),
  where: async (frames) => {
    return await generateTokenForResponse(frames, user, accessToken);
  },
  then: actions([Requesting.respond, { request, summary, accessToken }]),
});

export const GenerateSummaryResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/generateSummary" }, { request }],
    [Notes.getNoteDetails, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GenerateSummaryAIError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/generateSummary" }, { request }],
    [Summaries.setSummaryWithAI, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GenerateSummaryGetError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Summaries/generateSummary" }, { request }],
    [Summaries.getSummary, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/*********************************Helper Functions **********************************/

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
