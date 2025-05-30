import { MolangCarrier } from "bc-minecraft-bedrock-project";
import { Types } from "bc-minecraft-bedrock-types";
import { Defined, DefinedUsing, Molang, MolangData, MolangDataSetKey, Using } from "bc-minecraft-molang";
import { DiagnosticsBuilder, DiagnosticSeverity } from '../../types';
import { Json } from '../json';
import { diagnoser_molang_syntax } from './syntax';

type MCarrier = Types.Identifiable & MolangCarrier<Molang.MolangSetOptional>;

/**Diagnoses the given molang sets, the using party checks upon the definer if they have setup properly
 * @param using The set of molang data that is being used
 * @param definer The set of molang data that is defined
 * @param diagnoser The diagnoser to report to*/
export function diagnose_molang_implementation(
  user: MCarrier,
  owner: MCarrier,
  ownerType: MolangDataSetKey,
  diagnoser: DiagnosticsBuilder
): void {
  const userId = user.id;
  const using = user.molang;
  const definer = owner.molang;
  const definerId = owner.id;

  //Is full set?
  if (Molang.MolangFullSet.isEither(using)) {
    //Upgrade if necessary and check
    const temp = Molang.MolangFullSet.upgrade(definer);

    diagnose_molang_using(userId, using.geometries, definerId, temp.geometries, diagnoser, "geometry");
    diagnose_molang_using(userId, using.materials, definerId, temp.materials, diagnoser, "material");
    diagnose_molang_using(userId, using.textures, definerId, temp.textures, diagnoser, "texture");
  }

  //Check variable vs variables and such
  diagnose_molang_variable_using(userId, using.variables, definerId, definer.variables, diagnoser, ownerType);
  diagnose_molang_temp_using(using.temps, definer.temps, diagnoser, ownerType);
}

/**Diagnoses the given molang sets, the using party checks upon the definer if they have setup properly
 * @param using The set of molang data that is being used
 * @param definer The set of molang data that is defined
 * @param diagnoser The diagnoser to report to*/
export function diagnose_molang(using: string, owner: MolangDataSetKey, diagnoser: DiagnosticsBuilder): void {
  diagnose_molang_query_using(using, diagnoser);
  diagnose_molang_math_using(using, diagnoser);
  diagnose_molang_context_using(using, diagnoser, owner);

  diagnose_molang_allowed(using, owner, diagnoser);

  try {
    const data = Json.parse(using);
    diagnoser_molang_syntax(data, diagnoser);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch(err) { /** NOOP */}
}

/**Diagnoses the given using set to the given defining set
 * @param using The set of molang data that is being used
 * @param definer The set of molang data that is defined
 * @param diagnoser The diagnoser to report to
 * @param name The name of the data set such as `variable` or `query`*/
function diagnose_molang_using(
  userId: string,
  using: DefinedUsing<string>,
  definerId: string,
  definer: Defined<string>,
  diagnoser: DiagnosticsBuilder,
  name: string
): void {
  const checks = using.using;
  const defined1 = definer.defined;
  const defined2 = using.defined;

  for (let I = 0; I < checks.length; I++) {
    const check = checks[I];

    if (defined1.includes(check) || defined2.includes(check)) {
      //Valid
      continue;
    } else {
      diagnoser.add(
        userId,
        `The following molang is not defined: '${name}.${check}' by '${definerId}'\n\tThe definition is used by: '${userId}'`,
        DiagnosticSeverity.error,
        `molang.${name}.missing`
      );
    }
  }
}

function diagnose_molang_allowed(using: string, owner: MolangDataSetKey, diagnoser: DiagnosticsBuilder): void {
  if (!(owner === "Animations" || owner === "AnimationsControllers")) return;

  const set = Molang.MolangFullSet.harvest(using);

  if (has_any(set.textures))
    diagnoser.add(
      "textures.",
      "Animation / Animation controllers do not have access to textures",
      DiagnosticSeverity.warning,
      "molang.textures.invalid"
    );
  if (has_any(set.materials))
    diagnoser.add(
      "material.",
      "Animation / Animation controllers do not have access to materials",
      DiagnosticSeverity.warning,
      "molang.material.invalid"
    );
  if (has_any(set.geometries))
    diagnoser.add(
      "geometry.",
      "Animation / Animation controllers do not have access to geometries",
      DiagnosticSeverity.warning,
      "molang.geometry.invalid"
    );
}

function has_any(data: Using<string> | Defined<string>): boolean {
  if (Using.is(data) && data.using.length > 0) return true;
  if (Defined.is(data) && data.defined.length > 0) return true;

  return false;
}

function diagnose_molang_variable_using(
  userId: string,
  using: DefinedUsing<string>,
  definerId: string,
  definer: Defined<string>,
  diagnoser: DiagnosticsBuilder,
  owner: MolangDataSetKey
) {
  const checks = using.using;
  const defined1 = definer.defined;
  const defined2 = using.defined;

  for (let I = 0; I < checks.length; I++) {
    const check = checks[I];

    //Check if the variable is defined
    if (defined1.includes(check) || defined2.includes(check)) continue;

    //Vanilla provides?
    if (InternalIdentifiable.has(MolangData.get(owner)?.Variables ?? [], check)) continue;

    diagnoser.add(
      userId,
      `The molang variable 'variable.${check}' is not defined, which should be defined in this '${definerId}'\n\tThe variable is used through: '${userId}'`,
      DiagnosticSeverity.error,
      `molang.variable.missing`
    );
  }
}

function diagnose_molang_temp_using(
  using: DefinedUsing<string>,
  definer: Defined<string>,
  diagnoser: DiagnosticsBuilder,
  owner: MolangDataSetKey
) {
  const checks = using.using;
  const defined1 = definer.defined;
  const defined2 = using.defined;

  for (let I = 0; I < checks.length; I++) {
    const check = checks[I];

    //Check if the temp is defined
    if (defined1.includes(check) || defined2.includes(check)) continue;

    //Vanilla provides?
    if (InternalIdentifiable.has(MolangData.get(owner)?.Temps ?? [], check)) continue;

    diagnoser.add(
      "temp." + check,
      `The following molang temp definition is not defined: 'temp.${check}'`,
      DiagnosticSeverity.error,
      `molang.temp.missing`
    );
  }
}

function diagnose_molang_context_using(
  using: Using<string> | string,
  diagnoser: DiagnosticsBuilder,
  owner: MolangDataSetKey
) {
  if (typeof using === "string") {
    const out = Using.create<string>();
    Molang.Types.Context.getUsing(using, out.using);
    using = out;
  }

  const checks = using.using;

  for (let I = 0; I < checks.length; I++) {
    const check = checks[I];

    //Vanilla provides?
    if (InternalIdentifiable.has(MolangData.get(owner)?.Contexts ?? [], check)) continue;

    diagnoser.add(
      "context." + check,
      `The following molang context definition is not defined: 'context.${check}'`,
      DiagnosticSeverity.error,
      `molang.context.missing`
    );
  }
}

/**
 *
 * @param using
 * @param diagnoser
 * @param owner
 */
export function diagnose_molang_query_using(using: Using<string> | string, diagnoser: DiagnosticsBuilder) {
  if (typeof using === "string") {
    const out = Using.create<string>();
    Molang.Types.Queries.getUsing(using, out.using);
    using = out;
  }

  const checks = using.using;

  for (let I = 0; I < checks.length; I++) {
    const check = checks[I];

    //Vanilla provides?
    const query = MolangData.General.getQuery(check);
    if (query) {
      if (typeof query.deprecated === "string") {
        diagnoser.add(
          "query." + check,
          `Molang query: 'query.${check}' has been deprecated, use: '${query.deprecated}'`,
          DiagnosticSeverity.error,
          "molang.query.deprecated"
        );
      }

      continue;
    }

    diagnoser.add(
      "query." + check,
      `Unknown molang query function: ${check}`,
      DiagnosticSeverity.error,
      `molang.query.unknown`
    );
  }
}

/**
 *
 * @param using
 * @param diagnoser
 * @param owner
 */
export function diagnose_molang_math_using(using: Using<string> | string, diagnoser: DiagnosticsBuilder) {
  if (typeof using === "string") {
    const out = Using.create<string>();
    Molang.Types.Math.getUsing(using, out.using);

    using = out;
  }

  const checks = using.using;

  for (let I = 0; I < checks.length; I++) {
    //Too many use the CamelCase version of math >.>
    const check = checks[I].toLowerCase();

    //Vanilla provides?
    if (InternalIdentifiable.has(MolangData.General.Math, check)) continue;

    diagnoser.add(
      "math." + check,
      `Unknown molang math function: ${check}`,
      DiagnosticSeverity.error,
      `molang.math.unknown`
    );
  }
}

namespace InternalIdentifiable {
  export function has(data: Types.Identifiable[], id: string): boolean {
    for (let I = 0; I < data.length; I++) {
      if (data[I].id.startsWith(id)) return true;
    }

    return false;
  }
}
