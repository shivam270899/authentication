const express = require('express');
const userRoute = express.Router();
const User = require('../models/user')
const joi = require("joi");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bunyan = require('bunyan');
const promise = require('promise');

var log = bunyan.createLogger({
    src: true,
    name: 'userRoute',
    serializers: bunyan.stdSerializers,
    streams: [{
            stream: process.stdout,
            level: 'info'
        },
        {
            path: 'hello.log',
            level: 'trace'
        }
    ],
});

const generateToken = (user) => {
    return jwt.sign({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isSeller: user.isSeller,
        },
        process.env.JWT_SECRET || 'xyz', {
            expiresIn: '30d'
        }
    )
};

const isAuth = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (authorization) {
        const token = authorization.slice(7, authorization.length);
        jwt.verify(token, process.env.JWT_SECRET || 'xyz', (err, decode) => {
            if (err) {
                res.status(401).send({
                    message: 'Token is Invalid'
                })
            } else {
                req.user = decode;
                next();
            }
        })
    } else {
        res.status(401).send({
            message: 'No Token'
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.send({
            message: 'Invaild Admin Token'
        })
    }
}



userRoute.post('/register', async (req, res) => {

    const validation = joi.object({
        name: joi.string().alphanum().min(3).max(25).trim(true).required().label('name not valid'),
        email: joi.string().email().trim(true).required().label('email not valid'),
        password: joi.string().min(8).trim(true).required().label('pass not valid'),
        country: joi.string().alphanum().min(3).max(25).trim(true).required().label('country not valid'),
        age: joi.number().min(1).required().label('age not valid'),
    });

    const {
        error
    } = validation.validate(req.body);
    if (error) {
        return res.status(406).send(error)
    } else {
        const user = await new User({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
            country: req.body.country,
            age: req.body.age
        })
        const createdUser = await user.save();
        log.info(user, 'User registered')
        res.send(createdUser);
    }
})

userRoute.get('/details', async (req, res) => {
    const details = await User.aggregate([{
        $match: {
            'country': 'india',
            'age' : {$gte : 10}
        }
    }])
    console.log(details);
    if (details) {
        res.send({
            message: 'users',
            details
        })
    }else{
        res.send({message:'user not found'})
    }
})

userRoute.post('/login', async (req, res) => {

    const user = await User.findOne({
        email: req.body.email
    })
    if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
            res.send({
                message: 'user login successful',
                user,
                token: generateToken(user)
            });
            log.info(user, 'logged in')
            return;
        } else {
            return log.error(res.json({
                message: 'wrong password'
            }));
        }
    } else {
        return res.status(404).send({
            message: 'email not exist'
        })
    }

})


userRoute.get('/:id', (req, res) => {
    const userId = req.params.id;
    User.findById(userId)
        .exec()
        .then((userInfo) => {
            res.send(userInfo);
        })
        .catch((err) => {
            return res.status(401).json({
                message: 'user not found',
                err
            })
        })
})



userRoute.get('/users', async(req,res) => {
    const users = await User.find({});
    if(users){
        res.send(users);
    }else{
        res.send({message: 'user not found'})
    }
})

userRoute.post('/profile', isAuth, async (req, res) => {
    const userProfile = await User.findOne({
        email: req.body.email
    });
    if (userProfile) {
        res.send(userProfile);
    } else {
        return res.send('invaild email')
    }
})

userRoute.post('/delete/:id', isAuth, async (req, res) => {
    const deleteUser = await User.findById(req.params.id);

    if (deleteUser) {
        await deleteUser.remove();
        res.send('user deleted successful')
    } else {
        res.send('user not exist');
    }
})


userRoute.put('/update/:id', isAuth, async (req, res) => {
    const updateUser = await User.findById(req.params.id)
    if (updateUser) {
        updateUser.name = req.body.name || updateUser.name,
            updateUser.email = req.body.email || updateUser.email,
            updateUser.password = req.body.password || updateUser.password,
            updateUser.country = req.body.country || updateUser.country,
            updateUser.age = req.body.age || updateUser.age

        updateUser.save();
        res.send({
            message: 'user update successful',
            updateUser
        })
    } else {
        res.send({
            message: 'user not exist'
        })
    }

})



module.exports = userRoute;