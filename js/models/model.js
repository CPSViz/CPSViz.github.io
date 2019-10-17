/**
 * Barebones model singleton to load all data.
 *
 * @description To use this, simply include the files model.js, d3.min.js,
 *   and d3-queue.js. Then in a views JS file, call model.init(callback),
 *   where you define a custom callback function. The callback will be
 *   run after all files are loaded. Once the data is loaded, check console
 *   to see how it is formatted (i.e., type "model" in the console).
 *   Extra fields may be added as necessary to the model in models/model.js.
 *   For example, the fields model.data.networkProfile and
 *   model.data.networkTotals have been added for the network charts.
 *   The field model.data.highSchools contains all high schools, listed by
 *   year and then by ID, with associated population.
 **/
var model = {

    // Combined data from loaded data sets.
    // E.g., in order to determine if a school is a high school in
    // demographics files for any given year, it's required to
    // check enrollment data from grades 9-12, which is in 
    // enrollment data files.
    data: { // Processed data
        highSchools: {},
        allSchools: {}, // Includes schools with only k-8 population
        networkTotals: {
            all: {
              numSchoolsInNetwork: {},
              numStudentsInNetwork: {}
            },
            hs: {
              numSchoolsInNetwork: {},
              numStudentsInNetwork: {}
            },
        },
        byId: {}, // dictionary lookup referencing cpsData by school ID
        networkProfile: {
            all: {
              data: { // d3 styled arrays
                  school: [],
                  student: [],
              },
              maxSchools: null,
              maxStudents: null,
              stats1: null,
              stats2: null,
            },
            hs: {
              data: { // d3 styled arrays
                  school: [],
                  student: [],
              },
              maxSchools: null,
              maxStudents: null,
              stats1: null,
              stats2: null,
            }
        },
        networks: { // Schools sorted by network
          all: {
            schools: {} // schools[net name][year] =
                        //  { year:, schools: [...], schoolIDs: [...]}
          },
          hs: {
            schools: {}
          }
        }
    },

    // List of files to load (enrollment, demographics, scores).
    filesToLoad: {},

    // Set to true when all files are loaded.
    loadComplete: false,

    // Queue of scripts loaded after this file which are waiting for
    // data to be loaded and processed. When data are loaded,
    // all callbacks are fired.
    callbacksQueue: [],
};

var process = { // singleton 
    cleanNumber: null,
    cleanNetwork: null,
}

/**
 * Method to load all CSVs, populating model.data.
 *
 * @implementation "B" (preferred)
 *   1) Load all files when model.js is included.
 *   2) Views simply call model.init(callback) function.
 */
model.loadAll = function() {
  // Load all
  var q = d3.queue();
  for (var t in model.filesToLoad) {
    var dataSet = model.filesToLoad[t];
    for (var f in dataSet) {
      q.defer(d3.csv, dataSet[f].file);
    }
  }
  q.await(model.load);
}

/**
 * Load all data files.
 */
model.load = function(error,
                      enrollment2019,
                      enrollment2018,
                      enrollment2017,
                      enrollment2016,
                      enrollment2015,
                      enrollment2014,
                      demographics2019,
                      demographics2018,
                      demographics2017,
                      demographics2016,
                      demographics2015,
                      demographics2014,
                      sat2018,
                      sat2017,
                      act2001_2016
                      ) {
                        
  
  if (error != null) {
    if (error.statusText != '') {
      alert('Error loading data!');
      return;
    }
  }
  
  model.filesToLoad['20th'][0].data = enrollment2019;
  model.filesToLoad['20th'][1].data = enrollment2018;
  model.filesToLoad['20th'][2].data = enrollment2017;
  model.filesToLoad['20th'][3].data = enrollment2016;
  model.filesToLoad['20th'][4].data = enrollment2015;
  model.filesToLoad['20th'][5].data = enrollment2014;
  model.filesToLoad['Demography'][0].data = demographics2019;
  model.filesToLoad['Demography'][1].data = demographics2018;
  model.filesToLoad['Demography'][2].data = demographics2017;
  model.filesToLoad['Demography'][3].data = demographics2016;
  model.filesToLoad['Demography'][4].data = demographics2015;
  model.filesToLoad['Demography'][5].data = demographics2014;
  model.filesToLoad['Scores'][0].data = sat2018;
  model.filesToLoad['Scores'][1].data = sat2017;
  model.filesToLoad['Scores'][2].data = act2001_2016;
  
  process.initiate20thDayData();
  process.initiateDemographyData();
  
  // Network totals
  for (var i in model.filesToLoad['Demography']) {
    var p = model.filesToLoad['Demography'][i];
    for (var j in p.data) {
      var data = p.data[j];
      data['Network'] = process.cleanNetwork(data['Network']);
      process.incrementNetworkTotals(data, p.year);
    }
  }
  
  // Generate network d3 styled data sets.
  process.createNetworkDatasets('all');
  process.createNetworkDatasets('hs');
  
  // Include cpsData
  if (cpsData) {
    for (var i in cpsData.rows) {
      var id = cpsData.rows[i][0];
      model.data.byId[id] = {}
      for (var j in cpsData.columns) {
        var col = cpsData.columns[j];
        model.data.byId[id][col] = cpsData.rows[i][j];
      }
    }
  }
  
  // Loading data is complete.
  model.loaded();
}

/**
 * Initiate 20th day data from raw data
 */
process.initiate20thDayData = function() {
  // 1) Check which schools are high school.
  // 2) If a high school, then total students = 9-12 population,
  //    not "Total" population for school. (Total pop. will
  //    include K-8 pop. when a schools is, e.g., K-12.)
  for (var i in model.filesToLoad['20th']) {
    var p = model.filesToLoad['20th'][i];
    model.data.highSchools[p.year] = {};
    model.data.allSchools[p.year] = {};
    for (var j in p.data) {
      var data = p.data[j];
      if (data.hasOwnProperty('School')) { // Add School Name property if missing
        data['School Name'] = data['School'];
      }
      var snfs = (data['School Name'])
        ? data['School Name'].replace(/[^\w]/g, '').toUpperCase() : 
        '';
      if (!data.hasOwnProperty('01')) {
        data['01'] = data['1'];
        data['02'] = data['2'];
        data['03'] = data['3'];
        data['04'] = data['4'];
        data['05'] = data['5'];
        data['06'] = data['6'];
        data['07'] = data['7'];
        data['08'] = data['8'];
        data['09'] = data['9'];
      }
      data['PK'] = process.cleanNumber(data['PK'])
      data['PE'] = process.cleanNumber(data['PE'])
      data['K'] = process.cleanNumber(data['K'])
      data['01'] = process.cleanNumber(data['01'])
      data['02'] = process.cleanNumber(data['02'])
      data['03'] = process.cleanNumber(data['03'])
      data['04'] = process.cleanNumber(data['04'])
      data['05'] = process.cleanNumber(data['05'])
      data['06'] = process.cleanNumber(data['06'])
      data['07'] = process.cleanNumber(data['07'])
      data['08'] = process.cleanNumber(data['08'])
      data['09'] = process.cleanNumber(data['09'])
      data['10'] = process.cleanNumber(data['10']);
      data['11'] = process.cleanNumber(data['11']);
      data['12'] = process.cleanNumber(data['12']);
      data['Network'] = process.fix20thNetNames( // Add network names
        data, model.filesToLoad['Demography'][i].data[j]
      );
      if (   data['09'] != 0 || data['10'] != 0
          || data['11'] != 0 || data['12'] != 0) {
        model.data.highSchools[p.year][ data['School ID'] ] = {
          '20th': data, // Raw data field
          '9_12': data['09'] + data['10'] + data['11'] + data['12'],
          'total': process.cleanNumber(data['Total']), // Total based on 20th day file (not demo. file)
          'School ID': data['School ID'],
          'School Name': data['School Name'],
          // A field for searchability
          'SchoolNameForSearches': snfs,
        }
      }
      model.data.allSchools[p.year][ data['School ID'] ] = {
        '20th': data, // Raw data field
        '9_12': data['09'] + data['10'] + data['11'] + data['12'],
        'total': process.cleanNumber(data['Total']),
        'School ID': data['School ID'],
        'School Name': data['School Name'],
        // A field for searchability
        'SchoolNameForSearches': snfs,
      }
    }
  }
}
/**
 * Initiate demography data from raw data
 */
process.initiateDemographyData = function() {
  // Add demography data
  for (var i in model.filesToLoad['Demography']) {
    var p = model.filesToLoad['Demography'][i];
    for (var j in p.data) {
      var data = p.data[j];
      data.abbr = {};         // Abbreviations of certain demographies
      data.abbrShortest = {}; // Shorter Abbreviations of...
      // Clean the data 1
      data = process.fixDemoData(data);
      // Clean the data 2
      for (var key in data) {
        var abbrKey = process.abbreviateDemographies(key);
        var abbrKeyShorter = process.abbreviateDemographies(key, true);
        if (/No$/.exec(key)) {
          data[key] = process.cleanNumber(data[key]);
          data.abbr[abbrKey] = data[key];
          data.abbrShortest[abbrKeyShorter] = data[key];
        } else if (/Pct$/.exec(key)) {
          data[key] = parseFloat(data[key]);
          data.abbr[abbrKey] = data[key];
          data.abbrShortest[abbrKeyShorter] = data[key];
        } else if (key.trim() == 'Total') {
          // Trim " Total "
          // But keep " Total " to be backwards-compatible
          data[key.trim()] = process.cleanNumber(data[key]);
          data[key] = process.cleanNumber(data[key]);
        }
      }
      // Add the data
      if (process.isHighSchool(data['School ID'], p.year)) {
        // Raw data field
        model.data.highSchools[p.year][ data['School ID'] ].demography = data;
      }
      // Raw data field
      model.data.allSchools[p.year][ data['School ID'] ].demography = data;
    }
  }
}

/**
 * Add network name to 2019 20th day data.
 */
process.fix20thNetNames = function(data, rowDemog) {
  if (!data.hasOwnProperty('Network')
      && rowDemog.hasOwnProperty('Network')) {
    return rowDemog.Network;
  } else {
    return data.Network;
  }
}

/**
 * Fix bad demo data, e.g. "Mulit-Racial"
 * 
 * @param Object representing row of demography data
 */
process.fixDemoData = function(data) {
  // Copy over incorrectly labeled rows to correct rows.
  if (data.hasOwnProperty('Mulit-RacialNo')) {
    data['Multi-RacialNo'] = data['Mulit-RacialNo'];
    delete data['Mulit-RacialNo'];
  }
  if (data.hasOwnProperty('Mulit-RacialPct')) {
    data['Multi-RacialPct'] = data['Mulit-RacialPct'];
    delete data['Mulit-RacialPct'];
  }
  if (data.hasOwnProperty('Asian/ Pacific Islander (Retired)No')) {
    data['Asian/Pacific Islander (Retired)No'] = data['Asian/ Pacific Islander (Retired)No'];
  }
  if (data.hasOwnProperty('Asian/ Pacific Islander (Retired)Pct')) {
    data['Asian/Pacific Islander (Retired)Pct'] = data['Asian/ Pacific Islander (Retired)Pct'];
  }
  if (data.hasOwnProperty('Asian/Pacific Islander(Retired)No')) {
    data['Asian/Pacific Islander (Retired)No'] = data['Asian/ Pacific Islander (Retired)No'];
  }
  if (data.hasOwnProperty('Asian/Pacific Islander(Retired)Pct')) {
    data['Asian/Pacific Islander (Retired)Pct'] = data['Asian/ Pacific Islander (Retired)Pct'];
  }
  
  // Set defaults to 0 if missing.
  if (!data.hasOwnProperty('Multi-RacialNo')
      || data['Multi-RacialNo'] == undefined ) {
    data['Multi-RacialNo'] = 0;
  }
  return data;
}

/**
 * Loading process is complete, so process the queue.
 */
model.loaded = function() {
    // Update watcher.
    model.loadComplete = true;
    // Process any pending callbacks (scripts waiting for data to load).
    model.processQueue();
}

/**
 * Allow scripts to wait until data has been loaded.
 */
model.init = function(callback) {
    if (model.loadComplete) {
        // Pass the model back to cb to avoid the need of using the global var (model).
        callback(model); // No need to wait, data is ready.
    } else {
        model.callbacksQueue.push(callback);
    }
}

/**
 * Process await callback queue.
 * 
 * @description Recursively call all functions waiting in the callbacks
 *    queue. After all callbacks have been fired, the queue will be
 *    empty.
 */
model.processQueue = function() {
    if (model.callbacksQueue.length) {
        var m = model.callbacksQueue.shift();
        m(model);
        model.processQueue();
    }
}

/**
 * List of all necessary files in the program.
 */
model.filesToLoad = {
    '20th': [
        {
            year: 2019,
            file: './data/Demographics_20thDay_2019.csv',
        },
        {
            year: 2018,
            file: './data/Demographics_20thDay_2018.csv'
        },
        {
            year: 2017,
            file: './data/Demographics_20thDay_2017.csv'
        },
        {
            year: 2016,
            file: './data/enrollment_20th_day_2016_GV_20151023.csv'
        },
        {
            year: 2015,
            file: './data/enrollment_20th_day_2014-15.csv'
        },
        {
            year: 2014,
            file: './data/enrollment_20th_day_2014.csv'
        },
    ],
    'Demography': [
        {
            year: 2019,
            file: './data/Demographics_RacialEthnic_2019_Schools.csv'
        },
        {
            year: 2018,
            file: './data/Demographics_RacialEthnic_2018_Schools.csv'
        },
        {
            year: 2017,
            file: './data/Demographics_RacialEthnic_2017_Schools.csv'
        },
        {
            year: 2016,
            file: './data/FY16_Student_Racial_Ethnic_Report_20151023.csv'
        },
        {
            year: 2015,
            file: './data/FY15_Racial_Ethnic_Survey.csv'
        },
        {
            year: 2014,
            file: './data/FY14_Racial_Ethnic_Survey.csv'
        },
    ],
    'Scores': [
        {
            year: 2018,
            file: './data/Assessment_PSATSAT_SchoolLevel_2018.csv',
        },
        {
            year: 2017,
            file: './data/Assessment_PSATSAT_SchoolLevel_2017.csv',
        },
        {
            year: 2016, // Contains all years previous to 2016
            file: './data/AverageACT_2016_SchoolLevel.csv',
        },
    ]
}

/**
 * Abbreviate Demographies
 * 
 * @param n String to abbreviate
 * @param shorter Boolean to denote if shortest abbreviate desired
 */
process.abbreviateDemographies = function(n, shorter) {
  if (!shorter) {
    n = n
      .replace('Asian/ Pacific Islander (Retired)', 'As./Pac.Isld.(Ret\'d)')
      .replace('Native American/Alaskan', 'Nat.Amer./Alask.')
      .replace('Hawaiian/Pacific Islander', 'Haw./Pac.Isld.')
      // Asian/Pacific Islander(Retired) - 2014-15
      .replace('Asian/Pacific Islander (Retired)', 'As./Pac.Isld.(Ret\'d)')
      .replace('Asian/Pacific Islander(Retired)', 'As./Pac.Isld.(Ret\'d)');
    return n;
  } else {
     n = n
      // From above
      .replace('Asian/ Pacific Islander (Retired)', 'AP')
      .replace('Native American/Alaskan', 'NM')
      .replace('Hawaiian/Pacific Islander', 'HP')
      // Asian/Pacific Islander(Retired) - 2014-15
      .replace('Asian/Pacific Islander (Retired)', 'AP')
      .replace('Asian/Pacific Islander(Retired)', 'AP')
      
      .replace('African American', 'AA')
      .replace('Asian', 'AS')
      .replace('Hispanic', 'HI')
      .replace('Multi-Racial', 'MR')
      .replace('Not Available', 'NA')
      .replace('White', 'WH');
    return n;
  }
}

/**
 * Clean network name
 * 
 * @extended At this point only necessary cleaning is to change networks
 *    that are single digits to have a leading 0 (e.g. "Network 2 becomes
 *    "Network 02"), which is useful for alphabetical sorting.
 */
process.cleanNetwork = function(n) {
  if (n == undefined) return '';
  n = n.replace(/^Network (\d)$/, 'Network 0$1');
  return n;
}

/**
 * Return an integer from possible non-integer value.
 * 
 * @extended Correctly parse ints such as " 24, 394 ".
 * 
 * @return  Int
 */
process.cleanNumber = function(n) {
    if (n == undefined) return 0;
    else if (n == '') return 0;
    n = parseInt(
        n.toString().trim().replace(/[, ]/g, '')
    );
    return n;
}

/**
 * 
 * 
 * @param s Obj School row object
 * @param year Int Year
 */
process.incrementNetworkTotals = function(school, year) {
    var nt = model.data.networkTotals;
    // all
    if (!nt.all.numSchoolsInNetwork.hasOwnProperty(year)) {
        // Instantiate year keys.
        nt.all.numSchoolsInNetwork[year] = {};
        nt.all.numStudentsInNetwork[year] = {};
    }
    if (nt.all.numSchoolsInNetwork[year].hasOwnProperty(school['Network'])) {
        // Increment
        nt.all.numSchoolsInNetwork[year][school['Network']]++;
        nt.all.numStudentsInNetwork[year][school['Network']] +=
            model.data.allSchools[year][school['School ID']].total;//['Total'];
    } else {
        // Instantiate
        nt.all.numSchoolsInNetwork[year][school['Network']] = 1;
        nt.all.numStudentsInNetwork[year][school['Network']] =
            model.data.allSchools[year][school['School ID']].total;//['Total'];
    }
    // hs only
    if (process.isHighSchool(school['School ID'], year)) {
      if (!nt.hs.numSchoolsInNetwork.hasOwnProperty(year)) {
          // Instantiate year keys.
          nt.hs.numSchoolsInNetwork[year] = {};
          nt.hs.numStudentsInNetwork[year] = {};
      }
      if (nt.hs.numSchoolsInNetwork[year].hasOwnProperty(school['Network'])) {
          // Increment
          nt.hs.numSchoolsInNetwork[year][school['Network']]++;
          nt.hs.numStudentsInNetwork[year][school['Network']] +=
              model.data.highSchools[year][school['School ID']]['9_12'];
      } else {
          // Instantiate
          nt.hs.numSchoolsInNetwork[year][school['Network']] = 1;
          nt.hs.numStudentsInNetwork[year][school['Network']] =
              model.data.highSchools[year][school['School ID']]['9_12'];
      }
    }
    
    // Add to model.data.networks.all.schoolIDs
    var nws = model.data.networks.all.schools;
    if (!nws.hasOwnProperty(school['Network'])) {
      nws[school['Network']] = {};
      nws[school['Network']][year] = {
        year: year,
        schools: [ school ],
        schoolIDs: [ school['School ID'] ]
      };
    } else {
      // Add to existing key
      if (!nws[school['Network']].hasOwnProperty(year)) {
        // Instantiate new
        nws[school['Network']][year] = {
          year: year,
          schools: [ school ],
          schoolIDs: [ school['School ID'] ]
        };
      } else {
        // Add to existing key
        nws[school['Network']][year].schools.push(school);
        nws[school['Network']][year].schoolIDs.push(school['School ID']);
      }
    }
    // Add to model.data.networks.hs.schoolIDs
    var nws = model.data.networks.hs.schools;
    if (process.isHighSchool(school['School ID'], year)) {
      if (!nws.hasOwnProperty(school['Network'])) {
        nws[school['Network']] = {};
        nws[school['Network']][year] = {
          year: year,
          schools: [ school ],
          schoolIDs: [ school['School ID'] ]
        };
      } else {
        // Add to existing key
        if (!nws[school['Network']].hasOwnProperty(year)) {
          // Instantiate new
          nws[school['Network']][year] = {
            year: year,
            schools: [ school ],
            schoolIDs: [ school['School ID'] ]
          };
        } else {
          // Add to existing key
          nws[school['Network']][year].schools.push(school);
          nws[school['Network']][year].schoolIDs.push(school['School ID']);
        }
      }
    }
}

/**
 * 
 * @param schoolID
 */
process.isHighSchool = function(schoolID, year) {
    if (model.data.highSchools[year].hasOwnProperty(schoolID)) {
        return true;
    }
    return false;
}

/**
 * 
 * @param type String "all" or "hs"
 */
process.createNetworkDatasets = function(type) {
    // Find the max schools / students across all years.
    var max = {
        mostSchools: 0,
        mostStudents: 0
    }
    var nt = model.data.networkTotals[type];

    // d1
    var maxSchoolInSystem = 0;
    for (var year in nt.numSchoolsInNetwork) {
        var obj = nt.numSchoolsInNetwork[year];
        var numSchoolsInSystem = 0;
        var numStudentsInSystem = 0;
        for (var network in obj) {
            // Blank rows are total size.
            // Aka "distrct total" in some years
            // Aka "Dsitrict" in some years
            if (network == '') continue;
            if (network == 'District Total') continue;
            if (network == 'Dsitrict Total') continue;
            model.data.networkProfile[type].data.school.push({
                'network': network,
                'stat': obj[network],
                'year': parseInt(year)
            });
            numSchoolsInSystem =
                nt.numSchoolsInNetwork[year][network];
            if (numSchoolsInSystem > max.mostSchools) {
                max.mostSchools = numSchoolsInSystem;
            }
        }
    }
    // d2
    var maxStudentInSystem = 0;
    for (var year in nt.numStudentsInNetwork) {
        var obj = nt.numStudentsInNetwork[year];
        var numStudentsInSystem = 0;
        for (var network in obj) {
            // Blank rows are total size.
            // Aka "distrct total" in some years
            // Aka "Dsitrict" in some years
            if (network == '') continue;
            if (network == 'District Total') continue;
            if (network == 'Dsitrict Total') continue;
            model.data.networkProfile[type].data.student.push({
                'network': network,
                'stat': obj[network],
                'year': parseInt(year)
            });
            numStudentsInSystem =
                nt.numStudentsInNetwork[year][network];
            if (numStudentsInSystem > max.mostStudents) {
                max.mostStudents = numStudentsInSystem;
            }
        }
    }
    // Generate averages for the school data set.
    var d = model.data.networkProfile[type].data.school;
    var x1 = {}, x2 = {};
    for (var i in d) {
        var network = d[i].network;
        if (!x1.hasOwnProperty(network)) {
            x1[network] = {
                totalEntries: 1,
                totalValue: d[i].stat,
                mean: null
            }
        } else {
            x1[network].totalEntries++;
            x1[network].totalValue += d[i].stat;
        }
    }
    for (var network in x1) { // Sum
        x1[network].mean = x1[network].totalValue / x1[network].totalEntries;
    }
    // Generate averages for the student data set.
    var d = model.data.networkProfile[type].data.student;
    for (var i in d) {
        var network = d[i].network;
        if (!x2.hasOwnProperty(network)) {
            x2[network] = {
                totalEntries: 1,
                totalValue: d[i].stat,
                mean: null
            }
        } else {
            x2[network].totalEntries++;
            x2[network].totalValue += d[i].stat;
        }
    }
    for (var network in x2) { // Sum
        x2[network].mean = x2[network].totalValue / x2[network].totalEntries;
    }
    
    // Sort and add to global context.
    model.data.networkProfile[type].data.school.sort(process.sortFunctionAB);
    model.data.networkProfile[type].data.student.sort(process.sortFunctionAB);
    model.data.networkProfile[type].maxSchools = max.mostSchools;
    model.data.networkProfile[type].maxStudents = max.mostStudents;
    model.data.networkProfile[type].stats1 = x1;
    model.data.networkProfile[type].stats2 = x2;
}

/**
 * Sort by number of schools in network.
 */
process.sortFunctionSchoolsAll = function(a, b) {
    return model.data.networkProfile.all.stats1[b.network].mean
        - model.data.networkProfile.all.stats1[a.network].mean;
}
process.sortFunctionSchoolsHs = function(a, b) {
    return model.data.networkProfile.hs.stats1[b.network].mean
        - model.data.networkProfile.hs.stats1[a.network].mean;
}
/**
 * Sort by number of students in network.
 */
process.sortFunctionStudentsAll = function(a, b) {
    return model.data.networkProfile.all.stats2[b.network].mean
        - model.data.networkProfile.all.stats2[a.network].mean;

}
process.sortFunctionStudentsHs = function(a, b) {
    return model.data.networkProfile.hs.stats2[b.network].mean
        - model.data.networkProfile.hs.stats2[a.network].mean;

}
/**
 * Sort alphabetically by network name.
 */
process.sortFunctionAB = function(a, b) {
    if (a.network < b.network) return -1;
    if (a.network > b.network) return 1;
    return 0;
}

// Load all files by default.
model.loadAll();

