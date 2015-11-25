console.log('hbshelpers.js--> start');

var hbs = require('hbs');
//var Handlebars     = require('handlebars');
//var HandlebarsIntl = require('handlebars-intl');
//HandlebarsIntl.registerWith(hbs);
var numeral = require('numeral');


console.log('hbshelpers.js--> register helpers');
// register a helper for template to return field from record
hbs.registerHelper('get', function(record, field) {
  return record.get(field);
});

// register a helper for template to return a badge
hbs.registerHelper('badge', function(record, field) {
  if (record.get(field)) {
    return '<span class="slds-badge slds-m-left--small slds-theme--inverse">' + record.get(field) + '</span>';
  }
  return;
});

// register a helper for template to return a badge
hbs.registerHelper('isChecked', function(record, value) {
  if (record.get('Type') === value) return 'checked';
  return;
});

// register a helper for template to return a badge
hbs.registerHelper('isSelected', function(record, value) {
  if (record.get('Industry') === value) return 'selected';
  return;
});


// register a helper for template format currency
hbs.registerHelper('formatCurrency', function(record, field) {
  return numeral(record.get(field)).format('$R0.0[,]00');
});

// register a helper for template format percentage
hbs.registerHelper('formatdecimal', function(record, field) {
  var num = numeral(record.get(field)).divide(100);
  //var percent = num.divide(100);
  return numeral(num).format('0.00%');
});

console.log('hbshelpers.js--> end');