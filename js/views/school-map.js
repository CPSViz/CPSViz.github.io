// JavaScript source code
// Code related to displaying school pointers on map goes here. 
// TODO: Refactor controller-specific code
(function () {
    var map = L.map('map').setView([41.82, -87.6], 10.4);

    // Make it responsive - full window
    //$(window).on("resize", function () { $("#map").height($(window).height()); map.invalidateSize(); }).trigger("resize");

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery � <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.light'
    }).addTo(map);


    // control that shows school info on hover
    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (props) {
        this._div.innerHTML = '<h4>Chicago Public Schools</h4>' + (props ?
            'Zip Code: <b>' + props.ZIP + '</b><br />Schools: ' + props.totalSchools
            : 'Hover over a neighborhood.<br />Click for schools.');
    };

    info.addTo(map);

    function style(feature) {
        return {
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.5,
            fillColor: getColor(feature.properties.totalSchools)
        };
    }

    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.4
        });

        //if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        //    layer.bringToFront();
        //}

        info.update(layer.feature.properties);
    }

    var geojson;

    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        geojson.bringToBack();
        info.update();
    }

    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
        showSchools(e.target.feature.properties.ZIP);
    }

    function zoomOutOfFeature(e) {
        if (map.getZoom() < 12) {
            resetSchoolLayer();
            schoolsLegend.remove();
            legend.addTo(map);
        }
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
        layer._leaflet_id = feature.properties.ZIP;
    }

    expandChicagoGeo();

    geojson = L.geoJson(ChicagoMapData, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 2, 5, 10, 15, 20, 30, 50],
            labels = [],
            from, to;

        labels.push("<b>Schools</b>");

        for (var i = 0; i < grades.length; i++) {
            from = grades[i];
            to = grades[i + 1];

            labels.push(
                '<i style="background:' + getColor(from + 1) + '"></i> ' +
                from + (to ? '&ndash;' + to : '+'));
        }

        div.innerHTML = labels.join('<br>');
        return div;
    };

    legend.addTo(map);

    function resetSchoolLayer() {
        schoolLayers.forEach(l => l.remove());
        schoolLayers = [];
    }

    // CPS Data
    function onEachSchoolFeature(feature, layer) {
        var studentData = getTotalStudents(feature.properties.school.ID);
        var popupContent = "<b>" + feature.properties.school.School + "</b><br />" +
            studentData[1] + " students";

        if (feature.properties && feature.properties.popupContent) {
            popupContent += feature.properties.popupContent;
        }

        layer.bindPopup(popupContent);
        layer.on('mouseover', function (e) {
            this.openPopup();
        });
        layer.on('mouseout', function (e) {
            this.closePopup();
        });
        layer.on('click', function (e) {
            var isShift = e.originalEvent.shiftKey;
            if (isShift) {
                schoolProfile.addToCompare(feature.properties.school.ID);
            } else {
                schoolProfile.load([feature.properties.school.ID], currentYear);
            }
        });
    }

    function getColor(d) {
        return d > 50 ? '#800026' :
            d > 30 ? '#BD0026' :
                d > 20 ? '#E31A1C' :
                    d > 15 ? '#FC4E2A' :
                        d > 10 ? '#FD8D3C' :
                            d > 5 ? '#FEB24C' :
                                d > 2 ? '#FED976' :
                                    '#FFEDA0';
    }

    var getTotalStudents = function (schoolId) {
        if (!currentStudentsData.hasOwnProperty(schoolId)) {
            console.log(`WARN: School with ID ${schoolId} not found.`);
            return 0;
        }
        // See model structure if this seems confusing.
        // Returns (isElementary, elem students or hs students)
        var hsStudents = currentStudentsData[schoolId]["9_12"];
        return [hsStudents === 0, hsStudents === 0 ? currentStudentsData[schoolId]["20th"].Total : hsStudents];
    };

    var schoolLayers = [];
    var currentStudentsData;    // Stores data for current year.

    // Store zip and year when refreshing via slider
    var currentYear = 2019;

    var yearSliderHandler = function (year) {
        currentYear = year;
        resetSchoolLayer();
        fireZipClick();
    };

    // Load slider
    loadSlider("slider-map", yearSliderHandler);

    var showSchools = function (zip) {
        var schoolsGeoJson = getSchoolsGeo(zip);

        // Set input zip for use with slider
        $("#school-zip").val(zip);

        // Load current year's school data from model.js 
        model.init(d => {
            currentStudentsData = d.data.allSchools[currentYear];
            var schoolLayer = getSchoolLayer(schoolsGeoJson);
            showSchoolsLegend();
            schoolLayers.push(schoolLayer);
        });
    };

    var getSchoolLayer = function (schoolsGeoJson) {
        return L.geoJSON(schoolsGeoJson, {
            onEachFeature: onEachSchoolFeature,
            pointToLayer: function (feature, latlng) {
                var studentData = getTotalStudents(feature.properties.school.ID);
                var isElementary = studentData[0];
                var totalStudents = studentData[1];

                if (isElementary) {
                    return L.shapeMarker(latlng, {
                        shape: "triangle",
                        radius: 7,
                        fillColor: getElementarySchoolColor(totalStudents),
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                }

                return L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: getHighSchoolColor(totalStudents),
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            }
        }).addTo(map).bringToFront();
    };

    function getHighSchoolColor(d) {
        return d > 2000 ? '#1a1aff' :
            d > 1000 ? '#4d4dff' :
                d > 500 ? '#8080ff' :
                    d > 200 ? '#b3b3ff' :
                        '#e6e6ff';
    }

    function getElementarySchoolColor(d) {
        return d > 2000 ? '#E31A1C' :
            d > 1000 ? '#FC4E2A' :
                d > 500 ? '#FD8D3C' :
                    d > 200 ? '#FED976' :
                        '#FFEDA0';
    }

    var schoolsLegend = L.control({ position: 'bottomright' });
    var showSchoolsLegend = function () {
        schoolsLegend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 200, 500, 1000, 2000],
                labels = [],
                from, to;

            labels.push("<b>Total Students</b>");
            labels.push("<b>HS / ALL</b>");
            for (var j = 0; j < grades.length; j++) {
                from = grades[j];
                to = grades[j + 1];

                labels.push(
                    '<svg height="18" width="18" style="margin-bottom: -1px;" > <circle cx="9" cy="9" r="8.5" fill="' +
                    getHighSchoolColor(from + 1) + '" /></svg >' +
                    ' <svg height="16" width="16"> <polygon points = "8,0 0,16 16,16" ' +
                    'fill = "' + getElementarySchoolColor(from + 1) + '" /></svg > ' + from + (to ? '&ndash;' + to : '+'));
                    //'<i style="background:' + getElementarySchoolColor(from + 1) + '"></i> ' +
                    //from + (to ? '&ndash;' + to : '+'));
            }

            //labels.push("<b>HS</b>");

            //for (var i = 0; i < hsGrades.length; i++) {
            //    from = hsGrades[i];
            //    to = hsGrades[i + 1];

            //    labels.push(
            //        '<i style="background:' + getHighSchoolColor(from + 1) + '"></i> ' + from + (to ? '&ndash;' + to : '+'));
            //}

            div.innerHTML = labels.join('<br>');
            return div;
        };

        legend.remove();
        schoolsLegend.addTo(map);
    };

    // Add map zoomout event handler
    map.on({ zoomend: zoomOutOfFeature });

    var fireZipClick = function () {
        var zip = $("#school-zip").val();
        var layer = geojson.getLayer(zip);

        if (!layer) {
            return;
        }

        layer.fireEvent('click');
    };

    // Hook zip user input
    $("#btn-school-zip").on('click', fireZipClick);
})();
