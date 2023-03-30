import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import authRouter, { generateClient } from "./routes/auth.routes.js";
import authMiddleware from "./middlewares/auth.middleware.js";
import { google } from "googleapis";

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");
app.all("*", (req, res, next) => {
  console.log(req.url, "-", req.method);
  next();
});

app.get("/", authMiddleware, (req, res) => {
  res.render("index.ejs");
});

app.use("/auth", authRouter);

app.post("/create-signature", authMiddleware, async (req, res) => {
  try {
    const signature = req.body.signature;
    const client = generateClient();
    client.setCredentials(req.tokens);
    const gmail = google.gmail({
      version: "v1",
      auth: client,
    });
    const { data } = await gmail.users.settings.sendAs.list({
      userId: "me",
    });
    const sendAsEmail = data.sendAs[0].sendAsEmail;
    const requestBody = {
      sendAsEmail,
      userId: "me",
      requestBody: {
        signature,
      },
    };
    await gmail.users.settings.sendAs.update(requestBody);
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(404).json({ message: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, (err) => {
  if (err) throw err;
  console.log("Server listening at Port : " + port);
});
