import React from "react";
import cinta from "../assets/cinta.png";

function LandPage() {
  return (
    <>
      <main className="m-auto pt-14">
        <h1 className="text-4xl text-black font-extrabold  ">
          Hi, I'm Cinta Your AI assistant{" "}
        </h1>
        {/* this is my image div  */}
        <div className="text-center place-items-center ">
          <img src={cinta} alt="" className="w-100" />
        </div>
        <div className="flex text-red-600 justify-center" style={{textShadow:"1px 1px 1px black"}}>
          <p className="ml-5">Translation</p>
          <p className="ml-5">Summarize</p>
          <p className="ml-5">Language Detector</p>
        </div>
        <button className="bg-black  text-[#acdcbd] p-4 rounded-4xl mt-10">
          Get Started
        </button>
      </main>
    </>
  );
}
export default LandPage;
