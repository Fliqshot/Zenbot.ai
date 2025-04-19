require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Database Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'default' },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const MoodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { 
    type: String, 
    required: true,
    enum: ['awful', 'meh', 'ok', 'good', 'great']
  },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const JournalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Mood = mongoose.model('Mood', MoodSchema);
const Journal = mongoose.model('Journal', JournalSchema);

// Vertex AI Initialization
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID,
  location: process.env.GOOGLE_LOCATION
});
const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-pro'
});

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({ token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Chat Routes
app.post('/api/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    
    const prompt = `As a mental health companion, respond to this message from a Gen Z user: "${message}". 
    Keep it empathetic (1-2 sentences max).`;
    
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    res.json({
      response: result.response.candidates[0].content.parts[0].text
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Mood Routes
app.post('/api/mood', authenticate, async (req, res) => {
  try {
    const { mood, note } = req.body;
    const newMood = new Mood({
      userId: req.user.id,
      mood,
      note
    });

    await newMood.save();
    
    const tips = {
      awful: ["Try deep breathing for 5 minutes", "Reach out to a friend"],
      meh: ["Go for a short walk", "Listen to uplifting music"],
      ok: ["Journal about your day", "Do something creative"],
      good: ["Savor this moment", "Share your positivity with others"],
      great: ["Celebrate small wins!", "Plan something fun"]
    };

    res.json({
      message: `Your ${mood} mood was recorded`,
      tips: tips[mood]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track mood' });
  }
});

// Journal Routes
app.post('/api/journal', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const newEntry = new Journal({
      userId: req.user.id,
      content
    });

    await newEntry.save();
    res.json({ message: 'Journal entry saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save journal' });
  }
});

// Wellness Data (Mock Google Fit)
app.get('/api/wellness', authenticate, async (req, res) => {
  try {
    // Mock data - replace with real Google Fit API calls
    const wellnessData = {
      steps: Math.floor(Math.random() * 10000),
      heartRate: 65 + Math.floor(Math.random() * 20),
      sleepHours: (6 + Math.random() * 3).toFixed(1),
      lastUpdated: new Date()
    };
    
    res.json(wellnessData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get wellness data' });
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});