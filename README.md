# SunnahBites (Sunnah Meal Planner) 🍯📖

SunnahBites is a desktop application built with **Electron.js** that helps users discover recipes using Sunnah-inspired ingredients (dates, honey, olives, barley, etc.) and plan their weekly meals according to prophetic traditions. The app integrates the **Spoonacular API** for recipe search and provides full **CRUD** functionality for managing a personalized meal plan.

---

## 🌙 Concept & Purpose

Modern nutrition meets timeless Sunnah practices.  
SunnahBites allows Muslims to:

- Search for recipes based on blessed ingredients
- Automatically filter out non-halal items
- Organize meals daily with breakfast, lunch, and dinner slots
- Save, update, and delete meal plans
- Learn spiritual benefits through **"Sunnah Bites!"** pop-ups

---

## 🚀 Features

### 1. Home Page
- Introduction to Sunnah foods
- Quick navigation to **Search Recipes** and **Meal Planner**
- Educational cards with health benefits and hadith references

### 2. Recipe Discovery Page
- Multi-select Sunnah ingredients
- Optional custom ingredient input
- Halal filtering (pork, alcohol, gelatine, etc. automatically removed)
- Real-time recipe results from Spoonacular API
- Recipe modal with matching/missing ingredients, full ingredient list, cooking instructions, and "Add to Meal Plan" button

### 3. Meal Planner Page
- Monthly calendar view
- Click any date to plan meals
- Breakfast, lunch, dinner slots
- Add recipes from saved list or quick search
- Edit/delete individual meals
- Clear entire day plan
- Auto-save daily notes
- Floating stars with Sunnah facts & quotes

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|--------------------------------------|
| Framework   | Electron.js                          |
| Frontend    | HTML, CSS, JavaScript                 |
| Styling     | Custom CSS (pastel theme)             |
| API         | Spoonacular (recipe search)           |
| Persistence | Local file system (JSON via Electron IPC) |

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Steps

```bash
# Clone the repository
git clone https://github.com/amirahbatrisyiaaa/sunnahbites.git
cd sunnahbites

# Install dependencies
npm install

# Run the Electron app
npm start
