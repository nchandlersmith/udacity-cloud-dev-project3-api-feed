import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import {sequelize} from './sequelize';

import {IndexRouter} from './controllers/v0/index.router';
import {V0_FEED_MODELS} from './controllers/v0/model.index';


(async () => {
  await sequelize.addModels(V0_FEED_MODELS);

  console.debug("Initialize database connection...");
  await sequelize.sync();

  const app = express();
  const port = process.env.PORT || 8080;

  app.use(bodyParser.json());

  // We set the CORS origin to * so that we don't need to
  // worry about the complexities of CORS this lesson. It's
  // something that will be covered in the next course.
  app.use(cors());

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
