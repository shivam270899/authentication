const mongoose = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const productSchema =  mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sellerId: {type: mongoose.Schema.Types.ObjectId,  ref:'User'},
    description: {
        type: String,
        trim: true,
        required: true
    },
    category: {
        type: String,
        trim: true,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    countInStock:{
        type: Number,
        required: true
    },
    reviews: [{
        rating: {type: String},
        comment: {type: String}
    }],
},{timestamps: true} )

productSchema.plugin(mongoosePagination);

module.exports = mongoose.model('Product', productSchema);

/*
const exampleSchema = mongoose.Schema({
    pName : { type: String},
    members: [{fName: String, lName : String}]
})

const example = mongoose.model('example', exampleSchema);

const doc = new example({
    pName: 'XYZ',
    members : {fName: 'ABC', lName: 'PQR'}
})

doc.members[0].fName = 'jay';

doc.save();

const doc2 = new example({
    pName: 'jeet',
    members : {fName: 'jeet', lName: 'patel'}
})

doc2.save();

mongoose.set('debug', true) 
*/