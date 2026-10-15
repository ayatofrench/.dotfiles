import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { findSgCliPathSync } from "./ast-grep/binary-path.js";
import { ast_grep_replace, ast_grep_search } from "./ast-grep/tools.js";

/**
 * pi ast-grep extension — AST-aware code search and replace for the pi coding agent.
 *
 * Resolves an existing `sg` binary from @ast-grep/cli, platform npm packages,
 * PATH, or Homebrew.
 */
export default function (pi: ExtensionAPI): void {
	pi.registerTool(ast_grep_search);
	pi.registerTool(ast_grep_replace);

	pi.registerCommand("ast-grep", {
		description: "Show ast-grep binary path and installation guidance",
		handler: async (_args, ctx) => {
			const localPath = findSgCliPathSync();
			const lines = [
				"pi-ast-grep",
				`  Local sg  : ${localPath ?? "not found"}`,
				"",
				"Install options:",
				"  npm install -g @ast-grep/cli",
				"  cargo install ast-grep --locked",
				"  brew install ast-grep",
			].join("\n");
			ctx.ui.notify(lines, localPath ? "info" : "warning");
		},
	});
}
