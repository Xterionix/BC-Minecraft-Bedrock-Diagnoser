import { TextDocument } from "bc-minecraft-bedrock-project/lib/src/Lib/Types/TextDocument";
import { expect } from "chai";
import { ResourcePack } from "../../../../src/Lib/Diagnostics/ResourcePack/ResourcePack";
import { TestDiagnoser } from "../../../diagnoser";

describe("ResourcePack", () => {
  describe("Animation", () => {
    it("returns errors for the times outside of the animation_length", () => {

      // One time is outside of the animation_length
      // One time is inside of the animation_length

      const doc: TextDocument = {
        uri: "c:\\test-rp\\animations\\test.animation.json",
        getText: () => `{
          "format_version": "1.8.0",
          "animations": {
            "animation.agent.shrug": {
              "animation_length": 1.25,
              "bones": {
                "head": {
                  "rotation": {
                    "0.3333": [ 0, 0, 0 ],
                    "1.5": [ 0, 0, 0 ]
                  }
                }
              }
            }
          }
        }`,
      };

      const diagnoser = TestDiagnoser.createDocument(undefined, doc);

      try {
        const value = ResourcePack.Process(diagnoser);
      } catch (err: any) {
        if (typeof err.message !== "undefined") expect.fail("Expect no errors: " + err.message);
      }

      diagnoser.expectAmount(2);
      const item = diagnoser.getSeverity(3);

      expect(item).to.not.undefined;
      if (item === undefined) return;

      expect(item.message).to.equal("Time value of bone 1.5 is greater than the animation length: 1.25");
      expect(item.position).to.equal("animation.agent.shrug/head/1.5");
    });
  });
});
