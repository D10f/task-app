const request = require('supertest') // express api testing utility
const mongoose = require('mongoose')
const app = require('../src/app.js')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase, disconnectDatabase } = require('./fixtures/db')

// Took code to create user initially (userOne) and moved to fixtures > db.js

beforeEach(setupDatabase)

// afterAll(disconnectDatabase) prevents a weird warning message about open handles
// afterEach(() => console.log('this function runs after each test'))

// request (supertest) replaces Postman as a tool to test endpoints in express applications
test('Should signup a new user', async () => {
  await request(app)
    .post('/users') // HTTP method
    .send({
      name: 'Oscar Mayer',
      email: 'oscar@test.com',
      password: 'oscarmayer!'
    })
    .expect(201) // status code
})

test('Should login existing user', async () => {
  const res = await request(app)
    .post('/users/login')
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200)

    const user = await User.findById(userOneId)
    expect(res.body.token).toBe(user.tokens[1].token)
})

test('Should not login not existing user', async () => {
  await request(app).post('/users/login').send({
    email: 'testing@test.com',
    password: 'incorrect'
  }).expect(400)
})

test('Should get user profile', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete existing user', async () => {
  await request(app)
    .delete(`/users/${userOneId}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

    const user = await User.findById(userOneId)

    expect(user).toBeNull()
})

test('Should not be able to delete user unauthorized', async () => {
  await request(app)
  .delete(`/users/me/${userOneId}`)
  .send()
  .expect(404)
})

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200)

    const user = await User.findById(userOneId)

    // expect({}).toMatchObject({}) NOT EQUAL
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Test',
      email: 'tester@test.com'
    })
    .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toBe('Test')
})

test('Should not update invalid fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      notavalidproperty: 'lol'
    })
    .expect(400)
})

test('Should delete current account', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})
