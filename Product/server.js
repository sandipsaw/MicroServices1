require('dotenv').config()
const app = require('./Src/app');
const connectToDb = require('./Src/db/db')

connectToDb();


app.listen(3001,()=>{
    console.log("server is running on port 3001");
})