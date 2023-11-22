const express = require("express");
const request = require("request");

require("dotenv").config();

const companies = require("../../assets/companies.json");
const User = require("../models/user");
const checkAuth = require("../middleware/checkAuth");
const transporter = require("../../transporter");

const router = express.Router();

//Get all companies on NSE and BSE
router.get("/allCompanies", async (req, res) => {
  res.status(200).json(companies);
});

//Track a stock
router.post("/track", checkAuth, async (req, res) => {
  const { userId } = req.user;
  const { companyName, symbol } = req.body;

  if (!companyName || !companyName) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  const user = await User.findOne({ _id: userId });

  let mail = {};

  if (user.tracking.find((stock) => stock.symbol === symbol)) {
    mail = {
      to: user.email,
      from: process.env.GMAIL_ID,
      subject: `Tracking stopped For Stock : ${companyName}`,
      text: `Hi ${user.name}, \n Tracking has been stopped successfully for ${companyName}.\n\n Regards, \nStockopie`,
    };

    await User.updateOne(
      { _id: userId },
      { $pull: { tracking: { companyName, symbol } } }
    )
      .then(() => {
        res.status(200).json({
          message: "Tracker successfully removed",
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: "Something went wrong",
          error: err.toString(),
        });
      });
  } else {
    mail = {
      to: user.email,
      from: process.env.GMAIL_ID,
      subject: `Tracking Started For Stock : ${companyName}`,
      text: `Hi ${user.name}, \n Tracking has been started successfully for ${companyName}.\n\n Regards, \nStockopie`,
    };

    await User.updateOne(
      { _id: userId },
      { $push: { tracking: { companyName, symbol } } }
    )
      .then(() => {
        res.status(200).json({
          message: "Tracker successfully added",
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: "Something went wrong",
          error: err.toString(),
        });
      });
  }

  transporter.sendMail(mail, async (error, info) => {
    if (error) return console.error(error);
  });
});

//Get all stocks a user is tracking
router.get("/user/tracking", checkAuth, async (req, res) => {
  const { userId } = req.user;

  await User.findById(userId)
    .then(async (user) => {
      res.status(200).json({
        tracking: user.tracking,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
});

//Get info of a particular stock
router.get("/info", async (req, res) => {
  const { query } = req.query;
  const suggestionUrl = `https://www.moneycontrol.com/mccode/common/autosuggestion_solr.php?classic=true&query=${query}&type=1&format=json&callback=suggest1`;
  var data = {};
  request(suggestionUrl, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      data = response.body
        .replace("suggest1", "")
        .replace(")", "")
        .replace("(", "");
      let sc_id = JSON.parse(data)[0].sc_id;
      let url = `https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${sc_id}`;
      request(url, (err, result, htmll) => {
        res.status(200).json(JSON.parse(htmll));
      });
    }
  });
});

module.exports = router;
