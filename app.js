
let express = require("express");
let campsites = require("./campsites");
require('datejs');

let app = express();

// NORTH PINES, UPPER PINES, LOWER PINES
const YOSEMITE_CAMPSITE_IDS = "70927,70925,70928"



const START_DATE = '08/08/2016',
    END_DATE = '08/14/2016';

app.get("/campsites/search", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    let campsiteIDs = (req.params.campsiteIDs || YOSEMITE_CAMPSITE_IDS).split(","),
        startDate = new Date(req.params.startDate || Date.now()),
        endDate = (new Date()).addDays(28); // 4 weeks

    campsites.searchCampsites(campsiteIDs, startDate, endDate)
        .then((results) => res.json(results));
});

app.listen(process.env.PORT || 9001, () => {
    console.log("[server] listening on port 9001");
});
