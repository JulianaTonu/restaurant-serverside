const express = require("express")
const app = express();
const cors = require("cors")
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe =require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())

//jwt
const verifyJWT =(req, res, next)=>{
  const authorization =req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message:'unauthorized access'});
  }
  const token=authorization.split('')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=>{
    if(err){
      return res.status(401).send({error:true, message:'unauthorized access'})
    }
    req.decoded =decoded;
    next();
  })
}

console.log('user', process.env.DB_USER)
console.log('password', process.env.DB_PASSWORD)


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qdgqirr.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("restaurentDb").collection("users")
    const menuCollection = client.db("restaurentDb").collection("menu")
    const reviewCollection = client.db("restaurentDb").collection("review")
    const cartCollection = client.db("restaurentDb").collection("carts")

app.post('/jwt',(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
  res.send(token)
})

//warning:use verifyJWT before using verifyAdmin
const verifyAdmin = async(req, res, next)=>{
  const email = req.decoded.email;
  const query ={email: email}
  const user =await userCollection.findOne(query);
  if(user?.role !== 'admin'){
    return res.status(403).send({error:true, message:'forbiddenn message'})
  }
  next();
}


    //user
    app.get('/users',verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log('user', user);
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query)
      console.log('existingUser', existingUser)
      if (existingUser) {
        return res.send({ message: 'user Already Exists' })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

app.get('/users/admin/:email', async(req, res)=>{
  const email = req.params.email;
  const query ={ email:email}
  const user = await userCollection.findOne(query);
  const result ={admin: user?.role === 'admin'}
  res.send(result)
})

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log('id', id)
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })



    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    })


    //cart collection
    app.get('/carts', async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      
      // const decodedEmail =req.decoded.email;
      // if(email !==decodedEmail){
      //   return res.status(403).send({error:true, message:'forbidden access'})
      // }


      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/carts', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query)
      res.send(result);
    })
//menu 
app.get('/menu',async(req,res)=>{
  const result =await menuCollection.find().toArray();
  res.send(result);
})

app.post('/menu', async(req,res)=>{
  const newItem =req.body;
  const result = await menuCollection.insertOne(newItem)
  res.send(result)
})

app.delete('/menu/:id', async(req,res)=>{
  const id =req.params.id;
  const query ={_id: new ObjectId(id)}
  const result =await menuCollection.deleteOne(query);
  res.send(result);
})


//CREATE PAYMENT INTENT
app.post('create-payment-intent', async(req,res)=>{
  const{price}=req.body;
  const amount =price*100;
  const paymentIntent =await stripe.paymentIntents.create({
    amount:amount,
    currency:'usd',
    payment_method_types:['card']
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  })
  
})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('boss is sitting')
})

app.listen(port, () => {
  console.log(`boss TONU  is sitting here ${port}`)
})