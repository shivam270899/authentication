const express = require('express');
const userRoute = express.Router();
const User = require('../models/user')
const joi = require("joi");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cryptoJs = require('crypto-js');


const encryptData = (user) => {
    const newToken = crypto.randomBytes(32).toString('hex');
    const cipherText = cryptoJs.AES.encrypt(JSON.stringify(user), newToken).toString();
    return {
        encryptedData: cipherText,
        newToken
    }
}
/*
const decryptData = (token) => {
    var bytes = cryptoJs.AES.decrypt(token.encryptedData, token.newToken);
    var decryptedData = JSON.parse(bytes.toString(cryptoJs.enc.Utf8));
    return {
        decryptedData
    }
}
*/

const verifyToken = [];
const isVerify = (req, res, next) => {
    const secret = req.body.secret;
    if (!secret || !verifyToken.includes(secret)) {
        res.send({
            message: 'No Token'
        })
    } else {
        var bytes = cryptoJs.AES.decrypt(verifyToken[1], verifyToken[0]);
        var decryptedData = JSON.parse(bytes.toString(cryptoJs.enc.Utf8));
        req.user = decryptedData;
        console.log(req.user);
        next();
    }
}


const refreshTokens = [];


const generateToken = (user) => {
    return jwt.sign({
            name: user.name,
            email: user.email,
        },
        process.env.JWT_SECRET || 'xyz', {
            expiresIn: 300
        })
}

const generateNewToken = (user) => {
    return jwt.sign({
            name: user.name,
            email: user.email
        },
        process.env.JWT_SECRET || 'abc', {
            expiresIn: '1d'
        })
}

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
/*
userRoute.post('/token', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    console.log(refreshTokens);
    console.log(refreshTokens.includes(refreshToken));
    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.json({
            message: "Refresh token not found, login again"
        });
    } else {
        jwt.verify(refreshToken, process.env.JWT_SECRET || 'abc', (err, result) => {
            if (!err) {
                const accessToken = jwt.sign({
                    name: result.name,
                    email: result.email
                }, process.env.JWT_SECRET || 'xyz', {
                    expiresIn: 300
                });
                return res.json({
                    accessToken
                });
            } else {
                return res.json({
                    success: false,
                    message: "Invalid refresh token"
                });
            }
        });
    }
});
*/
userRoute.post('/register', async (req, res) => {
    const validation = joi.object({
        name: joi.string().alphanum().min(2).max(25).trim(true).required().label('name not valid'),
        email: joi.string().email().trim(true).required().label('email not valid'),
        password: joi.string().min(6).trim(true).required().label('pass not valid'),
    });
    const {
        error
    } = validation.validate(req.body);

    if (error) {
        res.send(error);
    } else {
        const user = await User.findOne({
            email: req.body.email
        })
        if (user) {
            return res.send({
                message: 'Email already exist'
            })
        } else {
            const user = await new User({
                name: req.body.name,
                email: req.body.email,
                password: bcrypt.hashSync(req.body.password, 8)
            })
            const createdUser = await user.save();
            res.send({
                message: 'User register successfully',
                createdUser
            })
        }
    }
})
/*
//jwt authentication
userRoute.post('/login', async (req, res) => {
    const validation = joi.object({
        email: joi.string().email().trim(true).required().label('email not valid'),
        password: joi.string().min(6).trim(true).required().label('password not valid'),
    });
    const {
        error
    } = validation.validate(req.body);
    if (error) {
        res.send(error)
    } else {
        const user = await User.findOne({
            email: req.body.email
        });
        if (user) {
            if (bcrypt.compareSync(req.body.password, user.password)) {
                const response = {
                    message: 'Login successful',
                    user,
                    token: generateToken(user),
                    refreshToken: generateNewToken(user),
                }
                res.cookie("token", response, { expire : new Date() + 9999});
                refreshTokens.push(response.refreshToken);
                res.send(response);
            } else {
                return res.send({
                    message: 'Invaild password'
                })
            }
        } else {
            return res.send({
                message: 'Invaild email'
            })
        }
    }
})
*/
userRoute.get('/logout', async (req, res) => {
    res.clearCookie("token");
    res.json({
        message: "logout success"
    });
})


//without jwt
userRoute.post('/login', async (req, res) => {
    const validation = joi.object({
        email: joi.string().email().trim(true).required().label('email not valid'),
        password: joi.string().min(6).trim(true).required().label('pass not valid'),
    });
    const {
        error
    } = validation.validate(req.body);
    if (error) {
        res.send(error)
    } else {
        const user = await User.findOne({
            email: req.body.email
        });
        if (user) {
            if (bcrypt.compareSync(req.body.password, user.password)) {
                const response = {
                    message: 'Login successful',
                    user,
                    token: encryptData(user),
                }
                verifyToken.push(response.token.newToken, response.token.encryptedData)
                //console.log(response.token)
                //console.log(decryptData(response.token));
                res.send(response);
            } else {
                return res.send({
                    message: 'Invaild password'
                })
            }
        } else {
            return res.send({
                message: 'Invaild email'
            })
        }
    }
})


userRoute.post('/profile/:id', isVerify, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        res.send(user);
    } else {
        res.send({
            message: 'User not exist'
        })
    }
});

module.exports = userRoute;
