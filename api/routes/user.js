const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const transporter = require("../../transporter");

require("dotenv").config();

const User = require("../models/user");

const router = express.Router();

//User signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await User.find({ email })
    .then(async (user) => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }

      await bcrypt
        .hash(password, 10)
        .then(async (hash) => {
          const user = new User({
            _id: new mongoose.Types.ObjectId(),
            name,
            email,
            password: hash,
          });

          await user
            .save()
            .then(async (result) => {
              const token = jwt.sign(
                {
                  userId: result._id,
                  email: result.email,
                  name: result.name,
                },
                process.env.JWT_SECRET,
                {
                  expiresIn: "30d",
                }
              );
              const mail = {
                to: user.email,
                from: process.env.GMAIL_ID,
                subject: `Stockopie : Registration Successful`,
                text: `Hi ${user.name}, \n You have successfully registered yourself on Stockopie. Have a nice day. \n\n\n Regards, \nStockopie`,
              };
              transporter.sendMail(mail, async (error, info) => {
                if (error) return console.error(error);
              });
              res.status(201).json({
                message: "User created",
                user: {
                  _id: result._id,
                  name: result.name,
                  email: result.email,
                },
                token,
              });
            })
            .catch((err) => {
              res.status(500).json({
                message: "Something went wrong",
                error: err.toString(),
              });
            });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
});

//User login
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await User.findOne({ email })
    .then(async (user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Auth failed: Email not found",
        });
      }
      await bcrypt
        .compare(password, user.password)
        .then((result) => {
          if (result) {
            const token = jwt.sign(
              {
                userId: user._id,
                email: user.email,
                name: user.name,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: "30d",
              }
            );
            return res.status(200).json({
              userDetails: {
                _id: user._id,
                name: user.name,
                email: user.email,
                tracking: user.tracking,
              },
              token,
            });
          }
          return res.status(401).json({
            message: "Auth failed: Invalid password",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
});

module.exports = router;
