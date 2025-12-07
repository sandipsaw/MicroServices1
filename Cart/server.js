require('dotenv').config()
const app = require('./src/app')
const connectToDb = require('./src/db/db');

connectToDb();

app.listen(3002,()=>{
    console.log("server in running on port 3002");
})