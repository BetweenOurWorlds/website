const fs = require('fs-extra');
const path = require('path');

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];


module.exports = async() => {
  const datasets = await fs.readJson(path.resolve(__dirname, '_datasets.json'));
  const parsedDatasets = [];

  for (let i = 0; i < datasets.length; i ++) {
    const dataset = datasets[i];
    const date = new Date(dataset + '-01');

    parsedDatasets.push({
        name: monthNames[date.getMonth()] + ' ' + date.getFullYear(),
        slug: dataset,
        latest: i === 0
      }
    );
  }

  return parsedDatasets;
};
