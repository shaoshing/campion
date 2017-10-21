
let express = require("express");
let campsites = require("./campsites");
let crypto = require('crypto');

require('datejs');

let app = express();

const CAMPSITES = {
    "70927": "Yosemite NORTH PINES",
    "70925": "Yosemite UPPER PINES",
    "70928": "Yosemite LOWER PINES"
};

const CAMPSITE_IDS = Array.from(Object.keys(CAMPSITES));

function md5 (str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

app.get("/", (req, res) => {
    res.send(`
Usage:

<a href="/search">/search</a>
    search Yosemite (default) campsites avaialble today.

<a href="/search?date=05/20/2017">/search?date=05/20/2017</a>
    search Yosemite campsites avaialble in May 20, 2017.

<a href="/search?date=05/20/2017&days=7">/search?date=05/20/2017&days=7</a>
<a href="/search?date=05/20/2017&weeks=1">/search?date=05/20/2017&weeks=1</a>
    search Yosemite campsites available between the specified date and the next 1 week

<a href="/search?campsiteIDs=70927">/search?campsiteIDs=70927</a>
    search different campsites (specified by campsite IDs) avaialble today.

<a href="/search?campsiteIDs=70927&date=05/20/2017&weeks=4">/search?campsiteIDs=70927&start=05/20/2017&weeks=4</a>
    search different campsites (specified by campsite IDs) between today and the next 4 weeks

Campsites:

Yosemite NORTH PINES: 70927
Yosemite UPPER PINES: 70925
Yosemite LOWER PINES: 70928
    `.replace(/\n/g, "<br/>"));
});

app.get("/search", (req, res) => {
    if (req.query.token !== "shao") {
        res.send("Sorry, you are denied. Contact shaoshing@me.com");
    }

    res.header("Access-Control-Allow-Origin", "*");

    let campsiteIDs = req.query.campsiteIDs ? req.query.campsiteIDs.split(",") : CAMPSITE_IDS;
        startDate = new Date(req.query.date || Date.now());

    let days = req.query.weeks ? parseInt(req.query.weeks) * 7 : (req.query.days ? parseInt(req.query.days) : 0)
        endDate = new Date(startDate).addDays(days);

    campsites.searchCampsites(campsiteIDs, startDate, endDate)
        .then((campsites) => {
            campsites.forEach(r => {
                r.campsite = CAMPSITES[r.campsiteID] || r.campsiteID;
            });

            let results = {
                startDate: startDate.toLocaleDateString(),
                endDate: endDate.toLocaleDateString(),
                campsites
            };

            results.id = md5(JSON.stringify(results));

            res.header("Content-Type",'application/json');
            res.send(JSON.stringify(results, null, "    "));
        });
});

app.listen(process.env.PORT || 9001, () => {
    console.log("[server] listening on port 9001");
});
