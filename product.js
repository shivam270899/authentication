const express = require('express');
const {
    isAdmin,
    isAuth,
    isSeller,
    pagination
} = require('../middleware');
const productRoute = express.Router();
const Product = require('../models/product');
const joi = require("joi");
const Order = require('../models/order');
const mongoose = require('mongoose');




productRoute.post('/create', isAuth, isAdmin, isSeller, async (req, res) => {
    console.log(req.user);
    const product = await new Product({
        sellerId: req.user._id,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        price: req.body.price,
        countInStock: req.body.countInStock,
        reviews: req.body.reviews,
        sellerName: req.body.sellerName
    })
    const createdProduct = await product.save();
    res.send({
        message: 'Product Created Successful',
        createdProduct
    });
});

productRoute.get('/group', isAuth ,async (req, res) => {
    const start = req.query.start;
    const end = req.query.end;
    const product = await Product.aggregate([{
            $match: {
                "createdAt": {
                    $gte: new Date(start),
                    $lt: new Date(end)
                },
                "category": req.query.category || 'clothes'
            },
        },
        {
            $lookup: {
                from: 'orders',
                localField: 'category',
                foreignField: 'parent',
                as: 'properties'
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                },
                productDetails: {
                    $push: "$$ROOT"
                },
                totalAmount: {
                    $sum: "$price"
                },
                count: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                '_id': 1
            }
        }
    ]);
    if (product) {
        res.send(product);
    } else {
        res.send('product not found')
    }
})

productRoute.get('/lookup/:id', async (req, res) => {
    console.log(req.params.id);
    const product = await Product.aggregate([{
            $match: {
                sellerId: mongoose.Types.ObjectId(req.params.id)
            }
        },
        {
            $lookup: {
                from: 'orders',
                localField: 'sellerId',
                foreignField: 'userId',
                as: 'ordersByProduct'
            }
        },
        {
            $sort: {
                'createdAt': 1
            }
        }
    ]);
    if (product) {
        res.send(product);
    } else {
        res.send({
            message: 'product not found'
        })
    }
});



productRoute.get('/lookups/product', async (req, res) => {
    const product = await Product.aggregate([{
            $match: {
                name: req.query.name
            }
        },
        {
            $lookup: {
                from: 'orders',
                let: {
                    "name": "$name"
                },
                pipeline: [{
                    $match: {
                        $expr: {
                            $in: ['$$name', '$orderItems.name']
                        }
                    }
                }, ],
                as: 'ordersByName'
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                },
                productByOrders: {
                    $push: "$$ROOT"
                },
                productOrdersCount: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                'createdAt': 1
            }
        }
    ])
    if (product) {
        res.send(product);
    } else {
        res.send('product not exist')
    }
})

productRoute.get('/date', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const product = await Product.aggregate([{
            $project: {
                date: {
                    $dateToParts: {
                        date: "$createdAt"
                    }
                },
                date_iso: {
                    $dateToParts: {
                        date: "$createdAt",
                        iso8601: true
                    }
                },
                date_timeZone: {
                    $dateToParts: {
                        date: '$createdAt',
                        timezone: 'America/New_York'
                    }
                },
                dayOfWeek: {
                    $dayOfWeek: "$createdAt"
                },
            },
        }, {
            $skip: startIndex
        },
        {
            $limit: limit
        },
    ])
    
    if (product) {
        res.send(product);
    } else {
        res.send('product not found')
    }
})

productRoute.get('/facet', async (req, res) => {
    const product = await Product.aggregate([{
        $facet: {
            "reviews": [{
                    $unwind: "$reviews"
                },
                {
                    $sortByCount: "$reviews"
                }
            ],
            "categorizedByCategory": [{
                    $match: {
                        category: {
                            $exists: 1
                        }
                    }
                },
                {
                    $bucket: {
                        groupBy: "$category",
                        boundaries: ['clothes', 'shoes', 'watch'],
                        default: 1,
                        output: {
                            "count": {
                                $sum: 1
                            },
                            "name": {
                                $push: "$name"
                            },
                            "totalPrice": {
                                $sum: '$price'
                            }
                        }
                    }
                }
            ],
            
        }
    }])
    if (product) {
        res.send(product);
    } else {
        res.send('product not found')
    }
})

productRoute.get('/unwind', async (req, res) => {

    
    const product = await Product.aggregate([{
        $unwind: {
            path: "$sellerName",
            includeArrayIndex: "arrayIndex",
            preserveNullAndEmptyArrays: true
        }
    }, {
        $group: {
            _id: "$name",
        }
    }])

    if (product) {
        res.send(product);
    } else {
        res.send({
            message: 'product not found'
        })
    }
})

productRoute.get("/unwindarray", async (req, res) => {
    const product = await Product.aggregate([{
            $unwind: {
                path: "$reviews"
            }
        },
        {
            $group: {
                _id: "$reviews.rating"
            }
        }
    ])
    if (product) {
        res.send(product);
    } else {
        res.send({
            message: 'Product not found'
        })
    }
})

productRoute.get('/productbyorders', async (req, res) => {
    const category = req.query.category;
    const product = await Product.aggregate([{
            $match: {
                category: category
            }
        },
        {
            $lookup: {
                from: "orders",
                localField: "category",
                foreignField: "parent",
                as: "ordersbycategory",
            }
        },
        {
            $sort: {
                'createdAt': 1
            }
        }
    ])
    if (product) {
        res.send(product);
    } else {
        res.send({
            message: 'Product not found'
        })
    }
})

productRoute.post('/productinfo/:id', isAuth, isSeller ,isAdmin, async(req,res) => {
    const product = await Product.findById(req.params.id);
    if(product){
        res.send(product);
    }else{
        res.send('product not found')
    }
} )

productRoute.post('/seller', isAuth, isSeller, async (req, res) => {

    const sellerProduct = await Product.find({
        sellerId: req.body.sellerId
    }).sort({
        _id: -1
    })
    if (sellerProduct) {
        res.send({
            message: 'Seller Products',
            sellerProduct
        })
    } else {
        res.send({
            message: 'No Products'
        })
    }
})

productRoute.get('/categories', async (req, res) => {
    const category = await Product.find().distinct('category')
    if (category) {
        res.send(category)
    } else {
        res.send({
            message: 'No Category'
        })
    }
})

productRoute.get('/products', async (req, res) => {
    const getProducts = await Product.find({})
    try {
        if (getProducts) {
            res.send({
                message: 'Products',
                getProducts
            })
        } else {
            res.send({
                message: 'Product not found'
            })
        }
    } catch (err) {
        console.log(err);
    }
})

productRoute.get('/page', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const start = req.query.start;
    const end = req.query.end;
    const min = parseInt(req.query.min);
    const max = parseInt(req.query.max);
    const category = req.query.category || '';
    const categoryFilter = category ? {
        category: {
            $regex: category,
            $options: 'i'
        }
    } : {};
    //const productCount = await Product.countDocuments({...categoryFilter});
    //const product = await Product.find({...categoryFilter}).skip(startIndex).limit(limit);
    //const product = await Product.find({})
    const priceFilter = min && max ? {
        price: {
            "$gte": min,
            "$lte": max
        }
    } : {};
    const productCount = await Product.countDocuments({
        ...priceFilter
    });
    const product = await Product.find({
        price: {
            "$gte": min,
            "$lte": max
        }
    }).skip(startIndex).limit(limit);
    console.log(productCount);
    console.log(product);
    //const product = await Product.find({createdAt: new Date('2021-08-30')}).skip(startIndex).limit(limit);
    //const product = await Product.find({createdAt: {"$gte": start, "$lte": end}}).skip(startIndex).limit(limit);
    //console.log(product);
    const pagination = {};

    totalPages = Math.ceil(productCount / limit);
    if (endIndex < productCount) {
        pagination.next = {
            page: page + 1,
            limit,
            data: productCount - endIndex
        };
    }
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit,
            data: limit * (page - 1)
        };
    }
    const advancedResults = {
        success: true,
        productCount: productCount,
        pagination,
        totalPages,
        data: product
    }
    res.status(200).json(advancedResults);
})

productRoute.get('/pagination', async (req, res) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const category = req.query.category;
    const categoryFilter = category ? {
        category: {
            $regex: category,
            $options: 'i'
        }
    } : {};
    const productCount = await Product.countDocuments({
        ...categoryFilter
    })
    console.log(productCount);
    const product = await Product.aggregate([{
            $match: {
                'category': category
            }
        },
        {
            $skip: startIndex
        },
        {
            $limit: limit
        },
        {
            $sort: {
                'price': -1
            }
        }
    ])

    /*
    const min = parseInt(req.query.min);
    const max= parseInt(req.query.max);
    const priceFilter = min & max ? {price : {"$gte": min,"$lte":max}} : {};
    const productCount = await Product.countDocuments({...priceFilter});
    console.log(productCount);
    const product = await Product.aggregate([
        {
            $match : {
                'price': {"$gte":min, "$lte":max}
            }
        },
        {
            $sort: {
                'price': -1
            }
        },
        {
            $skip: startIndex
        },
        {
            $limit: limit
        }
    ])


    const start = req.query.start;
    const end = req.query.end;
    const dateFilter = start & end ? {createdAt : {"$gte":start, "$lte":end}}: {};
    const productCount = await Product.countDocuments({...dateFilter});
    const product = await Product.aggregate([
        {
            $match: {
                'createdAt': {"$gte":start, "$lte":end}
            }
        },
        {
            $sort: {
                'price': -1
            }
        },
        {
            $skip: startIndex
        },
        {
            $limit: limit
        }
    ])
    */

    const pagination = {};

    totalPages = Math.ceil(productCount / limit);
    if (endIndex < productCount) {
        pagination.next = {
            page: page + 1,
            limit,
            data: productCount - endIndex
        };
    }
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit,
            data: limit * (page - 1)
        };
    }
    const advancedResults = {
        success: true,
        productCount: productCount,
        pagination,
        totalPages,
        data: product
    }

    console.log(advancedResults);
    if (product) {
        res.send(advancedResults);
    } else {
        res.send({
            message: 'product not found'
        })
    }
})

productRoute.get('/lookup', async (req, res) => {
    /*
    const product = await Product.aggregate([{
        '$lookup':{
            from: 'orders',
            localField: 'category',
            foreignField: 'parent',
            as:'properties'
        }
    }])
    */
    const product = await Product.aggregate([{
        "$lookup": {
            from: 'orders',
            let: {
                product_name: 'name',
                product_qty: 'countInStock'
            },
            pipeline: [{
                    $match: {
                        $expr: {

                            $and: [{
                                    $eq: ["$name", "$product_name"]
                                },
                                {
                                    $gte: ["$qty", "$product_qty"]
                                }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        name: 0,
                        _id: 0
                    }
                }
            ],
            as: "stockdata"
        }
    }])
    /*
        const product = await Product.aggregate([{
                '$lookup': {
                    from: 'orders',
                    localField: 'category',
                    foreignField: 'category',
                    as: 'sameFields'
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [{
                            $arrayElemAt: ["$sameFields", 0]
                        }, "$$ROOT"]
                    }
                }
            },
            {
                $project: {
                    sameFields: 0
                }
            }
        ])
    */
    if (product) {
        res.send(product);
    } else {
        return res.send({
            message: 'Product not found'
        })
    }
})

productRoute.get('/addfields', async (req, res) => {
    const product = await Product.aggregate([{
        $addFields: {
            sellerName: "$seller"
        }
    }])
    if (product) {
        res.send(product);
    } else {
        res.send({
            message: 'product not found'
        })
    }
})


productRoute.put('/update/:id', isAuth, isSeller, async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (product) {
        product.name = req.body.name || product.name,
            product.description = req.body.description || product.description
        product.category = req.body.category || product.category
        product.price = req.body.price || product.price
        product.reviews = req.body.reviews || product.reviews

        const updatedProduct = await product.save();
        res.send({
            message: 'Product Updated Successful',
            updatedProduct
        })
    } else {
        res.send({
            message: 'Product Not Found'
        })
    }
})

productRoute.delete('/delete/:id', isSeller, async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
        await product.remove();
        res.send({
            message: 'Product Deleted Successful'
        })
    } else {
        res.send({
            message: 'Product Not FOund'
        })
    }
})

productRoute.post('/:id', isAuth, isSeller ,async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (product) {
        res.send(product)
    } else {
        res.send({
            message: 'Product not found'
        })
    }
})

productRoute.delete('/delete/reviews/:id', isAuth, isAdmin, async (req, res) => {
    const reviewId = req.params.id;
    const product = await Product.findById(reviewId);
    if (product) {
        await product.reviews.remove();
        res.send({
            message: 'review deleted successful'
        })
    } else {
        res.send({
            message: 'product review not found'
        })
    }
})

productRoute.post('/:id/reviews', isAuth, async (req, res) => {
    const product = await Product.findById(req.params.id);
    console.log(req.user);
    if (product) {
        if (product.reviews.find(x => x.name === req.user.name)) {
            return res.send({
                message: 'you already submitted review'
            })
        } else {
            const review = {
                name: req.user.name,
                rating: req.body.rating,
                comment: req.body.comment
            }
            product.reviews.push(review);
            product.save();
            res.send({
                message: 'review added successful',
                product
            })
        }
    } else {
        res.send({
            message: 'Product Not Found'
        })
    }
})

module.exports = productRoute;