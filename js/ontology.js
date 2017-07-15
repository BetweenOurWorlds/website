window.onload = () => {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      let parser = N3.Parser();
      let store = N3.Store();

      parser.parse(this.responseText, function(error, triple){
          if (triple) {
            store.addTriple(triple.subject, triple.predicate, triple.object);
          } else {
            fillPage(store);
          }
      });
    } else {
      if (this.status !== 0 && this.status !== 200) {
        reject(this.status);
      }
    }
  }

  xhttp.open("GET", 'ontology.ttl', true);
  xhttp.send();
};

function fillPage(store) {
  let ont = store.getTriples(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://www.w3.org/2002/07/owl#Ontology')[0].subject;

  //set title
  let title = store.getTriples(ont, 'http://www.w3.org/2000/01/rdf-schema#label', null)[0].object;
  document.querySelector('#ont-title').innerHTML = N3.Util.getLiteralValue(title);

  //set description
  let description = store.getTriples(ont, 'http://www.w3.org/2000/01/rdf-schema#comment', null)[0].object;
  document.querySelector('#description').innerHTML = N3.Util.getLiteralValue(description);

  //add classes
  let classes = store.getTriples(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://www.w3.org/2000/01/rdf-schema#Class').map(a => a.subject);
  let classesDiv = document.querySelector('#classes');
  createTable(classes, classesDiv, store);

  //add object properties
  let properties = store.getTriples(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://www.w3.org/2002/07/owl#ObjectProperty').map(a => a.subject);
  let propDiv = document.querySelector('#objectproperties');
  createTable(properties, propDiv, store);
}

function createTable(elements, mainDiv, store) {
  elements.forEach(e => {
    let label = N3.Util.getLiteralValue(store.getTriples(e, 'http://www.w3.org/2000/01/rdf-schema#label', null)[0].object);

    //create div
    let div = document.createElement('div');
    div.setAttribute('id', label);

    //create span for title
    let span = document.createElement('span');
    span.classList.add('bold');
    span.classList.add('ont-element');
    span.innerHTML = label;
    div.appendChild(span);

    //create table for specs
    let table = document.createElement('table');
    table.classList.add('ont-element');
    let tbody = document.createElement('tbody');
    table.appendChild(tbody);

    //create rows
    addRowToTable(store, tbody, e, 'description', 'http://www.w3.org/2000/01/rdf-schema#comment');
    addRowToTable(store, tbody, e, 'inverse of', 'http://www.w3.org/2002/07/owl#inverseOf');
    addRowToTable(store, tbody, e, 'domain', 'http://www.w3.org/2000/01/rdf-schema#domain');
    addRowToTable(store, tbody, e, 'range', 'http://www.w3.org/2000/01/rdf-schema#range');
    addRowToTable(store, tbody, e, 'subclass of', 'http://www.w3.org/2000/01/rdf-schema#subClassOf');

    div.appendChild(table);

    mainDiv.appendChild(div);
  });
}

function addRowToTable(store, tbody, c, label, iri) {
  let values = store.getTriples(c, iri, null);

  if (values.length > 0) {
    let value = values[0].object;

    if (N3.Util.isLiteral(value)) {
      value = N3.Util.getLiteralValue(value);
    } else {
      if (value.indexOf('https://betweenourworlds.org/ontology/') !== -1) {
        value = value.replace('https://betweenourworlds.org/ontology/', 'bow:');
        let identifier = value.replace('bow:', '');
        value = `<a href="#${identifier}">${value}</a>`;
      } else {
        value = `<a href="${value}" target="_blank">${value}</a>`;
      }
    }

    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.innerHTML = `<a href="${iri}" target='_blank'>${label}</a>`;
    tr.appendChild(td);

    td = document.createElement('td');
    td.innerHTML = value;
    tr.appendChild(td);

    tbody.appendChild(tr);
  }
}
