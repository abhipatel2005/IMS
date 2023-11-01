const express = require('express');
const router = express.Router();

const AuthController = require("../index.js");

router.post('/register', AuthController.register);

module.exports = router;