// Slider control - accepts callback to invoke with slider value on change.
var loadSlider = function (sliderId, cb) {
    $("#" + sliderId).slider({
        // Hardcoding years for now
        value: 2019,    // Default year
        min: 2014,
        max: 2019,
        step: 1,
        slide: function (event, ui) {
            $("#year").val(ui.value);
            cb(ui.value);
        }
    });
    $("#year").val($("#" + sliderId).slider("value"));

    function setSliderTicks() {
        var $slider = $("#" + sliderId);
        var max = $slider.slider("option", "max");
        var min = $slider.slider("option", "min");
        var ticks = max - min;
        var spacing = 100 / ticks;

        $slider.find('.ui-slider-tick-mark').remove();
        for (var i = 1; i < ticks; i++) {
            $('<span class="ui-slider-tick-mark"></span>').css('left', spacing * i + '%').appendTo($slider);
        }
    }

    setSliderTicks();
};
