# Service Tounsi - React Monorepo

A modern web application with 6 AI-powered services for the Tunisian market.

## Project Structure

```
service_tounsi/
├── client/              (React + Vite frontend)
├── server/              (Express backend)
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install server dependencies**
```bash
cd server
npm install
cd ..
```

2. **Install client dependencies**
```bash
cd client
npm install
cd ..
```

### Environment Variables

Create `server/.env`:
```
GEMINI_API_KEY=your_gemini_api_key
KONNECT_API_KEY=your_konnect_key
KONNECT_WALLET_ID=your_wallet_id
PORT=3000
KONNECT_BASE_URL=https://api.preprod.konnect.network
```

## Development

Run both server and client in separate terminals:

**Terminal 1 - Server:**
```bash
cd server
node index.js
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

Then open: **http://localhost:5173**

The client will proxy API calls to `http://localhost:3000`

## Services

1. **Beard Advisor** (/beard) - Analyze face shape and suggest beard styles
2. **Haircut Advisor** (/haircut) - Recommend haircuts based on facial features
3. **Car Damage Scan** (/car) - Assess car damage and estimate repair costs
4. **Fridge to Recipe** (/fridge) - Suggest recipes based on available ingredients
5. **Outfit Stylist** (/outfit) - Provide outfit recommendations
6. **Premium Gold Ink** (/premium) - Premium product showcase

## Production Build

```bash
cd client
npm run build
```

This generates a `dist/` folder with the optimized React app. The server will serve this automatically on production.

## Technologies

- **Frontend**: React 18, React Router, Tailwind CSS, Vite
- **Backend**: Express.js, @google/generative-ai (Gemini 2.5 Flash)
- **Styling**: Tailwind CSS with custom Material Design Dark theme
- **API Integration**: Gemini AI for image analysis, Konnect for payments
