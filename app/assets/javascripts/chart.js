var formatTime = d3.time.format("%H:%M");

var stationDistance = function(stations, station_code) {
  matched_station = stations.find(function(station) { return station.name === station_code } );
  return matched_station.distance
}

var parseTime = function(s) {
  var t = formatTime.parse(s);
  if (t != null && t.getHours() < 3) t.setDate(t.getDate() + 1);
  return t;
}

var drawGraph = function(data, stations, services, topAxis) {
  if (topAxis) {
    var topMargin = 30;
  } else {
    var topMargin = 5;
  }

  var margin = {top: topMargin, right: 30, bottom: 20, left:50},
      width = 600 - margin.left - margin.right,
      height = 200 - margin.top - margin.bottom;

  var x = d3.time.scale()
      .domain([parseTime(data.domain_start), parseTime(data.domain_end)])
      .range([0, width]);

  var y = d3.scale.linear()
      .range([0, height]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .ticks(8)
      .tickFormat(formatTime);

  var svg = d3.select(".chart-container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("y", -margin.top)
      .attr("x", '-5px')
      .attr("width", width + 10)
      .attr("height", height + margin.top + margin.bottom + 10);

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.svg.axis()
        .scale(x)
        .ticks(8).tickSize(-height, 0, 0).tickFormat(""))

  y.domain(d3.extent(stations, function(d) { return d.distance; }));

  var station = svg.append("g")
      .attr("class", "station")
    .selectAll("g")
      .data(stations)
    .enter().append("g")
      .attr("transform", function(d) { return "translate(0," + y(d.distance) + ")"; })
      .style("font-size", '14px');

  station.append("text")
      .attr("x", -6)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  station.append("line")
      .attr("x2", width);

  if (topAxis) {
    svg.append("g")
        .attr("class", "x top axis")
        .call(xAxis.orient("top"));
  } else {
    var ticks = d3.svg.axis()
      .scale(x)
      .ticks(8)
      .tickFormat('');

    svg.append("g")
        .attr("class", "x top axis")
        .call(ticks.orient("top"));
  }

  svg.append("g")
      .attr("class", "x bottom axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis.orient("bottom"));

  var train = svg.append("g")
      .attr("class", "train")
      .attr("clip-path", "url(#clip)")
    .selectAll("g")
      .data(services)
    .enter().append("g")

  var services = train.selectAll("line")
      .data(function(d) { return [d] })
    .enter()

  services.append('path')
    .attr('d', function(d) { return `M ${x(parseTime(d.departure))} ${y(stationDistance(stations, d.from))} L ${x(parseTime(d.arrival))} ${y(stationDistance(stations, d.to))}`})
    .attr('id', function(d) { return `${d.departure}-${d.arrival}`})
    .style("stroke", function(d) { return d.new_timetable ? '#984EA3' : '#377EB8' })
    .style("stroke-width", '4px')
    .style("opacity", function(d) { return d.overtaken ? '0.2' : '1' })
    .style('stroke-linecap', "round")

  services.append('text')
    .append('textPath')
    .text(function(d) { return d.length + 'm'} )
    .attr('href', function(d) { return `#${d.departure}-${d.arrival}`})
    .attr('startOffset', '50%')
    .attr('text-anchor', 'middle')
    .style("opacity", function(d) { return d.overtaken ? '0.2' : '1' })
    .style('font-weight', 'bold')
    .style('fill', '#000')
    .attr('baseline-shift', '3px');
}

d3.json(d3.select(".chart-container").attr('data-url'), function(error, data) {
  drawGraph(data, data.stations, data.services.filter(service => !service.new_timetable), true);
  drawGraph(data, data.stations, data.services.filter(service => service.new_timetable), false);
});
