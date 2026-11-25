// Change these to rebrand the game.
export const SITE_NAME = 'Patch Knight'
export const SITE_TAGLINE = 'The game is broken. Your code fixes it.'
export const HUB_URL = 'https://pltl-game-hub.vercel.app'

// Knight colors students can pick
export const KNIGHT_COLORS = ['#3ddc84', '#4cc9f0', '#ffd166', '#ff9f43', '#c792ea', '#ff6b6b']

// The zones (topics), in world order. The leader picks which ones a game includes. (The bugs themselves live on
// the server; keep these ids in sync with supabase _shared/patchKnight.ts.)
export const ZONES = [
  { id: 'inventory', name: 'Inventory Caves', emoji: '🎒', topic: 'Linked lists' },
  { id: 'armory', name: 'Armory of Pointers', emoji: '🗡️', topic: 'Pointers & dynamic memory' },
  { id: 'guild', name: 'Guild Hall', emoji: '🧙', topic: 'Classes & constructors' },
  { id: 'dungeon', name: 'Recursive Dungeon', emoji: '🏰', topic: 'Recursion' },
  { id: 'arena', name: 'Arena Rankings', emoji: '🏆', topic: 'Sorting' },
  { id: 'tower', name: "Cartographer's Tower", emoji: '🗺️', topic: 'Searching' },
]
export const BUGS_PER_ZONE = 8

// What each puzzle type is called on screen
export const TYPE_LABEL = {
  blank: 'Fill the blank',
  fix: 'Find & fix',
  order: 'Put in order',
  output: 'Predict output',
}
