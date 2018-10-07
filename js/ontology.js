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
  };

  xhttp.open("GET", 'ontology.ttl', true);
  xhttp.send();
};

function fillPage(store) {
  //add information about the ontology: title, descriptions, and so on
  addGlobalInfo(store);

  //add classes
  let classes = store.getTriples(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://www.w3.org/2000/01/rdf-schema#Class').map(a => a.subject);
  let classesDiv = document.querySelector('#classes');
  createTable(classes, classesDiv, store);

  //add object properties
  let properties = store.getTriples(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://www.w3.org/2002/07/owl#ObjectProperty').map(a => a.subject);
  let propDiv = document.querySelector('#objectproperties');
  createTable(properties, propDiv, store);
}

function addGlobalInfo(store) {
  let ont = store.getTriples(null, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://www.w3.org/2002/07/owl#Ontology')[0].subject;

  let elements = [{
      id: '#ont-title',
      iri: 'http://www.w3.org/2000/01/rdf-schema#label'
    },{
      id: '#description',
      iri: 'http://www.w3.org/2000/01/rdf-schema#comment'
    },{
      id: '#ns',
      iri: 'http://purl.org/vocab/vann/preferredNamespaceUri'
    },{
      id: '#prefix',
      iri: 'http://purl.org/vocab/vann/preferredNamespacePrefix'
    },{
      id: '#version',
      iri: 'http://www.w3.org/2002/07/owl#versionInfo'
    },{
      id: '#dateCreated',
      iri: 'http://schema.org/dateCreated'
    },{
      id: '#dateModified',
      iri: 'http://schema.org/dateModified'
    },{
      id: '#license',
      iri: 'http://schema.org/license'
    }
  ];

  elements.forEach(e => {
    setLiteralValueInElement(store, ont, e.iri, e.id);
  });
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

function setLiteralValueInElement(store, subject, iri, id) {
  const literalValues = getLiteralValues(store, subject, iri);

  //we want at least one literal to show
  let literalValue = literalValues[0];
  let i = 1;

  //we prefer to have the English version of the literal
  while (i < literalValues.length && N3.Util.getLiteralLanguage(literalValues[i].value) !== 'en') {
    i ++;
  }

  if (i < literalValues.length) {
    literalValue = literalValues[i];
  }

  let html = N3.Util.getLiteralValue(literalValue.value);

  if (literalValue.link) {
    html = `<a href="${literalValue.link}" target="_blank">${html}</a>`;
  }

  document.querySelector(id).innerHTML = html;
}

function getLiteralValues(store, subject, iri) {
  const values = store.getTriples(subject, iri, null).map(a => a.object);
  let literalValues = [];

  for (const value of values) {
    if (N3.Util.isLiteral(value)) {
      literalValues.push({value});
    } else {
      const temp = getLiteralValues(store, value, 'http://www.w3.org/2000/01/rdf-schema#label');

      temp.forEach(t => {
        t.link = value;
      });

      literalValues = literalValues.concat(temp);
    }
  }

  return literalValues;
}
