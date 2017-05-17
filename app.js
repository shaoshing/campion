
let express = require("express");
let campsites = require("./campsites");
require('datejs');

let app = express();

// NORTH PINES, UPPER PINES, LOWER PINES
const YOSEMITE_CAMPSITE_IDS = "70927,70925,70928"

app.get("/", (req, res) => {
    res.send(`
Usage:

/search
    search Yosemite campsites between today and the next four weeks

/search?start=05/20/2017&days=2
    search Yosemite campsites between the specified date and the next 2 days

/search?campsiteIDs=1,2,3
    search different campsites (specified by campsite IDs) between today and the next four weeks

/search?campsiteIDs=1,2,3&start=05/20/2017&days=6
    search different campsites (specified by campsite IDs) between today and the next 6 days
    `.replace(/\n/g, "<br/>").replace(/ /g, "&nbsp;"));
})

app.get("/search", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");

    let campsiteIDs = (req.query.campsiteIDs || YOSEMITE_CAMPSITE_IDS).split(","),
        startDate = new Date(req.query.startDate || Date.now()),
        endDate = new Date(startDate).addDays(req.query.days || 28);

    console.info(`Search campsites ${campsiteIDs}, between ${startDate} and ${endDate}`);

    campsites.searchCampsites(campsiteIDs, startDate, endDate)
        .then((results) => res.json(results));
});

app.listen(process.env.PORT || 9001, () => {
    console.log("[server] listening on port 9001");
});
