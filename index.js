import express from "express";
const app = express();
const port = 8000;
import router from "./router/linkRouter.js";
import cors from "cors"

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json())
app.use(cors())
app.use("/api/v1", router);
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
//https://youtube.com/shorts/APC26zE9bSA?si=c1_jJFzQKVHzcfYM