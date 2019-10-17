/**
 * @authors DS, JA, VS
 * @brief A profile singleton for schools.
 * 
 * @reference
 *  For chart, following tutorial is referenced:
 * 	http://www.darreningram.net/creating-a-simple-bar-chart-with-d3-js/
 * 
 * @usage
 *  Include school-profile.js at the end of HTML document after D3 has
 *	been included, as well as a #profile div.
 *  Call schoolProfile.load( [ID1, ID2, ...], year ) to load one 
 *  or more schools.
 * 
 * @example-usage
 *  schoolProfile.load( [4000153], 2019 )
 * 
 * @requirements
 *  Must be loaded after D3. There must be a #profile element.
 */

// There is only one schoolProfile (singleton).
var schoolProfile = {};

/**
 * Use to check if page contains sufficient requirements to generate profile.
 *
 * @example-usage
 *	if (schoolProfile.require()) { schoolProfile.load([400099]) }
 */
schoolProfile.require = function() {
  try {
    // Must have d3, must have id=profile element.
    d3.select('#profile');
  } catch (e) {
    console.log('WARN: Missing #profile div for profile!');
    return false;
  }
  // Add default text
  var d = d3.select('#profile').append('div');
  d.node().id = 'profile-preload';
  d.node().className = 'unselectable-text';
  d.text('Select a school to view its profile.');
  return true;
}
schoolProfile.require();

/**
 * DEBUG
 */
schoolProfile.debug = function() {
  if (window.location.href.indexOf('debug') != -1) {
    this.load(/debug(\d+)/.exec(window.location.href)[1]);
    // School ID follows "debug".
  }
}
schoolProfile.debug();

/**
 * @brief Load data and select school by school ID.
 * 
 * @extended Assumption is that model has been loaded.
 *      If there are multiple schools passed in, then the idea
 *      is that they are being compared.
 * 
 * @param schoolArray IDs (ints or strings) of schools to load.
 * @param year Int or str of year to load.
 */
schoolProfile.load = function(schoolArray, year, blockScroll) {
  // Reset profile
  var d = d3.select('#profile');
  d.selectAll('*').remove();
  
  // If empty school array, show loading
  if (!schoolArray.length) {
    schoolProfile.require();
    return;
  }
  
  // Add Back to top button
  var btt = d.append('div');
  btt.node().className = 'profile-backToTop';
  btt.text('Back to Top');
  btt.on('click', function() {
    d3.select('body').node().scrollIntoView({
      behavior: "smooth", // or "auto" or "instant"
      block: "start" // or "end"
    });
  });
  
  // Set globals
  schoolProfile.reset();
  schoolProfile.currentView.currentSchoolArray = schoolArray;
  schoolProfile.currentView.currentSchoolYear = year;
  schoolProfile.saToObj(schoolArray); // sets schoolProfile.currentView.currentSchoolArrayObj
  schoolProfile.currentView.schoolComparison = (schoolArray.length > 1) ?
    true : false;
    
  schoolProfile.init(schoolArray, year);
  
  // Finally, scroll into view title
  if (!blockScroll) {
    d3.select('#profile').node().scrollIntoView({
      behavior: "smooth", // or "auto" or "instant"
      block: "start" // or "end"
    });
  }
}

/**
 * @brief School array to school array object (for fast lookup)
 */
schoolProfile.saToObj = function(schoolArray) {
  for (var i in schoolArray) {
    var id = schoolArray[i];
    schoolProfile.currentView.currentSchoolArrayObj[id] = true;
  }
}

/**
 * @brief Add to compare.
 * 
 * @param schoolID Integer (or str?) representing a school's ID
 */
schoolProfile.addToCompare = function(schoolID) {
  var x;
  var d = d3.select('#schoolCompareButton').node();
  if (d.style.opacity == 0
      && schoolProfile.currentView
      && schoolProfile.currentView.currentSchoolArray) {
    // If opacity = 0 it's a new comparison
    schoolProfile.currentView.currentSchoolArray = [schoolID];
    schoolProfile.currentView.currentSchoolArrayObj[schoolID] = true;
  }
  if (schoolProfile.currentView
      && schoolProfile.currentView.currentSchoolArray) {
    x = schoolProfile.currentView.currentSchoolArray;
    if (!schoolProfile.currentView.currentSchoolArrayObj[schoolID]) {
      x.push(schoolID);
    }
  } else {
    x = [ schoolID ];
  }
  var n = (x.length == 1) ? ' school' : ' schools';
  d.style.opacity = 1;
  d.value = 'Comparing '
    + x.length + n + '\n (Click to view comparison)';
  d.onclick = function() {
    d.style.opacity = 0;
    d3.select('#profile').node().scrollIntoView({
      behavior: "smooth", // or "auto" or "instant"
      block: "start" // or "end"
    });
  }
  schoolProfile.reset();
  // true to block scroll
  schoolProfile.load(x, schoolProfile.currentView.currentSchoolYear, true);
}
/**
 * @brief Reset.
 */
schoolProfile.reset = function() {
  schoolProfile.html = { // list of elements that will be populated
    filters: { // html elements for filtering
      lineCompare: [],
      barChart: [],
    },
  }
  schoolProfile.s = {
    dems: ['AA', 'AP', 'AS', 'HI', 'HP', 'MR', 'NA','NM','WH'],
    demsFull: ['African American', 'Asian/Pacific Islander (Retired)',
    'Asian', 'Hispanic', 'Hawaiian/Pacific Islander', 'Multi-Racial',
    'Not Available','Native American/Alaskan','White'],
  }
  schoolProfile.currentView = {
    schoolComparison: false, // set to true if multi-compare, used in onclick line chart
    currentSchoolArray: [], // tracks current school's being shown
    currentSchoolArrayObj: {}, // fast dictionary lookup
    currentSchoolYear: 2019, // fast dictionary lookup
  }
  schoolProfile.model = { // hold a model of schoolProfile
    schoolComparison: {
      searchResults: [],
      searchResultsObj: {},
    }
  }
}

/**
 * @brief Make the profile.
 */
schoolProfile.init = function(schoolArray, year) {
  // Some intitial output
  var d = d3.select('#profile');
  schoolProfile.html.profileNotation = d.append('div');
  schoolProfile.html.profileNotation.node().style.float = 'left';
  schoolProfile.html.title
    = schoolProfile.html.profileNotation.append('h2');
  //d.append('br').node().style.clear = 'both'; // Clear container floats
  schoolProfile.html.schoolOverviewNotation
    = schoolProfile.html.profileNotation.append('fieldset');
  schoolProfile.html.profileNotation.append('br');
  schoolProfile.html.profileNotation.append('br');
  schoolProfile.html.barNotation
    = schoolProfile.html.profileNotation.append('fieldset');
  //~ schoolProfile.html.barExplanatory
    //~ = d.append('fieldset');
  //~ d.append('br').node().style.clear = 'both'; // Clear container floats
  schoolProfile.html.barContainer = d.append('div');
  schoolProfile.html.lineContainer = d.append('div');
  schoolProfile.html.barContainer.node().className = 'profile-container';
  schoolProfile.html.lineContainer.node().className = 'profile-container';
  schoolProfile.html.schoolOverviewNotation.node().className = 'filters';
  schoolProfile.html.barNotation.node().className = 'filters';
  //~ schoolProfile.html.title.style().marginTop = '60px';
  //~ d.append('br').node().style.clear = 'both'; // Clear container floats
  //~ schoolProfile.html.barContainer.append('br');
  //~ schoolProfile.html.barNotation.node().style.clear = 'both';
  
  if (schoolArray.length == 1) {
    // Single school
    var id = schoolArray[0];
    try {
      var m = model.data.allSchools[year][id];
      if (model.data.allSchools[year][id]['School Name']) {
        // Check if breaking try 
      }
    } catch(e) {
      alert('Could not find school with ID ' + id + ' in year ' + year);
      return;
    }
    schoolProfile.html.title.text(m['School Name']);
    var p = schoolProfile.html.schoolOverviewNotation;
    p.text(
      'School ID: ' + m['School ID']
    );
    // More details on single school
    if (model.data.byId[ m['School ID'] ]) {
      var n = model.data.byId[ m['School ID'] ];
      p.node().innerText +=
        '\n' + n['Address'] + ', ' + n['Zip']
        + ', ' + n['Phone'] + ' ';
      // Append more details
      var inp = p.append('input').node();
      inp.type = 'button';
      inp.value = ' More details ';
      inp.title = 'More details about this school';
      inp.cpsData = model.data.byId[m['School ID']];
      inp.onclick = function() {
        schoolProfile.lightbox(function(divLboxContainer) {
          //console.log(this);
          // Bind to preserve reference to this (button)
          var c = divLboxContainer.container;
          var s = model.data.byId[
            schoolProfile.currentView.currentSchoolArray[0]
          ];
          c.append('h4').text('All CPS schema details for ' + s['School'] );
          c.append('h5').text('(Click background to close this dialog box.)');
          
          // Add some details.
          for (var i in s) {
            var d1 = c.append('span').text(i + ': ');
            var d2 = c.append('span').text(s[i]);
            d1.node().style.fontWeight = 'bold';
            c.append('br');
          }
        }.bind(this));
      }
    }
    // Make a compare
    p.append('br');
    var inp = p.append('input').node();
    inp.type = 'button';
    inp.value = ' Add to a comparison ';
    inp.title = 'Make a comparison between multiple schools';
    inp.onclick = function() {
      schoolProfile.lightbox((schoolProfile.schoolCompareLightbox).bind(this));
    }
  } else {
    // Mutli-compare
    schoolProfile.html.title.text('School Comparison');
    var p = schoolProfile.html.schoolOverviewNotation;
    p.html(
      'Comparing ' + schoolArray.length + ' schools<br />'
    );
    var inp = p.append('input').node();
    inp.type = 'button';
    inp.value = ' Edit comparison ';
    inp.title = 'Edit comparison of multiple schools';
    inp.onclick = function() {
      schoolProfile.lightbox((schoolProfile.schoolCompareLightbox).bind(this));
    }
  }
  //~ schoolProfile.html.barExplanatory.node().style.fontSize = '0.8em';
  //~ schoolProfile.html.barExplanatory.text('* Demographic counts include PK-8 totals');
  // click a line
  //~ var cal = '';
  //~ if (schoolArray.length > 1) { 
    //~ cal = 'Click bar to narrow<br/>'
  //~ }
  // info
  //~ schoolProfile.html.barExplanatory.html(cal+'* Demographic counts include PK-8 totals');
  
  // Build charts
  schoolProfile.barDemographics(schoolArray, year);
  schoolProfile.lineCompare(schoolArray);

}

/**
 * @brief A dialog to add / remove schools to compare.
 * 
 * @extended
 *    Left side: Add to compare
 *    Right side: Remove from compare
 * 
 * @param divLboxContainer HTMLObject that is the lightbox container.
 */
schoolProfile.schoolCompareLightbox = function(divLboxContainer) {
  var c = divLboxContainer.container;
  var lb = { // Will hold all lightbox html elements
    container: divLboxContainer, // reference to main container
    // left
    text: null,
    filterAll: null,
    filterHS: null,
    searchResults: null,
    addResults: null,
    //~ dropdownPreselect: null,
    // right
    selectedResults: null,
    clearSelected: null,
  };
  schoolProfile.html.lightbox = lb;
  
  // Reset if existing
  c.node().innerText = '';
  
  // Top border
  c.append('hr').node().setAttribute('style',
    'width:100%;border-color:#ccc;margin-bottom:10px;margin-top:10px;'
  );
  
  var d1, d2;
  d1 = c.append('div');
  d2 = c.append('div');
  d1.node().className = 'profile-lightbox-compare-container';
  d2.node().className = 'profile-lightbox-compare-container';
  d1.node().style.borderRight = '1px solid #ccc';
  
  // left
  //~ var lg = fs.append('legend').node();
  //~ lg.innerText = 'All or HS';
  // Text input
  var inp = d1.append('input');
  inp.node().placeholder = 'Enter a school to filter by school name';
  inp.node().id = 'profile-lightbox-compare-search';
  inp.node().addEventListener('keyup', function(e) {
    schoolProfile.schoolCompareLightbox_searchResultSchools();
  });
  inp.node().focus(); // Set focus
  lb.text = inp;
  //~ fs.append('br');
  //~ // Nearest x
  //~ var inp = fs.append('select');
  //~ var sopts = [
    //~ '-- Preselections --',
    //~ 'Nearest 5 schools',
    //~ 'Nearest 10 schools',
    //~ 'Nearest 20 schools',
    //~ 'Nearest 5 HS',
    //~ 'Nearest 10 HS',
    //~ 'Nearest 20 HS',
    //~ 'Largest 5 CPS schools',
    //~ 'Largest 10 CPS schools',
    //~ 'Largest 20 CPS schools',
    //~ 'Largest 5 CPS HS',
    //~ 'Largest 10 CPS HS',
    //~ 'Largest 20 CPS HS',
    //~ 'Highest 5 SAT (2018)',
    //~ 'Highest 10 SAT (2018)',
    //~ 'Highest 20 SAT (2018)',
  //~ ];
  //~ for (var i in sopts) {
    //~ var o = inp.append('option');
    //~ o.node().innerText = sopts[i];
    //~ o.node().value = sopts[i];
  //~ }
  //~ inp.on('change', schoolProfile.schoolCompareLightbox_searchResultSchools);
  //~ lb.dropdownPreselect = inp;
  // Add radio to display HS only
  // opts 3: include all schools or only HS
  var fs = d1.append('fieldset');
  fs.node().className = 'filters';
  var lg = fs.append('legend').node();
  lg.innerText = 'All or HS';
  var inp = fs.append('input');
  inp.node().id = 'inp-allorhs-all';
  inp.node().type = 'radio';
  inp.node().name = 'inp-allorhs';
  lb.filterAll = inp;
  inp.on('change', schoolProfile.schoolCompareLightbox_searchResultSchools);
  var lab = fs.append('label').node();
  lab.htmlFor = inp.node().id;
  lab.innerText = 'All schools';
  inp.checked = false;
  lab.className = 'hasPointer paddedInputs';
  inp.className = 'hasPointer paddedInputs';
  var inp = fs.append('input');
  inp.node().id = 'inp-allorhs-hs';
  inp.node().type = 'radio';
  inp.node().checked = true;
  inp.node().name = 'inp-allorhs';
  lb.filterHS = inp;
  inp.on('change', schoolProfile.schoolCompareLightbox_searchResultSchools);
  var lab = fs.append('label').node();
  lab.htmlFor = inp.node().id;
  lab.innerText = 'HS only';
  lab.className = 'hasPointer paddedInputs';
  inp.className = 'hasPointer paddedInputs';
  // Result div
  var d = d1.append('div');
  d.node().className = 'profile-lightbox-compare-results';
  lb.searchResults = d;
  // Schools to div
  schoolProfile.schoolCompareLightbox_searchResultSchools();
  // Add all schools shown
  var inp = d1.append('input');
  inp.node().type = 'button';
  inp.node().value = 'Add all schools shown';
  inp.node().setAttribute('style', 'margin-left:35%;width:30%;margin-top:4px;');
  lb.addResults = inp;
  inp.on('click', function() {
    var sr = schoolProfile.model.schoolComparison.searchResults;
    var sa = schoolProfile.currentView.currentSchoolArray;
    var sao = schoolProfile.currentView.currentSchoolArrayObj;
    for (var i in sr) {
      var id = sr[i]['School ID'];
      if (!sao[id]) {
        sa.push(id);
        sao[id] = true;
      }
    }
    // Redraw
    schoolProfile.schoolCompareLightbox_searchResultSchools();
    schoolProfile.schoolCompareLightbox_rightPaneResults();
  });
  
  // right
  var x = d2.append('div');
  x.text('Click on a school below to remove from comparison');
  x.node().style.marginLeft = '5%';
  // Present selection
  var d = d2.append('div');
  d.node().className = 'profile-lightbox-compare-results';
  lb.selectedResults = d;
  // Clear all
  var inp = d2.append('input');
  inp.node().type = 'button';
  inp.node().value = 'Remove all selected schools';
  inp.node().setAttribute('style',
    'margin-left:35%;width:30%;margin-top:4px;'
  );
  lb.clearSelected = inp;
  inp.on('click', function() {
    schoolProfile.model.schoolComparison.searchResults = [];
    schoolProfile.model.schoolComparison.searchResultsObj = {};
    schoolProfile.currentView.currentSchoolArray = [];
    schoolProfile.currentView.currentSchoolArrayObj = {};
    schoolProfile.currentView.schoolComparison = false; // Basic re-init of profile
    // Redraw
    schoolProfile.schoolCompareLightbox_searchResultSchools();
    schoolProfile.schoolCompareLightbox_rightPaneResults();
  });
  
  // Fill right pane (initial)
  schoolProfile.schoolCompareLightbox_rightPaneResults();
  
  // Compare button & hr
  c.append('hr').node().setAttribute('style', 'width:100%;border-color:#ccc;display:inline-block;');
  var inp = c.append('input');
  inp.node().setAttribute('style',
    'width:80%;margin-left:10%;font-size:1.4em;'
  );
  inp.node().type = 'button';
  inp.node().value = 'Compare selected schools';
  inp.on('click', function() {
    this.disabled = true;
    this.value = ' ... loading comparison ... ';
    setTimeout(function() { // Timeout forces redraw of this value
      d3.select('#profile-lightbox').node().click();
      schoolProfile.load(schoolProfile.currentView.currentSchoolArray, 2019);
    }, 100);
  });
}

/**
 * @brief Build right pane lightbox, selected results field.
 * 
 * @extended
 *    - Utilizes and builds off of
 *      schoolProfile.currentView.currentSchoolArray.
 */
schoolProfile.schoolCompareLightbox_rightPaneResults = function() {
  // get vars
  // For text, only word chars are needed. No digits, spaces, etc.
  var lb = schoolProfile.html.lightbox;
  var selectedResults = lb.selectedResults;
  selectedResults.node().innerText = ''; // clear any previous results
  
  for (var i in schoolProfile.currentView.currentSchoolArray) {
    var id = schoolProfile.currentView.currentSchoolArray[i];
    // May be missing some, so add to try.
    // i.e., current schools array may contain IDs from any number
    // of years.
    try {
      var s = model.data.allSchools[2019][id]; // get school
      if (s['School Name'] == '' || s['School Name'].indexOf('District') != -1)
        continue;
      selectedResults.node().appendChild(
        schoolProfile.schoolCompareLightbox_addRow('right', s)
      );
    } catch(e) {
      console.log('WARN: Could not find school with id ', id);
    }
  }
}
/**
 * @brief Build left pane lightbox search results field.
 * 
 * @extended
 *    - For text, only word chararacters are needed.
 *      No digits, spaces, etc.
 *    - Only uses 2019 schools. Does not add any schools previous
 *      or closed.
 */
schoolProfile.schoolCompareLightbox_searchResultSchools = function() {
  // get vars
  // For text, only word chars are needed. No digits, spaces, etc.
  var lb = schoolProfile.html.lightbox;
  var text = lb.text.node().value.toUpperCase().replace(/[^\w]/g, '');
  var allOrHs = (lb.filterAll.node().checked) ? 'allSchools' : 'highSchools';
  var searchResults = lb.searchResults;
  //~ var preselect = lb.dropdownPreselect;
  searchResults.node().innerText = ''; // clear any previous results
  // Reset global vars
  schoolProfile.model.schoolComparison.searchResults = [];
  schoolProfile.model.schoolComparison.searchResultsObj = {};
  
  //~ // If selector is on
  //~ if (preselect.selectedIndex != 0) {
    //~ schoolProfile.processPreselect();
  //~ }
  
  for (var id in model.data[allOrHs][2019]) {
    var s = model.data[allOrHs][2019][id]; // get school
    if (s['School Name'] == '' || s['School Name'].indexOf('District') != -1)
      continue;
    if (schoolProfile.currentView.currentSchoolArrayObj[id]) {
      // already selected
      // but show filtered only
      if (s['SchoolNameForSearches'].indexOf(text) != -1) {
        var d = searchResults.append('div');
        d.text(
          s['School Name'] + ' (already selected)'
        );
        d.node().className = 'profile-lightbox-compare-searchResultDiv';
      }
      continue;
    }
    if (text != '') {
      // show filtered only
      if (s['SchoolNameForSearches'].indexOf(text) != -1) {
        searchResults.node().appendChild(
          schoolProfile.schoolCompareLightbox_addRow('left', s)
        );
        schoolProfile.model.schoolComparison.searchResults.push(s);
        schoolProfile.model.schoolComparison.searchResultsObj[s['School ID']] = s;
      }
    } else {
      // show all
      searchResults.node().appendChild(
        schoolProfile.schoolCompareLightbox_addRow('left', s)
      );
      schoolProfile.model.schoolComparison.searchResults.push(s);
      schoolProfile.model.schoolComparison.searchResultsObj[s['School ID']] = s;
    }
  }
}
/**
 * 
 * @param leftOrRight String to denote if adding to left or right pane.
 * @param schoolObj Object representing row of school data from model.
 * 
 * @usageExample
 *     schoolProfile.schoolCompareLightbox_addRow('left');
 */
schoolProfile.schoolCompareLightbox_addRow = function(leftOrRight, schoolObj) {
  var d = document.createElement('div');
  d.className = 'profile-lightbox-compare-searchResultDiv';
  d.innerText = schoolObj['School Name'];
  d.side = leftOrRight;
  d.so = schoolObj;
  d.addEventListener('click', function() {
    var id = this.so['School ID'];
    if (d.side == 'left') {
      // left side (add)
      schoolProfile.currentView.currentSchoolArray.push(id);
      schoolProfile.currentView.currentSchoolArrayObj[id] = true;
    } else {
      // right side (remove)
      var tmp = [];
      for (var i in schoolProfile.currentView.currentSchoolArray) {
        var idx = schoolProfile.currentView.currentSchoolArray[i];
        if (idx == id)
          continue;
        tmp.push(idx);
      }
      schoolProfile.currentView.currentSchoolArray = tmp;
      delete schoolProfile.currentView.currentSchoolArrayObj[id];
    }
    // Redraw
    schoolProfile.schoolCompareLightbox_searchResultSchools();
    schoolProfile.schoolCompareLightbox_rightPaneResults();
  }, false);
  return d;
}

/**
 * @brief An HTML lightbox popup for sub-querying.
 * 
 * @param lfunc Function to run within the lightbox.
 * 
 * @callback Fires cb function with dark div container as parameter.
 */
schoolProfile.lightbox = function(lfunc) {
  // Dark div
  var b1 = d3.select('body').append('div');
  b1.node().id = 'profile-lightbox';
  var b2 = d3.select('body').append('div');
  b2.node().id = 'profile-lightbox-container';
  b1.container = b2;
  b1.node().container = b2;
  b1.on("click", function() {
    document.body.removeChild(this.container.node());
    document.body.removeChild(this);
  });
  lfunc(b1);
}

/**
 * @brief Make line graph.
 * 
 * @implementation
 *    checkbox for dems
 *    mock-select field checkboxes for schools
 *    order select field for schools by distance to selected school
 * 
 * @param schoolArray Array of school IDs to load
 * @param demoArray Array of demographies to load
 *        (full, e.g. "Hispanic" not "HI")
 */
schoolProfile.lineCompare = function(schoolArray, demoArray) {
  // Reset any previous
  schoolProfile.html.filters.lineCompare = [];
  schoolProfile.html.lineContainer.selectAll('*').remove();
  
  schoolProfile.html.lineContainer.append('h3').text('Population Chart');
  
  var dlcf = schoolProfile.html.lineContainer.append('div');
  dlcf.node().id = 'div-line-compare-filters';
  var dems = ['AA', 'AP', 'AS', 'HI', 'HP', 'MR', 'NA','NM','WH'];
  var demsFull = ['African American', 'Asian/Pacific Islander(Retired)',
    'Asian', 'Hispanic', 'Hawaiian/Pacific Islander', 'Multi-Racial',
    'Not Available','Native American/Alaskan','White'];
  if (!demoArray || !demoArray.length) {
    demoArray = dems;
  }
  var schoolsObj = {}; // Quick lookup for selected schools
  var demsObj = {}; // Quick lookup for selected dems
  for (var i in demoArray) {
    demsObj[demoArray[i]] = true; // e.g., demsOjb['Hispanic'] = true;
  }
  for (var i in schoolArray) {
    schoolsObj[schoolArray[i]] = true; // e.g., demsOjb['Hispanic'] = true;
  }
  
  // opts 1
  // Select demos
  // Only in comparison
  if (schoolArray.length > 1) {
    dlcf.append('fieldset').node().id = 'lc-select-dems';
    var lcd = d3.select('#lc-select-dems');
    lcd.node().className = 'filters';
    var lg = lcd.append('legend').node();
    lg.innerText = 'Select Demographics';
    // Build fields
    for (var i in dems) {
      var inp = lcd.append('input').node();
      inp.id = 'inp-'+dems[i];
      inp.type = 'checkbox';
      inp.checked = true;
      var lab = lcd.append('label').node();
      lab.htmlFor = inp.id;
      lab.innerText = dems[i];
      inp.checked = demsObj.hasOwnProperty(dems[i]);
      lab.className = 'hasPointer paddedInputs';
      inp.className = 'hasPointer paddedInputs';
      inp.title = lab.title = demsFull[i];
      inp.schoolArray = schoolArray; // Temp. school array holder
      schoolProfile.html.filters.lineCompare.push(inp);
      inp.onclick = function() {
        schoolProfile.drawLine(this.schoolArray);
      }
      if (i % 4 == 0 && i > 0) {
        lcd.append('br')
      }
    }
    var inp = lcd.append('input').node();
    inp.id = 'inp-dems-all';
    inp.type = 'button';
    inp.value = 'ALL';
    inp.style.marginRight = '2px';
    inp.schoolArray = schoolArray;
    inp.onclick = function() {
      for (var i in schoolProfile.html.filters.lineCompare) {
        var cb = schoolProfile.html.filters.lineCompare[i];
        cb.checked = true;
        schoolProfile.drawLine(this.schoolArray);
      }
    }
    var inp = lcd.append('input').node();
    inp.id = 'inp-dems-none';
    inp.type = 'button';
    inp.value = 'NONE';
    inp.schoolArray = schoolArray;
    inp.onclick = function() {
      for (var i in schoolProfile.html.filters.lineCompare) {
        var cb = schoolProfile.html.filters.lineCompare[i];
        cb.checked = false;
        schoolProfile.drawLine(this.schoolArray);
      }
    }
    // Filter if rising or falling
    
  } // End comparison
  
  // Add a spacer on multi
  if (schoolArray.length > 1) {
    //~ dlcf.append('br').node().style.clear = 'both'; // Add spacer
    //~ dlcf.append('br');
  }
  
  // Key for rising / fall trend
  // Simple color scale.
  //    if (x >= 0.75) {
  //      lineColor = '#006d2c';
  //    } else if (x >= 0.5) {
  //      lineColor = '#74c476';
  //    } else if (x >= 0.25) {
  //      lineColor = '#fb6a4a';
  //    } else { // >0
  //      lineColor = '#a50f15';
  //    }
  var lcd = dlcf.append('fieldset');
  lcd.node().className = 'filters';
  var lg = lcd.append('legend');
  lg.node().innerText = 'Trends Key';
  var risDisp1 = lcd.append('div');
  risDisp1.node().setAttribute('style',
    'display:inline-block;background-color:#2c7bb6;width:10px;height:10px;margin-right:2px;'
  );
  var risDisp2 = lcd.append('div');
  risDisp2.node().setAttribute('style',
    'display:inline-block;background-color:#abd9e9;width:10px;height:10px;margin-right:2px;'
  );
  var ris = lcd.append('div');
  ris.text('rising');
  ris.node().setAttribute('style',
    'display:inline-block;height:10px;margin-right:2px;'
  );
  var falDisp1 = lcd.append('div');
  falDisp1.node().setAttribute('style',
    'display:inline-block;background-color:#fdae61;width:10px;height:10px;margin-right:2px;'
  );
  var falDisp2 = lcd.append('div');
  falDisp2.node().setAttribute('style',
    'display:inline-block;background-color:#d7191c;width:10px;height:10px;margin-right:2px;'
  );
  var fal = lcd.append('div');
  fal.text('falling');
  fal.node().setAttribute('style',
    'display:inline-block;height:10px;margin-right:2px;'
  );
  // Click if multi
  if (schoolArray.length > 1) {
    risDisp1.style('cursor', 'pointer');
    risDisp2.style('cursor', 'pointer');
    falDisp1.style('cursor', 'pointer');
    falDisp2.style('cursor', 'pointer');
    var d = lcd.append('div')
    d.text('Click to filter');
    d.style('width', '99%');
    d.style('text-align', 'center');
    risDisp1.on('click', function() {
      schoolProfile.drawLine(schoolProfile.currentView.currentSchoolArray, 1);
    });
    risDisp2.on('click', function() {
      schoolProfile.drawLine(schoolProfile.currentView.currentSchoolArray, 2);
    });
    falDisp1.on('click', function() {
      schoolProfile.drawLine(schoolProfile.currentView.currentSchoolArray, 3);
    });
    falDisp2.on('click', function() {
      schoolProfile.drawLine(schoolProfile.currentView.currentSchoolArray, 4);
    });
  }
  
  // If multi-school compare, then add text to click line to see school
  // separately.
  if (schoolArray.length > 1) {
    var p = dlcf.append('fieldset');
    p.html('Click chart line<br/>to view school');
    p.node().className = 'filters';
  }
  
  // opts 2: split or total the demographics
  // opts 3: include all schools or only HS
  
  // opts 4: selected schools
  // opts 4.1: add / remove schools to selected
  // opts 4.2: select "nearest 5/10/20" Hs/All for compare
  // opts 4.2: select "top 5/10/20" Hs/All in city for compare
  
  // opts 5: select type of trend line, e.g. interpolated
  // opts 6: opts for future trend line, e.g. ML, Lin. Regress.
  // opts 7: Population split by grade
  
  // opts 8: scoring data
  
  // clear floats
  dlcf.append('br').node().style.clear = 'both';
  
  schoolProfile.drawLine(schoolArray);
}

/**
 * @brief Return the sum of currently selected demos for given school.
 * 
 * @param schoolObj Object representing school in model.data.allSchools.
 */
schoolProfile.lineCompareSumDemos = function(schoolObj) {
  //schoolProfile.html.filters.lineCompare
  if (!schoolObj.demography) {
    return 0;
  }
  var sum = 0;
  for (var i in schoolProfile.html.filters.lineCompare) {
    // Get the input
    var inp = schoolProfile.html.filters.lineCompare[i];
    // Add to sum
    if (inp.checked) {
      var key = schoolProfile.s.demsFull[i] + 'No';
      sum += schoolObj.demography[key];
      if (!schoolObj.demography.hasOwnProperty(key)) {
        console.log('\n',schoolObj.demography);
        console.log(key, inp, schoolObj.demography[key]);
        console.log('missing dem key', key);
        alert('missing dem. key (school-profile.js)');
      }
    }
  }
  return sum;
}

/**
 * @brief Make line.
 * 
 * @extended
 *    If multiple schools, then draws only the total pop.
 *    in all schools, with option to show only selected demographies.
 *    If single school, then draws total pop. of school plus
 *    pop. of every demographic.
 *    Tri-color finder: http://colorschemedesigner.com/csd-3.5/
 */
schoolProfile.drawLine = function(schoolArray, filterTrend) {
  
  // total pop.
  var lineGroups = [ // Array of line groups
    /*
    [ // ex. line group 1
      {
        'x': 1,
        'y': 5
      }, {
        'x': 20,
        'y': 20
      }
    ]
    , ...
    */
  ];
  
  var max = 0;
  if (schoolArray.length > 1) {
    // Multi-school
    for (var i in schoolArray) {
      var id = schoolArray[i];
      var nextLine = [];
      lineGroups.push(nextLine);
      for (var year in model.data.allSchools) {
        if (model.data.allSchools[year][id]
            && model.data.allSchools[year][id].total) {
          var t = schoolProfile.lineCompareSumDemos(
            model.data.allSchools[year][id]
          );
          nextLine.push({
            year: year,
            total: t,
            school: model.data.allSchools[year][id]['School Name'],
            id: id
          });
          max = (t > max) ? t : max;
        } else {
          // School must be closed ??
        }
      }
    }
  } else {
    // Single school
    var id = schoolArray[0];
    var byDemo = {
      total: [] // total pop.
      // ... all demos to follow
    };
    for (var year in model.data.allSchools) {
      if (model.data.allSchools[year][id]
          && model.data.allSchools[year][id].total) {
        // Update max
        var t = model.data.allSchools[year][id].total;
        max = (t > max) ? t : max;
        // Total
        byDemo['total'].push({
          year: year,
          // "Total" based on 20th day file total.
          total: model.data.allSchools[year][id].total,
          school: model.data.allSchools[year][id]['School Name']
        });
        if (model.data.allSchools[year][id].demography) {
          // Loop demos
          // School ID is null here b/c it is a single school view already,
          // so there is no need for school lookup.
          for (var demo in model.data.allSchools[year][id].demography) {
            var num = model.data.allSchools[year][id].demography[demo];
            if (/No$/.exec(demo)) {
              if (!byDemo.hasOwnProperty(demo)) {
                byDemo[demo] = [
                  {
                    year: year,
                    total: num,
                    school: demo.replace(/No$/, ''),
                    id: null,
                  }
                ];
              } else {
                byDemo[demo].push({
                  year: year,
                  total: num,
                  school: demo.replace(/No$/, ''),
                  id: null,
                });
              }
            }
          }
        }
      } else {
        // School must be closed ??
      }
    }
    for (var demo in byDemo) {
      lineGroups.push(byDemo[demo]);
    }
  }
  
  var lineData = lineGroups;
  
  // Reset container
  schoolProfile.html.lineContainer.selectAll('svg').remove('*');
  
  var vis = schoolProfile.html.lineContainer.append("svg");
  var WIDTH = 700;
  var HEIGHT = 400;
  vis.attr('width', WIDTH);
  vis.attr('height', HEIGHT);
  
  var MARGINS = {
    top: 20,
    right: 280,
    bottom: 20,
    left: 100
  }
  
  vis.append("rect")
    .attr("width", WIDTH - MARGINS.left - MARGINS.right)
    .attr("height", HEIGHT)
    .attr("fill", "#ffffbf")
    .attr("x", MARGINS.left)
    .attr("y", - MARGINS.top);
  
  var xRange = d3.scale.linear()
    .range([MARGINS.left, WIDTH - MARGINS.right])
    .domain( [2014, 2019] );
  // Log would be 1) d3.scale.log() and 2) .domain([0.1, max])
  var yRange = d3.scale.linear()
    .range([HEIGHT - MARGINS.top, MARGINS.bottom])
    .domain([-20, max]);

  var xAxis = d3.svg
    .axis()
    .scale(xRange)
    .ticks(5)
    .orient("bottom")
    .tickFormat(function (d) {
      if (d == 2019) return "18-19";
      else if (d == 2018) return "17-18";
      else if (d == 2017) return "16-17";
      else if (d == 2016) return "15-16";
      else if (d == 2015) return "14-15";
      else if (d == 2014) return "13-14";
    })
    .innerTickSize(-HEIGHT)
    .outerTickSize(0);
  var yAxis = d3.svg.axis()
    .scale(yRange)
    .tickSize(5)
    .orient("left")
    .tickSubdivide(true)
    .tickFormat(function (d) {
      if (d < 0) return '';
      return d;
    });

  vis.append("svg:g")
    .attr("class", "network-axis")
    .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
    .call(xAxis);
  
  vis.append("g") // Axis label
    .attr("class", "profile-axis")
    .append("text")
    .attr("x", ((WIDTH-MARGINS.right) / 2) + 40)
    .attr("y", HEIGHT + MARGINS.bottom - 20)
    .style("text-anchor", "center")
    .text("Year");

  vis.append("svg:g")
    .attr("class", "network-axis")
    .attr("transform", "translate(" + (MARGINS.left) + ",0)")
    .call(yAxis)
    .append("text") // Add axis label
      .attr("transform", "rotate(-90)")
      .attr("y", -50) // reverse due to rotate (y is x, x is y)
      .attr("x", -HEIGHT/2)
      .style("text-anchor", "end")
      .text("Number of Students");

  // Set linear reg.
  for (i in lineData) {
    var line = lineData[i];
    var yval = line.map(function(d) { return d.total; });
    var xval = line.map(function(d) { return parseInt(d.year, 10); });
    lineData[i].reg = profile.linearRegression(yval, xval);
  }
  
  // Extent of lin. regressions. Useful for determining color min / max.
  // Some slopes seen while testing:
  //  -27, 55
  //  -162, 92
  // var extent = d3.extent(lineData, function(d){ return d.reg.slope; });
  // console.log('Extent of lin. reg. is', extent);
  
  // Label and anchor arrays for Labeler
  var larray = [];
  var aarray = [];
  
  // Draw lines
  for (i in lineData) {
    var line = lineData[i];

    // lineColor
    // if x > 0, x = 0.5 to 1
    // if x < 0, x = 0 to 0.5
    //var x = line.reg.slope / 162; // Assumes 162 is a rather high slope in the data set.
    var x = line.reg.slope / 160; // Assumes 162 is a rather high slope in the data set.
    x = (x > 1) ? 1 : x;
    x = (x < -1) ? -1 : x;
    x = x / 2;
    x += 0.5;
    
    // The middle is impossible to see (too light).
    // So add some to avoid the middle.
    //~ x *= (x < 0.5) ? 0.05 : 1.05;
    
    // A quantitative scale of colors shows minute difference in trend.
    // var lineColor = d3.interpolateBrBG(x);
    
    // Simple scale, 2 up, 2 down. Consider 0 as up.
    // http://colorbrewer2.org/#type=diverging&scheme=RdYlBu&n=5
    var lineColor;
    if (x >= 0.55) {        // rising
      lineColor = '#2c7bb6';
    } else if (x >= 0.5) {
      lineColor = '#abd9e9';
    } else if (x >= 0.45) { // falling
      lineColor = '#fdae61';
    } else { // >0
      lineColor = '#d7191c';
    }
    if (filterTrend) {
      if (filterTrend == 1 && x < 0.55) {
        continue;
      }
      if (filterTrend == 2
        && (x > 0.55 || x < 0.5)) {
        continue;
      }
      if (filterTrend == 3
        && (x > 0.5 || x < 0.45)) {
        continue;
      }
      if (filterTrend == 4 && x > 0.45) {
        continue;
      }
    }
    
    var lineFunc = d3.svg.line()
      .x(function (d) {
        return xRange(parseInt(d.year, 10));
      })
      .y(function (d) {
        // log scale
        //    var l = (d.total > 0) ? d.total : 0.0000001;
        //    return yRange(Math.log(l));
        return yRange(d.total);
      })
      .interpolate('linear');
    
    var lineTitle = [];
    for (var i=0; i<line.length; i++) {
      lineTitle.push(line[i].total);
    }
    
    var p = vis.append("svg:path")
      .attr("d", lineFunc(line))
      .attr("stroke", lineColor)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("class", "hasPointer")
      .attr("schoolName", line[0].school)
      .attr("id", line[0].id)
      .attr("lTitle", lineTitle.join(','))
      .attr("lastYear", line[line.length - 1].year) // Attr to track last year of data (if closed)
      .attr("lSlope", Math.round(line.reg.slope * 10) / 10)
      .on("mouseover", function(d) {
        this.setAttribute('stroke-width', 6);
        var idrl = '#paRightLabels'
          + this.getAttribute('schoolName').replace(/[^\w]/g, '-');
        d3.select(idrl).transition()
          .duration(80)
          .style('font-weight', 'bold')
          .style('font-size', '12px');
        var n = this.getAttribute('schoolName') + '<br/>'
          + 'Slope: '
          + this.getAttribute('lSlope');// + '<br/>'
          //~ + 'Pop.: ' + this.getAttribute('lTitle')
        divToolTip.html(n)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        divToolTip.transition()
          .duration(80)
          .style('opacity', 0.95)
          .style('border', '1px solid #333');
      })
      .on("mouseout", function(d) {
        this.setAttribute('stroke-width', 2);
        divToolTip.transition()
          .duration(100)
          .style('opacity', 0)
          .style('border', 'none');
        var idrl = '#paRightLabels'
          + this.getAttribute('schoolName').replace(/[^\w]/g, '-');
        //~ d3.select(idrl).node().sizeInit = d3.select(idrl).node().style.fontSize;
        d3.select(idrl).transition()
          .duration(80)
          .style('font-weight', 'normal')
          .style('font-size', d3.select(idrl).node().fontSizeInit);
      })
      .on("click", function(d) {
        // Opens single school for review
        if (schoolProfile.currentView.schoolComparison == true) {
          schoolProfile.load(
            [this.getAttribute('id')],
            this.getAttribute('lastYear')
          );
        } else {
          // Nothing?
        }
      });
    // Right side line labels
    var finalY = yRange(line[line.length-1].total);
    // Add label.
    larray.push({
      x: WIDTH-MARGINS.right+3,
      y: finalY,
      name: line[0].school,
    });
    aarray.push({
      x: WIDTH-MARGINS.right+3,
      y: finalY,
      r: 0.01
    });
  }
  
  // Basic label
  // Draw labels
  var labels = vis.selectAll(".paRightLabelsLineChart")
    .data(larray)
    .enter()
    .append("text")
    .attr("class", "profile-axis paRightLabelsLineChart")
    //~ .attr("transform",
      //~ "translate(" + (WIDTH-MARGINS.right+3) + "," + finalY + ")")
    .attr("x", function(d) { return (d.x); })
    .attr("y", function(d) { return (d.y); })
    .attr("dy", ".35em")
    .attr("text-anchor", "start")
    .style("fill", "steelblue")
    .attr("id", function(d) {
        var idrl = 'paRightLabels' + d.name.replace(/[^\w]/g, '-');
        return idrl;
    })
    .text(function(d) {
      // split into no more than 20 chars per name
      //~ var s = d.name.replace(/(.{10})/g, "$1<br/>");
      s = d.name.split(' ').join('\n');
      return s;
    })
    .on("mouseover", function(d) {
    });
  
  // W/H
  // Scale the size of text based on # of labels, to keep it from
  // exploding over the chart.
  // Set temporary key fontSizeInit to track size.
  var idx = 0;
  labels.each(function() {
    if (larray.length > 30) {
      this.style.fontSize = (30 / larray.length) + 'em';
      this.fontSizeInit = (30 / larray.length) + 'em';
    }
    larray[idx].width = this.getBBox().width;
    larray[idx].height = this.getBBox().height;
    idx += 1;
  });
  
  //~ var links = vis.selectAll(".link")
    //~ .data(larray)
    //~ .enter()
    //~ .append("line")
    //~ .attr("class", "link")
    //~ .attr("x1", function(d) { return (d.x); })
    //~ .attr("y1", function(d) { return (d.y); })
    //~ .attr("x2", function(d) { return (d.x); })
    //~ .attr("y2", function(d) { return (d.y); })
    //~ .attr("stroke-width", 1)
    //~ .attr("stroke", "gray");
    
  // Labeler
  d3.labeler()
    .label(larray)
    .anchor(aarray)
    .width(WIDTH)
    .height(HEIGHT)
    .start(400); // # of passes
  
  labels
    .transition()
    .duration(1600)
    .attr("x", function(d) { return (d.x); })
    .attr("y", function(d) { return (d.y); });

  //~ links
    //~ .transition()
    //~ .duration(800)
    //~ .attr("x2",function(d) { return (d.x); })
    //~ .attr("y2",function(d) { return (d.y); });
}

/**
 * @brief Linear regression code
 * 
 * @reference
 *    This code makes reference to a stack overflow thread:
 *    https://stackoverflow.com/questions/20507536/d3-js-linear-regression
 */
profile.linearRegression = function(y, x) {
  var lr = {};
  var n = y.length;
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var sum_yy = 0;
  for (var i = 0; i < y.length; i++) {
    sum_x += x[i];
    sum_y += y[i];
    sum_xy += (x[i]*y[i]);
    sum_xx += (x[i]*x[i]);
    sum_yy += (y[i]*y[i]);
  }
  lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
  lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
  lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
  return lr;
};

/**
 * @brief Make bar graph.
 */
schoolProfile.barDemographics = function(schoolArray, year) {
  /** Desired format
    var d1 = [
        { "Demographic": "Hispanic", "stat": 2600 },
        ...
    ];
  */
  
  // If multi-schools, then this is combination of all schools
  var allDems = {};
  var allDemsTotal = 0;
  for (var i in schoolArray) {
    var id = schoolArray[i];
    try {
      var m = model.data.allSchools[year][id].demography.abbrShortest; // Not .abbr
      for (var key in m) {
        if (/No$/.exec(key)) {
          var outKey = key.replace(/No$/, '');
          if (allDems.hasOwnProperty(outKey)) {
            allDems[ outKey ] += m[key];
          } else {
            allDems[ outKey ] = m[key];
          }
          allDemsTotal += m[key];
        }
      }
    } catch(e) {
      console.log(
        'WARN: Cannot not find school with ID ' + id
        + ' in year ' + year
      );
    }
  }
  // All HS
  var allDemsHsTotal = 0;
  for (var i in schoolArray) {
    var id = schoolArray[i];
    try {
      var m = model.data.highSchools[year][id]['9_12'];
      allDemsHsTotal += m;
    } catch(e) {
      console.log(
        'WARN: Cannot not find school with ID ' + id
        + ' in year ' + year
      );
    }
  }
  
  // Add to display
  schoolProfile.html.barNotation.node().innerText = 
    'Total students: ' + allDemsTotal
    + '\nTotal HS students: ' + allDemsHsTotal
    + '\n* Demographic counts include PK-8 totals'
  
  // Return here for single schools
  if (!schoolProfile.currentView.schoolComparison) {
    schoolProfile.html.barContainer.node().style.display = 'none';
    return;
  } else {
    schoolProfile.html.barContainer.node().style.display = 'block';
  }
  
  // Year to schoolProfile.html.barContainer
  var p = schoolProfile.html.barContainer.append('fieldset');
  p.html('Year: '+year+'<br/>Click bar to filter demographic');
  p.node().className = 'filters';
  schoolProfile.html.barContainer.append('br').node().style.clear = 'both';
  
  var d1 = [];
  for (var key in allDems) {
    d1.push({
      'Demographic': key,
      'stat': allDems[key]
    });
  }

  var height = 200;
  var width = 380;
  var pad = {w: 40, top: 20, h: 120};
  
  // Compatibility with later d3 versions
  //~ var sl = (d3.scale) ? d3.scale.linear : d3.scaleLinear();
  //~ var so = (d3.scale) ? d3.scale.linear : d3.scaleOrdinal();
  // rangeRoundBands
  // x.domain([1, root.value]).nice();
  
  var yScale = d3.scale.linear()
    .domain([0, d3.max(d1, function(d) { return d.stat; })]) 
    .range([height, 0]);
  var xScale = d3.scale.ordinal()
    .domain(d1.map(function(d) { return d.Demographic; }))
    .rangeRoundBands([0, width], 0.1);
  
  var svg = schoolProfile.html.barContainer
    .append("svg")
    .attr("width", width + (pad.w * 2))
    .attr("height", height + (pad.h + pad.top))
    .attr("fill", '#ef')
    .append("g")
    .attr("transform",
          "translate("+ pad.w +","+ pad.top +")");

  svg.selectAll("rect")
    .data(d1)
    .enter()
    .append("rect")
      .attr("class", "profile-bar-rect")
      .attr("stroke", "blue")
      .attr('stroke-width', 0)
      .attr("x", function (d) { return xScale(d.Demographic) + pad.w; })
      .attr("y", function(d) { return yScale(d.stat); })
      .attr("height", function (d) { return height - yScale(d.stat); })
      .attr("width", xScale.rangeBand())
      .attr("fill", "cornflowerblue") // Not red
      .on("mouseover", function(d) {
        this.setAttribute('stroke-width', 1);
        var n = 'student';
        n += (d.stat > 1) ? 's' : '';
        divToolTip.html(d.stat + ' ' + n)
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
        divToolTip.transition()
          .duration(200)
          .style('opacity', 0.8);
      })
      .on("mouseout", function(d) {
        this.setAttribute('stroke-width', 0);
        divToolTip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on("click", function(d) {
        // Opens only this demo in line charts, but only when
        // in comparison mode.
        if (schoolProfile.currentView.schoolComparison == true) {
          schoolProfile.lineCompare(
            schoolProfile.currentView.currentSchoolArray,
            [d.Demographic]
          );
        }
      });
  
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");
  svg.append("g")
    .attr("class", "profile-axis")
    .attr("transform", "translate("+ pad.w +", 0)")
    .call(yAxis)
    .append("text") // Add axis label
      .attr("transform", "rotate(-90)")
      .attr("y", -50) // reverse due to rotate (y is x, x is y)
      .attr("x", -20)
      .style("text-anchor", "end")
      .text("# Students");

  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");
  svg.append("g")
    .attr("class", "profile-axis")
    .attr("transform", "translate("+ (pad.w) +", "+ height +")")
    .call(xAxis)
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-10px")
      .attr("dy", "2px")
      .attr("transform", "rotate(-65)")
  //~ svg.append("g") // Axis label
    //~ .attr("class", "profile-axis")
    //~ .append("text")
    //~ .attr("x", (width / 2))
    //~ .attr("y", height + pad.h - 80)
    //~ .style("text-anchor", "center")
    //~ .text("Demographic");

}
