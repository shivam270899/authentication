const express = require('express');
const app = express();
const mongoose = require('mongoose');
const userRoute = require('./routes/auth');


app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://127.0.0.1:27017/project2", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})


var db = mongoose.connection;


db.on('connected', () => console.log("mongodb connection success"));
db.on('error', () => console.log("mongodb connection fail"));

app.get('/', (req, res) => {
    res.send('server connected');
})

app.use('/api', userRoute);

const port = process.env.PORT || 5000;


app.listen(port, () => {
    console.log(`serve at http://localhost:${port}`);
});