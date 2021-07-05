import React, { useEffect, useState } from "react";
import injectSheet from "react-jss";
import { Slider, Row, Alert } from "antd";
import { useAutoFind } from "./autoFindProvider/AutoFindProvider";

import "./slider.less";
import Layout, { Content, Footer } from "antd/lib/layout/layout";
import { styles } from "./styles";

let sliderTimer;
const AutoFind = ({ classes }) => {
  const [perceptionOutput, setPerceptionOutput] = useState(0.5);
  const [backendVer, setBackendVer] = useState("");
  const [
    {
      status,
      predictedElements,
      pageElements,
      allowIdetifyElements,
      allowRemoveElements,
      perception,
      unreachableNodes,
    },
    {
      identifyElements,
      removeHighlighs,
      generateAndDownload,
      onChangePerception,
      getScreenAndJson
    },
  ] = useAutoFind();

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetch("http:localhost:5000/build", {
        method: "GET",
      });
      const r = await result.json();
      setBackendVer(r);
    };

    fetchData();
  }, []);

  const handleGetElements = () => {
    identifyElements();
  };

  const handleRemove = () => {
    removeHighlighs();
  };

  const handleGenerate = () => {
    generateAndDownload(perception);
  };

  const handlePerceptionChange = (value) => {
    setPerceptionOutput(value);
    if (sliderTimer) clearTimeout(sliderTimer);
    sliderTimer = setTimeout(() => {
      onChangePerception(value);
    }, 300);
  };

  const getAvailableElements = () => {
    return allowRemoveElements
      ? (predictedElements || []).filter(
          (e) => e.predicted_probability >= perception && !e.skipGeneration && !e.hidden
        ).length
      : 0;
  };

  const getPredictedElements = () => {
    return predictedElements && allowRemoveElements
      ? predictedElements.length
      : 0;
  };

  const reportProblem = () => {
    getScreenAndJson();
  };

  return (
    <Layout>
      <Content className={classes.content}>
        <Row>
          <button disabled={!allowIdetifyElements} onClick={handleGetElements}>
            Idetify
          </button>
          <button disabled={!allowRemoveElements} onClick={handleRemove}>
            Remove
          </button>
          <button disabled={!allowRemoveElements} onClick={handleGenerate}>
            Generate And Download
          </button>
        </Row>
        <label>Perception treshold: {perception}</label>
        <Row>
          <label>0.0</label>
          <Slider
            style={{ width: "80%" }}
            min={0.0}
            max={1}
            step={0.01}
            onChange={handlePerceptionChange}
            value={perceptionOutput}
          />
          <label>1</label>
        </Row>
        <div>{status}</div>
        <div>{pageElements || 0} found on page.</div>
        <div>{getPredictedElements()} predicted.</div>
        <div>
          {getAvailableElements() -
            (unreachableNodes ? unreachableNodes.length : 0)}{" "}
          available for generation.
        </div>
        {unreachableNodes && unreachableNodes.length ? (
          <Alert
            type="warning"
            showIcon
            description={`${unreachableNodes.length} controls are unreachable due to DOM updates.`}
          />
        ) : null}
      </Content>
      <Footer className={classes.footer}>
        <div>
          <a 
            hidden={!allowRemoveElements} 
            onClick={reportProblem} 
            href="mailto:Vyacheslav_Fuga@epam.com?cc=Darya_Gurtovenko@epam.com&subject=Some%20elements%20were%20not%20identified%20on%20page%3A&body=Hi%2C%0D%0ASome%20elements%20were%20not%20identified%20on%20the%20page%2C%20please%20have%20a%20look.">
              Report Problem
          </a>
        </div>
        backend ver. {backendVer}
      </Footer>
    </Layout>
  );
};

const AutoFindWrapper = injectSheet(styles)(AutoFind);
export default AutoFindWrapper;
