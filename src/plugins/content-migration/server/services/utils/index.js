const { createComponentModel, getContentQueryObject, omitDeep, cleanData, checkForParentContentTypes, ContentMigrationError, getAllFilesInTheEntity } = require("../../utils");
const { default: axios } = require("axios");
const { get, has } = require('lodash/fp');
const _ = require('lodash')

const fs = require('fs')
const FormData = require('form-data')




// const submitJob = async (modelId, next) => {
//     const migrationJob = await strapi.entityService.create('api::migrationjob.migrationjob', {
//         data: {
//             modelId,
//             start_date_time: new Date(),
//             status: 'inprogress'
//         }
//     })
//     try {
//         let response = await Promise.resolve(next(migrationJob['id']))
//         //next(migrationJob['id']);
//         strapi.entityService.update('api::migrationjob.migrationjob', migrationJob['id'], { data: {
//             end_date_time: new Date(),
//             status: 'completed',
//             payload: response
//         }})

//     } catch (err) {
//         strapi.entityService.update('api::migrationjob.migrationjob', migrationJob['id'], { data: {
//             end_date_time: new Date(),
//             status: 'failed',
//             error: err
//         }})
//     }


// }


const getMigrationConfig = (targetEnv = '') => {
    try {
        const contentMigrationConfig = strapi.plugins['content-migration'].config('contentMigrationConfigFile')
        const migration_config = strapi.config.get(contentMigrationConfig)
        return migration_config[targetEnv.toLowerCase()];
    } catch (err) {
        throw new ContentMigrationError('Error while reading migration config::', err)
    }

}





const getModelTableRows = async (modelId) => {
    try {
        const modelAttributes = await createComponentModel(modelId);
        const queryValues = getContentQueryObject(modelAttributes);
        let rows = await strapi.entityService
            .findMany(modelId, { populate: queryValues, filters: { published_at: { '$notNull': true } }, sort: { id: 'asc' } })
            .catch(err => {
                throw new ContentMigrationError(`Error while fetching records for model id: ${modelId}::`, err);
            })
        return Promise.resolve(rows)
    } catch (err) {
        return Promise.reject(err)
    }


}

const startMigrateContentToTarget = async ({ modelId, entities: entitiesToMigrate = [] }, targetEnv) => {
    try {
        const contentType = strapi.contentTypes[modelId] || {}
        const pluralApiId = get(['info', 'pluralName'], contentType)
        const singlularApiId = get(['info', 'singularName'], contentType)
        const config = getMigrationConfig(targetEnv)
        const kind = get('kind', contentType)
        const isSingleType = kind == 'singleType'
        if (config && config['strapi']) {
            const { host, port, apiToken } = config['strapi'];
            const apibasepath = get('basepath', config['strapi'], `http://${host}:${port}/api`)


            return isSingleType ? ( () => {
                let entity;
                if(Array.isArray(entitiesToMigrate) && entitiesToMigrate.length){
                    entity = entitiesToMigrate[0];
                }
                let cleanedData = omitDeep(entity, ["id"])
                
                return new Promise((resolve, reject) => {
                    entity ? axios.post(`${apibasepath}/api/content-migration/singleType`, {modelId, entity: cleanedData}, {
                        headers: {
                            Authorization: `Bearer ${apiToken}`
                        }
                    }).then(apiResponse => {
                        const response = get('data', apiResponse)
                        resolve(response)
                    }) : reject("No record to update")
                })
               

            })() : (async () => {
                const getResponse = await axios.get(`${apibasepath}/api/${pluralApiId}`, {
                    headers: {
                        Authorization: `Bearer ${apiToken}`
                    }
                })

                const existingRecords = get(['data', 'data'], getResponse)
                const allIds = _.castArray(existingRecords)
                    .map(({ id }) => id)
                const idsToKeep = [];

                const _promises = entitiesToMigrate.map(entityToMigrate => new Promise(async (resolve, reject) => {

                    try {
                        has('uid', entityToMigrate) ? (async () => {

                            let content = existingRecords.find(existingRecord => {
                                const uid = get(['attributes', 'uid'], existingRecord)
                                return uid == entityToMigrate['uid']
                            })
                            let cleanedData = omitDeep(entityToMigrate, ["id"])////removing ids except for image
                            content ? (() => {
                                idsToKeep.push(get('id', content));
                                axios.put(`${apibasepath}/api/${pluralApiId}/${content['id']}`, {
                                    data: cleanedData
                                }, {
                                    headers: {
                                        Authorization: `Bearer ${apiToken}`
                                    }
                                }).then(updateResponse => {
                                    const updatedEntity = get(['data', 'data'], updateResponse)
                                    resolve({
                                        ...entityToMigrate,
                                        newId: updatedEntity['id']
                                    })
                                }).catch(err => {
                                    reject(`Error while updating content for model::${modelId}`, err)
                                })

                            })() : (async () => {
                                await axios.post(`${apibasepath}/api/${pluralApiId}`, {
                                    data: cleanedData
                                }, {
                                    headers: {
                                        Authorization: `Bearer ${apiToken}`
                                    }
                                }).then(createResponse => {
                                    const createdEntity = get(['data', 'data'], createResponse);
                                    resolve({
                                        ...entityToMigrate,
                                        newId: createdEntity['id']
                                    })
                                }).catch(error => {
                                    reject(`Error while creating content for model:${modelId}`, error)
                                })
                            })()



                        })() : resolve(entity)
                    } catch (err) {
                        if (err instanceof ContentMigrationError)
                            reject(err)
                        else
                            reject(new ContentMigrationError(`Error while inserting/updating content for model::${modelId}`, err))
                    }



                }))

                return new Promise(async (resolve, reject) => {
                    Promise.all(_promises).then(async (result) => {
                        let _deletePromises = allIds.filter(id => !idsToKeep.includes(id)).map(id => axios.delete(`http://${host}:${port}/api/${pluralApiId}/${id}`, id))
                        await Promise.all(_deletePromises).catch(err => new ContentMigrationError(`Error while deleting the entities for model:${modelId}`, err));
                        resolve(result)
                    }).catch(err => reject(err))


                })
            })()








        }


    } catch (error) {
        return Promise.reject(error);
    }
}




const setupBegin = async (modelId, targetEnv = '') => {


    const allComponents = strapi.components;
    const config = getMigrationConfig(targetEnv);
    if (config && config['strapi']) {
        const { host, port, apiToken } = config['strapi'];
        const apibasepath = get('basepath', config['strapi'], `http://${host}:${port}/api`)
        const getAllExitingFilesResponse = await axios.get(`${apibasepath}/api/upload/files`, {
            headers: {
                Authorization: `Bearer ${apiToken}`
            }
        })
        const allExistingFiles = get('data', getAllExitingFilesResponse, []);

        const migrateFiles = async (entity, contentType, allExistingFiles = []) => {
            const publicDir = strapi.dirs.public;







            const files = getAllFilesInTheEntity(entity, contentType) || []
            let _promise = files.map(file => new Promise((resolve, reject) => {

                const fileEntry = allExistingFiles.find(existingFile => existingFile['name'] === file['name'])

                !fileEntry ? (() => {
                    const fileData = new FormData();
                    if (file['provider'] == 'local') {
                        //read the file
                        const stream = fs.createReadStream(`${publicDir}${file['url']}`)
                        fileData.append("files", stream, file['name'])

                    }
                    axios.post(`${apibasepath}/api/upload`, fileData, {

                        headers: {
                            ...fileData.getHeaders(),
                            Authorization: `Bearer ${apiToken}`
                        }
                    }).then(apiResponse => {
                        const fileData = get(['data', 0], apiResponse, {})
                        file['newId'] = fileData['id']
                        resolve(file)
                    }).catch(err => reject(err))
                })() : (() => {
                    file['newId'] = fileEntry['id']
                    resolve(file)
                })()




            }))




            // const _allFilesPromises = entities.map(entity => new Promise((topResolve, topReject) => {
            //     {


            //         const files = getAllFilesInTheEntity(entity, contentType) || []
            //         let _promise = files.map(file => new Promise((resolve, reject) => {

            //             const fileEntry = allExistingFiles.find(existingFile => existingFile['name'] === file['name'])

            //             !fileEntry ? (() => {
            //                 const fileData = new FormData();
            //                 if (file['provider'] == 'local') {
            //                     //read the file

            //                     const stream = fs.createReadStream(`${publicDir}${file['url']}`)
            //                     fileData.append("files", stream, file['name'])

            //                 }
            //                 axios.get(`${apibasepath}/api/upload`)
            //                 axios.post(`${apibasepath}/api/upload`, fileData, {

            //                     headers: {
            //                         ...fileData.getHeaders(),
            //                         Authorization: `Bearer ${apiToken}`
            //                     }
            //                 }).then(apiResponse => {
            //                     const fileData = get('data', apiResponse, {})
            //                     file['newId'] = fileData['id']
            //                     resolve(file)
            //                 }).catch(err => reject(err))
            //             })() : (() => {
            //                 file['newId'] = fileEntry['id']
            //                 resolve(file)
            //             })()




            //         }))

            //         return Promise.all(_promise).then(result => topResolve({
            //             [entity['id']] : result
            //         })).catch(err => topReject(err))
            //     }
            // }))

            return Promise.all(_promise)


        }

        const process = async (modelId) => {
            try {
                const contentType = strapi['contentTypes'][modelId] || {}
                const parentModelIds = await checkForParentContentTypes(modelId);
                const _parentEntityPromises = parentModelIds.map(async ({ modelId, key }) => {
                    const entities = await process(modelId);
                    return {
                        [key]: entities
                    }
                })
                const parentModelEntitites = await Promise.all(_parentEntityPromises);

                let rows = await getModelTableRows(modelId).catch(err => { throw err });




                rows = _.castArray(rows)

                // let migratedFiles = await migrateFiles(rows, contentType, allExistingFiles)
                // migratedFiles = migratedFiles || [];

                // migratedFiles = migratedFiles.reduce((acc, curr) => {
                //     return {
                //         ...acc,
                //         ...curr
                //     }
                // }, {})






                let _promises = rows.map(async (row) => {
                    let migratedFiles = await migrateFiles(row, contentType, allExistingFiles)
                    migratedFiles = migratedFiles || [];
                    let cleanedData = cleanData(row, contentType, allComponents, parentModelEntitites, migratedFiles)
                    return cleanedData
                })


                const entities = await Promise.all(_promises);


                const response = await startMigrateContentToTarget({ modelId, entities }, targetEnv)
                return Promise.resolve(response);



            } catch (err) {
                return Promise.reject(err)
            }
        }

        return process(modelId)

    } else throw new Error('Content Migration not possible - Not a valid target environment')



}




// const setupBegin = async (modelId, targetEnv = '') => {


//     const allComponents = strapi.components;
//     const contentType = strapi['contentTypes'][modelId] || {}

//     const process = async (modelId) => {
//         try {
//             const config = getMigrationConfig(targetEnv);
//             if (config && config['strapi']) {
//                 const parentModelIds = await checkForParentContentTypes(modelId);
//                 const _parentEntityPromises = parentModelIds.map(async ({ modelId, key }) => {
//                     const entities = await process(modelId);
//                     return {
//                         [key]: entities
//                     }
//                 })
//                 const parentModelEntitites = await Promise.all(_parentEntityPromises);

//                 let rows = await getModelTableRows(modelId).catch(err => {throw err});




//                 rows = rows || []





//                 // const entities = rows.map(row => {
//                 //     let cleanedData = cleanData(row, contentType, allComponents, parentModelEntitites)
//                 //     return cleanedData
//                 // })


//                 // const response = await startMigrateContentToTarget({ modelId, entities }, targetEnv)

//                 // return Promise.resolve(response);

//                 return Promise.resolve();


//             } else throw new Error('Content Migration not possible - Not a valid target environment')

//         } catch (err) {
//             return Promise.reject(err)
//         }
//     }

//     return process(modelId)

// }



module.exports = {
    setupBegin

}