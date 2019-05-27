const app = require('./app')
const port = process.env.PORT

app.listen(port, () => {
  console.log('Server running on port ' + port)
})

/*
  We moved all of the express related code and moved it into app.js so that we can get access
  to app which is the express server, without calling app.listen().

  This is for testing purposes. Now we can specifically call index.js when we want to run
  the task manager app as usual, but we can also call app.js when we want to perform test,
  using our actual code and configuration without affecting the production version.
*/
