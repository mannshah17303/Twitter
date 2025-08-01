const Joi = require("joi");


const login_validations = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = {login_validations};
