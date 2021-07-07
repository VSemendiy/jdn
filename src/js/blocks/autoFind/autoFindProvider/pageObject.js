import { camelCase } from "../../../models/GenerateBlockModel";
import { defaultClass, getJDILabel } from "./generationClassesMap";
import { connector } from "./connector";

const getPackage = (url) => {
  const urlObject = new URL(url);
  return urlObject.hostname
      .split(".")
      .reverse()
      .map((e) => e.replace(/[^a-zA-Z0-9]+/g, ""))
      .join(".");
};

export const getJdiClassName = (label) => {
  let jdiClass = getJDILabel(label);
  if (jdiClass === defaultClass) jdiClass += ` (${label})`;
  return jdiClass ? jdiClass : label;
};

export const predictedToConvert = (elements, perception) => {
  const f = elements.filter((el) => el && !el.skipGeneration && !el.hidden && el.predicted_probability >= perception);
  const uniqueNames = [];

  const getElementName = (element) => {
    const jdiLabel = getJDILabel(element.predicted_label).toLowerCase();
    return element.tagName === 'a' || jdiLabel === element.tagName.toLowerCase() ?
      jdiLabel :
      jdiLabel + element.tagName[0].toUpperCase() + element.tagName.slice(1);
  };

  return f.map((e, i) => {
    let elementName = getElementName(e);
    let elementTagId = e.predictedAttrId;

    if (uniqueNames.indexOf(elementName) > 0) elementName += i;
    if (elementTagId && uniqueNames.indexOf(elementTagId) > 0) elementTagId += i;
    uniqueNames.push(elementTagId, elementName);

    return {
      ...e,
      Locator: e.attrId ? `#${e.attrId}` : e.xpath,
      Name: elementTagId ? elementTagId : elementName,
      Type: getJDILabel(e.predicted_label),
      parent: null,
      parentId: null,
      elId: e.element_id,
    };
  });
};

export const getPage = (elToConvert, callback) => {
  callback({
    elements: elToConvert,
    name: camelCase(connector.tab.title),
    package: getPackage(connector.tab.url),
  });
};
