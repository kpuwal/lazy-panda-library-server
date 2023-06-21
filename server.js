const express = require('express');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const appRouter = require('./router');

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  return res.send("App is Running running running...");
});

app.use('/',  appRouter);

app.listen(PORT, () =>
  console.log(
    ` 📡 Backend server: ` +
      ` Running in ${ENV} mode on port ${PORT}`
  )
);
