const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
var cors = require('cors')
const redis = require('redis')
let RedisStore = require('connect-redis')(session)

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_IP,
  MONGO_PORT,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require('./config/config')

let redisClient = redis.createClient({
  legacyMode: true,
  socket: { host: REDIS_URL, port: REDIS_PORT },
})
redisClient.connect().catch(console.error)

const app = express()

const postRouter = require('./routes/postRoutes')
const userRouter = require('./routes/userRoutes')

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

const connectWithRetry = () => {
  mongoose
    .connect(mongoURL)
    .then(() => console.log('successfully connected to DB'))
    .catch((e) => {
      console.log(e)
      setTimeout(connectWithRetry, 5000) // To check if instance was up
    })
}

connectWithRetry()

app.use(express.json())

app.enable('trust proxy')
app.use(cors())
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    cookie: {
      secure: false,
      resave: false,
      saveUninitialized: false,
      httpOnly: true,
      maxAge: 30000,
    },
  })
)

app.get('/api/v1', (req, res) => {
  res.send('<h2>Hi There siddharth!!</h2>')
  console.log('request received here')
})

app.use('/api/v1/posts', postRouter)
app.use('/api/v1/users', userRouter)

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`listening on port ${port}`))
