var myChart = chart().width(800).height(450);

function chart() {

    // Default vars
    var width = 800, // default width
        height = 450, // default height
        padding = 40,
        parseDate = d3.time.format.utc("%x").parse,
        colors = ["", "#666666", "#999999", "#CCCCCC"],
        labels = ["Total Followers", "Followed", "Unfollowed", "Returned"],
        active_totals = [0, 1, 2, 3],
        check_state;

    function init_chart(){

        var svg = d3.select("#svg")
            .attr("width", width + 20)
            .attr("height", height);

        // Background.
        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "#F2F2F2");

        var chart = svg.append("svg:g")
            .attr("id", "chart_area")
            .attr("width", width - padding * 2)
            .attr("height", height - padding)
            .attr("transform", "translate(" + padding + "," + 120 + ")");

        clip = chart.append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", "720")
            .attr("height", "100%");

        totals = svg.append("svg:g")
            .attr("id", "totals")
            .attr("width", width - padding * 2)
            .attr("height", 100)
            .attr("transform", "translate(" + (padding + 170) + ",20)");

        dates = svg.append("svg:g")
            .attr("id", "dates")
            .attr("width", 160)
            .attr("height", 100)
            .attr("transform", "translate(" + (padding) + ", -150)");

        dates.transition()
            .duration(500)
            .delay(600)
            .attr("transform", "translate(" + (padding) + ", 20)");

        dates.append( "rect" )
            .attr( "width", 160 )
            .attr( "height", 70 )
            .attr("x", 0)
            .attr("y", 0)
            .attr( "fill", "#E6E6E6" );

        tote_start = dates.append( "text" )
            .attr("class", "tote_dates")
            .attr("x", 135)
            .attr("y", 30)
            .attr("text-anchor", "end")
            .attr("fill", 'darkgray');

        tote_end = dates.append( "text" )
            .attr("class", "tote_dates")
            .attr("x", 135)
            .attr("y", 50)
            .attr("text-anchor", "end")
            .attr("fill", 'darkgray');

        // All axis offset x & y by 0.5 to prevent antaliasing when converting to canvas
        // .x.axis
        d3.select("#svg")
            .append("svg:g")
            .attr("class", "x axis");

        // .y.axis
        d3.select("#svg")
            .append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (padding - 2.5) + ", 305.5)");

        // .yr.axis
        d3.select("#svg")
            .append("svg:g")
            .attr("class", "yr axis")
            .attr("transform", "translate(" + (width - padding + 2.5) + ", 120.5)");

        return chart;
    }

    // Draw chart here.
    function my(data) {

        if (typeof chart_area === "undefined"){ chart_area = init_chart(); }

        if (data) { selection = data; }

        var bars_show = checkedBoxes("barBox", [1, 2, 3]),
        returned_hidden = checkedBoxes("barBox", [3]).length === 0,

        bars_max = d3.max(selection, function (d) {
            return d3.max(bars_show.map(function(i){
                val = i === 1 && returned_hidden ? (d[1] + d[3]) : d[i];
                return val;
            }));
        }),

        // Min/Max dates in selection.
        days_ext = d3.extent(selection, function (d) {
            return parseDate(d[0]);
        }),

        flat_dates = d3.extent(selection, function (d) {
            return d[0];
        }),

        total_ext = d3.extent(selection, function (d) {
            return d[4];
        }),

        day_width = (width - padding * 2) / selection.length,
        bar_width = (day_width / _.without(bars_show, 0).length),
        scaleX_axis = d3.time.scale.utc().domain(days_ext).rangeRound([0, width - (padding * 2) - day_width]),
        scaleL_axis = d3.scale.linear().domain([0, bars_max]).rangeRound([115, 0]),
        scaleR_axis = d3.scale.linear().domain(total_ext).rangeRound([175, 0]),
        scaleX_bars = d3.time.scale.utc().domain(days_ext).range([0, width - (padding * 2) - day_width]),
        scaleX_line = d3.time.scale.utc().domain(days_ext).range([0, width - (padding * 2)]),
        scaleY_bars = d3.scale.linear().domain([0, bars_max]).rangeRound([115, 0]),
        scaleY_line = d3.scale.linear().domain(total_ext).range([175, 0]),
        xAxis = selection.length <= 13 ? d3.svg.axis().scale(scaleX_axis).ticks(selection.length) : d3.svg.axis().scale(scaleX_bars),
        ylAxis = d3.svg.axis().scale(scaleL_axis).orient("left"),
        yrAxis = d3.svg.axis().scale(scaleR_axis).orient("right"),

        area = d3.svg.area().x(function(d) {
            return scaleX_line(parseDate(d[0]));
        }).y0(300).y1(function(d) {
            return scaleY_line(d[4]);
        }),

        // For inserting area with no height before transformation.
        no_area = d3.svg.area().x(function(d) {
            return scaleX_line(parseDate(d[0]));
        }).y0(300).y1(300),

        // Total followers path.
        path = chart_area.selectAll("path")
            .data([datum]);

        function widgetVal(d) {
            return d === 0 ?  _.last(selection)[4] : _.sum_nested(selection, d);
        }

        function widgetTween(d) {
            val = returned_hidden && d === 1 ? (widgetVal(3) + widgetVal(d)) : widgetVal(d);
            var i = d3.interpolateRound(parseInt((this.textContent).replace(',',''), 10), val);
            return function(t) {
                this.textContent = d3.format(',')( i(t) );
            };
        }

        // if total followers checked, draw path, else remove
        if (checkedBoxes("barBox", [0]).length == 1){

            path.enter()
                .append("svg:path")
                .attr("clip-path", "url(#clip)")
                .attr("fill", "#E6E6E6")
                .attr("d", area);

            path.transition()
                .duration(400)
                .ease("quad")
                .attr("d", area);

            path.exit()
                .remove();

            d3.select(".yr.axis")
                .transition()
                .duration(400)
                .style("opacity", 1)
                .call(yrAxis);

        } else {
            path.transition()
                .duration(400)
                .ease("quad")
                .attr("d", no_area);

            d3.select(".yr.axis")
                .transition()
                .duration(400)
                .style("opacity", 0)
                .call(yrAxis);
        }

        // Bar chart

        // Removed unchecked items
        var checked = checkedBoxes("barBox", [0, 1, 2, 3]),
        retire = _.difference(check_state, checked)[0],
        unchecked = retire !== undefined;

        if (unchecked){
            chart_area.selectAll("rect.bar" + retire)
                .transition()
                .duration(400)
                .ease("quad")
                .attr("height", 0)
                .attr("y", 300);

        } check_state = checked;

        _.each(bars_show, function (val, i){

            var bars = chart_area.selectAll("rect.bar" + val)
                .data(datum, function (d) { return d[0]; }),

            scaleX = (function(d) {
                return scaleX_bars(parseDate(d[0])) + (bar_width * i);
            }),

            scaleY = (function(d) {
                if (val === 1 && returned_hidden) {
                    return scaleY_bars(d[val] + d[3]) + 185;
                } else {
                    return scaleY_bars(d[val]) + 185;
                }
            }),

            heightY = (function(d) {
                if (val === 1 && returned_hidden) {
                    return 115 - scaleY_bars(d[val] + d[3]);
                } else {
                    return 115 - scaleY_bars(d[val]);
                }
            });


            bars.enter()
                .append("svg:rect")
                .attr("clip-path", "url(#clip)")
                .attr("class", "bar" + val)
                .attr("y", 300)
                .attr("height", 0)
                .attr("x", scaleX)
                .style("fill", colors[val]);

            if (unchecked){
                bars.transition()
                    .duration(400)
                    .attr("height", heightY)
                    .attr("y", scaleY)
                    .transition()
                    .delay(400)
                    .attr("width", (bar_width - 2))
                    .attr("x", scaleX);

            } else {
                bars.transition()
                    .duration(400)
                    .attr("width", (bar_width - 2))
                    .attr("x", scaleX)
                    .transition()
                    .delay(800)
                    .attr("height", heightY)
                    .attr("y", scaleY);
            }

            bars.exit()
                .transition()
                .duration(400)
                .ease("quad")
                .attr("height", 0)
                .attr("y", 300)
                .remove();


        });

        d3.select(".x.axis")
            .attr("transform", "translate( " + (Math.round(padding + (day_width / 2)) + 0.5) + ", 422.5)")
            .transition()
            .duration(2000)
            .call(xAxis);

        d3.select(".y.axis")
            .transition()
            .duration(500)
            .call(ylAxis);


        active_totals = checkedBoxes("barBox", [0, 1, 2, 3]);

        // Totals
        tote_rect = totals.selectAll("rect.tote")
            .data(active_totals, function(d){ return d; });

        tote_label = totals.selectAll("text.tote_label")
            .data(active_totals, function(d){ return d; });

        tote_val = totals.selectAll("text.tote_val")
            .data(active_totals, function(d){ return d; });

        tote_rect.enter()
            .append( "rect" )
            .attr("class", "tote")
            .attr( "width", 130 )
            .attr( "height", 70 )
            .attr("x", function(d, i) { return i * 140; })
            .attr("y", -150)
            .attr( "fill", "#E6E6E6" );

        tote_label.enter()
            .append( "text" )
            .attr("class", "tote_label")
            .text(function(d) { return labels[d]; })
            .attr("x", function(d, i) { return i * 140 + 65; })
            .attr("y", -150 + 30)
            .attr("text-anchor", "middle")
            .attr("fill", 'darkgray');

        tote_val.enter()
            .append( "text" )
            .attr("class", "tote_val")
            .text(function(d) { return widgetVal(d); })
            .attr("x", function(d, i) { return i * 140 + 65; })
            .attr("y", -150 + 50)
            .attr("text-anchor", "middle")
            .attr("fill", 'darkgray');

        tote_start.transition()
            .text("From: " + flat_dates[0]);

        tote_end.transition()
            .text("To: " + flat_dates[1]);

        if (unchecked){
            tote_rect.transition()
                .duration(500)
                .delay(500)
                .attr("x", function(d, i) { return i * 140; });

            tote_label.transition()
                .duration(500)
                .delay(500)
                .attr("x", function(d, i) { return i * 140 + 65; });

            tote_val.transition()
                .duration(500)
                .tween("text", widgetTween)
                .delay(500)
                .attr("x", function(d, i) { return i * 140 + 65; });

        } else {

            tote_rect.transition()
                .duration(500)
                .attr("x", function(d, i) { return i * 140; })
                .transition()
                .delay(500)
                .attr("y", 0);

            tote_label.transition()
                .duration(500)
                .attr("x", function(d, i) { return i * 140 + 65; })
                .transition()
                .delay(500)
                .attr("y", 30);

            tote_val.transition()
                .duration(500)
                .attr("x", function(d, i) { return i * 140 + 65; })
                .text(function retn(d) { return widgetVal(d); })
                .tween("text", widgetTween)
                .transition()
                .delay(500)
                .attr("y", 50);
        }

        tote_rect.exit()
            .transition()
            .duration(500)
            .attr("y", -150)
            .transition()
            .delay(500)
            .remove();

        tote_label.exit()
            .transition()
            .duration(500)
            .attr("y", -150 + 35)
            .transition()
            .delay(500)
            .remove();

        tote_val.exit()
            .transition()
            .duration(500)
            .attr("y", -150 + 65)
            .transition()
            .delay(500)
            .remove();

        d3.selectAll(".axis path, .axis line")
            .style("fill", "none")
            .style("shape-rendering", "crispEdges")
            .style("stroke", "rgba(169, 169, 138, 0.4)");

        d3.selectAll(".axis text")
            .style("font-size", "10")
            .style("font-family", "Ubuntu Mono")
            .style("fill", "#a9a9a9");

        d3.selectAll("#dates text, #totals text")
            .style("font-size", "13")
            .style("font-family", "arial")
            .style("font-weight", "bold")
            .style("fill", "#a9a9a9");

    }


    // Getter-setter methods that allow method chaining.

    my.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return my;
    };

    my.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return my;
    };

    my.padding = function(value) {
        if (!arguments.length) return padding;
        padding = value;
        return my;
    };

    my.bars_show = function(value) {
        if (!arguments.length) return bars_show;
        bars_show = value;
        return my;
    };

    my.datum = function(value) {
        if (!arguments.length) return datum;
        datum = value;
        return my;
    };

    return my;
}

d3.json("/stats.json", function (data) {

    myChart.datum(data);
    myChart(data);
    datePicker(data);
});

// Helper Functions

// Return array of checked boxes, specified by class and list of indexes.
function checkedBoxes (klass, range){

    var checkbox = d3.selectAll("input." + klass),
    checked = [];
    _.each(range, function (i){
        if (checkbox[0][i].checked) { checked.push(i); }
    });
    return checked;
}
