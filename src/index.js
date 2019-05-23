const express = require('express')
require('./db/mongoose')
const User = require('./models/user')
const Task = require('./models/task')
const userRoutes = require('./routes/user')
const taskRoutes = require('./routes/task')

const app = express()
const port = process.env.PORT

// some useful methods: req.method, req.path

app.use(express.json())
// parses incoming requests (JSON) and converts into objects
// its new express API and can be used over body-parser (for JSON data at least)

app.use(userRoutes)
app.use(taskRoutes)

app.listen(port, () => {
  console.log('Server running on port ' + port)
})
