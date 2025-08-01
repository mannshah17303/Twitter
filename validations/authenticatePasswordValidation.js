const Joi = require("joi");


const authenticatePassword_validations = Joi.object({
  password: Joi.string().required(),
  confirmpassword: Joi.string().required(),
});

module.exports = {authenticatePassword_validations}