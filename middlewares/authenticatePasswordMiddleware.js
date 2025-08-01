const path = require("path");
const jwt = require("jsonwebtoken");
const {
  authenticatePassword_validations,
} = require("../validations/authenticatePasswordValidation");

const authenticatePassword_middleware = (req, res, next) => {
  const data = {
    password: req.body.password,
    confirmpassword: req.body.confirmpassword,
  };
  const { error, value } = authenticatePassword_validations.validate(data);


  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

module.exports = {authenticatePassword_middleware}
