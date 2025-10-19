<template>
  <section class="playlist-container">
    <header class="playlist-header">
      <div class="header-left">
        <h1 class="add-title">Add Playlist</h1>
        <h6>Groovy K-pop Vibes</h6>
      </div>
      <div class="header-actions">
        <button class="create-btn">+ Create playlist</button>
      </div>
    </header>

    <div class="playlist-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Duration</th>
            <th>Artist</th>
            <th>Album</th>
            <th>Add to playlist</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(song, index) in songs" :key="index">
            <td>{{ index + 1 }}</td>
            <td class="song-info">
              <img :src="song.thumbnail" alt="cover" />
              <span>{{ song.name }}</span>
            </td>
            <td>{{ song.duration }}</td>
            <td>{{ song.artist }}</td>
            <td>{{ song.album }}</td>
            <td><button class="add-btn">+</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="player-bar">
      <img :src="songs[2].thumbnail" alt="now playing" class="player-thumb" />
      <div class="player-info">
        <h4>{{ songs[2].name }}</h4>
        <p>{{ songs[2].artist }}</p>
      </div>
      <div class="controls">
        <button>⏮</button>
        <button>⏯</button>
        <button>⏭</button>
      </div>
      <div class="progress-bar">
        <div class="progress"></div>
      </div>
      <div class="extra-controls">
        <span>02:34</span>
        <button>🔀</button>
        <button>⭐</button>
      </div>
    </div>
  </section>
</template>

<script setup>
const songs = [
  {
    name: 'Make It Right',
    duration: '03:46',
    artist: 'BTS ft Lauv',
    album: 'Single',
    thumbnail: 'https://i.imgur.com/EZgP56b.jpg',
  },
  {
    name: 'Dynamite',
    duration: '03:19',
    artist: 'BTS',
    album: 'BE',
    thumbnail: 'https://i.imgur.com/N5NwUZM.jpg',
  },
  {
    name: 'Still With You',
    duration: '—',
    artist: 'Jeon Jungkook',
    album: 'Solo',
    thumbnail: 'https://i.imgur.com/SYZr5eE.jpg',
  },
]
</script>

<style scoped>

.playlist-container {
  /* make the view fill the available space from App.vue (main flex:1) */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding: 1rem; /* reduced padding to minimize white space */
  background: linear-gradient(to bottom right, #e7c6ff, #b8f2e6);
}

.playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.6);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(180, 95, 255, 0.06);
  margin-bottom: 0.75rem;
}

.header-left .add-title {
  margin: 0;
  font-size: 1.5rem;
  color: #6a17bf;
}

.header-left .subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.95rem;
  color: #444;
  /* font-family: 'Pacifico', cursive; */
}

.header-actions .create-btn {
  background: linear-gradient(90deg, #ff8ad4, #b45fff);
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.playlist-table {
  background: #fff;
  border-radius: 10px;
  overflow-x: auto;
  padding: 0.6rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  /* let table grow to fill remaining vertical space */
  flex: 1 1 auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f0f0f0;
}

th,
td {
  text-align: left;
  padding: 0.75rem;
  font-size: 0.9rem;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.song-info img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.add-btn {
  font-size: 1.2rem;
  background: none;
  border: none;
  color: #b45fff;
  cursor: pointer;
}

.player-bar {
  margin-top: 1rem;
  background: #fff;
  padding: 0.75rem 1rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
}

.player-thumb {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.player-info h4 {
  margin: 0;
  font-size: 1rem;
}

.player-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.controls button {
  background: none;
  border: none;
  font-size: 1.2rem;
  margin: 0 0.5rem;
  cursor: pointer;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  position: relative;
}

.progress {
  height: 100%;
  width: 40%;
  background: #ff8ad4;
  border-radius: 3px;
}

.extra-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}
</style>
