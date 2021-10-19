import { types as t } from '@babel/core';

interface Response {
	defaultImport: string;
	namedImport: string;
	namedImports: string[];
}

interface UpsertOptions {
	checkForDefault?: string;
	checkForNamed?: string;
}

export function upsertImport(imp: t.ImportDeclaration, options: UpsertOptions = {}): Response {
	const { checkForDefault, checkForNamed } = options;
	const response: Response = {
		defaultImport: '',
		namedImport: '',
		namedImports: [],
	};
	let hasDefault = false;
	let hasNamed = false;

	response.namedImports = imp.specifiers
		.filter((spec) => {
			if (t.isImportDefaultSpecifier(spec) || t.isImportNamespaceSpecifier(spec)) {
				response.defaultImport = spec.local.name;
				hasDefault = true;

				return false;
			}

			return true;
		})
		.map((spec) => {
			const { name } = spec.local;

			if (name === checkForNamed) {
				response.namedImport = name;
				hasNamed = true;
			}

			return name;
		});

	// Add default import if it doesn't exist
	if (checkForDefault && !hasDefault) {
		imp.specifiers.unshift(t.importDefaultSpecifier(t.identifier(checkForDefault)));
		response.defaultImport = checkForDefault;
	}

	// Add named import if it doesn't exist
	if (checkForNamed && !hasNamed) {
		imp.specifiers.push(
			t.importSpecifier(t.identifier(checkForNamed), t.identifier(checkForNamed)),
		);
		response.namedImport = checkForNamed;
	}

	return response;
}
