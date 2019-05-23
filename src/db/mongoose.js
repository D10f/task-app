const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true, // deprecated warning
  useCreateIndex: true, // creates an index for each new entry in db
  useFindAndModify: false // deprecated warning
}).then(() => {
  console.log('connected to db')
}).catch(err => {
  console.log(err)
})
