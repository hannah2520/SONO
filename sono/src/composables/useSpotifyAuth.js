import { ref } from 'vue'

// Starter composable for Spotify Authorization Code with PKCE
// - Uses VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_REDIRECT_URI from env
// - Stores code_verifier in sessionStorage during the auth handshake
// - Exchanges the authorization code for tokens and stores them in localStorage
// Notes:
// - Some Spotify token endpoints may block CORS for direct browser exchanges. If you hit CORS issues,
//   exchange the code on a backend server instead and return tokens to the client.
// - This is a starter implementation. Add refresh handling, error handling and secure storage as needed.

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin
const SCOPES = (import.meta.env.VITE_SPOTIFY_SCOPES || 'user-read-private user-read-email').trim()
const STORAGE_KEY = 'spotify_auth'
const VERIFIER_KEY = 'spotify_code_verifier'

const accessToken = ref(null)
const refreshToken = ref(null)
const expiresAt = ref(null)
const isAuthenticated = ref(false)

function saveAuth({ access_token, refresh_token, expires_in }) {
  const expiry = Date.now() + (expires_in ? expires_in * 1000 : 0)
  const payload = { access_token, refresh_token, expires_at: expiry }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  accessToken.value = access_token
  refreshToken.value = refresh_token
  expiresAt.value = expiry
  isAuthenticated.value = !!access_token
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  accessToken.value = null
  refreshToken.value = null
  expiresAt.value = null
  isAuthenticated.value = false
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    accessToken.value = parsed.access_token || null
    refreshToken.value = parsed.refresh_token || null
    expiresAt.value = parsed.expires_at || null
    if (expiresAt.value && Date.now() >= expiresAt.value) {
      // token expired — clear. You can implement refresh here.
      clearAuth()
    } else {
      isAuthenticated.value = !!accessToken.value
    }
  } catch (e) {
    console.warn('Failed to load Spotify auth from storage', e)
    clearAuth()
  }
}

function randomString(length = 64) {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => ('0' + b.toString(16)).slice(-2)).join('').slice(0, length)
}

async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hashBuffer)
}

function base64UrlEncode(bytes) {
  // base64 from bytes
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier)
  return base64UrlEncode(hashed)
}

async function buildAuthUrl({ scope = SCOPES, state = '' } = {}) {
  if (!CLIENT_ID) throw new Error('VITE_SPOTIFY_CLIENT_ID is not set')
  const verifier = randomString(128)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  const challenge = await generateCodeChallenge(verifier)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope,
  })
  if (state) params.set('state', state)
  // show_dialog=true forces the Spotify login/consent screen
  params.set('show_dialog', 'true')
  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

async function login() {
  const url = await buildAuthUrl()
  window.location.href = url
}

async function handleRedirectCallback() {
  // Call this on the redirect page (redirect_uri) to exchange code for tokens.
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  // const state = params.get('state')
  const error = params.get('error')

  if (error) {
    throw new Error(error)
  }
  if (!code) return null
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) throw new Error('Missing code verifier in sessionStorage')

  // Exchange the code for tokens using PKCE.
  // Note: Spotify supports PKCE token exchange from public clients. If you run into CORS issues,
  // perform this exchange on a backend server and return the tokens to the client.
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${txt}`)
  }

  const data = await res.json()
  // data: { access_token, token_type, scope, expires_in, refresh_token }
  saveAuth(data)

  // remove query params from the URL to clean up
  const cleanUrl = window.location.origin + window.location.pathname
  window.history.replaceState({}, document.title, cleanUrl)
  return data
}

function logout() {
  clearAuth()
}

async function getAccessToken() {
  // returns current access token or null (does not refresh automatically)
  if (!accessToken.value) loadFromStorage()
  if (expiresAt.value && Date.now() >= expiresAt.value) {
    // expired
    return null
  }
  return accessToken.value
}

// initialize
loadFromStorage()

export function useSpotifyAuth() {
  return {
    isAuthenticated,
    accessToken,
    refreshToken,
    expiresAt,
    login,
    logout,
    handleRedirectCallback,
    getAccessToken,
    clearAuth,
  }
}
