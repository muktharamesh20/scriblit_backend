## make sure to link to the snapshots corresponding to the interesting moments

## a design file that explains changes that you made to the design of the application as a whole, and that includes 5-10 pointers to interesting moments (explained below) in your development, each with a couple of sentences explaining it.

Sequences of action executions that correspond to less common cases: probing interesting corners of the functionality, undoing actions with deletions and cancellations, repeating actions with the same arguments, etc. In some of these scenarios actions may be expected to throw errors.

As you work on your implementation, some moments will be worth recording. For example, you might discover that your concept specification was wrong in some way; a test run might expose a subtle bug in a concept implementation; the LLM might generate some code that is unexpectedly good or bad in some way; you might discover a way to simplify your design; and so on. When any such moment arises, you should save a link to the relevant file and place it in your design document. Make sure to save a link to a snapshot in the context area, not a link to a file in the design or source code areas (since those are mutable). If this moment did not arise from running the LLM, you should save the relevant files by creating a little design document to record your observations, and then run the tool with the save option to snapshot the files first.


## Interesting moment 1
This is my first attempt at trying to use the ctx tool to create a concept spec.
![Generating Conecpt Spec Prompt](../context/design/brainstorming/questioning.md/20251013_232619.9d7e6fff.md)
Interestingly, I tried to give the tool some background information and instead of using the background information to create a better spec, it just changed my old specs to look more like the background information.  Specifically, it changed the purpose to what it wanted the purpose to be.

## Interesting moment 2
![Implementing Password Auth](../context/design/brainstorming/questioning.md/20251014_010352.1dce5115.md) 
When trying to get ctx to implement my passwordAuth concept, interestingly, the LLM generated a lot of extra methods that it wanted to add.  When dealing with passwords and usernames, ctx realized how important security was, and tried to implement methods that dealt with that.  However, it also tried importing from files that didn't exist to create these new authentication methods which was a little annoying.  I also realized that having methods like changing a password and logging in might be useful in addition to the authentication, so I'm adding those.


# Interesting Moment 3
![Folders](../context/design/brainstorming/questioning.md/20251014_012241.143afb76.md)
I realized a flaw in the folder design when ctx created one for me.  In its example, a new folder called "My Documents" is created.  However, currently, the concept can't differentiate between users.  Two users need a root folder, but the current implementation only allows one to be created in total.  Each folder, therefore needs to be attached to an owner, something that I just didn't think about before this.  That way, each person can have their own root folders and own set of folders in general.

# Interesting Moment 4
![a prompt](../context/design/brainstorming/questioning.md/20251014_013829.3e7a3953.md)
This implemented the folder.  I finally got a decent (but not perfect) implementation that the AI created.

# Interesting Moment 5
![realized an oversight](../context/src/concepts/Scriblink/folder.ts/20251014_233625.2db0d96a.md)
When implementing insertFolder, I realized that I don't have an actual method to create a standalone folder.  This one assumes that you already created one, and even lets you move one.  I'm changing the current "insertFolder" to "moveFolder", and creating a new "insertFolder" method

# Interesting Moment 6
![not deleting items](../context/design/brainstorming/questioning.md/steps/response.d7e62682.md)
This was a really interesting choice that the LLM decided to make.  For deleteFolder, it didn't delete the items, just the folders taht the items were connected to.  In hindsight, this makes a lot of sense because we're only keeping id's of items which are a seperate concept, but it was cool that the LLM knew this and neglected it.  One thing is that this will add an additional sync in the future.  When a folder is deleted, all the items within the folder should also be deleted, because otherwise they're taking up storage and you simply can't get to them.  

I also was thinking that deleting an item would be part of the items concept, but I also have to add an additonal function to the folder concept to delete an item specifically from a folder, so that a sync that deletes an item can delete the item itself and delete the item from the folder that it is in.

# Interesting Moment 7
![Adding hashing](../context/design/brainstorming/questioning.md/20251015_093451.0fe2491f.md)
Gemini added password hashing and additional method to compare hashed vs input passwords.  This was really cool that it automaticaly tried adding some security.

# Interesting Moment 8
![implementing tagging](../context/design/brainstorming/questioning.md/20251015_100215.ba3aa5af.md)
After reading through what the LLM implemented, I realized I didn't really put in the spec how addTag and removeTag worked, but the LLM could interpret it and even looks for edge cases which is pretty cool.  As an aside, it's also interesting how many comments the LLM is putting with my newer version of the prompt.  I think it's helping it get better results too.

# Interesting Moment 9
![need to test multiple at once](context/design/brainstorming/questioning.md/20251015_142604.b5571f66.md)
Even thought the modules... actually nevermind

Just as a note, I'm going to seperate my testing files by concept.  Then I'll have an integration test file.  I'll make partitions like 6.102 as well.

# INteresting Moment 10
![testing private methods](../../context/design/brainstorming/questioning.md/20251015_160947.85120102.md)
This was really interesting.  When I tried to get the llm to test my class, it created a new "fakeFolder" class that extended the real class in order to get access to private methods.  I think it was really cool problem solving by the llm.  I think I might actually keep it just for the private methods, but have the LLM test the actual concept itself for the non-private methods.