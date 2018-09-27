
const express = require("express");
const { searchCampsites } = require("./campsites");
const crypto = require('crypto');
require('datejs');

const app = express();

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

<a href="/search?date=05/20">/search?date=05/20</a>
    search Yosemite campsites avaialble in May 20, 2018.

<a href="/search">//search?dates=05/20,06/20,07/20</a>
    Search multiple dates

<a href="/search?date=05/20&days=7">/search?date=05/20&days=7</a>
<a href="/search?date=05/20&weeks=1">/search?date=05/20&weeks=1</a>
    search Yosemite campsites available between the specified date and the next 1 week

<a href="/search?campsiteIDs=70927">/search?campsiteIDs=70927</a>
    search different campsites (specified by campsite IDs) avaialble today.

<a href="/search?campsiteIDs=70927&date=05/20&weeks=4">/search?campsiteIDs=70927&start=05/20&weeks=4</a>
    search different campsites (specified by campsite IDs) between today and the next 4 weeks

Campsites:

Yosemite NORTH PINES: 70927
Yosemite UPPER PINES: 70925
Yosemite LOWER PINES: 70928
    `.replace(/\n/g, "<br/>"));
});

app.get("/search", async (req, res) => {
    if (req.query.token !== "shao") {
        res.send("Sorry, you are denied. Contact shaoshing@me.com");
    }

    res.header("Access-Control-Allow-Origin", "*");


    let campsiteIDs = req.query.campsiteIDs ? req.query.campsiteIDs.split(",") : CAMPSITE_IDS,
        dates = [];

    if (req.query.dates) {
        req.query.dates.split(",").forEach(str => {
            let startDate = Date.parse(str),
                days = req.query.weeks ? parseInt(req.query.weeks) * 7 : (req.query.days ? parseInt(req.query.days) : 1),
                endDate = new Date(startDate).addDays(days);

            dates.push({ startDate, endDate });
        });
    } else {
        let startDate = Date.parse(req.query.date || Date.now());
            days = req.query.weeks ? parseInt(req.query.weeks) * 7 : (req.query.days ? parseInt(req.query.days) : 1)
            endDate = new Date(startDate).addDays(days);

        dates.push({ startDate, endDate })
    }

    let allCampsites = {};

    await Promise.all(dates.map(async ({ startDate, endDate }) => {
        let campsites = await searchCampsites(campsiteIDs, startDate, endDate);

        campsites.forEach(r => {
            if (!allCampsites[r.campsiteID]) {
                allCampsites[r.campsiteID] = {
                    campsiteID: r.campsiteID,
                    name: CAMPSITES[r.campsiteID] || r.campsiteID,
                    availables: [],
                    otherDates: []
                };
            }

            allCampsites[r.campsiteID].availables = allCampsites[r.campsiteID].availables.concat(r.availables);
            allCampsites[r.campsiteID].otherDates = new Set([ ...allCampsites[r.campsiteID].otherDates, ...r.otherDates ]);
            allCampsites[r.campsiteID].otherDates = Array.from(allCampsites[r.campsiteID].otherDates).sort();
        });
    }));

    let results = {
        dates: dates.map(({ startDate, endDate }) => {
            return {
                startDate: startDate.format("m/d"),
                endDate: endDate.format("m/d")
            }
        }),
        campsites: Object.values(allCampsites)
    };

    results.id = md5(JSON.stringify(results));

    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(results, null, "    "));
});

app.listen(process.env.PORT || 9001, () => {
    console.log("[server] listening on port 9001");
});
