// const strapi = require('strapi');
// strapi({ dir: process.cwd(), autoReload: true }).start();


const {get, getOr} = require('lodash/fp')


const obj = {
    "kind": "collectionType",
    "collectionName": "page_apps",
    "info": {
      "singularName": "page-app",
      "pluralName": "page-apps",
      "displayName": "page-apps",
      "description": ""
    },
    "options": {
      "draftAndPublish": true,
      "comment": ""
    },
    "attributes": {
      "jioapps": {
        "type": "relation",
        "relation": "oneToMany",
        "target": "api::jioapps.jioapp"
      },
      "blocks": {
        "type": "dynamiczone",
        "components": [
          "blocks.carousel"
        ]
      },
      "uuid": {
        "type": "string"
      }
    }
  }
  



const checkIfKeyValueExistsRecursively = (contentType, searchModelId, allComponentsSchema) => {

    const getType = (schema, attrName) => getOr(schema, ["attributes", attrName, "type"])
    const getTarget = (schema, attrName) => get(schema, ["attributes", attrName, "target"])
    const getOtherInfos = (schema, arr) => get(schema, ['attributes', ...arr], '');
    
 
     const recursive = (schema) => {
         return Object.keys(schema['attributes']).reduce((acc, current) => {
             const attrType = getType(schema, current)
             const target = getTarget(schema, current)
             const component = getOtherInfos(schema, [current, 'component']);
            //  const isRepeatable = getOtherInfos(schema, [current, 'repeatable']);
             let value = false             
             if(target === searchModelId){
                value = true
             }
             if(attrType == 'component'){
                value = recursive(allComponentsSchema(component))
             }
             if(attrType == 'dynamiczone'){
                value = schema['components'].map(component => recursive(allComponentsSchema(component)))
            }
 
             acc[current] = value;
 
         }, [])
     }

     return recursive(contentType)
 
 
 }


 checkIfKeyValueExistsRecursively(obj, "api::jioapps.jioapp")