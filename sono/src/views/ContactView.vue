<template>
  <div class="contact-page">
    <main class="hero">
      <h1 class="title">CONTACT</h1>

      <form class="card contact-form" @submit.prevent="onSubmit">
        <label>
          <span>Name</span>
          <input type="text" v-model="form.name" placeholder="Value" required />
        </label>

        <label>
          <span>Email</span>
          <input type="email" v-model="form.email" placeholder="Value" required />
        </label>

        <label class="textarea">
          <span>Message</span>
          <textarea v-model="form.message" placeholder="Value" rows="4" required></textarea>
        </label>

        <button type="submit" class="submit">Submit</button>
      </form>

      <section class="cta card">
        <p class="cta-heading">NEED HELP WITH SOMETHING ELSE?</p>
        <p class="cta-sub">EMAIL US AT:</p>
        <a href="mailto:support@sono.com" class="cta-link">SUPPORT@SONO.COM</a>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({ name: '', email: '', message: '' })

function onSubmit() {
  alert("Thanks! We'll be in touch.")
  form.value = { name: '', email: '', message: '' }
}
</script>


<style scoped>
/* make sure padding/border doesn't cause overflow */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.contact-page {
  display: flex;
  flex-direction: column;
  color: #222;

  /* Layered background (SVG + gradients) */
  background-image:
    url('/backgroundHome.svg'),
    radial-gradient(1200px 700px at 15% 85%, rgba(148, 87, 235, 0.35), transparent 60%),
    radial-gradient(1000px 600px at 85% 15%, rgba(102, 205, 210, 0.35), transparent 60%),
    linear-gradient(180deg, #f8f9fb 0%, #f1f5f9 100%),
    linear-gradient(135deg, #f8c8d8 0%, #c7b7ff 50%, #d9f2f0 100%);

  background-repeat: no-repeat;
  background-position: center top;
  background-size: cover;
  background-blend-mode: screen, screen, normal, multiply;
}


.hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px 72px;
}

.title {

  margin: 24px 0 28px;
  font-size: clamp(28px, 5vw, 44px);
  /* font-weight: 900; */
  letter-spacing: 2px;
  background: linear-gradient(90deg, #7aa7ff, #8ed1d6, #b89cf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.card {
  background: #ffffffee;
  border-radius: 14px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.contact-form {
  width: min(520px, 92vw);
  padding: 18px;
}

.contact-form label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: #555;
  margin-bottom: 12px;
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 14px;
  outline: none;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.contact-form input:focus,
.contact-form textarea:focus {
  border-color: #a5b4fc;
  box-shadow: 0 0 0 3px rgba(165, 180, 252, 0.35);
}

.textarea span {
  align-self: start;
}

.submit {
  margin-top: 6px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: #87cbe3;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s ease;
}
.submit:hover {
  transform: translateY(-1px);
}

.cta {
  width: min(820px, 94vw);
  margin-top: 36px;
  padding: 28px 24px;
  border-radius: 24px;
  background: #ffffffee;
}
.cta-heading {
  margin: 0 0 6px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #6d6df7;
  text-align: center;
}
.cta-sub {
  margin: 0;
  font-weight: 800;
  color: #7b7bff;
  text-align: center;
}
.cta-link {
  display: block;
  margin-top: 6px;
  text-align: center;
  text-decoration: none;
  font-weight: 800;
  color: #7a8bc9;
}
</style>
