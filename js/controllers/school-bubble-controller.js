var schoolBubbleController = function () {
    model.init(extractSchools);

    var schoolData = {};
    function extractSchools(d) {
        Object.keys(d.data.allSchools).forEach(y => {
            console.log('year', y);
            schoolData[y] = getSchoolData(d, y);
        });

        // Call external (dependent) module here
        createBubbleChart();
    }

    function getSchoolData(d, y) {
        var schools = [];
        Object.keys(d.data.allSchools[y]).forEach(sId => {
            // Foreach school id
            var school = d.data.allSchools[y][sId];

            if (!school.hasOwnProperty('demography')) { // TODO: Needs to be fixed in model
                console.log("WARN: demography not found for -");
                console.log(school);
                return;
            }

            if (!school["20th"].hasOwnProperty('Network')) { // TODO: Needs to be fixed in model
                console.log("WARN: Network not found for -");
                console.log(school);
                return;
            }

            // Skip entries with no id (these are agg records)
            if (!sId) {
                return;
            }

            // Filter schools with <= 20 students
            var schoolName = school["20th"]["School Name"];
            var students = school.total;// Utilize parsed total
            if (!students || school.total <= 20) {
                console.log(`WARN: School excluded ${schoolName}. (Less than 20 students)`);
                return;
            }

            schools.push({
                id: sId,
                schoolName: schoolName,
                network: school["20th"]["Network"],
                isElementary: school["9_12"] === 0,
                totalStudents: students,
                demography: school["demography"]["abbr"]
                //zip: 
            });
        });
        return schools;
    }

    var filterDemographies = function (year, demography) {
        // Use schoolData
    };

    var getSchoolsByYear = function (year) {
        return schoolData[year];
    };

    var filterStudentsByDemography = function (demog, year) {
        retval = [];
        schoolData[year].forEach(s => {
            // Removeing outliers with less than 10 students
            var students = parseInt(s.demography[demoLabels[demog]]);
            if (students < 10) {
                console.log(`WARN: School excluded ${s.schoolName}. (Less than 10 students)`);
                return;
            }
            retval.push({
                id: s.sId,
                schoolName: s.schoolName,
                network: s.network,
                isElementary: s.isElementary,
                totalStudents: students,
                demography: s.demography
                //zip: 
            });
        });

        return retval;
    };

    var getSchoolNetworksDict = function (schools) {
        retval = {};

        schools.forEach(s => {
            retval[s.network] = s.network;
        });
        return retval;
    };

    var demoLabels = {
        "African American": "African AmericanNo",
        "Asian": "AsianNo",
        "White": "WhiteNo",
        "Hispanic": "HispanicNo",
        "Multi-Racial": "Multi-RacialNo",
        "Native/Alaskan": "Nat.Amer./Alask.No",
        "NA": "Not AvailableNo"
    };

    return {
        filterDemographicData: filterDemographies,
        getSchoolsByYear: getSchoolsByYear,
        getSchoolNetworksDict: getSchoolNetworksDict,
        filterStudentsByDemography: filterStudentsByDemography,
        demographyLabels: demoLabels
    };
};
