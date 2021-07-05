require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const fetch = require("node-fetch");
const crypto = require("crypto");

const app = express();

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PKCE Helper methods

const base64URLEncode = (str) =>
  str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const generateCodeVerifier = () => base64URLEncode(crypto.randomBytes(32));

const codeVerifier = generateCodeVerifier();
const codeChallenge = codeVerifier;
const state = generateCodeVerifier();

// Routes

// Redirects to MAL auth login server
app.get("/auth/mal", (req, res, next) => {
  const malURL = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&state=${state}&redirect_uri=http://localhost:3000/login/mal/callback&code_challenge=${codeChallenge}&code_challenge_method=plain`;
  // const malURL = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
  console.log(malURL);

  res.redirect(malURL);
});

// Middleware that requests tokens using the auth code, and attaches them to the request.
async function getTokensFromCode(req, res, next) {
  const { code, state: verifyState } = req.query;
  const tokenURL = `https://myanimelist.net/v1/oauth2/token`;

  if (!(verifyState === state)) return next(new Error(`State doesn't match.`));

  if (code) {
    const params = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `http://localhost:3000/login/mal/callback`,
      code_verifier: codeVerifier,
    };

    const urlParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      urlParams.append(k, v);
    }

    const response = await fetch(tokenURL, {
      method: "POST",
      body: urlParams,
    });

    const data = await response.json();
    req.data = data;
    console.log(data);
  }

  next();
}

// Displays the tokens for now.
app.get("/login/mal/callback", getTokensFromCode, async (req, res, next) => {
  const data = fetch(
    `https://api.myanimelist.net/v0.20/anime/17074/my_list_status`
  );

  res.json(await req.data);
});

module.exports = app;
