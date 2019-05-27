const express = require('express')
require('./db/mongoose')
const userRoutes = require('./routes/user')
const taskRoutes = require('./routes/task')

const app = express()

// some useful methods: req.method, req.path

app.use(express.json())
// parses incoming requests (JSON) and converts into objects
// its new express API and can be used over body-parser (for JSON data at least)

app.use(userRoutes)
app.use(taskRoutes)

module.exports = app
