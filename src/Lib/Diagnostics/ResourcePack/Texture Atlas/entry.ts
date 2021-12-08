import { TextDocument, Map } from "bc-minecraft-bedrock-project";
import { MinecraftData } from "bc-minecraft-bedrock-vanilla-data";
import path = require("path/posix");
import { DiagnosticsBuilder } from "../../../Types/DiagnosticsBuilder/DiagnosticsBuilder";
import { DiagnosticSeverity } from "../../../Types/DiagnosticsBuilder/Severity";
import { education_enabled } from "../../Definitions";
import { Json } from "../../Json/Json";

/**Diagnoses the given document as a texture atlas
 * @param doc The text document to diagnose
 * @param diagnoser The diagnoser builder to receive the errors*/
export function DiagnoseAtlas(doc: TextDocument, diagnoser: DiagnosticsBuilder): void {
  const defintions = Json.LoadReport<TextureAtlas>(doc, diagnoser);
  if (!TextureAtlas.is(defintions)) return;

  //Get pack for files search
  const pack = diagnoser.context.getCache().ResourcePacks.get(doc.uri);
  if (pack === undefined) return;

  const texture_data = defintions.texture_data;
  const texture_files = diagnoser.context
    .getFiles(pack.folder, ["**/textures/**/*.{tga,png,jpg,jpeg}"], pack.context.ignores)
    .map((item) => item.replace(/\\/gi, "/"));

  //Check if files exists
  const check_file_spec: (texture_id: string, item: DetailedTextureSpec) => void = (texture_id, item) => {
    if (typeof item.path === "string") {
      texture_files_diagnose(texture_id, item.path, texture_files, diagnoser);
    }

    if (item.variations) {
      item.variations.forEach((subitem) => {
        if (typeof subitem.path === "string") {
          texture_files_diagnose(texture_id, subitem.path, texture_files, diagnoser);
        }
      });
    }
  };

  const check_file_string: (texture_id: string, item: string) => void = (texture_id, item) => {
    texture_files_diagnose(texture_id, item, texture_files, diagnoser);
  };

  Map.forEach(texture_data, (data, texture_id) => {
    //If texture
    if (typeof data.textures === "string") {
      check_file_string(texture_id, data.textures);
      //If array of items
    } else if (Array.isArray(data.textures)) {
      data.textures.forEach((texture) => {
        if (typeof texture === "string") {
          texture_files_diagnose(texture_id, texture, texture_files, diagnoser);
        }
        else {
          check_file_spec(texture_id, texture);
        }
      });
    } else {
      check_file_spec(texture_id, data.textures);
    }
  });
}

/**Diagnoses the given document as a texture flipbook file
 * @param doc The text document to diagnose
 * @param diagnoser The diagnoser builder to receive the errors*/
export function DiagnoseFlipbook(doc: TextDocument, diagnoser: DiagnosticsBuilder): void {
  //TODO add rp diagnostics
}

export function texture_files_diagnose(owner: string, file: string, files: string[], diagnoser: DiagnosticsBuilder): void {
  for (let I = 0; I < files.length; I++) {
    if (files[I].includes(file)) {
      //Found then return
      return;
    }
  }

  if (MinecraftData.ResourcePack.hasTexture(file, education_enabled(diagnoser))) return;

  diagnoser.Add(`${owner}/${file}`, `Cannot find file: ${file}`, DiagnosticSeverity.error, "resourcepack.texture.missing");
}

interface TextureAtlas {
  resource_pack_name?: string;
  texture_name?: string;
  texture_data: Map<TextureSpec>;
}

namespace TextureAtlas {
  export function is(value: any): value is TextureAtlas {
    if (typeof value === "object" && typeof value.texture_data === "object") return true;

    return false;
  }
}

interface DetailedTextureSpec {
  variations?: { path?: string }[];
  path?: string;
}

type TexturePath = DetailedTextureSpec | string;

interface TextureSpec {
  textures: TexturePath | TexturePath[];
}
