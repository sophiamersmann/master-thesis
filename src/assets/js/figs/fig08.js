(function () {
  const FILENAME = "data/fig08/correlations.json";
  const FEATURES = [
    "replicate-spectra",
    "precursor-scores",
    "sibling-ions",
    "sibling-modifications",
    "sibling-scores",
  ];
  const RADIUS = 30;
  const LEGEND_STEPS = [1, 0.8, 0.6, 0.4, 0.2];

  const margin = {
    top: 90,
    right: 60,
    bottom: 30,
    left: 120,
  };
  const width = 600 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3
    .select("#figure08-A")
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )
    .attr("preserveAspectRatio", "xMinYMin meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3
    .select("#figure08-A")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  d3.json(FILENAME).then((data) => {
    // discrete feature scale
    const scale = d3.scaleBand().range([height, 0]).domain(FEATURES).padding(1);

    // y-axis
    svg
      .append("g")
      .attr("class", "axis axis-y")
      .call(d3.axisLeft(scale).tickFormat((d) => prettyFeature(d)));

    // x-axis
    svg
      .append("g")
      .attr("class", "axis axis-x")
      .call(d3.axisTop(scale).tickFormat((d) => prettyFeature(d)));
    svg
      .selectAll(".axis-x text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "start");

    // highlight specific regions
    highlightRect(svg, scale, "sibling-scores", "sibling-ions");
    highlightRect(svg, scale, "precursor-scores", "replicate-spectra");

    // highlight data point that is hovered over
    svg
      .append("circle")
      .attr("id", "circle-highlight")
      .attr("fill-opacity", 0)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0);

    // add correlation data points
    svg
      .selectAll(".circle-corr")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "circle-corr")
      .attr("cx", (d) => scale(d.feature1))
      .attr("cy", (d) => scale(d.feature2))
      .attr("r", (d) => d.corr * RADIUS)
      .attr("fill", (d) => d3.interpolateBlues(d.corr))
      .on("mouseover", (d) => {
        tooltip.style("opacity", 1);
        svg
          .select("#circle-highlight")
          .attr("cx", scale(d.feature1))
          .attr("cy", scale(d.feature2))
          .attr("r", d.corr * RADIUS + 3)
          .attr("stroke", d3.interpolateBlues(d.corr))
          .attr("stroke-opacity", 1);
      })
      .on("mousemove", (d) => {
        tooltip
          .html(
            "Correlation<br>" +
              `between <b>${prettyFeature(d.feature2)}</b><br>` +
              `and <b>${prettyFeature(d.feature1)}</b>: ` +
              `<b>${d3.format(".2f")(d.corr)}</b>`
          )
          .style("left", `${d3.event.pageX - 100}px`)
          .style("top", `${d3.event.pageY - 50}px`);
      })
      .on("mouseout", (d) => {
        tooltip.style("opacity", 0);
        svg.select("#circle-highlight").attr("stroke-opacity", 0);
      });

    // legend
    const legend = svg.append("g").attr("class", "legend");

    // legend title
    legend
      .append("text")
      .attr("class", "title")
      .attr("x", width + margin.right + 75)
      .attr("y", height / 4 - RADIUS - 40)
      .text("Pearson's")
      .style("text-anchor", "middle");
    legend
      .append("text")
      .attr("class", "title")
      .attr("x", width + margin.right + 75)
      .attr("y", height / 4 - RADIUS - 40)
      .text("Correlation")
      .style("text-anchor", "middle")
      .style("transform", "translate(0,12px)");
    legend
      .append("text")
      .attr("class", "title")
      .attr("x", width + margin.right + 75)
      .attr("y", height / 4 - RADIUS - 40)
      .text("Coefficient")
      .style("text-anchor", "middle")
      .style("transform", "translate(0,24px)");

    // legend items
    LEGEND_STEPS.forEach((corr, i) => {
      let translateY = RADIUS - corr * RADIUS;
      legend
        .append("circle")
        .attr("cx", width + margin.right + 75)
        .attr("cy", height / 4)
        .attr("r", corr * RADIUS)
        .style("transform", `translate(0,${translateY}px)`)
        .style("fill", d3.interpolateBlues(corr));

      translateY -= corr * RADIUS;
      legend
        .append("text")
        .attr("x", width + margin.right + 75 + 5 + RADIUS)
        .attr("y", height / 4 + translateY)
        .text(d3.format(".1f")(corr));
      legend
        .append("line")
        .attr("x1", width + margin.right + 75)
        .attr("y1", height / 4 + translateY)
        .attr("x2", width + margin.right + 75 + 5 + RADIUS)
        .attr("y2", height / 4 + translateY)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("stroke-dasharray", 4);
    });
  });

  // draw rectangle enclosing a set of features
  function highlightRect(svg, scale, from, to, padding = 10) {
    const leftTop = scale(from) - RADIUS - padding;
    const rightBottom = scale(to) + RADIUS + padding;
    svg
      .append("rect")
      .attr("x", leftTop)
      .attr("y", leftTop)
      .attr("width", rightBottom - leftTop)
      .attr("height", rightBottom - leftTop)
      .attr("stroke", "#fcba03")
      .attr("stroke-width", 3)
      .attr("fill", "#fcba03")
      .attr("fill-opacity", 0.1);
  }
})();
