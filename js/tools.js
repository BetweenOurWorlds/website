window.onload = () => {
  window.ldf.Logger.setLevel('error');
  document.querySelector("#search").addEventListener("submit", function(e){
    document.querySelector("#result").classList.add('hidden');
    document.querySelector("#no-result").classList.add('hidden');

    e.preventDefault();
    let url = document.querySelector("#url").value;
    let iri;
    let title;
    let titleNoLanguage;

    let fragmentsClient = window.ldf.FragmentsClient('https://data.betweenourworlds.org/2017-07');

    let query = `SELECT * {
      OPTIONAL {?s <http://schema.org/mainEntityOfPage> "${url}"^^<http://schema.org/URL>.}
      OPTIONAL {?s <http://schema.org/mainEntityOfPage> "${url}".}
      ?s <http://schema.org/name> ?name.
    } LIMIT 100`,
      results = new ldf.SparqlIterator(query, { fragmentsClient: fragmentsClient });
      results.on('data', result => {
        if (!iri || iri === result['?s']) {
          iri = result['?s'];
          let n = result['?name'];

          if (N3.Util.getLiteralLanguage(n) === 'en') {
            title = n;
          }

          if (N3.Util.getLiteralLanguage(n) === '') {
            titleNoLanguage = n;
          }
        } else {
          console.log('Multiple IRIs found for URL. We take a random one.');
        }
      });
      results.on('end', () => {
        if (iri) {
          if (!title && titleNoLanguage) {
            title = N3.Util.getLiteralValue(titleNoLanguage);
          } else if (title) {
            title = N3.Util.getLiteralValue(title);
          }

          document.querySelector("#result").classList.remove('hidden');
          document.querySelector("#title-anime").innerHTML = title;
          let a = document.querySelector("#foundIRI");
          a.innerHTML = iri;
          a.setAttribute('href', iri);
        } else {
          document.querySelector("#no-result").classList.remove('hidden');
          let a = document.querySelector("#sorry-url");
          a.innerHTML = url
          a.setAttribute('href', url);
        }
      });
  });
  document.querySelector("#execute").addEventListener("submit", e => {
    e.preventDefault();

    let query = document.querySelector('#query').value;
    let fragmentsClient = window.ldf.FragmentsClient('https://data.betweenourworlds.org/2017-07');
    let output = document.querySelector('#query-result');
    output.innerHTML = "";

    try {
      let results = new ldf.SparqlIterator(query, { fragmentsClient: fragmentsClient });
      let keys;

      results.on('data', result => {
        if (output.innerHTML === "") {
          //no table is there yet, let's create a new one
          let table = '<table id="query-table" class="console"><thead><tr>';
          keys = Object.keys(result);

          keys.forEach(k => {
            table += `<th>${k}</th>`;
          });

          table += '</tr></thead><tbody></tbody></table>';
          output.innerHTML = table;
        }

        let table = document.querySelector('#query-table');
        let row = table.insertRow(-1);

        keys.forEach(k => {
          let value = result[k];
          let cell = row.insertCell(-1);

          if (N3.Util.isLiteral(value)) {
            value = N3.Util.getLiteralValue(value);
          } else {
            value = `<a href="${value}">${value}</a>`;
          }

          cell.innerHTML = value;
        });
      });

      results.on('end', () => {
        if (!keys) {
          output.innerHTML = "Sorry, no results were found for your query. Please try another one."
        }
      });
    } catch (e) {
      if (e.name === 'InvalidQueryError') {
        output.innerHTML = `Sorry, your query seems to be invalid: <span class="console">${e.message}</span>.`
      }
    }
  });
};
