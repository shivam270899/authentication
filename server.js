const express = require('express');
const app = express();
const bunyan = require('bunyan');
const mongoose = require('mongoose');
const bunyanMiddleware = require('bunyan-middleware')
const userRoute = require('./routes/user');
const Promise = require('promise');
const productRoute = require('./routes/product');
const orderRoute = require('./routes/order');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');


const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "Project API",
      description: "Project API Information",
      contact: {
        name: "Developer"
      },
      servers: ["http://localhost:3000"]
    }
  },
  apis: ["./routes/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));



app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


mongoose.connect("mongodb://127.0.0.1:27017/myApp", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
})


var db = mongoose.connection;

var log = bunyan.createLogger({
    src: true,
    name: 'myApp',
    serializers: bunyan.stdSerializers,
    stream: process.stdout,
    level: 'info',
});


db.on('connected', () => console.log("mongodb connection success"));
db.on('error', () => console.log("mongodb connection fail"));


/*
log.info({
    data: {
        name: 'parth',
        level: 35
    },
    requestId: '268c3da8-a068-4c85-9a94-a845f8199f5f'
}, 'log info');
log.warn({
    lang: 'en'
}, 'bunyan logger');




let myFirstPromise = new Promise((resolve, reject) => {
    resolve("first promise")
  }).then((successMessage) => {
    console.log("Yay! " + successMessage)
  }).catch(err => {
    console.log(err);
  })
  let done = true

const isItDoneYet = new Promise((resolve, reject) => {
  if (done) {
    const workDone = 'Here is the thing I built'
    resolve(workDone)
  } else {
    const why = 'Still working on something else'
    reject(why)
  }
})
console.log(isItDoneYet);


function someMiddleware(req, res, next) {
    req.log = log.child({
        req_id: 'some-random-request-unique-identifier'
    });
    next();
}
*/
app.use('/api', userRoute);
app.use('/api/product', productRoute);
app.use('/api/order', orderRoute);

app.get('/', (req, res) => {
    res.send('server connected');
})


const port = process.env.PORT || 3000;


app.listen(port, () => {
    console.log(`serve at http://localhost:${port}`);
});