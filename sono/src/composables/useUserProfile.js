import { ref } from 'vue'

const PROFILE_KEY = 'sono-user-profile'

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
}

const stored = loadProfile()
const username = ref(stored.username || '')
const avatarDataUrl = ref(stored.avatarDataUrl || '')

export function useUserProfile() {
  function setUsername(name) {
    username.value = name.trim()
    const p = loadProfile()
    p.username = username.value
    saveProfile(p)
  }

  function setAvatar(dataUrl) {
    avatarDataUrl.value = dataUrl
    const p = loadProfile()
    p.avatarDataUrl = dataUrl
    saveProfile(p)
  }

  function clearAvatar() {
    avatarDataUrl.value = ''
    const p = loadProfile()
    delete p.avatarDataUrl
    saveProfile(p)
  }

  return { username, avatarDataUrl, setUsername, setAvatar, clearAvatar }
}
