<template>
  <main class="profile-page">
    <div class="profile-body">

      <!-- ── Avatar + Identity ── -->
      <section class="identity-card">
        <div class="avatar-wrap">
          <img
            :src="avatarDataUrl || '/default-avatar.svg'"
            alt="Profile avatar"
            class="avatar-img"
          />
          <label class="avatar-edit-btn" title="Change photo">
            ✏️
            <input
              type="file"
              accept="image/*"
              class="avatar-input"
              @change="onAvatarChange"
            />
          </label>
          <button
            v-if="avatarDataUrl"
            class="avatar-clear-btn"
            title="Remove photo"
            @click="clearAvatar"
          >✕</button>
        </div>

        <div class="identity-info">
          <div v-if="!editingName" class="username-display">
            <h1 class="username">{{ username || 'Set a username' }}</h1>
            <button class="edit-btn" @click="startEditName">Edit</button>
          </div>
          <div v-else class="username-edit">
            <input
              ref="nameInput"
              v-model="nameDraft"
              class="name-input"
              placeholder="Enter username"
              maxlength="32"
              @keyup.enter="saveName"
              @keyup.escape="cancelEditName"
            />
            <div class="edit-actions">
              <button class="save-btn" @click="saveName">Save</button>
              <button class="cancel-btn" @click="cancelEditName">Cancel</button>
            </div>
          </div>

          <p class="spotify-name" v-if="spotifyProfile">
            Spotify: {{ spotifyProfile.display_name || spotifyProfile.email }}
          </p>
          <p class="spotify-name muted" v-else>Not connected to Spotify</p>
        </div>
      </section>

      <!-- ── Stats row ── -->
      <section class="stats-row">
        <div class="stat-pill">
          <strong>{{ savedSongs.length }}</strong>
          <span>Saved Songs</span>
        </div>
        <div class="stat-pill">
          <strong>{{ unlockedCount }}</strong>
          <span>Achievements</span>
        </div>
        <div class="stat-pill">
          <strong>{{ streak }}</strong>
          <span>Day Streak 🔥</span>
        </div>
      </section>

      <!-- ── Saved Songs ── -->
      <section class="profile-section">
        <h2 class="section-title">Saved Songs</h2>
        <p v-if="!savedSongs.length" class="empty-msg">
          No saved songs yet — head to Discover and hit ♡ on a track.
        </p>
        <div v-else class="songs-grid">
          <div v-for="id in savedSongs" :key="id" class="song-tile">
            <iframe
              :src="`https://open.spotify.com/embed/track/${id}`"
              width="100%"
              height="80"
              frameborder="0"
              allow="encrypted-media"
              loading="lazy"
            ></iframe>
            <button class="remove-song-btn" @click="removeSong(id)" title="Remove">✕</button>
          </div>
        </div>
      </section>

      <!-- ── Achievements ── -->
      <section class="profile-section">
        <h2 class="section-title">Achievements</h2>
        <p v-if="!unlockedCount" class="empty-msg">
          No achievements yet — keep using SONO to unlock them!
        </p>
        <div class="achievements-grid">
          <div
            v-for="a in allAchievements"
            :key="a.id"
            class="achievement-card"
            :class="{ unlocked: a.unlocked }"
          >
            <div class="achievement-icon">{{ a.icon }}</div>
            <div class="achievement-title">{{ a.title }}</div>
            <div class="achievement-desc">{{ a.description }}</div>
            <div class="achievement-badge" v-if="a.unlocked">Earned ✓</div>
            <div class="achievement-badge locked" v-else>Locked</div>
          </div>
        </div>
      </section>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAchievements } from '@/composables/useAchievements'
import { useMoodLog } from '@/composables/useMoodLog'

const { username, avatarDataUrl, setUsername, setAvatar, clearAvatar } = useUserProfile()
const { getAllAchievements, getUnlockedCount } = useAchievements()
const { getCurrentStreak } = useMoodLog()

const API_URL = import.meta.env.VITE_API_URL

const spotifyProfile = ref(null)
const editingName = ref(false)
const nameInput = ref(null)
const nameDraft = ref('')

const allAchievements = computed(() => getAllAchievements())
const unlockedCount = computed(() => getUnlockedCount())
const streak = computed(() => getCurrentStreak())

// Use a ref-backed list so removals trigger reactivity
const savedSongsKey = ref(0)
const savedSongs = computed(() => {
  savedSongsKey.value // tracked dependency
  try {
    return JSON.parse(localStorage.getItem('sono-saved-tracks') || '[]')
  } catch {
    return []
  }
})

function removeSong(id) {
  const updated = savedSongs.value.filter(s => s !== id)
  localStorage.setItem('sono-saved-tracks', JSON.stringify(updated))
  savedSongsKey.value++
}

function startEditName() {
  nameDraft.value = username.value
  editingName.value = true
  nextTick(() => nameInput.value?.focus())
}

function saveName() {
  setUsername(nameDraft.value)
  editingName.value = false
}

function cancelEditName() {
  editingName.value = false
}

function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => setAvatar(ev.target.result)
  reader.readAsDataURL(file)
}

async function fetchSpotifyProfile() {
  try {
    const res = await fetch(`${API_URL}/api/auth/status`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    if (data.connected) spotifyProfile.value = data.profile
  } catch {}
}

onMounted(() => {
  fetchSpotifyProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 3rem 1.25rem;
  box-sizing: border-box;
  color: var(--pure);
  position: relative;
  overflow: hidden;
}

.profile-page::before {
  content: '';
  position: absolute;
  inset: -20% -15%;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(500px 500px at 15% 30%, color-mix(in srgb, var(--euphoric) 90%, transparent), transparent 60%),
    radial-gradient(500px 500px at 80% 20%, color-mix(in srgb, var(--confident) 90%, transparent), transparent 60%),
    radial-gradient(460px 460px at 60% 80%, color-mix(in srgb, var(--flirty) 85%, transparent), transparent 60%);
  filter: blur(20px);
  opacity: 0.9;
  animation: profile-blobs 7s ease-in-out infinite alternate;
}

@keyframes profile-blobs {
  from { transform: translate3d(-30px, -20px, 0) scale(0.95); }
  to   { transform: translate3d(30px, 20px, 0) scale(1.05); }
}

.profile-body {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Identity card ── */
.identity-card {
  display: flex;
  align-items: center;
  gap: 2rem;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--confident) 55%, transparent),
    color-mix(in srgb, var(--euphoric) 55%, transparent),
    color-mix(in srgb, var(--flirty) 40%, transparent));
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  background: white;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(20,20,40,0.85);
  border: 2px solid rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.2s;
}

.avatar-edit-btn:hover { background: rgba(40,40,80,0.95); }

.avatar-input {
  display: none;
}

.avatar-clear-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(200,50,50,0.8);
  border: none;
  color: white;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.identity-info {
  flex: 1;
  min-width: 0;
}

.username-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.username {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  color: #fff;
  word-break: break-word;
}

.edit-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  color: #fff;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}
.edit-btn:hover { background: rgba(255,255,255,0.25); }

.username-edit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.name-input {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 0.6rem;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  outline: none;
  width: 100%;
  max-width: 320px;
}
.name-input::placeholder { color: rgba(255,255,255,0.4); }
.name-input:focus { border-color: rgba(255,255,255,0.6); }

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.save-btn {
  background: linear-gradient(90deg, var(--confident), var(--euphoric));
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  cursor: pointer;
}

.spotify-name {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.65);
}
.spotify-name.muted { color: rgba(255,255,255,0.35); }

/* ── Stats row ── */
.stats-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-pill {
  flex: 1;
  min-width: 120px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--confident) 50%, transparent),
    color-mix(in srgb, var(--euphoric) 45%, transparent));
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.14);
}

.stat-pill strong {
  display: block;
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  line-height: 1;
}

.stat-pill span {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Sections ── */
.profile-section {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--confident) 45%, transparent),
    color-mix(in srgb, var(--euphoric) 40%, transparent),
    color-mix(in srgb, var(--flirty) 30%, transparent));
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 1.5rem;
  padding: 1.75rem;
  box-shadow: 0 6px 24px rgba(0,0,0,0.14);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--confident);
  margin: 0 0 1.25rem;
  text-shadow: 0 1px 8px rgba(0,0,0,0.3);
}

.empty-msg {
  color: rgba(255,255,255,0.55);
  font-size: 0.9rem;
  text-align: center;
  padding: 1.5rem 0;
}

/* ── Saved songs ── */
.songs-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.song-tile {
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
}

.remove-song-btn {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(200,50,50,0.85);
  border: none;
  color: white;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

/* ── Achievements ── */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.85rem;
}

.achievement-card {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 1rem;
  padding: 1.25rem 1rem;
  text-align: center;
  opacity: 0.45;
  filter: grayscale(70%);
  transition: opacity 0.3s, filter 0.3s, transform 0.2s;
}

.achievement-card.unlocked {
  opacity: 1;
  filter: none;
  background: rgba(255,255,255,0.82);
  color: #111827;
  border-color: rgba(255,255,255,0.5);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.achievement-card.unlocked:hover {
  transform: translateY(-3px);
}

.achievement-icon {
  font-size: 2rem;
  margin-bottom: 0.4rem;
}

.achievement-title {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.achievement-card.unlocked .achievement-title { color: #111; }
.achievement-card:not(.unlocked) .achievement-title { color: rgba(255,255,255,0.7); }

.achievement-desc {
  font-size: 0.72rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.achievement-card.unlocked .achievement-desc { color: #444; }
.achievement-card:not(.unlocked) .achievement-desc { color: rgba(255,255,255,0.45); }

.achievement-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(90deg, var(--confident), var(--euphoric));
  color: #fff;
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
}

.achievement-badge.locked {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .identity-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1.25rem;
    gap: 1.25rem;
  }

  .username-display {
    justify-content: center;
  }

  .username {
    font-size: 1.6rem;
  }

  .stats-row {
    gap: 0.6rem;
  }

  .stat-pill {
    min-width: 90px;
    padding: 0.75rem;
  }

  .stat-pill strong {
    font-size: 1.4rem;
  }

  .achievements-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
}
</style>
