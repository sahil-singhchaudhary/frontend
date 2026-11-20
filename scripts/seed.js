const mongoose = require('mongoose');
const Topic = require('../models/Topic');
require('dotenv').config();

const sampleTopics = [
  { subject: 'DSA', title: 'Two Sum', status: 'Completed', rating: 4, notes: 'Hash map approach O(N)' },
  { subject: 'DSA', title: 'Merge Intervals', status: 'In Progress', rating: 3, notes: 'Sort by start time' },
  { subject: 'DBMS', title: 'ACID Properties', status: 'Completed', rating: 5, notes: 'Very important for interviews' },
  { subject: 'OS', title: 'Process vs Thread', status: 'Not Started', rating: 3, notes: 'Check context switching overhead' },
  { subject: 'System Design', title: 'URL Shortener (TinyURL)', status: 'Not Started', rating: 4, notes: 'Focus on hashing and DB scaling' },
  { subject: 'Aptitude', title: 'Time, Speed and Distance', status: 'In Progress', rating: 3, notes: 'Practice relative speed problems' }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/prep-tracker');
    await Topic.deleteMany({});
    await Topic.insertMany(sampleTopics);
    console.log('Database seeded successfully with multi-subject placement data!');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDB();
