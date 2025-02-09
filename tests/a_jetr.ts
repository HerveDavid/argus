// import { useState } from "react";
// import { resolveResource } from "@tauri-apps/api/path";
// import { Command } from '@tauri-apps/plugin-shell';
// import '@carbon/web-components/es/components/button/index.js';
// import "./styles/main.scss";

// function App() {
//   const [message, setMessage] = useState("")

//   async function callJavaSidecar() {
//     try {
//       const resourcePath: string = await resolveResource("resources/");
//       console.log(resourcePath);
      
//       const command = Command.sidecar("binaries/powsybl", [resourcePath]);
//       await command.execute().then(({ stdout }) => {
//         setMessage(stdout)
//       })
//     } catch (error) {
//       console.error(error)
//     }
//   }

//   return (
//     <div className="container">
//     <h1>Tauri + Java Sidecar</h1>
//     <cds-button onClick={callJavaSidecar}>
//       Appeler le sidecar Java
//     </cds-button>
//     <p>{message}</p>
//   </div>
//   );
// }

// export default App;
