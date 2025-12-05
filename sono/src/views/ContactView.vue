<template>
  <div class="contact-page">
    <main class="hero">
      <h1 class="title">CONTACT</h1>
      <p class="subtitle">
        Questions, feedback, or ideas for SONO?
        <br />
        Send us a message and we'll get back to you.
      </p>

      <section class="contact-card">
        <!-- LEFT: FORM -->
        <form class="contact-form" @submit.prevent="onSubmit">
          <label>
            <span>Name</span>
            <input type="text" v-model.trim="form.name" placeholder="Your name" required />
          </label>

          <label>
            <span>Email</span>
            <input type="email" v-model.trim="form.email" placeholder="you@example.com" required />
          </label>

          <label class="textarea">
            <span>Message</span>
            <textarea
              v-model.trim="form.message"
              placeholder="Tell us how SONO can help."
              rows="4"
              required
            ></textarea>
          </label>

          <p v-if="error" class="form-message error">{{ error }}</p>
          <p v-if="status === 'success'" class="form-message success">
            Thanks! We've received your message and will be in touch soon.
          </p>

          <button type="submit" class="submit" :disabled="status === 'submitting'">
            <span v-if="status === 'submitting'">Sending…</span>
            <span v-else>Submit</span>
          </button>
        </form>

        <!-- RIGHT: CTA / EMAIL BLOCK -->
        <section class="cta-panel">
          <h6 class="cta-heading">Need Help With Something Else?</h6>
          <p class="cta-sub">EMAIL US AT</p>
          <a href="mailto:support@sono.com" class="cta-link">support@sono.com</a>
          <p class="cta-note">
            We typically respond within <span>1-2 business days</span>.
            For account issues, please include the email linked to your Spotify.
          </p>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  name: '',
  email: '',
  message: '',
})

const status = ref<'idle' | 'submitting' | 'success'>('idle')
const error = ref('')

function onSubmit() {
  error.value = ''

  if (!form.value.name || !form.value.email || !form.value.message) {
    error.value = 'Please fill out all fields.'
    return
  }

  status.value = 'submitting'

  // Placeholder "functional" behavior – here you’d call a real API / email service
  setTimeout(() => {
    status.value = 'success'
    form.value = { name: '', email: '', message: '' }
  }, 700)
}
</script>

<style scoped>
/* ============================================================
   PAGE WRAPPER + BLOB BACKGROUND (same vibe)
   ============================================================ */

.contact-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem 4rem;
  box-sizing: border-box;
  color: var(--pure);
  overflow: hidden;
  background: transparent;
  z-index: 0;
}

.contact-page::before {
  content: '';
  position: absolute;
  inset: -24% -18%;
  pointer-events: none;
  z-index: -2;
  background-repeat: no-repeat;

  background-image:
    radial-gradient(580px 580px at 10% 30%, color-mix(in srgb, var(--euphoric) 96%, transparent), transparent 60%),
    radial-gradient(520px 520px at 22% 55%, color-mix(in srgb, var(--serene) 92%, transparent), transparent 60%),
    radial-gradient(520px 520px at 12% 80%, color-mix(in srgb, var(--melancholy) 92%, transparent), transparent 60%),
    radial-gradient(620px 620px at 82% 26%, color-mix(in srgb, var(--melancholy) 96%, transparent), transparent 60%),
    radial-gradient(560px 560px at 90% 72%, color-mix(in srgb, var(--flirty) 92%, transparent), transparent 60%),
    radial-gradient(540px 540px at 50% 104%, color-mix(in srgb, var(--euphoric) 90%, transparent), transparent 62%);

  filter: blur(18px);
  opacity: 0.97;

  animation: contact-blobs-main 6.5s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

.contact-page::after {
  content: '';
  position: absolute;
  inset: -30% -20%;
  pointer-events: none;
  z-index: -1;
  background-repeat: no-repeat;

  background-image:
    radial-gradient(360px 560px at 18% 90%, color-mix(in srgb, var(--melancholy) 82%, transparent), transparent 70%),
    radial-gradient(360px 540px at 82% 80%, color-mix(in srgb, var(--serene) 82%, transparent), transparent 72%),
    radial-gradient(320px 460px at 52% 112%, color-mix(in srgb, var(--euphoric) 82%, transparent), transparent 70%),
    radial-gradient(300px 380px at 38% 40%, color-mix(in srgb, var(--hype) 82%, transparent), transparent 72%),
    radial-gradient(280px 360px at 64% 18%, color-mix(in srgb, var(--flirty) 82%, transparent), transparent 72%);

  filter: blur(22px);
  opacity: 0.9;

  animation: contact-blobs-accent 4.8s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

@keyframes contact-blobs-main {
  0% { transform: translate3d(-40px, -30px, 0) scale(0.9); opacity: 0.92; }
  25% { transform: translate3d(24px, -8px, 0) scale(1.02); opacity: 1; }
  50% { transform: translate3d(48px, 26px, 0) scale(1.08); opacity: 1; }
  75% { transform: translate3d(-18px, 42px, 0) scale(1.04); opacity: 0.97; }
  100% { transform: translate3d(-42px, 58px, 0) scale(0.96); opacity: 0.9; }
}

@keyframes contact-blobs-accent {
  0% { transform: translate3d(45px, 45px, 0) scale(0.9); opacity: 0.35; }
  20% { transform: translate3d(15px, 12px, 0) scale(1.06); opacity: 0.8; }
  50% { transform: translate3d(-35px, -28px, 0) scale(1.14); opacity: 0.95; }
  80% { transform: translate3d(-12px, -50px, 0) scale(1.02); opacity: 0.55; }
  100% { transform: translate3d(28px, -62px, 0) scale(0.94); opacity: 0.32; }
}

/* ============================================================
   LAYOUT + TYPOGRAPHY
   ============================================================ */

.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  padding: 0;
}

.title {
  margin: 0 0 0.6rem;
  font-size: clamp(2rem, 4.4vw, 2.6rem);
  letter-spacing: 0.18em;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--confident);
  text-align: center;
}

.subtitle {
  margin: 0 0 2.1rem;
  font-size: 0.98rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.9);
  text-align: center;
  max-width: 520px;
}
/* ============================================================
   CONTACT CARD – align with music recommendations page
   ============================================================ */

.contact-card {
  width: 100%;
  max-width: 900px;
  border-radius: 1.7rem;
  padding: 2.1rem 2.4rem;
  display: flex;
  gap: 2.2rem;
  align-items: stretch;

  /* same shell vibe as recs .grid */
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 45%, transparent),
    color-mix(in srgb, var(--euphoric) 45%, transparent),
    color-mix(in srgb, var(--flirty) 35%, transparent)
  );
  backdrop-filter: blur(16px) saturate(135%);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

/* ============================================================
   LEFT FORM – tile like a track card, but lighter
   ============================================================ */

.contact-form {
  flex: 1.4;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  background: rgba(5, 5, 15, 0.6); /* same family as .tile on recs */
  border-radius: 1.3rem;
  padding: 1.4rem 1.5rem;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-sizing: border-box;
}

.contact-form label {
  display: grid;
  gap: 4px;
  font-size: 0.8rem;
  color: rgba(249, 250, 251, 0.9);
}

.contact-form span {
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.75rem;
}
/* inputs: match Discover search bar vibe */
.contact-form input,
.contact-form textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.08); /* same family as search bar */
  color: #fff;
  font-size: 0.95rem;

  /* no big pop / drop shadow */
  box-shadow: none;
  outline: none;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.contact-form textarea {
  border-radius: 1rem;
  min-height: 120px;
  resize: vertical;
}

.contact-form input::placeholder,
.contact-form textarea::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* focus: same treatment as search bar input */
.contact-form input:focus,
.contact-form textarea:focus {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.form-message {
  margin: 2px 0 4px;
  font-size: 0.8rem;
}

.form-message.error {
  color: #fecaca;
}

.form-message.success {
  color: #bbf7d0;
}

/* gradient pill CTA like rec “Search” button */
.submit {
  margin-top: 0.5rem;
  align-self: flex-end;
  padding: 0.55rem 1.8rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--confident), var(--euphoric), var(--flirty));
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease,
    opacity 0.1s ease;
}

.submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
}

.submit:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ============================================================
   RIGHT PANEL – lighter tile like a secondary rec card
   ============================================================ */

.cta-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  background: rgba(5, 5, 15, 0.6);
  border-radius: 1.3rem;
  padding: 1.4rem 1.6rem;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f9fafb;
  box-sizing: border-box;
}

.cta-heading {
  margin: 0 0 6px;
  font-weight: 800;
  letter-spacing: 0.14em;
  font-size: 1rem;
  color: rgba(229, 231, 235, 0.9);
}

.cta-sub {
  margin: 0 0 4px;
  font-weight: 700;
  color: var(--euphoric);
  font-size: 0.86rem;
}

.cta-link {
  display: inline-block;
  margin-top: 4px;
  text-decoration: none;
  font-weight: 800;
  color: #f9fafb;
  font-size: 0.96rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cta-link:hover {
  text-decoration: underline;
}

.cta-note {
  margin-top: 12px;
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgba(209, 213, 219, 0.96);
}

.cta-note span {
  color: var(--euphoric);
  font-weight: 600;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 840px) {
  .contact-card {
    flex-direction: column;
    gap: 1.4rem;
    padding: 1.8rem 1.6rem;
  }

  .submit {
    align-self: stretch;
    text-align: center;
  }
}

</style>


