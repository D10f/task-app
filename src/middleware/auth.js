const jwt = require('jsonwebtoken')
const User = require('../models/user')

/*
  Check for the 'Authorization' header holding the token, in order to grant access to a specific route:
  KEY: Authorization
  VALUE: Bearer thisisthejwttokencreatedforthisuser

  For querying mongodb for nested properties (tokens.token in this case as per below) we use strings:
  https://docs.mongodb.com/manual/tutorial/query-array-of-documents/
*/

const auth = async (req, res, next) => {

  try {
    const token = req.header('Authorization').split(' ')[1] // consider also .replace()
    const decoded = jwt.verify(token, process.env.JWT_SECRET) // same string used for creating the secret
    const user = await User.findOne({ _id: decoded._id})

    if (!user){
      throw new Error() // no need to provide an err msg, this will trigger the catch code
    }

    req.token = token
    req.user = user
    next()
  } catch(err) {
    res.status(401).send(err)
  }
}

module.exports = auth
