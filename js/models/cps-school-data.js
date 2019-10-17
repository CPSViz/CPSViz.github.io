"use strict";

// Class (should be moved to server in the future)
var SchoolData = function (cpsSchoolData) {
    var self = this;
    var data = [];
    var cols = cpsSchoolData.columns;

    cpsSchoolData.rows.forEach((row, j) => {
        if (row.length !== cols.length) {
            console.log("ERR: Invalid row length found in CPS Data at index ${j}.");
        }

        var school = {};
        cols.forEach((c, i) => {
            school[c] = row[i];
        });
        data.push(school);
    });

    self.public = {
        schools: data
    };

    return self.public;
};

var SchoolsData = (new SchoolData(cpsData)).schools;