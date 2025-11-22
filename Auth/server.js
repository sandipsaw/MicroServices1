require('dotenv').config()
const app = require('./Src/app');
const connectToDb = require('./Src/db/db');

connectToDb();

app.listen(3000,()=>{
    console.log("server is running on port 3000"); 
})