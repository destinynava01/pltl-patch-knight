// Change these to rebrand the game.
export const SITE_NAME = 'Patch Knight'
export const SITE_TAGLINE = 'The game is broken. Your code fixes it.'
export const HUB_URL = 'https://pltl-game-hub.vercel.app'

// Knight colors students can pick
export const KNIGHT_COLORS = ['#3ddc84', '#4cc9f0', '#ffd166', '#ff9f43', '#c792ea', '#ff6b6b']

// The zones (topics), in world order: CS1 review first, then CS2. The leader picks which ones a game includes.
// (The bugs themselves live on the server; keep these ids in sync with supabase _shared/patchKnight.ts.)
export const ZONES = [
  { id: 'vars', name: 'Village of Variables', emoji: '🏡', topic: 'Variables, types & math', course: 'CS1' },
  { id: 'logic', name: 'Crossroads of Choice', emoji: '🔀', topic: 'If/else & logic', course: 'CS1' },
  { id: 'loops', name: 'Windmill Fields', emoji: '🌾', topic: 'Loops', course: 'CS1' },
  { id: 'funcs', name: 'Spellbook Library', emoji: '📜', topic: 'Functions', course: 'CS1' },
  { id: 'arrays', name: 'Market Square', emoji: '🛒', topic: 'Arrays, strings & vectors', course: 'CS1' },
  { id: 'inventory', name: 'Inventory Caves', emoji: '🎒', topic: 'Linked lists', course: 'CS2' },
  { id: 'armory', name: 'Armory of Pointers', emoji: '🗡️', topic: 'Pointers & dynamic memory', course: 'CS2' },
  { id: 'guild', name: 'Guild Hall', emoji: '🧙', topic: 'Classes & constructors', course: 'CS2' },
  { id: 'dungeon', name: 'Recursive Dungeon', emoji: '🏰', topic: 'Recursion', course: 'CS2' },
  { id: 'arena', name: 'Arena Rankings', emoji: '🏆', topic: 'Sorting', course: 'CS2' },
  { id: 'tower', name: "Cartographer's Tower", emoji: '🗺️', topic: 'Searching', course: 'CS2' },
]
export const COURSES = [
  { id: 'CS1', label: 'CS1 review' },
  { id: 'CS2', label: 'CS2' },
]
// Each zone has a bank of this many bugs; every student gets a random few from each chosen zone
export const BANK_SIZE = 20
// How many bugs each student gets in the whole game (the leader picks one), split evenly across the chosen zones
export const CAPS = [10, 15, 20]
export const DEFAULT_CAP = 15

// How many bugs each chosen zone gives a student: the cap shared out evenly, earlier zones get any extra
// (the same rule as the server's shares())
export function splitCap(zoneCount, cap) {
  const counts = Array(zoneCount).fill(0)
  for (let left = cap, i = 0; left > 0 && counts.some((c) => c < BANK_SIZE); i = (i + 1) % zoneCount) {
    if (counts[i] < BANK_SIZE) { counts[i]++; left-- }
  }
  return counts
}

// What each puzzle type is called on screen
export const TYPE_LABEL = {
  blank: 'Fill the blank',
  fix: 'Find & fix',
  order: 'Put in order',
  output: 'Predict output',
}
