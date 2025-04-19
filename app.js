// DOM Elements
const loadingScreen = document.querySelector('.loading-screen');
const appContainer = document.querySelector('.app-container');
const themeToggle = document.getElementById('theme-toggle');
const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const moodOptions = document.querySelectorAll('.mood-option');
const journalEntry = document.getElementById('journal-entry');
const saveJournalBtn = document.getElementById('save-journal');
const emergencyBtn = document.getElementById('emergency-btn');

// App State
let currentTheme = 'light';
let messages = [];
let moodHistory = [];
let journalEntries = [];

// Simulate loading
setTimeout(() => {
  loadingScreen.style.opacity = '0';
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    appContainer.classList.remove('hidden');
    
    // Add welcome message
    addMessage("Hi there! I'm your MindEase companion. How can I help you today?", false);
  }, 500);
}, 2000);

// Theme Toggle
themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggle.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

// Navigation
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(`${btn.dataset.page}-page`).classList.add('active');
  });
});

// Chat Functionality
function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', isUser ? 'user' : 'ai');
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function simulateTyping(response) {
  const typingIndicator = document.createElement('div');
  typingIndicator.classList.add('typing-indicator');
  typingIndicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  setTimeout(() => {
    chatMessages.removeChild(typingIndicator);
    addMessage(response, false);
  }, 1500);
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;
  
  addMessage(message, true);
  userInput.value = '';
  
  // Simulate AI response
  simulateTyping(getAIResponse(message));
}

function getAIResponse(message) {
  const responses = [
    "I hear you. Would you like to talk more about that?",
    "That sounds challenging. How does that make you feel?",
    "I appreciate you sharing that with me. What else is on your mind?",
    "Let's explore that together. Can you tell me more?",
    "I understand. Would it help to try a breathing exercise?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Mood Tracker
moodOptions.forEach(option => {
  option.addEventListener('click', () => {
    const mood = option.dataset.mood;
    trackMood(mood);
    
    // Visual feedback
    moodOptions.forEach(opt => opt.style.transform = 'translateY(0)');
    option.style.transform = 'translateY(-10px)';
    option.style.background = 'rgba(108, 99, 255, 0.1)';
    
    setTimeout(() => {
      option.style.transform = 'translateY(0)';
      setTimeout(() => {
        option.style.background = 'transparent';
      }, 300);
    }, 300);
  });
});

function trackMood(mood) {
  const entry = {
    date: new Date().toISOString(),
    mood: mood
  };
  
  moodHistory.push(entry);
  updateMoodChart();
  
  // Show mood-specific message
  const moodMessages = {
    awful: "I'm sorry you're feeling awful. Would you like to try a grounding exercise?",
    meh: "It's okay to feel just 'meh' sometimes. What might help you feel better?",
    ok: "Glad you're doing okay! What's been going well today?",
    good: "It's great that you're feeling good! What's contributing to that?",
    great: "Wonderful that you're feeling great! Let's celebrate the good moments."
  };
  
  simulateTyping(moodMessages[mood]);
}

function updateMoodChart() {
  // In a real app, this would render a chart
  document.getElementById('mood-chart').innerHTML = `
    <p>Mood history for the last 7 days:</p>
    <div style="height: 100px; display: flex; align-items: flex-end; gap: 5px; margin-top: 1rem;">
      ${moodHistory.slice(-7).map(entry => `
        <div style="flex: 1; background: ${getMoodColor(entry.mood)}; height: ${getMoodHeight(entry.mood)}%; border-radius: 5px;"></div>
      `).join('')}
    </div>
  `;
}

function getMoodColor(mood) {
  const colors = {
    awful: '#FF6584',
    meh: '#FFB347',
    ok: '#42E2B8',
    good: '#6C63FF',
    great: '#2ECC71'
  };
  return colors[mood];
}

function getMoodHeight(mood) {
  const heights = {
    awful: 90,
    meh: 60,
    ok: 40,
    good: 20,
    great: 10
  };
  return heights[mood];
}

// Journal
saveJournalBtn.addEventListener('click', () => {
  const entry = journalEntry.value.trim();
  if (!entry) return;
  
  const entryData = {
    date: new Date().toLocaleString(),
    content: entry
  };
  
  journalEntries.push(entryData);
  updateJournalEntries();
  journalEntry.value = '';
  
  // Show reflection prompt
  const prompts = [
    "Thank you for journaling. What emotions came up as you wrote?",
    "I notice you mentioned several things. Which feels most important?",
    "Would you like to explore any of these thoughts further?"
  ];
  
  simulateTyping(prompts[Math.floor(Math.random() * prompts.length)]);
});

function updateJournalEntries() {
  const entriesContainer = document.getElementById('journal-entries');
  entriesContainer.innerHTML = journalEntries.slice().reverse().map(entry => `
    <div class="journal-entry-card">
      <small>${entry.date}</small>
      <p>${entry.content}</p>
    </div>
  `).join('');
}

// Emergency Contact
emergencyBtn.addEventListener('click', () => {
  if (confirm('Would you like to call emergency services?')) {
    alert('Calling emergency services... (simulated)');
  }
});

// Initialize
updateMoodChart();
updateJournalEntries();