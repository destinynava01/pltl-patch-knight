import { supabase } from './supabase'

// Every backend call goes through here. The backend is the shared Supabase project's Edge Functions.
export async function callFunction(name, payload, fallbackMessage) {
  if (!supabase) throw new Error('Supabase is not set up yet. See the README.')

  const { data, error } = await supabase.functions.invoke(name, { body: payload })
  if (error) {
    // Non-2xx responses leave data empty; the server's message is in the response body
    let message = error.message || fallbackMessage
    try {
      const errorBody = await error.context?.json()
      if (errorBody?.error) message = errorBody.error
    } catch {
      // Not JSON (e.g. a network failure): keep the fallback
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

// The leader's side (the class dashboard and the report)
export const pkGame = (payload) => callFunction('pk-game', payload, 'Unable to contact the game server.')

// Students (join, the world map, bugs, fixes)
export const pkPlay = (payload) => callFunction('pk-play', payload, 'Unable to reach the game.')

// Calls onChange whenever the server signals one of `events` for this game ('lobby' = a student joined or was
// assigned, 'state' = a round moved on). Also checks every `fallbackMs` in case a signal is missed.
export function watchGame(gameId, events, onChange, fallbackMs = 15000) {
  if (!supabase) return () => {}
  let channel = supabase.channel(`pk-${gameId}`)
  for (const event of events) channel = channel.on('broadcast', { event }, () => onChange())
  channel.subscribe()
  const intervalId = setInterval(onChange, fallbackMs)
  return () => {
    clearInterval(intervalId)
    supabase.removeChannel(channel)
  }
}
