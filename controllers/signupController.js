const bCrypt = require("bcrypt");
const db = require("../user_db_connect");
const jwt = require("jsonwebtoken");

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const queryDatabase = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        return reject(err);
      }

      resolve(results);
    });
  });
};

const signup_controller = async(req,res)=>{
   
    //   const hashedPassword = await bCrypt.hash(req.body.password, 1);
      const query = `insert into users(first_name, last_name, email, city, mobile_number, profile_photo) values(?,?,?,?,?,?)`;
      db.query(
        query,
        [
          req.body.fname,
          req.body.lname,
          req.body.email,
          req.body.city,
        //   hashedPassword,
          req.body.mobile_number,
          req.files[0].path,
        ],
        (err, result) => {
            
          if (err) {
            return res.status(401).json({data:"no records inserted",message:err});
          } else {
            const select_query = `select * from users where email = ?`;
            db.query(select_query,[req.body.email], (err,selectResult)=>{
                if(err){
                    return res.status(401).json({data:"null",message:err});
                }
                const user = selectResult[0];
                const token = jwt.sign(
                    {
                      id: user.user_id,
                      first_name: user.first_name,
                      last_name: user.last_name,
                      email: user.email,
                      city: user.city,
                      mobile_number: user.mobile_number,
                      purpose: "signin"
                    },
                    SECRET_KEY,
                    { expiresIn: 60 * 60 }
                  );
                
                  return res.status(200).json({data:user,message:"successfully signed in",token:token });
            })
       
               
                

          }
        }
      );
      
}

module.exports = {signup_controller};