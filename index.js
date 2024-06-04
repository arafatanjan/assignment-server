require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
    },
    "secret",
    { expiresIn: "7d" }
  );
  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");
  if (!verify?.email) {
    return res.send("You are not authorized");
  }
  req.user = verify.email;
  next();
}
const uri = process.env.DATABASE_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    await client.connect();
    const productDB = client.db("productDB");
    const ballcollection = productDB.collection("ballcollection");
    const userDB = client.db("userDB");
    const userCollection = userDB.collection("userCollection");

    app.post('/balls', verifyToken, async (req, res) => {
        const balls=  req.body;
        const result = await ballcollection.insertOne(balls);
        res.send(result);
  });

  app.get('/balls', async (req, res) => {
    const balls=  ballcollection.find();
    const result = await balls.toArray();
    res.send(result);
  });

  app.get('/balls/:id', async (req, res) => {
    const id= req.params.id
     const ballData = await ballcollection.findOne({ _id: new ObjectId(id)});
     res.send(ballData);
  });
  app.patch('/balls/:id',verifyToken, async (req, res) => {
    const id= req.params.id
    const updatedData= req.body;
     const result = await ballcollection.updateOne(
        { _id: new ObjectId(id)},
        {$set: updatedData}
    );
     res.send( result);
  });
  app.delete('/balls/:id', verifyToken, async (req, res) => {
    const id= req.params.id
    // const updatedData= req.body;
     const result = await ballcollection.deleteOne(
        { _id: new ObjectId(id)}
    );
     res.send( result);
  });

  //users
  app.post("/user",verifyToken, async (req, res) => {
    const user = req.body;

    const token = createToken(user);
    const isUserExist = await userCollection.findOne({ email: user?.email });
    if (isUserExist?._id) {
      return res.send({
        statu: "success",
        message: "Login success",
        token,
      });
    }
    await userCollection.insertOne(user);
    return res.send({ token });
  });

  

  app.get("/user/get/:id", async (req, res) => {
    const id = req.params.id;
    //console.log(req);
    const result = await userCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
  });

  
  app.get("/user/:email", async (req, res) => {
    const email = req.params.email;
    const result = await userCollection.findOne({ email });
    res.send(result);
  });

  app.patch("/user/:email", async (req, res) => {
    const email = req.params.email;
    const userData = req.body;
    const result = await userCollection.updateOne(
      { email },
      { $set: userData },
      { upsert: true }
    );
    res.send(result);
  });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    //await client.close();
  }
}
run().catch(console.log);



// app.get('/users', (req, res) => {
//   res.send('Hello users!')
// })

 app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
 })

//arafatanjan
//W9jFFKWsQ0yGc2Dj