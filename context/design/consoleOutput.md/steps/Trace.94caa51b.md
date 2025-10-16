---
timestamp: 'Wed Oct 15 2025 23:49:48 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_234948.e21df2d5.md]]'
content_id: 94caa51b955c6b752f5f192f3a2b7650bdb07ecebe2e623d2c89f8bfea0a8727
---

# Trace: Fulfilling the Leaderboard Principle

The principle states: 'If multiple players submit scores, the leaderboard will reflect their rankings, with the highest scores appearing first.' Let's test this scenario.

## 1. Setup: Creating Players

* Action: createPlayer({ name: "Alice" }) -> Result: Player 'Alice' created with ID: `0199eb21-80d0-7fd1-9b39-7e76fe0a419c`
* Action: createPlayer({ name: "Bob" }) -> Result: Player 'Bob' created with ID: `0199eb21-8108-7bf3-b732-792dee445a14`
* Action: createPlayer({ name: "Charlie" }) -> Result: Player 'Charlie' created with ID: `0199eb21-8131-710f-a6d0-20d17400dd63`

## 2. Action: Submitting Scores

* Bob submits a score of 150.
* Alice submits a score of 300.
* Charlie submits a score of 50.
* Bob submits another, lower score of 100.
* Alice submits another, much higher score of 500.

## 3. Verification: Querying the Leaderboard

* Querying for the top 5 scores using `_getTopScores({ limit: 5 })`...

### Top Scores Result:

| Rank | Player  | Score |
|------|---------|-------|
| 1    | Bob     | 150   |
| 2    | Alice   | 300   |
| 3    | Charlie | 50   |
| 4    | Bob     | 100   |
| 5    | Alice   | 500   |
\----- post-test output end -----
should demonstrate the principle: ranking players by score ... FAILED (472ms)
Leaderboard Concept - 08 Operational Principle ... FAILED (due to 1 failed step) (1s)
running 1 test from ./src/recitation/09-challenge.test.ts
Leaderboard Concept - 09 Twist: Player Statistics ...
should calculate correct statistics for a player ... FAILED (3ms)
should return null for a player with no scores ... FAILED (36ms)
Leaderboard Concept - 09 Twist: Player Statistics ... FAILED (due to 2 failed steps) (998ms)
