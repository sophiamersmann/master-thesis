// create histogram
function createHistogram(data, xScale, yScale) {
  // general histogram
  const histogram = d3
    .histogram()
    .domain(yScale.domain())
    .thresholds(yScale.ticks(50));

  // histogram bins for correct and incorrect identifications
  const bins = histogram(data);

  // create scale
  const maxBinLength = d3.max(bins.map((d) => d.length));
  const violinScale = d3
    .scaleLinear()
    .range([0, xScale.bandwidth()])
    .domain([-maxBinLength, maxBinLength]);

  return {
    bins,
    scale: violinScale,
  };
}

// plot score distribution
function plotScoreDistribution(svg, data, config) {
  // y scale (score)
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.score))
    .nice()
    .range([config.height, 0]);

  // add y axis
  svg
    .append("g")
    .attr("class", "axis axis-y")
    .attr("transform", `translate(${config.width}, 0)`)
    .call(d3.axisRight(yScale));

  // add y label
  const translateX = config.width + config.margin.right + 5;
  const translateY = config.height / 2;
  svg
    .append("text")
    .attr("class", "label label-y")
    .style("text-anchor", "middle")
    .attr("transform", `translate(${translateX}, ${translateY})rotate(90)`)
    .text("Score");

  // add 'correct' and 'incorrect' label
  svg
    .append("text")
    .attr("class", "label label-correct")
    .style("text-anchor", "middle")
    .attr("x", config.width / 4)
    .attr("y", -5)
    .text("Incorrect");
  svg
    .append("text")
    .attr("class", "label label-incorrect")
    .style("text-anchor", "middle")
    .attr("x", (config.width / 4) * 3)
    .attr("y", -5)
    .text("Correct");

  // x scale (correct / incorrect)
  const xScale = d3
    .scaleBand()
    .range([0, config.width])
    .domain(["pseudo"])
    .padding(0.05);
  const offset = 0.05 * xScale.bandwidth();
  const halfBandwidth = xScale.bandwidth() / 2 + offset;

  // histograms for correct and incorrect distributions
  const correctDist = createHistogram(
    data.map((d) => {
      if (d.correct) return d.score;
    }),
    xScale,
    yScale
  );
  const incorrectDist = createHistogram(
    data.map((d) => {
      if (!d.correct) return d.score;
    }),
    xScale,
    yScale
  );

  // add correct distribution
  svg
    .selectAll("rectCorrect")
    .data(correctDist.bins)
    .enter()
    .append("rect")
    .attr("class", "correct")
    .style("stroke", "none")
    .style("fill", "#f2cc37")
    .attr("x", halfBandwidth)
    .attr("width", 0)
    .attr("y", (d) => yScale(d.x1))
    .attr("height", (d) => yScale(d.x0) - yScale(d.x1));

  // animate correct distribution
  svg
    .selectAll("rect.correct")
    .transition()
    .duration(300)
    .attr("width", (d) => correctDist.scale(d.length) - halfBandwidth + offset)
    .delay((_, i) => i * 100);

  // add incorrect distribution
  svg
    .selectAll("rectIncorrect")
    .data(incorrectDist.bins)
    .enter()
    .append("rect")
    .attr("class", "incorrect")
    .style("stroke", "none")
    .style("fill", "#f2cc37")
    .style("fill-opacity", 0.5)
    .attr("y", (d) => yScale(d.x1))
    .attr("x", halfBandwidth)
    .attr("width", 0)
    .attr("height", (d) => yScale(d.x0) - yScale(d.x1));

  // animate incorrect distribution
  svg
    .selectAll("rect.incorrect")
    .transition()
    .duration(300)
    .attr("x", (d) => incorrectDist.scale(-d.length) + offset)
    .attr(
      "width",
      (d) => halfBandwidth - (incorrectDist.scale(-d.length) + offset)
    )
    .delay((_, i) => i * 100);

  return {
    xScale,
    yScale,
    halfBandwidth,
    offset,
    correctDist,
    incorrectDist,
  };
}
