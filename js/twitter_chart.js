// Interactive chart for displaying basic Twitter stats //
// Michael Murray 2013, @nverba //

var myChart = chart();

function chart() {

    // Default vars
    var width = 850, // default width
        height = 500, // default height
        padding = 40,
        parseDate = d3.time.format.utc("%x").parse,
        colors = ["#93b7bd", "#acbd4d", "#f4705b", "#f6ac55"],
        labels = ["TOTAL FOLLOWERS", "NEW FOLLOWERS", "UNFOLLOWED", "RETURNED"],
        active_totals = [0, 1, 2, 3],
        check_state,
        user = 'nverba';

    function init_chart(){

        var svg = d3.select("#svg")
            .attr("width", width + 20)
            .attr("height", height);

        // Background.
        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "#f3f3f3");

        var chart = svg.append("svg:g")
            .attr("id", "chart_area")
            .attr("width", width - padding * 2)
            .attr("height", height - padding)
            .attr("transform", "translate(" + (padding + 1) + "," + 149 + ")");

        clip = chart.append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", "770")
            .attr("height", "110%")
            .attr("transform", "translate(0, -20)");

        totals = svg.append("svg:g")
            .attr("id", "totals")
            .attr("width", width - padding * 2)
            .attr("height", 100)
            .attr("transform", "translate(" + (padding + 155) + ",20)");

        header = svg.append("svg:g")
            .attr("id", "header")
            .attr("width", "100%")
            .attr("height", 50);

        header.append( "rect" )
            .attr( "width", "100%" )
            .attr( "height", 50 )
            .attr("x", 0)
            .attr("y", 0)
            .attr( "fill", "#8cc99f" );

        footer = svg.append("svg:g")
            .attr("id", "footer")
            .attr("width", "100%")
            .attr("height", 50);

        footer.append( "rect" )
            .attr( "width", "100%" )
            .attr( "height", 50 )
            .attr("x", 0)
            .attr("y", 450)
            .attr( "fill", "#93b7bd" );

        user_name = header.append( "text" )
            .attr("class", "tote_dates")
            .attr("x", 20)
            .attr("y", 30)
            .attr("text-anchor", "start")
            .text("@" + user);

        date_start = header.append( "text" )
            .attr("class", "tote_dates")
            .attr("x", 845)
            .attr("y", 30)
            .attr("text-anchor", "end");

        // All axis offset x & y by 0.5 to prevent antaliasing when converting to canvas
        // .x.axis
        d3.select("#svg")
            .append("svg:g")
            .attr("class", "x axis");

        // .y.axis
        d3.select("#svg")
            .append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + (padding - 2.5) + ", 333)");

        // .yr.axis
        d3.select("#svg")
            .append("svg:g")
            .attr("class", "yr axis")
            .attr("transform", "translate(" + (width - padding + 2.5) + ", 149)");

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

        scaleL_axis = d3.scale.linear().domain([0, bars_max]).rangeRound([115, 0]),
        scaleR_axis = d3.scale.linear().domain(total_ext).rangeRound([175, 0]),
        scaleX_bars = d3.time.scale.utc().domain(days_ext).range([0, width - (padding * 2) - day_width]),
        scaleX_line = d3.time.scale.utc().domain(days_ext).range([6.5, width - (padding * 2) - 6.5]),
        scaleY_bars = d3.scale.linear().domain([0, bars_max]).rangeRound([115, 0]),
        scaleY_line = d3.scale.linear().domain(total_ext).range([175, 0]),

        xAxis = d3.svg.axis().scale(scaleX_bars).tickSize(10).tickPadding(8),
        ylAxis = d3.svg.axis().scale(scaleL_axis).orient("left").tickValues(scaleL_axis.domain()),
        yrAxis = d3.svg.axis().scale(scaleR_axis).orient("right").tickValues(scaleR_axis.domain()),

        line = d3.svg.line()
            .x(function(d) { return scaleX_line(parseDate(d[0])); })
            .y(function(d) { return scaleY_line(d[4]); });

        // Total followers path.
        path = chart_area.selectAll("path")
            .data([datum]);

        points = chart_area.selectAll("circle")
            .data(datum);

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
                .attr("class", "line")
                .attr("d", line);

            path.transition()
                .duration(400)
                .style("opacity", 1)
                .ease("quad")
                .attr("d", line);

            path.exit()
                .remove();

            points.enter()
                .append("svg:circle")
                .attr("clip-path", "url(#clip)")
                .attr("class", "point")
                .attr("cx", function(d) { return scaleX_line(parseDate(d[0])); })
                .attr("cy", function(d) { return scaleY_line(d[4]); })
                .attr("r", 5);

            points.transition()
                .duration(400)
                .style("opacity", 1)
                .ease("quad")
                .attr("cx", function(d) { return scaleX_line(parseDate(d[0])); })
                .attr("cy", function(d) { return scaleY_line(d[4]); })
                .attr("r", 5);

            points.exit()
                .remove();

            d3.select(".yr.axis")
                .transition()
                .duration(400)
                .style("opacity", 1)
                .call(yrAxis);

        } else {

            path.transition()
                .duration(400)
                .style("opacity", 0);

            points.transition()
                .duration(400)
                .style("opacity", 0);

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
            .attr("transform", "translate( " + (Math.round(padding + (day_width / 2)) + 0.5) + ", 450)")
            .transition()
            .duration(400)
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
            .attr( "width", 140 )
            .attr( "height", 10 )
            .attr("x", function(d, i) { return i * 140; })
            .attr("y", -150)
            .attr( "fill", function(d, i) { return colors[i]; } );

        tote_label.enter()
            .append( "text" )
            .attr("class", "tote_label")
            .text(function(d) { return labels[d]; })
            .attr("x", function(d, i) { return i * 140 - 140; })
            .attr("y", -150 + 60)
            .attr("text-anchor", "start")
            .attr("fill", '#9e9e9e');

        tote_val.enter()
            .append( "text" )
            .attr("class", "tote_val")
            .text(function(d) { return widgetVal(d); })
            .attr("x", function(d, i) { return i * 140 - 140; })
            .attr("y", -150 + 35)
            .attr("text-anchor", "start");

        date_start.transition()
            .text(moment(flat_dates[0]).format("MMM Do") + " - " + moment(flat_dates[1]).format("MMM Do YYYY"));

        if (unchecked){

            tote_rect.transition()
                .duration(500)
                .delay(500)
                .attr("x", function(d, i) { return i * 170 - 170; });

            tote_label.transition()
                .duration(500)
                .delay(500)
                .attr("x", function(d, i) { return i * 170 - 170; });

            tote_val.transition()
                .duration(500)
                .tween("text", widgetTween)
                .delay(500)
                .attr("x", function(d, i) { return i * 170 - 170; });

        } else {

            tote_rect.transition()
                .duration(500)
                .attr("x", function(d, i) { return i * 170 - 170; })
                .transition()
                .delay(500)
                .attr("y", 95);

            tote_label.transition()
                .duration(500)
                .attr("x", function(d, i) { return i * 170 - 170; })
                .transition()
                .delay(500)
                .attr("y", 85);

            tote_val.transition()
                .duration(500)
                .attr("x", function(d, i) { return i * 170 - 170; })
                .text(function retn(d) { return widgetVal(d); })
                .tween("text", widgetTween)
                .transition()
                .delay(500)
                .attr("y", 65);
        }

        tote_rect.exit()
            .transition()
            .duration(500)
            .attr("y", -150)
            .transition()
            .delay(500);

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

        d3.selectAll(".y path, .y line, .yr path, .yr line")
            .style("fill", "none")
            .style("shape-rendering", "crispEdges")
            .style("stroke", "rgba(169, 169, 138, 0.4)");

        d3.selectAll(".x line")
            .style("fill", "none")
            .style("stroke", "#fff");

        d3.selectAll(".x path")
            .style("fill", "none")
            .style("display", "none");

        d3.selectAll(".y, .yr")
            .style("font-size", "10")
            .style("font-family", "'roboto';")
            .style("fill", "#9e9e9e");

        d3.selectAll(".x text")
            .style("font-size", "12")
            .style("font-family", "'roboto';")
            .style("fill", "#fff");

        d3.selectAll("#header text")
            .style("font-size", "18")
            .style("font-family", "'roboto';")
            .style("font-weight", "normal")
            .style("fill", "#fff");

        d3.selectAll(".tote_label")
            .style("font-size", "14")
            .style("font-family", "'roboto';")
            .style("font-weight", "normal")
            .style("fill", "#9e9e9e");

        d3.selectAll(".tote_val")
            .style("font-family", "'roboto';")
            .style("font-size", "24")
            .style("font-weight", "bold")
            .style("fill", "#3B9CAF");

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

d3.json("stats.json", function (data) {

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
