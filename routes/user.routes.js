const express = require('express')
const { signUp, login, getUser, verify, updateProfile } = require('../controllers/user.controllers')

const router = express.Router()

router.post('/signUp', signUp)

router.post('/login', login)

router.get('/get-user/:id', verify, getUser)

router.put("/update-profile", verify, updateProfile);



module.exports =router


