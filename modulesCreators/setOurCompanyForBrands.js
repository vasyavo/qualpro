db.brands.updateOne({'name.en': 'Alalali'}, {$set: {name: {en: 'Al alali', ar: 'Al alali'}}});
db.brands.updateOne({'name.en': 'Al alali'}, {$set: {ourCompany: true}});
db.brands.updateMany({'name.en': {$ne: 'Al alali'}}, {$set: {ourCompany: false}});
