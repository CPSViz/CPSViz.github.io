// Credits: https://github.com/UsabilityEtc/d3-country-bubble-chart
var bubbleCtrl = bubbleCtrl || new schoolBubbleController();

var createBubbleChart = function () {
    var currentYear = 2019;
    var currentDemography = '';  // None indicates All.
    var schools = bubbleCtrl.getSchoolsByYear(currentYear);
    var schoolNetworkNames = bubbleCtrl.getSchoolNetworksDict(schools);
    var populations = schools.map(s => +s.totalStudents);
    var meanPopulation = d3.mean(populations),      // TODO: use
        populationExtent = d3.extent(populations),
        populationScaleX,
        populationScaleY;

    var schoolNetworks = d3.set(schools.map(function (s) { return s.network; }));
    var schoolNetworkColorScale = d3.scaleOrdinal(d3.schemeCategory20)
        .domain(schoolNetworks.values());

    var width = 1200,
        height = 680;
    var svg,
        circles,
        circleSize = getCircleSize(populationExtent[1]);
    var circleRadiusScale = d3.scaleSqrt()
        .domain(populationExtent)
        .range([circleSize.min, circleSize.max]);

    var forces,
        forceSimulation;

    createSVG();
    toggleschoolNetworkKey(true);
    createCircles();
    createForces();
    createForceSimulation();
    addFillListener();
    addGroupingListeners();
    createDemographyDropdown();

    // Load slider
    loadSlider("slider-bubble", yearSliderHandler);

    function createSVG() {
        svg = d3.select("#bubble-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
    }

    function createDemographyDropdown() {
        var select = document.getElementById("demography");
        // Create default option
        var option = document.createElement('option');
        option.text = "All";
        option.value = '';
        option.setAttribute('selected', '');
        select.appendChild(option);

        var dLabels = bubbleCtrl.demographyLabels;
        Object.keys(dLabels).forEach(l => {
            var opt = document.createElement('option');
            opt.text = l;
            opt.value = l;
            select.appendChild(opt);
        });

        // Hook demography handler
        $('#demography').on('change', function () {
            currentDemography = $(this).val();
            schools = currentDemography ? bubbleCtrl.filterStudentsByDemography(currentDemography, currentYear) :
                bubbleCtrl.getSchoolsByYear(currentYear);
            recreateChart();
        });
    }

    function recreateChart() {
        populations = schools.map(s => +s.totalStudents);
        populationExtent = d3.extent(populations);
        circleSize = getCircleSize(populationExtent[1]);
        circleRadiusScale = d3.scaleSqrt()
            .domain(populationExtent)
            .range([circleSize.min, circleSize.max]);
        resetCircles();
        createForces();
        createForceSimulation();

        // Reset axes
        var xAxis = d3.select(".x-axis"),
            yAxis = d3.select(".y-axis");
        xAxis.remove();
        yAxis.remove();
        togglePopulationAxes(populationGrouping());
        //addFillListener();
        //updateForces(populationGrouping() ? forces.population : forces.combine);
    }

    // Handling for circle size when population range fluctuates too much.
    function getCircleSize(pMax) {
        return {
            'min': 1,
            'max': pMax < 1500 && schools.length > 400 ? 18 : 30
        };
    }

    function yearSliderHandler(year) {
        currentYear = year;
        schools = currentDemography ? bubbleCtrl.filterStudentsByDemography(currentDemography, currentYear) :
            bubbleCtrl.getSchoolsByYear(currentYear);
        schoolNetworkNames = bubbleCtrl.getSchoolNetworksDict(schools);
        schoolNetworks = d3.set(schools.map(function (s) { return s.network; }));
        schoolNetworkColorScale = d3.scaleOrdinal(d3.schemeCategory20)
            .domain(schoolNetworks.values());
        d3.select(".schoolNetwork-key").remove();
        toggleschoolNetworkKey(!populationGrouping());
        recreateChart();
    }

    function toggleschoolNetworkKey(showschoolNetworkKey) {
        var keyElementWidth = width / schoolNetworks.values().length; //90,
        keyElementHeight = 30;
        var onScreenYOffset = keyElementHeight * 1.5,
            offScreenYOffset = 100;

        if (d3.select(".schoolNetwork-key").empty()) {
            createschoolNetworkKey();
        }
        var schoolNetworkKey = d3.select(".schoolNetwork-key");

        if (showschoolNetworkKey) {
            translateschoolNetworkKey("translate(0," + (height - onScreenYOffset) + ")");
        } else {
            translateschoolNetworkKey("translate(0," + (height + offScreenYOffset) + ")");
        }

        function createschoolNetworkKey() {
            var keyWidth = keyElementWidth * schoolNetworks.values().length;
            var schoolNetworkKeyScale = d3.scaleBand()
                .domain(schoolNetworks.values())
                .range([(width - keyWidth) / 2, (width + keyWidth) / 2]);

            svg.append("g")
                .attr("class", "schoolNetwork-key")
                .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
                .selectAll("g")
                .data(schoolNetworks.values())
                .enter()
                .append("g")
                .attr("class", "schoolNetwork-key-element");

            d3.selectAll("g.schoolNetwork-key-element")
                .append("rect")
                .attr("width", keyElementWidth)
                .attr("height", keyElementHeight)
                .attr("x", function (d) { return schoolNetworkKeyScale(d); })
                .attr("fill", function (d) { return schoolNetworkColorScale(d); });

            d3.selectAll("g.schoolNetwork-key-element")
                .append("text")
                .attr("text-anchor", "middle")
                .attr("x", function (d) { return schoolNetworkKeyScale(d) + keyElementWidth / 2; })
                .text(function (d) { return schoolNetworkNames[d]; });

            // The text BBox has non-zero values only after rendering
            d3.selectAll("g.schoolNetwork-key-element text")
                .attr("y", function (d) {
                    var textHeight = this.getBBox().height;
                    // The BBox.height property includes some extra height we need to remove
                    var unneededTextHeight = 4;
                    return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
                });
        }

        function translateschoolNetworkKey(translation) {
            schoolNetworkKey
                .transition()
                .duration(500)
                .attr("transform", translation);
        }
    }

    function isChecked(elementID) {
        return d3.select(elementID).property("checked");
    }

    function resetCircles() {
        circles = svg.selectAll("circle");
        circles.remove();
        circles = null;
        //svg.remove();
        //createSVG();
        createCircles();
    }

    function createCircles() {
        var formatPopulation = d3.format(",");
        circles = svg.selectAll("circle")
            .data(schools)
            .enter()
            .append("circle")
            .attr("r", function (d) {
                return circleRadiusScale(d.totalStudents);
            })
            .on("mouseover", function (d) {
                updateschoolInfo(d);
            })
            .on("mouseout", function (d) {
                updateschoolInfo();
            });
        updateCircles();

        function updateschoolInfo(school) {
            var info = "";
            if (school) {
                info = [school.schoolName, formatPopulation(school.totalStudents)].join(": ");
            }
            d3.select("#school-info").html(info);
        }
    }

    function updateCircles() {
        circles
            .attr("fill", function (d) {
                return schoolNetworkColorScale(d.network);
            });
    }

    function createForces() {
        var forceStrength = 0.05;

        forces = {
            combine: createCombineForces(),
            population: createPopulationForces()
        };

        function createCombineForces() {
            return {
                x: d3.forceX(width / 2).strength(forceStrength),
                y: d3.forceY(height / 2).strength(forceStrength)
            };
        }

        function createPopulationForces() {
            var schoolNetworkNamesDomain = schoolNetworks.values().map(function (schoolNetworkCode) {
                return schoolNetworkNames[schoolNetworkCode];
            });
            var scaledPopulationMargin = circleSize.max;

            populationScaleX = d3.scaleBand()
                .domain(schoolNetworkNamesDomain)
                .range([scaledPopulationMargin, width - scaledPopulationMargin * 2]);
            populationScaleY = d3.scaleLog()
                .domain(populationExtent)
                .range([height - scaledPopulationMargin, scaledPopulationMargin * 2]);

            var centerCirclesInScaleBandOffset = populationScaleX.bandwidth() / 2;
            return {
                x: d3.forceX(function (d) {
                    var val = populationScaleX(schoolNetworkNames[d.network]) + centerCirclesInScaleBandOffset;
                    if (!val)
                        console.log(schoolNetworkNames[d.network]);
                    return val;
                }).strength(forceStrength),
                y: d3.forceY(function (d) {
                    return populationScaleY(d.totalStudents);  // TODO: totalStudents shouldn't be empty
                }).strength(forceStrength)
            };
        }

    }

    function createForceSimulation() {
        if (forceSimulation)
            forceSimulation.stop();

        var force = populationGrouping() ? forces.population : forces.combine;

        forceSimulation = d3.forceSimulation()
            .force("x", force.x)
            .force("y", force.y)
            .force("collide", d3.forceCollide(forceCollide));

        $(forceSimulation.nodes(schools)).unbind();

        forceSimulation.nodes(schools)
            .on("tick", function () {
                circles
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });
            });
    }

    function forceCollide(d) {
        return populationGrouping() ? 0 : circleRadiusScale(d.totalStudents) + 1;
    }

    function populationGrouping() {
        return isChecked("#population");
    }

    function addFillListener() {
        $(d3.selectAll('input[name="fill"]')).unbind();

        d3.selectAll('input[name="fill"]')
            .on("change", function () {
                toggleschoolNetworkKey(!populationGrouping());
                updateCircles();
            });
    }

    function updateForces() {
        forceSimulation
            .force("x", forces.population.x)
            .force("y", forces.population.y)
            .force("collide", d3.forceCollide(forceCollide))
            .alphaTarget(0.5)
            .restart();
    }

    function addGroupingListeners() {
        addListener("#combine");
        addListener("#population");

        function addListener(selector) {
            d3.select(selector).on("click", function () {
                // Work around for the force issue when switching bubble view
                if (populationGrouping())
                    updateForces(); // This is basically population force
                else {
                    createForceSimulation();
                }

                toggleschoolNetworkKey(!populationGrouping());
                togglePopulationAxes(populationGrouping());
            });
        }
    }

    function togglePopulationAxes(showAxes) {
        var onScreenXOffset = 40,
            offScreenXOffset = -40;
        var onScreenYOffset = 90,
            offScreenYOffset = 100;

        if (d3.select(".x-axis").empty()) {
            createAxes();
        }
        var xAxis = d3.select(".x-axis"),
            yAxis = d3.select(".y-axis");

        if (showAxes) {
            translateAxis(xAxis, "translate(0," + (height - onScreenYOffset) + ")");
            translateAxis(yAxis, "translate(" + onScreenXOffset + ",0)");
        } else {
            translateAxis(xAxis, "translate(0," + (height + offScreenYOffset) + ")");
            translateAxis(yAxis, "translate(" + offScreenXOffset + ",0)");
        }

        function createAxes() {
            var numberOfTicks = 10,
                tickFormat = ".0s";

            var xAxis = d3.axisBottom(populationScaleX)
                .ticks(numberOfTicks, tickFormat);

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
                .call(xAxis)
                .selectAll(".tick")
                .attr("font-size", "16px")
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dy", "0.45em")
                .attr("transform", "rotate(-65)");

            var yAxis = d3.axisLeft(populationScaleY)
                .ticks(numberOfTicks, tickFormat);
            svg.append("g")
                .attr("class", "y-axis")
                .attr("transform", "translate(" + offScreenXOffset + ",0)")
                .call(yAxis);
        }

        function translateAxis(axis, translation) {
            axis
                .transition()
                .duration(500)
                .attr("transform", translation);
        }
    }
};