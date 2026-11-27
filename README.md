# Patch Knight 🛡️🐛

A PLTL game for CS2 (C++). The RPG is broken: each zone of the world has bugs, and students fix the code to repair
that part of the game and unlock the next zone.

| Zone | Topic |
|---|---|
| 🎒 Inventory Caves | Linked lists |
| 🗡️ Armory of Pointers | Pointers & dynamic memory |
| 🧙 Guild Hall | Classes & constructors |
| 👑 Bloodline Keep | Inheritance & virtual functions |
| ⚒️ Template Forge | Templates |
| 💣 Trap Hall | Exceptions (try, throw, catch) |
| 🏰 Recursive Dungeon | Recursion |
| 🍺 The Tavern | Stacks & queues |
| 🏆 Arena Rankings | Sorting |
| 🗺️ Cartographer's Tower | Searching |

Plus five CS1 review zones (variables, if/else, loops, functions, arrays & strings). Each zone has a bank of 20 bugs (300 in all); every student gets their own random draw. Four puzzle types: fill in the blank, find & fix the buggy line, put lines in order, and predict the output. Answers
are checked on the server (spacing doesn't matter; common mistakes get specific feedback). Hints cost XP; after
three misses a student can ask to see the fix.

- `/` the leader: start a game, the live class dashboard (everyone's zone and progress, the most-missed bugs), and
  the report with an Excel download
- `/join` students, solo or a small group on one screen (laptops are best for typing code)

Backend: the shared Supabase project (`pk-game` and `pk-play` Edge Functions, `pk_*` tables). The bugs, answers
and checker are in `supabase/functions/_shared/patchKnight.ts`, with the banks in `pkBankCs1a.ts`, `pkBankCs1b.ts`, `pkBankCs2.ts` and `pkBankCs2b.ts` (tests in `patchKnight_test.ts`).

## Run it

```
npm install
cp .env.example .env.local   # add the Supabase URL and publishable key
npm run dev
```
