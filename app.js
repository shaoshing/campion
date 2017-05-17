
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
    search Yosemite (default) campsites between today (default) and the next 2 weeks (default)

/search?start=05/20/2017&weeks=2
    search Yosemite campsites between the specified date and the next 1 weeks

/search?campsiteIDs=1,2,3
    search different campsites (specified by campsite IDs) between today and the next four weeks

/search?campsiteIDs=1,2,3&start=05/20/2017&weeks=4
    search different campsites (specified by campsite IDs) between today and the next 4 weeks
    `.replace(/\n/g, "<br/>").replace(/ /g, "&nbsp;"));
});

app.get("/search", (req, res) => {
    if (req.query.token !== "shao") {
        res.send("Sorry, you are denied. Contact shaoshing@me.com");
    }

    res.header("Access-Control-Allow-Origin", "*");

    let campsiteIDs = (req.query.campsiteIDs || YOSEMITE_CAMPSITE_IDS).split(","),
        startDate = new Date(req.query.startDate || Date.now()),
        endDate = new Date(startDate).addDays(Math.min(parseInt(req.query.weeks || 2), 4)*7);

    campsites.searchCampsites(campsiteIDs, startDate, endDate)
        .then((campsites) => {
            let results = {
                campsiteIDs,
                startDate: startDate,
                endDate: endDate,
                campsites
            };

            res.header("Content-Type",'application/json');
            res.send(JSON.stringify(results, null, "    "));
        });
});

app.listen(process.env.PORT || 9001, () => {
    console.log("[server] listening on port 9001");
});
