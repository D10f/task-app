const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')


// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt_desc
router.get('/tasks', auth, async (req, res, next) => {
  const match = {}
  const sort = {}

  if (req.query.completed === 'true' || req.query.completed === 'false'){
    match.completed = req.query.completed === 'true' ? true : false
  }

  if (req.query.sortBy){
    const parts = req.query.sortBy.split('_')
    sort[parts[0]] = parts[1] === 'desc' ? 1 : -1
  }

  try {
    // const tasks = await Task.find({ author: req.user._id })
    const tasks = await req.user.populate({
      path: 'userTasks', // this is the path we set in the 'userSchema.virtual'
      match: match, // this is an object with options
      options: {
        limit: parseInt(req.query.limit), // provided by JS to convert a value to a integer, which is what mongoose expects
        skip: parseInt(req.query.skip), // if skip or limit are not provided, then mongoose simply ignores it. No errors returned.
        // createdAt: 1 means ascending, -1 descending
        sort
      }
    }).execPopulate()
    res.send(tasks.userTasks) // note: 'tasks' is the user data, 'tasks.userTasks' refers to the actual array of tasks
  } catch (err) {
    res.status(500).send(err)
  }
})

router.get('/tasks/:id', auth, async (req, res, next) => {

  try {
    // const task = await Task.findById(req.params.id)
    const task = await Task.findOne({ _id: req.params.id, author: req.user._id})
    if(!task){
      return res.status(404).send('Resource not found')
    }
    res.send(task)
  } catch (err) {
    res.status(500).send(err)
  }

})

router.post('/tasks', auth, async (req, res, next) => {
  // we get access to user from the auth middleware
  const task = new Task({
    ...req.body, // which comes from the JSON data submitted
    author: req.user._id
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (err) {
    res.status(400).send(err)
  }
})

router.patch('/tasks/:id', auth, async (req, res, next) => {
  // here we want to send a response if client tries to update fields that are not part of the Task.
  // because its a patch method, mongoose would ignore the request anyway but sends back a 200 res which may be confusing
  const updates = Object.keys(req.body) // pretty nice trick
  const allowedUpdates = ['description', 'completed']
  const isValid = updates.every(update => allowedUpdates.includes(update))

  if(!isValid){
    return res.status(400).send({ error: 'Inavlid input' })
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, author: req.user._id })

    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if(!task){
      return res.status(404).send('Task not found')
    }

    updates.forEach(update => task[update] = req.body[update])
    await task.save()
    res.send(task)
  } catch(err) {
    res.status(400).send(err)
  }
})

router.delete('/tasks/:id', auth, async (req, res, next) => {
  try {
    // const task = await Task.findByIdAndRemove(req.params.id)
    const task = await Task.findOneAndDelete({ _id: req.params.id, author: req.user._id })

    if(!task){
      return res.status(404).send()
    }
    res.send(task)
  } catch (err) {
    res.status(500).send()
  }
})

module.exports = router
