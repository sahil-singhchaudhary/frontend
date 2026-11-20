require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Topic = require('./models/Topic');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/prep_tracker';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Wrap async handlers so errors reach the error middleware
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/topics?status=&category=&q=
app.get('/api/topics', wrap(async (req, res) => {
  const { status, category, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (q) filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const topics = await Topic.find(filter).sort({ createdAt: -1 });
  res.json(topics);
}));

// GET /api/stats
app.get('/api/stats', wrap(async (req, res) => {
  const rows = await Topic.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const stats = { todo: 0, learning: 0, revised: 0 };
  rows.forEach((r) => (stats[r._id] = r.count));
  stats.total = stats.todo + stats.learning + stats.revised;
  res.json(stats);
}));

app.post('/api/topics', wrap(async (req, res) => {
  const topic = await Topic.create(req.body);
  res.status(201).json(topic);
}));

app.put('/api/topics/:id', wrap(async (req, res) => {
  const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  res.json(topic);
}));

app.delete('/api/topics/:id', wrap(async (req, res) => {
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  res.json({ ok: true });
}));

// Error handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
