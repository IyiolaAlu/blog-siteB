const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
app.use(cors());
const dotenv = require("dotenv");
dotenv.config();
app.use(express.json({limit:"50mb"})) 
const postRoutes = require("./routes/post.routes");
app.use("/api/posts", postRoutes);


mongoose
  .connect(process.env.DATABASE_URI)
  .then(console.log("database connected successfully"))
  .catch((e) => {
    console.log("error connecting to database", e);
  });

const userRouter = require("./routes/user.routes");
app.use("/api/v1", userRouter);

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log("cannot start server at this time");
  } else {
    console.log(`sever started on port successfully`);
  }
});
