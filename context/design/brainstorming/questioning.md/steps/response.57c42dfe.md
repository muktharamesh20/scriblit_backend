---
timestamp: 'Tue Oct 14 2025 01:34:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_013428.623b6d2b.md]]'
content_id: 57c42dfe6f4997b5f65b3573e77a865801f1904861ab0c9379e7d0e2dc66e82c
---

# response:

Here's the implementation of the `Folder` concept in TypeScript using MongoDB, following the principles outlined in `implementing-concepts.md` and using `folder.md` as the specification.

The implementation is structured into three main layers:

1. **Domain Layer (`src/domain`):** Defines the core `Folder` interface and related data transfer objects (DTOs). This is technology-agnostic.
2. **Infrastructure Layer (`src/infra`):** Handles external concerns like database interaction (MongoDB/Mongoose).
   * **Schemas:** Defines the MongoDB schema for the `Folder`.
   * **Repositories:** Provides an abstraction for data access operations.
3. **Application Layer (`src/application`):** Contains the business logic, orchestrates operations, applies validation rules, and defines custom errors.

***

### 1. Project Setup (Conceptual `package.json` and `tsconfig.json`)

To run this code, you'd typically need:

**`package.json`**:

```json
{
  "name": "folder-concept-implementation",
  "version": "1.0.0",
  "description": "Implementation of the Folder concept using TypeScript and MongoDB",
  "main": "dist/index.js",
  "scripts": {
    "start": "ts-node src/index.ts",
    "build": "tsc",
    "dev": "nodemon --exec ts-node src/index.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "mongoose": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^5.0.0"
  }
}

```

**`tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

***

### 2. Implementation Files

#### `src/domain/folder/types.ts`

This file defines the core `Folder` interface and the DTOs for creating and updating folders.

```typescript
// src/domain/folder/types.ts

/**
 * Represents the core Folder entity in the domain.
 */
export interface Folder {
  id: string; // Unique identifier for the folder (maps to MongoDB's _id)
  name: string; // Name of the folder, unique within its parent and owner context
  parentId: string | null; // ID of the parent folder, null for root folders
  ownerId: string; // ID of the entity (e.g., user, tenant) that owns this folder
  createdAt: Date; // Timestamp when the folder was created
  updatedAt: Date; // Timestamp when the folder was last updated
}

/**
 * Input data for creating a new folder.
 */
export interface CreateFolderInput {
  name: string;
  parentId?: string | null; // Optional, defaults to null for root folders
  ownerId: string; // Required to scope folder ownership
}

/**
 * Input data for updating an existing folder.
 * All fields are optional as not all properties may be updated at once.
 */
export interface UpdateFolderInput {
  name?: string; // New name for the folder
  parentId?: string | null; // New parent ID for moving the folder
}

```

#### `src/infra/mongodb/schemas/folder.schema.ts`

This file defines the Mongoose schema for the `Folder` entity, mapping our domain model to a MongoDB document structure.

```typescript
// src/infra/mongodb/schemas/folder.schema.ts
import { Schema, model, Document, Types } from 'mongoose';

/**
 * Represents a Folder document in MongoDB.
 * Extends Mongoose's Document to include Mongoose-specific properties like _id.
 */
export interface IFolder extends Document {
  // _id is implicitly added by Mongoose as ObjectId
  name: string;
  parentId: Types.ObjectId | null; // Reference to another folder's _id
  ownerId: Types.ObjectId; // Reference to an owner's _id (e.g., User or Tenant ID)
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>({
  name: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null }, // Referencing itself (Folders)
  ownerId: { type: Schema.Types.ObjectId, required: true, index: true }, // Index for efficient owner-scoped queries
}, {
  timestamps: true, // Mongoose automatically manages createdAt and updatedAt fields
});

// Add a compound unique index to ensure folder names are unique
// within the context of their parent folder and owner.
FolderSchema.index({ name: 1, parentId: 1, ownerId: 1 }, { unique: true });

/**
 * Mongoose model for the Folder collection.
 */
export const FolderModel = model<IFolder>('Folder', FolderSchema);

```

#### `src/infra/mongodb/repositories/folder.repository.ts`

This file provides the data access layer (repository) for the `Folder` entity. It abstracts the MongoDB interactions and translates Mongoose documents to our domain `Folder` type.

```typescript
// src/infra/mongodb/repositories/folder.repository.ts
import { FolderModel, IFolder } from '../schemas/folder.schema';
import { Folder } from '../../../domain/folder/types';
import { Types } from 'mongoose';

/**
 * Repository for interacting with Folder data in MongoDB.
 * Responsible for CRUD operations and translating database objects to domain objects.
 */
export class FolderRepository {

  /**
   * Converts a Mongoose document to our domain Folder interface.
   * @param doc The Mongoose IFolder document.
   * @returns The domain Folder object.
   */
  private toDomain(doc: IFolder): Folder {
    return {
      id: doc._id.toString(),
      name: doc.name,
      parentId: doc.parentId ? doc.parentId.toString() : null,
      ownerId: doc.ownerId.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Converts a string ID to a Mongoose ObjectId.
   * Throws an error if the ID is not a valid ObjectId format.
   * @param id The string ID.
   * @returns The Mongoose ObjectId.
   */
  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId format for ID: ${id}`);
    }
    return new Types.ObjectId(id);
  }

  /**
   * Creates a new folder in the database.
   * @param data The folder creation data.
   * @returns The created folder as a domain object.
   */
  public async create(data: { name: string; parentId?: string | null; ownerId: string }): Promise<Folder> {
    const newFolder = new FolderModel({
      name: data.name,
      parentId: data.parentId ? this.toObjectId(data.parentId) : null,
      ownerId: this.toObjectId(data.ownerId),
    });
    const savedFolder = await newFolder.save();
    return this.toDomain(savedFolder);
  }

  /**
   * Finds a folder by its ID.
   * @param id The ID of the folder.
   * @returns The folder if found, otherwise null.
   */
  public async findById(id: string): Promise<Folder | null> {
    const folder = await FolderModel.findById(this.toObjectId(id));
    return folder ? this.toDomain(folder) : null;
  }

  /**
   * Finds a folder by its name, parent ID, and owner ID.
   * Used for uniqueness checks within a parent directory.
   * @param name The name of the folder.
   * @param parentId The ID of the parent folder (null for root).
   * @param ownerId The ID of the owner.
   * @returns The folder if found, otherwise null.
   */
  public async findByNameAndParent(name: string, parentId: string | null, ownerId: string): Promise<Folder | null> {
    const query: any = { name, ownerId: this.toObjectId(ownerId) };
    if (parentId) {
      query.parentId = this.toObjectId(parentId);
    } else {
      query.parentId = null;
    }
    const folder = await FolderModel.findOne(query);
    return folder ? this.toDomain(folder) : null;
  }

  /**
   * Finds all direct subfolders of a given parent ID and owner ID.
   * @param parentId The ID of the parent folder (null for root folders).
   * @param ownerId The ID of the owner.
   * @returns An array of subfolders.
   */
  public async findByParentId(parentId: string | null, ownerId: string): Promise<Folder[]> {
    const query: any = { ownerId: this.toObjectId(ownerId) };
    if (parentId) {
      query.parentId = this.toObjectId(parentId);
    } else {
      query.parentId = null;
    }
    const folders = await FolderModel.find(query).sort({ name: 1 }); // Sort by name for consistent order
    return folders.map(this.toDomain);
  }

  /**
   * Updates an existing folder.
   * @param id The ID of the folder to update.
   * @param updates An object containing the fields to update (name, parentId).
   * @returns The updated folder if found, otherwise null.
   */
  public async update(id: string, updates: { name?: string; parentId?: string | null }): Promise<Folder | null> {
    const updatePayload: any = { updatedAt: new Date() }; // Always update timestamp
    if (updates.name !== undefined) {
      updatePayload.name = updates.name;
    }
    if (updates.parentId !== undefined) {
      updatePayload.parentId = updates.parentId ? this.toObjectId(updates.parentId) : null;
    }

    const updatedFolder = await FolderModel.findByIdAndUpdate(
      this.toObjectId(id),
      { $set: updatePayload },
      { new: true } // Return the updated document
    );
    return updatedFolder ? this.toDomain(updatedFolder) : null;
  }

  /**
   * Deletes a single folder by its ID.
   * @param id The ID of the folder to delete.
   * @returns True if the folder was deleted, false otherwise.
   */
  public async delete(id: string): Promise<boolean> {
    const result = await FolderModel.deleteOne({ _id: this.toObjectId(id) });
    return result.deletedCount === 1;
  }

  /**
   * Deletes multiple folders by their IDs.
   * @param ids An array of folder IDs to delete.
   * @returns The number of folders deleted.
   */
  public async deleteMany(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const objectIds = ids.map(id => this.toObjectId(id));
    const result = await FolderModel.deleteMany({ _id: { $in: objectIds } });
    return result.deletedCount;
  }

  /**
   * Recursively finds all descendant folder IDs, including the starting folder ID itself.
   * Implements a Breadth-First Search (BFS) to traverse the folder hierarchy.
   * @param folderId The starting folder ID.
   * @returns An array of string IDs for the folder and all its descendants.
   */
  public async getDescendantIds(folderId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue: string[] = [folderId]; // Start the queue with the initial folder

    while (queue.length > 0) {
      const currentId = queue.shift()!; // Dequeue the next folder ID
      descendants.push(currentId); // Add it to our list of descendants

      // Find direct children of the current folder
      const children = await FolderModel.find({ parentId: this.toObjectId(currentId) }, { _id: 1 });
      children.forEach(child => queue.push(child._id.toString())); // Enqueue children for further processing
    }
    return descendants;
  }

  /**
   * Checks if a folder has any direct subfolders.
   * @param folderId The ID of the folder to check.
   * @returns True if the folder has children, false otherwise.
   */
  public async hasChildren(folderId: string): Promise<boolean> {
    const count = await FolderModel.countDocuments({ parentId: this.toObjectId(folderId) });
    return count > 0;
  }

  /**
   * Retrieves all ancestor folders (from root to immediate parent) of a given folder.
   * The returned array is ordered from the highest ancestor (root) down to the immediate parent.
   * The folder itself is NOT included in the ancestors list.
   * @param folderId The ID of the folder.
   * @returns An array of ancestor folders.
   */
  public async getAncestors(folderId: string): Promise<Folder[]> {
    let currentFolderId: string | null = folderId;
    const path: Folder[] = []; // Store path from current folder upwards
    const ancestors: Folder[] = []; // Store ancestors from root downwards

    // Traverse upwards from the current folder to the root
    while (currentFolderId) {
      const folder = await this.findById(currentFolderId);
      if (folder) {
        path.push(folder); // Add to the temporary path
        currentFolderId = folder.parentId;
      } else {
        currentFolderId = null; // Break loop if folder not found or root reached
      }
    }

    // The path is currently [currentFolder, parent, grandparent, ..., root]
    // We want [root, grandparent, ..., parent]
    // Remove the current folder from path, then reverse to get root-to-parent order.
    path.pop(); // Remove the current folder itself
    ancestors.push(...path.reverse()); // Reverse to get ancestors from root to parent

    return ancestors;
  }
}

```

#### `src/application/folder/folder.service.ts`

This file contains the business logic for managing folders. It uses the `FolderRepository` to interact with the database and enforces domain-specific rules and validations.

```typescript
// src/application/folder/folder.service.ts
import { FolderRepository } from '../../infra/mongodb/repositories/folder.repository';
import { Folder, CreateFolderInput, UpdateFolderInput } from '../../domain/folder/types';

// --- Custom Error Definitions ---
// These provide specific error contexts for API consumers.
export class FolderNotFoundError extends Error {
  constructor(message: string = "Folder not found") { super(message); this.name = "FolderNotFoundError"; }
}
export class DuplicateFolderNameError extends Error {
  constructor(message: string = "A folder with this name already exists in the parent directory.") { super(message); this.name = "DuplicateFolderNameError"; }
}
export class FolderNotEmptyError extends Error {
  constructor(message: string = "Folder is not empty and cannot be deleted without recursive option.") { super(message); this.name = "FolderNotEmptyError"; }
}
export class InvalidFolderMoveError extends Error {
  constructor(message: string = "Cannot move a folder into itself or its descendants.") { super(message); this.name = "InvalidFolderMoveError"; }
}
export class ParentFolderNotFoundError extends Error {
  constructor(message: string = "Parent folder not found or not owned by the specified owner.") { super(message); this.name = "ParentFolderNotFoundError"; }
}

/**
 * Service layer for managing Folder entities.
 * Encapsulates business logic, validation, and orchestrates repository calls.
 */
export class FolderService {
  private folderRepository: FolderRepository;

  constructor(folderRepository: FolderRepository) {
    this.folderRepository = folderRepository;
  }

  /**
   * Creates a new folder.
   * Validates parent existence and folder name uniqueness within its parent and owner scope.
   * @param input The data for the new folder.
   * @returns The created Folder.
   * @throws ParentFolderNotFoundError if the specified parent folder does not exist or isn't owned by the owner.
   * @throws DuplicateFolderNameError if a folder with the same name already exists in the target parent path for the owner.
   */
  public async createFolder(input: CreateFolderInput): Promise<Folder> {
    const { name, parentId, ownerId } = input;

    // 1. Validate parent folder existence and ownership (if parentId is provided)
    if (parentId) {
      const parentFolder = await this.folderRepository.findById(parentId);
      if (!parentFolder || parentFolder.ownerId !== ownerId) {
        throw new ParentFolderNotFoundError();
      }
    }

    // 2. Check for duplicate name within the target parent folder for this owner
    const existingFolder = await this.folderRepository.findByNameAndParent(name, parentId, ownerId);
    if (existingFolder) {
      throw new DuplicateFolderNameError();
    }

    // 3. Create the folder via the repository
    return this.folderRepository.create({ name, parentId, ownerId });
  }

  /**
   * Retrieves a folder by its ID.
   * @param id The ID of the folder.
   * @returns The Folder if found, otherwise null.
   */
  public async getFolder(id: string): Promise<Folder | null> {
    return this.folderRepository.findById(id);
  }

  /**
   * Retrieves all root folders for a given owner.
   * Root folders are those with `parentId` as null.
   * @param ownerId The ID of the owner.
   * @returns An array of root folders.
   */
  public async getRootFolders(ownerId: string): Promise<Folder[]> {
    return this.folderRepository.findByParentId(null, ownerId);
  }

  /**
   * Retrieves all direct subfolders of a specified parent folder for a given owner.
   * @param parentId The ID of the parent folder.
   * @param ownerId The ID of the owner.
   * @returns An array of subfolders.
   * @throws ParentFolderNotFoundError if the specified parent folder does not exist or isn't owned by the owner.
   */
  public async getSubfolders(parentId: string, ownerId: string): Promise<Folder[]> {
    const parentFolder = await this.folderRepository.findById(parentId);
    if (!parentFolder || parentFolder.ownerId !== ownerId) {
      throw new ParentFolderNotFoundError();
    }
    return this.folderRepository.findByParentId(parentId, ownerId);
  }

  /**
   * Updates an existing folder's name or moves it to a new parent.
   * Performs comprehensive validation for moves and name changes.
   * @param id The ID of the folder to update.
   * @param ownerId The ID of the owner (for ownership check).
   * @param updates The update data (name and/or parentId).
   * @returns The updated Folder.
   * @throws FolderNotFoundError if the folder does not exist or isn't owned by the owner.
   * @throws DuplicateFolderNameError if the new name conflicts with an existing folder in the target parent path.
   * @throws InvalidFolderMoveError if the move operation is invalid (e.g., moving to self or a descendant).
   * @throws ParentFolderNotFoundError if the new parent folder does not exist or isn't owned by the owner.
   */
  public async updateFolder(id: string, ownerId: string, updates: UpdateFolderInput): Promise<Folder> {
    const folder = await this.folderRepository.findById(id);
    if (!folder || folder.ownerId !== ownerId) {
      throw new FolderNotFoundError();
    }

    // Determine the effective new parentId and name for validation
    const targetParentId = updates.parentId !== undefined ? updates.parentId : folder.parentId;
    const targetName = updates.name !== undefined ? updates.name : folder.name;

    // --- Validation for name change ---
    if (updates.name !== undefined && updates.name !== folder.name) {
      const existingFolder = await this.folderRepository.findByNameAndParent(targetName, targetParentId, ownerId);
      // If a folder with the new name already exists in the current/new parent path
      // AND it's not the folder we are trying to update, then it's a duplicate.
      if (existingFolder && existingFolder.id !== id) {
        throw new DuplicateFolderNameError();
      }
    }

    // --- Validation for parentId change (move folder) ---
    if (updates.parentId !== undefined && updates.parentId !== folder.parentId) {
      const newParentId = updates.parentId;

      // 1. Validate new parent existence and ownership
      if (newParentId) {
        const newParentFolder = await this.folderRepository.findById(newParentId);
        if (!newParentFolder || newParentFolder.ownerId !== ownerId) {
          throw new ParentFolderNotFoundError(`New parent folder with ID ${newParentId} not found or not owned by ${ownerId}.`);
        }
      }

      // 2. Prevent moving a folder into itself
      if (newParentId === id) {
        throw new InvalidFolderMoveError("Cannot move a folder into itself.");
      }

      // 3. Prevent moving a folder into its own descendants
      if (newParentId) {
        const descendantIds = await this.folderRepository.getDescendantIds(id); // Includes the folder itself
        if (descendantIds.includes(newParentId)) {
          throw new InvalidFolderMoveError("Cannot move a folder into its own descendant path.");
        }
      }

      // 4. Check for name uniqueness in the new parent folder
      // (This is important if only parentId is changing, and name is implicitly kept)
      const existingFolderInNewParent = await this.folderRepository.findByNameAndParent(targetName, newParentId, ownerId);
      if (existingFolderInNewParent && existingFolderInNewParent.id !== id) {
        throw new DuplicateFolderNameError(`A folder named '${targetName}' already exists in the target parent folder.`);
      }
    }

    // 5. Perform the update via the repository
    const updatedFolder = await this.folderRepository.update(id, updates);
    if (!updatedFolder) {
      // This case should ideally not be reached if the initial findById was successful
      throw new FolderNotFoundError(`Failed to update folder with ID ${id}. It might have been deleted concurrently.`);
    }
    return updatedFolder;
  }

  /**
   * Deletes a folder. Can be performed recursively to delete all subfolders.
   * @param id The ID of the folder to delete.
   * @param ownerId The ID of the owner (for ownership check).
   * @param recursive If true, all subfolders and their contents will also be deleted. Defaults to false.
   * @returns True if the folder (and its descendants, if recursive) was successfully deleted.
   * @throws FolderNotFoundError if the folder does not exist or isn't owned by the owner.
   * @throws FolderNotEmptyError if the folder has contents and `recursive` is false.
   */
  public async deleteFolder(id: string, ownerId: string, recursive: boolean = false): Promise<boolean> {
    const folder = await this.folderRepository.findById(id);
    if (!folder || folder.ownerId !== ownerId) {
      throw new FolderNotFoundError();
    }

    if (!recursive) {
      // If not recursive, check if the folder is empty
      const hasChildren = await this.folderRepository.hasChildren(id);
      if (hasChildren) {
        throw new FolderNotEmptyError();
      }
      return this.folderRepository.delete(id); // Delete only the specified folder
    } else {
      // If recursive, find all descendants (including the folder itself) and delete them
      const idsToDelete = await this.folderRepository.getDescendantIds(id);
      const deletedCount = await this.folderRepository.deleteMany(idsToDelete);
      return deletedCount > 0; // Return true if at least one folder was deleted
    }
  }

  /**
   * Constructs and returns the full hierarchical path of a folder, e.g., "/Root/Subfolder/TargetFolder".
   * @param id The ID of the target folder.
   * @param ownerId The ID of the owner (for ownership check).
   * @returns The full path string.
   * @throws FolderNotFoundError if the folder does not exist or isn't owned by the owner.
   */
  public async getFolderPath(id: string, ownerId: string): Promise<string> {
    const folder = await this.folderRepository.findById(id);
    if (!folder || folder.ownerId !== ownerId) {
      throw new FolderNotFoundError();
    }

    const ancestors = await this.folderRepository.getAncestors(id);
    const pathSegments = ancestors.map(f => f.name);
    pathSegments.push(folder.name); // Add the current folder's name at the end

    return "/" + pathSegments.join("/");
  }
}

```

#### `src/index.ts`

This is an example entry point demonstrating how to use the `FolderService` with a MongoDB connection. It's useful for testing and showcasing the functionality.

```typescript
// src/index.ts
import mongoose from 'mongoose';
import { FolderRepository } from './infra/mongodb/repositories/folder.repository';
import {
  FolderService,
  DuplicateFolderNameError,
  FolderNotEmptyError,
  InvalidFolderMoveError,
  FolderNotFoundError,
  ParentFolderNotFoundError
} from './application/folder/folder.service';
import { Types } from 'mongoose';

async function main() {
  // --- 1. Connect to MongoDB ---
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/folder_concept_db';
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear the database for a fresh start each time
    await mongoose.connection.db.dropDatabase();
    console.log('Database cleared for example run.');

    const folderRepository = new FolderRepository();
    const folderService = new FolderService(folderRepository);

    // Simulate different owner IDs for multi-tenancy testing
    const testOwnerId = new Types.ObjectId().toString();
    const anotherOwnerId = new Types.ObjectId().toString();
    console.log(`\nUsing testOwnerId: ${testOwnerId}`);
    console.log(`Using anotherOwnerId: ${anotherOwnerId}`);

    console.log('\n--- Creating Root Folders ---');
    const rootFolder1 = await folderService.createFolder({ name: 'MyDocuments', ownerId: testOwnerId });
    console.log('Created:', rootFolder1.name, 'ID:', rootFolder1.id);

    const rootFolder2 = await folderService.createFolder({ name: 'MyPhotos', ownerId: testOwnerId });
    console.log('Created:', rootFolder2.name, 'ID:', rootFolder2.id);

    const rootFolderForOtherOwner = await folderService.createFolder({ name: 'TheirStuff', ownerId: anotherOwnerId });
    console.log('Created (Other Owner):', rootFolderForOtherOwner.name, 'ID:', rootFolderForOtherOwner.id);

    console.log('\n--- Creating Subfolders ---');
    const projectFolder = await folderService.createFolder({ name: 'ProjectX', parentId: rootFolder1.id, ownerId: testOwnerId });
    console.log('Created:', projectFolder.name, 'ID:', projectFolder.id, 'Parent:', rootFolder1.name);

    const reportsFolder = await folderService.createFolder({ name: 'Reports', parentId: projectFolder.id, ownerId: testOwnerId });
    console.log('Created:', reportsFolder.name, 'ID:', reportsFolder.id, 'Parent:', projectFolder.name);

    const q1ReportsFolder = await folderService.createFolder({ name: 'Q1', parentId: reportsFolder.id, ownerId: testOwnerId });
    console.log('Created:', q1ReportsFolder.name, 'ID:', q1ReportsFolder.id, 'Parent:', reportsFolder.name);

    console.log('\n--- Attempting to Create Duplicate Folder (should fail) ---');
    try {
      await folderService.createFolder({ name: 'ProjectX', parentId: rootFolder1.id, ownerId: testOwnerId });
    } catch (e) {
      if (e instanceof DuplicateFolderNameError) console.error('Error (expected):', e.message);
      else throw e;
    }

    console.log('\n--- Getting Subfolders of MyDocuments ---');
    const myDocumentsSubfolders = await folderService.getSubfolders(rootFolder1.id, testOwnerId);
    console.log('MyDocuments subfolders:', myDocumentsSubfolders.map(f => f.name));

    console.log('\n--- Updating Folder Name ---');
    const updatedProjectFolder = await folderService.updateFolder(projectFolder.id, testOwnerId, { name: 'NewProjectAlpha' });
    console.log('Updated:', updatedProjectFolder.name, 'ID:', updatedProjectFolder.id);

    console.log('\n--- Moving Folder (Reports from NewProjectAlpha to MyPhotos) ---');
    const movedReportsFolder = await folderService.updateFolder(reportsFolder.id, testOwnerId, { parentId: rootFolder2.id });
    console.log('Moved Reports to MyPhotos:', movedReportsFolder.name, 'ID:', movedReportsFolder.id, 'New Parent:', rootFolder2.name);
    console.log('Subfolders of MyPhotos now:', (await folderService.getSubfolders(rootFolder2.id, testOwnerId)).map(f => f.name));
    console.log('Subfolders of NewProjectAlpha now:', (await folderService.getSubfolders(updatedProjectFolder.id, testOwnerId)).map(f => f.name));

    console.log('\n--- Getting Folder Path ---');
    console.log('Path for Q1 Reports:', await folderService.getFolderPath(q1ReportsFolder.id, testOwnerId));
    console.log('Path for NewProjectAlpha:', await folderService.getFolderPath(updatedProjectFolder.id, testOwnerId));

    console.log('\n--- Attempting Invalid Move (into itself - should fail) ---');
    try {
      await folderService.updateFolder(projectFolder.id, testOwnerId, { parentId: projectFolder.id });
    } catch (e) {
      if (e instanceof InvalidFolderMoveError) console.error('Error (expected):', e.message);
      else throw e;
    }

    console.log('\n--- Attempting Invalid Move (into descendant - should fail) ---');
    try {
      // rootFolder1 (MyDocuments) -> ProjectX (NewProjectAlpha) -> Reports -> Q1
      // Try to move MyDocuments into Q1
      await folderService.updateFolder(rootFolder1.id, testOwnerId, { parentId: q1ReportsFolder.id });
    } catch (e) {
      if (e instanceof InvalidFolderMoveError) console.error('Error (expected):', e.message);
      else throw e;
    }

    console.log('\n--- Attempting to delete non-empty folder (should fail without recursive) ---');
    try {
      await folderService.deleteFolder(updatedProjectFolder.id, testOwnerId); // NewProjectAlpha still has Reports' old children (Q1) if not moved
    } catch (e) {
      if (e instanceof FolderNotEmptyError) console.error('Error (expected):', e.message);
      else throw e;
    }

    console.log('\n--- Creating a temporary structure for recursive deletion ---');
    const tempRoot = await folderService.createFolder({ name: 'TempRoot', ownerId: testOwnerId });
    const tempChild1 = await folderService.createFolder({ name: 'TempChild1', parentId: tempRoot.id, ownerId: testOwnerId });
    const tempChild2 = await folderService.createFolder({ name: 'TempChild2', parentId: tempChild1.id, ownerId: testOwnerId });
    console.log('Created temporary structure: TempRoot -> TempChild1 -> TempChild2');

    console.log('\n--- Deleting TempRoot folder recursively ---');
    const deletedTempRoot = await folderService.deleteFolder(tempRoot.id, testOwnerId, true);
    console.log(`Deleted TempRoot and its contents recursively: ${deletedTempRoot ? 'Yes' : 'No'}`);
    console.log('TempRoot should be null:', await folderService.getFolder(tempRoot.id));
    console.log('TempChild1 should be null:', await folderService.getFolder(tempChild1.id));
    console.log('TempChild2 should be null:', await folderService.getFolder(tempChild2.id));

    console.log('\n--- Deleting a single empty folder ---');
    const emptyFolder = await folderService.createFolder({ name: 'Empty', parentId: rootFolder1.id, ownerId: testOwnerId });
    console.log('Created empty folder:', emptyFolder.name);
    const deletedEmpty = await folderService.deleteFolder(emptyFolder.id, testOwnerId);
    console.log(`Deleted empty folder: ${deletedEmpty ? 'Yes' : 'No'}`);
    console.log('Empty folder should be null:', await folderService.getFolder(emptyFolder.id));

  } catch (error) {
    console.error('An unexpected error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();

```
