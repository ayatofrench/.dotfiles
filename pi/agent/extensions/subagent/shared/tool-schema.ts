import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import { MAX_FILE_REFERENCES } from "./input.ts";

/** Shared schema for lazy file references accepted by analytical and worker subagents. */
export const SubagentFileReferencesSchema = Type.Optional(
	Type.Array(
		Type.Object({
			path: Type.String({ description: "File path for the child to inspect lazily" }),
			relativeTo: Type.Optional(
				StringEnum(["child", "parent"] as const, {
					description:
						'Root for a relative path. "child" uses the subagent cwd (default); "parent" uses the parent session cwd. Absolute paths ignore this field.',
					default: "child",
				}),
			),
		}),
		{
			description:
				"Lazy file references. Contents are not embedded; the child reads only what it needs with bounded tools.",
			maxItems: MAX_FILE_REFERENCES,
		},
	),
);
