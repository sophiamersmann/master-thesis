(function () {
  const DATA_PATH = "data/fig07/";
  const DIFF_FILENAME = `${DATA_PATH}differences.csv`;
  const FEATURES = [
    "replicate-spectra",
    "precursor-scores",
    "sibling-ions",
    "sibling-modifications",
    "sibling-scores",
  ];

  const BOX_WIDTH = 75;

  // first distributions to be displayed
  const FIRST_ENGINE = "comet";
  const FIRST_FEATURE = "sibling-scores";
  const distFilename = `${DATA_PATH}${FIRST_ENGINE}-${FIRST_FEATURE}.json`;

  // Differences figure
  const marginA = {
    top: 30,
    right: 10,
    bottom: 60,
    left: 60,
  };
  const widthA = 600 - marginA.left - marginA.right;
  const heightA = 350 - marginA.top - marginA.bottom;

  // Correct and incorrect distributions
  const marginB = {
    top: 50,
    right: 30,
    bottom: 50,
    left: 50,
  };
  const widthB = 300 - marginB.left - marginB.right;
  const heightB = 350 - marginB.top - marginB.bottom;

  // Statistics necessary for box plots, to be filled
  const stats = {};

  const svgA = d3
    .select("#figure07-A")
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${widthA + marginA.left + marginA.right} ${
        heightA + marginA.top + marginA.bottom
      }`
    )
    .attr("preserveAspectRatio", "xMinYMin meet")
    .append("g")
    .attr("transform", `translate(${marginA.left}, ${marginA.top})`);

  const svgB = d3
    .select("#figure07-B")
    .append("svg")
    .attr("width", widthB + marginB.left + marginB.right)
    .attr("height", heightB + marginB.top + marginB.bottom)
    .append("g")
    .attr("transform", `translate(${marginB.left}, ${marginB.top})`);

  d3.csv(DIFF_FILENAME, (d) => ({
    engine: d.engine,
    feature: d.feature,
    difference: +d.difference,
  })).then((data) => {
    const plot = engineSwarmPlot(
      svgA,
      data,
      "difference",
      {
        width: widthA,
        height: heightA,
        margin: marginA,
      },
      "circle-diff"
    );

    // add x label
    svgA
      .append("text")
      .attr("class", "label label-x")
      .attr("text-anchor", "middle")
      .attr("x", widthA / 2)
      .attr("y", heightA + marginA.top + 5)
      .text("Average difference between feature values");
    svgA
      .append("text")
      .attr("class", "label label-x")
      .attr("text-anchor", "middle")
      .attr("x", widthA / 2)
      .attr("y", heightA + marginA.top + 5)
      .style("transform", "translate(0, 1.1em)")
      .text("of correct and incorrect peptide identifications");

    d3.selectAll(".circle-diff")
      .style("stroke", (d) => featureColor(d.data.feature))
      .style("fill", (d) => featureColor(d.data.feature, true));

    const lineFunc = d3
      .line()
      .x((d) => d.x)
      .y((d) => d.y);

    // connect data points of the same feature
    svgA
      .selectAll(".connect")
      .data(
        d3
          .nest()
          .key((d) => d.feature)
          .entries(data)
      )
      .enter()
      .append("path")
      .lower()
      .attr("class", (d) => `connect connect-${d.key}`)
      .attr("d", (d) => lineFunc(d.values))
      .attr("stroke", (d) => featureColor(d.key))
      .attr("stroke-width", 1)
      .attr("fill", "none");

    // show label features
    svgA
      .selectAll(".label-feature")
      .data(data.filter((d) => d.engine === "comet"))
      .enter()
      .append("text")
      .attr("id", (d) => `label-feature-${d.feature}`)
      .attr("class", "label label-feature")
      .attr("x", (d) => plot.xScale(d.difference))
      .attr("y", (d) => featureLabelPadding(d.feature))
      .text((d) => prettyFeature(d.feature));

    // background for label features
    FEATURES.forEach((feature) => {
      const labelFeatureKey = `#label-feature-${feature}`;
      const bbox = svgA.select(labelFeatureKey).node().getBBox();
      svgA
        .insert("rect", labelFeatureKey)
        .attr("class", "label-feature-background")
        .attr("x", bbox.x - 1)
        .attr("y", bbox.y - 1)
        .attr("width", bbox.width + 2)
        .attr("height", bbox.height + 2)
        .attr("fill", featureColor(feature, true));
      svgA
        .append("line")
        .lower()
        .attr("class", "label-feature-connect")
        .attr("x1", bbox.x - 1)
        .attr("y1", bbox.y - 1)
        .attr("x2", bbox.x - 1)
        .attr("y2", plot.engineScale("comet"))
        .attr("stroke", featureColor(feature, true))
        .attr("stroke-width", 1)
        .attr("fill", "none");
    });
  });

  // plot box plots
  function pairedBoxPlot(svg, engine, feature) {
    const key = createKey(engine, feature);
    d3.json(`${DATA_PATH + key}.json`).then((data) => {
      if (!(key in stats)) {
        stats[key] = d3
          .nest()
          .key((d) => d.status)
          .sortKeys(d3.descending)
          .rollup(computeStats)
          .entries(data);
      }

      const xScale = d3
        .scaleBand()
        .range([0, widthB])
        .domain(["Incorrect", "Correct"])
        .paddingInner(1)
        .paddingOuter(0.5);
      svgB
        .append("g")
        .attr("class", "axis-x")
        .attr("transform", `translate(0, ${heightB})`)
        .call(d3.axisBottom(xScale));

      const statsExtent = [
        d3.min(stats[key], (d) => d.value.min),
        d3.max(stats[key], (d) => d.value.max),
      ];
      const yScale = d3
        .scaleLinear()
        .domain(statsExtent)
        .nice()
        .range([heightB, 0]);
      svg.append("g").attr("class", "axis-y").call(d3.axisLeft(yScale));

      // Vertical line in  box plot
      svg
        .selectAll(".box-line-vertical-top")
        .data(stats[key])
        .enter()
        .append("line")
        .attr("class", "box-line-vertical-top")
        .attr("x1", (d) => xScale(d.key))
        .attr("x2", (d) => xScale(d.key))
        .attr("y1", (d) => yScale(d.value.q3))
        .attr("y2", (d) => yScale(d.value.max))
        .attr("stroke", "black")
        .style("width", 40);
      svg
        .selectAll(".box-line-vertical-bottom")
        .data(stats[key])
        .enter()
        .append("line")
        .attr("class", "box-line-vertical-bottom")
        .attr("x1", (d) => xScale(d.key))
        .attr("x2", (d) => xScale(d.key))
        .attr("y1", (d) => yScale(d.value.min))
        .attr("y2", (d) => yScale(d.value.q1))
        .attr("stroke", "black")
        .style("width", 40);

      // Main box
      svg
        .selectAll(".box")
        .data(stats[key])
        .enter()
        .append("rect")
        .attr("class", "box")
        .attr("x", (d) => xScale(d.key) - BOX_WIDTH / 2)
        .attr("y", (d) => yScale(d.value.q3))
        .attr("height", (d) => yScale(d.value.q1) - yScale(d.value.q3))
        .attr("width", BOX_WIDTH)
        .attr("stroke", "black")
        .style("fill", "#f2cc37")
        .style("fill-opacity", (d) => (d.key === "Correct" ? 1.0 : 0.5));

      // Median line
      svg
        .selectAll(".box-line-median")
        .data(stats[key])
        .enter()
        .append("line")
        .attr("class", "box-line-median")
        .attr("x1", (d) => xScale(d.key) - BOX_WIDTH / 2)
        .attr("x2", (d) => xScale(d.key) + BOX_WIDTH / 2)
        .attr("y1", (d) => yScale(d.value.median))
        .attr("y2", (d) => yScale(d.value.median))
        .attr("stroke", "black")
        .style("width", 80);

      // Lower whisker
      svg
        .selectAll(".box-line-min")
        .data(stats[key])
        .enter()
        .append("line")
        .attr("class", "box-line-min")
        .attr("x1", (d) => xScale(d.key) - BOX_WIDTH / 4)
        .attr("x2", (d) => xScale(d.key) + BOX_WIDTH / 4)
        .attr("y1", (d) => yScale(d.value.min))
        .attr("y2", (d) => yScale(d.value.min))
        .attr("stroke", "black")
        .style("width", 40);

      // Upper whisker
      svg
        .selectAll(".box-line-max")
        .data(stats[key])
        .enter()
        .append("line")
        .attr("class", "box-line-max")
        .attr("x1", (d) => xScale(d.key) - BOX_WIDTH / 4)
        .attr("x2", (d) => xScale(d.key) + BOX_WIDTH / 4)
        .attr("y1", (d) => yScale(d.value.max))
        .attr("y2", (d) => yScale(d.value.max))
        .attr("stroke", "black")
        .style("width", 40);

      // label on the bottom
      svg
        .append("text")
        .attr("class", "label label-x")
        .style("text-anchor", "middle")
        .attr("x", widthB / 2)
        .attr("y", -20)
        .text(prettyEngine(engine));

      // add y label
      svg
        .append("text")
        .attr("class", "label label-y")
        .style("text-anchor", "middle")
        .attr("transform", `translate(-40, ${heightB / 2})rotate(-90)`)
        .text(prettyFeature(feature));
    });
  }

  function updatePairedBoxPlot(svg, engine, feature) {
    const key = createKey(engine, feature);
    d3.json(`${DATA_PATH + key}.json`).then((data) => {
      if (!(key in stats)) {
        stats[key] = d3
          .nest()
          .key((d) => d.status)
          .sortKeys(d3.descending)
          .rollup(computeStats)
          .entries(data);
      }

      const statsExtent = [
        d3.min(stats[key], (d) => d.value.min),
        d3.max(stats[key], (d) => d.value.max),
      ];
      const yScale = d3
        .scaleLinear()
        .domain(statsExtent)
        .nice()
        .range([heightB, 0]);
      svgB.select(".axis-y").call(d3.axisLeft(yScale));

      // Vertical line in  box plot
      svg
        .selectAll(".box-line-vertical-top")
        .data(stats[key])
        .transition()
        .duration(800)
        .attr("y1", (d) => yScale(d.value.q3))
        .attr("y2", (d) => yScale(d.value.max));
      svg
        .selectAll(".box-line-vertical-bottom")
        .data(stats[key])
        .transition()
        .duration(800)
        .attr("y1", (d) => yScale(d.value.min))
        .attr("y2", (d) => yScale(d.value.q1));

      // Main box
      svg
        .selectAll(".box")
        .data(stats[key])
        .transition()
        .duration(800)
        .attr("y", (d) => yScale(d.value.q3))
        .attr("height", (d) => yScale(d.value.q1) - yScale(d.value.q3));

      // Median line
      svg
        .selectAll(".box-line-median")
        .data(stats[key])
        .transition()
        .duration(800)
        .attr("y1", (d) => yScale(d.value.median))
        .attr("y2", (d) => yScale(d.value.median));

      // Lower whisker
      svg
        .selectAll(".box-line-min")
        .data(stats[key])
        .transition()
        .duration(800)
        .attr("y1", (d) => yScale(d.value.min))
        .attr("y2", (d) => yScale(d.value.min));

      // Upper whisker
      svg
        .selectAll(".box-line-max")
        .data(stats[key])
        .transition()
        .duration(800)
        .attr("y1", (d) => yScale(d.value.max))
        .attr("y2", (d) => yScale(d.value.max));

      // update labels
      svg.select(".label-x").text(prettyEngine(engine));
      svg.select(".label-y").text(prettyFeature(feature));
    });
  }

  // compute statistics for a box plot
  function computeStats(data) {
    const scores = data.map((d) => d.score).sort(d3.ascending);

    const q1 = d3.quantile(scores, 0.25);
    const median = d3.quantile(scores, 0.5);
    const q3 = d3.quantile(scores, 0.75);
    const iqr = q3 - q1;

    const coreScores = scores.filter(
      (score) => (score >= q1 - 1.5 * iqr) & (score <= q3 + 1.5 * iqr)
    );

    return {
      q1,
      median,
      q3,
      interQuartileRange: iqr,
      min: d3.min(coreScores),
      max: d3.max(coreScores),
    };
  }

  // colors of features
  function featureColor(feature, light = false) {
    switch (feature) {
      case "replicate-spectra":
        return light ? "#fff4b5" : "#ffd800";
      case "precursor-scores":
        return light ? "#ffd199" : "#ff8d00";
      case "sibling-ions":
        return light ? "#d1d182" : "#818100";
      case "sibling-modifications":
        return light ? "#e6e1a5" : "#beb86b";
      case "sibling-scores":
        return light ? "#9dad80" : "#556b2f";
    }
  }

  // padding for feature labels
  function featureLabelPadding(feature) {
    switch (feature) {
      case "replicate-spectra":
        return 15;
      case "precursor-scores":
        return 32.5;
      default:
        return 50;
    }
  }
})();
