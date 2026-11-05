/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * Type checks the consumers in this directory against the built package.
 *
 * The declarations of ical.js do not pass a check with skipLibCheck disabled.
 * Enabling it would also skip our own generated declarations, so only the
 * diagnostics of ical.js are ignored instead.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const directory = dirname(fileURLToPath(import.meta.url))
const host = {
	getCanonicalFileName: (fileName) => fileName,
	getCurrentDirectory: ts.sys.getCurrentDirectory,
	getNewLine: () => ts.sys.newLine,
}

let failed = false
for (const name of ['tsconfig.json', 'tsconfig.bundler.json']) {
	const config = ts.getParsedCommandLineOfConfigFile(resolve(directory, name), undefined, {
		...ts.sys,
		onUnRecoverableConfigFileDiagnostic(diagnostic) {
			throw new Error(ts.formatDiagnostic(diagnostic, host))
		},
	})
	const program = ts.createProgram(config.fileNames, config.options)
	const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)]
		.filter(({ file }) => !file?.fileName.includes('/node_modules/ical.js/'))

	console.log(`${name}: ${config.fileNames.length} consumers, ${diagnostics.length} errors`)
	if (diagnostics.length > 0) {
		failed = true
		console.error(ts.formatDiagnostics(diagnostics, host))
	}
}

process.exitCode = failed ? 1 : 0
