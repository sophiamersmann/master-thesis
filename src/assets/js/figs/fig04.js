(function () {
  const DATA_PATH = "data/fig04/";
  const ENGINES = ["comet", "msgf"];

  // measures of a single plot
  const margin = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 40,
  };
  const width = 300 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;
  const config = {
    margin,
    width,
    height,
  };

  const figure = d3.select("#figure04-A");

  // create all filenames
  const fileKeys = [];
  const files = [];
  MIXTURES.forEach((mixture) => {
    ENGINES.forEach((engine) => {
      const key = createKey(mixture, engine);
      fileKeys.push(`${key}-correct`);
      files.push(`${DATA_PATH + key}-n-correct-ids.json`);

      fileKeys.push(`${key}-roc`);
      files.push(`${DATA_PATH + key}-roc.json`);
    });
  });

  Promise.all(files.map((f) => d3.json(f))).then((dataChunks) => {
    // collect all data
    const dataCorrect = {};
    const dataROC = {};
    fileKeys.forEach((key, i) => {
      if (key.includes("-correct")) {
        dataCorrect[key.replace("-correct", "")] = dataChunks[i];
      } else {
        dataROC[key.replace("-roc", "")] = dataChunks[i];
      }
    });

    // for each engine generate plots for the first mixture
    const scalesCorrect = {};
    const scalesROC = {};
    ENGINES.forEach((engine) => {
      // add title
      const titleId = `title-for-${engine}`;
      figure
        .append("div")
        .attr("id", titleId)
        .attr("class", "title")
        .style("text-align", "center")
        .html(`<strong>${prettyEngine(engine)}</strong> applied to `);
      $(`#${titleId}`).append(
        selectMixtureTemplate.clone().data("engine", engine)
      );

      const plot = figure.append("div").attr("class", "plot-pair");

      // add svg for the correct identifications plot
      const svgCorrect = plot
        .append("div")
        .attr("class", "plot-ncorrect")
        .append("svg")
        .attr("id", `svg-n-correct-ids-${engine}`)
        .attr(
          "viewBox",
          `0 0 ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
          }`
        )
        .attr("preserveAspectRatio", "xMinYMin meet")
        // .attr('width', width + margin.left + margin.right)
        // .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // add svg for the ROC curve
      const svgROC = plot
        .append("div")
        .attr("class", "plot-roc")
        .append("svg")
        .attr("id", `svg-roc-${engine}`)
        .attr(
          "viewBox",
          `0 0 ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
          }`
        )
        .attr("preserveAspectRatio", "xMinYMin meet")
        // .attr('width', width + margin.left + margin.right)
        // .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // draw plots
      const key = createKey(MIXTURES[0], engine);
      scalesCorrect[engine] = setupMultipleCorrect(
        svgCorrect,
        dataCorrect,
        config,
        (d) => math.mean(d.n_correct)
      );
      scalesROC[engine] = setupMultipleROC(svgROC, dataROC, config);

      drawMultipleCorrect(svgCorrect, dataCorrect[key], scalesCorrect[engine]);
      drawMultipleROC(svgROC, dataROC[key], scalesROC[engine]);
    });

    // update plots if a different mixture has been selected
    figure.selectAll(".select-mixture").on("change", function () {
      const mixture = $(this).val();
      const engine = $(this).data("engine");

      const key = createKey(mixture, engine);
      updateMultipleCorrect(
        `#svg-n-correct-ids-${engine} > g`,
        dataCorrect[key],
        scalesCorrect[engine]
      );
      updateMultipleROC(
        `#svg-roc-${engine} > g`,
        dataROC[key],
        scalesROC[engine]
      );
    });
  });

  // draw number of correct identifications per PEP threshold
  function drawMultipleCorrect(svg, data, scales) {
    // draw one line for each method
    METHODS.forEach((method) => {
      // relevant data
      const dataFiltered = data.filter((d) => d.method === method);

      // add confidence band
      svg
        .append("path")
        .datum(dataFiltered)
        .attr("class", `band band-${method}`)
        .attr("fill", methodColor(method))
        .attr("opacity", 0.25)
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

      // add mean line plot
      svg
        .append("path")
        .datum(dataFiltered)
        .attr("class", `mean mean-${method}`)
        .attr("fill", "none")
        .attr("stroke", methodColor(method))
        .attr("stroke-width", 1.5)
        .attr(
          "d",
          d3
            .line()
            .x((d) => scales.threshScale(d.thresh))
            .y((d) => scales.yScale(math.mean(d.n_correct)))
            .curve(d3.curveMonotoneX)
        );

      // add scatter dots to the line
      svg
        .selectAll(`.circle-${method}`)
        .data(dataFiltered)
        .enter()
        .append("circle")
        .attr("class", `circle-${method}`)
        .attr("cx", (d) => scales.threshScale(d.thresh))
        .attr("cy", (d) => scales.yScale(math.mean(d.n_correct)))
        .attr("fill", methodColor(method))
        .attr("r", 3);
    });
  }
})();
