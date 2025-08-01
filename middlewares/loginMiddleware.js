const path = require("path");
const jwt = require("jsonwebtoken");
const { login_validations } = require("../validations/loginValidation");



const login_middleware = (req, res, next) => {
  const data = {
    email: req.body.email,
    password: req.body.password,
  };
  const { error, value } = login_validations.validate(data);


  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

module.exports = {login_middleware}


