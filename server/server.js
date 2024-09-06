const express = require('express');
const app = express();
const uploadRouter = require("./router/upload-router");
const fetchRouter = require("./router/fetch-router");

app.use(express.json({ limit: '50mb' })); 


const PORT = 5000;

app.use("/upload",uploadRouter);
app.use("/fetch",fetchRouter);

app.get("/keep-alive",(req,res) => {
    res.status(200).send("server is working");
});


app.listen(PORT,() => {
    console.log("server is running");
});
