/**
 * Barebones model singleton to load all data.
 **/

var model = {
  data: {},
  filesToLoad: {},
  loadComplete: false,
};

/**
 * Method to load all CSVs, populating model.data.
 *
 * @implementation "A"
 *   1) A view.js file wants data, uses model.loadAll.
 *   1) Loop through all files and load each.
 *   2) Process data for any issue.
 *   3) Use callback to signal completion.
 *
 * @implementation "B" (preferred)
 *   1) Load all files when model.js is included (faster).
 *   2) Calling views simply check loadComplete(callback) function.
 */
model.loadAll = function(callback) {
  
}

/**
 * List of all necessary files in the program.
 */
models.filesToLoad = {
  '20th':[
    {
      year: 2019,
      file: './data/Demographics_20thDay_2019.csv'
    },
    {
      year: 2018,
      file: './data/Demographics_20thDay_2018.csv' },
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
    
  ]
}

