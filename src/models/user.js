const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

// We define the schema first (normally not required)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value){ // we can add custom validation
      if(!validator.isEmail(value)){
        throw new Error('Email is invalid')
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if(value < 0){
        throw new Error('Age must be a positive number')
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value){
      if(value.toLowerCase().includes('password')){
        throw new Error('You cannot use the word "password"')
      }
    }
  },
  avatar: {
    type: Buffer
  },
  tokens: [{
    token: {
      type: String,
      required: true
    },
    created: {
      type: Date,
      default: Date.now()
    }
  }]
}, {
  timestamps: true // this second argument enables timestamps automatically
})

/*
  A 'virtual' is a reference between models, not actual data in the database, provided by mongoose as a way to use populate()
  first argument is an arbitrary name, anything will do, the second argument is an object with:
  ref: the reference to the target model
  localField: which field (from this model) is used as a reference
  foreignField: where is the localField being used as reference
*/

userSchema.virtual('userTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'author'
})

/*
  Now we define the fn that we want to run before/after some action, like saving
  a user or validating an input. Important to note we have to use regular fn due
  to the 'this' binding.

  Also very important, some 'update' mehtods bypasses this middleware, so we have
  to refactor that code in user routes first.
*/


/* res.send used by express uses JSON.stringify behind the scenes. By adding this method to the user instance,
the response is first piped through this function, which we then manipulate to delete sensitive data (or w/e we want) */
userSchema.methods.toJSON = function() {

  // this method provided by mongoose doesnt do anything special, it turns the user data
  // into a javascript object that we can now manipulate, for example in order to return only non-sensitive data
  const userObject = this.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar

  return userObject

}

userSchema.methods.generateAuthToken = async function() {
    const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET)
    this.tokens = [...this.tokens, {token}]
    return token
    /* await this.save()

    note it may be a good idea so save user here, otherwise in the future others
    may use this instance method without realizing they have to save the user to db, as in, they
    may think this method already does that*/
}

// this allows us to call this fn from anywhere. Note it only works if we define
// our own schema manually
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({email: email})

  if(!user){
    throw new Error('Invalid credentials')
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if(!isMatch){
    throw new Error('Invalid credentials')
  }

  return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function(next) {

  // we only want to hash password when creating or updating the password specifically
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }

  next()
})

// Delete all user tasks whenever a user is removed
userSchema.pre('remove', async function(next) {
  await Task.deleteMany({ author: this._id })
  next()
})

/*
  Mongoose creates the schema automatically when using mongoose.model, we simply
  pass in an object (as above) with all the options and parameters. However, we can
  take advantage of mongoose middleware to run some fn(), so instead we define the
  schema previously, and refer to as per below.
*/
const User = mongoose.model('User', userSchema)

module.exports = User
