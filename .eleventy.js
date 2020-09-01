
module.exports = function (eleventyConfig) {
  eleventyConfig.templateFormats = [
    "html",
    "md",
    "njk",
    "xml",
    "jpg",
    "png",
    "gif",
    "svg",
    "liquid",
    "json",
    "pdf",
    "ttl",
    "rdf",
    "hdt",
    "hbs",
    "ico", // for favicon
    "css", // css is not yet a valid template extension
  ];
  eleventyConfig.passthroughFileCopy = true;
  eleventyConfig.addPassthroughCopy("js");
};
