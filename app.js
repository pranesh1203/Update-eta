const express = require('express');
const app = express();
const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = require('./assets/auth.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://bustracker-6b2a1-default-rtdb.firebaseio.com/',
});
const db = admin.database();
const drv = db.ref('Driver');
const rte = db.ref('Route');

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });

app.get('/:route', (req, res, next) => {
  const route = req.params.route;
  const usersRef = drv.child(route);
  usersRef.child('loc').on('value', (snapshot) => {
    const data = snapshot.val();
    const rt = rte.child(route);
    rt.once('value', (sna) => {
      const js = sna.val();
      for (let i = 0; i < js.length; i++) {
        if (js[i].flag != 0) {
          const st = i.toString();
          const url =
            'https://atlas.microsoft.com/route/directions/json?api-version=1.0&query=' +
            `${data}:${js[i].coord}` +
            '&routeRepresentation=summaryOnly&computeBestOrder=True&subscription-key=t_LS0FDVG3elKMe7nIoVQOLM_Y-zMmnbcG_tAVGeoQA';

          axios
            .get(url)
            .then((response) => {
              const dt = response.data;
              const t = dt.routes[0].summary.travelTimeInSeconds;
              console.log(t);
              const rt = rte.child(route + '/' + st);
              rt.child('eta').set(t.toString());
              console.log('yes')
              if (t < 60) {
                rt.child('flag').set(0);
                rt.child('eta').set('passed by');
              }
            })
            .catch((error) => {
              console.error(error);
              next(error);
            });
        }
      }
    });
  });
  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
