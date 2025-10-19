<template>
  <div class="discover-page">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-icon">
          <!-- little music-note icon -->
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18.5A2.5 2.5 0 1 1 6.5 16 2.5 2.5 0 0 1 9 18.5Zm0 0V6l10-2v10.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="19" cy="16.5" r="2.5" fill="currentColor" opacity=".2"/>
          </svg>
        </div>
        <span class="brand-name">SONO</span>
      </div>

      <nav class="nav">
        <RouterLink to="/discover" class="tab active">Discover</RouterLink>
        <RouterLink to="/" class="tab">Home</RouterLink>
        <RouterLink to="/mood-calendar" class="tab">Mood Calendar</RouterLink>
      </nav>

      <div class="user-info">
        <span class="username">Welcome, {{ username }}</span>
        <button class="refresh-btn" aria-label="Refresh recommendations" @click="refreshRecommendations">Refresh</button>
      </div>
    </header>

    <!-- Content -->
    <main class="content">
      <h1 class="section-title">RECOMMENDED FOR YOU</h1>

      <section class="grid">
        <article
          v-for="(item, i) in recommendations"
          :key="i"
          class="tile"
        >
          <div class="cover-wrap">
            <img :src="item.image" :alt="`${item.title} cover`" />
          </div>
          <a class="title" href="#" @click.prevent>{{ item.title }}</a>
          <p class="artist">{{ item.artist }}</p>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
// Placeholder username; replace with real user data from auth later
const username = 'User';

const allRecommendationSets = [
  [
    {
      title: 'Bilonera',
      artist: 'Otilia',
      image:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
    },
    {
      title: 'Sucker',
      artist: 'Jonas Brothers',
      image:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop'
    },
    {
      title: "I Don't Care",
      artist: 'Ed Sheeran , Bieber',
      image:
        'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=600&auto=format&fit=crop'
    }
  ],
  [
    {
      title: 'Dance Monkey',
      artist: 'Tones and I',
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=600&auto=format&fit=crop'
    },
    {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop'
    },
    {
      title: 'Levitating',
      artist: 'Dua Lipa',
      image:
        'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600&auto=format&fit=crop'
    }
  ],
  [
    {
      title: 'Peaches',
      artist: 'Justin Bieber',
      image:
        'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?q=80&w=600&auto=format&fit=crop'
    },
    {
      title: 'Watermelon Sugar',
      artist: 'Harry Styles',
      image:
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=600&auto=format&fit=crop'
    },
    {
      title: 'Good 4 U',
      artist: 'Olivia Rodrigo',
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop'
    }
  ]
]

const recommendations = ref([...allRecommendationSets[0]])

function refreshRecommendations() {
  // Pick a random set different from the current one
  let idx
  do {
    idx = Math.floor(Math.random() * allRecommendationSets.length)
  } while (JSON.stringify(recommendations.value) === JSON.stringify(allRecommendationSets[idx]))
  recommendations.value = [...allRecommendationSets[idx]]
}
</script>

<style scoped>
:root {
  --bg: linear-gradient(135deg, #e8c7ff 0%, #b7a8ff 35%, #d0c7ff 60%, #dff0eb 100%);
  --brand-grad: linear-gradient(135deg, #a86bff 0%, #ff9fd6 100%);
  --text: #1e1e24;
  --muted: #6b6b7a;
  --accent: #7b5cff;
  --card-bg: #ffffff;
  --shadow: 0 6px 18px rgba(22, 22, 31, 0.18);
}

/* Page shell */
.discover-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 24px;
  box-sizing: border-box;
}

/* Top bar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(0,0,0,.1);
  padding: 12px 16px;
  border: 1px solid rgba(0,0,0,.05);
  gap: 1.5rem;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: white;
  background: var(--brand-grad);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.35);
}
.brand-icon svg {
  width: 18px;
  height: 18px;
}
.brand-name {
  font-weight: 800;
  font-size: 20px;
  letter-spacing: .5px;
  background: var(--brand-grad);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Nav tabs */
.nav {
  display: flex;
  gap: 8px;
}
.tab {
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--text);
  text-decoration: none;
  font-weight: 600;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.tab:hover { transform: translateY(-1px); }
.tab.active {
  background: var(--brand-grad);
  color: #fff;
  box-shadow: 0 6px 16px rgba(124, 92, 255, .35);
}


/* Profile button */

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.username {
  font-weight: 600;
  color: #7b5cff;
  background: #f3ecff;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

/* Circular refresh button like profile button */
.refresh-btn {
  padding: 0.5rem 1.3rem;
  border-radius: 999px;
  background: linear-gradient(90deg,#ff8ad4,#b45fff);
  color: #fff;
  border: none;
  outline: none;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(124, 92, 255, 0.12);
  transition: background 0.18s, box-shadow 0.18s;
}
.refresh-btn:hover {
  background: linear-gradient(90deg,#b45fff,#ff8ad4);
  box-shadow: 0 4px 12px rgba(124, 92, 255, 0.18);
}

/* Content */
.content {
  margin-top: 18px;
  background: rgba(255,255,255,.42);
  border-radius: 14px;
  padding: 24px;
  backdrop-filter: blur(4px);
  box-shadow: 0 10px 24px rgba(0,0,0,.08);
}

/* Section title */
.section-title {
  margin: 4px 0 22px;
  font-size: 28px;
  letter-spacing: .2em;
  color: #6aaedd;
  font-weight: 800;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
}
@media (max-width: 960px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
}

/* Tiles */
.tile {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow);
  transition: transform .15s ease, box-shadow .15s ease;
}
.tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 26px rgba(22, 22, 31, 0.22);
}

.cover-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 14px;
  box-shadow: 0 8px 18px rgba(0,0,0,.18);
}
.cover-wrap img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}

.title {
  display: inline-block;
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 6px;
  color: var(--accent);
  text-decoration: none;
}
.title:hover { text-decoration: underline; }

.artist {
  margin: 0;
  color: var(--muted);
  font-weight: 500;
}
</style>
