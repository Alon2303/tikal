var express = require('express');
const  app = express();
const mongo = require('./mongo')
const googleApiKey = 'AIzaSyDbQgWVtGGghMx1wFsIVDu3Tnhl1R2cAnI';
const utils = require("/utils");

const MAX_CACHE_AGE_SECONDS = process.env.MISSIONS_MAX_CACHE_AGE || 0; // IN SECONDS. SET THE MISSONS MAX CACHE AGE, IF MISSIONS DATA CACHE IS OLDER THAN THAT, REFRESH
global.missionsData = {data: false, last_updated: false};
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({type:'*/*'});

async function getGeoCode(address) {
  var https = require('https');

  return new Promise((resolve, reject) => {
      https.get("https://maps.googleapis.com/maps/api/geocode/json?address="+address+"&key="+googleApiKey, (res) => {
          var { statusCode } = res;
          var contentType = res.headers['content-type'];

          let error;

          if (statusCode !== 200) {
              error = new Error('Request Failed.\n' +
                  `Status Code: ${statusCode}`);
          } else if (!/^application\/json/.test(contentType)) {
              error = new Error('Invalid content-type.\n' +
                  `Expected application/json but received ${contentType}`);
          }

          if (error) {
              console.error(error.message);
              // consume response data to free up memory
              res.resume();
          }

          res.setEncoding('utf8');
          let rawData = '';

          res.on('data', (chunk) => {
              rawData += chunk;
          });

          res.on('end', () => {
              try {
                  const parsedData = JSON.parse(rawData);
                  resolve(parsedData.results[0].geometry.location);
              } catch (e) {
                  reject(e.message);
              }
          });
      }).on('error', (e) => {
          reject(`Got error: ${e.message}`);
      });

  });
}

function getDistance(geoCodes) {
  const lat1=geoCodes[0].lat;
  const lat2=geoCodes[1].lat;
  const lon1=geoCodes[0].lng;
  const lon2=geoCodes[1].lng;

  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = R * c; // in metres
  return d;

}
const refreshMissionsData = async function() {
  if (!global.missionsData.data ||
    ( ((new Date().getTime()/1000) - MAX_CACHE_AGE_SECONDS) >  global.missionsData.last_updated )) {
      console.log('cache too old, refreshing')
      global.missionsData = {data:await mongo.get(), last_updated: new Date().getTime()/1000};
      global.missionsData.forEach((mission)=> { // enriching each mission with its geocode so we can easily check distances later withotu calling google's api repeatedly
        global.missionsData.geoCode = getGeoCode.then(res=>{mission.geoCode=res})
      })
    
  }
  return global.missionsData;
}

// refreshMissionsData().then(console.log());
const calcCountryIsolationDegree = async function(missions) {
  let countriesAgentsStatus = {}
  let agentsMissionCount = {};
  missions.forEach((mission) =>{
    try {
      
      agentsMissionCount[mission.agent] = ( agentsMissionCount[mission.agent] || 0)+1;
      if (!(mission.country in countriesAgentsStatus)) {
        countriesAgentsStatus[mission.country] = {};
      }
      if (!(mission.agent) in countiesAgents[mission.country]) {
        countriesAgentsStatus[mission.country][mission.agent] = 'unknown';
      } 
      
    } catch(e) {
      utils.reprotEvent({level: 'error' ,message:'invalid mission record',record: mission})
    }
  })
  Object.keys(countriesAgentsStatus).forEach(country=>{
    countriesAgentsStatus[country].agents.forEach((agent) => {
      countriesAgentsStatus[country][agent] = agentsMissionCount == 1 ? 'isolated' : 'non-isolated'  
    }
    )
  })

}
app.post('/find-closest',jsonParser,  async function(req,res) {
  refreshMissionsData(); // checks if cache is relevant, if not - fetch from mongo
  const requestQuery = JSON.parse( req.body); // exects coordinates as {lat: .. ,lng:..}, or a string of the address
  var queryGeoCode = requestQuery.targetLocation;
  if (typeof queryGeoCode != 'object' ) {  // is address, not geocode, let's get coordinates
    queryGeoCode = await getGeoCode(requestQuery.targetLocation);
  }
  
  var missionsSortedByDistance = global.missionsData.map((mision ) => {
      return {...mission, 
              distance: getDistance(mission.geoCode, queryGeoCode)} 
  }).sort((a,b) => a.distane > b.distance);

  res.json({closest: missionsSortedByDistance[0], farthest: missionsSortedByDistance[1]});


} 
  );

app.get('/countries-by-isolation', async function(req,res) {
  await refreshMissionsData(); // checks if cache is relevant, if not - fetch from mongo
console.log(global.missionsData);
  res.json(calcCountryIsolationDegree(global.missionsData))
})

app.get('/countries-by-isolation',jsonParser, function(req,res) {


});


app.listen(8080);
