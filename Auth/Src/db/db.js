const mongoose = require('mongoose');


const connectToDb = (uri) =>{
    const connectionUri = uri || process.env.MONGODB_URI;
    return mongoose.connect(connectionUri)
    .then(()=>{
        console.log("database is connected sucessfully");
    })
}

module.exports = connectToDb;