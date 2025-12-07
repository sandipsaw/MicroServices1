const mongoose = require('mongoose');

const connectToDb = async() =>{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        .then(()=>{
        console.log("database is connected to server");
    })
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectToDb