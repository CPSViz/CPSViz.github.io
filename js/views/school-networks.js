/**
 * @author: David Shumway
 * @brief: A network overview for all schools.
 * @reference: For the chart, the following tutorial is referenced:
 * 	https://swizec.com/blog/quick-scatterplot-tutorial-for-d3-js/swizec/5337
 */

// Init
model.init(loadSchools);

function loadSchools() {
    /** Desired format
    model.data.networkProfile.data.school = [
        {network: "Network 14", stat: 20243, year: 2019},
        {network: "Network 14", stat: 0, year: 2018},
        ...
        ...
    ];
    */
    
    addFilters();
    
    // Display the charts
    d3.select("#map").append('div').node().id = 'network-charts';
    addChart(model.data.networkProfile.hs.data.school,
      model.data.networkProfile.hs.maxSchools, 6, 'Schools per network');
    addChart(model.data.networkProfile.hs.data.student,
      model.data.networkProfile.hs.maxStudents, 6, 'Students per network');
}

function addFilters() {
  // nf
  d3.select("#map").node().appendChild(
    d3.select('#div-network-filters').node()
  );
  d3.select('#div-network-filters').node().style.display = 'block';
}

// Network Sort
// Default on reload always reads "Sort By".
d3.select("#network-sort").on("change", networkSort);
d3.select("#network-sort").node().selectedIndex = 0;
d3.select("#nf-schools1").on("change", networkSort);
d3.select("#nf-schools2").on("change", networkSort);
function networkSort() {
  d3.select("#network-charts").selectAll("*").remove();
  var x = document.getElementById('network-sort');
  var v = x.options[x.selectedIndex].value;
  switch(v) {
    case '1':
      // all
      model.data.networkProfile.all.data.school.sort(process.sortFunctionAB);
      model.data.networkProfile.all.data.student.sort(process.sortFunctionAB);
      // hs
      model.data.networkProfile.hs.data.school.sort(process.sortFunctionAB);
      model.data.networkProfile.hs.data.student.sort(process.sortFunctionAB);
      break;
    case '2':
      // all
      model.data.networkProfile.all.data.school.sort(process.sortFunctionSchoolsAll);
      model.data.networkProfile.all.data.student.sort(process.sortFunctionSchoolsAll);
      // hs
      model.data.networkProfile.hs.data.school.sort(process.sortFunctionSchoolsHs);
      model.data.networkProfile.hs.data.student.sort(process.sortFunctionSchoolsHs);
      break;
    case '3':
      // all
      model.data.networkProfile.all.data.school.sort(process.sortFunctionStudentsAll);
      model.data.networkProfile.all.data.student.sort(process.sortFunctionStudentsAll);
      // hs
      model.data.networkProfile.hs.data.school.sort(process.sortFunctionStudentsHs);
      model.data.networkProfile.hs.data.student.sort(process.sortFunctionStudentsHs);
      break;
  }
  var type = (d3.select('#nf-schools1').node().checked) ? 'all' : 'hs';
  addChart(model.data.networkProfile[type].data.school,
    model.data.networkProfile[type].maxSchools, 6, 'Schools per network');
  addChart(model.data.networkProfile[type].data.student,
    model.data.networkProfile[type].maxStudents, 6, 'Students per network');
}

/**
 * 
 * @param data        Obj 
 * @param total       Int Max. value in any given year
 * @param numYears    Int
 * @param chartTitle  Str
 */
function addChart(data, total, numYears, chartTitle) {
  
  var w = 600,
  h = 600,
  wpad = 40,
  hpad = 20,
  left_pad = 180;

  var svg = d3.select("#network-charts")
      .append("svg")
      .attr("style", "outline: thin solid #999;")
      .attr("width", w)
      .attr("height", h);
      
  var x = d3.scale.linear()
    .domain([2014, 2019])
    .range([left_pad, w-wpad]);
  var y = d3.scale.ordinal()
    .domain(data.map(function(d) { return d.network; }))
    .rangeRoundBands([0, h-hpad*2], 0.1);
  
  var xAxis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(function (d) {
      if (d == 2019) return "18-19";
      else if (d == 2018) return "17-18";
      else if (d == 2017) return "16-17";
      else if (d == 2016) return "15-16";
      else if (d == 2015) return "14-15";
      else if (d == 2014) return "13-14";
    })
    .innerTickSize(-h)
    .outerTickSize(0);
  var yAxis = d3.svg.axis().scale(y).orient("left")
    .ticks(data.length)
    .innerTickSize(-w)
    .outerTickSize(0)
    ;

  svg.append("g")
    .attr("class", "network-axis")
    .attr("transform", "translate(0, "+(h-hpad)+")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "network-axis")
    .attr("transform", "translate("+(left_pad-wpad)+", 0)")
    .call(yAxis);
  
  // max_w should be the largest data point in all years
  // e.g. if n13 in year 2015 had most schools in network,
  // everything would be relative to this network?
  var max_w = d3.max(data.map(function (d) {
    return d.stat;
  }));
  rect_w = d3.scale.linear()
      .domain([0, total])
      .range([0, w/numYears]);

  svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
        .attr("class", "network-rect")
        .attr("x", function (d) { return x(d.year) - ((rect_w(d.stat)*0.4) / 2); })
        .attr("y", function (d) { return y(d.network); })
        //~ .transition()
        //~ .duration(800)
        .attr("width", function (d) { return rect_w(d.stat) * 0.4; })
        .attr("height", '20px')
        .attr("ctitle", chartTitle)
        .on('click', function(d) {
          if (d3.select('#nf-schools1').node().checked) { // load all
            schoolProfile.load(
              model.data.networks.all.schools[d.network][d.year].schoolIDs,
              d.year
            )
          } else { // load hs only
            schoolProfile.load(
              model.data.networks.hs.schools[d.network][d.year].schoolIDs,
              d.year
            )
          }
        })
        .on('mouseover', function(d) {
          var n;
          if (this.getAttribute('ctitle') == 'Schools per network') {
            n = 'school'
          } else {
            n = 'student';
          }
          n += (d.stat > 1) ? 's' : '';
          divToolTip.html(d.stat + ' ' + n)
            .style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY - 28) + 'px');
          divToolTip.transition()
            .duration(200)
            .style('opacity', 0.8);
          })
        .on('mouseout', function(d) {
          divToolTip.transition()
            .duration(500)
            .style('opacity', 0);
        });
        
  //~ var rects = svg.selectAll(".network-rect");
  //~ rects.append("title")
        //~ .text(function(d) { return d.stat; });
  
  // Add a chart title.
  // Create a div and move the SVG from its current location to the new
  // div. These divs are float:left.
  var chartDiv = document.createElement('div');
  chartDiv.setAttribute('class', 'network-chart-title');
  svg.node().parentNode.append(chartDiv);
  chartDiv.appendChild(svg.node());
  var span = document.createElement('div');
  span.style.display = 'break';
  span.innerText = chartTitle;
  chartDiv.appendChild(span);

}
