const express = require('express')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middleware/auth')
const User = require('../models/user')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const router = express.Router()

const upload = multer({
  // dest: 'avatar', destination folder is optional. Omit to get access to file in the request object (see 'sharp' below)
  limits: {
    fileSize: 1000000 // 1MB
  },
  fileFilter(req, file, callback){
    if(!file.originalname.match(/\.(png|jpg|jpeg)$/)){ // also possible: file.originalname.endsWith('.pdf')
      return callback(new Error('Please upload an image'))
    }
    callback(undefined, true)

    /*
      callback(new Error('Some error message'))
      callback(undefined, true) // no error, accept file upload
      callback(undefined, false) // no error, do not accept file upload
    */
  }
})

// GET all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({})
    res.send(users)
  } catch(err) {
    res.status(500).send(err)
  }
})

// Once authenticated get user profile
router.get('/users/me', auth, async (req, res, next) => {
  res.send(req.user) // we already set the user during the 'auth' middleware
})

// Not something you would normally allow (to fetch any users profile if you happen to know their id)
router.get('/users/:id', async (req, res, next) => {

  try {
    const user = await User.findById(req.params.id)
    if (!user){
      return res.status(404).send('User not found')
    }
    res.send(user)
  } catch(err) {
    res.status(500).send(err)
  }
})

/* ## Creating routes using Async/Await ##
  1. Add async keyword to the express fn()
  2. Wrap following code in try/catch to handle success/errors
  3. Any code after 'await' will execute only on success
*/
router.post('/users', async (req, res, next) => {
  const user = new User(req.body)
  console.log(user)
  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    res.status(201).send(user)
  } catch(err) {
    res.status(400).send(err)
  }

  /*console.log(req.body) // thanks to the express.json() we get the object
  const user = new User(req.body)

  user.save().then(user => {
    res.status(201).send(user)
  })
  .catch(err => res.status(400).send(err))*/
})

router.post('/users/login', async (req, res) => {
  try {
    // create our own 'static' fn
    const user = await User.findByCredentials(req.body.email, req.body.password) // see user model

    // create our own 'method' fn
    const token = await user.generateAuthToken()

    await user.save()
    res.send({user, token})
  } catch (err) {
    res.status(400).send(err)
  }
})

router.post('/users/logout', auth, async (req, res, next) => {
  try {
    // filter out the current token used to login
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token // note: token is an object with a token property
    })

    await req.user.save()
    res.send()

  } catch (err) {
    res.status(500).send()
  }
})

router.post('/users/logoutAll', auth, async (req, res, next) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch(err) {
    res.status(500).send()
  }
})

// Now handling errors properly!
// accessing the file uploading from multer (due to no destination (dest) folder)
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res, next) => {
  // req.user.avatar = req.file.buffer this to set the buffer directly to user.avatar
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

  req.user.avatar = buffer
  await req.user.save()
  res.send('image uploaded successfully')
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res, next) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send('Profile updated')
})

// Since we are using a buffer for the image this is how it would be served
router.get('/users/:id/avatar', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
      throw new Error()
    }

    // res.set('Content-Type', 'application/json') this is default
    res.set('Content-Type', 'image/png')
    res.send(user.avatar)

  } catch {
    res.status(404).send()
  }
})

// Again, another place where you wouldn't want to allow profiles to be updated if you know the id.
// Changing from '/users/:id' to '/users/me'
router.patch('/users/me', auth, async (req, res, next) => {
  const updates = Object.keys(req.body) // returns an array of strings out of the properties of an object
  const allowedUpdates = ['name', 'email', 'password', 'password', 'age']
  const isValid = updates.every(update => allowedUpdates.includes(update))

  if(!isValid){
    return res.status(400).send({ error: 'Invalid updated fields'})
  }

  // see docs for findByIdAndUpdate (3rd parameter, options)
  // also why we cannot use it if we use mongoose middleware as its bypassed (see user model)
  try {
    /* const user = await User.findById(req.params.id) no longer needed since we have req.user from auth middleware*/
    const user = req.user
    updates.forEach(update => user[update] = req.body[update]) // bracket notation allows to select an object properties dynamically

    await user.save()
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true})

    res.send(user)
  } catch(err) {
    // 400 cause client sent us invalid data (error returned from validator)
    res.status(400).send(err)
  }
})

// Instead you may want to allow for users to delete their accounts as follows:
router.delete('/users/me', auth, async (req, res, next) => {
  try {
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (err){
    res.status(500).send()
  }
})

// Also not something you would want to allow
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id)
    if(!user){
      return res.status(404).send()
    }
    res.send(user)
  } catch(err) {
    res.status(500).send()
  }
})

module.exports = router
