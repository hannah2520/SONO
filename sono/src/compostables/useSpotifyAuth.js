// src/composables/useSpotifyAuth.js
import { ref } from 'vue'

const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'
const REDIRECT_URI = 'http://localhost:5173/callback'
const SCOPES = 'user-read-email user-read-private'

export function useSpotifyAuth() {
  const accessToken = ref(null)

  async function login() {
    const state = crypto.randomUUID()
    sessionStorage.setItem('spotify_auth_state', state)

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}&scope=${encodeURIComponent(SCOPES)}&state=${state}`

    window.location = authUrl
  }

  function handleRedirect() {
    // extract token from hash (Spotify sends it in URL)
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const token = params.get('access_token')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('spotify_auth_state')

    if (state !== savedState) {
      console.error('State mismatch! Possible CSRF attack.')
      return
    }

    if (token) {
      accessToken.value = token
      sessionStorage.setItem('spotify_access_token', token)
      // clean up URL
      window.history.replaceState({}, document.title, '/')
    }
  }

  function getToken() {
    return accessToken.value || sessionStorage.getItem('spotify_access_token')
  }

  return { login, handleRedirect, getToken, accessToken }
}
