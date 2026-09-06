# 🧾 AI Receipt OCR & Order Recommendation System (Frontend Demo)

A modern, fast, and interactive frontend demonstration of an AI-powered Receipt OCR and Order Recommendation system. Originally built during an internship, this project has been refactored into a completely standalone frontend application (with simulated API calls) to showcase the UI, UX, and state management logic without requiring a backend.

## 🚀 Features

- **Receipt OCR Upload Simulation (`/`)**: 
  - Drag-and-drop or click to upload receipt images.
  - Interactive preview with zoom and pan support.
  - Simulated backend processing with progress bars and polling.
  - Extracted data is presented in an intuitive, categorized table (Our Products vs. Other Products).
  - *Includes a **1-Click Demo** button to instantly populate and simulate the extraction process.*

- **AI Order Recommendations (`/orders`)**:
  - Complex multi-step form for generating sales targets and AI recommendations based on customer profiles.
  - Dynamic comboboxes, filtering, and manual adjustments (Best Seller %, etc.).
  - Simulated recommendation API that dynamically returns tailored product lists.
  - *Includes a **1-Click Demo Fill** button to instantly populate form states and trigger the AI flow.*

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Icons**: Lucide React
- **Language**: TypeScript

## 📦 Getting Started

To run this demo locally on your machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Installation
Clone your repository and install the dependencies:
```bash
git clone <your-new-repo-url>
cd portfolio-ocr
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
The app will start on `http://localhost:4321`.

## 💡 How to use the Demo

This project has been specifically configured for fast portfolio presentations:
1. Navigate to the **Home page** (`/`). Click the **"🚀 1-Click Demo Upload & Process"** button to instantly simulate the receipt extraction process.
2. Click the **"AI Recommendations ➔"** button in the top right to switch features.
3. On the **Recommendations page** (`/orders`), click **"🚀 1-Click Demo Fill"** to instantly fill out the complex form state, then hit **"Recommend"** to see the simulated AI results.

## 🔒 Security Note
This project has been scrubbed of all proprietary company data, logos, real API endpoints, and internal business logic to ensure zero data leaks. All data presented in this demo (customers, products, SKUs) is entirely mocked via frontend timeouts.
