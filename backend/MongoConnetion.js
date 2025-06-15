const mongoose = require('mongoose');


function  mongoConnection(){
    mongoose.connect(process.env.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Connected to database ✔️')
        })
        .catch((err) => {
            console.error(`Error connecting to the database. \n${err}❌`);
        })
} 

module.exports = mongoConnection;