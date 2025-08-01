const Joi = require("joi");

const signup_validations = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().required(),
  city: Joi.string().required(),
  mobile_number: Joi.string().required(),
});


module.exports = {signup_validations};