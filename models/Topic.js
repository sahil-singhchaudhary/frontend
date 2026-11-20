const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        default: 'todo'
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);