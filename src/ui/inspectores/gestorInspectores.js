// ============================================================================
//  Registro de inspectores (solo navegador — tocan el DOM)
//  Asocia cada algoritmo del registro con su factoría de inspector.
// ============================================================================

import { registrarInspector } from "../../nucleo/registroAlgoritmos.js";
import { ALGORITMOS } from "../../nucleo/constantes.js";
import { InspectorDQN } from "./inspectorDQN.js";
import { InspectorPPO } from "./inspectorPPO.js";
import { InspectorSAC } from "./inspectorSAC.js";
import { InspectorWorldModel } from "./inspectorWorldModel.js";

export function registrarInspectores() {
  registrarInspector(ALGORITMOS.DQN, (c) => new InspectorDQN(c));
  registrarInspector(ALGORITMOS.PPO, (c) => new InspectorPPO(c));
  registrarInspector(ALGORITMOS.SAC, (c) => new InspectorSAC(c));
  registrarInspector(ALGORITMOS.WORLD_MODEL, (c) => new InspectorWorldModel(c));
}
