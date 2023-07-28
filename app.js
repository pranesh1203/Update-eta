const express = require('express');
const app = express();
var admin = require("firebase-admin");
    var serviceAccount = require("./assets/auth.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "hthttps://bustracker-6b2a1-default-rtdb.firebaseio.com/"
    });
var db = admin.database();
const drv = db.ref('Driver');
const rte = db.ref('Route');
app.get('/:route', (req, res) =>{
    var route=req.params.route
    const usersRef = drv.child(route);
    usersRef.child('loc').on('value', (snapshot) => {
        const data = snapshot.val();
        const rt=rte.child(route);
        rt.once('value',(sna)=>{
                    js=sna.val();        
            for(let i=0;i<js.length;i++){
                if(js[i].flag!=0) 
                {   
                    const axios = require('axios');
                    let st=i.toString()
                    const url="https://atlas.microsoft.com/route/directions/json?api-version=1.0&query="+`${data}:${js[i].coord}`+"&routeRepresentation=summaryOnly&computeBestOrder=True&subscription-key=t_LS0FDVG3elKMe7nIoVQOLM_Y-zMmnbcG_tAVGeoQA"
                    axios.get(url)
                        .then(response=>{
                            const dt=response.data;
                            const t=dt.routes[0].summary.travelTimeInSeconds;
                            console.log(t);
                            const rt=rte.child(route+"/"+st);
                            rt.child('eta').set(t.toString());
                            if(t<60){
                                rt.child('flag').set(0);
                                rt.child('eta').set('passed by');
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }  
            };
        })
    });
res.send(200)
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server listening on port ${port}');
  });

