const db = require('../user_db_connect')
const jwt = require("jsonwebtoken");
const bCrypt = require("bcrypt");

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;



const authenticatePassword_controller = async (req,res)=>{
  

    const token = req.headers.token;
    const password = req.body.password;
    const confirmPassword = req.body.confirmpassword;

    if(password == confirmPassword){
      const hashedPassword = await bCrypt.hash(password, 1);
      jwt.verify(token, SECRET_KEY, (err,decoded)=>{
        if(err){
          return res.status(401).json({data:"null",message:"cannot insert password"});
        }
        
        const email = decoded.email;
      
        const query = `update users set password = ? where email = ?`;
        db.query(query, [hashedPassword,email], (err,result)=>{
          if(err){
            return res.status(401).json({data:"null",message:"cannot insert password"});
          }

          return res.status(200).json({data:"null",message:"Both password matched"});
        })
      })
    }else{
      return res.status(401).json({data:"null",message:"Password or Confirm password does not match"});

    }
}

module.exports = {authenticatePassword_controller}