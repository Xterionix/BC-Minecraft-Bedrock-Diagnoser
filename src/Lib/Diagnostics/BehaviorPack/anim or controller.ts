import { Map } from "bc-minecraft-bedrock-project";
import { AnimationCarrier, MolangCarrier } from "bc-minecraft-bedrock-project/lib/src/Lib/Types/Carrier/Carrier";
import { Types } from "bc-minecraft-bedrock-types";
import { DefinedUsing, Molang } from "bc-minecraft-molang";
import { DiagnosticsBuilder } from "../../Types/DiagnosticsBuilder/DiagnosticsBuilder";
import { DiagnosticSeverity } from "../../Types/DiagnosticsBuilder/Severity";
import { OwnerType } from "../Molang/diagnostics";
import { animation_controller_diagnose_implementation } from "./Animation Controllers/diagnostics";
import { animation_diagnose_implementation } from "./Animation/diagnostics";


export function animation_or_controller_diagnose_implementation(
  id: string,
  user: Types.Identifiable & MolangCarrier<Molang.MolangSet | Molang.MolangFullSet> & AnimationCarrier<DefinedUsing<string>> & { events?: Map<any> },
  ownerType: OwnerType,
  diagnoser: DiagnosticsBuilder
): void {
  switch (is_animation_or_controller(id, diagnoser)) {
    case anim_or_contr.animation:
      return animation_diagnose_implementation(id, user, ownerType, diagnoser);

    case anim_or_contr.controller:
      return animation_controller_diagnose_implementation(id, user, ownerType, diagnoser);

    case anim_or_contr.neither:
      diagnoser.Add(id, `Cannot find animation / animation controller: ${id}`, DiagnosticSeverity.error, "behaviorpack.anim_or_controller.missing");
  }
}

export enum anim_or_contr {
  animation,
  controller,
  neither,
}

/**
 *
 * @param id
 * @param diagnoser
 * @returns True if animation, false if controller
 */
export function is_animation_or_controller(id: string, diagnoser: DiagnosticsBuilder): anim_or_contr {
  const cache = diagnoser.context.getCache();

  if (cache.BehaviorPacks.animations.has(id)) return anim_or_contr.animation;
  if (cache.BehaviorPacks.animation_controllers.has(id)) return anim_or_contr.controller;

  return anim_or_contr.neither;
}
