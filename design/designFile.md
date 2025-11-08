## Interesting moment 1
![Implementing Password Auth](../context/design/brainstorming/questioning.md/20251014_010352.1dce5115.md) 
When trying to get ctx to implement my passwordAuth concept, interestingly, the LLM generated a lot of extra methods that it wanted to add.  When dealing with passwords and usernames, ctx realized how important security was, and tried to implement methods that dealt with that.  However, it also tried importing from files that didn't exist to create these new authentication methods which was a little annoying.  I also realized that having methods like changing a password and logging in might be useful in addition to the authentication, so I'm adding those.

# Interesting Moment 2
![Folders](../context/design/brainstorming/questioning.md/20251014_012241.143afb76.md)
I realized a flaw in the folder design when ctx created one for me.  In its example, a new folder called "My Documents" is created.  However, currently, the concept can't differentiate between users and who owns each folder.  Also, two users need a root folder, but the current implementation only allows one to be created in total.  Each folder, therefore needs to be attached to an owner.  That way, each person can have their own root folders and own set of folders in general.

# Interesting Moment 3
![realized an oversight](../context/src/concepts/Scriblink/folder.ts/20251014_233625.2db0d96a.md)
When implementing insertFolder, I realized that I don't have an actual method to create a standalone folder.  My current insertFolder action assumes that you already created one, and actually acts more like a moveFolder action.  I'm changing the current "insertFolder" to "moveFolder", and creating a new "insertFolder" method.

# Interesting Moment 4
![not deleting items](../context/design/brainstorming/questioning.md/steps/response.d7e62682.md)
This was a really interesting choice that the LLM decided to make.  For deleteFolder, it only deleted folders, not items.  In hindsight, this makes a lot of sense because we're only keeping id's of items which are a seperate concept, but it was cool that the LLM knew this and neglected it.  One thing is that this will add an additional sync in the future.  When a folder is deleted, all the items within the folder should also be deleted, because otherwise they're taking up storage and you simply can't get to them.  

This also made me realize, I have to add a deleteItem() action so that when an item is deleted in a different concept, the folder can also delete it from its hierarchy in a sync.

# Interesting Moment 5
![Adding hashing](../context/design/brainstorming/questioning.md/20251015_093451.0fe2491f.md)
Gemini added password hashing and additional method to compare hashed vs input passwords.  This was really cool that it automaticaly tried adding some security.

# Interesting Moment 6
![implementing tagging](../context/design/brainstorming/questioning.md/20251015_100215.ba3aa5af.md)
After reading through what the LLM implemented, I realized I didn't really put in the spec how addTag and removeTag worked, but the LLM could interpret it and even looks for edge cases which is pretty cool.  As an aside, it's also interesting how many comments the LLM is putting with my newer version of the prompt.  I think it's helping it get better results too.

# Interesting Moment 7
![testing private methods](../context/design/brainstorming/questioning.md/20251015_160947.85120102.md)
This was really interesting.  When I tried to get the llm to test my class, it created a new "fakeFolder" class that extended the real class in order to get access to private methods.  I think it was really cool problem solving by the llm.  I don't think I will use it, but it was pretty interesting.

#Interesting Moment 8
![not calling gemini](../context/design/brainstorming/questioning.md/20251015_174627.5ca4a016.md)
I asked context to make a test file for me, and it was cool because it used something called stud.  stud basically allows me to just test the validation logic and error handling, basically stopping actual gemini api calls.  This was a cool idea because otherwise frequent testing could be expensive, as well as really slow.  If gemini's api was down, it would also cause failure.  This way, the unit tests test my actual code, not the gemini.  However, I'll still have tests with the gemini tests to make sure the prompting is good.


# Major Changes Afterwards
There were three changes to the backend afterwards.

## Summary prompts:
I updated the summary prompt that calls gemini to specifically prompt out my requirements.  For instance, my validation code was checking that all summaries were under 200 words, but I never told gemini to keep it under 200 words.  I also explicitly told it to avoid meta words like "I am" and "this is a summary", which also helped improve the number of times that it actually generated a valid summary.

## Adding id's to labels:
I had a method in tags concept which just returned the label names that the user could choose from.  However, we also needed the tag id in order to do interesting things with it such as untag tags from notes.  I didn't realize this, and had to fix it in my tags concept and my request concept.

## Adding the Requests file:
This is new code that basically lets me do syncs.  I was having trouble making the code automatically do actions like create root folders and such only from the frontend, so this was a way to combine actions. In the final assignment, when we truley do syncs, I'll get rid of this, or modify it.

# Other Interesting Moments
- adding spinner to indicate generation
- adding auth tokens... balancing between making them not usable forever but also stay active as long as you're active
- changing generateSummaries and getUserNotes to be backend syncs
- making tagsoverview go faster
- added a search bar
- 