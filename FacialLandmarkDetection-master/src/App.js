// 1. Install dependencies DONE
// 2. Import dependencies DONE
// 3. Setup webcam and canvas DONE
// 4. Define references to those DONE
// 5. Load posenet DONE
// 6. Detect function DONE
// 7. Drawing utilities from tensorflow DONE
// 8. Draw functions DONE

// Face Mesh - https://github.com/tensorflow/tfjs-models/tree/master/facemesh

import React, { useRef, useEffect } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
// OLD MODEL
//import * as facemesh from "@tensorflow-models/facemesh";

// NEW MODEL
import * as facemesh from "@tensorflow-models/face-landmarks-detection";
import Webcam from "react-webcam";
import { drawMesh } from "./utilities";

let closeEyeCnt = 0;

const alarm = (data) => {
  console.log(data);

  const leftEyeTop = data.leftEyeLower0[0][1]; // 위 왼쪽눈커플 y좌표
  const leftEyeBottom = data.leftEyeUpper0[0][1]; // 아래 왼쪽눈커플 y좌표

  const rightEyeTop = data.rightEyeLower0[0][1]; // 위 오른눈커플 y좌표
  const rightEyeBottom = data.rightEyeUpper0[0][1]; // 아래 오른눈커플 y좌표


  // 눈감은지 안감은지 체크
  const leftEyeDiff = leftEyeTop - leftEyeBottom;
  const rightEyeDiff = rightEyeTop - rightEyeBottom;

  // console.log(`왼쪽 눈 차이 : ${leftEyeDiff}`);
  // console.log(`오르쪽 눈 차이 : ${rightEyeDiff}`)

  // 눈감은걸로 조는지 체크
  if(leftEyeDiff < 0.3 && rightEyeDiff < 0.3){
    ++closeEyeCnt;
    if(closeEyeCnt >= 5)
      alert("조는중")
  }else{
    closeEyeCnt = 0;
  }
  closeEyeCnt > 0 && console.log(`${closeEyeCnt}초동안 눈감음`);

  // 좌우 방향 체크
  const lookingLeftDirection = data.rightEyeLower0[0][2];
  const lookingRightDirection = data.leftEyeLower0[0][2];

  if(lookingLeftDirection < -1){
    console.log("왼쪾보는중");
  }
  if(lookingRightDirection < -1){
    console.log("오른쪽보는중")
  }

  //상하 방향 체크
  const lookingUpDownDirection = data.midwayBetweenEyes[0][2];
  if(lookingUpDownDirection > 10){
    console.log('위쪽 보는중')
  }
  if(lookingUpDownDirection < -15){
    console.log('아래쪽 보는중')
  }
}

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  //  Load posenet
  const runFacemesh = async () => {
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);
    setInterval(() => {
      detect(net);
    }, 1000);
  };

  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      // OLD MODEL
      //       const face = await net.estimateFaces(video);
      // NEW MODEL
      const face = await net.estimateFaces({input:video});
      
      // try-catch 예외처리 - 얼굴최초인식되고 도중에 인식안될때
      // 프로그램 비정상 종료되는 에러있었음.
      try{
        alarm(face[0].annotations);
      }catch(err){
        console.log("얼굴 인식안됩니다.")
      }
      
      console.log('---------')

      // Get canvas context
      const ctx = canvasRef.current.getContext("2d");
      requestAnimationFrame(()=>{drawMesh(face, ctx)});
    }
  };

  useEffect(()=>{runFacemesh()}, []);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

export default App;
