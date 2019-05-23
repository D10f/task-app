const mongoose = require('mongoose')
const validator = require('validator')

const taskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId, // the author data is going to be an ObjectId
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
})

taskSchema.pre('save', function(next) {
  next()
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task
