import { Internal, TextDocument } from "bc-minecraft-bedrock-project";
import { DiagnosticsBuilder } from "../../../Types/DiagnosticsBuilder/DiagnosticsBuilder";
import { Json } from "../../Json/Json";
import { animation_controller_diagnose_implementation } from "../Animation Controllers/diagnostics";
import { animation_or_controller_diagnose_implementation } from "../anim or controller";
import { MolangFullSet } from "bc-minecraft-molang";
import { Types } from "bc-minecraft-bedrock-types";
import { diagnose_molang, diagnose_molang_math_using } from '../../Molang/diagnostics';

/**Diagnoses the given document as an RP entity
 * @param doc The text document to diagnose
 * @param diagnoser The diagnoser builder to receive the errors*/
export function Diagnose(doc: TextDocument, diagnoser: DiagnosticsBuilder): void {
  //No behaviorpack check, entities can exist without their bp side (for servers)

  //Check molang math functions
  diagnose_molang(doc.getText(), "entity", diagnoser);

  const entity = Json.LoadReport<Internal.ResourcePack.Entity>(doc, diagnoser);
  if (!Internal.ResourcePack.Entity.is(entity)) return;

  const container = entity["minecraft:client_entity"].description;
  const MolangData = MolangFullSet.harvest(doc.getText());

  //Check animations / animation controllers
  Types.Definition.forEach(container.animations, (reference, id) => animation_or_controller_diagnose_implementation(id, MolangData, "entity", diagnoser));

  //Check animation controllers
  container.animation_controllers?.forEach((controller) => {
    const temp = flatten(controller);
    if (temp) animation_controller_diagnose_implementation(temp, MolangData, "entity", diagnoser);
  });

  //TODO check Geo
  //TODO check textures
  //TODO check sounds
  //TODO check particles
}

function flatten(data: string | Types.Definition): string | undefined {
  if (typeof data === "string") return data;

  const key = Object.getOwnPropertyNames(data)[0];

  if (key) return data[key];

  return undefined;
}
