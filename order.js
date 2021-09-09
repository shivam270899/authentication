const express = require('express');
const {
    isAuth,
    isAdmin
} = require('../middleware');
const orderRoute = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');


orderRoute.post('/create', isAuth, async (req, res) => {
    try {
        const order = await new Order({
            userId: req.user._id,
            orderItems: req.body.orderItems,
            shippingAddress: req.body.shippingAddress,
            itemsPrice: req.body.itemsPrice,
            shippingPrice: req.body.shippingPrice,
            taxPrice: req.body.taxPrice,
            totalPrice: req.body.totalPrice,
            parent: req.body.parent,
            category: req.body.category
        })
        const createdOrder = await order.save();
        res.send({
            message: 'Order Successful',
            createdOrder
        })
    } catch (err) {
        console.log(err)
    }
})

orderRoute.post('/orders', isAuth, async (req, res) => {
    const orders = await Order.find({
        userId: req.body.userId
    })
    if (orders) {
        res.send({
            message: 'User Orders',
            orders
        })
    } else {
        res.send({
            message: 'Order not found'
        })
    }
})


orderRoute.post('/summary', isAuth, isAdmin, async (req, res) => {
    const orders = await Order.aggregate([{
        $group: {
            _id: null,
            numOrders: {
                $sum: 1
            },
            totalSales: {
                $sum: '$totalPrice'
            }
        },
    }]);
    const users = await User.aggregate([{
        $group: {
            _id: null,
            numUsers: {
                $sum: 1
            },
        },
    }]);
    const productCategories = await Product.aggregate([{
        $group: {
            _id: '$category',
            count: {
                $sum: 1
            },
        },
    }]);
    res.send({
        orders,
        users,
        productCategories
    })
})

orderRoute.get('/orderitems', async(req, res) => {
    const order = await Order.aggregate([
        {
            $project: {
                
                orderItems: { $objectToArray: "$shippingAddress"}
            }
        }
    ])
    if(order){
        res.send(order)
    }else{
        res.send({message: 'order not found'})
    }
})



orderRoute.get('/ordersbyproduct', async (req, res) => {
    const order = await Order.aggregate([{
            $unwind: {
                path: "$orderItems"
            }
        },
        {
            $sort: {"totalPrice": -1} 
        },
        {
            $lookup: {
                from: "products",
                localField: "parent",
                foreignField: "category",
                pipeline: [{
                        $match: {
                            category: "shoes"
                        },
                    },
                    {
                        $group: {
                            _id: "$category",
                        }
                    }
                ],
                as: "ordersbycategory"
            }
        },
        
    ])
    if (order) {
        res.send(order);
    } else {
        res.send({
            message: 'order not found'
        })
    }
})

orderRoute.delete('/delete/:id', isAuth, isAdmin, async (req, res) => {
    const order = await Order.findById(req.params.id)
    if (order) {
        await order.remove();
        res.send({
            message: 'Order Deleted SUccessful'
        })
    } else {
        res.send({
            message: 'Order Not Found'
        })
    }
})


orderRoute.get('/lookup', async (req, res) => {
    /*
        const order = await Order.aggregate([{
            $unwind: {
                path: '$orderItems'
            },
            $lookup: {
                from: 'products',
                localFields: 'orderItems.name',
                foreignFields: 'name',
                as: 'properties'
            },
            $unwind: {
                path: '$orderItems.products'
            },
            $group: {
                _id: {
                    name: '$name',
                    description: '$description',
                    category: '$category'
                }
            },
            _id: '$_id',
            orderItems: {
                $push: '$orderItems'
            },
            $lookup : {
                from: 'products',
                localFields: '_id',
                foreignFields: '_id',
                as: 'orderDetails'
            },
            
        }])
    */
    const order = await Order.aggregate([{
            '$project': {
                _id: {
                    '$toString': "$_id"
                }
            }
        },
        {
            '$lookup': {
                from: "products",
                localField: "_id",
                foreignField: "sellerId",
                as: "properties"
            }
        }
    ])
    /*
        const order = await Order.aggregate([{
            "$lookup": {
                from: 'products',
                let: {

                    order_item: 'name',
                    order_qty: 'qty'
                },
                pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                        $eq: ["$name", "$$order_item"]
                                    },
                                    {},
                                    {
                                        $gte: ["$countInStock", "$$order_qty"]
                                    }
                                ]
                            }
                        }
                    },

                ],
                as: "stockdata"
            }
        }])
    */
    if (order) {
        res.send(order);
    } else {
        res.send({
            message: 'order not found'
        })
    }
})


module.exports = orderRoute;