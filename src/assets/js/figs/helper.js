// min and max of nested data
function nestedExtent(obj, accessor) {
  return [
    d3.min(Object.values(obj).map((chunk) => d3.min(chunk.map(accessor)))),
    d3.max(Object.values(obj).map((chunk) => d3.max(chunk.map(accessor)))),
  ];
}

// pretty print engine name
function prettyEngine(engine) {
  switch (engine) {
    case "xtandem":
      return "X!Tandem";
    case "comet":
      return "Comet";
    case "msgf":
      return "MS-GF+";
  }
}

// pretty print feature name
function prettyFeature(feature) {
  switch (feature) {
    case "replicate-spectra":
      return "Replicate Spectra";
    case "precursor-scores":
      return "Precursor Scores";
    case "sibling-ions":
      return "Sibling Ions";
    case "sibling-modifications":
      return "Sibling Modifications";
    case "sibling-scores":
      return "Sibling Scores";
  }
}

// map method to color
function methodColor(method) {
  return method === "IDPEP" ? "orange" : "steelblue";
}

// create a single keys from multiple keys
function createKey(...keys) {
  return keys.join("-");
}
