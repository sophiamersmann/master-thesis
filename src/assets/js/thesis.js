// import generateReferences from './modules/references.js';

// TODO: Import colors from scss

function updateProgressBar(selector, docHeight, winHeight) {
  // determine scroll position in current window
  const scrollTop = $(window).scrollTop();
  const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);

  $(selector).attr("aria-valuenow", scrollPercent);
  $(selector).css("width", `${scrollPercent}%`);
}

function scrollToTarget(event) {
  const target = $(event.currentTarget.hash);
  if (target) {
    $("html, body").animate({ scrollTop: target.offset().top - 15 }, 500);
  }
}

function animateTableOfContent() {
  // after a delay, hide the table of content
  const tocWrapper = $(".table-of-content-wrapper");
  const toc = $("#table-of-content");
  setTimeout(() => {
    tocWrapper.animate({ left: `${-toc.width()}px` }, "slow");
    setTimeout(() => toc.css("border-right", "3px solid #fcba03"), 600);
  }, 3000);

  // on mouse enter, show the table of content
  tocWrapper.mouseenter(() => {
    // if elem is currently being animated, don't do anything
    if (tocWrapper.is(":animated")) return;

    toc.css("border-right", "none");
    tocWrapper.animate({ left: 0 }, "slow");
  });

  // one mouse leave, hide the table of content
  tocWrapper.mouseleave(() => {
    // if elem is currently being animated, don't do anything
    if (tocWrapper.is(":animated")) return;

    tocWrapper.animate({ left: `${-toc.width()}px` }, "slow");
    setTimeout(() => toc.css("border-right", "3px solid #fcba03"), 600);
  });
}

$(document).ready(() => {
  const docHeight = $(document).height();
  const winHeight = $(window).height();

  // init progress bar
  updateProgressBar(".progress-bar", docHeight, winHeight);

  // update progress bar on scrolling
  $(window).scroll(() => {
    updateProgressBar(".progress-bar", docHeight, winHeight);
  });

  // generate references from .bib file
  generateReferences("data/bib.json", ".list-of-references", ".cite-ref>a");

  // on click, scroll to target
  $('a[href^="#"]').click(scrollToTarget);

  // animate table of content
  animateTableOfContent();
});
