(function () {
  const DATA_PATH = "data/fig03/";
  const KS_FILENAME = `${DATA_PATH}ks-distances.csv`;

  // first distribution to be displayed
  const FIRST_DATASET = "B1";
  const FIRST_ENGINE = "xtandem";
  let distFilename = `${DATA_PATH}${FIRST_DATASET}-${FIRST_ENGINE}.json`;
  let prevEngine = FIRST_ENGINE;

  // KS distances figure
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
    left: 10,
  };
  const widthB = 300 - marginB.left - marginB.right;
  const heightB = 350 - marginB.top - marginB.bottom;

  const svgA = d3
    .select("#figure03-A")
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
    .select("#figure03-B")
    .append("svg")
    .attr("width", widthB + marginB.left + marginB.right)
    .attr("height", heightB + marginB.top + marginB.bottom)
    .append("g")
    .attr("transform", `translate(${marginB.left}, ${marginB.top})`);

  d3.csv(KS_FILENAME).then((data) => {
    const plot = engineSwarmPlot(
      svgA,
      data,
      "ks_distance",
      {
        width: widthA,
        height: heightA,
        margin: marginA,
      },
      "circle-dist"
    );

    // add x label
    svgA
      .append("text")
      .attr("class", "label label-x")
      .attr("text-anchor", "middle")
      .attr("x", widthA / 2)
      .attr("y", heightA + marginA.top + 5)
      .text("KS distance between score distributions");
    svgA
      .append("text")
      .attr("class", "label label-x")
      .attr("text-anchor", "middle")
      .attr("x", widthA / 2)
      .attr("y", heightA + marginA.top + 5)
      .style("transform", "translate(0, 1.1em)")
      .text("of correct and incorrect peptide identifications");

    // plot indicator line for current data point
    const firstDistObj = data.find(
      (d) => d.dataset === FIRST_DATASET && d.engine === FIRST_ENGINE
    );
    svgA
      .append("line")
      .attr("id", "indicator")
      .attr("x1", plot.xScale(firstDistObj.ks_distance))
      .attr("y1", 0)
      .attr("x2", plot.xScale(firstDistObj.ks_distance))
      .attr("y2", heightA)
      .style("stroke", "steelblue")
      .style("stroke-width", 1);

    // plot inital distribution
    d3.json(distFilename, (d) => ({
      score: +d.score,
      correct: d.correct,
    })).then((data) => {
      plotScoreDistribution(svgB, data, {
        margin: marginB,
        width: widthB,
        height: heightB,
      });
    });

    // add distribution description
    const label = createLabelFromFilename(distFilename);
    svgB
      .append("text")
      .attr("class", "label label-x")
      .style("text-anchor", "middle")
      .attr("x", widthB / 2)
      .attr("y", heightB + 20)
      .text(label[0]);
    svgB
      .append("text")
      .attr("class", "label label-x")
      .style("text-anchor", "middle")
      .attr("x", widthB / 2)
      .attr("y", heightB + 20)
      .style("transform", "translate(0,1.1em)")
      .text(label[1]);

    // add data points to KS figure
    d3.selectAll(".circle-dist")
      .style("stroke", "steelblue")
      .style("fill", (d) =>
        d.data.dataset === FIRST_DATASET && d.data.engine === FIRST_ENGINE
          ? "steelblue"
          : "#b6cee2"
      );

    // make data points interactive on hover
    svgA.selectAll(".circle-dist").on("mouseover", function (d) {
      // remove highlighting from all circles
      d3.selectAll(".circle-dist").style("fill", "#b6cee2");

      // highlight circle that is hovered over
      d3.select(this).style("fill", "steelblue");

      // move indicator line from the previous to the new data point
      svgA
        .select("#indicator")
        .transition()
        .duration(800)
        .attr("x1", plot.xScale(d.data.ks_distance))
        .attr("x2", plot.xScale(d.data.ks_distance));

      // update distribution
      distFilename = `${DATA_PATH}${d.data.dataset}-${d.data.engine}.json`;
      updateDistribution(distFilename);
    });
  });

  function updateDistribution(filename) {
    d3.json(filename, (d) => ({
      score: +d.score,
      correct: d.correct,
    })).then((data) => {
      svgB.selectAll(".label-x").remove();

      const name = distFilename
        .substring(distFilename.lastIndexOf("/") + 1)
        .replace(".json", "");

      const engine = name.split("-")[1];

      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.score))
        .nice()
        .range([heightB, 0]);

      if (engine != prevEngine) {
        prevEngine = engine;
        svgB.select(".axis-y").call(d3.axisRight(yScale));
      }

      const xScale = d3
        .scaleBand()
        .range([0, widthB])
        .domain(["pseudo"])
        .padding(0.05);

      const label = createLabelFromFilename(filename);

      svgB
        .append("text")
        .attr("class", "label label-x")
        .style("text-anchor", "middle")
        .attr("x", widthB / 2)
        .attr("y", heightB + 20)
        .text(label[0]);

      svgB
        .append("text")
        .attr("class", "label label-x")
        .style("text-anchor", "middle")
        .attr("x", widthB / 2)
        .attr("y", heightB + 20)
        .style("transform", "translate(0,1.1em)")
        .text(label[1]);

      const histogram = d3
        .histogram()
        .domain(yScale.domain())
        .thresholds(yScale.ticks(50));

      const binsCorrect = histogram(
        data.map((d) => {
          if (d.correct) return d.score;
        })
      );
      const binsIncorrect = histogram(
        data.map((d) => {
          if (!d.correct) return d.score;
        })
      );

      const maxBinLengthCorrect = d3.max(binsCorrect.map((d) => d.length));
      const maxBinLengthIncorrect = d3.max(binsIncorrect.map((d) => d.length));

      const violinScaleCorrect = d3
        .scaleLinear()
        .range([0, xScale.bandwidth()])
        .domain([-maxBinLengthCorrect, maxBinLengthCorrect]);
      const violinScaleIncorrect = d3
        .scaleLinear()
        .range([0, xScale.bandwidth()])
        .domain([-maxBinLengthIncorrect, maxBinLengthIncorrect]);

      const offset = 0.05 * xScale.bandwidth();
      const haldBandwidth = xScale.bandwidth() / 2 + offset;

      svgB
        .selectAll("rect.correct")
        .data(binsCorrect)
        .transition()
        .duration(300)
        .attr(
          "width",
          (d) => violinScaleCorrect(d.length) - haldBandwidth + offset
        );

      svgB
        .selectAll("rect.incorrect")
        .data(binsIncorrect)
        .transition()
        .duration(300)
        .attr("x", (d) => violinScaleIncorrect(-d.length) + offset)
        .attr(
          "width",
          (d) => haldBandwidth - (violinScaleIncorrect(-d.length) + offset)
        );
    });
  }

  function createLabelFromFilename(filename) {
    const name = distFilename
      .substring(distFilename.lastIndexOf("/") + 1)
      .replace(".json", "");

    let mixture = name[0];
    const repetition = name[1];
    const engine = name.split("-")[1];

    if (mixture === "C") {
      mixture = "A+B";
    }

    return [
      `${prettyEngine(engine)} applied to mixture ${mixture}`,
      `(${repetition}${ordinalSucc(repetition)} replicate)`,
    ];
  }

  function ordinalSucc(number) {
    switch (number) {
      case "1":
        return "st";
      case "2":
        return "nd";
      case "3":
        return "rd";
    }
  }
})();
