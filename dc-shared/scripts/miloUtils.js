import {setLibs} from "./utils.js";

const miloLibs = setLibs();
export const createTag = (async () => {
  const { createTag } = await import(`${miloLibs}/utils/utils.js`);
  return createTag;
})();
