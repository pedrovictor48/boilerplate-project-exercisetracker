const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
});

const exerciseSchema = new mongoose.Schema({
    description: String,
    duration: Number,
    date: String,
    personId: String,
});

const User = mongoose.model("user", userSchema);
const Exercise = mongoose.model("exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
    const { username } = req.body;
    const newUser = User({ username });
    newUser.save((err, data) => {
        if (err) return res.json(err);
        return res.json({
            username: data.username,
            _id: data._id,
        });
    });
});

app.get("/api/users", (req, res) => {
    const q = User.find({}, "_id username");
    q.exec((err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.post("/api/users/:id/exercises", (req, res) => {
    let { description, duration, date } = req.body;
    let nowDate = new Date();
    const nowDateStr = nowDate.toISOString().split("T")[0];
    date = date || nowDateStr;
    const newExercise = Exercise({
        description: description,
        duration: duration,
        date: date,
        personId: req.params.id,
    });
    newExercise.save((err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.get("/api/users/:id/exercises", async (req, res) => {
    const user = await User.findById(req.params.id);

    const { from, to, limit } = req.query;

    let exercises = Exercise.find(
        { personId: req.params.id },
        "-_id description duration date"
    );

    if (limit) exercises = exercises.limit(limit);

    exercises = await exercises.exec();

    if (from) {
        const fromDate = new Date(from);
        exercises = exercises.filter((element) => {
            const date = new Date(element.date);
            return date >= fromDate;
        });
    }
    if (to) {
        const toDate = new Date(to);
        exercises = exercises.filter((element) => {
            const date = new Date(element.date);
            return date <= toDate;
        });
    }

    const returnedObject = {
        ...user.toObject(),
        count: exercises.length,
        log: exercises,
    };
    res.json(returnedObject);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
