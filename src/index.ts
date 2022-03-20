import express from 'express';
import mongoose from 'mongoose';
import * as jwt from 'jsonwebtoken';
import {AccountModel} from "./AccountModel";
require('dotenv').config()
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';


mongoose.connect(process.env.MONGO);

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;

app.get('/', (req, res) => {
  res.send('OctaWallTimer!');
});

app.post('/register', async (req, res) => {
  const name = req.body.name;
  if(!name || !req.body.password){
    return res.send({
      success: false,
      error: "Brak loginu lub hasła"
    })
  }
  const user = await AccountModel.find({name});
  if(user.length > 0){
    return res.send({
      success: false,
      error: "Użytkownik już istnieje"
    })
  }
  const password = bcrypt.hashSync(req.body.password, 10);
  const model = new AccountModel({
    name, password
  })
  await model.save();
  const accessToken = jwt.sign({ user: name }, process.env.JWT_KEY, {
    expiresIn: '1d',
  });
  const refreshToken = jwt.sign({ user: name }, process.env.JWT_KEY, {
    expiresIn: '31d',
  });
  res.send({
    success: true,
    accessToken,
    refreshToken
  })
})

app.post('/login', async (req, res) => {
  const name = req.body.name;
  if(!name || !req.body.password){
    return res.send({
      success: false,
      error: "Brak loginu lub hasła"
    })
  }
  const user = await AccountModel.find({name});
  if(user.length <= 0 || !bcrypt.compareSync(req.body.password, user[0].password)){
    return res.send({
      success: false,
      error: "Niepoprawny login lub hasło"
    })
  }
  const accessToken = jwt.sign({ user: user[0].name }, process.env.JWT_KEY, {
    expiresIn: '1d',
  });
  const refreshToken = jwt.sign({ user: user[0].name }, process.env.JWT_KEY, {
    expiresIn: '31d',
  });
  res.send({
    success: true,
    accessToken,
    refreshToken
  })
})

app.post('/refresh', async (req, res) => {
  const token = req.body.token;
  if(!token){
    return res.send({
      success: false,
      error: "Brak tokenu"
    })
  }
  const data = jwt.decode(token) as {user: string} | null;
  if(!data){
    return res.send({
      success: false,
      error: "Niepoprawny token"
    })
  }
  const user = await AccountModel.find({name: data.user});
  if(user.length <= 0){
    return res.send({
      success: false,
      error: "Niepoprawny token"
    })
  }
  const accessToken = jwt.sign({ user: user[0].name }, process.env.JWT_KEY, {
    expiresIn: '1d',
  });
  const refreshToken = jwt.sign({ user: user[0].name }, process.env.JWT_KEY, {
    expiresIn: '31d',
  });
  res.send({
    success: true,
    accessToken,
    refreshToken
  })
})

app.post('/me', async (req, res) => {
  const token = req.body.token;
  if(!token){
    return res.send({
      success: false,
      error: "Brak tokenu"
    })
  }
  const data = jwt.decode(token) as {user: string} | null;
  if(!data){
    return res.send({
      success: false,
      error: "Niepoprawny token"
    })
  }
  const user = await AccountModel.find({name: data.user});
  if(user.length <= 0){
    return res.send({
      success: false,
      error: "Niepoprawny token"
    })
  }
  delete user[0].password;
  res.send({
    success: true,
    user: user[0],
  })
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
