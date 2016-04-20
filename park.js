


var Promise = require('bluebird'),
    request = Promise.promisify(require('request').defaults({jar: true})),
    cheerio = require('cheerio');
    
require('datejs');

var CAMPSITES = {
    'NORTH PINES, YOSEMITE': '70927',
    'UPPER PINES, YOSEMITE': '70925',
    'LOWER PINES, YOSEMITE': '70928'
};

var START_DATE = '06/01/2016',
    END_DATE = '07/30/2016';

function getCampsiteURL(campsiteID, startDate) {
    return `http://www.recreation.gov/campsiteCalendar.do?page=calendar&contractCode=NRSO&parkId=${campsiteID}&calarvdate=${startDate}&sitepage=true`;
}

function _searchCampsite(url, jar) {
    return request({url: url, jar: jar}).then(function (response) {
        var result = cheerio.load(response.body);

        result("#calendar tr").each(function (index, element) {
            var campsiteName = result(".siteListLabel", element).text();
            
            if (campsiteName === "") { // this is a separator
                return;
            }
            
            var availables = result(".status.a a", element);
            
            if (availables.length === 0) {
                return;
            }
            
            availables.each(function (index, element) {
                var reservationURL = 'http://www.recreation.gov' + result(element).attr('href'),
                    dateStr = reservationURL.match(/\d+\/\d+\/\d+/)[0],
                    date = new Date(dateStr);

                console.info("\t%s %s - %s - %s", dateStr, date.format("D"), campsiteName, reservationURL);
            });
        });
        
        var nextPage = result('#resultNext').attr('href');
        
        if (nextPage) {
            nextPage = 'http://www.recreation.gov' + nextPage;
        }
        
        return nextPage;
    });
}

function searchCampsite(options) {
    var url = options.nextPage;
    
    options.jar = options.jar || request.jar();
    
    if (!url) {
        startDateStr = options.startDate.format("%m/%d/%Y");
        url = getCampsiteURL(options.campsiteID, startDateStr);
        
        console.info("* checking %s", startDateStr);
    }

    return _searchCampsite(url, options.jar).then(function (nextPage) {
        options.nextPage = nextPage;
        
        if (options.nextPage) {
            return searchCampsite(options);
        }
        
        options.startDate.addDays(14);

        if (options.startDate.isBefore(options.endDate)) {
            return searchCampsite(options);
        }

        return null;
    });    
}

var promise = Promise.resolve();

Object.keys(CAMPSITES).forEach(function (campsite) {
    promise = promise.then(function () {
        console.info("\n\n");
        console.info("Search for campsies at %s", campsite);

        return searchCampsite({
            campsiteID: CAMPSITES[campsite],
            startDate: new Date(START_DATE),
            endDate: new Date(END_DATE),
            reset: true
        });
    });
});

promise.then(function () {
    console.info("\n\n...Done");
});
