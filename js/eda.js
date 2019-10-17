/**
 * Perform EDA
 *
 * Files:
 *  js/models/CPS-schema.js
 *   Used to count schools
 *  data/Demographics_RacialEthnic_2019_schools.csv
 *   Used to tie CPS-schema with Network
 *
 * external variable: cpsData
 * 
 * Questions answered:
 *  What are different school categories and counts of each?
 *  What are the sizes of the networks (HS only)?
 */

/**
 * Question:
 *  What are the different unique categories?
 * Answer:
 *  Elementary Charter: 50
 *  Elementary School: 429
 *  High School: 117
 *  High School Charter: 67
 *  Middle School: 8
 *  Middle School Charter: 4
 */
var uniqueCatg = {}
for (var i in cpsData.rows) {
  var r = cpsData.rows[i];
  if (!uniqueCatg.hasOwnProperty(r[5])) { // r[5] => school category
    uniqueCatg[ r[5] ] = 1;
  } else {
    uniqueCatg[ r[5] ]++;
  }
}
console.log('cpsData is:', cpsData);
console.log('Unique categories (and counts) in CPS network are:', uniqueCatg);
// Display output
d3.select('#map').append('div').node().innerText = 
  'School types (from CPS-schema.js): '+JSON.stringify(uniqueCatg, null, 2);

/**
 * Question:
 *  What are the sizes of the networks (HS only)?
 * Answer:
 *  AUSL: 5
 *  Charter: 46
 *  Contract: 2
 *  ISP: 17
 *  Network 4: 1
 *  Network 14: 17
 *  Network 15: 19
 *  Network 16: 18
 *  Network 17: 18
 *  Options: 36
 */
var data2019;
var networksById = {}
var allHS = [];
var allHSobj = {};
// Build allHS (based on CPS-schema.js)
for (var i in cpsData.rows) {
  var r = cpsData.rows[i];
  if (r[5].indexOf('High School') == 0) {
    allHS.push(r);
    allHSobj[ r[0] ] = r; // School ID
  }
}
// Load 2019 data
d3.csv('./data/Demographics_RacialEthnic_2019_Schools.csv', function(data) {
  data2019 = data;
  console.log(data2019);
  data.forEach(function(d) {
    if (d.Network == '') {
      return;
    }
    // Is it a HS?
    if (!allHSobj.hasOwnProperty(d['School ID'])) {
      return;
    }
    // Now tally network schools
    if (!networksById.hasOwnProperty(d['Network'])) {
      networksById[ d['Network'] ] = 1;
    } else {
      networksById[ d['Network'] ]++;
    }
  });
  // Display output
  console.log(networksById);
  d3.select('#map').append('div').node().innerText =
    'Network HS count (from 2019 data, utilizing CPS-schema.js'
    + 'for definition of HS): '
    + JSON.stringify(networksById, null, 2);
  // An issue!
  d3.select('#map').append('div').node().innerText =
    'Network HS count (179) != CPS-schema.js HS count (184)! '
    + 'I.e., there are more HS in CPS-schema.js.';

});
