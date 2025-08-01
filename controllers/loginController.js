const db = require('../user_db_connect')
const jwt = require("jsonwebtoken");
const bCrypt = require("bcrypt");

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const login_controller = (req, res) => {
  
  const query = `select * from users where email = ?`;
  db.query(query, [req.body.email], async (err, result) => {
    if (err) {
      return res.status(401).json({ data: "null", message: err });
    }
    if (result.length == 0) {
      return res
        .status(401)
        .json({ data: "null", message: "Invalid email or password" });
    }
    const user = result[0];

    const match = await bCrypt.compare(req.body.password, user.password);

    if (match) {
      const token = jwt.sign(
        {
          id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          purpose: "login",
        },
        SECRET_KEY,
        { expiresIn: 60 * 60 }
      );

      return res
        .status(200)
        .json({ data: user, message: "successfully logged in", token: token });
    } else {
      return res
        .status(401)
        .json({ data: "null", message: "Invalid email or password" });
    }
  });
};

module.exports = {login_controller}
