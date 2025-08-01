const jwt = require("jsonwebtoken");

require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

const authenticate_token = (req, res, next) => {

  const token = req.headers.logintoken;
  if (token == "null") {
    res
      .status(401)
      .send({ data: "null", message: "token is not generated login again" });
  } else {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ data: "Invalid token", message: err });
      }
      req.user = decoded;
      next();
    });
  }
};

module.exports = { authenticate_token };
