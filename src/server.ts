import bodyParser from 'body-parser';
import express from 'express';
import {sequelize} from './sequelize';
import cors from 'cors'

import {IndexRouter} from './controllers/v0/index.router';
import {V0_FEED_MODELS} from './controllers/v0/model.index';


(async () => {
  await sequelize.addModels(V0_FEED_MODELS);

  console.debug("Initialize database connection...");
  await sequelize.sync();

  const app = express();
  const port = process.env.PORT || 8080;

  app.use(bodyParser.json());

  app.use(cors({
    allowedHeaders: [
      'Origin', 'X-Requested-With',
      'Content-Type', 'Accept',
      'X-Access-Token', 'Authorization',
    ],
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    preflightContinue: true,
    origin: /a8b71771ad55c4a1a8aba8f8358ba382-87591036.us-east-2.elb.amazonaws.com$/
  }));

  app.use('/api/v0/', IndexRouter);

  // Root URI call
  app.get( '/', async ( req, res ) => {
    res.send( 'Nothing here.' );
  } );

  // Health
  app.get('/health', (req, res) => {
    res.status(200).send({message: "App is healthy."})
  })


  // Start the Server
  app.listen( port, () => {
    console.log( `server running on port ${port}` );
    console.log( `press CTRL+C to stop server` );
  } );
})();
