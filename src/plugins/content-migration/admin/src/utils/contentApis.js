import { request } from "@strapi/helper-plugin";
import { filter } from 'lodash';
import pluginId from "../pluginId";
import { default as axiosInstance} from "./axiosInstance";

export const getModels = () => {
  return request("/content-type-builder/content-types", {
    method: "GET",
  }).then((response) => {
    return filter(response.data, (model) => !model.plugin)
  }).catch(() => {
    return [];
  });
};

export const setup = ({modelId, targetEnv}) => {
  return axiosInstance.post(`/${pluginId}`,{ modelId, targetEnv})
}
