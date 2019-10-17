"use strict";

var getSchoolGeoJson = function (s) {
    return {
        "geometry": {
            "type": "Point",
            "coordinates": [s.Long, s.Lat]
        },
        "type": "Feature",
        "properties": {
            "popupContent": "<more content>",
            "school": s
        }
    };
};

// Append this to chicago geojson
var expandChicagoGeo = function () {

    ChicagoMapData.features.forEach(cm => {
        var schoolsByZip = SchoolsData.filter(s => s.Zip === cm.properties.ZIP);

        if (!schoolsByZip) {
            console.log("WARN: No schools in Zip: ${cm.properties.ZIP}.");
        }
        cm.properties["totalSchools"] = schoolsByZip.length;
    });
};

var getSchoolsGeo = function (zip) {
    var schoolsGeo = {
        "type": "FeatureCollection",
        "features": [
            // 
        ]
    };
    SchoolsData.filter(s => s.Zip === zip).forEach(s => schoolsGeo.features.push(getSchoolGeoJson(s)));
    return schoolsGeo;
};


