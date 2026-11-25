# Patch Knight 🛡️🐛

A PLTL game for CS2 (C++). The RPG is broken: each zone of the world has bugs, and students fix the code to repair
that part of the game and unlock the next zone.

| Zone | Topic |
|---|---|
| 🎒 Inventory Caves | Linked lists |
| 🗡️ Armory of Pointers | Pointers & dynamic memory |
| 🧙 Guild Hall | Classes & constructors |
| 🏰 Recursive Dungeon | Recursion |
| 🏆 Arena Rankings | Sorting |
| 🗺️ Cartographer's Tower | Searching |

Each zone has 8 bugs (48 in all). Four puzzle types: fill in the blank, find & fix the buggy line, put lines in order, and predict the output. Answers
are checked on the server (spacing doesn't matter; common mistakes get specific feedback). Hints cost XP; after
three misses a student can ask to see the fix.

- `/` the leader: start a game, the live class dashboard (everyone's zone and progress, the most-missed bugs), and
  the report with an Excel download
- `/join` students, solo or a small group on one screen (laptops are best for typing code)

Backend: the shared Supabase project (`pk-game` and `pk-play` Edge Functions, `pk_*` tables). The bugs, answers
and checker are in `supabase/functions/_shared/patchKnight.ts` (tests in `patchKnight_test.ts`).

## Run it

```
npm install
cp .env.example .env.local   # add the Supabase URL and publishable key
npm run dev
```
