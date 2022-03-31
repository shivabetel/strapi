'use strict';
const { Database } = require('@strapi/database');
const { default: axios } = require('axios');
const get = require('lodash/get')
const isArray = require('lodash/isArray')
const omit = require("lodash/omit");
// const omitDeep = require("omit-deep-lodash");

/**
 *  apps-page controller
 */

const { createCoreController } = require('@strapi/strapi').factories;


const _getDynamicZone = (obj) => {
    const { type = '' } = obj;
    return type == 'dynamiczone' ? true : false
}


const _getComponent = (obj) => {
    const { type = '' } = obj;
    return type == 'component' ? true : false
}

const _getComponentAttributes = (uid) => {
    const componentModel = strapi.components[uid] || {};
    return componentModel['attributes'] || {};
}


const _createComponentModel = (uid) => {
    const isContentType = strapi['contentTypes'][uid] ? true : false;
    const isComponent = strapi['components'][uid] ? true : false;
    const model = isContentType ? (strapi['contentTypes'][uid] || {}) : (strapi.components[uid] || {})
    model['attributes'] = model['attributes'] || {}
    delete model['attributes']['createdBy']
    delete model['attributes']['updatedBy']
    delete model['attributes']['versions']
    return Object.keys(model['attributes'])
        .reduce((acc, key) => ({
            ...acc,
            [key]: (() => {
                const isDynamicComponent = _getDynamicZone(model['attributes'][key]);
                const isTypeRelation = model['attributes'][key]['type'] == 'relation'

                if (isDynamicComponent) {
                    const components = model['attributes'][key]['components'];
                    return components
                        .reduce((ac, k) => ({
                            ...ac,
                            ..._createComponentModel(k)
                        }), {})
                } else if (isTypeRelation) {
                    return {
                        type: 'relation',
                        ..._createComponentModel(model['attributes'][key]['target'])
                    }
                }
                else {

                    const isComponent = _getComponent(model['attributes'][key])
                    if (isComponent) {
                        return _createComponentModel(model['attributes'][key]['component']);
                    }
                    return model['attributes'][key]['type'] === 'media' ? {} : true
                }

            })()
        }), {})
}

let arr = []


const _getObjectKey = (obj) => {
    let result = []

    Object.keys(obj).forEach((key, index) => {
        if (typeof obj[key] == 'object') {
            result = [
                ...result,
                key,
                ..._getObjectKey(obj[key]).map(s => `${key}.${s}`)//result.map(s => `${s}.${_getObjectKey(obj[key])}`)
            ]
        }



        // if(typeof obj[key] == 'object'){
        //     _getObjectKey(obj[key]);
        // }

        // if(index == Object.keys(obj).length -1){
        //     result = {
        //         ...result,
        //         [Object.keys(obj)[0]]: ''
        //     }
        // }
    })


    return result;

}

const _getQuery = (model = {}, parent) => {
    return Object.values(model)
        .filter(value => (typeof value == 'object' || value['isMedia']))
        .map(obj => {
            if (typeof obj == 'object') {
                _getQuery(obj);
                return obj['isMedia'] ? `${obj['parent']}.${obj['key']}` : Object.keys(obj)[0]//

            }
        })

    // .map(key => ({
    //     key,
    //     value: model[key]
    // }))
    // .map(({key, value}) => {
    //     if(typeof value == 'object'){
    //        const what = _getQuery(value);
    //         return [
    //             ...arr,
    //             key,
    //             what
    //         ];

    //     }else{
    //         return key
    //     }
    // })

}




function omitDeepLodash(input, props) {
    function omitDeepOnOwnProps(obj) {
        if (typeof input === "undefined") {
            return input;
        }

        if (!Array.isArray(obj) && !isObject(obj)) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return omitDeepLodash(obj, props);
        }

        const o = {};
        for (const [key, value] of Object.entries(obj)) {
            o[key] = !isNil(value) ? omitDeepLodash(value, props) : value;
        }

        return !o['mime'] ? omit(o, props) : o;
    }

    if (arguments.length > 2) {
        props = Array.prototype.slice.call(arguments).slice(1);
    }

    if (Array.isArray(input)) {
        return input.map(omitDeepOnOwnProps);
    }

    return omitDeepOnOwnProps(input);
};

function isNil(value) {
    return value === null || value === undefined;
}

function isObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}


const cleanData = (retrievedData, currentSchema, componentsSchema) => {
    const getType = (schema, attrName) => get(schema, ['attributes', attrName, 'type'], '');
    const getOtherInfos = (schema, arr) => get(schema, ['attributes', ...arr], '');

    const recursiveCleanData = (data, schema) => {
        return Object.keys(data).reduce((acc, current) => {
            const attrType = getType(schema, current);
            const value = get(data, current);
            const component = getOtherInfos(schema, [current, 'component']);
            const isRepeatable = getOtherInfos(schema, [current, 'repeatable']);
            let cleanedData;

            switch (attrType) {
                case 'json':
                    try {
                        cleanedData = JSON.parse(value);
                    } catch (err) {
                        cleanedData = value;
                    }

                    break;
                // TODO
                // case 'date':
                //   cleanedData =
                //     value && value._isAMomentObject === true ? value.format('YYYY-MM-DD') : value;
                //   break;
                // case 'datetime':
                //   cleanedData = value && value._isAMomentObject === true ? value.toISOString() : value;
                //   break;
                case 'time': {
                    cleanedData = value;

                    // FIXME
                    if (value && value.split(':').length < 3) {
                        cleanedData = `${value}:00`;
                    }

                    break;
                }
                case 'media':
                    if (getOtherInfos(schema, [current, 'multiple']) === true) {
                        cleanedData = value ? value.filter(file => file) : null//value ? value.filter(file => !(file instanceof File)) : null;
                    } else {
                        cleanedData = value //get(value, 0) instanceof File ? null : get(value, 'id', null);
                    }
                    break;
                case 'component':
                    if (isRepeatable) {
                        cleanedData = value
                            ? value.map(data => {
                                const subCleanedData = recursiveCleanData(data, componentsSchema[component]);

                                return subCleanedData;
                            })
                            : value;
                    } else {
                        cleanedData = value ? recursiveCleanData(value, componentsSchema[component]) : value;
                    }
                    break;
                case 'dynamiczone':
                    cleanedData = value.map(componentData => {
                        const subCleanedData = recursiveCleanData(
                            componentData,
                            componentsSchema[componentData.__component]
                        );

                        return subCleanedData;
                    });
                    break;
                default:
                    // The helper is mainly used for the relations in order to just send the id
                    cleanedData = helperCleanData(value, 'id');
            }

            acc[current] = cleanedData;

            return acc;
        }, {});
    };

    return recursiveCleanData(retrievedData, currentSchema);
};

const helperCleanData = (value, key) => {
    if (isArray(value)) {
        return value.map(obj => (obj[key] ? obj[key] : obj));
    }
    if (isObject(value)) {
        return value[key];
    }

    return value;
};

module.exports = createCoreController('api::page-appdetails.page-appdetail', ({ strapi }) => ({


    setup: async (ctx, next) => {

        const uid = 'api::apps-page.apps-page' //'api::jioapps.jioapp'

        const currentContentType = strapi.contentTypes[uid];
        const allComponents = strapi.components



        // const response = await axios
        // .get(`http://${process.env.HOST}:${process.env.PORT}/content-manager/collection-types/api::apps-page.apps-page/2`, {
        //     headers: {
        //         Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjQ2NjM1NTkwLCJleHAiOjE2NDkyMjc1OTB9.1fTH-ZVmrISqRcFVoPs7XqBmzs3lspQK1AK0zKEYUYs`
        //     }
        // });
        //console.log("rsponse:",response)

        const modelAttributes = _createComponentModel(uid);
        const queryValues = _getObjectKey(modelAttributes)
        try {
            const rows = await strapi.entityService.findMany(uid, { populate: queryValues, filters: { published_at: { '$notNull': true } } }) || [];//api::apps-page.apps-page
            //console.log("rows:",rows)


            await
                rows.map(row => {

                    let cleanedData = cleanData(row, currentContentType, allComponents)
                    console.log("what:", cleanedData)
                    cleanedData =  omitDeepLodash(cleanedData, "id")
                    return strapi.entityService.create('api::page-appdetails.page-appdetail', {
                        data: cleanedData
                    })
                })
        } catch (err) {
            console.log("in catch blockk::", err)
        }






        try {

            ctx.body = 'OK';

        } catch (error) {
            ctx.body = err
        }
    }
}));
