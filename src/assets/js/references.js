const FIELDS = {
  author: { prefix: "", suffix: ". " },
  title: { prefix: "", suffix: ". " },
  journal: { prefix: "", suffix: "" },
  year: { prefix: ", ", suffix: "." },
};

function generateReferences(filename, bibSelector, citeSelector) {
  $.getJSON(filename, (data) => {
    const refs = document.querySelectorAll(citeSelector);
    const refIdToNum = {};
    let currRefNum = 0;
    for (let i = 0; i < refs.length; i += 1) {
      // get reference and its id
      const ref = $(refs[i]);
      const refId = ref.attr("class").replace("no-style ", "");

      // escape if cited reference has already been processed
      if (refId in refIdToNum) {
        ref.html(refIdToNum[refId]);
        continue;
      }

      // add new reference number
      currRefNum += 1;
      refIdToNum[refId] = currRefNum;

      // add reference number when cited
      const currRefNumStr = `00${currRefNum}`.slice(-2);
      ref.html(currRefNumStr);

      // create element for the new reference
      const refElem = $("<div></div", {
        id: `${refId}-ref`,
        class: "ref-wrapper",
      }).append(
        $("<div></div>", {
          class: "ref-number",
          text: `[${currRefNumStr}]`,
        })
      );

      // create content for the current reference
      const refInfo = data[refId];
      const refContent = $("<div></div>", {
        class: "ref",
      });
      Object.keys(FIELDS).map((f) =>
        $("<span></span>", {
          class: f,
          text: `${FIELDS[f].prefix}${refInfo[f]}${FIELDS[f].suffix}`,
        }).appendTo(refContent)
      );

      // add new element to the dom
      $(bibSelector).append(refElem.append(refContent));
    }
  });
}

// export default generateReferences;
