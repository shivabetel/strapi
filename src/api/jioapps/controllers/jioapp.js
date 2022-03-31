'use strict';

/**
 *  page controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::jioapps.jioapp', ({strapi}) => ({
    info: async (ctx, next) => {
      console.log("strapi********", strapi.services)
      try {
        ctx.body = 'ok';
      } catch (err) {
        ctx.body = err;
      }
    },
    setup: async (ctx, next) => {
      try {
  
        const contents = [
          {
            uuid: 'jiomeet',
            title: 'JioMeet',
            description: 'An enterprising-grade meeting app',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiomeet-n.svg'
          },
          {
            uuid: 'jiohome',
            title: 'JioHome',
            description: 'Enhancing home entertainment',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiohome-n.svg'
          },
          {
            uuid: 'jiotv',
            title: 'JioTV',
            description: 'Your daily dose of entertainment',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiotv-n.svg'
          },
          {
            uuid: 'jiocinema',
            title: 'JioCinema',
            description: 'Movies, TV shows, music, and more',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiocinema-n.svg'
          },
          {
            uuid: 'jiopos',
            title: 'JioPOS Lite',
            description: 'Earn by helping Jio customers',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiopos-lite-n.svg'
          },
          {
            uuid: 'jionews',
            title: 'JioNews',
            description: 'Your news, your language',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jionews-n.svg'
          },
          {
            uuid: 'jiochat',
            title: 'JioChat',
            description: 'Experience the joy of communication',
            logo: 'https://jep-content.s3.ap-south-1.amazonaws.com/jio/svg/logo/jiochat.svg'
          },
          {
            uuid: 'jiocloud',
            title: 'JioCloud',
            description: 'Back up your files and contacts',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiocloud-n.svg'
          },
          {
            uuid: 'jiocall',
            title: 'JioCall',
            description: 'High-quality video/voice calls on any phone',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiocall-n.svg'
          },
          {
            uuid: 'jiosecurity',
            title: 'JioSecurity',
            description: 'Protect phone, secure data',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiosecurity-n.svg'
          },
          {
            uuid: 'jiohealth',
            title: 'JioHealthHub',
            description: 'Book tests, consult doctors & access reports',
            logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiohealthhub-n.svg'
          }
  
        ]
  
        contents.map(async(content) => {
        const obj =  await strapi.db.query('api::jioapps.jioapp').findOne({
            where: {
              uuid: content['uuid']
            }
          })
          console.log("obj::",obj);
          !obj && await strapi.db.query('api::jioapps.jioapp').create({
            data: content
          });
  
          obj && await strapi.db.query('api::jioapps.jioapp').update({
            data: content,
            where: {
              uuid: content['uuid']
            }
          });
          
        })
  
      // const entry = await strapi.db.query('api::jioapps.jioapp').create({
      //   data: {
      //     uuid: 'jiopages',
      //     title: 'JioPages',
      //     description: 'Faster, safer and simply yours',
      //     logo: 'https://jep-asset.akamaized.net/jio/svg/logo/jiopages-n.svg'
      //   }
      // });
  
      ctx.body = 'ok';
  
      // console.log("entry:",entry)
    }catch(err) {
      console.log("error:", err)
      ctx.body = err;
    }
  }
  }));



