const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    orderItems: [{
        name: {type: String, required: true},
        qty: {type: Number, required: true},
        price: {type: Number, required: true},
        productId : {type: mongoose.Schema.Types.ObjectId, ref: 'Product'}
    }],
    userId: {type: mongoose.Schema.Types.ObjectId,  ref:'User'},
    shippingAddress: {
        fullName: {type: String, required: true},
        address: {type: String, required: true},
        city: {type: String, required: true},
        postalCode: {type: String, required: true},
        country: {type: String, required: true},
    },
    itemsPrice: {type: Number, required: true},
    shippingPrice: {type: Number, required: true},
    taxPrice: {type: Number, required: true},
    totalPrice: {type: Number, required: true},
    parent: {type: String, required: true},
    category: {type: String, required: true},
},
{
    timestamps: true,
}
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;