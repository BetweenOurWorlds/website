importScripts('n3.js', 'elasticlunr.js');

let elastic = elasticlunr(function() {
  this.addField('title');
  this.addField('allTitles');
  this.setRef('iri');
});

onmessage = function(e) {
  if (e.data.type === 'init') {
    initElastic(e.data.parsedData);
  } else if (e.data.type === 'search') {
    search(e.data.title);
  }
}

function search(title) {
  postMessage(elastic.search(title));
}

function initElastic(parsedData) {
  let cleanedData = {};

  parsedData.forEach(d => {
    if (!cleanedData[d['?s']]) {
      cleanedData[d['?s']] = {
        title: {},
        titles: []
      };
    }

    let title = N3.Util.getLiteralValue(d['?n']);
    let language = N3.Util.getLiteralLanguage(d['?n']);

    if (!cleanedData[d['?s']].title.value) {
      cleanedData[d['?s']].title.value = title;
      cleanedData[d['?s']].title.lang = language;
    } else if (cleanedData[d['?s']].title.lang !== 'en' && language !== 'ja') {
      cleanedData[d['?s']].title.value = title;
      cleanedData[d['?s']].title.lang = language;
    }

    cleanedData[d['?s']].titles.push(title);
  });

  Object.keys(cleanedData).forEach(iri => {
    let allTitles = cleanedData[iri].titles;
    let title = cleanedData[iri].title.value;

    elastic.addDoc({iri, allTitles, title});
  });

  console.log('Initialization of elastic search complete.');
}
