function engineSwarmPlot(svg, data, xKey, config, circleSel, radius = 7) {
  // difference scale (x axis)
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d[xKey]))
    .nice()
    .range([0, config.width]);

  // add x axis
  svg
    .append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0, ${config.height})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0));
  svg
    .append("g")
    .attr("class", "axis axis-x")
    .call(d3.axisTop(xScale).tickSizeOuter(0));

  // discrete engine scale (y axis)
  const engineScale = d3
    .scaleBand()
    .range([config.height, 0])
    .domain(["xtandem", "msgf", "comet"])
    .padding(1);

  // add y axis
  svg
    .append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(engineScale).tickFormat((d) => prettyEngine(d)));

  // compute positions of data points using a force simulation
  const simulation = d3
    .forceSimulation(data)
    .force("x", d3.forceX((d) => xScale(d[xKey])).strength(5))
    .force(
      "y",
      d3.forceY((d) => engineScale(d.engine))
    )
    .force("collide", d3.forceCollide(radius + 1))
    .stop();
  for (let i = 0; i < 120; ++i) simulation.tick();
  const cell = svg
    .append("g")
    .attr("class", "cells")
    .selectAll("g")
    .data(
      d3
        .voronoi()
        .extent([
          [-config.margin.left, -config.margin.top],
          [
            config.width + config.margin.right,
            config.height + config.margin.top,
          ],
        ])
        .x((d) => d.x)
        .y((d) => d.y)
        .polygons(data)
    )
    .enter()
    .append("g");

  // add data points to KS figure
  cell
    .append("circle")
    .attr("class", circleSel)
    .attr("cx", (d) => d.data.x)
    .attr("cy", (d) => d.data.y)
    .attr("r", radius);

  return {
    xScale,
    engineScale,
  };
}
