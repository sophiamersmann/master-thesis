const METHODS = ["IDPEP", "Percolator"];
const MIXTURES = ["A", "B"];

// dropdown template to select the mixture
const selectMixtureTemplate = $("<select>").attr("class", "select-mixture");
MIXTURES.forEach((mixture) => {
  selectMixtureTemplate.append(
    $("<option>").attr("value", mixture).text(`Mixture ${mixture}`)
  );
});

// set up plot for the number of correct identifications
function setupMultipleCorrect(
  svg,
  data,
  config,
  accessor = (d) => d.n_correct
) {
  // PEP threshold scale (x-axis)
  const threshScale = d3
    .scaleLinear()
    .domain(nestedExtent(data, (d) => d.thresh))
    .nice()
    .range([0, config.width]);

  // Number of correct identifications (y-axis)
  const yScale = d3
    .scaleLinear()
    .domain(nestedExtent(data, accessor))
    .nice()
    .range([config.height, 0]);

  // add x and y axis
  svg
    .append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0, ${config.height})`)
    .call(d3.axisBottom(threshScale));
  svg.append("g").attr("class", "axis axis-y").call(d3.axisLeft(yScale));

  // major and minor ticks
  customiseTicks(svg);

  // add x-axis label
  svg
    .append("text")
    .attr("class", "label label-x")
    .attr("text-anchor", "middle")
    .attr("x", config.width / 2)
    .attr("y", config.height + config.margin.top + 5)
    .text("PEP Threshold");

  // add y-axis label
  svg
    .append("text")
    .attr("class", "label label-y")
    .attr("text-anchor", "middle")
    .attr("y", -config.margin.left)
    .attr("x", -(config.height / 2))
    .attr("transform", "rotate(-90)")
    .text("Number of Correct Identifications");

  return {
    threshScale,
    yScale,
  };
}

// update plot of correct identifications
function updateMultipleCorrect(svgSele, data, scales) {
  const svg = d3.select(svgSele);

  METHODS.forEach((method) => {
    // relevant data
    const dataFiltered = data.filter((d) => d.method === method);

    // update confidence band
    svg
      .select(`.band-${method}`)
      .datum(dataFiltered)
      .transition()
      .duration(1000)
      .attr(
        "d",
        d3
          .area()
          .x((d) => scales.threshScale(d.thresh))
          .y0((d) =>
            scales.yScale(math.mean(d.n_correct) - math.std(d.n_correct))
          )
          .y1((d) =>
            scales.yScale(math.mean(d.n_correct) + math.std(d.n_correct))
          )
          .curve(d3.curveMonotoneX)
      );

    // update mean line plot
    svg
      .select(`.mean-${method}`)
      .datum(dataFiltered)
      .transition()
      .duration(1000)
      .attr(
        "d",
        d3
          .line()
          .x((d) => scales.threshScale(d.thresh))
          .y((d) => scales.yScale(math.mean(d.n_correct)))
          .curve(d3.curveMonotoneX)
      );

    // update scatter dots to the line
    svg
      .selectAll(`.circle-${method}`)
      .data(dataFiltered)
      .transition()
      .duration(1000)
      .attr("cx", (d) => scales.threshScale(d.thresh))
      .attr("cy", (d) => scales.yScale(math.mean(d.n_correct)));
  });
}

// set up plot for ROC curves
function setupMultipleROC(svg, data, config) {
  // FPR scale (x-axis)
  const xScale = d3.scaleLinear().domain([0, 1]).range([0, config.width]);

  // TPR scale (y-axis)
  const yScale = d3.scaleLinear().domain([0, 1]).range([config.height, 0]);

  // add x and y axis
  svg
    .append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0, ${config.height})`)
    .call(d3.axisBottom(xScale));
  svg.append("g").attr("class", "axis axis-y").call(d3.axisLeft(yScale));

  // minor and major ticks
  customiseTicks(svg);

  // add x-axis label
  svg
    .append("text")
    .attr("class", "label label-x")
    .attr("text-anchor", "middle")
    .attr("x", config.width / 2)
    .attr("y", config.height + config.margin.top + 5)
    .text("False Positive Rate");

  // add y-axis label
  svg
    .append("text")
    .attr("class", "label label-y")
    .attr("text-anchor", "middle")
    .attr("y", -config.margin.left)
    .attr("x", -(config.height / 2))
    .attr("transform", "rotate(-90)")
    .text("True Positive Rate");

  return {
    xScale,
    yScale,
  };
}

// draw ROC curve
function drawMultipleROC(svg, data, scales) {
  // draw one ROC curve for each method
  METHODS.forEach((method) => {
    // relevant data
    const dataFiltered = data.filter((d) => d.method === method);

    // add line plot
    svg
      .append("path")
      .datum(dataFiltered)
      .attr("class", `roc roc-${method}`)
      .attr("fill", "none")
      .attr("stroke", methodColor(method))
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x((d) => scales.xScale(d.fp_rate))
          .y((d) => scales.yScale(d.tp_rate))
          .curve(d3.curveMonotoneX)
      );
  });
}

// update ROC plot
function updateMultipleROC(svgSele, data, scales) {
  const svg = d3.select(svgSele);

  METHODS.forEach((method) => {
    // relevant data
    const dataFiltered = data.filter((d) => d.method === method);

    // update line plot
    svg
      .select(`.roc-${method}`)
      .datum(dataFiltered)
      .transition()
      .duration(1000)
      .attr(
        "d",
        d3
          .line()
          .x((d) => scales.xScale(d.fp_rate))
          .y((d) => scales.yScale(d.tp_rate))
          .curve(d3.curveMonotoneX)
      );
  });
}

// minor and major ticks
function customiseTicks(svg) {
  svg.selectAll(".axis-x .tick").each(function (d, i) {
    if (i % 2 !== 0) {
      d3.select(this).select("text").remove();
      d3.select(this).select("line").attr("y2", 3.5);
    }
  });
  svg.selectAll(".axis-y .tick").each(function (d, i) {
    if (i % 2 !== 0) {
      d3.select(this).select("text").remove();
      d3.select(this).select("line").attr("x2", -3.5);
    }
  });
}
