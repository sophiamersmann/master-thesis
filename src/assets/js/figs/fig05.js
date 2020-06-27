(function () {
  const FILENAME = "data/fig05/percolator-scores.json";

  const margin = {
    top: 30,
    right: 30,
    bottom: 30,
    left: 40,
  };
  const width = 300 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // Comet canvas
  const svgComet = d3
    .select("#figure05-A")
    .append("svg")
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

  // MS-GF+ canvas
  const svgMSGF = d3
    .select("#figure05-B")
    .append("svg")
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

  // add Comet label on the bottom of the plot
  svgComet
    .append("text")
    .attr("class", "label label-engine")
    .attr("x", width / 2)
    .attr("y", height)
    .style("text-anchor", "middle")
    .text("Comet");

  // add MS-GF+ label on the bottom of the plot
  svgMSGF
    .append("text")
    .attr("class", "label label-engine")
    .attr("x", width / 2)
    .attr("y", height)
    .style("text-anchor", "middle")
    .text("MS-GF+");

  d3.json(FILENAME).then((data) => {
    // initialise distribution plots
    const plotComet = plotDistribution(svgComet, "comet", "A");
    const plotMSGF = plotDistribution(svgMSGF, "msgf", "A");

    // update plot if the mixture is updated
    d3.select("#figure05 .select-mixture").on("change", function () {
      const mixture = $(this).val();
      updateDistribution(svgComet, "comet", mixture, plotComet);
      updateDistribution(svgMSGF, "msgf", mixture, plotMSGF);
    });

    // plot score distribution
    function plotDistribution(svg, engine, mixture) {
      const dataFiltered = data.filter(
        (d) => (d.engine === engine) & (d.mixture === mixture)
      );
      const plot = plotScoreDistribution(svg, dataFiltered, {
        margin,
        width,
        height,
      });

      // add threshold line at score=0
      svg
        .append("line")
        .attr("class", "line-zero")
        .attr("x1", 0)
        .attr("y1", plot.yScale(0))
        .attr("x2", width)
        .attr("y2", plot.yScale(0));

      return plot;
    }

    // update score distribution
    function updateDistribution(svg, engine, mixture, plot) {
      const dataFiltered = data.filter(
        (d) => (d.engine === engine) & (d.mixture === mixture)
      );

      // y scale (score)
      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(dataFiltered, (d) => d.score))
        .nice()
        .range([height, 0]);

      // histograms of correct and incorrect identifications
      const correctDist = createHistogram(
        dataFiltered.map((d) => {
          if (d.correct) return d.score;
        }),
        plot.xScale,
        yScale
      );
      const incorrectDist = createHistogram(
        data.map((d) => {
          if (!d.correct) return d.score;
        }),
        plot.xScale,
        yScale
      );

      // update histogram of correct identification
      svg
        .selectAll("rect.correct")
        .data(correctDist.bins)
        .transition()
        .duration(600)
        .attr(
          "width",
          (d) => correctDist.scale(d.length) - plot.halfBandwidth + plot.offset
        );

      // update histogram of incorrect identification
      svgMSGF
        .selectAll("rect.incorrect")
        .data(incorrectDist.bins)
        .transition()
        .duration(600)
        .attr("x", (d) => incorrectDist.scale(-d.length) + plot.offset)
        .attr(
          "width",
          (d) =>
            plot.halfBandwidth - (incorrectDist.scale(-d.length) + plot.offset)
        );
    }
  });
})();
