const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const mysql = require("mysql2");
const bCrypt = require("bcrypt");
const db = require("./user_db_connect");
const jwt = require("jsonwebtoken");
const { signup_controller } = require("./controllers/signupController");
const {
  authenticatePassword_controller,
} = require("./controllers/authenticatePasswordController");
const { login_controller } = require("./controllers/loginController");
const { signup_validations } = require("./validations/signupValidation");
const { login_middleware } = require("./middlewares/loginMiddleware");
const {
  authenticatePassword_middleware,
} = require("./middlewares/authenticatePasswordMiddleware");
const { authenticate_token } = require("./middlewares/authenticateToken");
const { rejects } = require("assert");
const { el } = require("@faker-js/faker");
const app = express();

require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

const image_configuration = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/img");
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    
    const timestamp = new Date();
    const finalStringFormed = timestamp + originalName;
    cb(null, finalStringFormed);
  },
});

const upload = multer({
  storage: image_configuration,
  limits: { fileSize: 1000 * 1024 },
  fileFilter: function (req, file, cb) {
    const data = {
      first_name: req.body.fname,
      last_name: req.body.lname,
      email: req.body.email,
      city: req.body.city,
      mobile_number: req.body.mobile_number,
    };
    const { error, value } = signup_validations.validate(data);
    if (error) {
      return cb(new Error(error.details[0].message), false);
    }
    const validExtensions = [".jpg", ".jpeg", ".png"];
    const fileExtensions = path.extname(file.originalname).toLowerCase();
    if (validExtensions.includes(fileExtensions)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only JPG, JPEG, PNG are allowed"));
    }
  },
});

const media_image_configuration = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/media");
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    
    const timestamp = new Date();
    const finalStringFormed = timestamp + originalName;
    cb(null, finalStringFormed);
  },
});

const upload_media = multer({
  storage: media_image_configuration,
  limits: { fileSize: 1000 * 1024 },
  fileFilter: function (req, file, cb) {
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const fileExtensions = path.extname(file.originalname).toLowerCase();
    if (file) {
      if (validExtensions.includes(fileExtensions)) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file format. Only JPG, JPEG, PNG are allowed"));
      }
    }
  },
});

app.get("/", (req, res) => {
  res.render("signup");
});

app.post("/signup", upload.any(), signup_controller);

app.get("/clickkheretogeneratepassword", (req, res) => {
  res.render("blankPage");
});

app.get("/generatepassword", (req, res) => {
  res.render("generatePassword.ejs");
});

app.post(
  "/authenticatePassword",
  upload.none(),
  authenticatePassword_middleware,
  authenticatePassword_controller
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", upload.none(), login_middleware, login_controller);

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/home/authenticatetoken", authenticate_token, (req, res) => {
  const logintoken = req.headers.logintoken;
  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    const query = `select * from users where user_id != ?`;
    db.query(query, [decoded.id], (err, result) => {
      if (err) {
        return res
          .status(401)
          .json({ data: "null", message: "Error in fetching data" });
      }
      return res
        .status(200)
        .json({ data: result, message: "successfully fetched data" });
    });
  });
});

app.get("/profile/:id", (req, res) => {
 
  res.render("profile", {
    user_id: req.params.id,
  });
});

app.get("/fetchprofile/:id", authenticate_token, (req, res) => {
  const follower_id = req.params.id;
  const logintoken = req.headers.logintoken;
  const query = `select * from users where user_id = ${req.params.id}`;
  db.query(query, (err, result) => {
    if (err) {
      return res
        .status(401)
        .json({ data: err, message: "error fetching profile" });
    } else {
      jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
        const following_id = decoded.id;

        const selectQuery = `select is_deleted from connections where follower_id = ? and following_id = ?`;
        db.query(
          selectQuery,
          [follower_id, following_id],
          (err, selectResult) => {
            if (err) {
              return res.status(401).json({
                user_data: result[0],
                selectResult: "null",
                message: "error in selecting ids",
              });
            } else {
              const followersQuery = `select following_id from connections where follower_id=? and is_deleted='NO'`;
              db.query(followersQuery, [follower_id], (err, followerResult) => {
                if (err) {
                  res.status(401).json({
                    user_data: result[0],
                    selectResult: selectResult,
                    followerResult: "null",
                    message: "error in selecting ids",
                  });
                } else {
                  const followingsQuery = `select follower_id from connections where following_id=? and is_deleted='NO'`;
                  db.query(
                    followingsQuery,
                    [follower_id],
                    (err, followingResult) => {
                      if (err) {
                        res.status(401).json({
                          user_data: result[0],
                          selectResult: selectResult,
                          followerResult: followerResult,
                          followingResult: "null",
                          message: "error in selecting ids",
                        });
                      } else {
                        const tweetsQuery = `select user_id from tweets where user_id=?`;
                        db.query(
                          tweetsQuery,
                          [follower_id],
                          (err, tweetResult) => {
                            if (err) {
                              res.status(401).json({
                                user_data: result[0],
                                selectResult: selectResult,
                                followerResult: followerResult,
                                followingResult: followingResult,
                                tweetResult: "null",
                                message: "error in selecting ids",
                              });
                            } else {
                              return res.status(200).json({
                                user_data: result[0],
                                selectResult,
                                followerResult,
                                followingResult,
                                tweetResult,
                              });
                            }
                          }
                        );
                      }
                    }
                  );
                }
              });
            }
          }
        );

        // return res.status(200).json({ data: result, message: 'ids inserted successfully' });
      });
    }
  });
});

app.post("/submit_form", upload_media.single("file"), authenticate_token, (req, res) => {
  const logintoken = req.headers.logintoken;

  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    const user_id = decoded.id;
    if (req.file) {
      const query = `insert into tweets(user_id, tweet_content, tweet_media, tweet_created_at) values (${user_id},'${req.body.text}','${req.file.filename}', UTC_TIMESTAMP)`;
      db.query(query, (err, result) => {
        if (err) {
          return res
            .status(401)
            .json({ data: err, message: "error inserting tweet" });
        }
        return res
          .status(200)
          .json({ data: result, message: "tweet inserted successfully" });
      });
    } else {
      const query = `insert into tweets(user_id, tweet_content, tweet_created_at) values (${user_id},'${req.body.text}', UTC_TIMESTAMP)`;
      db.query(query, (err, result) => {
        if (err) {
          return res
            .status(401)
            .json({ data: err, message: "error inserting tweet" });
        }
        return res
          .status(200)
          .json({ data: result, message: "tweet inserted successfully" });
      });
    }
  });
});

app.get("/fetchTweets/:id", async (req, res) => {
  
  const query = `select t.*, u.first_name, u.last_name, u.profile_photo from tweets t join users u on t.user_id = u.user_id where t.user_id = ? order by t.tweet_created_at desc`;
  try {
    const [result] = await db.promise().query(query, [req.params.id]);
    return res
      .status(200)
      .json({ data: result, message: "tweet selected successfully" });
  } catch (err) {
    return res
      .status(401)
      .json({ data: err, message: "error in selecting tweet" });
  }
});

app.post("/follow/:id", (req, res) => {
  
  const follower_id = req.params.id;
  const logintoken = req.headers.logintoken;
  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    
    const following_id = decoded.id;
    const query = `insert into connections(follower_id, following_id) values(?,?)`;
    db.query(query, [follower_id, following_id], (err, result) => {
      if (err) {
        return res
          .status(401)
          .json({ data: err, message: "error in inserting ids" });
      } else {
        const selectQuery = `select is_deleted from connections where follower_id = ? and following_id = ?`;
        db.query(
          selectQuery,
          [follower_id, following_id],
          (err, selectResult) => {
            if (err) {
              return res
                .status(401)
                .json({ data: err, message: "error in selecting ids" });
            }
            return res.status(200).json({
              data: selectResult,
              message: "ids selected successfully",
            });
          }
        );
      }
      // return res.status(200).json({ data: result, message: 'ids inserted successfully' });
    });
  });
});

app.post("/unfollow/:id", (req, res) => {
 
  const follower_id = req.params.id;
  const logintoken = req.headers.logintoken;
  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
   
    const following_id = decoded.id;
    const query = `update connections set is_deleted = 'YES' where follower_id = ? and following_id = ?`;
    db.query(query, [follower_id, following_id], (err, result) => {
      if (err) {
        return res
          .status(401)
          .json({ data: err, message: "error in inserting ids" });
      } else {
        const selectQuery = `select is_deleted from connections where follower_id = ? and following_id = ?`;
        db.query(
          selectQuery,
          [follower_id, following_id],
          (err, selectResult) => {
            if (err) {
              return res
                .status(401)
                .json({ data: err, message: "error in selecting ids" });
            }
            return res.status(200).json({
              data: selectResult,
              message: "ids selected successfully",
            });
          }
        );
      }
      // return res.status(200).json({ data: result, message: 'ids inserted successfully' });
    });
  });
});

app.get("/fetchAlltweets", (req, res) => {
  const selectAllTweetsQuery = `select t.*, u.first_name, u.last_name, u.profile_photo from tweets t join users u on t.user_id = u.user_id order by t.tweet_created_at desc`;
  db.query(selectAllTweetsQuery, (err, tweetResult) => {
    
    if (err) {
      return res
        .status(401)
        .json({ data: err, message: "error in selecting tweets" });
    } else {
      return res.status(200).json({
        tweets: tweetResult,
      });
    }
  });
});

app.get("/like/:tweet_id", (req, res) => {
  const logintoken = req.headers.logintoken;
  const tweet_id = req.params.tweet_id;

  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    const user_id = decoded.id;
    const insertQuery = `insert into like_dislike(user_id, tweet_id) values(?,?)`;
    db.query(insertQuery, [user_id, tweet_id], (err, result) => {
      if (err) {
        return res
          .status(401)
          .json({ data: err, message: "error in inserting likes" });
      } else {
        const selectQuery = `select * from like_dislike where user_id=? and tweet_id=?`;
        db.query(selectQuery, [user_id, tweet_id], (err, selectResult) => {
          if (err) {
            return res
              .status(401)
              .json({ data: err, message: "error in selecting likes" });
          } else {
            const countQuery = `select count(1) as total from like_dislike where tweet_id=? and is_unliked='NO'`;
            db.query(countQuery, [tweet_id], (err, countResult) => {
              
              if (err) {
                return res.status(401).json({
                  data: selectResult,
                  message: "error in selecting count",
                });
              } else {
               
                return res.status(200).json({
                  likesData: selectResult,
                  countResult,
                });
              }
            });
          }
        });
      }
    });
  });
});

app.get("/unlike/:tweet_id", (req, res) => {
  const logintoken = req.headers.logintoken;
  const tweet_id = req.params.tweet_id;

  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    const user_id = decoded.id;
    const updateQuery = `update like_dislike set is_unliked='YES' where user_id=? and tweet_id=?`;
    db.query(updateQuery, [user_id, tweet_id], (err, result) => {
      if (err) {
        return res
          .status(401)
          .json({ data: err, message: "error in updating likes" });
      } else {
        const selectQuery = `select is_unliked from like_dislike where user_id=? and tweet_id=?`;
        db.query(selectQuery, [user_id, tweet_id], (err, selectResult) => {
          if (err) {
            return res
              .status(401)
              .json({ data: err, message: "error in selecting likes" });
          } else {
            const countQuery = `select count(1) as total from like_dislike where tweet_id=? and is_unliked='NO'`;
            db.query(countQuery, [tweet_id], (err, countResult) => {
              
              if (err) {
                return res
                  .status(401)
                  .json({ data: err, message: "error in selecting count" });
              } else {
                return res.status(200).json({
                  unlikesData: selectResult,
                  countResult,
                });
              }
            });
          }
        });
      }
    });
  });
});

app.get("/likesCount/:tweet_id", (req, res) => {
  const tweet_id = req.params.tweet_id;
  const logintoken = req.headers.logintoken;

  const countQuery = `
    SELECT COUNT(1) AS total FROM like_dislike 
    WHERE tweet_id=? AND is_unliked='NO'
  `;
  const likedQuery = `
    SELECT EXISTS(
      SELECT 1 FROM like_dislike 
      WHERE tweet_id=? AND user_id=? AND is_unliked='NO'
    ) AS userLiked
  `;

  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    const user_id = decoded.id;

    db.query(countQuery, [tweet_id], (err, countResult) => {
      if (err) {
        return res
          .status(401)
          .json({ data: err, message: "Error in count query" });
      }

      db.query(likedQuery, [tweet_id, user_id], (err, likedResult) => {
        if (err) {
          return res
            .status(401)
            .json({ data: err, message: "Error in liked query" });
        }

        return res.status(200).json({
          countResult,
          userLiked: likedResult[0].userLiked === 1, // Convert to boolean
        });
      });
    });
  });
});

app.get("/getLikesData/:id", (req, res) => {
  const tweet_id = req.params.id;
  const jwtToken = req.headers.logintoken;
  let user_id;
  
  jwt.verify(jwtToken, SECRET_KEY, (err, decodedData) => {
    if (err)
      return res
        .status(401)
        .json({ data: "null", message: "token is not verified" });
    else {
      user_id = decodedData.id;
      
      const query = `select * from like_dislike where tweet_id=? and user_id=? and is_unliked='NO'`;
      db.query(query, [tweet_id, user_id], (err, likeResult) => {
        if (err) {
          return res
            .status(401)
            .json({ data: err, message: "error in selecting likes" });
        } else {
          return res.status(200).json({
            likeResult,
          });
        }
      });
    }
  });
});

app.get("/retweet-status/:tweet_id", async (req, res) => {
  try {
    const details = await new Promise((resolve, reject) => {
      var sql = `Select tweet_id from retweet where repost_tweet_id = ?`;
      db.query(sql, [req.params.tweet_id], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
    var status;
    if (details.length > 0) {
      status = 1; // record of repost found
      const user_details = await new Promise((resolve, reject) => {
        var sql = `select user_id, first_name, last_name from users where user_id = (select user_id from tweets where tweet_id = ${details[0].tweet_id})`;

        db.query(sql, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });

      return res
        .status(200)
        .json({
          data: "Success",
          message: "Records Fetched Successfull",
          status,
          user_details,
        });
    } else {
      status = 0;
      return res
        .status(200)
        .json({ data: "Success", message: "Records Fetch Failed", status });
    }
  } catch (error) {
    console.error(error); 
  }
});

app.get("/retweet/:id", async (req, res) => {
  const tweet_id = req.params.id;
  const logintoken = req.headers.logintoken;
  let user_id;
  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    user_id = decoded.id;
    
  });

  try {
    const all_tweet_details = await new Promise((resolve, reject) => {
      const all_tweet_details_query = `select * from tweets where tweet_id=?`;
      db.query(
        all_tweet_details_query,
        [tweet_id],
        (err, tweetDetailsResult) => {
          if (err) reject(err);
          else resolve(tweetDetailsResult);
        }
      );
    });

    const user_details = await new Promise((resolve, reject) => {
      const user_details_query = `select * from users where user_id=?`;
      db.query(
        user_details_query,
        [all_tweet_details[0].user_id],
        (err, userResult) => {
          if (err) reject(err);
          else resolve(userResult);
        }
      );
    });

    const inserted_tweet = await new Promise((resolve, reject) => {
      const insert_tweet_query = `insert into tweets (user_id,tweet_content, tweet_media, tweet_created_at) values(${user_id},'${all_tweet_details[0].tweet_content}', '${all_tweet_details[0].tweet_media}', UTC_TIMESTAMP)`;
      db.query(
        insert_tweet_query,
        (err, insert_tweet_result) => {
          if (err) reject(err);
          else resolve(insert_tweet_result.insertId);
        }
      );
    });

    const retweet = await new Promise((resolve, reject) => {
      const reTweet_query = `insert into retweet (tweet_id,repost_tweet_id) values(?,?)`;
      db.query(
        reTweet_query,
        [tweet_id, inserted_tweet],
        (err, reTweet_result) => {
          if (err) reject(err);
          else resolve(reTweet_result.insertId);
        }
      );
    });

    return res
      .status(200)
      .json({ data: "success retweet", message: "Retweet Successfully Done" });
  } catch (error) {
    console.error(error);
  }
});

app.get("/loggedin-user-profile-photo", (req, res) => {
  const logintoken = req.headers.logintoken;

  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    const user_id = decoded.id;
    if (err) {
      return res
        .status(401)
        .json({ data: err, message: "error in fetching user profile photo" });
    }
    const query = `select first_name, last_name, profile_photo from users where user_id=?`;
    db.query(query, [user_id], (err, fetchedProfileResult) => {
      if (err) {
        return res
          .status(401)
          .json({ data: err, message: "error in fetching user profile photo" });
      } else {
        return res.status(200).json({
          fetchedProfileResult,
        });
      }
    });
  });
});

app.get("/view_loggedinuser_profile", authenticate_token, (req, res) => {
  const logintoken = req.headers.logintoken;
  jwt.verify(logintoken, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ data: "null", message: "Error in verifying token" });
    }
    const user_id = decoded.id;
    const query = `select * from users  where user_id=?`;
    db.query(query, [user_id], (err, loggedinuserprofileResult) => {
      if (err) {
        return res
          .status(401)
          .json({ data: "null", message: "Error in fetching data" });
      } else {
        return res
          .status(200)
          .json({ loggedinuserProfile: loggedinuserprofileResult[0] });
      }
    });
  });
});

app.get("/viewFollowersList/:user_id",(req,res)=>{
  const user_id = req.params.user_id;

  const query = `select user_id,first_name, last_name, profile_photo from users where user_id in (select following_id from connections where follower_id = ${user_id} and is_deleted = 'NO') `
  db.query(query, (err,result)=>{
    if(err){
      console.error("error in fetching followers list", err);
    }else{
    
      return res.status(200).json({
        folowersList: result
      })
    }
    
  })
})

app.get("/viewFollowingsList/:user_id",(req,res)=>{
  const user_id = req.params.user_id;
 
  const query = `select user_id,first_name, last_name, profile_photo from users where user_id in (select follower_id from connections where following_id = ${user_id} and is_deleted = 'NO') `
  db.query(query, (err,result)=>{
    if(err){
      console.error("error in fetching followers list", err);
    }else{
     
      return res.status(200).json({
        folowingsList: result
      })
    }
    
  })
})

const port = 3000;

app.listen(port, () => {
  console.log(`listening to port ${port}`);
});


