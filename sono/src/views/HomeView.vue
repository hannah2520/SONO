<!-- this is the home page -->

<template>
  <main class="home-page">
    <div class="content">
      <h1 class="header">DISCOVER YOUR SOUND</h1>
      <p class="description">
        SONO analyzes your listening history and mood to create the perfect musical journey. Connect
        with Spotify and Last.fm for personalized recommendations that evolve with you..
      </p>
      <img src="/connectmodal.svg" alt="Connect with Spotify and Last.fm" />
    </div>
  </main>
</template>
<style scoped>
.home-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #222;
  overflow: visible; /* allow pseudo-element to extend outside */
}
.content {
  z-index: 1;
  text-align: center;
  color: var(--pure);
}

/* background blobs in a pseudo-element so they won't be clipped */
.home-page::before {
  content: '';
  position: absolute;
  inset: 0; /* fill the page area */
  z-index: -1; /* behind the page content */
  pointer-events: none;
  /* Use the SVG from public/ as a full-width background */
  background-image: url('/backgroundHome.svg');
  background-repeat: no-repeat;
  background-position: center top;
  background-size: 100% auto; /* width: 100% of the page, height scales to preserve aspect */
  opacity: 0.95;
}
.header {
  font-size: 96px;
  font-style: normal;
  font-weight: 400;
  color: var(--euphoric);
}
.description {
  margin: 50px;
  font-size: 20px;
  line-height: 1.6;
  text-align: center;
  color: rgba(255, 255, 255, 0.95);
}
</style>
