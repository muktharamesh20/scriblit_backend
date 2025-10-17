# Overall Website Changes
There are multiple changes I have made since Assignment 2.  My biggest issue from Assignment 2 was that my main feature might not be feasible in the timeframe that we have.  I wanted to add real-time collaboration (with handwritten notes).  However, trying to interpret handwriting can take up a lot of credits when using AI, and real-time collaboration is difficult to do. Thus, I've removed the shared-notes concept.  The notes are also no longer handwritten, and instead typed which is more feasible and less expensive.

My main feature will now be a tagging feature which allows students to tag lectures based on how urgent it is to come back to.  This makes it simpler to review notes and visually reminds students to come back to the sections that confused them the most (helps students from pushing back studying to the last minute).  It will also summarize each note so the student can quickly glance at the content. The website will also have an folder feature to organize notes.  


# Specific Concept Changes
## Summaries
In assignment 2, the summarizer concept did not have an LLM component.  Now, I have augmented it with an LLM component that allows you to either manually create the summary or use AI to do it for you for a specific note.  I've also added a deleteSummary() method as I've realized if you delete an item, then you would probably also want to delete the summary associated with it.

## CollaborativeNotes/Notes
I am no longer doing the collaboration feature.  The concept might have been a little too app-specific too.  The concept is now simply Notes.  Notes just have text, when the note was created, and when it was last modified.  It also keeps track of the owner, which was not in CollaborativeNotes since those were shared notes.

## Folder
There were multiple changes to the folder concept.  I realized that I needed to add users to the state to track who owns each folder.  I also realized that we needed a method to actually create a root folder for specific users, which the previous concept didn't have.  My old version also had a method called insertFolder() which was basically acting as a moveFolder() action.  I realized I needed to create a real createFolder() action, and change insertFolder() to moveFolder().  

I also realized how seperated the concepts actually are (check designFile.md) and that I needed a deleteItem() action.

## PasswordAuth
The main change here was changing the state from using usernames and passwords, to using usernames and hashedPasswords.  This was something that ctx came up with when I was using it to help implement my concepts.  This helps increase security for our app. 

## Tags
This mostly stayed the same.  Once change I made here was adding an owner to tags.  I figured that it would be useful for a user to own their own tags, rather than everyone sharing every tag.  I also diallowed any tags that had empty labels, or labels that were completely whitespace.