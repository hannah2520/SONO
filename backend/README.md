# SONO Backend Server

Backend API server for the SONO application with OpenAI integration.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
   - Open `.env` file
   - Replace `your_openai_api_key_here` with your actual OpenAI API key

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status

### Chat with AI
- **POST** `/api/chat`
- Body:
  ```json
  {
    "message": "Your message here",
    "conversationHistory": [] // Optional: previous messages
  }
  ```
- Returns AI response

## Example Usage

```javascript
// From your frontend
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, can you help me find music for my mood?',
  }),
});

const data = await response.json();
console.log(data.message); // AI's response
```
