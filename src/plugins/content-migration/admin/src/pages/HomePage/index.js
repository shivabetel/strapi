/*
 *
 * HomePage
 *
 */

import { Alert } from '@strapi/design-system/Alert';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Flex } from '@strapi/design-system/Flex';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Option, Select } from '@strapi/design-system/Select';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';
import React, { memo, useEffect, useState } from 'react';
import { getModels, setup } from '../../utils/contentApis';





const HomePage = () => {
  const {STRAPI_ADMIN_CONTENT_MIGRATION_TARGET_ENV = 'dev'} = process.env
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState()
  const [showNotification, setShowNotification] = useState(false)
  const [ error, setError ] = useState(false)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    async function loadContentTypes() {
      const models = await getModels();
      console.log("models:", models)
      setModels(models);
    }
    loadContentTypes();
  }, []);


  const handleSubmit = async (e) => {
    try {
    
      setLoading(true);
       await setup({modelId: selectedModel, targetEnv: STRAPI_ADMIN_CONTENT_MIGRATION_TARGET_ENV})
      setShowNotification(true);
      setLoading(false);
      setError(false);
      setSelectedModel("")
    } catch (err) {
      setLoading(false)
      setShowNotification(true);
      setError(true)
    }

  }

  return (
    <>
      {showNotification && <Alert closeLabel="Close alert" variant={error ? 'danger': 'success'} onClose={() => setShowNotification(false)}>{error ? 'Something went wrong while migrating the content' : 'Content migrated successfully'}</Alert>}
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center' }}>

        <Box>
          <Stack>
            <Box paddingTop={2} paddingLeft={4}>
              <Typography variant="alpha">Content-Migration</Typography>
            </Box>
            <Box paddingTop={10}>
              <Grid gap={5} gridCols={2}>
                <GridItem col={1}>
                  <Typography variant="beta">Target environment:</Typography>
                </GridItem>
                <GridItem col={1}>
                  <Typography variant="beta">{STRAPI_ADMIN_CONTENT_MIGRATION_TARGET_ENV.toUpperCase()}</Typography>
                </GridItem>

              </Grid>

            </Box>
            <Box paddingTop={5}>
              <Grid gap={5} gridCols={2}>
                <GridItem col={1}>
                  <Typography variant="beta">Content-Type:</Typography>
                </GridItem>
                <GridItem col={1}>
                  <Select value={selectedModel} onChange={value => (setSelectedModel(value), setShowNotification(false))}>
                    {
                      models.map((model) => (<Option key={model.uid} value={model.uid}>{model.apiID}</Option>))
                    }
                  </Select>
                </GridItem>

              </Grid>

            </Box>
            <Box paddingTop={5}>
              <Flex justifyContent="center">
                <Grid gap={5} gridCols={1}>
                  <GridItem col={1}>
                    <Button variant='default' size="L" onClick={e => handleSubmit(e)} loading={loading}>Submit</Button>
                  </GridItem>


                </Grid>
              </Flex>
            </Box>

          </Stack>
        </Box>



      </div>
    </>

  )
};

export default memo(HomePage);
