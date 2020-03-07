import "dotenv/config.js";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import http from "http";
import routes from "./routes";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/", routes);

server.listen(port, () => {
  console.log("Server running on port", port);
});
