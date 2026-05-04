// Enhanced Meal Planner functionality
const { ipcRenderer } = require('electron');
let currentDate = new Date();
let selectedDate = null;
let currentMealType = null;
let mealPlan = {};
let isPanelOpen = false;

// Star facts and quotes database
const starContent = [
    {
        type: 'fact',
        content: 'The Prophet ﷺ said: "The best of your condiments is salt." Salt helps balance electrolytes naturally!',
        emoji: '🧂'
    },
    {
        type: 'fact', 
        content: 'Dates were the favorite food of Prophet Muhammad ﷺ. They provide instant energy and are packed with fiber!',
        emoji: '🍇'
    },
    {
        type: 'fact',
        content: 'Honey was called "a remedy for every illness" by the Prophet ﷺ. It has natural antibacterial properties!',
        emoji: '🍯'
    },
    {
        type: 'fact',
        content: 'Olive oil comes from a blessed tree! The Prophet ﷺ advised using it for cooking and as ointment.',
        emoji: '🫒'
    },
    {
        type: 'quote',
        content: 'Eat together and mention the name of Allah, it will be blessed for you. - Prophet Muhammad ﷺ',
        emoji: '🤲'
    },
    {
        type: 'tip',
        content: 'Fill one-third of your stomach with food, one-third with water, and leave one-third empty for breathing.',
        emoji: '🌬️'
    },
    {
        type: 'quote',
        content: 'Your body has a right over you. Nourish it with wholesome food and gratitude.',
        emoji: '❤️'
    },
    {
        type: 'tip',
        content: 'Eating slowly helps digestion and allows you to appreciate your food mindfully.',
        emoji: '🍽️'
    },
    {
        type: 'fact',
        content: 'Cucumbers are 96% water! The Prophet ﷺ ate them with fresh dates for perfect hydration.',
        emoji: '🥒'
    },
    {
        type: 'quote',
        content: 'The food of one person is enough for two, and the food of two is enough for four. - Prophet Muhammad ﷺ',
        emoji: '👥'
    }
];

// DOM Elements
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthElement = document.getElementById('current-month');
const dailyPanel = document.getElementById('daily-panel');
const panelOverlay = document.getElementById('panel-overlay');
const panelDateElement = document.getElementById('panel-date');
const plannerEmpty = document.getElementById('planner-empty');
const recipePicker = document.getElementById('recipe-picker');
const mealEditor = document.getElementById('meal-editor');
const starsContainer = document.getElementById('stars-container');
const starModal = document.getElementById('star-modal');
const starContentElement = document.getElementById('star-content');

// Initialize the planner
document.addEventListener('DOMContentLoaded', function() {
    loadMealPlan();
    generateCalendar();
    createFloatingStars();
    setupPanelDrag();
    setupNotesAutoSave();
    
    console.log('🌟 Enhanced Meal Planner loaded successfully!');
});

// Enhanced Calendar functionality
function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month header
    currentMonthElement.textContent = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(dayName => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = dayName;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dateKey = formatDateKey(new Date(year, month, day));
        const dayPlan = mealPlan[dateKey];
        const hasMeals = dayPlan && (dayPlan.breakfast || dayPlan.lunch || dayPlan.dinner);
        
        // Count meals for badge
        let mealCount = 0;
        let mealIcons = '';
        if (dayPlan) {
            if (dayPlan.breakfast) { mealCount++; mealIcons += '🌅'; }
            if (dayPlan.lunch) { mealCount++; mealIcons += '☀️'; }
            if (dayPlan.dinner) { mealCount++; mealIcons += '🌙'; }
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-badges">
                ${hasMeals ? `
                    <div class="meal-badge" data-meal-count="${mealCount}">
                        <span class="badge-emoji">${mealIcons}</span>
                        <span class="badge-count">${mealCount}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        dayElement.addEventListener('click', () => selectDate(new Date(year, month, day)));
        
        // Highlight today
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // Add visual indicator for planned days
        if (hasMeals) {
            dayElement.classList.add('has-meals');
            if (mealCount === 3) dayElement.classList.add('fully-planned');
            else if (mealCount === 2) dayElement.classList.add('mostly-planned');
            else dayElement.classList.add('partially-planned');
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

// Enhanced date selection with slide-up panel
function selectDate(date) {
    selectedDate = date;
    const dateKey = formatDateKey(date);
    
    // Update panel header
    panelDateElement.textContent = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Load existing plan for this date
    loadDailyPlan(dateKey);
    
    // Show slide-up panel
    openDailyPanel();
    
    // Hide empty state
    plannerEmpty.style.display = 'none';
}

// Slide-up panel functionality
function openDailyPanel() {
    dailyPanel.classList.add('open');
    panelOverlay.classList.add('active');
    isPanelOpen = true;
    document.body.style.overflow = 'hidden';
}

function closeDailyPanel() {
    dailyPanel.classList.remove('open');
    panelOverlay.classList.remove('active');
    isPanelOpen = false;
    document.body.style.overflow = '';
    
    // Auto-save any changes
    saveDailyPlan();
}

function setupPanelDrag() {
    const panel = dailyPanel;
    const handle = panel.querySelector('.panel-drag-handle');
    let startY = 0;
    let startHeight = 0;

    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag);

    function startDrag(e) {
        e.preventDefault();
        startY = e.clientY || e.touches[0].clientY;
        startHeight = parseInt(document.defaultView.getComputedStyle(panel).height, 10);
        
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }

    function doDrag(e) {
        const currentY = e.clientY || e.touches[0].clientY;
        const diff = startY - currentY;
        const newHeight = Math.max(300, Math.min(800, startHeight + diff));
        panel.style.height = newHeight + 'px';
    }

    function stopDrag() {
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('touchmove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    }
}

// Enhanced daily plan management
function loadDailyPlan(dateKey) {
    const dailyPlan = mealPlan[dateKey] || {};
    
    // Load meals
    loadMealSlot('breakfast', dailyPlan.breakfast);
    loadMealSlot('lunch', dailyPlan.lunch);
    loadMealSlot('dinner', dailyPlan.dinner);
    
    // Load notes
    const notesTextarea = document.getElementById('daily-notes');
    notesTextarea.value = dailyPlan.notes || '';
    updateNotesCounter();
}

function loadMealSlot(mealType, mealData) {
    const slot = document.getElementById(`${mealType}-slot`);
    
    if (mealData) {
        slot.innerHTML = `
            <div class="planned-meal">
                <div class="meal-details">
                    <div class="meal-title">${mealData.title}</div>
                    <div class="meal-meta">Added ${formatRelativeTime(mealData.addedAt)}</div>
                </div>
                <div class="meal-actions">
                    <button class="btn-action" onclick="openMealEditor('${mealType}')" title="Edit meal">
                        ✏️
                    </button>
                </div>
            </div>
        `;
    } else {
        slot.innerHTML = `
            <div class="empty-meal">
                <p>No meal planned</p>
                <button class="btn btn-small" onclick="openRecipePicker('${mealType}')">Add Recipe</button>
            </div>
        `;
    }
}

// Meal editor functionality
function openMealEditor(mealType) {
    currentMealType = mealType;
    const dateKey = formatDateKey(selectedDate);
    const mealData = mealPlan[dateKey]?.[mealType];
    
    document.getElementById('editor-meal-type').textContent = 
        mealType.charAt(0).toUpperCase() + mealType.slice(1);
    
    const currentMealInfo = document.getElementById('current-meal-info');
    
    if (mealData) {
        currentMealInfo.innerHTML = `
            <div class="current-meal">
                <h4>Current Meal</h4>
                <div class="meal-preview">
                    <div class="meal-title">${mealData.title}</div>
                    <div class="meal-added">Added ${formatRelativeTime(mealData.addedAt)}</div>
                </div>
            </div>
        `;
    } else {
        currentMealInfo.innerHTML = `
            <div class="no-current-meal">
                <p>No meal currently planned for ${mealType}.</p>
            </div>
        `;
    }
    
    mealEditor.style.display = 'block';
}

function closeMealEditor() {
    mealEditor.style.display = 'none';
    currentMealType = null;
}

function removeCurrentMeal() {
    if (!selectedDate || !currentMealType) return;
    
    const dateKey = formatDateKey(selectedDate);
    
    if (mealPlan[dateKey] && mealPlan[dateKey][currentMealType]) {
        delete mealPlan[dateKey][currentMealType];
        
        // If no meals left, remove the date entry
        if (Object.keys(mealPlan[dateKey]).length === 0) {
            delete mealPlan[dateKey];
        }
        
        // Update display
        loadMealSlot(currentMealType, null);
        saveMealPlan();
        generateCalendar(); // Update calendar badges
        closeMealEditor();
    }
}

function openRecipePickerFromEditor() {
    closeMealEditor();
    openRecipePicker(currentMealType);
}

// Enhanced recipe selection
function openRecipePicker(mealType) {
    currentMealType = mealType;
    document.getElementById('picker-meal-type').textContent = 
        mealType.charAt(0).toUpperCase() + mealType.slice(1);
    
    loadSavedRecipes();
    recipePicker.style.display = 'block';
}

function selectRecipe(recipeId, recipeTitle) {
    if (!selectedDate || !currentMealType) return;
    
    const dateKey = formatDateKey(selectedDate);
    
    // Initialize date in meal plan if not exists
    if (!mealPlan[dateKey]) {
        mealPlan[dateKey] = {};
    }
    
    // Add meal to plan
    mealPlan[dateKey][currentMealType] = {
        id: recipeId,
        title: recipeTitle,
        addedAt: new Date().toISOString()
    };
    
    // Update display
    loadMealSlot(currentMealType, mealPlan[dateKey][currentMealType]);
    saveMealPlan();
    generateCalendar(); // Update calendar badges
    closeRecipePicker();
}

// Enhanced notes with auto-save
function setupNotesAutoSave() {
    const notesTextarea = document.getElementById('daily-notes');
    let saveTimeout;
    
    notesTextarea.addEventListener('input', function() {
        updateNotesCounter();
        
        // Clear existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Set new timeout for auto-save
        saveTimeout = setTimeout(() => {
            saveDailyPlan();
            showAutoSaveIndicator();
        }, 1000);
    });
}

function updateNotesCounter() {
    const notesTextarea = document.getElementById('daily-notes');
    const notesCount = document.querySelector('.notes-count');
    const count = notesTextarea.value.length;
    notesCount.textContent = `${count}/500`;
    
    if (count > 450) {
        notesCount.style.color = 'var(--accent-coral)';
    } else if (count > 300) {
        notesCount.style.color = 'var(--warning)';
    } else {
        notesCount.style.color = 'var(--text-light)';
    }
}

function showAutoSaveIndicator() {
    const indicator = document.querySelector('.auto-save-indicator');
    indicator.textContent = '💾 Saved!';
    indicator.style.opacity = '1';
    
    setTimeout(() => {
        indicator.textContent = '💾 Auto-saved';
        indicator.style.opacity = '0.7';
    }, 2000);
}

function saveDailyPlan() {
    if (!selectedDate) return;
    
    const dateKey = formatDateKey(selectedDate);
    const notes = document.getElementById('daily-notes').value;
    
    if (mealPlan[dateKey]) {
        mealPlan[dateKey].notes = notes;
        saveMealPlan();
    }
}

// Floating stars system
function createFloatingStars() {
    // Clear existing stars
    starsContainer.innerHTML = '';
    
    // Create 5-8 random stars
    const starCount = Math.floor(Math.random() * 4) + 5;
    
    for (let i = 0; i < starCount; i++) {
        createStar();
    }
}

function createStar() {
    const star = document.createElement('div');
    star.className = 'floating-star';
    star.innerHTML = '⭐';
    
    // Random position
    const left = Math.random() * 90 + 5; // 5% to 95%
    const top = Math.random() * 80 + 10; // 10% to 90%
    
    // Random animation delay and duration
    const delay = Math.random() * 5;
    const duration = 15 + Math.random() * 10;
    
    star.style.left = left + '%';
    star.style.top = top + '%';
    star.style.animationDelay = delay + 's';
    star.style.animationDuration = duration + 's';
    
    // Add click event
    star.addEventListener('click', showRandomStarFact);
    
    starsContainer.appendChild(star);
}

function showRandomStarFact() {
    const randomIndex = Math.floor(Math.random() * starContent.length);
    const content = starContent[randomIndex];
    
    starContentElement.innerHTML = `
        <div class="star-type ${content.type}">
            <span class="content-emoji">${content.emoji}</span>
            <p>${content.content}</p>
        </div>
    `;
    
    starModal.style.display = 'block';
}

function closeStarModal() {
    starModal.style.display = 'none';
    // Create a new star to replace the clicked one
    createStar();
}

// Utility functions
function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays < 7) return `${diffDays - 1} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

// Data management
function loadMealPlan() {
    ipcRenderer.invoke('load-meal-plan').then(data => {
        mealPlan = data;
        generateCalendar(); // Refresh calendar with loaded data
        console.log('📂 Meal plan loaded from file:', mealPlan);
    }).catch(error => {
        console.error('Error loading meal plan:', error);
        mealPlan = {};
    });
}

function saveMealPlan() {
  //  DEBUG LINES:
  console.log('💾 saveMealPlan called');
  console.log('mealPlan object:', mealPlan);
  console.log('mealPlan keys:', Object.keys(mealPlan));
  
  if (!mealPlan || Object.keys(mealPlan).length === 0) {
    console.log('⚠️ mealPlan is empty, skipping save');
    return;
  }
  
  ipcRenderer.invoke('save-meal-plan', mealPlan).then(result => {
    if (result.success) {
      console.log('💾 Meal plan saved to data/mealplan.json!');
    } else {
      console.error('Failed to save meal plan:', result.error);
    }
  }).catch(error => {
    console.error('Error saving meal plan:', error);
  });
}

// Calendar navigation
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
    createFloatingStars(); // New stars for new month
}

function goToToday() {
    currentDate = new Date();
    generateCalendar();
    createFloatingStars();
    selectDate(new Date());
}

// Quick actions
function clearDayPlan() {
    if (!selectedDate) return;
    
    const dateKey = formatDateKey(selectedDate);
    
    if (mealPlan[dateKey]) {
        delete mealPlan[dateKey];
        loadDailyPlan(dateKey);
        saveMealPlan();
        generateCalendar();
        
        // Show success message
        showToast('Day cleared successfully!');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === recipePicker) closeRecipePicker();
    if (event.target === mealEditor) closeMealEditor();
    if (event.target === starModal) closeStarModal();
    if (event.target === panelOverlay) closeDailyPanel();
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (recipePicker.style.display === 'block') closeRecipePicker();
        if (mealEditor.style.display === 'block') closeMealEditor();
        if (starModal.style.display === 'block') closeStarModal();
        if (isPanelOpen) closeDailyPanel();
    }
});

// Keep the existing recipe picker functions (they should work with the new system)
function closeRecipePicker() {
    recipePicker.style.display = 'none';
    currentMealType = null;
}

function switchPickerTab(tabName) {
    document.querySelectorAll('.picker-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.picker-tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tabName}-recipes-tab`).classList.add('active');
}

function loadSavedRecipes() {
    const savedRecipes = JSON.parse(localStorage.getItem('sunnahBitesRecipes')) || [];
    const savedRecipesList = document.getElementById('saved-recipes-list');
    const noSavedRecipes = document.getElementById('no-saved-recipes');
    
    if (savedRecipes.length === 0) {
        savedRecipesList.style.display = 'none';
        noSavedRecipes.style.display = 'block';
    } else {
        savedRecipesList.style.display = 'grid';
        noSavedRecipes.style.display = 'none';
        
        savedRecipesList.innerHTML = savedRecipes.map(recipe => `
            <div class="picker-recipe-card" onclick="selectRecipe(${recipe.id}, '${recipe.title.replace(/'/g, "\\'")}')">
                <div class="picker-recipe-title">${recipe.title}</div>
                <div class="picker-recipe-meta">
                    <small>Saved ${formatRelativeTime(recipe.savedAt)}</small>
                </div>
            </div>
        `).join('');
    }
}

async function quickSearchRecipes() {
    const ingredient = document.getElementById('quick-ingredient-select').value;
    const quickResults = document.getElementById('quick-results');
    
    if (!ingredient) {
        quickResults.innerHTML = '<p class="picker-message">Please select an ingredient</p>';
        return;
    }
    
    quickResults.innerHTML = '<p class="picker-message">Searching...</p>';
    
    try {
        const API_KEY = '4882e71195d7425a87b4a3ad9051749d';
        const url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${encodeURIComponent(ingredient)}&number=5`;
        
        const response = await fetch(url);
        const recipes = await response.json();
        
        if (recipes.length === 0) {
            quickResults.innerHTML = '<p class="picker-message">No recipes found</p>';
        } else {
            quickResults.innerHTML = recipes.map(recipe => `
                <div class="picker-recipe-card" onclick="selectRecipe(${recipe.id}, '${recipe.title.replace(/'/g, "\\'")}')">
                    <div class="picker-recipe-title">${recipe.title}</div>
                    <div class="picker-recipe-meta">
                        <small>${recipe.usedIngredients.length} matching ingredients</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Quick search error:', error);
        quickResults.innerHTML = '<p class="picker-message">Search failed</p>';
    }
}