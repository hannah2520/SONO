<template>
  <div class="discover-page">
    <main class="content">
      <!-- Header -->
      <div class="content-header">
        <h1 class="section-title">RECOMMENDED FOR YOU</h1>
        <button
          class="refresh-btn"
          @click="refreshRecommendations"
          aria-label="Refresh recommendations"
        >
          Refresh
        </button>
      </div>

      <!-- Recommendations Grid -->
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

const allRecommendationSets = [
  [
    { title: 'Bilonera', artist: 'Otilia', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop' },
    { title: 'Sucker', artist: 'Jonas Brothers', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop' },
    { title: "I Don't Care", artist: 'Ed Sheeran , Bieber', image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=600&auto=format&fit=crop' }
  ],
  [
    { title: 'Dance Monkey', artist: 'Tones and I', image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=600&auto=format&fit=crop' },
    { title: 'Blinding Lights', artist: 'The Weeknd', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop' },
    { title: 'Levitating', artist: 'Dua Lipa', image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=600&auto=format&fit=crop' }
  ],
  [
    { title: 'Peaches', artist: 'Justin Bieber', image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?q=80&w=600&auto=format&fit=crop' },
    { title: 'Watermelon Sugar', artist: 'Harry Styles', image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?q=80&w=600&auto=format&fit=crop' },
    { title: 'Good 4 U', artist: 'Olivia Rodrigo', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop' }
  ]
]

const recommendations = ref([...allRecommendationSets[0]])

function refreshRecommendations() {
  let idx
  do {
    idx = Math.floor(Math.random() * allRecommendationSets.length)
  } while (JSON.stringify(recommendations.value) === JSON.stringify(allRecommendationSets[idx]))
  recommendations.value = [...allRecommendationSets[idx]]
}
</script>

<style scoped>
.discover-page {
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-sizing: border-box;
}

/* Content */
.content {
  flex: 1;
  margin-top: 18px;
  background: rgba(255, 255, 255, 0.42);
  border-radius: 14px;
  padding: 24px;
  backdrop-filter: blur(4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
    content: '';
    height: 100vh;
  z-index: -1; /* behind the page content */
  pointer-events: none;
  /* Use the SVG from public/ as a full-width background */
  background-image: url('/backgroundHome.svg');
  background-repeat: no-repeat;
  background-position: center top;
  background-size: 100% auto; /* width: 100% of the page, height scales to preserve aspect */
  opacity: 0.95;
}

/* Header */
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.2em;
  color: #6aaedd;
  font-weight: 800;
}

/* Refresh button */
.refresh-btn {
  padding: 0.5rem 1.3rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff8ad4, #b45fff);
  color: #fff;
  border: none;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(124, 92, 255, 0.12);
  transition: background 0.18s, box-shadow 0.18s;
}
.refresh-btn:hover {
  background: linear-gradient(90deg, #b45fff, #ff8ad4);
  box-shadow: 0 4px 12px rgba(124, 92, 255, 0.18);
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  margin-top: 24px;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* Tiles */
.tile {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
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
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}
.cover-wrap img {
  width: 100%;
  height: 100%;
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
.title:hover {
  text-decoration: underline;
}

.artist {
  margin: 0;
  color: var(--muted);
  font-weight: 500;
}

</style>
