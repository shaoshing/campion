
let Promise = require('bluebird'),
    request = Promise.promisify(require('request').defaults({jar: true})),
    cheerio = require('cheerio');

require('datejs');

const WEEK_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function _searchCampsiteURL(url, cookiesJar = request.jar(), results = []) {
    return request({url: url, jar: cookiesJar})
        .then((response) => {
            let result = cheerio.load(response.body);

            result("#calendar tr").each((index, element) => {
                let campsiteName = result(".siteListLabel", element).text();

                if (campsiteName === "") { // this is a separator
                    return;
                }

                let availables = result(".status.a a", element);

                if (availables.length === 0) {
                    return;
                }

                availables.each((index, element) => {
                    let reservationURL = 'http://www.recreation.gov' + result(element).attr('href'),
                        dateStr = reservationURL.match(/\d+\/\d+\/\d+/)[0],
                        date = new Date(dateStr),
                        weekName = WEEK_NAMES[date.getDay()];

                    console.info(`[_searchCampsiteURL] found ${date}`);
                    results.push({
                        reservationURL,
                        date,
                        dateStr: `${date.toLocaleDateString()} ${weekName}`
                    });
                });
            });

            let nextPage = result('#resultNext').attr('href');

            if (nextPage) {
                return _searchCampsiteURL('http://www.recreation.gov' + nextPage, cookiesJar, results);
            } else {
                return results;
            }
        });
}

function _searchCampsite(campsiteID, startDate, endDate, availables = []) {
    let startDateStr = startDate.format("%m/%d/%Y"),
        url = `http://www.recreation.gov/campsiteCalendar.do?page=calendar&contractCode=NRSO&parkId=${campsiteID}&calarvdate=${startDateStr}&sitepage=true`;

    console.info(`[_searchCampsite] searching ${campsiteID} - ${startDate.format("%m/%d/%Y")} - ${url}`);

    return _searchCampsiteURL(url)
        .then((results) => {
            availables.push(...results.filter(r => !r.date.isAfter(endDate) && !r.date.equals(endDate) ));

            let nextStartDate = new Date(startDate).addDays(14);

            if (!nextStartDate.isAfter(endDate)) {
                return _searchCampsite(campsiteID, nextStartDate, endDate, availables);
            } else {
                return availables;
            }
        })
}

exports.searchCampsites = function (campsiteIDs, startDate, endDate) {
    let promises = campsiteIDs.map((campsiteID) => {
        return _searchCampsite(campsiteID, startDate, endDate)
            .then((availables) => {
                return { campsiteID, availables };
            });
    });

    return Promise.all(promises);
}
