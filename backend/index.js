const express = require('express');
const cors = require('cors');
const socketModule = require('./socket/sockets');
// const mongoConnection = require('./MongoConnetion')


app  = express();

const PORT = 3001 || process.env.PORT;



// mongoConnection();
app.use(cors());    
app.use(express.json());




app.get("/",(req,res)=>{
    res.status(200).send("Working fine");
})


 const  server =  app.listen(PORT,function(){
    console.log("Listening on port " +PORT);
})


socketModule(server);



