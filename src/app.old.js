require("dotenv").config();

const express = require("express");
const passport = require("passport");
const helmet = require("helmet");
const OAuth2Strategy = require("passport-oauth2");
const session = require("express-session");

const tokenToProfile = async (accesToken, refreshToken, profile, done) => {
  console.log("TOKENS: ", accesToken, refreshToken);

  const user = users.find((user) => user.username === "Sarukei");
  user.accesToken = accesToken;
  user.refreshToken = refreshToken;
  user.profile = profile;

  done(null, user);
};

const app = express();

const users = [
  {
    username: "Sarukei",
  },
];

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: `https://myanimelist.net/v1/oauth2/authorize`,
      tokenURL: `https://myanimelist.net/v1/oauth2/token`,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      state: true,
      pkce: true,
      passReqToCallback: true,
    },
    tokenToProfile
  )
);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "This is my secret",
    resave: true,
  })
);

app.use(passport.initialize());

app.get(
  "/auth/mal",
  passport.authenticate("oauth2", {
    successReturnToOrRedirect: "/login/mal/callback",
  })
);

app.get(
  "/login/mal/callback",
  passport.authenticate("oauth2"),
  (req, res, next) => {
    res.redirect("/secret");
  }
);

app.get("/secret", (req, res) => {
  console.log(req);
  res.send("you have reached the secret route");
});

module.exports = app;
